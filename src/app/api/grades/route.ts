import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const classroomId = url.searchParams.get('classroomId');
  const subjectId = url.searchParams.get('subjectId');
  const academicYearId = url.searchParams.get('academicYearId');

  try {
    const filters: any = {};
    if (academicYearId) filters.academicYearId = academicYearId;
    if (subjectId) filters.subjectId = subjectId;

    if (classroomId) {
      // Find students enrolled in the classroom
      const enrollments = await prisma.enrollment.findMany({
        where: { classroomId, academicYearId: academicYearId || undefined },
        select: { studentId: true }
      });
      filters.studentId = { in: enrollments.map(e => e.studentId) };
    }

    const grades = await prisma.grade.findMany({
      where: filters,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
      }
    });
    return NextResponse.json(grades);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { grades, subjectId, academicYearId, examType, semester, maxScore } = await request.json();
    
    // UPSERT GRADES BATCH
    const results = await Promise.all(grades.map(async (grade: any) => {
      // Trying to find existing explicitly or just create new
      return prisma.grade.create({
        data: {
          studentId: grade.studentId,
          subjectId,
          academicYearId,
          examType: examType === 2 ? 'FINAL' : examType === 1 ? 'MIDTERM' : 'CONTINUOUS',
          semester: semester || 1,
          score: grade.score,
          maxScore: maxScore || 20.0,
          comment: grade.comment
        }
      });
    }));

    return NextResponse.json({ success: true, count: results.length });
  } catch (error: any) {
    console.error('Grades POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
