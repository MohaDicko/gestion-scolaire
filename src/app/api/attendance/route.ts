import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !session.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
      where: { 
        classroomId,
        student: { tenantId: session.tenantId } 
      },
      include: {
        student: true
      }
    });

    // On récupère les présences déjà enregistrées
    const attendances = await prisma.attendance.findMany({
      where: {
        tenantId: session.tenantId,
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

import { sendAbsenceAlert } from '@/lib/email';

// ... existing GET handler ...

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !session.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { classroomId, date, records } = await request.json();
    const targetDate = new Date(date);

    // Upsert attendances
    await Promise.all(records.map(async (rec: any) => {
      // Find existing
      const existing = await prisma.attendance.findFirst({
        where: {
          tenantId: session.tenantId,
          studentId: rec.studentId,
          classroomId,
          date: {
            gte: new Date(targetDate.setHours(0, 0, 0, 0)),
            lte: new Date(targetDate.setHours(23, 59, 59, 999))
          }
        }
      });

      let attendance;
      if (existing) {
        attendance = await prisma.attendance.update({
          where: { id: existing.id },
          data: { status: rec.status, notes: rec.notes }
        });
      } else {
        attendance = await prisma.attendance.create({
          data: {
            tenantId: session.tenantId,
            studentId: rec.studentId,
            classroomId,
            date: targetDate,
            status: rec.status,
            notes: rec.notes
          }
        });
      }

      // If marked ABSENT, notify parent (only if newly absent to avoid spam)
      const isNewlyAbsent = rec.status === 'ABSENT' && (!existing || existing.status !== 'ABSENT');
      
      if (isNewlyAbsent) {
        const student = await prisma.student.findUnique({
          where: { id: rec.studentId },
          select: { firstName: true, parentEmail: true }
        });
        
        if (student?.parentEmail) {
          sendAbsenceAlert(student.parentEmail, student.firstName, targetDate.toLocaleDateString('fr-FR'))
            .catch(err => console.error('Failed to send absence alert:', err));
        }
      }
      
      return attendance;
    }));

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    console.error('Attendance POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
