import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const periodStart = url.searchParams.get('periodStart') || defaultStart;
  const periodEnd = url.searchParams.get('periodEnd') || defaultEnd;

  try {
    // 1. Récupérer tous les enseignants vacataires ou enseignants ayant des séances enregistrées
    const teachers = await prisma.employee.findMany({
      where: {
        tenantId: session.tenantId,
        isActive: true,
        OR: [
          { employeeType: 'TEACHER' },
          { contracts: { some: { contractType: 'TEMPORARY', status: 'ACTIVE' } } }
        ]
      },
      include: {
        contracts: {
          where: { status: 'ACTIVE' },
          take: 1
        },
        lessonLogs: {
          where: {
            date: {
              gte: new Date(`${periodStart}T00:00:00Z`),
              lte: new Date(`${periodEnd}T23:59:59Z`)
            }
          },
          include: {
            subject: { select: { name: true, code: true } },
            classroom: { select: { name: true } }
          },
          orderBy: { date: 'asc' }
        }
      }
    });

    const results = teachers.map((teacher, index) => {
      const activeContract = teacher.contracts[0];
      const hourlyRate = activeContract?.hourlyRate && activeContract.hourlyRate > 0 
        ? activeContract.hourlyRate 
        : 1750; // Tarif conventionné CFPPAS

      let executedHours = 0;
      let absentHours = 0;
      const subjectsSet = new Set<string>();
      const classesSet = new Set<string>();

      const lessonsDetail = teacher.lessonLogs.map((log) => {
        if (log.subject?.name) subjectsSet.add(log.subject.name);
        if (log.classroom?.name) classesSet.add(log.classroom.name);

        if (log.status === 'COMPLETED') {
          executedHours += log.hoursCount;
        } else if (log.status === 'ABSENT') {
          absentHours += (log.hoursCount > 0 ? log.hoursCount : 2); // standard 2h si 0
        }

        return {
          id: log.id,
          date: log.date,
          title: log.title,
          subject: log.subject?.name || 'Matière inconnue',
          classroom: log.classroom?.name || 'Classe inconnue',
          hoursCount: log.hoursCount,
          status: log.status
        };
      });

      const grossAmount = executedHours * hourlyRate;
      const deductions = 0;
      const netAmount = grossAmount - deductions;

      return {
        number: index + 1,
        id: teacher.id,
        name: `${teacher.firstName} ${teacher.lastName}`,
        employeeNumber: teacher.employeeNumber,
        subjects: Array.from(subjectsSet).join(', ') || 'Non spécifié',
        classes: Array.from(classesSet).join(', ') || '1ère A',
        totalHours: executedHours,
        absentHours,
        hourlyRate,
        grossAmount,
        deductions,
        netAmount,
        lessons: lessonsDetail
      };
    });

    // Trier pour afficher d'abord ceux qui ont des heures effectuées
    results.sort((a, b) => b.totalHours - a.totalHours);

    const totalHoursAll = results.reduce((sum, r) => sum + r.totalHours, 0);
    const totalGrossAll = results.reduce((sum, r) => sum + r.grossAmount, 0);
    const totalNetAll = results.reduce((sum, r) => sum + r.netAmount, 0);

    return NextResponse.json({
      periodStart,
      periodEnd,
      vacataires: results,
      totals: {
        totalHours: totalHoursAll,
        totalGross: totalGrossAll,
        totalNet: totalNetAll
      }
    });
  } catch (error) {
    console.error('[VACATAIRES_GET]', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des états vacataires' }, { status: 500 });
  }
}
