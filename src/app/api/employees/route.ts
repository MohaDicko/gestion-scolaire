import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import * as bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !session.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';

  try {
    const employees = await prisma.employee.findMany({
      where: {
        tenantId: session.tenantId,
        ...(search ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { employeeNumber: { contains: search, mode: 'insensitive' } },
          ],
        } : {}),
      },
      include: {
        department: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(employees);
  } catch (error) {
    console.error('Employees GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !session.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { 
      firstName, lastName, email, phoneNumber, dateOfBirth, gender, 
      hireDate, employeeType, campusId, createAccount, password 
    } = data;

    const employeeNumber = `EMP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Ensure a default department exists for the tenant
    let department = await prisma.department.findFirst({
      where: { tenantId: session.tenantId }
    });

    if (!department) {
      department = await prisma.department.create({
        data: {
          tenantId: session.tenantId,
          name: 'Administration',
          code: 'ADMIN',
        }
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Employee
      const employee = await tx.employee.create({
        data: {
          tenantId: session.tenantId,
          employeeNumber,
          firstName,
          lastName,
          email,
          phoneNumber,
          dateOfBirth: new Date(dateOfBirth),
          gender: gender.toUpperCase(),
          hireDate: new Date(hireDate),
          employeeType: employeeType.toUpperCase(),
          departmentId: department!.id,
          campusId: campusId,
        },
      });

      // 2. Create User account if requested
      if (createAccount && password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Map employeeType to UserRole
        let role: any = 'TEACHER';
        if (employeeType === 'ADMIN') role = 'SCHOOL_ADMIN';
        if (employeeType === 'ACCOUNTANT') role = 'ACCOUNTANT';
        if (employeeType === 'HR') role = 'HR_MANAGER';

        await tx.user.create({
          data: {
            tenantId: session.tenantId,
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            firstName,
            lastName,
            role,
            isActive: true
          }
        });
      }

      return employee;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Employees POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
