import { PrismaClient, UserRole, Gender, ExamType, SchoolType, Plan } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 DÉMARRAGE DU SEEDER COMPRÉHENSIF (MODE DÉMO)...');

  // 1. Initialisation École
  const school = await prisma.school.upsert({
    where: { subdomain: 'excellence' },
    update: { plan: 'ELITE' },
    create: {
      name: 'Complexe Scolaire Excellence',
      code: 'CSE-BKO',
      address: 'Hamdallaye ACI 2000',
      city: 'Bamako',
      country: 'Mali',
      phoneNumber: '+223 70 00 00 01',
      email: 'admin@excellence.ml',
      type: 'LYCEE',
      subdomain: 'excellence',
      motto: 'L\'Excellence au service du Savoir',
      plan: 'ELITE',
      isActive: true
    }
  });
  const tenantId = school.id;

  // 2. Campus et Année
  const campus = await prisma.campus.findFirst({ where: { tenantId } }) || await prisma.campus.create({
    data: { tenantId, name: 'Campus Excellence ACI', address: 'Rue 400', city: 'Bamako', region: 'Bamako', phoneNumber: '+223 20 20 20 20' }
  });

  const year = await prisma.academicYear.findFirst({ where: { tenantId, name: '2024-2025' } }) || await prisma.academicYear.create({
    data: { tenantId, name: '2024-2025', startDate: new Date('2024-09-01'), endDate: new Date('2025-06-30'), isActive: true }
  });

  // 3. Département et Enseignants
  const dept = await prisma.department.findFirst({ where: { tenantId } }) || await prisma.department.create({
    data: { tenantId, name: 'Sciences & Lettres', code: 'SL' }
  });

  const teacherNames = ['Mamadou Koné', 'Awa Diallo', 'Sekou Traoré', 'Oumou Sangaré'];
  const teachers = [];
  for (const name of teacherNames) {
    const [first, last] = name.split(' ');
    const t = await prisma.employee.upsert({
      where: { employeeNumber: `TCH-${first.toUpperCase()}` },
      update: {},
      create: {
        tenantId,
        employeeNumber: `TCH-${first.toUpperCase()}`,
        firstName: first,
        lastName: last,
        email: `${first.toLowerCase()}@excellence.ml`,
        phoneNumber: '+223 66 00 00 00',
        dateOfBirth: new Date('1985-01-01'),
        gender: 'MALE',
        hireDate: new Date('2020-01-01'),
        employeeType: 'TEACHER',
        departmentId: dept.id,
        campusId: campus.id
      }
    });
    teachers.push(t);
  }

  // 4. Classes et Matières
  const classroom = await prisma.classroom.findFirst({ where: { tenantId, name: '10ème Générale' } }) || await prisma.classroom.create({
    data: { tenantId, campusId: campus.id, academicYearId: year.id, name: '10ème Générale', level: '10ème', maxCapacity: 40 }
  });

  const subjectData = [
    { name: 'Mathématiques', code: 'MATH', coeff: 4 },
    { name: 'Français', code: 'FRAN', coeff: 3 },
    { name: 'Physique', code: 'PHYS', coeff: 3 },
    { name: 'Anglais', code: 'ANGL', coeff: 2 },
    { name: 'Histoire-Géo', code: 'HG', coeff: 2 }
  ];
  const subjects = [];
  for (const s of subjectData) {
    const sub = await prisma.subject.upsert({
      where: { id: `SUB-${s.code}` },
      update: {},
      create: { id: `SUB-${s.code}`, tenantId, name: s.name, code: s.code, coefficient: s.coeff }
    });
    subjects.push(sub);
  }

  // 5. Élèves (20 élèves avec Photos)
  console.log('👥 Injection de 20 élèves avec photos...');
  const studentSeeds = [
    'Amadou', 'Bintou', 'Cheick', 'Djeneba', 'Edouard', 'Fatou', 'Gérard', 'Hawa', 'Issa', 'Juliette',
    'Kassim', 'Lamine', 'Mariam', 'Noumou', 'Ousmane', 'Pascal', 'Quentin', 'Rokia', 'Salif', 'Tidiane'
  ];
  for (let i = 0; i < studentSeeds.length; i++) {
    const name = studentSeeds[i];
    await prisma.student.upsert({
      where: { studentNumber: `STU-2025-${i.toString().padStart(3, '0')}` },
      update: { photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}${i}` },
      create: {
        tenantId,
        campusId: campus.id,
        studentNumber: `STU-2025-${i.toString().padStart(3, '0')}`,
        firstName: name,
        lastName: 'Dembélé',
        dateOfBirth: new Date('2009-08-12'),
        gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
        photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}${i}`,
        nationalId: `MLI-${i}9922`,
        parentName: `Parent ${name}`,
        parentPhone: '+223 70 00 00 00',
        parentEmail: `p.${name.toLowerCase()}@test.com`,
        parentRelationship: 'PÈRE',
        enrollments: {
          create: { classroomId: classroom.id, academicYearId: year.id }
        }
      }
    });
  }

  // 6. Emploi du Temps (Semaine complète)
  console.log('📅 Génération de l\'emploi du temps hebdomadaire...');
  const days = [1, 2, 3, 4, 5]; // Lun - Ven
  const slots = [
    { start: '08:00', end: '10:00' },
    { start: '10:15', end: '12:15' }
  ];

  await prisma.timetable.deleteMany({ where: { classroomId: classroom.id } }); // Nettoyer
  for (const day of days) {
    for (let sIdx = 0; sIdx < slots.length; sIdx++) {
      await prisma.timetable.create({
        data: {
          tenantId,
          classroomId: classroom.id,
          subjectId: subjects[(day + sIdx) % subjects.length].id,
          employeeId: teachers[sIdx % teachers.length].id,
          dayOfWeek: day,
          startTime: slots[sIdx].start,
          endTime: slots[sIdx].end
        }
      });
    }
  }

  // 7. Notes (Grades)
  console.log('📝 Saisie des notes pour les relevés...');
  const activeStudents = await prisma.student.findMany({ 
    where: { tenantId, enrollments: { some: { classroomId: classroom.id } } },
    take: 10 
  });

  for (const s of activeStudents) {
    for (const sub of subjects) {
      for (let t = 1; t <= 3; t++) {
        await prisma.grade.upsert({
          where: { id: `GRD-${s.id.substring(0,4)}-${sub.code}-${t}` },
          update: {},
          create: {
            id: `GRD-${s.id.substring(0,4)}-${sub.code}-${t}`,
            studentId: s.id,
            subjectId: sub.id,
            academicYearId: year.id,
            trimestre: t,
            examType: 'FINAL',
            score: 10 + Math.random() * 8, // Notes entre 10 et 18
            maxScore: 20,
            comment: 'Bon travail'
          }
        });
      }
    }
  }

  // 8. Comptabilité Étendue
  console.log('💰 Création des factures et paiements...');
  const demoStudents = await prisma.student.findMany({ where: { tenantId }, take: 10 });
  for (const s of demoStudents) {
    const inv = await prisma.invoice.upsert({
      where: { invoiceNumber: `INV-DEMO-${s.id.substring(0,5)}` },
      update: {},
      create: {
        tenantId,
        studentId: s.id,
        invoiceNumber: `INV-DEMO-${s.id.substring(0,5)}`,
        title: 'Frais de Scolarité 2024-2025',
        amount: 250000,
        status: 'PAID',
        dueDate: new Date(),
        paidDate: new Date()
      }
    });
    
    await prisma.payment.create({
      data: { tenantId, invoiceId: inv.id, amount: 250000, method: 'ESPECES', reference: `REC-${Math.random().toString(36).toUpperCase().substring(0,6)}` }
    });
  }

  // 8. Dépenses (pour le graphique)
  console.log('📉 Ajout de dépenses mensuelles...');
  const categories = ['LOYER', 'ÉLECTRICITÉ', 'SALAIRES', 'MAINTENANCE'];
  for (const cat of categories) {
    await prisma.expense.create({
      data: { tenantId, description: `Dépense mensuelle ${cat}`, amount: 100000 + Math.random() * 50000, category: cat, status: 'PAID' }
    });
  }

  console.log('✅ SEEDER COMPRÉHENSIF TERMINÉ !');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
