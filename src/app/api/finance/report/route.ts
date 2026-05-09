import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

  const tid = session.tenantId;
  const startDate = new Date(`${year}-01-01T00:00:00Z`);
  const endDate   = new Date(`${year}-12-31T23:59:59Z`);

  try {
    const school = await prisma.school.findUnique({ where: { id: tid }, select: { name: true, code: true, city: true } });

    const [invoices, payments, expenses, payslips] = await Promise.all([
      // All invoices created this year
      prisma.invoice.findMany({
        where: { tenantId: tid, createdAt: { gte: startDate, lte: endDate } },
        select: { amount: true, status: true, dueDate: true, createdAt: true, title: true }
      }),
      // All payments received this year (actual collected revenue)
      prisma.payment.findMany({
        where: { tenantId: tid, paymentDate: { gte: startDate, lte: endDate } },
        select: { amount: true, paymentDate: true, method: true }
      }),
      // Expenses this year
      prisma.expense.findMany({
        where: { tenantId: tid, date: { gte: startDate, lte: endDate } },
        select: { amount: true, category: true, description: true, date: true, status: true }
      }),
      // Payslips this year
      prisma.payslip.findMany({
        where: { tenantId: tid, periodStart: { gte: startDate, lte: endDate } },
        select: { netSalary: true, grossSalary: true, totalDeductions: true, its: true, periodStart: true }
      })
    ]);

    // Revenue calculations
    const totalInvoiced   = invoices.reduce((s, i) => s + i.amount, 0);
    const totalCollected  = payments.reduce((s, p) => s + p.amount, 0);
    const totalOutstanding = Math.max(0, totalInvoiced - totalCollected);
    const collectionRate  = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

    // Expenses
    const totalExpenses  = expenses.filter(e => e.status === 'PAID').reduce((s, e) => s + e.amount, 0);
    const expenseByCategory = expenses.reduce((acc: Record<string, number>, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});

    // Payroll
    const totalPayroll        = payslips.reduce((s, p) => s + (p.grossSalary || 0), 0);
    const totalNetPaid        = payslips.reduce((s, p) => s + (p.netSalary || 0), 0);
    const totalSocialCharges  = payslips.reduce((s, p) => s + (p.totalDeductions || 0) + (p.its || 0), 0);

    // Net balance
    const totalCharges  = totalExpenses + totalPayroll;
    const netBalance    = totalCollected - totalCharges;

    // Monthly breakdown (based on payments collected and expenses/payroll paid)
    const months = Array.from({ length: 12 }, (_, i) => {
      const label = new Date(year, i, 1).toLocaleDateString('fr-FR', { month: 'short' });
      const revenue = payments.filter(p => new Date(p.paymentDate).getMonth() === i).reduce((s, p) => s + p.amount, 0);
      const expense = expenses.filter(e => new Date(e.date).getMonth() === i).reduce((s, e) => s + e.amount, 0);
      const payroll = payslips.filter(p => new Date(p.periodStart).getMonth() === i).reduce((s, p) => s + (p.netSalary || 0), 0);
      return { month: i + 1, label, revenue, expense, payroll, net: revenue - expense - payroll };
    });

    return NextResponse.json({
      school,
      year,
      generatedAt: new Date().toISOString(),
      revenue: { totalInvoiced, totalCollected, totalOutstanding, collectionRate, invoiceCount: invoices.length, paymentCount: payments.length },
      expenses: { totalExpenses, byCategory: expenseByCategory, count: expenses.length },
      payroll: { totalPayroll, totalNetPaid, totalSocialCharges, count: payslips.length },
      summary: { totalCharges, netBalance, profitMargin: totalCollected > 0 ? Math.round((netBalance / totalCollected) * 100) : 0 },
      monthly: months
    });
  } catch (error) {
    console.error('[FINANCE_REPORT]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
