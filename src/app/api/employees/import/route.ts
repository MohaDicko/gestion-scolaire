import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { EmployeeType, Gender, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

function normalizeEmployeeType(rawPoste?: string): EmployeeType {
  if (!rawPoste) return 'TEACHER';
  const p = String(rawPoste).trim().toUpperCase();
  if (p === 'TEACHER' || p.includes('ENSEIGN') || p.includes('PROF')) return 'TEACHER';
  if (p === 'ADMINISTRATIVE' || p.includes('ADMIN') || p.includes('RH') || p.includes('SECRET') || p.includes('COMPTA') || p.includes('FINANCE')) return 'ADMINISTRATIVE';
  if (p === 'DIRECTOR' || p.includes('DIR') || p.includes('PROVISEUR')) return 'DIRECTOR';
  if (p === 'CENSEUR' || p.includes('CENS')) return 'CENSEUR';
  if (p === 'SURVEILLANT_GENERAL' || p.includes('SURV')) return 'SURVEILLANT_GENERAL';
  if (p === 'DIRECTEUR_DES_ETUDES' || p.includes('ETUD')) return 'DIRECTEUR_DES_ETUDES';
  if (p === 'SUPPORT' || p.includes('MAINT') || p.includes('CHAUFF') || p.includes('AGENT') || p.includes('GARDIEN')) return 'SUPPORT';
  return 'TEACHER';
}

function normalizeGender(rawGender?: string): Gender {
  if (!rawGender) return 'MALE';
  const g = String(rawGender).trim().toUpperCase();
  if (g.startsWith('F') || g.includes('FEM') || g.includes('WOM') || g.includes('DAME')) return 'FEMALE';
  return 'MALE';
}

function extractField(row: Record<string, any>, candidates: string[]): string | undefined {
  const keys = Object.keys(row);
  for (const candidate of candidates) {
    const matchedKey = keys.find(k => {
      const cleanKey = k.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[-_\s]/g, "");
      const cleanCand = candidate.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[-_\s]/g, "");
      return cleanKey === cleanCand;
    });
    if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null && String(row[matchedKey]).trim() !== '') {
      return String(row[matchedKey]).trim();
    }
  }
  return undefined;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  try {
    const { employees, campusId, createAccounts } = await request.json();

    if (!Array.isArray(employees) || employees.length === 0) {
      return NextResponse.json({ error: 'Aucune donnée valide trouvée dans le fichier Excel.' }, { status: 400 });
    }

    // Récupérer ou créer un campus par défaut si non fourni
    let targetCampusId = campusId;
    if (!targetCampusId || targetCampusId.trim() === '') {
      let campus = await prisma.campus.findFirst({ where: { tenantId: session.tenantId } });
      if (!campus) {
        const school = await prisma.school.findUnique({ where: { id: session.tenantId } });
        campus = await prisma.campus.create({
          data: {
            tenantId: session.tenantId,
            name: 'Campus Principal',
            address: school?.address || 'Quartier Principal',
            city: school?.city || 'Bamako',
            region: school?.city || 'Bamako',
            phoneNumber: school?.phoneNumber || '+223 00 00 00 00',
          }
        });
      }
      targetCampusId = campus.id;
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
      const lineNum = index + 2; // Ligne 1 = En-têtes Excel

      try {
        let firstName = extractField(e, ['prenom', 'prénom', 'firstname', 'first_name', 'first name', 'givenname']);
        let lastName = extractField(e, ['nom', 'lastname', 'last_name', 'last name', 'familyname', 'surname']);
        const fullName = extractField(e, ['nometprenom', 'nomprenom', 'fullname', 'full_name', 'nomcomplet', 'nom et prenom', 'nom & prenom']);
        const rawEmail = extractField(e, ['email', 'e-mail', 'mail', 'courriel']);

        // Découper Nom et Prénom si colonne unique
        if ((!firstName || !lastName) && fullName) {
          const parts = fullName.trim().split(/\s+/);
          if (parts.length >= 2) {
            if (!lastName) lastName = parts[0];
            if (!firstName) firstName = parts.slice(1).join(' ');
          } else {
            if (!lastName) lastName = fullName;
            if (!firstName) firstName = fullName;
          }
        }

        // Ligne vide ou sans données utiles -> Ignorer silencieusement sans compter comme erreur
        if (!firstName && !lastName && !rawEmail) {
          continue;
        }

        // Si le nom et prénom manquent
        if (!firstName || !lastName) {
          report.errors.push(`Ligne ${lineNum} ignorée : Nom ou Prénom manquant.`);
          continue;
        }

        // Auto-générer l'email s'il n'est pas fourni dans le fichier Excel (ex: liste officielle DREN)
        const cleanFn = firstName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
        const cleanLn = lastName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
        const email = rawEmail 
          ? String(rawEmail).trim().toLowerCase() 
          : `${cleanFn}.${cleanLn}@cfppas-gao.ml`;

        const rawPoste = extractField(e, ['poste', 'fonction', 'role', 'rôle', 'job', 'position', 'statut']);
        const rawGender = extractField(e, ['genre', 'sexe', 'gender']);
        const rawPhone = extractField(e, ['telephone', 'téléphone', 'phone', 'tel', 'mobile', 'contact']);

        const empType = normalizeEmployeeType(rawPoste);
        const gender = normalizeGender(rawGender);
        const phone = rawPhone ? String(rawPhone).trim() : '00000000';

        // Gestion du matricule unique
        let employeeNumber = extractField(e, ['matricule', 'matriculerh', 'id', 'code', 'employeenumber']);
        if (!employeeNumber) {
          employeeNumber = `EMP-${Date.now().toString().slice(-5)}${Math.floor(100 + Math.random() * 900)}`;
        } else {
          employeeNumber = String(employeeNumber).trim();
        }

        // Vérifier si l'employé existe déjà dans cet établissement
        const existingEmp = await prisma.employee.findFirst({
          where: {
            tenantId: session.tenantId,
            OR: [{ email }, { employeeNumber }]
          }
        });

        await prisma.$transaction(async (tx) => {
          if (existingEmp) {
            await tx.employee.update({
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
            // Unicité absolue du matricule en base
            let finalMatricule = employeeNumber;
            const duplicateMatricule = await tx.employee.findUnique({ where: { employeeNumber: finalMatricule } });
            if (duplicateMatricule) {
              finalMatricule = `${employeeNumber}-${Math.floor(100 + Math.random() * 900)}`;
            }

            await tx.employee.create({
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
                dateOfBirth: new Date(1990, 0, 1),
                hireDate: new Date(),
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
        report.errors.push(`Ligne ${lineNum} (${e.Email || e.email || 'ligne'}) : ${err.message || 'Erreur d\'insertion'}`);
      }
    }

    return NextResponse.json({
      message: `Importation RH terminée : ${report.success} employé(s) importé(s)/mis à jour.`,
      report
    });

  } catch (error: any) {
    console.error('[IMPORT RH CRITICAL ERROR]', error);
    return NextResponse.json({ error: error.message || 'Erreur critique lors de l’importation RH.' }, { status: 500 });
  }
}
