import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function parseArgs(argv) {
  const out = {};
  for (const item of argv) {
    if (!item.startsWith('--')) continue;
    const eq = item.indexOf('=');
    if (eq === -1) {
      out[item.slice(2)] = true;
    } else {
      const key = item.slice(2, eq);
      const value = item.slice(eq + 1);
      out[key] = value;
    }
  }
  return out;
}

function parseTrimesters(input) {
  if (!input) return [1, 2, 3];
  const values = String(input)
    .split(',')
    .map((v) => Number(v.trim()))
    .filter((v) => Number.isInteger(v) && v >= 1 && v <= 3);
  return values.length ? values : [1, 2, 3];
}

function clampScore(value) {
  return Math.min(18, Math.max(6, Number(value) || 0));
}

function buildScore(studentId, subjectCode, trimester) {
  const seed = Array.from(String(studentId)).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const subjectBias = subjectCode ? Array.from(subjectCode).reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 5 : 0;
  const base = 9 + ((seed + subjectBias + trimester) % 7);
  return clampScore(base - 2 + ((subjectCode?.length || 0) % 3));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dryRun = Boolean(args['dry-run'] || args.dryRun);
  const tenantId = args['tenant-id'] || args.tenantId;
  const classroomId = args['classroom-id'] || args.classroomId;
  const academicYearId = args['academic-year-id'] || args.academicYearId;
  const trimesters = parseTrimesters(args.trimesters || args.trimester || args.trimestre);

  if (!tenantId && !classroomId) {
    console.log('Usage: node scripts/seed_test_notes.mjs --tenant-id=<id> [--classroom-id=<id>] [--academic-year-id=<id>] [--trimesters=1,2,3] [--dry-run]');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/seed_test_notes.mjs --tenant-id=xxx --classroom-id=yyy --dry-run');
    console.log('  node scripts/seed_test_notes.mjs --tenant-id=xxx --academic-year-id=yyy --trimesters=1,2');
    process.exit(1);
  }

  const targetClassroom = classroomId
    ? await prisma.classroom.findFirst({
        where: { id: classroomId, tenantId },
        select: { id: true, tenantId: true, academicYearId: true, name: true },
      })
    : await prisma.classroom.findFirst({
        where: {
          tenantId,
          ...(academicYearId ? { academicYearId } : {}),
        },
        select: { id: true, tenantId: true, academicYearId: true, name: true },
      });

  if (!targetClassroom) {
    console.error('Aucune classe trouvée pour les filtres donnés.');
    process.exit(1);
  }

  const realAcademicYearId = academicYearId || targetClassroom.academicYearId;

  const timetableSubjects = await prisma.timetable.findMany({
    where: { classroomId: targetClassroom.id, tenantId: targetClassroom.tenantId },
    select: { subjectId: true },
  });

  const subjectIds = [...new Set(timetableSubjects.map((entry) => entry.subjectId))];

  if (!subjectIds.length) {
    console.error('Aucune matière trouvée dans l’emploi du temps de cette classe.');
    process.exit(1);
  }

  const students = await prisma.enrollment.findMany({
    where: {
      classroomId: targetClassroom.id,
      academicYearId: realAcademicYearId,
      status: 'ACTIVE',
    },
    select: { studentId: true },
  });

  const studentIds = [...new Set(students.map((entry) => entry.studentId))];

  if (!studentIds.length) {
    console.error('Aucun élève actif trouvé dans cette classe pour cette année scolaire.');
    process.exit(1);
  }

  const subjectRows = await prisma.subject.findMany({
    where: { id: { in: subjectIds }, tenantId: targetClassroom.tenantId },
    select: { id: true, code: true, name: true },
  });

  const subjectMap = new Map(subjectRows.map((subject) => [subject.id, subject]));

  const toInsert = [];

  for (const studentId of studentIds) {
    for (const trimester of trimesters) {
      for (const subjectId of subjectIds) {
        const subject = subjectMap.get(subjectId);
        if (!subject) continue;

        toInsert.push({
          studentId,
          subjectId,
          academicYearId: realAcademicYearId,
          trimestre: trimester,
          examType: 'FINAL',
          score: buildScore(studentId, subject.code, trimester),
          maxScore: 20,
          comment: `TEST-ONLY-${targetClassroom.name}-${trimester}-${subject.code}`,
        });
      }
    }
  }

  console.log('Classe cible :', targetClassroom.name);
  console.log('Année scolaire :', realAcademicYearId);
  console.log('Élèves :', studentIds.length);
  console.log('Matières :', subjectIds.length);
  console.log('Trimestres :', trimesters.join(', '));
  console.log('Nombre de notes prévues :', toInsert.length);

  if (dryRun) {
    console.log('DRY RUN ONLY - aucune donnée n’a été écrite.');
    process.exit(0);
  }

  await prisma.grade.deleteMany({
    where: {
      academicYearId: realAcademicYearId,
      studentId: { in: studentIds },
      subjectId: { in: subjectIds },
      comment: { startsWith: 'TEST-ONLY-' },
    },
  });

  await prisma.grade.createMany({
    data: toInsert,
  });

  console.log('Notes de test injectées avec succès pour les modules de cette classe.');
}

main()
  .catch((error) => {
    console.error('SEED_TEST_NOTES_ERROR', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
