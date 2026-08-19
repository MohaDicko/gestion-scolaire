import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/reports/transcripts?studentId=&academicYearId=
// Retourne toutes les notes agrégées par matière sur les 3 trimestres
export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const studentId = url.searchParams.get('studentId');
  const academicYearId = url.searchParams.get('academicYearId');

  if (!studentId || !academicYearId) {
    return NextResponse.json({ error: 'studentId et academicYearId sont requis' }, { status: 400 });
  }

  const [student, allGrades, enrollment, school] = await Promise.all([
    prisma.student.findUnique({
      where: { id: studentId },
      include: { campus: { select: { name: true } } },
    }),
    prisma.grade.findMany({
      where: { studentId, academicYearId },
      include: { subject: true },
    }),
    prisma.enrollment.findFirst({
      where: { studentId, academicYearId },
      include: {
        classroom: { select: { name: true, level: true, series: true } },
        academicYear: { select: { name: true } },
      },
    }),
    prisma.school.findUnique({ where: { id: session.tenantId } }),
  ]);

  if (!student) return NextResponse.json({ error: 'Élève non trouvé' }, { status: 404 });

  // Agréger par matière
  const subjectMap: Record<string, {
    subjectName: string; subjectCode: string; coefficient: number;
    t1?: number; t2?: number; t3?: number;
    t1Max: number; t2Max: number; t3Max: number;
  }> = {};

  // Barème de notation propre à l'école (multi-tenant)
  const scale = school?.gradingScale ?? 20;

  allGrades.forEach(g => {
    const key = g.subjectId;
    if (!subjectMap[key]) {
      subjectMap[key] = {
        subjectName: g.subject.name,
        subjectCode: g.subject.code,
        coefficient: g.subject.coefficient,
        t1Max: scale, t2Max: scale, t3Max: scale,
      };
    }
    // Ramener sur l'échelle de l'école
    const scoreOnScale = (g.score / g.maxScore) * scale;
    if (g.trimestre === 1) { subjectMap[key].t1 = Math.round(scoreOnScale * 100) / 100; subjectMap[key].t1Max = scale; }
    if (g.trimestre === 2) { subjectMap[key].t2 = Math.round(scoreOnScale * 100) / 100; subjectMap[key].t2Max = scale; }
    if (g.trimestre === 3) { subjectMap[key].t3 = Math.round(scoreOnScale * 100) / 100; subjectMap[key].t3Max = scale; }
  });

  const subjectResults = Object.values(subjectMap).map(s => {
    const scores = [s.t1, s.t2, s.t3].filter(v => v !== undefined) as number[];
    const annualAvg = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : null;
    const weighted = annualAvg !== null ? Math.round(annualAvg * s.coefficient * 100) / 100 : null;
    // Mentions proportionnelles à l'échelle de l'école
    let mention = '';
    if (annualAvg !== null) {
      if (annualAvg >= scale * 0.80) mention = 'Très Bien';
      else if (annualAvg >= scale * 0.70) mention = 'Bien';
      else if (annualAvg >= scale * 0.60) mention = 'Assez Bien';
      else if (annualAvg >= scale * 0.50) mention = 'Passable';
      else mention = 'Insuffisant';
    }
    return { ...s, annualAvg, weighted, mention };
  }).sort((a, b) => a.subjectName.localeCompare(b.subjectName));

  const validResults = subjectResults.filter(r => r.weighted !== null);
  const totalCoeff = validResults.reduce((s, r) => s + r.coefficient, 0);
  const totalWeighted = validResults.reduce((s, r) => s + (r.weighted ?? 0), 0);
  const generalAverage = totalCoeff > 0 ? Math.round((totalWeighted / totalCoeff) * 100) / 100 : null;

  // Mentions proportionnelles à l'échelle de l'école
  let generalMention = '';
  if (generalAverage !== null) {
    if (generalAverage >= scale * 0.80) generalMention = 'Très Bien';
    else if (generalAverage >= scale * 0.70) generalMention = 'Bien';
    else if (generalAverage >= scale * 0.60) generalMention = 'Assez Bien';
    else if (generalAverage >= scale * 0.50) generalMention = 'Passable';
    else generalMention = 'Insuffisant';
  }

  return NextResponse.json({
    school: { name: school?.name ?? '', city: school?.city ?? '', motto: school?.motto ?? '' },
    student: {
      studentNumber: student.studentNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      campus: student.campus?.name ?? '',
    },
    enrollment: {
      classroom: enrollment?.classroom?.name ?? '',
      level: enrollment?.classroom?.level ?? '',
      series: enrollment?.classroom?.series ?? '',
      academicYear: enrollment?.academicYear?.name ?? '',
    },
    subjectResults,
    summary: { generalAverage, generalMention, totalCoeff, totalWeighted, subjectCount: subjectResults.length },
  });
}
