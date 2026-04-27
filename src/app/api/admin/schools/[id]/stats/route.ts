import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (session?.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  try {
    const school = await prisma.school.findUnique({
      where: { id },
      include: {
        campuses: {
          include: {
            _count: { select: { students: true, classrooms: true } }
          }
        },
        academicYears: { orderBy: { startDate: 'desc' }, take: 5 }
      }
    });

    if (!school) return NextResponse.json({ error: 'École introuvable' }, { status: 404 });

    // Aggregate counts across all campuses of this school
    const campusIds = school.campuses.map(c => c.id);

    const [studentCount, classroomCount, employeeCount, activeYear] = await Promise.all([
      prisma.student.count({ where: { campusId: { in: campusIds } } }),
      prisma.classroom.count({ where: { campusId: { in: campusIds } } }),
      prisma.employee.count({ where: { tenantId: id } }),
      prisma.academicYear.findFirst({ where: { tenantId: id, isActive: true } })
    ]);

    // Financial summary
    const [totalInvoiced, totalPaid, unpaidCount] = await Promise.all([
      prisma.invoice.aggregate({
        where: { tenantId: id },
        _sum: { amount: true }
      }),
      prisma.invoice.aggregate({
        where: { tenantId: id, status: 'PAID' },
        _sum: { amount: true }
      }),
      prisma.invoice.count({ where: { tenantId: id, status: 'UNPAID' } })
    ]);

    // Recent students (last 5)
    const recentStudents = await prisma.student.findMany({
      where: { campusId: { in: campusIds } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, firstName: true, lastName: true, studentNumber: true, createdAt: true, campus: { select: { name: true } } }
    });

    return NextResponse.json({
      school,
      stats: {
        studentCount,
        classroomCount,
        campusCount: school.campuses.length,
        employeeCount,
        academicYearCount: school.academicYears.length,
        activeYear: activeYear?.name || 'Non définie',
        financial: {
          totalInvoiced: totalInvoiced._sum.amount || 0,
          totalPaid: totalPaid._sum.amount || 0,
          collectionRate: totalInvoiced._sum.amount
            ? Math.round(((totalPaid._sum.amount || 0) / totalInvoiced._sum.amount) * 100)
            : 0,
          unpaidCount
        }
      },
      recentStudents
    });
  } catch (error) {
    console.error('[SCHOOL_STATS]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
