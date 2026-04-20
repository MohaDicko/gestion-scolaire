import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || !session.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [studentsCount, employeesCount, invoices] = await Promise.all([
      prisma.student.count({ where: { tenantId: session.tenantId } }),
      prisma.employee.count({ where: { tenantId: session.tenantId } }),
      prisma.invoice.findMany({
        where: { tenantId: session.tenantId },
        select: { amount: true, status: true }
      })
    ]);

    const invoicesTotal = invoices.reduce((acc, inv) => acc + inv.amount, 0);
    const invoicesPaid = invoices
      .filter(inv => inv.status === 'PAID')
      .reduce((acc, inv) => acc + inv.amount, 0);

    return NextResponse.json({
      studentsCount,
      employeesCount,
      invoicesTotal,
      invoicesPaid
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
