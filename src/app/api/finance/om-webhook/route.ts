import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    console.log('[Orange Money Webhook] Reçu:', payload);

    // D'après la doc Orange Money, le webhook reçoit :
    // { status: 'SUCCESS' | 'FAILED', order_id: '...', pay_token: '...', txnid: '...' }
    
    if (payload.status === 'SUCCESS' && payload.order_id) {
      
      const invoiceId = payload.order_id;
      
      // On cherche le paiement correspondant (s'il existe déjà)
      const payment = await prisma.payment.findFirst({
        where: { invoiceId: invoiceId }
      });

      if (!payment) {
        console.error(`[Orange Money Webhook] Paiement introuvable pour la facture ${invoiceId}`);
        return NextResponse.json({ error: 'Paiement introuvable' }, { status: 404 });
      }

      await prisma.$transaction(async (tx) => {
        // Valider la facture
        await tx.invoice.update({
          where: { id: invoiceId },
          data: { status: 'PAID' }
        });

        // Valider le paiement
        await tx.payment.update({
          where: { id: payment.id },
          data: { 
            reference: payload.txnid || payload.pay_token 
          }
        });
      });

      return NextResponse.json({ message: 'OK' }, { status: 200 });
    } else {
      console.warn('[Orange Money Webhook] Paiement échoué ou statut invalide:', payload);
      // Mettre à jour le statut du paiement en FAILED si nécessaire
      return NextResponse.json({ message: 'Ignoré (Statut non SUCCESS)' }, { status: 200 });
    }
  } catch (error: any) {
    console.error('[Orange Money Webhook] Erreur serveur:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
