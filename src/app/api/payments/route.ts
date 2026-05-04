import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

// POST /api/payments — Enregistre un paiement et met à jour la facture
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'].includes(session.role)) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  try {
    const { invoiceId, amount, method, reference, notes } = await request.json();

    if (!invoiceId || !amount || !method) {
      return NextResponse.json({ error: 'invoiceId, amount et method sont requis' }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
    }

    // Récupérer la facture
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId: session.tenantId },
    });
    if (!invoice) return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });
    if (invoice.status === 'PAID') return NextResponse.json({ error: 'Facture déjà soldée' }, { status: 400 });

    // Calcul des paiements déjà effectués
    const existingPayments = await prisma.payment.findMany({ where: { invoiceId } });
    const alreadyPaid = existingPayments.reduce((s, p) => s + p.amount, 0);
    const remaining = invoice.amount - alreadyPaid;

    if (parsedAmount > remaining + 0.01) {
      return NextResponse.json({ error: `Le montant dépasse le solde restant (${remaining.toLocaleString('fr-FR')} FCFA)` }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          tenantId: session.tenantId,
          invoiceId,
          amount: parsedAmount,
          method: method.toUpperCase(),
          reference: reference || null,
          notes: notes || null,
        },
      });

      const newPaid = alreadyPaid + parsedAmount;
      const isFullyPaid = newPaid >= invoice.amount - 0.01;

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: isFullyPaid ? 'PAID' : 'UNPAID',
          paidDate: isFullyPaid ? new Date() : undefined,
          paymentMethod: method.toUpperCase(),
        },
        include: { student: { select: { firstName: true, lastName: true, studentNumber: true } } },
      });

      return { payment, invoice: updatedInvoice, isFullyPaid, remaining: invoice.amount - newPaid };
    });

    await logAudit({
      request,
      action: 'APPROVE',
      entityType: 'Payment',
      entityId: result.payment.id,
      newValues: { amount: parsedAmount, method, invoiceId, isFullyPaid: result.isFullyPaid },
      description: `Paiement de ${parsedAmount.toLocaleString('fr-FR')} FCFA via ${method} pour facture ${invoice.invoiceNumber}`,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('[PAYMENTS POST]', error.message);
    return NextResponse.json({ error: 'Erreur lors du paiement' }, { status: 400 });
  }
}

// GET /api/payments?invoiceId=
export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const invoiceId = searchParams.get('invoiceId');

  try {
    const payments = await prisma.payment.findMany({
      where: {
        tenantId: session.tenantId,
        invoiceId: invoiceId ?? undefined,
      },
      orderBy: { paymentDate: 'desc' },
    });
    return NextResponse.json(payments);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
