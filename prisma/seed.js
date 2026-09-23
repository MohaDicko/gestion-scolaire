const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function getScoreForStudent(studentIndex, subjectIndex, trimester) {
  const base = 8 + ((studentIndex * 7 + subjectIndex * 5 + trimester * 3) % 10);
  const adjustment = ((studentIndex + subjectIndex + trimester) % 3) - 1;
  const score = base + adjustment;
  return Math.min(18, Math.max(6, score));
}

async function main() {
  console.log('🏗️  RE-SEEDING UNIFIÉ: notes de bulletin réalistes et variées...');

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

  const pass = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: 'superadmin@schoolerp.com' },
    update: { password: pass },
    create: {
      email: 'superadmin@schoolerp.com',
      password: pass,
      firstName: 'Mohamed',
      lastName: 'Dicko',
      role: 'SUPER_ADMIN',
    },
  });

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

  const subjectsData = [
    { name: 'Mathématiques', code: 'MATH', coefficient: 5 },
    { name: 'Physique-Chimie', code: 'PC', coefficient: 4 },
    { name: 'Français', code: 'FRA', coefficient: 3 },
    { name: 'Anglais', code: 'ANG', coefficient: 2 },
    { name: 'Biologie', code: 'BIO', coefficient: 3 },
    { name: 'Informatique', code: 'INFO', coefficient: 2 },
    { name: 'Histoire-Géographie', code: 'HG', coefficient: 2 },
  ];

  const subjects = [];
  for (const s of subjectsData) {
    const subject = await prisma.subject.upsert({
      where: { id: `SUB-${s.code}` },
      update: {},
      create: {
        id: `SUB-${s.code}`,
        tenantId: school.id,
        name: s.name,
        code: s.code,
        coefficient: s.coefficient,
      },
    });
    subjects.push(subject);
  }

  const classroomConfig = [
    {
      id: 'CLASS-10A',
      name: '10ème Commune A',
      level: '10ème',
      codes: ['MATH', 'FRA', 'BIO', 'PC', 'INFO', 'ANG'],
    },
    {
      id: 'CLASS-11A',
      name: '11ème Sciences',
      level: '11ème',
      codes: ['MATH', 'PC', 'BIO', 'FRA', 'HG', 'INFO'],
    },
  ];

  const teachers = await prisma.employee.findMany({
    where: { tenantId: school.id, employeeType: 'TEACHER', isActive: true },
    select: { id: true },
  });

  const slots = [
    { start: '08:00', end: '10:00' },
    { start: '10:00', end: '12:00' },
    { start: '14:00', end: '16:00' },
    { start: '16:00', end: '18:00' },
  ];

  for (const classroomMeta of classroomConfig) {
    const classRoom = await prisma.classroom.upsert({
      where: { id: classroomMeta.id },
      update: {},
      create: {
        id: classroomMeta.id,
        tenantId: school.id,
        campusId: campus.id,
        academicYearId: year.id,
        name: classroomMeta.name,
        level: classroomMeta.level,
        maxCapacity: 60,
      },
    });

    const subjectIds = classroomMeta.codes.map((code) => subjects.find((s) => s.code === code).id);

    const timetableData = [];
    for (let day = 1; day <= 5; day++) {
      for (let slotIndex = 0; slotIndex < slots.length; slotIndex++) {
        const subjectId = subjectIds[(day + slotIndex) % subjectIds.length];
        const teacher = teachers[(day + slotIndex) % teachers.length];
        timetableData.push({
          tenantId: school.id,
          classroomId: classRoom.id,
          subjectId,
          employeeId: teacher.id,
          dayOfWeek: day,
          startTime: slots[slotIndex].start,
          endTime: slots[slotIndex].end,
        });
      }
    }

    await prisma.timetable.deleteMany({ where: { classroomId: classRoom.id, tenantId: school.id } });
    await prisma.timetable.createMany({ data: timetableData });
  }

  const students = [
    ['Awa', 'Diallo', '2025ST001'],
    ['Boubacar', 'Traoré', '2025ST002'],
    ['Cissé', 'Sow', '2025ST003'],
    ['Djeneba', 'Diakité', '2025ST004'],
    ['Fanta', 'Kéita', '2025ST005'],
    ['Ibrahim', 'Koné', '2025ST006'],
    ['Mariam', 'Coulibaly', '2025ST007'],
    ['Oumar', 'Sanogo', '2025ST008'],
    ['Saliou', 'Sylla', '2025ST009'],
    ['Yacouba', 'Diarra', '2025ST010'],
    ['Adama', 'Samaké', '2025ST011'],
    ['Hawa', 'Toure', '2025ST012'],
  ];

  console.log('🎓 Création des élèves et des notes selon les modules réels de chaque classe...');

  await prisma.grade.deleteMany({ where: { academicYearId: year.id } });

  const gradesToInsert = [];

  for (let i = 0; i < students.length; i++) {
    const [firstName, lastName, studentNumber] = students[i];
    const classIndex = i % classroomConfig.length;
    const selectedClass = classroomConfig[classIndex];
    const classRoom = await prisma.classroom.findFirst({ where: { id: selectedClass.id, tenantId: school.id } });
    const classSubjects = await prisma.timetable.findMany({
      where: { classroomId: classRoom.id, tenantId: school.id },
      select: { subjectId: true },
    });
    const uniqueSubjectIds = [...new Set(classSubjects.map((entry) => entry.subjectId))];

    const student = await prisma.student.upsert({
      where: { studentNumber },
      update: {},
      create: {
        tenantId: school.id,
        campusId: campus.id,
        studentNumber,
        firstName,
        lastName,
        dateOfBirth: new Date(`2010-${(i % 12) + 1}-0${(i % 9) + 1}`),
        gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
        nationalId: `ML-${1000 + i}`,
        parentName: `Parent ${firstName}`,
        parentPhone: `+223 70 00 ${String(10 + i).padStart(2, '0')} ${String(10 + i).padStart(2, '0')}`,
        parentEmail: `${firstName.toLowerCase()}.parent@gmail.com`,
        parentRelationship: 'PERE',
      },
    });

    await prisma.enrollment.upsert({
      where: {
        studentId_academicYearId: {
          studentId: student.id,
          academicYearId: year.id,
        },
      },
      update: {
        classroomId: classRoom.id,
        status: 'ACTIVE',
      },
      create: {
        studentId: student.id,
        classroomId: classRoom.id,
        academicYearId: year.id,
        status: 'ACTIVE',
      },
    });

    await prisma.user.upsert({
      where: { email: `${studentNumber.toLowerCase()}@student.schoolerp.com` },
      update: { tenantId: school.id, password: pass },
      create: {
        tenantId: school.id,
        email: `${studentNumber.toLowerCase()}@student.schoolerp.com`,
        password: pass,
        firstName,
        lastName,
        role: 'STUDENT',
      },
    });

    for (let trimester = 1; trimester <= 3; trimester++) {
      for (const subjectId of uniqueSubjectIds) {
        const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
        const profileBoost = i % 4 === 0 ? 2 : i % 4 === 1 ? 1 : i % 4 === 2 ? 0 : -1;
        const trimesterBoost = trimester === 1 ? 0 : trimester === 2 ? 1 : 2;
        const subjectBoost = subject.code === 'MATH' ? 1 : subject.code === 'PC' ? 0 : subject.code === 'BIO' ? 1 : -1;
        const score = Math.min(
          18,
          Math.max(6, 9 + profileBoost + trimesterBoost + subjectBoost + ((studentNumber.length + trimester + subject.code.length) % 5))
        );

        gradesToInsert.push({
          studentId: student.id,
          subjectId: subject.id,
          academicYearId: year.id,
          trimestre: trimester,
          examType: 'FINAL',
          score,
          maxScore: 20,
          comment: `Bulletin ${trimester} - ${subject.name}`,
        });
      }
    }
  }

  for (let i = 0; i < gradesToInsert.length; i += 100) {
    await prisma.grade.createMany({
      data: gradesToInsert.slice(i, i + 100),
    });
  }

  const dept = await prisma.department.upsert({
    where: { id: 'DEPT-TEACH' },
    update: {
      tenantId: school.id,
      name: 'Corps Enseignant',
      code: 'TEACH',
    },
    create: {
      id: 'DEPT-TEACH',
      tenantId: school.id,
      name: 'Corps Enseignant',
      code: 'TEACH',
    },
  });

  const employee = await prisma.employee.upsert({
    where: { employeeNumber: 'EMP-2025-001' },
    update: {
      tenantId: school.id,
      firstName: 'Ibrahim',
      lastName: 'Keita',
      email: 'i.keita@excellence.ml',
      phoneNumber: '+223 76 00 11 22',
      dateOfBirth: new Date('1985-05-15'),
      gender: 'MALE',
      hireDate: new Date('2020-01-01'),
      employeeType: 'TEACHER',
      departmentId: dept.id,
      campusId: campus.id,
    },
    create: {
      tenantId: school.id,
      employeeNumber: 'EMP-2025-001',
      firstName: 'Ibrahim',
      lastName: 'Keita',
      email: 'i.keita@excellence.ml',
      phoneNumber: '+223 76 00 11 22',
      dateOfBirth: new Date('1985-05-15'),
      gender: 'MALE',
      hireDate: new Date('2020-01-01'),
      employeeType: 'TEACHER',
      departmentId: dept.id,
      campusId: campus.id,
      contracts: {
        create: {
          tenantId: school.id,
          contractType: 'CDI',
          startDate: new Date('2020-01-01'),
          baseSalary: 450000,
          status: 'ACTIVE',
        },
      },
    },
  });

  await prisma.payslip.upsert({
    where: {
      id: 'PAYSLIP-EMP-2025-001-2025-03',
    },
    update: {
      tenantId: school.id,
      employeeId: employee.id,
      periodStart: new Date('2025-03-01'),
      periodEnd: new Date('2025-03-31'),
      baseSalary: 450000,
      taxableBonuses: 0,
      nonTaxableBonuses: 25000,
      grossSalary: 450000,
      inpsEmployee: 13770,
      amoEmployee: 6750,
      totalDeductions: 20520,
      fiscalBase: 429480,
      its: 44250,
      netSalary: 410230,
      status: 'FINALIZED',
      numberOfChildren: 2,
    },
    create: {
      id: 'PAYSLIP-EMP-2025-001-2025-03',
      tenantId: school.id,
      employeeId: employee.id,
      periodStart: new Date('2025-03-01'),
      periodEnd: new Date('2025-03-31'),
      baseSalary: 450000,
      taxableBonuses: 0,
      nonTaxableBonuses: 25000,
      grossSalary: 450000,
      inpsEmployee: 13770,
      amoEmployee: 6750,
      totalDeductions: 20520,
      fiscalBase: 429480,
      its: 44250,
      netSalary: 410230,
      status: 'FINALIZED',
      numberOfChildren: 2,
    },
  });

  console.log('✅ RE-SEEDING TERMINÉ : notes variées pour les bulletins disponibles.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
