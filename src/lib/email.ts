import { Resend } from 'resend';

// Initialise l'instance Resend avec la clé API (à ajouter dans le fichier .env)
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Email par défaut pour l'expéditeur
const DEFAULT_FROM = 'SchoolERP <notifications@schoolerp.com>'; // À configurer avec un domaine vérifié sur Resend

export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  if (!resend) {
    console.warn("⚠️ RESEND_API_KEY non configurée. L'email n'a pas été envoyé.");
    console.log(`[Mock Email] À: ${to} | Sujet: ${subject}`);
    return { success: true, mock: true };
  }

  try {
    const data = await resend.emails.send({
      from: DEFAULT_FROM,
      to,
      subject,
      html,
    });

    return { success: true, data };
  } catch (error) {
    console.error("Erreur d'envoi d'email via Resend:", error);
    return { success: false, error };
  }
};

/**
 * Modèles d'emails prédéfinis
 */

// 1. Notification de Facture
export const sendInvoiceNotification = async (parentEmail: string, studentName: string, amount: number, dueDate: string) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
      <h2 style="color: #4f8ef7;">Nouvelle Facture de Scolarité</h2>
      <p>Bonjour,</p>
      <p>Une nouvelle facture a été émise concernant la scolarité de <strong>${studentName}</strong>.</p>
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Montant à régler :</strong> ${amount.toLocaleString('fr-FR')} FCFA</p>
        <p style="margin: 5px 0 0 0;"><strong>Date limite :</strong> ${dueDate}</p>
      </div>
      <p>Vous pouvez consulter et régler cette facture directement depuis votre Espace Famille.</p>
      <a href="https://gestion-scolaire-livid.vercel.app/login" style="display: inline-block; background-color: #4f8ef7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin-top: 10px;">Accéder à mon Espace</a>
      <p style="margin-top: 30px; font-size: 12px; color: #64748b;">L'équipe SchoolERP Pro</p>
    </div>
  `;
  
  return sendEmail({ to: parentEmail, subject: `Facture de scolarité - ${studentName}`, html });
};

// 2. Alerte d'absence
export const sendAbsenceAlert = async (parentEmail: string, studentName: string, date: string) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
      <h2 style="color: #f43f5e;">Alerte Absence</h2>
      <p>Bonjour,</p>
      <p>Nous vous informons que votre enfant <strong>${studentName}</strong> a été marqué(e) <strong>absent(e)</strong> aujourd'hui (${date}).</p>
      <p>Veuillez contacter l'administration de l'établissement pour justifier cette absence.</p>
      <p style="margin-top: 30px; font-size: 12px; color: #64748b;">L'équipe Vie Scolaire - SchoolERP Pro</p>
    </div>
  `;
  
  return sendEmail({ to: parentEmail, subject: `Alerte Absence - ${studentName}`, html });
};
