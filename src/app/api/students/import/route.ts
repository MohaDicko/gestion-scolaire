import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import * as bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { students, campusId, createAccounts } = await request.json();

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: 'Aucune donnée valide trouvée' }, { status: 400 });
    }

    // Validation du campus
    const targetCampusId = campusId || (await prisma.campus.findFirst({ where: { tenantId: session.tenantId } }))?.id;
    if (!targetCampusId) {
      return NextResponse.json({ error: 'Aucun campus spécifié ou trouvé.' }, { status: 400 });
    }

    const GENDER_MAP: Record<string, string> = {
      'M': 'MALE', 'MASCULIN': 'MALE', 'HOMME': 'MALE', 'GARÇON': 'MALE', 'MALE': 'MALE',
      'F': 'FEMALE', 'FÉMININ': 'FEMALE', 'FEMME': 'FEMALE', 'FILLE': 'FEMALE', 'FEMALE': 'FEMALE'
    };

    const RELATION_MAP: Record<string, string> = {
      'PÈRE': 'FATHER', 'MÈRE': 'MOTHER', 'TUTEUR': 'GUARDIAN', 'AUTRE': 'OTHER',
      'FATHER': 'FATHER', 'MOTHER': 'MOTHER', 'GUARDIAN': 'GUARDIAN'
    };

    const report = {
      success: 0,
      errors: [] as string[],
      total: students.length
    };

    const defaultPassword = await bcrypt.hash('pass123', 10);

    // On traite par lots pour la performance mais individuellement pour la gestion d'erreurs fine
    for (const s of students) {
      try {
        const firstName = s.Prenom || s.firstName || s['Prénom'];
        const lastName = s.Nom || s.lastName;
        
        if (!firstName || !lastName) {
          report.errors.push(`Ligne ignorée : Nom ou Prénom manquant.`);
          continue;
        }

        const rawGender = (s.Genre || s.gender || 'M').toString().toUpperCase();
        const gender = GENDER_MAP[rawGender] || 'MALE';
        
        const rawRelation = (s.Relation || s.parentRelationship || 'OTHER').toString().toUpperCase();
        const parentRelationship = RELATION_MAP[rawRelation] || 'OTHER';

        const studentNumber = s.Matricule || s.studentNumber || `MAT-${Math.floor(Math.random() * 900000)}`;

        await prisma.$transaction(async (tx) => {
          const student = await tx.student.create({
            data: {
              tenantId: session.tenantId!,
              campusId: targetCampusId,
              firstName: String(firstName),
              lastName: String(lastName),
              studentNumber: String(studentNumber),
              gender: gender as any,
              dateOfBirth: s.DateNaissance || s.dateOfBirth ? new Date(s.DateNaissance || s.dateOfBirth) : new Date('2010-01-01'),
              nationalId: (s.nationalId || s.CNI || 'N/A').toString(),
              parentName: s.parentName || s.Parent || 'À préciser',
              parentPhone: (s.parentPhone || s.Telephone || '00000000').toString(),
              parentEmail: s.parentEmail || s.EmailParent || '',
              parentRelationship: parentRelationship as any,
              isActive: true
            }
          });

          // Création de compte élève si demandé
          if (createAccounts) {
            const email = s.EmailPerso || s.studentEmail || `${student.studentNumber.toLowerCase()}@school.erp`;
            await tx.user.create({
              data: {
                tenantId: session.tenantId!,
                email: email.toLowerCase(),
                password: defaultPassword,
                firstName: student.firstName,
                lastName: student.lastName,
                role: 'STUDENT',
                isActive: true
              }
            });
          }
        });

        report.success++;
      } catch (err: any) {
        report.errors.push(`Erreur pour ${s.Nom} ${s.Prenom} : ${err.message}`);
      }
    }

    return NextResponse.json({ 
      message: `Importation terminée : ${report.success} succès, ${report.errors.length} échecs.`,
      report 
    });

  } catch (error: any) {
    console.error('[STUDENT IMPORT]', error.message);
    return NextResponse.json({ error: 'Erreur critique lors de l’importation.' }, { status: 500 });
  }
}
