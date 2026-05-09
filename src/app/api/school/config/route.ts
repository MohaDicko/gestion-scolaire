import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const school = await prisma.school.findUnique({
      where: { id: session.tenantId }
    });
    return NextResponse.json(school);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.role !== 'SUPER_ADMIN' && session.role !== 'SCHOOL_ADMIN') {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const updated = await prisma.school.update({
      where: { id: session.tenantId },
      data: {
        name: body.name,
        type: body.type,
        drenCode: body.drenCode,
        nationalRNE: body.nationalRNE,
        address: body.address,
        city: body.city,
        phoneNumber: body.phoneNumber,
        motto: body.motto,
        logoUrl: body.logoUrl,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
