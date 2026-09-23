import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { resolveSubjectLabel } from '@/lib/subjectLabels';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const studentId = url.searchParams.get('studentId');
  const academicYearId = url.searchParams.get('academicYearId');
  const trimestre = parseInt(url.searchParams.get('trimestre') || '1');

  if (!studentId || !academicYearId) {
    return NextResponse.json({ error: 'studentId et academicYearId requis' }, { status: 400 });
  }

  const [student, enrollment, school] = await Promise.all([
    prisma.student.findFirst({
      where: { id: studentId, tenantId: session.tenantId },
      include: { campus: { select: { name: true } } },
    }),
    prisma.enrollment.findFirst({
      where: { studentId, academicYearId, classroom: { tenantId: session.tenantId } },
      include: { classroom: { select: { name: true, level: true, id: true } }, academicYear: { select: { name: true } } },
    }),
    prisma.school.findUnique({ where: { id: session.tenantId } }),
  ]);

  if (enrollment) {
    // Add classroomId check to satisfy TypeScript if needed
    (enrollment as any).classroomId = enrollment.classroom.id;
  }

  if (!student) return NextResponse.json({ error: 'Élève non trouvé' }, { status: 404 });

  const timetableSubjects = enrollment
    ? await prisma.timetable.findMany({
        where: { classroomId: enrollment.classroom.id, tenantId: session.tenantId },
        select: { subjectId: true },
        distinct: ['subjectId'],
      })
    : [];
  const timetableSubjectIds = timetableSubjects.map((entry) => entry.subjectId);
  const [timetableSubjectsData, grades, officialSubjects, employees] = timetableSubjectIds.length > 0
    ? await Promise.all([
        prisma.subject.findMany({
          where: { id: { in: timetableSubjectIds }, tenantId: session.tenantId },
          orderBy: { name: 'asc' },
        }),
        prisma.grade.findMany({
          where: { studentId, academicYearId, trimestre, subjectId: { in: timetableSubjectIds } },
          include: { subject: true },
        }),
        prisma.subject.findMany({
          where: {
            tenantId: session.tenantId,
            code: { not: { startsWith: 'SUB-' } },
          },
          select: { name: true, code: true },
        }),
        prisma.employee.findMany({
          where: { tenantId: session.tenantId },
          select: { firstName: true, lastName: true },
        }),
      ])
    : [[], [], [], []];

  // CFPPAS ou autre école : utiliser le barème configuré dans la DB
  const scale = school?.gradingScale ?? 20;

  // Calcul moyennes pondérées par coefficient, ramenées sur l'échelle de l'école
  const subjectResults = timetableSubjectsData.map(subject => {
    const officialSubject = resolveSubjectLabel(subject, officialSubjects, employees);
    const subjectGrades = grades.filter((grade) => grade.subjectId === subject.id);
    const continuousGrades = subjectGrades.filter((grade) => grade.examType === 'CONTINUOUS');
    const compositionGrades = subjectGrades.filter((grade) => grade.examType !== 'CONTINUOUS');
    const normalize = (grade: (typeof grades)[number]) => (grade.score / grade.maxScore) * scale;
    const classAverage = continuousGrades.length > 0
      ? continuousGrades.reduce((sum, grade) => sum + normalize(grade), 0) / continuousGrades.length
      : 0;
    const compositionAverage = compositionGrades.length > 0
      ? compositionGrades.reduce((sum, grade) => sum + normalize(grade), 0) / compositionGrades.length
      : classAverage;
    const avg = classAverage > 0
      ? (classAverage + 2 * compositionAverage) / 3
      : compositionAverage;
    const lastGrade = subjectGrades[subjectGrades.length - 1];
    let mention = '';
    if (avg >= scale * 0.80) mention = 'Très Bien';
    else if (avg >= scale * 0.70) mention = 'Bien';
    else if (avg >= scale * 0.60) mention = 'Assez Bien';
    else if (avg >= scale * 0.50) mention = 'Passable';
    else mention = 'Insuffisant';
    return {
      subjectName: officialSubject.name,
      subjectCode: officialSubject.code,
      coefficient: subject.coefficient,
      score: Math.round(avg * 100) / 100,
      maxScore: scale,
      average: Math.round(avg * 100) / 100,
      weighted: Math.round(avg * subject.coefficient * 100) / 100,
      mention,
      comment: lastGrade?.comment,
      examType: lastGrade?.examType || 'FINAL',
    };
  });

  const totalCoeff = subjectResults.reduce((s, r) => s + r.coefficient, 0);
  const totalWeighted = subjectResults.reduce((s, r) => s + r.weighted, 0);
  const generalAverage = totalCoeff > 0 ? Math.round((totalWeighted / totalCoeff) * 100) / 100 : 0;

  // --- CALCULATION OF RANK ---
  let rank = 1;
  let totalInClass = 1;
  const classroomId = (enrollment as any)?.classroomId;
  
  if (classroomId) {
    // Fetch all active enrollments for this class
    const classmates = await prisma.enrollment.findMany({
      where: { classroomId, academicYearId, status: 'ACTIVE' },
      select: { studentId: true }
    });
    totalInClass = classmates.length;

    // Fetch all grades for these classmates in this period
    const classmateGrades = await prisma.grade.findMany({
      where: { 
        studentId: { in: classmates.map(c => c.studentId) },
        academicYearId,
        trimestre,
        ...(timetableSubjectIds.length > 0 ? { subjectId: { in: timetableSubjectIds } } : {})
      },
      include: { subject: true }
    });

    // Group by student and calculate averages
    const classmateAverages = classmates.map(c => {
      const sGrades = classmateGrades.filter(g => g.studentId === c.studentId);
      const sResults = sGrades.map(g => {
        // Utiliser le barème de l'école (multi-tenant)
        const avg = (g.score / g.maxScore) * scale;
        return { average: avg, coeff: g.subject.coefficient };
      });
      const sTotalCoeff = sResults.reduce((s, r) => s + r.coeff, 0);
      const sTotalWeighted = sResults.reduce((s, r) => s + (r.average * r.coeff), 0);
      return { 
        studentId: c.studentId, 
        avg: sTotalCoeff > 0 ? sTotalWeighted / sTotalCoeff : 0 
      };
    });

    // Sort by average DESC
    classmateAverages.sort((a, b) => b.avg - a.avg);
    
    // Find index
    const myIndex = classmateAverages.findIndex(a => a.studentId === studentId);
    if (myIndex !== -1) rank = myIndex + 1;
  }
  // ---------------------------

  // Mentions selon le barème de l'école
  let generalMention = '';
  if (generalAverage >= scale * 0.80) generalMention = 'Très Bien';
  else if (generalAverage >= scale * 0.70) generalMention = 'Bien';
  else if (generalAverage >= scale * 0.60) generalMention = 'Assez Bien';
  else if (generalAverage >= scale * 0.50) generalMention = 'Passable';
  else generalMention = 'Insuffisant';

  return NextResponse.json({
    school: { name: school?.name || '', motto: school?.motto || '', logoUrl: school?.logoUrl },
    student: {
      id: student.id,
      studentNumber: student.studentNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      campus: student.campus?.name || '',
    },
    enrollment: {
      classroom: enrollment?.classroom?.name || '',
      level: enrollment?.classroom?.level || '',
      academicYear: enrollment?.academicYear?.name || '',
    },
    trimestre,
    subjectResults,
    summary: { 
      generalAverage, 
      generalMention, 
      totalCoeff, 
      totalWeighted, 
      subjectCount: subjectResults.length,
      timetableModuleCount: timetableSubjectIds.length,
      rank,
      totalInClass
    },
  });
}
