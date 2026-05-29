import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { prompt } = await request.json();

    // 1. Gather Context Data for the AI
    const [stats, lowGrades, financeSummary] = await Promise.all([
      // Basic Stats
      prisma.$transaction([
        prisma.student.count({ where: { tenantId: session.tenantId, isActive: true } }),
        prisma.employee.count({ where: { tenantId: session.tenantId, isActive: true } }),
        prisma.invoice.count({ where: { tenantId: session.tenantId, status: 'UNPAID' } }),
      ]),
      // Potential at-risk students (Grade < 10)
      prisma.grade.findMany({
        where: { score: { lt: 10 } },
        take: 5,
        include: { student: true, subject: true },
        orderBy: { score: 'asc' }
      }),
      // Financial health
      prisma.invoice.groupBy({
        by: ['status'],
        where: { tenantId: session.tenantId },
        _sum: { amount: true }
      })
    ]);

    const context = {
      activeStudents: stats[0],
      activeStaff: stats[1],
      unpaidInvoices: stats[2],
      atRiskStudents: lowGrades.map(g => `${g.student.firstName} ${g.student.lastName} (${g.subject.name}: ${g.score}/20)`),
      revenue: financeSummary.map(f => ({ status: f.status, total: f._sum.amount }))
    };

    let aiResponse = "";
    
    // Check if GEMINI_API_KEY is available
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const systemPrompt = `
Tu es l'assistant IA de la plateforme SchoolERP Pro. Ton rôle est d'aider les administrateurs et gestionnaires de l'établissement de manière claire, concise, professionnelle et chaleureuse. 

Voici les données réelles en temps réel de l'établissement :
- Nombre d'élèves actifs : ${context.activeStudents}
- Nombre d'employés actifs : ${context.activeStaff}
- Nombre de factures impayées : ${context.unpaidInvoices}
- Élèves en difficulté académique (note < 10/20) : ${context.atRiskStudents.length > 0 ? context.atRiskStudents.join(', ') : 'Aucun élève en difficulté détecté'}
- Ventilation des revenus scolaires (en FCFA/XOF) : ${JSON.stringify(context.revenue)}

Consignes importantes :
1. Réponds en français. Sois très direct et simple à lire.
2. Utilise le franc CFA (XOF) pour parler d'argent.
3. Propose des solutions simples et concrètes. Par exemple :
   - Si l'utilisateur pose une question sur les élèves en difficulté, liste-les brièvement et propose d'organiser des cours de soutien.
   - S'il pose une question sur les finances ou les impayés, propose d'envoyer un rappel par SMS aux parents ou de proposer des échelonnements de paiement.
4. Reste bref. Évite le jargon complexe. L'interface de chat est compacte, donc ta réponse doit faire maximum 3 ou 4 paragraphes courts.
5. Si la question de l'utilisateur n'a aucun lien avec la gestion d'une école ou les données fournies, réponds poliment que tu es conçu pour assister dans la gestion scolaire.

Question de l'utilisateur : "${prompt}"
`;
        const result = await model.generateContent(systemPrompt);
        aiResponse = result.response.text();
      } catch (geminiError: any) {
        console.error('Gemini API call failed, falling back to rule-based simulation:', geminiError);
      }
    }

    // Fallback if Gemini key is missing or failed
    if (!aiResponse) {
      const lowerPrompt = prompt.toLowerCase();
      if (lowerPrompt.includes("risque") || lowerPrompt.includes("alerte") || lowerPrompt.includes("échec")) {
        aiResponse = `Analyse de performance : J'ai identifié ${lowGrades.length} élèves en difficulté ce trimestre. Notamment ${context.atRiskStudents.join(', ')}. Je suggère d'organiser des séances de tutorat pour ces matières.`;
      } else if (lowerPrompt.includes("argent") || lowerPrompt.includes("finance") || lowerPrompt.includes("paye")) {
        const unpaid = context.revenue.find(r => r.status === 'UNPAID')?.total || 0;
        aiResponse = `Santé financière : Vous avez actuellement ${unpaid.toLocaleString()} FCFA de factures impayées. Le taux de recouvrement est stable, mais ${context.unpaidInvoices} parents n'ont pas encore régularisé leur situation.`;
      } else {
        aiResponse = `Bonjour ! Je suis votre assistant IA SchoolERP. Votre établissement compte ${context.activeStudents} élèves et ${context.activeStaff} employés. Tout semble opérationnel. Comment puis-je vous aider dans votre gestion aujourd'hui ?`;
      }
    }

    return NextResponse.json({ 
      answer: aiResponse,
      contextUsed: context
    });

  } catch (error) {
    console.error('AI Analysis Error:', error);
    return NextResponse.json({ error: 'Failed to process AI request' }, { status: 500 });
  }
}
