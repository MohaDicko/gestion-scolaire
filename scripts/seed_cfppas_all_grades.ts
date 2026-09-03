import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  PEUPLEMENT DES NOTES — TOUTES CLASSES CFPPAS');
  console.log('  Trimestres 1, 2 et 3');
  console.log('═══════════════════════════════════════════════════\n');

  // 1. Trouver le CFPPAS
  const school = await prisma.school.findFirst({
    where: { type: 'AGRO', isActive: true },
  });

  if (!school) {
    console.error('❌ École CFPPAS introuvable.');
    return;
  }
  console.log(`🏫 École : ${school.name} (ID: ${school.id})`);

  // 2. Année académique active
  const academicYear = await prisma.academicYear.findFirst({
    where: { tenantId: school.id, isActive: true },
  });

  if (!academicYear) {
    console.error('❌ Année académique active introuvable.');
    return;
  }
  console.log(`📅 Année : ${academicYear.name}\n`);

  // 3. TOUTES les classes du CFPPAS
  const classrooms = await prisma.classroom.findMany({
    where: { tenantId: school.id },
  });

  if (classrooms.length === 0) {
    console.error('❌ Aucune classe trouvée.');
    return;
  }
  console.log(`📚 ${classrooms.length} classe(s) trouvée(s) :`);
  classrooms.forEach((c) => console.log(`   - ${c.name} (${c.level || 'N/A'})`));

  // 4. Tous les modules/matières
  const subjects = await prisma.subject.findMany({
    where: { tenantId: school.id },
  });
  console.log(`\n📖 ${subjects.length} module(s)/matière(s) trouvé(s)\n`);

  if (subjects.length === 0) {
    console.error('❌ Aucune matière trouvée. Impossible de créer des notes.');
    return;
  }

  const maxScore = school.gradingScale || 20;
  const trimestres = [1, 2, 3];
  const gradeTypes: ('CONTINUOUS' | 'MIDTERM' | 'FINAL')[] = ['CONTINUOUS', 'MIDTERM', 'FINAL'];

  let totalGrades = 0;
  let totalStudents = 0;

  for (const classroom of classrooms) {
    console.log(`\n─── Classe : ${classroom.name} ───────────────────────`);

    // 5. Apprenants inscrits dans cette classe
    const enrollments = await prisma.enrollment.findMany({
      where: {
        classroomId: classroom.id,
        academicYearId: academicYear.id,
        status: 'ACTIVE',
      },
      include: { student: { select: { id: true, firstName: true, lastName: true } } },
    });

    if (enrollments.length === 0) {
      console.log('   ⚠️ Aucun apprenant inscrit — Ignorée.');
      continue;
    }
    console.log(`   👤 ${enrollments.length} apprenant(s) inscrit(s)`);
    totalStudents += enrollments.length;

    const studentIds = enrollments.map((e) => e.studentId);

    // 6. Nettoyage des notes existantes pour ces élèves
    const deleted = await prisma.grade.deleteMany({
      where: {
        studentId: { in: studentIds },
        academicYearId: academicYear.id,
      },
    });
    console.log(`   🗑️ ${deleted.count} notes existantes supprimées`);

    // 7. Générer les notes pour chaque trimestre
    const gradesToInsert: any[] = [];

    for (const trimestre of trimestres) {
      for (const enrollment of enrollments) {
        // Profil de l'élève : certains sont forts, d'autres moyens, d'autres faibles
        // Cela donne des bulletins variés et réalistes
        const studentStrength = getStudentStrength(enrollment.student.firstName);

        for (const subject of subjects) {
          // Chaque matière a un "facteur de difficulté" variable
          const subjectDifficulty = hashCode(subject.name) % 3; // 0=facile, 1=moyen, 2=dur

          for (const type of gradeTypes) {
            // Skip certaines notes CONTINUOUS aléatoirement (réalisme)
            if (type === 'CONTINUOUS' && Math.random() > 0.7) continue;

            const score = generateRealisticScore(
              maxScore,
              studentStrength,
              subjectDifficulty,
              trimestre,
              type
            );

            gradesToInsert.push({
              studentId: enrollment.studentId,
              subjectId: subject.id,
              academicYearId: academicYear.id,
              score,
              maxScore,
              examType: type,
              trimestre,
              comment: getComment(score, maxScore),
            });
          }
        }
      }
    }

    // 8. Insertion en batch
    const chunkSize = 2000;
    for (let i = 0; i < gradesToInsert.length; i += chunkSize) {
      const chunk = gradesToInsert.slice(i, i + chunkSize);
      await prisma.grade.createMany({
        data: chunk,
        skipDuplicates: true,
      });
    }
    console.log(`   ✅ ${gradesToInsert.length} notes insérées (3 trimestres)`);
    totalGrades += gradesToInsert.length;
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log(`  ✅ TERMINÉ AVEC SUCCÈS !`);
  console.log(`  📊 ${totalGrades} notes créées`);
  console.log(`  👤 ${totalStudents} apprenants concernés`);
  console.log(`  📚 ${classrooms.length} classe(s)`);
  console.log(`  📅 3 trimestres`);
  console.log('═══════════════════════════════════════════════════');
}

