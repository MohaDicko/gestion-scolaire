import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/parent/children — retourne les enfants liés à l'email du parent connecté
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Le parent est identifié par son email dans la session
    const children = await prisma.student.findMany({
      where: {
        tenantId: session.tenantId ?? undefined,
        parentEmail: session.email,
        isActive: true,
      },
      include: {
        campus: { select: { name: true } },
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            classroom: { select: { name: true, level: true } },
            academicYear: { select: { name: true, isActive: true } },
          },
          orderBy: { enrollmentDate: 'desc' },
          take: 1,
        },
        Attendance: {
          orderBy: { date: 'desc' },
          take: 30,
          select: { status: true, date: true },
        },
        Invoice: {
          where: { status: 'UNPAID' },
          select: { amount: true, dueDate: true, title: true },
          orderBy: { dueDate: 'asc' },
        },
        Grade: {
          include: { subject: { select: { name: true, coefficient: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    const result = children.map(child => {
      const totalAttendance = child.Attendance.length;
      const presentCount = child.Attendance.filter(a => a.status === 'PRESENT').length;
      const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : null;

      const grades = child.Grade;
      const generalAvg = grades.length > 0
        ? Math.round((grades.reduce((s, g) => s + (g.score / g.maxScore) * 20, 0) / grades.length) * 10) / 10
        : null;

      const totalUnpaid = child.Invoice.reduce((s, i) => s + i.amount, 0);

      return {
        id: child.id,
        studentNumber: child.studentNumber,
        firstName: child.firstName,
        lastName: child.lastName,
        gender: child.gender,
        photoUrl: child.photoUrl,
        campus: child.campus?.name,
        currentClass: child.enrollments[0]?.classroom?.name ?? null,
        currentLevel: child.enrollments[0]?.classroom?.level ?? null,
        academicYear: child.enrollments[0]?.academicYear?.name ?? null,
        attendanceRate,
        generalAverage: generalAvg,
        unpaidAmount: totalUnpaid,
        unpaidCount: child.Invoice.length,
        nextDue: child.Invoice[0] ?? null,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[PARENT/CHILDREN GET]', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
