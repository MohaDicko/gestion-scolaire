import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 DÉMARRAGE DU PEUPLEMENT MASSIF (MASTER SEED)...');

  // 1. Trouver ou créer une école de test
  let school = await prisma.school.findFirst({ where: { subdomain: 'excellence' } });
  if (!school) {
    school = await prisma.school.create({
      data: {
        name: 'Lycée Excellence Bamako',
        code: 'LEX-BKO',
        address: 'ACI 2000, Rue 410',
        city: 'Bamako',
        country: 'Mali',
        phoneNumber: '+223 70 00 00 00',
        email: 'contact@excellence.ml',
        type: 'LYCEE',
        subdomain: 'excellence',
        motto: 'Travail - Discipline - Succès',
        plan: 'ELITE',
        isActive: true
      }
    });
  }
  const tenantId = school.id;

  // 2. Campus et Année Académique
  const campus = await prisma.campus.upsert({
    where: { id: 'test-campus-id' },
    update: {},
    create: {
      id: 'test-campus-id',
      tenantId,
      name: 'Campus Principal',
      address: 'Hamdallaye ACI',
      city: 'Bamako',
      region: 'Bamako',
      phoneNumber: '+223 20 00 00 00'
    }
  });

  const year = await prisma.academicYear.create({
    data: {
      tenantId,
      name: '2024-2025',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-06-30'),
      isActive: true
    }
  });

  // 3. Classes et Matières
  const classroom = await prisma.classroom.create({
    data: {
      tenantId,
      campusId: campus.id,
      academicYearId: year.id,
      name: '10ème Commune A',
      level: '10ème',
      maxCapacity: 40
    }
  });

  const subjects = ['Mathématiques', 'Français', 'Physique-Chimie', 'Histoire-Géo', 'Anglais'];
  const subjectIds = [];
  for (const name of subjects) {
    const s = await prisma.subject.create({
      data: { tenantId, name, code: name.substring(0, 3).toUpperCase(), coefficient: 2 }
    });
    subjectIds.push(s.id);
  }

  // 4. Élèves (avec photos d'identité)
  console.log('👥 Génération des élèves...');
  for (let i = 1; i <= 5; i++) {
    await prisma.student.create({
      data: {
        tenantId,
        campusId: campus.id,
        studentNumber: `ST00${i}`,
        firstName: ['Moussa', 'Fatoumata', 'Adama', 'Oumou', 'Ibrahim'][i-1],
        lastName: ['Diallo', 'Traoré', 'Keita', 'Koné', 'Coulibaly'][i-1],
        dateOfBirth: new Date('2010-05-15'),
        gender: i % 2 === 0 ? 'FEMALE' : 'MALE',
        photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=student${i}`, // Photo d'identité virtuelle
        nationalId: `NID${i}000`,
        parentName: 'Parent Test',
        parentPhone: '+223 000000',
        parentEmail: `parent${i}@test.com`,
        parentRelationship: 'PÈRE',
        enrollments: {
          create: { classroomId: classroom.id, academicYearId: year.id }
        }
      }
    });
  }

  // 5. Emploi du Temps
  console.log('📅 Planification des cours...');
  const employee = await prisma.employee.findFirst({ where: { tenantId } });
  if (employee) {
    for (let day = 1; day <= 5; day++) {
      await prisma.timetable.create({
        data: {
          tenantId,
          classroomId: classroom.id,
          subjectId: subjectIds[day % subjectIds.length],
          employeeId: employee.id,
          dayOfWeek: day,
          startTime: '08:00',
          endTime: '10:00'
        }
      });
    }
  }

  // 6. Comptabilité (Invoices & Payments)
  console.log('💰 Génération des flux financiers...');
  const students = await prisma.student.findMany({ where: { tenantId }, take: 3 });
  for (const s of students) {
    const inv = await prisma.invoice.create({
      data: {
        tenantId,
        studentId: s.id,
        invoiceNumber: `INV-${s.studentNumber}`,
        title: 'Scolarité Annuelle',
        amount: 150000,
        dueDate: new Date(),
        status: 'PARTIAL'
      }
    });
    await prisma.payment.create({
      data: {
        tenantId,
        invoiceId: inv.id,
        amount: 50000,
        method: 'ORANGE_MONEY',
        reference: 'OM-TX-999'
      }
    });
  }

  // 7. Dépenses
  await prisma.expense.createMany({
    data: [
      { tenantId, description: 'Facture Électricité EDM', amount: 45000, category: 'UTILITÉS' },
      { tenantId, description: 'Achat Fournitures Bureau', amount: 12500, category: 'FOURNITURES' }
    ]
  });

  console.log('✅ PEUPLEMENT RÉUSSI !');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
