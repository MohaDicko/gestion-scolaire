import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { students } = await request.json();

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: 'Aucune donnée valide trouvée' }, { status: 400 });
    }

    // Traitement par lots pour la performance
    const results = await prisma.student.createMany({
      data: students.map((s: any) => ({
        tenantId: session.tenantId,
        firstName: s.Prenom || s.firstName || 'Inconnu',
        lastName: s.Nom || s.lastName || 'Inconnu',
        studentNumber: s.Matricule || s.studentNumber || `MAT-${Math.floor(Math.random() * 10000)}`,
        gender: s.Genre || s.gender || 'M',
        dateOfBirth: s.DateNaissance ? new Date(s.DateNaissance) : new Date('2010-01-01'),
        placeOfBirth: s.LieuNaissance || s.placeOfBirth || '',
        isActive: true
      })),
      skipDuplicates: true // Éviter les erreurs sur les matricules existants
    });

    return NextResponse.json({ 
        message: `${results.count} élèves importés avec succès.`,
        count: results.count 
    });

  } catch (error: any) {
    console.error('[STUDENT IMPORT]', error.message);
    return NextResponse.json({ error: 'Erreur lors de l’importation. Vérifiez le format du fichier.' }, { status: 500 });
  }
}
