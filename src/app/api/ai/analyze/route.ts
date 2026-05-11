import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

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

    // NOTE: In a real production app, we would call Gemini/OpenAI here.
    // For now, we simulate a very smart analysis based on the retrieved data.
    
    let aiResponse = "";
    const lowerPrompt = prompt.toLowerCase();

    if (lowerPrompt.includes("risque") || lowerPrompt.includes("alerte") || lowerPrompt.includes("échec")) {
      aiResponse = `Analyse de performance : J'ai identifié ${lowGrades.length} élèves en difficulté ce trimestre. Notamment ${context.atRiskStudents.join(', ')}. Je suggère d'organiser des séances de tutorat pour ces matières.`;
    } else if (lowerPrompt.includes("argent") || lowerPrompt.includes("finance") || lowerPrompt.includes("paye")) {
      const unpaid = context.revenue.find(r => r.status === 'UNPAID')?.total || 0;
      aiResponse = `Santé financière : Vous avez actuellement ${unpaid.toLocaleString()} FCFA de factures impayées. Le taux de recouvrement est stable, mais ${context.unpaidInvoices} parents n'ont pas encore régularisé leur situation.`;
    } else {
      aiResponse = `Bonjour ! Je suis votre assistant IA. Votre établissement compte ${context.activeStudents} élèves et ${context.activeStaff} employés. Tout semble opérationnel. Comment puis-je vous aider dans votre gestion aujourd'hui ?`;
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
