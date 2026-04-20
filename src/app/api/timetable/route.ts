import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const classroomId = url.searchParams.get('classroomId');

  if (!classroomId) {
    return NextResponse.json({ error: 'classroomId est requis' }, { status: 400 });
  }

  try {
    // Verify the classroom belongs to this tenant before returning data
    const classroom = await prisma.classroom.findFirst({
      where: { id: classroomId, tenantId: session.tenantId }
    });
    if (!classroom) return NextResponse.json({ error: 'Classe introuvable ou accès non autorisé' }, { status: 403 });

    const timetable = await prisma.timetable.findMany({
      where: { classroomId, tenantId: session.tenantId },
      include: {
        subject: { select: { name: true, code: true } },
        teacher: { select: { firstName: true, lastName: true } }
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
    });

    return NextResponse.json(timetable);
  } catch (error) {
    console.error('[TIMETABLE GET]', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { classroomId, subjectId, employeeId, dayOfWeek, startTime, endTime } = await request.json();

    if (!classroomId || !subjectId || !employeeId || dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 });
    }

    // Verify resources belong to the same tenant
    const [classroom, subject, employee] = await Promise.all([
      prisma.classroom.findFirst({ where: { id: classroomId, tenantId: session.tenantId } }),
      prisma.subject.findFirst({ where: { id: subjectId, tenantId: session.tenantId } }),
      prisma.employee.findFirst({ where: { id: employeeId, tenantId: session.tenantId } }),
    ]);

    if (!classroom || !subject || !employee) {
      return NextResponse.json({ error: 'Ressource introuvable ou appartient à un autre établissement' }, { status: 403 });
    }

    const entry = await prisma.timetable.create({
      data: {
        tenantId: session.tenantId,
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
    console.error('[TIMETABLE POST]', error.message);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 });

    // Verify ownership before deleting
    const entry = await prisma.timetable.findFirst({ where: { id, tenantId: session.tenantId } });
    if (!entry) return NextResponse.json({ error: 'Entrée introuvable ou accès non autorisé' }, { status: 403 });

    await prisma.timetable.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
