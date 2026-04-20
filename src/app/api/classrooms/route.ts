import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !session.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const classrooms = await prisma.classroom.findMany({
      where: { tenantId: session.tenantId },
      include: {
        campus: true,
        academicYear: true,
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(classrooms);
  } catch (error) {
    console.error('Classrooms GET Error:', error);
    return NextResponse.json({ error: 'Erreur Serveur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !session.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { campusId, academicYearId, name, level, stream, maxCapacity } = await request.json();
    
    if (!campusId || !academicYearId || !name || !level || !maxCapacity) {
        return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
    }

    const newClassroom = await prisma.classroom.create({
      data: {
        tenantId: session.tenantId,
        campusId,
        academicYearId,
        name,
        level,
        stream,
        maxCapacity: parseInt(maxCapacity, 10),
      },
    });

    return NextResponse.json(newClassroom, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
