import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // RBAC: Only Admins or Accountants can perform stock movements
  if (!['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'].includes(session.role)) {
    return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
  }

  try {
    const { itemId, type, quantity, notes, performer } = await request.json();
    const qty = parseInt(quantity);

    if (!itemId || !type || isNaN(qty)) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update the item quantity
      const item = await tx.stockItem.findUnique({ where: { id: itemId } });
      if (!item) throw new Error('Article non trouvé');

      let newQty = item.quantity;
      if (type === 'IN') newQty += qty;
      else if (type === 'OUT') {
        if (item.quantity < qty) throw new Error('Stock insuffisant');
        newQty -= qty;
      } else if (type === 'ADJUSTMENT') {
        newQty = qty;
      }

      const updatedItem = await tx.stockItem.update({
        where: { id: itemId },
        data: { quantity: newQty }
      });

      // 2. Create the transaction log
      const transaction = await tx.stockTransaction.create({
        data: {
          tenantId: session.tenantId!,
          itemId,
          type,
          quantity: qty,
          notes,
          performer: performer || session.email
        }
      });

      // 3. Automated Accounting: If IN movement, create an Expense
      if (type === 'IN' && item.unitPrice > 0) {
        await tx.expense.create({
          data: {
            tenantId: session.tenantId!,
            description: `Achat Stock: ${item.name} (x${qty})`,
            amount: item.unitPrice * qty,
            category: 'Inventaire / Achats',
            date: new Date(),
            status: 'PAID'
          }
        });
      }

      return { updatedItem, transaction };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
