import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Démarrage ultra-rapide (createMany) des notes CFPPAS ---');

  // 1. Trouver le CFPPAS
  const school = await prisma.school.findFirst({
    where: { type: 'AGRO', isActive: true },
  });

  if (!school) {
    console.error('Erreur: École CFPPAS introuvable.');
    return;
  }
  console.log(`École : ${school.name} (${school.id})`);

  // 2. Année académique active
  const academicYear = await prisma.academicYear.findFirst({
    where: { tenantId: school.id, isActive: true }
  });

  if (!academicYear) {
    console.error('Erreur: Année académique active introuvable.');
    return;
  }
  console.log(`Année : ${academicYear.name}`);

  // 3. Classe 1ère EA
  const classroom = await prisma.classroom.findFirst({
    where: { tenantId: school.id, name: { contains: '1ère EA' } }
  });

  if (!classroom) {
    console.error('Erreur: Classe introuvable.');
    return;
  }
  console.log(`Classe : ${classroom.name}`);

  // 4. Modules
  const subjects = await prisma.subject.findMany({
    where: { tenantId: school.id }
  });
  console.log(`${subjects.length} modules.`);

  // 5. Apprenants
  const enrollments = await prisma.enrollment.findMany({
    where: { classroomId: classroom.id, academicYearId: academicYear.id },
    select: { studentId: true }
  });
  console.log(`${enrollments.length} apprenants.`);

  const studentIds = enrollments.map(e => e.studentId);

  // Nettoyage préalable pour le T1
  console.log('Nettoyage des notes T1 existantes...');
  await prisma.grade.deleteMany({
    where: {
      studentId: { in: studentIds },
      academicYearId: academicYear.id,
      trimestre: 1
    }
  });

  console.log('Préparation du batch de notes en mémoire...');
  const gradeTypes: ('CONTINUOUS' | 'MIDTERM' | 'FINAL')[] = ['CONTINUOUS', 'MIDTERM', 'FINAL'];
  const maxScore = school.gradingScale || 20;

  const gradesToInsert: any[] = [];

  for (const studentId of studentIds) {
    for (const subject of subjects) {
      for (const type of gradeTypes) {
        if (type === 'CONTINUOUS' && Math.random() > 0.6) continue;

        const minScore = maxScore * 0.45;
        const maxGen = maxScore * 0.95;
        const score = Math.round((Math.random() * (maxGen - minScore) + minScore) * 10) / 10;

        gradesToInsert.push({
          studentId: studentId,
          subjectId: subject.id,
          academicYearId: academicYear.id,
          score: score,
          maxScore: maxScore,
          examType: type,
          trimestre: 1,
          comment: score >= maxScore * 0.7 ? 'Très bon travail' : 'Résultats satisfaisants'
        });
      }
    }
  }

  console.log(`Insertion en bloc de ${gradesToInsert.length} notes avec createMany...`);
  
  // Insertion par paquets de 2000 pour éviter de dépasser les limites de requêtes SQL
  const chunkSize = 2000;
  for (let i = 0; i < gradesToInsert.length; i += chunkSize) {
    const chunk = gradesToInsert.slice(i, i + chunkSize);
    await prisma.grade.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    console.log(`Inséré ${Math.min(i + chunkSize, gradesToInsert.length)} / ${gradesToInsert.length}`);
  }

  console.log(`\n Terminé avec succès ! ${gradesToInsert.length} notes créées en quelques secondes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
