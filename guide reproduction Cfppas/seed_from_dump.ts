import { PrismaClient, SchoolType, Gender, UserRole, EmployeeType, ContractType, ContractStatus, EnrollmentStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Chargement du dump CFP-PAS (CFPPAS_DATABASE_DUMP.json)...');

  const dumpPath = path.join(process.cwd(), 'CFPPAS_DATABASE_DUMP.json');
  if (!fs.existsSync(dumpPath)) {
    throw new Error(`Fichier dump introuvable à : ${dumpPath}`);
  }

  const dump = JSON.parse(fs.readFileSync(dumpPath, 'utf8'));

  // 1. Mot de passe haché par défaut
  const hashedPasswordAdmin = await bcrypt.hash('CfpPasGao2026!', 10);
  const hashedPasswordSuper = await bcrypt.hash('SuperAdminMali2026!', 10);
  const hashedPasswordDefault = await bcrypt.hash('admin123', 10);

  // 2. Super Admin
  await prisma.user.upsert({
    where: { email: 'superadmin@schoolerp.com' },
    update: {},
    create: {
      email: 'superadmin@schoolerp.com',
      password: hashedPasswordSuper,
      firstName: 'Mohamed',
      lastName: 'Dicko',
      role: UserRole.SUPER_ADMIN,
      isActive: true
    }
  });

  // 3. École CFP-PAS
  const school = await prisma.school.upsert({
    where: { code: dump.school.code },
    update: {
      name: dump.school.name,
      address: dump.school.address,
      city: dump.school.city,
      country: dump.school.country,
      phoneNumber: dump.school.phoneNumber,
      email: dump.school.email,
      type: dump.school.type as SchoolType,
      gradingScale: dump.school.gradingScale || 100,
      defaultPaymentMethod: dump.school.defaultPaymentMethod || 'ESPECES',
      defaultTuition: dump.school.defaultTuition || 150000,
      motto: dump.school.motto,
      subdomain: dump.school.subdomain
    },
    create: {
      name: dump.school.name,
      code: dump.school.code,
      address: dump.school.address,
      city: dump.school.city,
      country: dump.school.country,
      phoneNumber: dump.school.phoneNumber,
      email: dump.school.email,
      type: dump.school.type as SchoolType,
      gradingScale: dump.school.gradingScale || 100,
      defaultPaymentMethod: dump.school.defaultPaymentMethod || 'ESPECES',
      defaultTuition: dump.school.defaultTuition || 150000,
      motto: dump.school.motto,
      subdomain: dump.school.subdomain,
      isActive: true,
      isSetupComplete: true
    }
  });

  console.log(`✅ École : ${school.name} (${school.id})`);

  // 4. Utilisateurs de l'école
  for (const u of dump.users) {
    const pass = u.email === 'admin@cfppas-gao.ml' ? hashedPasswordAdmin : hashedPasswordDefault;
    await prisma.user.upsert({
      where: { email: u.email },
      update: { tenantId: school.id },
      create: {
        tenantId: school.id,
        email: u.email,
        password: pass,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role as UserRole,
        isActive: u.isActive
      }
    });
  }
  console.log(`✅ ${dump.users.length} Utilisateurs créés.`);

  // 5. Campus
  let campus = await prisma.campus.findFirst({ where: { tenantId: school.id } });
  if (!campus && dump.campuses.length > 0) {
    const cData = dump.campuses[0];
    campus = await prisma.campus.create({
      data: {
        tenantId: school.id,
        name: cData.name,
        address: cData.address,
        city: cData.city,
        region: cData.region,
        phoneNumber: cData.phoneNumber,
        managerName: cData.managerName
      }
    });
  }
  if (!campus) {
    campus = await prisma.campus.create({
      data: {
        tenantId: school.id,
        name: 'Campus Gao - Château Secteur III',
        address: 'B.P. 226, Rue 363 Porte 54',
        city: 'Gao',
        region: 'Gao',
        phoneNumber: '+223 21 82 07 62'
      }
    });
  }

  // 6. Années académiques
  const yearMap = new Map<string, string>();
  for (const y of dump.academicYears) {
    let year = await prisma.academicYear.findFirst({
      where: { tenantId: school.id, name: y.name }
    });
    if (!year) {
      year = await prisma.academicYear.create({
        data: {
          tenantId: school.id,
          name: y.name,
          startDate: new Date(y.startDate),
          endDate: new Date(y.endDate),
          isActive: y.isActive
        }
      });
    }
    yearMap.set(y.name, year.id);
  }
  const defaultYearId = yearMap.get('2025-2026') || Array.from(yearMap.values())[0];

  // 7. Départements
  const deptMap = new Map<string, string>();
  for (const d of dump.departments) {
    let dept = await prisma.department.findFirst({
      where: { tenantId: school.id, code: d.code }
    });
    if (!dept) {
      dept = await prisma.department.create({
        data: {
          tenantId: school.id,
          name: d.name,
          code: d.code,
          description: d.description
        }
      });
    }
    deptMap.set(d.code, dept.id);
  }
  const defaultDeptId = deptMap.get('PED') || Array.from(deptMap.values())[0];

  // 8. Classes
  const classMap = new Map<string, string>();
  for (const c of dump.classrooms) {
    let cls = await prisma.classroom.findFirst({
      where: { tenantId: school.id, name: c.name }
    });
    if (!cls) {
      cls = await prisma.classroom.create({
        data: {
          tenantId: school.id,
          campusId: campus.id,
          academicYearId: defaultYearId,
          name: c.name,
          level: c.level,
          stream: c.stream,
          maxCapacity: c.maxCapacity || 60
        }
      });
    }
    classMap.set(c.name, cls.id);
  }
  console.log(`✅ ${dump.classrooms.length} Classes créées.`);

  // 9. Formateurs & Contrats
  const employeeMap = new Map<string, string>();
  for (const e of dump.employees) {
    let emp = await prisma.employee.findUnique({
      where: { employeeNumber: e.employeeNumber }
    });
    if (!emp) {
      emp = await prisma.employee.create({
        data: {
          tenantId: school.id,
          campusId: campus.id,
          departmentId: defaultDeptId,
          employeeNumber: e.employeeNumber,
          firstName: e.firstName,
          lastName: e.lastName,
          email: e.email,
          phoneNumber: e.phoneNumber,
          dateOfBirth: new Date(e.dateOfBirth),
          gender: e.gender as Gender,
          hireDate: new Date(e.hireDate),
          employeeType: e.employeeType as EmployeeType,
          isActive: e.isActive
        }
      });

      if (e.contracts && e.contracts.length > 0) {
        for (const ct of e.contracts) {
          await prisma.contract.create({
            data: {
              tenantId: school.id,
              employeeId: emp.id,
              contractType: ct.contractType as ContractType,
              baseSalary: ct.baseSalary,
              hourlyRate: ct.hourlyRate || 1750,
              currency: ct.currency || 'XOF',
              startDate: new Date(ct.startDate),
              status: ct.status as ContractStatus
            }
          });
        }
      }
    }
    employeeMap.set(e.employeeNumber, emp.id);
  }
  console.log(`✅ ${dump.employees.length} Formateurs & Employés créés avec contrats vacataires.`);

  // 10. Matières / Modules
  const subjectMap = new Map<string, string>();
  for (const s of dump.subjects) {
    let subj = await prisma.subject.findFirst({
      where: { tenantId: school.id, code: s.code }
    });
    if (!subj) {
      subj = await prisma.subject.create({
        data: {
          tenantId: school.id,
          code: s.code,
          name: s.name,
          coefficient: s.coefficient
        }
      });
    }
    subjectMap.set(s.code, subj.id);
  }
  console.log(`✅ ${dump.subjects.length} Modules & Matières APC enregistrés.`);

  // 11. Emplois du temps
  let ttCount = 0;
  for (const tt of dump.timetables) {
    const cId = classMap.get(tt.classroomName);
    const sId = subjectMap.get(tt.subjectCode);
    const eId = employeeMap.get(tt.teacherEmployeeNumber);
    if (cId && sId && eId) {
      const exists = await prisma.timetable.findFirst({
        where: {
          tenantId: school.id,
          classroomId: cId,
          subjectId: sId,
          dayOfWeek: tt.dayOfWeek,
          startTime: tt.startTime
        }
      });
      if (!exists) {
        await prisma.timetable.create({
          data: {
            tenantId: school.id,
            classroomId: cId,
            subjectId: sId,
            employeeId: eId,
            dayOfWeek: tt.dayOfWeek,
            startTime: tt.startTime,
            endTime: tt.endTime
          }
        });
        ttCount++;
      }
    }
  }
  console.log(`✅ ${ttCount} Créneaux d'emplois du temps configurés.`);

  // 12. Apprenants, Inscriptions & Factures
  let studentCount = 0;
  for (const s of dump.students) {
    let student = await prisma.student.findUnique({
      where: { studentNumber: s.studentNumber }
    });

    if (!student) {
      student = await prisma.student.create({
        data: {
          tenantId: school.id,
          campusId: campus.id,
          studentNumber: s.studentNumber,
          firstName: s.firstName,
          lastName: s.lastName,
          dateOfBirth: new Date(s.dateOfBirth),
          gender: s.gender as Gender,
          nationalId: s.nationalId || `NIN-${s.studentNumber}`,
          parentName: s.parentName,
          parentPhone: s.parentPhone,
          parentEmail: s.parentEmail,
          parentRelationship: s.parentRelationship,
          isActive: s.isActive
        }
      });
      studentCount++;

      // Inscription
      if (s.enrollments && s.enrollments.length > 0) {
        for (const en of s.enrollments) {
          const cId = classMap.get(en.className);
          const yId = yearMap.get(en.academicYearName) || defaultYearId;
          if (cId && yId) {
            await prisma.enrollment.create({
              data: {
                studentId: student.id,
                classroomId: cId,
                academicYearId: yId,
                status: (en.status as EnrollmentStatus) || EnrollmentStatus.ACTIVE
              }
            });
          }
        }
      }

      // Factures & Paiements
      if (s.invoices && s.invoices.length > 0) {
        for (const inv of s.invoices) {
          const createdInv = await prisma.invoice.create({
            data: {
              tenantId: school.id,
              studentId: student.id,
              invoiceNumber: inv.invoiceNumber,
              title: inv.title,
              amount: inv.amount,
              status: inv.status,
              dueDate: new Date(inv.dueDate),
              paidDate: inv.paidDate ? new Date(inv.paidDate) : null
            }
          });

          if (inv.payments && inv.payments.length > 0) {
            for (const p of inv.payments) {
              await prisma.payment.create({
                data: {
                  tenantId: school.id,
                  invoiceId: createdInv.id,
                  amount: p.amount,
                  method: p.method,
                  reference: p.reference,
                  notes: p.notes
                }
              });
            }
          }
        }
      }
    }
  }
  console.log(`✅ ${studentCount} Apprenants réels injectés avec inscriptions et facturation.`);
  console.log('🎉 REPRODUCTION TERMINÉE AVEC SUCCÈS À 100% !');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
