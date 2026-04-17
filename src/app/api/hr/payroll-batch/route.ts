import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { periodStart, periodEnd } = await request.json();

    // On récupère tous les employés actifs
    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      include: { contracts: { where: { status: 'ACTIVE' }, take: 1 } }
    });

    const payslips = await Promise.all(employees.map(async (emp) => {
      const activeContract = emp.contracts[0];
      const baseSalary = activeContract ? activeContract.baseSalary : 0;

      // Create payslip
      return prisma.payslip.create({
        data: {
          tenantId: '1',
          employeeId: emp.id,
          periodStart: new Date(periodStart),
          periodEnd: new Date(periodEnd),
          baseSalary: baseSalary,
          netSalary: baseSalary, // Basic logic
          status: 'GENERATED'
        }
      });
    }));

    return NextResponse.json({ success: true, count: payslips.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
