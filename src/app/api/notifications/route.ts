import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const tid = session.tenantId;
  const role = session.role;
  const userEmail = session.email;

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const notifications: Array<{
    id: string; type: string; priority: 'high' | 'medium' | 'low';
    title: string; message: string; href: string; createdAt: string;
  }> = [];

  if (role === 'PARENT' || role === 'STUDENT') {
    // ── Logic for Families ──
    const studentFilter = role === 'PARENT' ? { parentEmail: userEmail } : { studentNumber: userEmail.split('@')[0].toUpperCase() };
    const students = await prisma.student.findMany({
      where: { tenantId: tid, ...studentFilter }
    });
    const studentIds = students.map(s => s.id);

    const [absences, invoices] = await Promise.all([
      prisma.attendance.findMany({
        where: { tenantId: tid, studentId: { in: studentIds }, status: 'ABSENT' },
        include: { student: true },
        take: 5, orderBy: { date: 'desc' }
      }),
      prisma.invoice.findMany({
        where: { tenantId: tid, studentId: { in: studentIds }, status: 'UNPAID' },
        include: { student: true },
        take: 5
      })
    ]);

    absences.forEach(a => {
      notifications.push({
        id: `abs-${a.id}`, type: 'attendance', priority: 'high',
        title: `Absence signalée : ${a.student.firstName}`,
        message: `Votre enfant a été marqué absent le ${new Date(a.date).toLocaleDateString('fr-FR')}.`,
        href: '/dashboard', createdAt: a.date.toISOString()
      });
    });

    invoices.forEach(i => {
      notifications.push({
        id: `inv-${i.id}`, type: 'finance', priority: 'high',
        title: `Paiement en attente : ${i.student.firstName}`,
        message: `La facture "${i.title}" de ${i.amount.toLocaleString()} FCFA est impayée.`,
        href: '/invoices', createdAt: i.createdAt.toISOString()
      });
    });

  } else {
    // ── Global Logic for Staff/Admin ──
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

    if (overdueInvoices.length > 0) {
      notifications.push({
        id: 'inv-overdue', type: 'finance', priority: 'high',
        title: `${overdueInvoices.length} facture(s) en retard`,
        message: `${overdueInvoices.length} élèves ont dépassé leur échéance de paiement.`,
        href: '/invoices', createdAt: now.toISOString(),
      });
    }

    pendingLeaves.forEach(l => {
      notifications.push({
        id: `leave-${l.id}`, type: 'hr', priority: 'medium',
        title: 'Congé à valider',
        message: `${l.employee.firstName} ${l.employee.lastName} demande un congé.`,
        href: '/hr/leaves', createdAt: l.startDate.toISOString(),
      });
    });

    if (recentAbsences.length > 0) {
      notifications.push({
        id: 'abs-recent', type: 'attendance', priority: 'medium',
        title: `${recentAbsences.length} absences récentes`,
        message: `Dernière absence : ${recentAbsences[0].student.firstName} ${recentAbsences[0].student.lastName}.`,
        href: '/attendance', createdAt: now.toISOString(),
      });
    }
  }

  // Sort and return
  const order = { high: 0, medium: 1, low: 2 };
  notifications.sort((a, b) => order[a.priority as keyof typeof order] - order[b.priority as keyof typeof order]);

  return NextResponse.json({ notifications, count: notifications.length });
}
