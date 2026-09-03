import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Référentiel officiel CFPPAS ─────────────────────────────────────────────
// Basé sur le modèle de bulletin officiel (image fournie)
// coefficient = seuil de passage en %, dureeH = heures de formation

const MODULES_OFFICIELS: Record<string, { seuil: number; dureeH: number }> = {
  // Matières générales
  'FRA-01':  { seuil: 75, dureeH: 135 },  // Français
  'MATH-06': { seuil: 75, dureeH: 135 },  // Mathématiques
  'ANGL-01': { seuil: 75, dureeH: 90  },  // Anglais
  'EDUC-04': { seuil: 75, dureeH: 60  },  // EPS
  'PHYS-01': { seuil: 75, dureeH: 105 },  // Physique & Chimie
  'EDUC-03': { seuil: 75, dureeH: 60  },  // Éducation civique
  'HIST-05': { seuil: 75, dureeH: 60  },  // Histoire & Géo
  // Modules professionnels
  'MOD-01': { seuil: 75, dureeH: 15  },
  'MOD-02': { seuil: 75, dureeH: 30  },
  'MOD-03': { seuil: 80, dureeH: 120 },
  'MOD-04': { seuil: 75, dureeH: 75  },
  'MOD-05': { seuil: 75, dureeH: 60  },
  'MOD-06': { seuil: 80, dureeH: 120 },
  'MOD-07': { seuil: 75, dureeH: 75  },
  'MOD-08': { seuil: 80, dureeH: 120 },
  'MOD-09': { seuil: 75, dureeH: 120 },
  'MOD-10': { seuil: 80, dureeH: 120 },
  'MOD-11': { seuil: 75, dureeH: 120 },
  'MOD-12': { seuil: 80, dureeH: 120 },
  'MOD-13': { seuil: 80, dureeH: 90  },
  'MOD-14': { seuil: 75, dureeH: 120 },
  'MOD-15': { seuil: 75, dureeH: 120 },
  'MOD-16': { seuil: 75, dureeH: 15  },
  'MOD-17': { seuil: 75, dureeH: 90  },
  'MOD-18': { seuil: 80, dureeH: 120 },
  'MOD-19': { seuil: 75, dureeH: 90  },
  'MOD-20': { seuil: 75, dureeH: 60  },
  'MOD-21': { seuil: 80, dureeH: 120 },
  'MOD-22': { seuil: 75, dureeH: 60  },
  'MOD-23': { seuil: 75, dureeH: 90  },
  'MOD-24': { seuil: 75, dureeH: 60  },
  'MOD-25': { seuil: 75, dureeH: 60  },
  'MOD-26': { seuil: 75, dureeH: 45  },
  'MOD-27': { seuil: 75, dureeH: 60  },
  'MOD-28': { seuil: 75, dureeH: 60  },
  'MOD-29': { seuil: 80, dureeH: 120 },
  'MOD-30': { seuil: 80, dureeH: 120 },
  'MOD-31': { seuil: 75, dureeH: 30  },
  'MOD-32': { seuil: 80, dureeH: 240 },
  'MOD-33': { seuil: 75, dureeH: 60  },
  'MOD-34': { seuil: 75, dureeH: 60  },
  'MOD-35': { seuil: 75, dureeH: 60  },
  'MOD-36': { seuil: 80, dureeH: 90  },
  'MOD-38': { seuil: 75, dureeH: 60  },
  'MOD-39': { seuil: 80, dureeH: 240 },
  'MOD-40': { seuil: 75, dureeH: 30  },
};

// Codes des sujets officiels (à exclure du peuplement : SUB-XXX)
const CODES_OFFICIELS = Object.keys(MODULES_OFFICIELS);

