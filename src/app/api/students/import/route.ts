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

    // Récupérer un campus par défaut pour ce tenant
    const campus = await prisma.campus.findFirst({
        where: { tenantId: session.tenantId }
    });

    if (!campus) {
        return NextResponse.json({ error: 'Aucun campus configuré pour cet établissement.' }, { status: 400 });
    }

    const results = await prisma.student.createMany({
      data: students.map((s: any) => ({
        tenantId: session.tenantId,
        campusId: campus.id,
        firstName: s.Prenom || s.firstName || 'Inconnu',
        lastName: s.Nom || s.lastName || 'Inconnu',
        studentNumber: s.Matricule || s.studentNumber || `MAT-${Math.floor(Math.random() * 90000)}`,
        gender: (s.Genre || s.gender || 'MALE').toUpperCase(),
        dateOfBirth: s.DateNaissance ? new Date(s.DateNaissance) : new Date('2010-01-01'),
        nationalId: s.nationalId || 'N/A',
        parentName: s.parentName || 'À préciser',
        parentPhone: s.parentPhone || '00000000',
        parentEmail: s.parentEmail || '',
        parentRelationship: s.parentRelationship || 'PERE',
        isActive: true
      })),
      skipDuplicates: true
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
