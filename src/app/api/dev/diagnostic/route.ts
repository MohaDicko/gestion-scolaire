import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== 'sahel_prod_seed_2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const report: any = {
      timestamp: new Date().toISOString(),
      database: {
        schools: await prisma.school.count(),
        students: await prisma.student.count(),
        users: await prisma.user.count(),
        enrollments: await prisma.enrollment.count(),
        grades: await prisma.grade.count(),
        campuses: await prisma.campus.count(),
      },
      accounting: {
        totalInvoiced: (await prisma.invoice.aggregate({ _sum: { amount: true } }))._sum.amount || 0,
        totalPayments: (await prisma.payment.aggregate({ _sum: { amount: true } }))._sum.amount || 0,
      },
      pedagogy: {
        timetables: await prisma.timetable.count(),
        subjects: await prisma.subject.count(),
      },
      health: 'OK'
    };

    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
