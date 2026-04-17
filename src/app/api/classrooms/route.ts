import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const classrooms = await prisma.classroom.findMany({
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
  try {
    const { tenantId, campusId, academicYearId, name, level, stream, maxCapacity } = await request.json();
    
    if (!campusId || !academicYearId || !name || !level || !maxCapacity) {
        return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
    }

    const newClassroom = await prisma.classroom.create({
      data: {
        tenantId: tenantId || '1',
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
