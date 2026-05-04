import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import * as bcrypt from 'bcryptjs';

export async function GET() {
  const session = await getSession();
  if (session?.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Accès réservé au Super Administrateur' }, { status: 403 });
  }

  try {
    const schools = await prisma.school.findMany({
      include: {
        campuses: {
          include: {
            _count: { select: { students: true, classrooms: true } }
          }
        },
        _count: { select: { campuses: true, academicYears: true } },
        academicYears: { where: { isActive: true }, take: 1 }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Enrich each school with aggregated stats
    const enriched = await Promise.all(schools.map(async (school) => {
      const campusIds = school.campuses.map(c => c.id);
      const [studentCount, employeeCount, financialData] = await Promise.all([
        prisma.student.count({ where: { campusId: { in: campusIds } } }),
        prisma.employee.count({ where: { tenantId: school.id } }),
        prisma.invoice.groupBy({
          by: ['status'],
          where: { tenantId: school.id },
          _sum: { amount: true },
          _count: true
        })
      ]);

      const totalInvoiced = financialData.reduce((s, g) => s + (g._sum.amount || 0), 0);
      const totalPaid = financialData.find(g => g.status === 'PAID')?._sum.amount || 0;

      return {
        ...school,
        stats: {
          studentCount,
          employeeCount,
          classroomCount: school.campuses.reduce((s, c) => s + c._count.classrooms, 0),
          activeYear: school.academicYears[0]?.name || null,
          collectionRate: totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0,
          totalInvoiced,
          totalPaid
        }
      };
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('[SCHOOLS_GET]', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des écoles' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (session?.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { 
      name, code, type, email, phoneNumber, address, city, country, motto, plan,
      adminEmail, adminPassword, adminFirstName, adminLastName 
    } = body;

    if (!name || !code || !type || !adminEmail || !adminPassword) {
      return NextResponse.json({ error: 'Nom, code, type et informations admin sont obligatoires' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    const result = await prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: {
          name,
          code,
          type,
          email: email || '',
          phoneNumber: phoneNumber || '',
          address: address || '',
          city: city || '',
          country: country || 'Mali',
          motto,
          plan: plan || 'STARTER',
          isSetupComplete: false,
        }
      });

      await tx.user.create({
        data: {
          tenantId: school.id,
          email: adminEmail.toLowerCase().trim(),
          password: hashedPassword,
          firstName: adminFirstName || 'Admin',
          lastName: adminLastName || name,
          role: 'SCHOOL_ADMIN',
          isActive: true
        }
      });

      return school;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('[SCHOOLS_POST]', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Ce code d\'établissement ou email admin existe déjà' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
