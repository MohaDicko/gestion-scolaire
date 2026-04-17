import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const payslips = await prisma.payslip.findMany({
      include: {
        employee: { select: { firstName: true, lastName: true, employeeNumber: true } }
      },
      orderBy: { periodEnd: 'desc' }
    });
    return NextResponse.json(payslips);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { employeeId, periodStart, periodEnd, baseSalary, deductions, bonuses } = await request.json();
    
    // Very basic payroll calculation formula
    const numBase = parseFloat(baseSalary);
    const netSalary = numBase + (bonuses || 0) - (deductions || 0);

    const payslip = await prisma.payslip.create({
      data: {
        tenantId: '1',
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
    console.error('Payslips POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
