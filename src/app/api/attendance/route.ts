import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const classroomId = url.searchParams.get('classroomId');
  const dateStr = url.searchParams.get('date');

  if (!classroomId || !dateStr) {
     return NextResponse.json({ error: 'classroomId et date requis' }, { status: 400 });
  }

  try {
    const targetDate = new Date(dateStr);
    
    // On récupère tous les élèves de la classe
    const enrollments = await prisma.enrollment.findMany({
      where: { classroomId },
      include: {
        student: true
      }
    });

    // On récupère les présences déjà enregistrées
    const attendances = await prisma.attendance.findMany({
      where: {
        classroomId,
        date: {
          gte: new Date(targetDate.setHours(0, 0, 0, 0)),
          lte: new Date(targetDate.setHours(23, 59, 59, 999))
        }
      }
    });

    // On prépare le tableau final
    const merged = enrollments.map(e => {
       const existing = attendances.find(a => a.studentId === e.studentId);
       return {
         studentId: e.studentId,
         studentName: `${e.student.firstName} ${e.student.lastName}`,
         matricule: e.student.studentNumber,
         status: existing ? existing.status : 'PRESENT', // default
         notes: existing?.notes || ''
       };
    });

    return NextResponse.json(merged);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { classroomId, date, records } = await request.json();
    const targetDate = new Date(date);

    // Upsert attendances
    await Promise.all(records.map(async (rec: any) => {
      // Find existing
      const existing = await prisma.attendance.findFirst({
        where: {
          studentId: rec.studentId,
          classroomId,
          date: {
            gte: new Date(targetDate.setHours(0, 0, 0, 0)),
            lte: new Date(targetDate.setHours(23, 59, 59, 999))
          }
        }
      });

      if (existing) {
        return prisma.attendance.update({
          where: { id: existing.id },
          data: { status: rec.status, notes: rec.notes }
        });
      } else {
        return prisma.attendance.create({
          data: {
            tenantId: '1',
            studentId: rec.studentId,
            classroomId,
            date: targetDate,
            status: rec.status,
            notes: rec.notes
          }
        });
      }
    }));

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
