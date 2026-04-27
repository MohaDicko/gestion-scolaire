import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const student = await prisma.student.findFirst({
      where: { id, tenantId: session.tenantId },
      include: {
        campus: true,
        enrollments: {
          include: { 
            classroom: true,
            academicYear: true 
          },
          orderBy: { academicYear: { startDate: 'desc' } }
        },
        Grade: {
          include: { subject: true, academicYear: true },
          orderBy: { createdAt: 'desc' }
        },
        Attendance: {
          include: { classroom: true },
          orderBy: { date: 'desc' },
          take: 50 // last 50 records
        },
        Invoice: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Élève introuvable' }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error) {
    console.error('[STUDENT_DETAIL_GET]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
