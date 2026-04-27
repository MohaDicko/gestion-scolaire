const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 DÉMARRAGE DU SEED OPTIMISÉ (CRÉATION MASSIVE)...');

  const password = await bcrypt.hash('admin123', 10);

  const schoolsData = [
    { name: 'Lycée Privé Excellence de Bamako', code: 'LYC-EXC', type: 'LYCEE', motto: 'La culture de l\'effort' },
    { name: 'Institut Supérieur des Sciences de la Santé', code: 'IFM-SANTE', type: 'SANTE', motto: 'Soigner avec humanité' },
    { name: 'Lycée Technique de Bamako', code: 'LYC-TECH', type: 'TECHNIQUE', motto: 'La technique au service du pays' },
    { name: 'Groupe Scolaire Les Castors (Fondamental)', code: 'GS-CASTORS', type: 'FONDAMENTAL', motto: 'Éducation pour tous' },
  ];

  for (const sData of schoolsData) {
    console.log(`🏗️  Traitement de l'établissement: ${sData.name}...`);
    
    const school = await prisma.school.upsert({
      where: { code: sData.code },
      update: {},
      create: {
        ...sData,
        address: 'Quartier du Fleuve, Bamako',
        city: 'Bamako',
        country: 'Mali',
        phoneNumber: '+223 20 22 00 00',
        email: `contact@${sData.code.toLowerCase()}.ml`,
        isSetupComplete: true,
      },
    });

    const campus = await prisma.campus.create({
      data: {
        tenantId: school.id,
        name: 'Campus Principal',
        address: 'Zone Industrielle',
        city: 'Bamako',
        region: 'Bamako',
        phoneNumber: '+223 70 00 11 22',
      }
    });

    const year = await prisma.academicYear.create({
      data: {
        tenantId: school.id,
        name: '2024-2025',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2025-07-31'),
        isActive: true,
      }
    });

    await prisma.user.create({
      data: {
        tenantId: school.id,
        email: `admin@${sData.code.toLowerCase()}.ml`,
        password: password,
        firstName: 'Admin',
        lastName: sData.code,
        role: 'SCHOOL_ADMIN',
      }
    });

    const dept = await prisma.department.create({
      data: {
        tenantId: school.id,
        name: sData.type === 'SANTE' ? 'Département Médical' : 'Département Pédagogique',
        code: 'DEPT-01',
      }
    });

    const classes = [];
    if (sData.type === 'LYCEE') {
      classes.push({ name: 'Terminale SE', level: 'Terminale', stream: 'Sciences Exactes' });
      classes.push({ name: 'Terminale L', level: 'Terminale', stream: 'Lettres' });
      classes.push({ name: '11ème Sciences', level: '11ème', stream: 'Sciences' });
    } else if (sData.type === 'SANTE') {
      classes.push({ name: 'Infirmier d\'État 1A', level: 'Année 1', stream: 'Général' });
      classes.push({ name: 'Sage-Femme 1A', level: 'Année 1', stream: 'Obstétrique' });
    } else {
      classes.push({ name: 'Classe Standard 1', level: 'Niveau 1', stream: 'Général' });
    }

    const subjects = [];
    const subjectsData = [
      { name: 'Français', code: 'FRA', coef: 3 },
      { name: 'Mathématiques', code: 'MATH', coef: 5 },
      { name: 'Histoire-Géo', code: 'HG', coef: 2 },
    ];

    for (const subD of subjectsData) {
      const sub = await prisma.subject.create({
        data: {
          tenantId: school.id,
          name: subD.name,
          code: `${sData.code}-${subD.code}`,
          coefficient: subD.coef,
        }
      });
      subjects.push(sub);
    }

    for (const clsData of classes) {
      const classroom = await prisma.classroom.create({
        data: {
          tenantId: school.id,
          campusId: campus.id,
          academicYearId: year.id,
          ...clsData,
          maxCapacity: 100,
        }
      });

      console.log(`👨‍🎓 Préparation de 50 élèves pour ${classroom.name}...`);
      const studentsToCreate = [];
      for (let i = 0; i < 50; i++) {
        studentsToCreate.push({
          id: `${sData.code}-${classroom.id.substring(0,5)}-${i}`,
          tenantId: school.id,
          campusId: campus.id,
          studentNumber: `STU-${sData.code}-${classroom.id.substring(0,4)}-${i}`,
          firstName: `Prénom_${i}`,
          lastName: `Nom_${sData.code}`,
          dateOfBirth: new Date('2008-05-15'),
          gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
          nationalId: `NID-${sData.code}-${i}`,
          parentName: `Parent ${i}`,
          parentPhone: '+223 77 00 00 00',
          parentEmail: `parent.${i}@test.com`,
          parentRelationship: 'PERE',
        });
      }

      await prisma.student.createMany({ data: studentsToCreate, skipDuplicates: true });

      const enrollmentsToCreate = studentsToCreate.map(s => ({
        studentId: s.id,
        classroomId: classroom.id,
        academicYearId: year.id,
      }));
      await prisma.enrollment.createMany({ data: enrollmentsToCreate });

      const invoicesToCreate = studentsToCreate.map((s, i) => ({
        tenantId: school.id,
        studentId: s.id,
        invoiceNumber: `INV-${sData.code}-${classroom.id.substring(0,4)}-${i}`,
        title: 'Frais de Scolarité Annuelle',
        amount: 150000,
        dueDate: new Date('2024-12-31'),
        status: i % 3 === 0 ? 'PAID' : (i % 3 === 1 ? 'PARTIAL' : 'UNPAID'),
      }));
      await prisma.invoice.createMany({ data: invoicesToCreate });

      const gradesToCreate = [];
      for (const s of studentsToCreate) {
        for (const sub of subjects) {
          gradesToCreate.push({
            studentId: s.id,
            subjectId: sub.id,
            academicYearId: year.id,
            trimestre: 1,
            examType: 'CONTINUOUS',
            score: Math.floor(Math.random() * 15) + 5,
            maxScore: 20,
          });
        }
      }
      await prisma.grade.createMany({ data: gradesToCreate });
    }

    console.log(`👔 Création du personnel pour ${sData.name}...`);
    const employeesData = [];
    for (let j = 0; j < 10; j++) {
      employeesData.push({
        id: `EMP-${sData.code}-${j}`,
        tenantId: school.id,
        employeeNumber: `EMP-${sData.code}-${j}`,
        firstName: `Professeur`,
        lastName: `${sData.code}_${j}`,
        email: `prof${j}@${sData.code.toLowerCase()}.ml`,
        phoneNumber: `+223 66 00 ${j}${j}`,
        dateOfBirth: new Date('1985-01-01'),
        gender: j % 2 === 0 ? 'MALE' : 'FEMALE',
        hireDate: new Date('2020-01-01'),
        employeeType: 'TEACHER',
        departmentId: dept.id,
        campusId: campus.id,
      });
    }
    await prisma.employee.createMany({ data: employeesData, skipDuplicates: true });

    const contractsData = employeesData.map((e, j) => ({
      tenantId: school.id,
      employeeId: e.id,
      contractType: 'CDI',
      baseSalary: 250000 + (j * 10000),
      startDate: new Date('2020-01-01'),
    }));
    await prisma.contract.createMany({ data: contractsData });
  }

  console.log('✅ SEED MASSIF TERMINÉ AVEC SUCCÈS !');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
