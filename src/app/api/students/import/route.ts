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

    const GENDER_MAP: Record<string, string> = {
      'MASCULIN': 'MALE', 'HOMME': 'MALE', 'GARÇON': 'MALE', 'MALE': 'MALE', 'M': 'MALE',
      'FÉMININ': 'FEMALE', 'FEMME': 'FEMALE', 'FILLE': 'FEMALE', 'FEMALE': 'FEMALE', 'F': 'FEMALE'
    };

    const RELATION_MAP: Record<string, string> = {
      'PÈRE': 'FATHER', 'MÈRE': 'MOTHER', 'TUTEUR': 'GUARDIAN', 'AUTRE': 'OTHER'
    };

    const results = await prisma.student.createMany({
      data: students.map((s: any) => {
        const rawGender = (s.Genre || s.gender || 'MALE').toString().toUpperCase();
        const gender = GENDER_MAP[rawGender] || 'MALE';
        
        const rawRelation = (s.Relation || s.parentRelationship || 'OTHER').toString().toUpperCase();
        const parentRelationship = RELATION_MAP[rawRelation] || 'OTHER';

        return {
          tenantId: session.tenantId,
          campusId: campus.id,
          firstName: s.Prenom || s.firstName || 'Inconnu',
          lastName: s.Nom || s.lastName || 'Inconnu',
          studentNumber: s.Matricule || s.studentNumber || `MAT-${Math.floor(Math.random() * 90000)}`,
          gender: gender as any,
          dateOfBirth: s.DateNaissance ? new Date(s.DateNaissance) : new Date('2010-01-01'),
          nationalId: (s.nationalId || s.CNI || 'N/A').toString(),
          parentName: s.parentName || s.Parent || 'À préciser',
          parentPhone: (s.parentPhone || s.Telephone || '00000000').toString(),
          parentEmail: s.parentEmail || '',
          parentRelationship: parentRelationship as any,
          isActive: true
        };
      }),
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
