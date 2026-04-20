import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { studentId, classroomId, academicYearId } = body;

    if (!studentId || !classroomId || !academicYearId) {
      return NextResponse.json({ error: 'studentId, classroomId et academicYearId sont requis' }, { status: 400 });
    }

    // Verify all resources belong to this tenant
    const [classroom, student] = await Promise.all([
      prisma.classroom.findFirst({ where: { id: classroomId, tenantId: session.tenantId } }),
      prisma.student.findFirst({ where: { id: studentId, tenantId: session.tenantId } }),
    ]);

    if (!classroom) return NextResponse.json({ error: 'Classe introuvable ou accès non autorisé' }, { status: 403 });
    if (!student) return NextResponse.json({ error: 'Élève introuvable ou accès non autorisé' }, { status: 403 });

    // Check existing enrollment
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: { studentId_academicYearId: { studentId, academicYearId } }
    });
    if (existingEnrollment) {
      return NextResponse.json({ error: 'Cet élève est déjà inscrit pour cette année académique' }, { status: 400 });
    }

    const enrollment = await prisma.enrollment.create({
      data: { studentId, classroomId, academicYearId },
      include: { student: true, classroom: true }
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error: any) {
    console.error('[ENROLLMENTS POST]', error.message);
    return NextResponse.json({ error: 'Erreur lors de l\'inscription' }, { status: 400 });
  }
}
