import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const invoices = await prisma.invoice.findMany({
      where: { tenantId: session.tenantId },
      include: {
        student: { select: { firstName: true, lastName: true, studentNumber: true } }
      },
      orderBy: { dueDate: 'asc' }
    });
    return NextResponse.json(invoices);
  } catch (error) {
    console.error('[INVOICES GET]', error instanceof Error ? error.message : 'Unknown error');
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
    const { studentId, amount, dueDate, status } = await request.json();

    if (!studentId || !amount || !dueDate) {
      return NextResponse.json({ error: 'studentId, amount et dueDate sont requis' }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
    }

    // Verify student belongs to this tenant
    const student = await prisma.student.findFirst({
      where: { id: studentId, tenantId: session.tenantId }
    });
    if (!student) return NextResponse.json({ error: 'Élève introuvable ou accès non autorisé' }, { status: 403 });

    const invoice = await prisma.invoice.create({
      data: {
        tenantId: session.tenantId,
        studentId,
        amount: parsedAmount,
        status: status || 'UNPAID',
        dueDate: new Date(dueDate),
      }
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    console.error('[INVOICES POST]', error.message);
    return NextResponse.json({ error: 'Erreur lors de la création de la facture' }, { status: 400 });
  }
}
