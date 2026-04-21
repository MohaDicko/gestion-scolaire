const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Démarrage du Super-Seeding (Volume de test élevé)...');

  // 1. Nettoyage partiel (Optionnel mais recommandé pour les tests)
  // console.log('🧹 Nettoyage des anciennes données...');
  
  // 1. Création de l'Etablissement
  const school = await prisma.school.upsert({
    where: { code: 'SCH-001' },
    update: {},
    create: {
      name: 'Complexe Scolaire Excellence de Bamako',
      code: 'SCH-001',
      address: 'ACI 2000, Hamdallaye',
      city: 'Bamako',
      country: 'Mali',
      phoneNumber: '+223 20 22 22 22',
      email: 'info@excellence-bko.ml',
      type: 'LYCEE',
      drenCode: 'DREN-BKO-RIVE-GAUCHE',
      isActive: true,
      isSetupComplete: true,
      motto: 'Travail - Discipline - Succès',
    },
  });

  const campus = await prisma.campus.create({
    data: {
      tenantId: school.id,
      name: 'Campus Principal ACI',
      address: 'Quadrilatère ACI 2000',
      city: 'Bamako',
      region: 'Bamako',
      phoneNumber: '+223 20 22 22 23',
    },
  });

  const academicYear = await prisma.academicYear.upsert({
    where: { id: 'AY-2024-2025' }, // Fixed ID to avoid duplicates if re-run
    update: { isActive: true },
    create: {
      id: 'AY-2024-2025',
      tenantId: school.id,
      name: '2024-2025',
      startDate: new Date('2024-09-15T00:00:00Z'),
      endDate: new Date('2025-06-30T23:59:59Z'),
      isActive: true,
    },
  });

  // 2. Utilisateurs & Staff
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@schoolerp.com' },
    update: {},
    create: {
      tenantId: school.id,
      email: 'admin@schoolerp.com',
      password: hashedPassword,
      firstName: 'Directeur',
      lastName: 'Maïga',
      role: 'SCHOOL_ADMIN',
    },
  });

  const deptPedagogie = await prisma.department.create({
    data: { tenantId: school.id, name: 'Pédagogie', code: 'PED' }
  });
  const deptFinance = await prisma.department.create({
    data: { tenantId: school.id, name: 'Finance & Administration', code: 'FIN' }
  });

  console.log('👥 Création des employés (Enseignants & Staff)...');
  const employees = [];
  const teacherNames = [
    { f: 'Adama', l: 'Traoré' }, { f: 'Fatoumata', l: 'Diallo' }, { f: 'Mamadou', l: 'Sidibé' },
    { f: 'Oumou', l: 'Sangaré' }, { f: 'Bakary', l: 'Koné' }, { f: 'Hawa', l: 'Keita' }
  ];

  for (let i = 0; i < teacherNames.length; i++) {
    const emp = await prisma.employee.create({
      data: {
        tenantId: school.id,
        employeeNumber: `EMP2500${i}`,
        firstName: teacherNames[i].f,
        lastName: teacherNames[i].l,
        email: `${teacherNames[i].f.toLowerCase()}@excellence.ml`,
        phoneNumber: `+223 70 00 00 0${i}`,
        dateOfBirth: new Date('1985-05-15'),
        gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
        hireDate: new Date('2020-09-01'),
        employeeType: 'TEACHER',
        departmentId: deptPedagogie.id,
        campusId: campus.id,
        contracts: {
          create: {
            tenantId: school.id,
            contractType: 'CDI',
            startDate: new Date('2020-09-01'),
            baseSalary: 250000 + (i * 25000),
            status: 'ACTIVE'
          }
        }
      }
    });
    employees.push(emp);
  }

  // 3. Académique : Matières & Classes
  console.log('📚 Création des matières et classes...');
  const subjects = [];
  const subData = [
    { n: 'Mathématiques', c: 'MATH', coef: 5 },
    { n: 'Physique', c: 'PHYS', coef: 4 },
    { n: 'Chimie', c: 'CHIM', coef: 2 },
    { n: 'Français', c: 'FR', coef: 3 },
    { n: 'Anglais', c: 'ANG', coef: 3 },
    { n: 'Philosophie', c: 'PHILO', coef: 2 },
  ];

  for (const s of subData) {
    const sub = await prisma.subject.create({
      data: { tenantId: school.id, name: s.n, code: s.c, coefficient: s.coef }
    });
    subjects.push(sub);
  }

  const classrooms = [];
  const levelData = [
    { n: '10ème Commune A', l: '10ème', s: 'Tronc Commun' },
    { n: '11ème Sciences SE', l: '11ème', s: 'Sciences Exactes' },
    { n: '11ème Lettres LL', l: '11ème', s: 'Langues et Littérature' },
    { n: 'Tle Sciences Exp', l: 'Terminale', s: 'Sciences Expérimentales' },
    { n: 'Tle Sciences Exactes', l: 'Terminale', s: 'Sciences Exactes' },
  ];

  for (const lvl of levelData) {
    const cl = await prisma.classroom.create({
      data: {
        tenantId: school.id,
        campusId: campus.id,
        academicYearId: academicYear.id,
        name: lvl.n,
        level: lvl.l,
        stream: lvl.s,
        maxCapacity: 50,
      }
    });
    classrooms.push(cl);
  }

  // 4. Élèves & Inscriptions (Génération massive)
  console.log('🎓 Inscription massive des élèves (60 élèves)...');
  const firstNames = ['Moussa', 'Awa', 'Issa', 'Fatima', 'Ibrahim', 'Mariam', 'Abdoulaye', 'Sira', 'Oumar', 'Kadiatou'];
  const lastNames = ['Coulibaly', 'Dembélé', 'Doumbia', 'Bagayoko', 'Touré', 'Sissoko', 'Camara', 'Diakité', 'Tamba', 'Cissé'];

  const students = [];
  for (let i = 0; i < 60; i++) {
    const fName = firstNames[i % 10];
    const lName = lastNames[Math.floor(i / 6)];
    const student = await prisma.student.create({
      data: {
        tenantId: school.id,
        campusId: campus.id,
        studentNumber: `2025ST${1000 + i}`,
        firstName: fName,
        lastName: lName,
        dateOfBirth: new Date('2008-01-01'),
        gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
        nationalId: `ML-BKO-${2008000 + i}`,
        parentName: `Parent de ${fName}`,
        parentPhone: '+223 77 77 77 77',
        parentEmail: `parent${i}@gmail.ml`,
        parentRelationship: 'PERE',
        enrollments: {
          create: {
            classroomId: classrooms[i % classrooms.length].id,
            academicYearId: academicYear.id,
          }
        },
        // Création d'une facture par élève
        Invoice: {
          create: {
            tenantId: school.id,
            invoiceNumber: `FAC-25-${1000 + i}`,
            title: 'Frais de Scolarité Annuelle',
            amount: 150000,
            status: i % 3 === 0 ? 'PAID' : 'UNPAID', // Un tiers a payé
            dueDate: new Date('2024-11-30'),
            paidDate: i % 3 === 0 ? new Date('2024-10-05') : null,
          }
        }
      }
    });
    students.push(student);

    // 5. Notes (Random scores)
    if (i < 20) { // On met des notes pour les 20 premiers élèves
      for (const sub of subjects) {
        await prisma.grade.create({
          data: {
            studentId: student.id,
            subjectId: sub.id,
            academicYearId: academicYear.id,
            trimestre: 1,
            examType: 'CONTINUOUS',
            score: Math.floor(Math.random() * 11) + 8, // Entre 8 et 18
          }
        });
        await prisma.grade.create({
          data: {
            studentId: student.id,
            subjectId: sub.id,
            academicYearId: academicYear.id,
            trimestre: 1,
            examType: 'FINAL',
            score: Math.floor(Math.random() * 12) + 7, // Entre 7 et 19
          }
        });
      }
    }
  }

  // 6. Finances (Dépenses)
  console.log('💰 Génération du journal des dépenses...');
  const categories = ['UTILITIES', 'SUPPLIES', 'SALARIES', 'OTHER'];
  for (let i = 0; i < 15; i++) {
    await prisma.expense.create({
      data: {
        tenantId: school.id,
        description: `Dépense opérationnelle #${i + 1}`,
        amount: Math.floor(Math.random() * 100000) + 5000,
        category: categories[i % 4],
        date: new Date(2024, 9 + (i % 3), 10 + i),
        status: 'PAID'
      }
    });
  }

  // 7. Présence (Derniers jours)
  console.log('📅 Marquage des présences...');
  for (let d = 0; d < 5; d++) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    for (let i = 0; i < 10; i++) {
       await prisma.attendance.create({
         data: {
           tenantId: school.id,
           studentId: students[i].id,
           classroomId: classrooms[0].id,
           date: date,
           status: i === 9 ? 'ABSENT' : 'PRESENT'
         }
       });
    }
  }

  console.log('✅ SUPER-SEED TERMINÉ AVEC SUCCÈS !');
  console.log(`- 1 Lycée créé`);
  console.log(`- 6 Employés (Enseignants)`);
  console.log(`- 5 Classes & 6 Matières`);
  console.log(`- 60 Élèves inscrits`);
  console.log(`- 60 Factures générées`);
  console.log(`- Notes saisies pour 20 élèves`);
  console.log(`- 15 Dépenses enregistrées`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
