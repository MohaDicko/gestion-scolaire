import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { sendPaymentReminderSMS } from '@/lib/sms';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { invoiceId } = await request.json();

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId, tenantId: session.tenantId },
      include: { student: true }
    });

    if (!invoice || !invoice.student) {
      return NextResponse.json({ error: 'Facture ou élève non trouvé' }, { status: 404 });
    }

    if (!invoice.student.parentPhone) {
      return NextResponse.json({ error: 'Téléphone du parent non renseigné' }, { status: 400 });
    }

    // Envoi du SMS
    const result = await sendPaymentReminderSMS(
      invoice.student.parentPhone,
      `${invoice.student.firstName} ${invoice.student.lastName}`,
      invoice.amount
    );

    if (result.success) {
      // Optionnel: On pourrait logger l'envoi dans une table AuditLog ou NotificationLog
      return NextResponse.json({ message: 'Rappel SMS envoyé avec succès' });
    } else {
      return NextResponse.json({ error: result.error || 'Erreur lors de l\'envoi SMS' }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
