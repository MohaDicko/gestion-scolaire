import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const session = await getSession();
  if (session?.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Accès refusé. Réservé au Super Admin.' }, { status: 403 });
  }

  try {
    // Dans une vraie application, on vérifierait ici le token JWT
    // pour s'assurer que l'utilisateur est bien un SUPER_ADMIN.
    
    // 1. Statistiques des établissements
    const totalSchools = await prisma.school.count();
    const activeSchools = await prisma.school.count({ where: { isActive: true } });
    
    // 2. Statistiques des utilisateurs globaux
    const totalStudents = await prisma.student.count({ where: { isActive: true } });
    const totalEmployees = await prisma.employee.count({ where: { isActive: true } });
    const totalUsers = await prisma.user.count({ where: { isActive: true } });

    // 3. Finance Globale (SaaS Revenue vs Schools Revenue)
    // Ici, on fait la somme de toutes les factures payées de toutes les écoles
    const revenueAggr = await prisma.invoice.aggregate({
      _sum: { amount: true },
      where: { status: 'PAID' }
    });
    
    const totalRevenue = revenueAggr._sum.amount || 0;

    // 4. Activité récente (dernières écoles créées)
    const recentSchools = await prisma.school.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, type: true, createdAt: true, city: true }
    });

    return NextResponse.json({
      totalSchools,
      activeSchools,
      totalStudents,
      totalEmployees,
      totalUsers,
      totalRevenue,
      recentSchools
    });
  } catch (error) {
    console.error('Error fetching global admin stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
