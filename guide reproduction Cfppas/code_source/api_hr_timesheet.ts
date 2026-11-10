import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const DAY_LETTERS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']; // 0 = Dimanche, 1 = Lundi, etc.

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const year = parseInt(searchParams.get('year') || String(now.getFullYear()));
  const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1)); // 1-12

  const tid = session.tenantId;

  // Calculer tous les jours du mois
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysList: Array<{ day: number; letter: string; isSunday: boolean }> = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dayOfWeek = dateObj.getDay();
    const isSunday = dayOfWeek === 0;
    if (!isSunday) { // Exclure les dimanches conformément à la maquette
      daysList.push({
        day: d,
        letter: DAY_LETTERS[dayOfWeek],
        isSunday: false
      });
    }
  }

  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month - 1, daysInMonth, 23, 59, 59));

  try {
    // 1. Récupérer tous les enseignants vacataires et leurs contrats
    const teachers = await prisma.employee.findMany({
      where: {
        tenantId: tid,
        isActive: true,
        OR: [
          { employeeType: 'TEACHER' },
          { contracts: { some: { status: 'ACTIVE' } } }
        ]
      },
      include: {
        contracts: { where: { status: 'ACTIVE' }, take: 1 },
        lessonLogs: {
          where: {
            date: { gte: startDate, lte: endDate }
          },
          include: {
            subject: { select: { name: true, code: true } },
            classroom: { select: { name: true } }
          },
          orderBy: { date: 'asc' }
        }
      }
    });

    const rows: any[] = [];
    let counter = 1;

    for (const teacher of teachers) {
      const activeContract = teacher.contracts[0];
      const rate = activeContract?.hourlyRate && activeContract.hourlyRate > 0 ? activeContract.hourlyRate : 1750;

      // Grouper par matière et classe si plusieurs, sinon ligne unique
      const logsByCourse = new Map<string, any[]>();

      if (teacher.lessonLogs.length > 0) {
        for (const log of teacher.lessonLogs) {
          const key = `${log.subject?.name || 'Matière'}__${log.classroom?.name || 'Classe'}`;
          if (!logsByCourse.has(key)) logsByCourse.set(key, []);
          logsByCourse.get(key)!.push(log);
        }
      } else {
        // Enseignant sans séances enregistrées ce mois-ci
        logsByCourse.set('Modules Agro-Pastoraux__1ère A', []);
      }

      for (const [key, logs] of Array.from(logsByCourse.entries())) {
        const [subjectName, className] = key.split('__');
        const dayHours: Record<number, number> = {};
        const dayStatuses: Record<number, string> = {};
        let totalHours = 0;

        for (const log of logs) {
          const d = new Date(log.date).getUTCDate();
          if (log.status === 'COMPLETED') {
            dayHours[d] = (dayHours[d] || 0) + log.hoursCount;
            totalHours += log.hoursCount;
            dayStatuses[d] = 'COMPLETED';
          } else if (log.status === 'ABSENT') {
            dayHours[d] = 0;
            dayStatuses[d] = 'ABSENT';
          }
        }

        const heuresPrevues = totalHours > 0 ? Math.max(totalHours, 20) : 20; // 20h quota standard mensuel
        const heuresPerdues = Math.max(0, heuresPrevues - totalHours);
        const montant = totalHours * rate;

        rows.push({
          number: counter++,
          employeeId: teacher.id,
          teacherName: `${teacher.firstName} ${teacher.lastName}`,
          subject: subjectName,
          classroom: className,
          dayHours,
          dayStatuses,
          totalHours,
          heuresPrevues,
          heuresPerdues,
          rate,
          montant
        });
      }
    }

    const totalHoursAll = rows.reduce((s, r) => s + r.totalHours, 0);
    const totalPrevuesAll = rows.reduce((s, r) => s + r.heuresPrevues, 0);
    const totalPerduesAll = rows.reduce((s, r) => s + r.heuresPerdues, 0);
    const totalMontantAll = rows.reduce((s, r) => s + r.montant, 0);

    return NextResponse.json({
      year,
      month,
      daysList,
      rows,
      totals: {
        totalHours: totalHoursAll,
        totalPrevues: totalPrevuesAll,
        totalPerdues: totalPerduesAll,
        totalMontant: totalMontantAll
      }
    });
  } catch (error) {
    console.error('[TIMESHEET_GET]', error);
    return NextResponse.json({ error: 'Erreur lors du calcul du tableau utilitaire' }, { status: 500 });
  }
}
