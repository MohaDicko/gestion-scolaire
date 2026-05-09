const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const SURNAMES = ['Traoré', 'Koné', 'Diarra', 'Keïta', 'Coulibaly', 'Sissoko', 'Sow', 'Diallo', 'Maïga', 'Sidibé', 'Touré', 'Dembélé', 'Haidara', 'Sangaré', 'Doumbia', 'Ballo', 'Cissé', 'Ndiaye', 'Tounkara', 'Kanté'];
const FIRSTNAMES_M = ['Moussa', 'Ibrahim', 'Oumar', 'Adama', 'Abdoulaye', 'Modibo', 'Amadou', 'Sekou', 'Bakary', 'Yaya', 'Issa', 'Boubacar', 'Mahamadou', 'Drissa', 'Cheick', 'Lamine', 'Seydou', 'Souleymane', 'Tiémoko', 'Harouna'];
const FIRSTNAMES_F = ['Fatoumata', 'Mariam', 'Awa', 'Kadidia', 'Oumou', 'Sali', 'Assétou', 'Rokia', 'Aminata', 'Djénéba', 'Fanta', 'Hawa', 'Kadiatou', 'Sira', 'Alimatou', 'Bintou', 'Safiatou', 'Rokiatou', 'Salimatou', 'Nana'];

async function main() {
  console.log('🚀 DÉMARRAGE DU PEUPLEMENT MASSIF (STRESS TEST)...');
  const pass = await bcrypt.hash('pass123', 10);

  // 1. Création des Écoles (3 écoles)
  const schools = [];
  for (let i = 1; i <= 3; i++) {
    const s = await prisma.school.upsert({
      where: { code: `SCH-PROD-00${i}` },
      update: {},
      create: {
        name: i === 1 ? 'Lycée Technique de Bamako' : i === 2 ? 'Groupe Scolaire Horizon' : 'Ecole Fondamentale de Kayes',
        code: `SCH-PROD-00${i}`,
        address: `Quartier ${i === 1 ? 'du Fleuve' : 'Sébénikoro'}, Bamako`,
        city: i === 3 ? 'Kayes' : 'Bamako',
        country: 'Mali',
        phoneNumber: `+223 20 22 00 0${i}`,
        email: `contact@school${i}.ml`,
        type: i === 3 ? 'FONDAMENTAL' : 'LYCEE',
        isSetupComplete: true,
        primaryColor: i === 1 ? '#4f8ef7' : i === 2 ? '#10b981' : '#f59e0b'
      }
    });
    schools.push(s);
  }

  for (const school of schools) {
    console.log(`🏠 Peuplement de : ${school.name}`);

    // 2. Campus & Année
    const campus = await prisma.campus.create({
      data: { tenantId: school.id, name: 'Campus Principal', address: 'Centre Ville', city: school.city, region: school.city, phoneNumber: school.phoneNumber }
    });

    const year = await prisma.academicYear.create({
      data: { tenantId: school.id, name: '2024-2025', startDate: new Date('2024-09-01'), endDate: new Date('2025-07-31'), isActive: true }
    });

    // 3. Sujets (10 sujets)
    const subjects = [];
    const subsData = ['Mathématiques', 'Physique', 'Français', 'Anglais', 'Histoire', 'Géographie', 'Chimie', 'SVT', 'EPS', 'Arabe'];
    for (let j = 0; j < subsData.length; j++) {
      const sub = await prisma.subject.create({
        data: { tenantId: school.id, name: subsData[j], code: subsData[j].substring(0,3).toUpperCase() + j, coefficient: Math.floor(Math.random() * 4) + 2 }
      });
      subjects.push(sub);
    }

    // 4. Classes (5 classes par école)
    const classes = [];
    const levels = ['10ème', '11ème LL', '11ème SE', '12ème SET', '12ème MCO'];
    for (const level of levels) {
      const cl = await prisma.classroom.create({
        data: { tenantId: school.id, campusId: campus.id, academicYearId: year.id, name: `${level} A`, level, maxCapacity: 50 }
      });
      classes.push(cl);
    }

    // 5. Elèves (100 par école = 300 total)
    console.log(`   - Inscription de 100 élèves...`);
    for (let k = 0; k < 100; k++) {
      const isMale = Math.random() > 0.5;
      const firstName = isMale ? FIRSTNAMES_M[Math.floor(Math.random() * FIRSTNAMES_M.length)] : FIRSTNAMES_F[Math.floor(Math.random() * FIRSTNAMES_F.length)];
      const lastName = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
      const sNumber = `2025-${school.code.split('-')[2]}-${k.toString().padStart(3, '0')}`;
      const classroom = classes[Math.floor(Math.random() * classes.length)];

      const student = await prisma.student.create({
        data: {
          tenantId: school.id,
          campusId: campus.id,
          studentNumber: sNumber,
          firstName,
          lastName,
          dateOfBirth: new Date('2008-01-01'),
          gender: isMale ? 'MALE' : 'FEMALE',
          nationalId: `ML-${Math.random().toString(36).substring(7).toUpperCase()}`,
          parentName: `${SURNAMES[Math.floor(Math.random() * SURNAMES.length)]} ${FIRSTNAMES_M[Math.floor(Math.random() * FIRSTNAMES_M.length)]}`,
          parentPhone: `+223 ${Math.floor(70000000 + Math.random() * 20000000)}`,
          parentEmail: `parent.${k}@example.com`,
          parentRelationship: 'FATHER',
          enrollments: { create: { classroomId: classroom.id, academicYearId: year.id } },
          Invoice: {
            create: {
              tenantId: school.id,
              invoiceNumber: `FAC-${school.code}-${k}`,
              title: 'Scolarité Annuelle',
              amount: 150000,
              status: Math.random() > 0.3 ? 'PAID' : 'UNPAID',
              dueDate: new Date('2024-12-30')
            }
          }
        }
      });

      // 6. Notes (3 notes par sujet par élève = ~3000 notes par école)
      for (const sub of subjects) {
        await prisma.grade.create({
          data: { studentId: student.id, subjectId: sub.id, academicYearId: year.id, trimestre: 1, examType: 'CONTINUOUS', score: 5 + Math.random() * 15 }
        });
      }
    }

    // 7. Personnel (10 par école)
    const dept = await prisma.department.create({ data: { tenantId: school.id, name: 'Administration', code: 'ADM-' + school.code } });
    for (let l = 0; l < 10; l++) {
      await prisma.employee.create({
        data: {
          tenantId: school.id, campusId: campus.id, departmentId: dept.id,
          employeeNumber: `EMP-${school.code}-${l}`,
          firstName: FIRSTNAMES_M[Math.floor(Math.random() * FIRSTNAMES_M.length)],
          lastName: SURNAMES[Math.floor(Math.random() * SURNAMES.length)],
          email: `staff.${l}@${school.code.toLowerCase()}.ml`,
          phoneNumber: `+223 66 00 00 0${l}`,
          gender: 'MALE', dateOfBirth: new Date('1980-01-01'), hireDate: new Date('2022-01-01'), employeeType: 'TEACHER',
          contracts: { create: { tenantId: school.id, contractType: 'CDI', startDate: new Date('2022-01-01'), baseSalary: 250000, status: 'ACTIVE' } }
        }
      });
    }
  }

  console.log('✅ PEUPLEMENT MASSIF TERMINÉ ! 3 Écoles, 300 Élèves, 3000+ Notes.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
