import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'].includes(session.role)) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  try {
    const expense = await prisma.expense.findFirst({
      where: { id: id, tenantId: session.tenantId }
    });

    if (!expense) {
      return NextResponse.json({ error: 'Dépense introuvable' }, { status: 404 });
    }

    await prisma.expense.delete({ where: { id: id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[EXPENSE_DELETE]', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
