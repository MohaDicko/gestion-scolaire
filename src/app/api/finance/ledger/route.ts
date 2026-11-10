import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const allowedRoles = ['ACCOUNTANT', 'SCHOOL_ADMIN', 'SUPER_ADMIN'];
  if (!allowedRoles.includes(session.role)) {
    return NextResponse.json({ error: 'Accès refusé. Rôle non autorisé.' }, { status: 403 });
  }

  const tid = session.tenantId;
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '500', 10);
  const wantSummary = url.searchParams.get('summary') === 'true';

  try {
    // 1. Calcul des totaux globaux exacts via agrégations SQL directes (_sum)
    const [sumPayments, sumExpenses, sumPayslips] = await Promise.all([
      prisma.payment.aggregate({
        where: { tenantId: tid },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.expense.aggregate({
        where: { tenantId: tid },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.payslip.aggregate({
        where: { tenantId: tid, status: 'FINALIZED' },
        _sum: { netSalary: true },
        _count: { id: true },
      }),
    ]);

    const totalRevenue = sumPayments._sum.amount || 0;
    const totalExpensesDirect = sumExpenses._sum.amount || 0;
    const totalSalaries = sumPayslips._sum.netSalary || 0;
    const totalExpense = totalExpensesDirect + totalSalaries;
    const netBalance = totalRevenue - totalExpense;

    // 2. Récupération des mouvements comptables
    const [payments, expenses, payslips] = await Promise.all([
      prisma.payment.findMany({
        where: { tenantId: tid },
        include: {
          invoice: {
            select: {
              invoiceNumber: true,
              student: { select: { firstName: true, lastName: true, studentNumber: true } }
            }
          }
        },
        orderBy: { paymentDate: 'desc' },
        take: limit
      }),
      prisma.expense.findMany({
        where: { tenantId: tid },
        orderBy: { date: 'desc' },
        take: limit
      }),
      prisma.payslip.findMany({
        where: { tenantId: tid, status: 'FINALIZED' },
        include: { employee: { select: { firstName: true, lastName: true, employeeNumber: true } } },
        orderBy: { updatedAt: 'desc' },
        take: limit
      })
    ]);

    // 3. Consolidation unifiée au format SYSCOHADA
    const ledger = [
      ...payments.map(p => ({
        id: p.id,
        date: p.paymentDate,
        type: 'REVENUE',
        category: 'Scolarité (Cpt 706)',
        description: `Règlement Scolarité - ${p.invoice?.student?.firstName || ''} ${p.invoice?.student?.lastName || ''} (${p.invoice?.student?.studentNumber || ''})`,
        amount: Math.round(p.amount),
        method: p.method || 'ESPECES',
        reference: p.reference || p.invoice?.invoiceNumber || null
      })),
      ...expenses.map(e => ({
        id: e.id,
        date: e.date,
        type: 'EXPENSE',
        category: e.category || 'Charges Générales',
        description: e.description,
        amount: -Math.round(e.amount),
        method: 'DIVERS',
        reference: null
      })),
      ...payslips.map(p => ({
        id: p.id,
        date: p.updatedAt,
        type: 'EXPENSE',
        category: 'Rémunérations (Cpt 641/66)',
        description: `Honoraires / Salaire Net - ${p.employee?.firstName || ''} ${p.employee?.lastName || ''} (${p.employee?.employeeNumber || ''})`,
        amount: -Math.round(p.netSalary),
        method: 'VIREMENT',
        reference: null
      }))
    ];

    // Tri par date décroissante
    ledger.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (wantSummary) {
      return NextResponse.json({
        summary: {
          totalRevenue,
          totalExpense,
          netBalance,
          countPayments: sumPayments._count.id,
          countExpenses: sumExpenses._count.id,
          countPayslips: sumPayslips._count.id,
        },
        items: ledger,
      });
    }

    // Réponse directe en Array pour rétrocompatibilité totale
    return NextResponse.json(ledger);
  } catch (error) {
    console.error('[LEDGER GET]', error);
    return NextResponse.json({ error: 'Erreur lors de la consolidation comptable' }, { status: 500 });
  }
}
