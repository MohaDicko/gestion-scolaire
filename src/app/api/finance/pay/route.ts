import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUniversal } from '@/lib/auth';
import { initiatePayment } from '@/lib/orangeMoney';

export async function POST(request: Request) {
  try {
    const session = await getSessionUniversal(request);
    if (!session || !session.tenantId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { invoiceId, phoneNumber, method } = await request.json();

    if (!invoiceId || !phoneNumber) {
      return NextResponse.json({ error: 'Données incomplètes' }, { status: 400 });
    }

    // Récupérer la facture
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId }
    });

    if (!invoice || invoice.tenantId !== session.tenantId) {
      return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });
    }

    if (invoice.status === 'PAID') {
      return NextResponse.json({ error: 'Facture déjà payée' }, { status: 400 });
    }

    // Appel à l'API Orange Money
    let omResponse: any = { success: true, payToken: `SIM_OK_${Date.now()}` };
    
    if (method === 'ORANGE_MONEY') {
      omResponse = await initiatePayment(invoice.amount, invoice.id, phoneNumber);
      
      if (!omResponse.success) {
        return NextResponse.json({ error: omResponse.message || 'Le paiement a été refusé par Orange Money' }, { status: 400 });
      }
    } else {
      // Simulation standard pour les autres moyens de paiement (Moov)
      await new Promise((resolve) => setTimeout(resolve, 2500));
    }

    // Créer le paiement et mettre à jour la facture dans une transaction
    const transaction = await prisma.$transaction(async (tx) => {
      
      const paymentMethod = method === 'ORANGE_MONEY' ? 'MOBILE_MONEY' : 
                            method === 'MOOV' ? 'MOBILE_MONEY' : 
                            'CASH'; // Fallback au besoin

      const payment = await tx.payment.create({
        data: {
          tenantId: session.tenantId,
          invoiceId: invoice.id,
          amount: invoice.amount, // Paiement total
          method: paymentMethod,
          reference: method === 'ORANGE_MONEY' ? omResponse.payToken : `SIM_${method}_${Math.floor(Math.random() * 1000000)}`
        }
      });

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: 'PAID' }
      });

      return { payment, updatedInvoice };
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Paiement en cours',
      reference: transaction.payment.reference,
      paymentUrl: omResponse.paymentUrl || null
    });

  } catch (error: any) {
    console.error('[FINANCE PAY API ERROR]', error);
    return NextResponse.json({ error: 'Erreur lors du traitement du paiement.' }, { status: 500 });
  }
}
