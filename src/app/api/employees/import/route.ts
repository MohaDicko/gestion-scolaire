import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import * as bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { employees, campusId, createAccounts } = await request.json();

    if (!Array.isArray(employees) || employees.length === 0) {
      return NextResponse.json({ error: 'Aucune donnée valide trouvée' }, { status: 400 });
    }

    const targetCampusId = campusId || (await prisma.campus.findFirst({ where: { tenantId: session.tenantId } }))?.id;
    if (!targetCampusId) {
      return NextResponse.json({ error: 'Aucun campus spécifié ou trouvé.' }, { status: 400 });
    }

    // Récupérer ou créer un département par défaut
    let defaultDept = await prisma.department.findFirst({
      where: { tenantId: session.tenantId!, name: 'GENERAL' }
    });

    if (!defaultDept) {
      defaultDept = await prisma.department.create({
        data: {
          tenantId: session.tenantId!,
          name: 'GENERAL',
          code: 'GEN'
        }
      });
    }

    const report = { success: 0, errors: [] as string[], total: employees.length };
    const defaultPassword = await bcrypt.hash('staff123', 10);

    for (const e of employees) {
      try {
        const firstName = e.Prenom || e.firstName || e['Prénom'];
        const lastName = e.Nom || e.lastName;
        const email = e.Email || e.email;

        if (!firstName || !lastName || !email) {
          report.errors.push(`Ligne ignorée : Nom, Prénom ou Email manquant.`);
          continue;
        }

        const employeeNumber = e.Matricule || e.employeeNumber || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;

        await prisma.$transaction(async (tx) => {
          const employee = await tx.employee.create({
            data: {
              tenantId: session.tenantId!,
              campusId: targetCampusId,
              departmentId: defaultDept!.id,
              firstName: String(firstName),
              lastName: String(lastName),
              email: String(email).toLowerCase(),
              phoneNumber: String(e.Telephone || e.phoneNumber || '0000'),
              employeeNumber: String(employeeNumber),
              employeeType: (e.Poste || e.employeeType || 'TEACHER').toUpperCase() as any,
              gender: (e.Genre || e.gender || 'MALE').toUpperCase().startsWith('F') ? 'FEMALE' : 'MALE',
              dateOfBirth: e.DateNaissance ? new Date(e.DateNaissance) : new Date(1990, 0, 1),
              hireDate: e.DateEmbauche ? new Date(e.DateEmbauche) : new Date(),
              isActive: true
            }
          });

          if (createAccounts) {
            await tx.user.upsert({
              where: { email: employee.email },
              update: {},
              create: {
                tenantId: session.tenantId!,
                email: employee.email,
                password: defaultPassword,
                firstName: employee.firstName,
                lastName: employee.lastName,
                role: employee.employeeType === 'TEACHER' ? 'TEACHER' : 'SCHOOL_ADMIN',
                isActive: true
              }
            });
          }
        });

        report.success++;
      } catch (err: any) {
        report.errors.push(`Erreur pour ${e.Email} : ${err.message}`);
      }
    }

    return NextResponse.json({ 
      message: `Importation RH terminée : ${report.success} succès, ${report.errors.length} échecs.`,
      report 
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Erreur critique lors de l’importation RH.' }, { status: 500 });
  }
}
