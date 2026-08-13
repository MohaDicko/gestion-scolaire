import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { EmployeeType, Gender, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

function normalizeEmployeeType(rawPoste?: string): EmployeeType {
  if (!rawPoste) return 'TEACHER';
  const p = String(rawPoste).trim().toUpperCase();
  if (p === 'TEACHER' || p.includes('ENSEIGN') || p.includes('PROF')) return 'TEACHER';
  if (p === 'ADMINISTRATIVE' || p.includes('ADMIN') || p.includes('RH') || p.includes('SECRET') || p.includes('COMPTA')) return 'ADMINISTRATIVE';
  if (p === 'DIRECTOR' || p.includes('DIR') || p.includes('PROVISEUR')) return 'DIRECTOR';
  if (p === 'CENSEUR' || p.includes('CENS')) return 'CENSEUR';
  if (p === 'SURVEILLANT_GENERAL' || p.includes('SURV')) return 'SURVEILLANT_GENERAL';
  if (p === 'DIRECTEUR_DES_ETUDES' || p.includes('ETUD')) return 'DIRECTEUR_DES_ETUDES';
  if (p === 'SUPPORT' || p.includes('MAINT') || p.includes('CHAUFF') || p.includes('AGENT')) return 'SUPPORT';
  return 'TEACHER';
}

function normalizeGender(rawGender?: string): Gender {
  if (!rawGender) return 'MALE';
  const g = String(rawGender).trim().toUpperCase();
  if (g.startsWith('F') || g.includes('FEM')) return 'FEMALE';
  return 'MALE';
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  try {
    const { employees, campusId, createAccounts } = await request.json();

    if (!Array.isArray(employees) || employees.length === 0) {
      return NextResponse.json({ error: 'Aucune donnée valide trouvée dans le fichier.' }, { status: 400 });
    }

    const targetCampusId = campusId || (await prisma.campus.findFirst({ where: { tenantId: session.tenantId } }))?.id;
    if (!targetCampusId) {
      return NextResponse.json({ error: 'Aucun campus spécifié ou trouvé.' }, { status: 400 });
    }

    // Récupérer ou créer le département par défaut
    let defaultDept = await prisma.department.findFirst({
      where: { tenantId: session.tenantId, name: 'GENERAL' }
    });

    if (!defaultDept) {
      defaultDept = await prisma.department.create({
        data: {
          tenantId: session.tenantId,
          name: 'GENERAL',
          code: 'GEN'
        }
      });
    }

    const report = { success: 0, errors: [] as string[], total: employees.length };
    const defaultPassword = await bcrypt.hash('staff123', 10);

    for (let index = 0; index < employees.length; index++) {
      const e = employees[index];
      const lineNum = index + 2; // Line 1 is header in Excel
      try {
        const firstName = e.Prenom || e.firstName || e['Prénom'] || e['PRENOM'];
        const lastName = e.Nom || e.lastName || e['NOM'];
        const rawEmail = e.Email || e.email || e['EMAIL'];

        if (!firstName || !lastName || !rawEmail) {
          report.errors.push(`Ligne ${lineNum} ignorée : Nom, Prénom ou Email manquant.`);
          continue;
        }

        const email = String(rawEmail).trim().toLowerCase();
        const empType = normalizeEmployeeType(e.Poste || e.employeeType || e['POSTE']);
        const gender = normalizeGender(e.Genre || e.gender || e['GENRE']);
        const phone = String(e.Telephone || e.phoneNumber || e['TELEPHONE'] || e['TÉLÉPHONE'] || '00000000');

        // Matricule unique
        let employeeNumber = e.Matricule || e.employeeNumber || e['MATRICULE'];
        if (!employeeNumber) {
          employeeNumber = `EMP-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
        } else {
          employeeNumber = String(employeeNumber).trim();
        }

        // Vérifier si l'employé existe déjà par email ou matricule dans cette école
        const existingEmp = await prisma.employee.findFirst({
          where: {
            tenantId: session.tenantId,
            OR: [{ email }, { employeeNumber }]
          }
        });

        await prisma.$transaction(async (tx) => {
          let employeeObj;
          if (existingEmp) {
            employeeObj = await tx.employee.update({
              where: { id: existingEmp.id },
              data: {
                firstName: String(firstName).trim(),
                lastName: String(lastName).trim(),
                phoneNumber: phone,
                employeeType: empType,
                gender: gender,
                campusId: targetCampusId,
                isActive: true
              }
            });
          } else {
            // Assurer que le matricule n'entre pas en conflit global si unique
            let finalMatricule = employeeNumber;
            const duplicateMatricule = await tx.employee.findUnique({ where: { employeeNumber: finalMatricule } });
            if (duplicateMatricule) {
              finalMatricule = `${employeeNumber}-${Math.floor(100 + Math.random() * 900)}`;
            }

            employeeObj = await tx.employee.create({
              data: {
                tenantId: session.tenantId!,
                campusId: targetCampusId,
                departmentId: defaultDept!.id,
                firstName: String(firstName).trim(),
                lastName: String(lastName).trim(),
                email: email,
                phoneNumber: phone,
                employeeNumber: finalMatricule,
                employeeType: empType,
                gender: gender,
                dateOfBirth: e.DateNaissance ? new Date(e.DateNaissance) : new Date(1990, 0, 1),
                hireDate: e.DateEmbauche ? new Date(e.DateEmbauche) : new Date(),
                isActive: true
              }
            });
          }

          if (createAccounts) {
            const userRole: UserRole = empType === 'TEACHER' ? 'TEACHER' : 'SCHOOL_ADMIN';
            await tx.user.upsert({
              where: { email: email },
              update: {
                firstName: String(firstName).trim(),
                lastName: String(lastName).trim(),
                role: userRole,
                isActive: true
              },
              create: {
                tenantId: session.tenantId!,
                email: email,
                password: defaultPassword,
                firstName: String(firstName).trim(),
                lastName: String(lastName).trim(),
                role: userRole,
                isActive: true
              }
            });
          }
        });

        report.success++;
      } catch (err: any) {
        console.error(`[IMPORT RH] Ligne ${lineNum} error:`, err);
        report.errors.push(`Ligne ${lineNum} (${e.Email || 'sans email'}) : ${err.message || 'Erreur d\'insertion'}`);
      }
    }

    return NextResponse.json({
      message: `Importation RH terminée : ${report.success} importé(s)/mis à jour, ${report.errors.length} échec(s).`,
      report
    });

  } catch (error: any) {
    console.error('[IMPORT RH CRITICAL ERROR]', error);
    return NextResponse.json({ error: error.message || 'Erreur critique lors de l’importation RH.' }, { status: 500 });
  }
}
