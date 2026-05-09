/**
 * Utilitaire de gestion des SMS pour SchoolERP Pro
 * Supporte plusieurs providers (Orange Mali API, Twilio, SMS Mode, etc.)
 */

interface SMSOptions {
  to: string;
  message: string;
}

export async function sendSMS({ to, message }: SMSOptions) {
  console.log(`[SMS SENDING] To: ${to} | Msg: ${message}`);

  // TODO: Remplacer par vos clés API réelles (Orange Mali ou Twilio)
  const PROVIDER = process.env.SMS_PROVIDER || 'SIMULATOR';

  try {
    if (PROVIDER === 'SIMULATOR') {
      // Simulation pour le développement
      console.log('--- SIMULATION SMS ---');
      return { success: true, messageId: 'sim_' + Math.random().toString(36).substr(2, 9) };
    }

    if (PROVIDER === 'ORANGE_MALI') {
      // Exemple de structure pour Orange Mali API
      /*
      const response = await fetch('https://api.orange.com/smsmessaging/v1/outbound/...', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.ORANGE_API_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ... })
      });
      return await response.json();
      */
    }

    return { success: false, error: 'Provider non configuré' };
  } catch (error: any) {
    console.error('[SMS_ERROR]', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Envoie une notification d'absence au parent
 */
export async function sendAbsenceSMS(parentPhone: string, studentName: string, date: string) {
  const msg = `URGENT - SchoolERP : Votre enfant ${studentName} est absent ce jour (${date}). Veuillez contacter la surveillance.`;
  return sendSMS({ to: parentPhone, message: msg });
}

/**
 * Envoie un rappel d'impayé
 */
export async function sendPaymentReminderSMS(parentPhone: string, studentName: string, amount: number) {
  const msg = `SchoolERP : Rappel de paiement pour ${studentName}. Reliquat : ${amount} FCFA. Merci de régulariser rapidement.`;
  return sendSMS({ to: parentPhone, message: msg });
}
