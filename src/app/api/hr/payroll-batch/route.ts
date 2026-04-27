import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateMaliPayroll } from '@/lib/maliPayroll';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { periodStart, periodEnd } = await request.json();

    if (!periodStart || !periodEnd) {
      return NextResponse.json({ error: 'Période invalide' }, { status: 400 });
    }

    // On récupère tous les employés actifs de ce tenant
    const employees = await prisma.employee.findMany({
      where: { 
        tenantId: session.tenantId,
        isActive: true 
      },
      include: { 
        contracts: { where: { status: 'ACTIVE' }, take: 1 } 
      }
    });

    const payslips = await Promise.all(employees.map(async (emp) => {
      const activeContract = emp.contracts[0];
      const baseSalary = activeContract ? activeContract.baseSalary : 0;

      // Calcul de la paie via le moteur malien
      const payroll = calculateMaliPayroll({
        baseSalary: baseSalary,
        taxableBonuses: 0,
        nonTaxableBonuses: 0,
        numberOfChildren: 0, // Idéalement à extraire de la fiche employé
        isMarried: false,
        hireDate: emp.hireDate?.toISOString()
      });

      // Création du bulletin en base avec tous les champs requis
      return prisma.payslip.create({
        data: {
          tenantId: session.tenantId,
          employeeId: emp.id,
          periodStart: new Date(periodStart),
          periodEnd: new Date(periodEnd),
          baseSalary: payroll.baseSalary,
          taxableBonuses: payroll.taxableBonuses,
          nonTaxableBonuses: payroll.nonTaxableBonuses,
          grossSalary: payroll.grossSalary,
          inpsEmployee: payroll.inpsEmployee,
          amoEmployee: payroll.amoEmployee,
          totalDeductions: payroll.totalDeductions,
          fiscalBase: payroll.fiscalBase,
          its: payroll.its,
          netSalary: payroll.netSalary,
          inpsEmployer: payroll.inpsEmployer,
          amoEmployer: payroll.amoEmployer,
          totalEmployerCharges: payroll.totalEmployerCharges,
          status: 'GENERATED',
          notes: `Génération automatique par lot le ${new Date().toLocaleDateString()}`
        }
      });
    }));

    return NextResponse.json({ success: true, count: payslips.length });
  } catch (error: any) {
    console.error('[PAYROLL_BATCH]', error.message);
    return NextResponse.json({ error: 'Erreur lors de la génération des bulletins' }, { status: 500 });
  }
}
