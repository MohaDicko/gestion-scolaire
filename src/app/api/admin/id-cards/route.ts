import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUniversal } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUniversal(req);
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const classroomId = searchParams.get('classroomId');

    // S'il n'y a pas de classroomId, on retourne juste la liste des classes
    if (!classroomId) {
      const classrooms = await prisma.classroom.findMany({
        where: { tenantId: user.tenantId },
        select: { id: true, name: true, level: true },
        orderBy: { name: 'asc' }
      });
      return NextResponse.json({ classrooms });
    }

    // Sinon, on retourne les étudiants de cette classe pour générer leurs cartes
    const enrollments = await prisma.enrollment.findMany({
      where: {
        classroomId,
        status: 'ACTIVE'
      },
      include: {
        student: {
          include: {
            campus: {
              include: {
                school: true
              }
            }
          }
        },
        classroom: true,
        academicYear: true
      }
    });

    const students = enrollments.map(e => ({
      id: e.student.id,
      studentNumber: e.student.studentNumber,
      firstName: e.student.firstName,
      lastName: e.student.lastName,
      dateOfBirth: e.student.dateOfBirth.toISOString().split('T')[0], // Format YYYY-MM-DD
      classroom: e.classroom.name,
      academicYear: e.academicYear.name,
      photoUrl: e.student.photoUrl,
      schoolName: e.student.campus?.school?.name || 'École Inconnue',
      schoolLogo: e.student.campus?.school?.logoUrl || null,
    }));

    return NextResponse.json({ students });

  } catch (error) {
    console.error('[ID Cards API]', error);
    return NextResponse.json({ error: 'Erreur Serveur' }, { status: 500 });
  }
}
