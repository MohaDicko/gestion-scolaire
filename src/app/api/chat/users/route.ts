import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  try {
    const users = await prisma.user.findMany({
      where: {
        tenantId: session.tenantId,
        id: { not: session.id }, // Ne pas se retourner soi-même
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        email: true
      },
      take: 20
    });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
  }
}