// ─── Fonctions utilitaires ───────────────────────────────────────────────────

/**
 * Génère un score réaliste basé sur le profil de l'élève et la difficulté du module
 */
function generateRealisticScore(
  maxScore: number,
  studentStrength: 'excellent' | 'bon' | 'moyen' | 'faible',
  subjectDifficulty: number,
  trimestre: number,
  examType: string
): number {
  // Plages de base selon le profil
  const ranges: Record<string, [number, number]> = {
    excellent: [14, 19],
    bon: [11, 17],
    moyen: [8, 14],
    faible: [4, 11],
  };

  let [min, max] = ranges[studentStrength];

  // Ajustement difficulté matière (-1 à +1 point)
  min -= subjectDifficulty * 0.5;
  max -= subjectDifficulty * 0.3;

  // Légère progression au fil des trimestres (+0.5 par trimestre)
  min += (trimestre - 1) * 0.3;
  max += (trimestre - 1) * 0.4;

  // Les FINAL sont souvent un peu plus bas que les CONTINUOUS
  if (examType === 'FINAL') {
    min -= 1;
    max -= 0.5;
  }

  // Bornes
  min = Math.max(0, min);
  max = Math.min(maxScore, max);

  const score = Math.random() * (max - min) + min;
  return Math.round(score * 10) / 10; // 1 décimale
}

/**
 * Attribue un profil de force basé sur le prénom (déterministe)
 */
function getStudentStrength(firstName: string): 'excellent' | 'bon' | 'moyen' | 'faible' {
  const hash = Math.abs(hashCode(firstName));
  const mod = hash % 100;
  // Distribution : 15% excellent, 30% bon, 35% moyen, 20% faible
  if (mod < 15) return 'excellent';
  if (mod < 45) return 'bon';
  if (mod < 80) return 'moyen';
  return 'faible';
}

/**
 * Hash simple pour rendre déterministe
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}

/**
 * Génère un commentaire selon la note
 */
function getComment(score: number, maxScore: number): string {
  const ratio = score / maxScore;
  if (ratio >= 0.85) return 'Excellent travail, continuez ainsi';
  if (ratio >= 0.70) return 'Très bon travail';
  if (ratio >= 0.55) return 'Résultats satisfaisants';
  if (ratio >= 0.45) return 'Des efforts à fournir';
  if (ratio >= 0.35) return 'Travail insuffisant, redoublez d\'efforts';
  return 'Résultats très faibles, un soutien est nécessaire';
}

main()
  .catch((e) => {
    console.error('❌ Erreur fatale:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
