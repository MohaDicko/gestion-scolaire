const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🏗️  RE-SEEDING UNIFIÉ: Correction et Peuplement...');

  // 1. Établissement
  const school = await prisma.school.upsert({
    where: { code: 'SCH-001' },
    update: { isSetupComplete: true },
    create: {
      name: 'Complexe Scolaire Excellence de Bamako',
      code: 'SCH-001',
      address: 'Hamdallaye ACI, Bamako',
      city: 'Bamako',
      country: 'Mali',
      phoneNumber: '+223 20 00 22 22',
      email: 'contact@excellence.ml',
      type: 'LYCEE',
      isSetupComplete: true,
    },
  });

  const campus = await prisma.campus.upsert({
    where: { id: 'CAMPUS-MAIN' },
    update: {},
    create: {
      id: 'CAMPUS-MAIN',
      tenantId: school.id,
      name: 'Campus Principal',
      address: 'ACI 2000',
      city: 'Bamako',
      region: 'Bamako',
      phoneNumber: '+223 20 22 00 01'
    },
  });

  const year = await prisma.academicYear.upsert({
    where: { id: 'AY-2425' },
    update: { isActive: true },
    create: {
      id: 'AY-2425',
      tenantId: school.id,
      name: '2024-2025',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-07-31'),
      isActive: true,
    },
  });

  // 2. Utilisateur Admin
  const pass = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@schoolerp.com' },
    update: { tenantId: school.id, password: pass },
    create: {
      tenantId: school.id,
      email: 'admin@schoolerp.com',
      password: pass,
      firstName: 'Directeur',
      lastName: 'Maïga',
      role: 'SCHOOL_ADMIN',
    },
  });

  // 3. Sujets
  const subjects = [];
  const subjectsData = [
    { n: 'Mathématiques', c: 'MATH', coef: 5 },
    { n: 'Physique-Chimie', c: 'PC', coef: 4 },
    { n: 'Français', c: 'FRA', coef: 3 },
    { n: 'Anglais', c: 'ANG', coef: 2 },
  ];

  for (const s of subjectsData) {
    const sub = await prisma.subject.upsert({
      where: { id: `SUB-${s.c}` },
      update: {},
      create: { id: `SUB-${s.c}`, tenantId: school.id, name: s.n, code: s.c, coefficient: s.coef }
    });
    subjects.push(sub);
  }

  const cl = await prisma.classroom.upsert({
    where: { id: 'CLASS-10A' },
    update: {},
    create: {
      id: 'CLASS-10A',
      tenantId: school.id,
      campusId: campus.id,
      academicYearId: year.id,
      name: '10ème Commune A',
      level: '10ème',
      maxCapacity: 60,
    }
  });

  // 4. Inscription de 20 élèves
  console.log('🎓 Inscription des élèves...');
  for (let i = 0; i < 20; i++) {
    const sNumber = `2025ST${i.toString().padStart(3, '1')}`;
    const student = await prisma.student.upsert({
      where: { studentNumber: sNumber },
      update: {},
      create: {
        tenantId: school.id,
        campusId: campus.id,
        studentNumber: sNumber,
        firstName: `Elève_${i}`,
        lastName: `Diallo`,
        dateOfBirth: new Date('2010-01-01'),
        gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
        nationalId: `ML-BKO-${i}`,
        parentName: `Parent_${i}`,
        parentPhone: '+223 70 00 00 00',
        parentEmail: `p${i}@gmail.com`,
        parentRelationship: 'PERE',
        enrollments: { create: { classroomId: cl.id, academicYearId: year.id } },
        Invoice: {
          create: {
            tenantId: school.id,
            invoiceNumber: `FAC-RE-25-U-${i}`,
            title: 'Scolarité T1',
            amount: 75000,
            status: i % 2 === 0 ? 'PAID' : 'UNPAID',
            dueDate: new Date('2024-11-30'),
          }
        }
      }
    });

    // Notes
    for (const sub of subjects) {
      await prisma.grade.create({
        data: {
          studentId: student.id,
          subjectId: sub.id,
          academicYearId: year.id,
          trimestre: 1,
          examType: 'FINAL',
          score: 8 + Math.random() * 10,
        }
      });
    }
  }

  console.log('✅ RE-SEEDING TERMINÉ !');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
