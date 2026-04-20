import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const expenses = await prisma.expense.findMany({
      where: { tenantId: session.tenantId },
      orderBy: { date: 'desc' }
    });
    return NextResponse.json(expenses);
  } catch (error) {
    console.error('[EXPENSES GET]', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'].includes(session.role)) {
    return NextResponse.json({ error: 'Accès refusé — droits insuffisants' }, { status: 403 });
  }

  try {
    const data = await request.json();
    const { description, amount, category, date, status } = data;

    if (!description || !amount || !category || !date) {
      return NextResponse.json({ error: 'Tous les champs sont requis (description, amount, category, date)' }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        tenantId: session.tenantId,
        description: String(description).substring(0, 255),
        amount: parsedAmount,
        category: String(category).substring(0, 100),
        date: new Date(date),
        status: status || 'PAID'
      }
    });
    return NextResponse.json(expense, { status: 201 });
  } catch (error: any) {
    console.error('[EXPENSES POST]', error.message);
    return NextResponse.json({ error: 'Erreur lors de la création de la dépense' }, { status: 400 });
  }
}
