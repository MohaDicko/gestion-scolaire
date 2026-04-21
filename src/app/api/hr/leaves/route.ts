import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const leaves = await prisma.leaveRequest.findMany({
      where: {
        tenantId: session.tenantId
      },
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
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await request.json();
    const leave = await prisma.leaveRequest.create({
      data: {
        tenantId: session.tenantId,
        employeeId: data.employeeId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        type: data.type, // e.g. SICK, ANNUAL, PERSONAL
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
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id, status } = await request.json();
    
    // Safety check: ensure leave belongs to tenant
    const existing = await prisma.leaveRequest.findFirst({
        where: { id, tenantId: session.tenantId }
    });
    if (!existing) return NextResponse.json({ error: 'Leave not found' }, { status: 404 });

    const leave = await prisma.leaveRequest.update({
      where: { id },
      data: { status }
    });
    return NextResponse.json(leave);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
