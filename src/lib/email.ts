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

// 2. Alerte d'Absence
export const sendAbsenceAlert = async (parentEmail: string, studentName: string, date: string) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
      <h2 style="color: #f43f5e;">Alerte d'Absence</h2>
      <p>Bonjour,</p>
      <p>Nous vous informons de l'absence de <strong>${studentName}</strong> en date du <strong>${date}</strong>.</p>
      <p>Merci de contacter la vie scolaire pour justifier cette absence dans les plus brefs délais.</p>
      <a href="https://gestion-scolaire-livid.vercel.app/login" style="display: inline-block; background-color: #1e293b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin-top: 10px;">Voir les détails</a>
      <p style="margin-top: 30px; font-size: 12px; color: #64748b;">Direction des Études - SchoolERP Pro</p>
    </div>
  `;
  
  return sendEmail({ to: parentEmail, subject: `Alerte Absence - ${studentName}`, html });
};

// 3. Envoi de Bulletin de Notes
export const sendReportCardEmail = async (parentEmail: string, studentName: string, average: number, rank: number, trimestre: string) => {
  const isPassing = average >= 10;
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #1e293b; color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 20px;">Bulletin de Notes Officiel</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.8; font-size: 14px;">${trimestre} — Année Scolaire 2024-2025</p>
      </div>
      <div style="padding: 30px; line-height: 1.6; color: #334155;">
        <p>Chers parents,</p>
        <p>Le bulletin de notes de <strong>${studentName}</strong> est désormais disponible. Voici un résumé des résultats :</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
          <div style="display: inline-block; margin: 0 15px;">
            <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase;">Moyenne</p>
            <p style="margin: 0; font-size: 28px; font-weight: 800; color: ${isPassing ? '#10b981' : '#f43f5e'};">${average.toFixed(2)}</p>
          </div>
          <div style="display: inline-block; margin: 0 15px; border-left: 1px solid #e2e8f0; padding-left: 30px;">
            <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase;">Rang</p>
            <p style="margin: 0; font-size: 28px; font-weight: 800; color: #1e293b;">${rank}<sup>${rank === 1 ? 'er' : 'ème'}</sup></p>
          </div>
        </div>

        <p>Vous pouvez consulter le détail complet des notes, les appréciations des professeurs et télécharger le bulletin au format PDF via votre espace parent.</p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://gestion-scolaire-livid.vercel.app/login" style="background-color: #4f8ef7; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Accéder au Portail Parent</a>
        </div>
      </div>
      <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
        Ce message est une notification automatique. Merci de ne pas y répondre directement.<br>
        <strong>© 2025 SchoolERP Pro — Modernisation de l'Éducation</strong>
      </div>
    </div>
  `;
  
  return sendEmail({ 
    to: parentEmail, 
    subject: `Résultats Scolaires - ${studentName} (${trimestre})`, 
    html 
  });
};
