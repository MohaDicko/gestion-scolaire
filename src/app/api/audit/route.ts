import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Only Admin/Super Admin/HR should see audit logs ideally
  if (!['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(session.role)) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const entityType = url.searchParams.get('entityType');
  const userId = url.searchParams.get('userId');
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);

  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId: session.tenantId,
        ...(action && { action: action as any }),
        ...(entityType && { entityType }),
        ...(userId && { userId }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error('Audit GET Error:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
