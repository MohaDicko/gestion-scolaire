import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tid = session.tenantId;

  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { label: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }), start: d, end: new Date(d.getFullYear(), d.getMonth() + 1, 0) };
  });

  const [
    totalStudents, activeStudents,
    totalEmployees,
    allInvoices,
    attendanceRecords,
    gradesData,
    expensesData,
    pendingLeaves,
    classrooms,
  ] = await Promise.all([
    prisma.student.count({ where: { tenantId: tid } }),
    prisma.student.count({ where: { tenantId: tid, isActive: true } }),
    prisma.employee.count({ where: { tenantId: tid, isActive: true } }),
    prisma.invoice.findMany({ where: { tenantId: tid }, select: { amount: true, status: true, paidDate: true, createdAt: true } }),
    prisma.attendance.findMany({ where: { tenantId: tid, date: { gte: startOfYear } }, select: { status: true, date: true } }),
    prisma.grade.findMany({ where: { student: { tenantId: tid } }, select: { score: true, maxScore: true, trimestre: true, createdAt: true } }),
    prisma.expense.findMany({ where: { tenantId: tid, date: { gte: startOfYear } }, select: { amount: true, date: true, category: true } }),
    prisma.leaveRequest.count({ where: { tenantId: tid, status: 'PENDING' } }),
    prisma.classroom.findMany({ where: { tenantId: tid }, select: { id: true, name: true, maxCapacity: true, enrollments: { select: { id: true } } } }),
  ]);

  // Finance KPIs
  const totalRevenue = allInvoices.reduce((s, i) => s + i.amount, 0);
  const paidRevenue = allInvoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.amount, 0);
  const pendingRevenue = allInvoices.filter(i => i.status === 'UNPAID').reduce((s, i) => s + i.amount, 0);
  const collectionRate = totalRevenue > 0 ? Math.round((paidRevenue / totalRevenue) * 100) : 0;

  // Finance par mois
  const revenueByMonth = last6Months.map(m => ({
    label: m.label,
    revenue: allInvoices.filter(i => i.status === 'PAID' && i.paidDate && new Date(i.paidDate) >= m.start && new Date(i.paidDate) <= m.end).reduce((s, i) => s + i.amount, 0),
    expenses: expensesData.filter(e => new Date(e.date) >= m.start && new Date(e.date) <= m.end).reduce((s, e) => s + e.amount, 0),
  }));

  // Présence
  const totalAttendance = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(a => a.status === 'PRESENT').length;
  const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

  // Notes moyennes par trimestre
  const gradesByTrimestre = [1, 2, 3].map(t => {
    const tGrades = gradesData.filter(g => g.trimestre === t);
    const avg = tGrades.length > 0 ? tGrades.reduce((s, g) => s + (g.score / g.maxScore) * 20, 0) / tGrades.length : 0;
    return { trimestre: `T${t}`, moyenne: Math.round(avg * 10) / 10, count: tGrades.length };
  });

  // Répartition mention
  const allAvgs = gradesData.map(g => (g.score / g.maxScore) * 20);
  const mentions = {
    excellent: allAvgs.filter(a => a >= 16).length,
    bien: allAvgs.filter(a => a >= 14 && a < 16).length,
    assezBien: allAvgs.filter(a => a >= 12 && a < 14).length,
    passable: allAvgs.filter(a => a >= 10 && a < 12).length,
    insuffisant: allAvgs.filter(a => a < 10).length,
  };

  // Capacité des classes
  const classroomStats = classrooms.map(c => ({
    name: c.name,
    enrolled: c.enrollments.length,
    capacity: c.maxCapacity,
    rate: c.maxCapacity > 0 ? Math.round((c.enrollments.length / c.maxCapacity) * 100) : 0,
  })).sort((a, b) => b.rate - a.rate).slice(0, 8);

  // Dépenses par catégorie
  const expensesByCategory = expensesData.reduce((acc: Record<string, number>, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  return NextResponse.json({
    academic: { totalStudents, activeStudents, totalEmployees, attendanceRate, gradesByTrimestre, mentions, classroomStats },
    finance: { totalRevenue, paidRevenue, pendingRevenue, collectionRate, revenueByMonth, expensesByCategory },
    hr: { totalEmployees, pendingLeaves },
    meta: { generatedAt: now.toISOString(), tenantId: tid },
  });
}
