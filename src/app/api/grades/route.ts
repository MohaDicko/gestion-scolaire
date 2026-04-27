import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const classroomId  = url.searchParams.get('classroomId');
  const subjectId    = url.searchParams.get('subjectId');
  const academicYearId = url.searchParams.get('academicYearId');

  try {
    const filters: any = {};
    if (academicYearId) filters.academicYearId = academicYearId;
    if (subjectId) filters.subjectId = subjectId;

    if (classroomId) {
      // Verify classroom belongs to tenant first
      const classroom = await prisma.classroom.findFirst({
        where: { id: classroomId, tenantId: session.tenantId }
      });
      if (!classroom) return NextResponse.json({ error: 'Classe introuvable ou accès non autorisé' }, { status: 403 });

      const enrollments = await prisma.enrollment.findMany({
        where: { classroomId, academicYearId: academicYearId || undefined },
        select: { studentId: true }
      });
      filters.studentId = { in: enrollments.map(e => e.studentId) };
    }

    const grades = await prisma.grade.findMany({
      where: filters,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentNumber: true, tenantId: true } },
      }
    });

    // Final tenant-level filter: only return grades for students belonging to this tenant
    const filtered = grades.filter(g => g.student.tenantId === session.tenantId);

    return NextResponse.json(filtered);
  } catch (error) {
    console.error('[GRADES GET]', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Only teachers and above can submit grades
  if (!['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'DIRECTEUR_DES_ETUDES'].includes(session.role)) {
    return NextResponse.json({ error: 'Accès refusé — droits insuffisants' }, { status: 403 });
  }

  try {
    const { grades, subjectId, academicYearId, examType, trimestre, maxScore } = await request.json();

    if (!grades || !Array.isArray(grades) || !subjectId || !academicYearId || !examType) {
      return NextResponse.json({ error: 'Données de notes invalides ou incomplètes' }, { status: 400 });
    }

    // Validate all grade scores
    for (const g of grades) {
      const score = parseFloat(g.score);
      const max = parseFloat(maxScore) || 20;
      if (isNaN(score) || score < 0 || score > max) {
        return NextResponse.json({ error: `Note invalide pour l'élève ${g.studentId}: ${g.score} (max ${max})` }, { status: 400 });
      }
    }

    const examTypeMap: Record<number, string> = { 1: 'MIDTERM', 2: 'FINAL', 3: 'CONTINUOUS' };
    const resolvedExamType = examTypeMap[examType] || 'CONTINUOUS';

    const results = await Promise.all(grades.map(async (grade: any) => {
      return prisma.grade.create({
        data: {
          studentId: grade.studentId,
          subjectId,
          academicYearId,
          examType: resolvedExamType as any,
          trimestre: trimestre || 1,
          score: parseFloat(grade.score),
          maxScore: parseFloat(maxScore) || 20.0,
          comment: grade.comment?.substring(0, 500) // cap comment length
        }
      });
    }));

    return NextResponse.json({ success: true, count: results.length });
  } catch (error: any) {
    console.error('[GRADES POST]', error.message);
    return NextResponse.json({ error: 'Erreur lors de la saisie des notes' }, { status: 400 });
  }
}
