import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const classroomId = url.searchParams.get('classroomId');
  const subjectId = url.searchParams.get('subjectId');

  try {
    const logs = await prisma.lessonLog.findMany({
      where: {
        tenantId: session.tenantId,
        classroomId: classroomId || undefined,
        subjectId: subjectId || undefined,
      },
      include: {
        classroom: { select: { name: true } },
        subject: { select: { name: true, code: true } },
        teacher: { select: { firstName: true, lastName: true } },
      },
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(logs);
  } catch (error) {
    console.error('[LESSONS_GET]', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération du cahier de texte' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Only teachers and admins can log lessons
  if (!['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(session.role)) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { classroomId, subjectId, title, content, homework, date, status } = body;

    if (!classroomId || !subjectId || !title || !content) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
    }

    // Identify the employee record for this user if they are a TEACHER
    let employeeId = body.employeeId;
    if (session.role === 'TEACHER' && !employeeId) {
      const employee = await prisma.employee.findFirst({
        where: { email: session.email, tenantId: session.tenantId }
      });
      if (employee) employeeId = employee.id;
    }

    if (!employeeId) {
      return NextResponse.json({ error: 'Profil enseignant non trouvé' }, { status: 400 });
    }

    const log = await prisma.lessonLog.create({
      data: {
        tenantId: session.tenantId,
        classroomId,
        subjectId,
        employeeId,
        title,
        content,
        homework,
        date: date ? new Date(date) : new Date(),
        status: status || 'COMPLETED',
      }
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error('[LESSONS_POST]', error);
    return NextResponse.json({ error: 'Erreur lors de l\'enregistrement' }, { status: 500 });
  }
}
