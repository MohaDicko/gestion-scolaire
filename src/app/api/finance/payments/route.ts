import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { invoiceId, amount, method, notes, tenantId, studentId } = body;

    if (!invoiceId || !amount || !tenantId) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // 1. Enregistrer la transaction dans un bloc Prisma pour garantir l'intégrité
    const result = await prisma.$transaction(async (tx) => {
      // Créer le paiement
      const payment = await tx.payment.create({
        data: {
          tenantId,
          invoiceId,
          amount,
          method,
          notes,
          reference: body.reference || null
        }
      });

      // Récupérer l'état de la facture après paiement
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { payments: true }
      });

      if (!invoice) throw new Error('Facture non trouvée');

      // Calculer le total payé
      const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
      
      let newStatus = 'UNPAID';
      if (totalPaid >= invoice.amount) {
        newStatus = 'PAID';
      } else if (totalPaid > 0) {
        newStatus = 'PARTIAL';
      }

      // Mettre à jour le statut de la facture
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { 
          status: newStatus,
          paidDate: newStatus === 'PAID' ? new Date() : null,
          paymentMethod: method
        }
      });

      return payment;
    });

    return NextResponse.json({ success: true, payment: result });

  } catch (error) {
    console.error('Erreur lors du traitement du paiement:', error);
    return NextResponse.json({ error: 'Erreur lors du traitement du paiement' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  const invoiceId = searchParams.get('invoiceId');

  try {
    const payments = await prisma.payment.findMany({
      where: {
        invoice: studentId ? { studentId } : invoiceId ? { id: invoiceId } : {}
      },
      include: { invoice: true },
      orderBy: { paymentDate: 'desc' }
    });

    return NextResponse.json(payments);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la récupération des paiements' }, { status: 500 });
  }
}
