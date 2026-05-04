import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const items = await prisma.stockItem.findMany({
      where: { tenantId: session.tenantId },
      include: {
        _count: { select: { transactions: true } }
      },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // RBAC: Only Admins or Accountants can manage stock
  if (!['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, category, sku, description, unitPrice, minThreshold, initialQuantity } = body;

    const item = await prisma.stockItem.create({
      data: {
        tenantId: session.tenantId,
        name,
        category,
        sku,
        description,
        unitPrice: parseFloat(unitPrice) || 0,
        minThreshold: parseInt(minThreshold) || 5,
        quantity: parseInt(initialQuantity) || 0,
        transactions: initialQuantity > 0 ? {
          create: {
            tenantId: session.tenantId,
            type: 'IN',
            quantity: parseInt(initialQuantity),
            notes: 'Stock initial lors de la création'
          }
        } : undefined
      }
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
