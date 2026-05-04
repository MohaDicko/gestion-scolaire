import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

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

  const [student, grades, enrollment, school] = await Promise.all([
    prisma.student.findUnique({
      where: { id: studentId },
      include: { campus: { select: { name: true } } },
    }),
    prisma.grade.findMany({
      where: { studentId, academicYearId, trimestre },
      include: { subject: true },
      orderBy: { subject: { name: 'asc' } },
    }),
    prisma.enrollment.findFirst({
      where: { studentId, academicYearId },
      include: { classroom: { select: { name: true, level: true } }, academicYear: { select: { name: true } } },
    }),
    prisma.school.findUnique({ where: { id: session.tenantId } }),
  ]);

  if (!student) return NextResponse.json({ error: 'Élève non trouvé' }, { status: 404 });

  // Calcul moyennes pondérées par coefficient
  const subjectResults = grades.map(g => {
    const avg = (g.score / g.maxScore) * 20;
    let mention = '';
    if (avg >= 16) mention = 'Très Bien';
    else if (avg >= 14) mention = 'Bien';
    else if (avg >= 12) mention = 'Assez Bien';
    else if (avg >= 10) mention = 'Passable';
    else mention = 'Insuffisant';
    return {
      subjectName: g.subject.name,
      subjectCode: g.subject.code,
      coefficient: g.subject.coefficient,
      score: g.score,
      maxScore: g.maxScore,
      average: Math.round(avg * 100) / 100,
      weighted: Math.round(avg * g.subject.coefficient * 100) / 100,
      mention,
      comment: g.comment,
      examType: g.examType,
    };
  });

  const totalCoeff = subjectResults.reduce((s, r) => s + r.coefficient, 0);
  const totalWeighted = subjectResults.reduce((s, r) => s + r.weighted, 0);
  const generalAverage = totalCoeff > 0 ? Math.round((totalWeighted / totalCoeff) * 100) / 100 : 0;

  let generalMention = '';
  if (generalAverage >= 16) generalMention = 'Très Bien';
  else if (generalAverage >= 14) generalMention = 'Bien';
  else if (generalAverage >= 12) generalMention = 'Assez Bien';
  else if (generalAverage >= 10) generalMention = 'Passable';
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
    summary: { generalAverage, generalMention, totalCoeff, totalWeighted, subjectCount: subjectResults.length },
  });
}
