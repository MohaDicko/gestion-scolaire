import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        enrollments: {
          include: {
            classroom: true,
          }
        },
        Grade: {
          include: {
            subject: true
          }
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Élève non trouvé' }, { status: 404 });
    }

    // On récupère aussi les présences
    const attendance = await prisma.attendance.findMany({
      where: { studentId: id },
      orderBy: { date: 'desc' },
      take: 20
    });

    return NextResponse.json({
      student,
      attendance
    });
  } catch (error) {
    console.error('Portal API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
