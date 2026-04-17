import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const leaves = await prisma.leaveRequest.findMany({
      include: {
        employee: { select: { firstName: true, lastName: true, employeeNumber: true } }
      },
      orderBy: { startDate: 'desc' }
    });
    return NextResponse.json(leaves);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const leave = await prisma.leaveRequest.create({
      data: {
        tenantId: '1',
        employeeId: data.employeeId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        type: data.type,
        status: 'PENDING',
        reason: data.reason
      }
    });
    return NextResponse.json(leave, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status } = await request.json();
    const leave = await prisma.leaveRequest.update({
      where: { id },
      data: { status }
    });
    return NextResponse.json(leave);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
