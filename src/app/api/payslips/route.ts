import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const payslips = await prisma.payslip.findMany({
      where: { tenantId: session.tenantId },
      include: {
        employee: { select: { firstName: true, lastName: true, employeeNumber: true } }
      },
      orderBy: { periodEnd: 'desc' }
    });
    return NextResponse.json(payslips);
  } catch (error) {
    console.error('[PAYSLIPS GET]', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Only HR managers and admins can create payslips
  if (!['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR_MANAGER'].includes(session.role)) {
    return NextResponse.json({ error: 'Accès refusé — droits insuffisants' }, { status: 403 });
  }

  try {
    const { employeeId, periodStart, periodEnd, baseSalary, deductions, bonuses } = await request.json();

    if (!employeeId || !periodStart || !periodEnd || !baseSalary) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
    }

    // Verify the employee belongs to this tenant
    const employee = await prisma.employee.findFirst({ where: { id: employeeId, tenantId: session.tenantId } });
    if (!employee) return NextResponse.json({ error: 'Employé introuvable ou accès non autorisé' }, { status: 403 });

    const numBase = parseFloat(baseSalary);
    if (isNaN(numBase) || numBase < 0) {
      return NextResponse.json({ error: 'Salaire de base invalide' }, { status: 400 });
    }

    const netSalary = numBase + (parseFloat(bonuses) || 0) - (parseFloat(deductions) || 0);

    const payslip = await prisma.payslip.create({
      data: {
        tenantId: session.tenantId,
        employeeId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        baseSalary: numBase,
        netSalary,
        status: 'FINALIZED'
      }
    });

    return NextResponse.json(payslip, { status: 201 });
  } catch (error: any) {
    console.error('[PAYSLIPS POST]', error.message);
    return NextResponse.json({ error: 'Erreur lors de la création du bulletin' }, { status: 400 });
  }
}
