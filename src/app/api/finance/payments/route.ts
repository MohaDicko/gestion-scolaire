import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const body = await request.json();
    const tenantId = session?.tenantId || body.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: 'Non autorisé: tenant requis' }, { status: 401 });
    }

    if (session && !['ACCOUNTANT', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Accès refusé. Rôle comptable requis.' }, { status: 403 });
    }

    const { invoiceId, amount, method, notes } = body;

    if (!invoiceId || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Montant ou identifiant de facture invalide' }, { status: 400 });
    }

    // 1. Transaction atomique pour garantir l'intégrité de la facture et du paiement
    const result = await prisma.$transaction(async (tx) => {
      // Vérifier que la facture appartient bien au tenant
      const invoice = await tx.invoice.findFirst({
        where: { id: invoiceId, tenantId },
        include: { payments: true }
      });

      if (!invoice) throw new Error('Facture introuvable ou non autorisée');

      // Créer le paiement avec référence normalisée
      const payment = await tx.payment.create({
        data: {
          tenantId,
          invoiceId,
          amount: Math.round(amount),
          method: method || 'ESPECES',
          notes: notes || null,
          reference: body.reference || `REC-${Date.now().toString().slice(-6)}`
        }
      });

      // Calculer le cumul réglé
      const allPayments = await tx.payment.findMany({ where: { invoiceId } });
      const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
      
      let newStatus = 'UNPAID';
      if (totalPaid >= invoice.amount) {
        newStatus = 'PAID';
      } else if (totalPaid > 0) {
        newStatus = 'PARTIAL';
      }

      // Mettre à jour la facture
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { 
          status: newStatus,
          paidDate: newStatus === 'PAID' ? new Date() : null,
          paymentMethod: method || invoice.paymentMethod
        }
      });

      return payment;
    });

    return NextResponse.json({ success: true, payment: result });

  } catch (error: any) {
    console.error('[FINANCE PAYMENTS POST]', error);
    return NextResponse.json({ error: error.message || 'Erreur lors du traitement du paiement' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await getSession();
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  const invoiceId = searchParams.get('invoiceId');
  const tenantId = session?.tenantId || searchParams.get('tenantId');

  try {
    const payments = await prisma.payment.findMany({
      where: {
        ...(tenantId ? { tenantId } : {}),
        ...(invoiceId ? { invoiceId } : {}),
        invoice: studentId ? { studentId } : undefined
      },
      include: { invoice: true },
      orderBy: { paymentDate: 'desc' }
    });

    return NextResponse.json(payments);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la récupération des paiements' }, { status: 500 });
  }
}
