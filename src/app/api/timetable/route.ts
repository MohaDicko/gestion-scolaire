import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const classroomId = url.searchParams.get('classroomId');

  if (!classroomId) {
     return NextResponse.json({ error: 'classroomId est requis' }, { status: 400 });
  }

  try {
    const timetable = await prisma.timetable.findMany({
      where: { classroomId },
      include: {
        subject: { select: { name: true, code: true } },
        teacher: { select: { firstName: true, lastName: true } }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });

    return NextResponse.json(timetable);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { classroomId, subjectId, employeeId, dayOfWeek, startTime, endTime } = await request.json();

    const entry = await prisma.timetable.create({
      data: {
        tenantId: '1',
        classroomId,
        subjectId,
        employeeId,
        dayOfWeek: parseInt(dayOfWeek, 10),
        startTime,
        endTime
      }
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if(!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await prisma.timetable.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
