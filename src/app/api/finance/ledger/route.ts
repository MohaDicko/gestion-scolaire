import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tid = session.tenantId;

  try {
    // We want to fetch all financial movements:
    // 1. Payments (Revenue)
    // 2. Expenses (Cost)
    // 3. Payslips (Cost - Salary)

    const [payments, expenses, payslips] = await Promise.all([
      prisma.payment.findMany({
        where: { tenantId: tid },
        include: { invoice: { select: { student: { select: { firstName: true, lastName: true } } } } },
        orderBy: { paymentDate: 'desc' },
        take: 50
      }),
      prisma.expense.findMany({
        where: { tenantId: tid },
        orderBy: { date: 'desc' },
        take: 50
      }),
      prisma.payslip.findMany({
        where: { tenantId: tid, status: 'FINALIZED' },
        include: { employee: { select: { firstName: true, lastName: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 50
      })
    ]);

    // Consolidate into a unified ledger format
    const ledger = [
      ...payments.map(p => ({
        id: p.id,
        date: p.paymentDate,
        type: 'REVENUE',
        category: 'Scolarité',
        description: `Paiement Reçu - ${p.invoice.student.firstName} ${p.invoice.student.lastName}`,
        amount: p.amount,
        method: p.method,
        reference: p.reference
      })),
      ...expenses.map(e => ({
        id: e.id,
        date: e.date,
        type: 'EXPENSE',
        category: e.category,
        description: e.description,
        amount: -e.amount,
        method: 'DIVERS',
        reference: null
      })),
      ...payslips.map(p => ({
        id: p.id,
        date: p.updatedAt,
        type: 'EXPENSE',
        category: 'Salaires',
        description: `Salaire Net - ${p.employee.firstName} ${p.employee.lastName}`,
        amount: -p.netSalary,
        method: 'VIREMENT',
        reference: null
      }))
    ];

    // Sort by date descending
    ledger.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(ledger);
  } catch (error) {
    console.error('[LEDGER GET]', error);
    return NextResponse.json({ error: 'Erreur lors de la consolidation comptable' }, { status: 500 });
  }
}
