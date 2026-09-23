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

  if (!studentId || !academicYearId) {
    return NextResponse.json({ error: 'studentId et academicYearId requis' }, { status: 400 });
  }

  const [student, grades, enrollment, school, officialSubjects, employees] = await Promise.all([
    prisma.student.findFirst({
      where: { id: studentId, tenantId: session.tenantId },
      include: { campus: { select: { name: true } } },
    }),
    prisma.grade.findMany({
      where: { studentId, academicYearId },
      include: { subject: true },
      orderBy: [{ subject: { name: 'asc' } }],
    }),
    prisma.enrollment.findFirst({
      where: { studentId, academicYearId },
      include: {
        classroom: { select: { name: true, level: true, stream: true, series: true } },
        academicYear: { select: { name: true } },
      },
    }),
    prisma.school.findUnique({ where: { id: session.tenantId } }),
    prisma.subject.findMany({
      where: { tenantId: session.tenantId, code: { not: { startsWith: 'SUB-' } } },
      select: { name: true, code: true },
    }),
    prisma.employee.findMany({
      where: { tenantId: session.tenantId },
      select: { firstName: true, lastName: true },
    }),
  ]);

  if (!student) return NextResponse.json({ error: 'Eleve non trouve' }, { status: 404 });

  const gradesBySubject = new Map<string, typeof grades>();
  for (const grade of grades) {
    const subjectGrades = gradesBySubject.get(grade.subjectId) || [];
    subjectGrades.push(grade);
    gradesBySubject.set(grade.subjectId, subjectGrades);
  }

  const moduleResults = Array.from(gradesBySubject.values()).map((subjectGrades, index) => {
    const subject = subjectGrades[0].subject;
    const displaySubject = resolveSubjectLabel(subject, officialSubjects, employees);
    const seuil = subject.coefficient; // Ex: 75 ou 80 (seuil de passage en %)
    const notesSur100 = subjectGrades.map((grade) => {
      const noteMax = grade.maxScore || 100;
      return noteMax !== 100 ? (grade.score / noteMax) * 100 : grade.score;
    });
    const noteSur100 = Math.round((notesSur100.reduce((sum, note) => sum + note, 0) / notesSur100.length) * 10) / 10;
    const reussi = noteSur100 >= seuil;

    // Duree stockee dans le code du subject (ex: "MOD-01-15H" ou "ANGL-01-90H")
    // On capture le nombre juste avant le suffixe H en fin de code
    const dureeMatch = subject.code?.match(/(\d+)H$/i);
    const duree = dureeMatch ? parseInt(dureeMatch[1]) : null;

    return {
      numero: index + 1,
      titreModule: displaySubject.name,
      subjectCode: displaySubject.code,
      duree,
      seuil,
      note: noteSur100,
      resultat: reussi ? 'SUCCES' : 'ECHEC',
      reussi,
    };
  });

  const totalModules = moduleResults.length;
  const modulesReussis = moduleResults.filter(m => m.reussi).length;
  const noteGlobale = totalModules > 0
    ? Math.round((moduleResults.reduce((s, m) => s + m.note, 0) / totalModules) * 10) / 10
    : 0;
  const admis = modulesReussis === totalModules;

  return NextResponse.json({
    school: {
      name: school?.name || '',
      address: school?.address || '',
      city: school?.city || '',
      email: school?.email || '',
      phoneNumber: school?.phoneNumber || '',
      logoUrl: school?.logoUrl,
    },
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
      stream: (enrollment?.classroom as any)?.stream || '',
      series: enrollment?.classroom?.series || '',
      academicYear: enrollment?.academicYear?.name || '',
    },
    moduleResults,
    summary: {
      totalModules,
      modulesReussis,
      noteGlobale,
      admis,
    },
  });
}
