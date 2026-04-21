import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const years = await prisma.academicYear.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { startDate: 'desc' }
    });
    return NextResponse.json(years);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(session.role)) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }
  try {
    const { name, startDate, endDate, isActive } = await request.json();
    if (!name || !startDate || !endDate) return NextResponse.json({ error: 'name, startDate et endDate sont requis' }, { status: 400 });

    // If setting as active, deactivate the others
    if (isActive) {
      await prisma.academicYear.updateMany({ where: { tenantId: session.tenantId }, data: { isActive: false } });
    }
    const year = await prisma.academicYear.create({
      data: { tenantId: session.tenantId, name, startDate: new Date(startDate), endDate: new Date(endDate), isActive: !!isActive }
    });
    return NextResponse.json(year, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
