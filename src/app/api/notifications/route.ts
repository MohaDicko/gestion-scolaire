import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tid = session.tenantId;

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const notifications: Array<{
    id: string; type: string; priority: 'high' | 'medium' | 'low';
    title: string; message: string; href: string; createdAt: string;
  }> = [];

  const [overdueInvoices, pendingLeaves, recentAbsences, expiringContracts] = await Promise.all([
    prisma.invoice.findMany({
      where: { tenantId: tid, status: 'UNPAID', dueDate: { lt: now } },
      include: { student: { select: { firstName: true, lastName: true } } },
      take: 10, orderBy: { dueDate: 'asc' },
    }),
    prisma.leaveRequest.findMany({
      where: { tenantId: tid, status: 'PENDING' },
      include: { employee: { select: { firstName: true, lastName: true } } },
      take: 5,
    }),
    prisma.attendance.findMany({
      where: { tenantId: tid, status: 'ABSENT', date: { gte: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) } },
      include: { student: { select: { firstName: true, lastName: true } } },
      take: 5,
    }),
    prisma.contract.findMany({
      where: { tenantId: tid, status: 'ACTIVE', endDate: { gte: now, lte: in7Days } },
      include: { employee: { select: { firstName: true, lastName: true } } },
      take: 5,
    }),
  ]);

  // Factures en retard
  if (overdueInvoices.length > 0) {
    const total = overdueInvoices.reduce((s, i) => s + i.amount, 0);
    notifications.push({
      id: 'inv-overdue', type: 'finance', priority: 'high',
      title: `${overdueInvoices.length} facture(s) en retard`,
      message: `${total.toLocaleString('fr-FR')} FCFA impayés. Dernière échéance dépassée : ${overdueInvoices[0].student?.firstName} ${overdueInvoices[0].student?.lastName}.`,
      href: '/invoices', createdAt: now.toISOString(),
    });
  }

  // Congés en attente
  pendingLeaves.forEach(l => {
    notifications.push({
      id: `leave-${l.id}`, type: 'hr', priority: 'medium',
      title: 'Demande de congé à valider',
      message: `${l.employee.firstName} ${l.employee.lastName} demande un congé (${l.type}) du ${new Date(l.startDate).toLocaleDateString('fr-FR')} au ${new Date(l.endDate).toLocaleDateString('fr-FR')}.`,
      href: '/hr/leaves', createdAt: l.startDate.toISOString(),
    });
  });

  // Absences récentes
  if (recentAbsences.length >= 3) {
    notifications.push({
      id: 'abs-recent', type: 'attendance', priority: 'medium',
      title: `${recentAbsences.length} absences ces 3 derniers jours`,
      message: `Dont : ${recentAbsences.slice(0, 2).map(a => `${a.student.firstName} ${a.student.lastName}`).join(', ')}...`,
      href: '/attendance', createdAt: now.toISOString(),
    });
  }

  // Contrats expirant
  expiringContracts.forEach(c => {
    notifications.push({
      id: `contract-${c.id}`, type: 'hr', priority: 'high',
      title: 'Contrat expirant bientôt',
      message: `Le contrat de ${c.employee.firstName} ${c.employee.lastName} expire le ${c.endDate ? new Date(c.endDate).toLocaleDateString('fr-FR') : '—'}.`,
      href: '/employees', createdAt: now.toISOString(),
    });
  });

  // Trier par priorité
  const order = { high: 0, medium: 1, low: 2 };
  notifications.sort((a, b) => order[a.priority] - order[b.priority]);

  return NextResponse.json({ notifications, count: notifications.length });
}