async function main() {
  console.log('════════════════════════════════════════════════════');
  console.log('  MISE À JOUR CFPPAS — NOTES SUR /100');
  console.log('  Étape 1 : gradingScale | Étape 2 : seuils/durées');
  console.log('  Étape 3 : Re-peuplement des notes');
  console.log('════════════════════════════════════════════════════\n');

  // 1. École
  const school = await prisma.school.findFirst({ where: { type: 'AGRO', isActive: true } });
  if (!school) { console.error('❌ CFPPAS introuvable'); return; }
  console.log(`🏫 École : ${school.name}`);

  // ── ÉTAPE 1 : Mettre gradingScale à 100 ─────────────────────────────────
  await prisma.school.update({
    where: { id: school.id },
    data: { gradingScale: 100 },
  });
  console.log('✅ gradingScale mis à jour → 100\n');

  // ── ÉTAPE 2 : Mettre à jour seuils (coefficient) et durées (dans code) ──
  console.log('── Mise à jour des modules officiels ──────────────');
  const subjects = await prisma.subject.findMany({ where: { tenantId: school.id } });
  
  let updatedCount = 0;
  for (const subject of subjects) {
    const ref = MODULES_OFFICIELS[subject.code];
    if (!ref) continue; // Ignorer les SUB-XXX non officiels

    // Encoder la durée dans le code : "MOD-01" → "MOD-01-15H"
    const newCode = `${subject.code}-${ref.dureeH}H`;
    await prisma.subject.update({
      where: { id: subject.id },
      data: {
        coefficient: ref.seuil,   // seuil de passage (ex: 75 ou 80)
        code: newCode,             // encode la durée (ex: "MOD-01-15H")
      },
    });
    console.log(`   ✅ ${subject.name.substring(0, 50)} | seuil=${ref.seuil}% | durée=${ref.dureeH}H`);
    updatedCount++;
  }
  console.log(`\n✅ ${updatedCount} modules mis à jour\n`);

  // ── ÉTAPE 3 : Re-peupler les notes sur /100 ──────────────────────────────
  console.log('── Re-peuplement des notes sur /100 ────────────────');

  const academicYear = await prisma.academicYear.findFirst({
    where: { tenantId: school.id, isActive: true },
  });
  if (!academicYear) { console.error('❌ Année académique introuvable'); return; }
  console.log(`📅 Année : ${academicYear.name}`);

  // Récupérer uniquement les sujets officiels (avec leur nouveau code -XXH)
  const officialsSubjects = await prisma.subject.findMany({
    where: { tenantId: school.id },
  });
  // Filtrer : seuls ceux dont le coefficient est 75 ou 80 (vient d'être mis à jour)
  const seededSubjects = officialsSubjects.filter(s => s.coefficient === 75 || s.coefficient === 80);
  console.log(`📖 ${seededSubjects.length} modules officiels à noter\n`);

  const classrooms = await prisma.classroom.findMany({ where: { tenantId: school.id } });

  let totalNotes = 0;
  let totalEleves = 0;

  for (const classroom of classrooms) {
    const enrollments = await prisma.enrollment.findMany({
      where: { classroomId: classroom.id, academicYearId: academicYear.id, status: 'ACTIVE' },
      include: { student: { select: { id: true, firstName: true } } },
    });
    if (enrollments.length === 0) {
      console.log(`   ⚠️  ${classroom.name} — aucun apprenant inscrit`);
      continue;
    }

    const studentIds = enrollments.map(e => e.studentId);

    // Supprimer toutes les anciennes notes
    const deleted = await prisma.grade.deleteMany({
      where: { studentId: { in: studentIds }, academicYearId: academicYear.id },
    });
    console.log(`📚 ${classroom.name} (${enrollments.length} apprenants) — ${deleted.count} anciennes notes supprimées`);

    const gradesToInsert: any[] = [];
    // Pour le CFPPAS, on n'a pas de "trimestres" par module — on utilise trimestre=1 (année complète)
    // Chaque module a une seule note finale par apprenant
    for (const enrollment of enrollments) {
      const strength = getStudentStrength(enrollment.student.firstName);
      for (const subject of seededSubjects) {
        const seuil = subject.coefficient; // 75 ou 80
        const score = generateScore100(seuil, strength);
        gradesToInsert.push({
          studentId: enrollment.studentId,
          subjectId: subject.id,
          academicYearId: academicYear.id,
          score,
          maxScore: 100,
          examType: 'FINAL',
          trimestre: 1,
          comment: getComment(score, seuil),
        });
      }
    }

    // Insertion en batch
    const chunkSize = 2000;
    for (let i = 0; i < gradesToInsert.length; i += chunkSize) {
      await prisma.grade.createMany({ data: gradesToInsert.slice(i, i + chunkSize), skipDuplicates: true });
    }
    console.log(`   ✅ ${gradesToInsert.length} notes insérées sur /100\n`);
    totalNotes += gradesToInsert.length;
    totalEleves += enrollments.length;
  }

  console.log('════════════════════════════════════════════════════');
  console.log('  ✅ TERMINÉ !');
  console.log(`  📊 ${totalNotes} notes créées sur /100`);
  console.log(`  👤 ${totalEleves} apprenants`);
  console.log(`  📖 ${seededSubjects.length} modules officiels`);
  console.log('════════════════════════════════════════════════════');
}

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function generateScore100(seuil: number, strength: 'excellent' | 'bon' | 'moyen' | 'faible'): number {
  // Distribution réaliste : la plupart réussissent (>= seuil)
  const ranges: Record<string, [number, number]> = {
    excellent: [85, 98],
    bon:       [75, 90],
    moyen:     [65, 82],
    faible:    [45, 72],
  };
  const [min, max] = ranges[strength];
  const score = Math.random() * (max - min) + min;
  return Math.round(score * 2) / 2; // arrondi au 0.5 près (ex: 78.5, 92.0)
}

function getStudentStrength(firstName: string): 'excellent' | 'bon' | 'moyen' | 'faible' {
  const h = Math.abs(hashCode(firstName)) % 100;
  if (h < 15) return 'excellent';
  if (h < 45) return 'bon';
  if (h < 78) return 'moyen';
  return 'faible';
}

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = (h << 5) - h + str.charCodeAt(i); h |= 0; }
  return h;
}

function getComment(score: number, seuil: number): string {
  if (score >= 90) return 'Excellent résultat';
  if (score >= 80) return 'Très bon travail';
  if (score >= seuil) return 'Module validé';
  if (score >= seuil - 10) return 'Effort à poursuivre';
  return 'Module à reprendre';
}

main().catch(e => { console.error('❌', e); process.exit(1); }).finally(() => prisma.$disconnect());
