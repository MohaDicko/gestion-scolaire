import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, classroomId, academicYearId } = body;

    // Check if classroom exists
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId }
    });

    if (!classroom) {
      return NextResponse.json({ error: 'Classe introuvable' }, { status: 404 });
    }

    // Check if already enrolled in this academic year
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_academicYearId: {
          studentId,
          academicYearId
        }
      }
    });

    if (existingEnrollment) {
      return NextResponse.json({ error: 'Cet élève est déjà inscrit pour cette année académique' }, { status: 400 });
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        classroomId,
        academicYearId,
      },
      include: {
        student: true,
        classroom: true
      }
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error: any) {
    console.error('Enrollments POST Error:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de l’inscription' }, { status: 400 });
  }
}
