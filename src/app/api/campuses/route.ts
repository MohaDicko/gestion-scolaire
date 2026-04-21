import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const campuses = await prisma.campus.findMany({
      where: { tenantId: session.tenantId, isActive: true },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(campuses);
  } catch (error) {
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
    const { name, address, city, region, phoneNumber, email, managerName } = await request.json();
    if (!name || !address || !city || !region || !phoneNumber) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
    }
    const campus = await prisma.campus.create({
      data: { tenantId: session.tenantId, name, address, city, region, phoneNumber, email, managerName }
    });
    return NextResponse.json(campus, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
