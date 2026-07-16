import { PrismaClient, Gender, EnrollmentStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const code = 'CFPPAS';
    
    // 1. Get the school
    const school = await prisma.school.findUnique({ where: { code } });
    if (!school) {
      console.log("L'école CFPPAS est introuvable. Veuillez d'abord la créer.");
      return;
    }

    // 2. Get the Campus
    const campus = await prisma.campus.findFirst({ where: { tenantId: school.id } });
    if (!campus) {
      console.log("Le campus est introuvable.");
      return;
    }

    // 3. Get the Academic Year
    const academicYear = await prisma.academicYear.findFirst({ where: { tenantId: school.id } });
    if (!academicYear) {
      console.log("L'année académique est introuvable.");
      return;
    }

    // 4. Create a Classroom (1ère Année Agriculture)
    let classroom = await prisma.classroom.findFirst({ 
      where: { tenantId: school.id, name: '1ère Année Agriculture' } 
    });

    if (!classroom) {
      classroom = await prisma.classroom.create({
        data: {
          tenantId: school.id,
          campusId: campus.id,
          academicYearId: academicYear.id,
          name: '1ère Année Agriculture',
          level: '1ère Année',
          stream: 'Agriculture',
          maxCapacity: 50
        }
      });
    }

    // 5. Fake Students Data
    const fakeStudents = [
      { firstName: 'Mamadou', lastName: 'Touré', gender: Gender.MALE, parentName: 'Seydou Touré', phone: '70001122' },
      { firstName: 'Fatoumata', lastName: 'Diallo', gender: Gender.FEMALE, parentName: 'Oumar Diallo', phone: '70001123' },
      { firstName: 'Ibrahim', lastName: 'Maïga', gender: Gender.MALE, parentName: 'Aliou Maïga', phone: '70001124' },
      { firstName: 'Awa', lastName: 'Keita', gender: Gender.FEMALE, parentName: 'Moussa Keita', phone: '70001125' },
      { firstName: 'Sekou', lastName: 'Traoré', gender: Gender.MALE, parentName: 'Amadou Traoré', phone: '70001126' },
      { firstName: 'Oumou', lastName: 'Sangaré', gender: Gender.FEMALE, parentName: 'Modibo Sangaré', phone: '70001127' },
      { firstName: 'Lassina', lastName: 'Dembélé', gender: Gender.MALE, parentName: 'Karim Dembélé', phone: '70001128' },
      { firstName: 'Mariam', lastName: 'Cissé', gender: Gender.FEMALE, parentName: 'Cheick Cissé', phone: '70001129' },
      { firstName: 'Youssouf', lastName: 'Coulibaly', gender: Gender.MALE, parentName: 'Bakary Coulibaly', phone: '70001130' },
      { firstName: 'Aminata', lastName: 'Diarra', gender: Gender.FEMALE, parentName: 'Salif Diarra', phone: '70001131' }
    ];

    console.log("Insertion des étudiants en cours...");

    for (let i = 0; i < fakeStudents.length; i++) {
      const s = fakeStudents[i];
      const studentNumber = `STU-CFP-${new Date().getFullYear()}-${String(i + 1).padStart(3, '0')}`;
      
      const existing = await prisma.student.findUnique({ where: { studentNumber } });
      if (!existing) {
        // Create Student
        const student = await prisma.student.create({
          data: {
            tenantId: school.id,
            campusId: campus.id,
            studentNumber: studentNumber,
            firstName: s.firstName,
            lastName: s.lastName,
            dateOfBirth: new Date(2005, 5, 15),
            gender: s.gender,
            nationalId: `NIN-${Math.floor(Math.random() * 1000000)}`,
            parentName: s.parentName,
            parentPhone: s.phone,
            parentEmail: `parent.${s.lastName.toLowerCase()}@example.com`,
            parentRelationship: 'Père',
            isActive: true
          }
        });

        // Enroll Student
        await prisma.enrollment.create({
          data: {
            studentId: student.id,
            classroomId: classroom.id,
            academicYearId: academicYear.id,
            status: EnrollmentStatus.ACTIVE
          }
        });
        console.log(`✅ Créé : ${s.firstName} ${s.lastName} (${studentNumber})`);
      } else {
        console.log(`⚡ Ignoré (existe déjà) : ${s.firstName} ${s.lastName} (${studentNumber})`);
      }
    }

    console.log("==========================================");
    console.log("✅ 10 Étudiants fictifs insérés avec succès pour le CFP-PAS de Gao !");
    console.log("Classe : 1ère Année Agriculture");
    console.log("==========================================");

  } catch (error) {
    console.error("Erreur lors de l'insertion :", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
