import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

const TIME_SLOTS = [
  { start: '08:00', end: '10:00' },
  { start: '10:00', end: '12:00' },
  { start: '14:00', end: '16:00' },
  { start: '16:00', end: '18:00' },
];

const DAYS = [1, 2, 3, 4, 5]; // Lundi to Vendredi

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!['SUPER_ADMIN', 'SCHOOL_ADMIN', 'DIRECTEUR_DES_ETUDES'].includes(session.role)) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  try {
    const { classroomId } = await request.json();
    if (!classroomId) return NextResponse.json({ error: 'classroomId est requis' }, { status: 400 });

    // 1. Check if classroom exists and belongs to tenant
    const classroom = await prisma.classroom.findFirst({
      where: { id: classroomId, tenantId: session.tenantId }
    });
    if (!classroom) return NextResponse.json({ error: 'Classe introuvable' }, { status: 404 });

    // 2. Fetch all subjects and teachers for the tenant
    const [subjects, teachers] = await Promise.all([
      prisma.subject.findMany({ where: { tenantId: session.tenantId } }),
      prisma.employee.findMany({ 
        where: { tenantId: session.tenantId, employeeType: 'TEACHER', isActive: true } 
      })
    ]);

    if (subjects.length === 0 || teachers.length === 0) {
      return NextResponse.json({ error: 'Matières ou enseignants insuffisants pour la génération' }, { status: 400 });
    }

    // 3. Clear existing timetable for this classroom to avoid duplicates
    await prisma.timetable.deleteMany({
      where: { classroomId, tenantId: session.tenantId }
    });

    // 4. SMART GENERATION ALGORITHM (IA Simulation)
    const newSlots = [];
    
    for (const day of DAYS) {
      for (const slot of TIME_SLOTS) {
        // Find a teacher who is NOT busy in another classroom at this day/time
        // For simplicity in this "v1", we'll pick a teacher and subject
        // In a real IA, we'd check availability across the whole school
        
        const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
        const randomTeacher = teachers[Math.floor(Math.random() * teachers.length)];

        newSlots.push({
          tenantId: session.tenantId,
          classroomId,
          subjectId: randomSubject.id,
          employeeId: randomTeacher.id,
          dayOfWeek: day,
          startTime: slot.start,
          endTime: slot.end,
        });
      }
    }

    // 5. Bulk Create
    const result = await prisma.timetable.createMany({
      data: newSlots
    });

    await logAudit({
      request,
      action: 'CREATE',
      entityType: 'Timetable',
      entityId: classroomId,
      description: `Génération automatique de l'emploi du temps pour la classe ${classroom.name} (${result.count} créneaux)`,
    });

    return NextResponse.json({ success: true, count: result.count });

  } catch (error: any) {
    console.error('[TIMETABLE_GENERATE]', error.message);
    return NextResponse.json({ error: 'Erreur lors de la génération automatique' }, { status: 500 });
  }
}
