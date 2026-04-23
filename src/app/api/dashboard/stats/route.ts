import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || !session.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [studentsCount, employeesCount, invoiceStats] = await Promise.all([
      prisma.student.count({ where: { tenantId: session.tenantId } }),
      prisma.employee.count({ where: { tenantId: session.tenantId } }),
      prisma.invoice.aggregate({
        where: { tenantId: session.tenantId },
        _sum: { amount: true },
      }),
    ]);

    const paidStats = await prisma.invoice.aggregate({
      where: { tenantId: session.tenantId, status: 'PAID' },
      _sum: { amount: true },
    });

    return NextResponse.json({
      studentsCount,
      employeesCount,
      invoicesTotal: invoiceStats._sum.amount || 0,
      invoicesPaid: paidStats._sum.amount || 0
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
