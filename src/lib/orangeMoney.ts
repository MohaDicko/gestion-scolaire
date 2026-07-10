/**
 * Service d'intégration de l'API Orange Money Web Payment (Mali)
 * Documentations: https://developer.orange.com/apis/om-webpay/
 */

const OM_AUTH_HEADER = process.env.OM_AUTH_HEADER || ''; // Base64(client_id:client_secret)
const OM_MERCHANT_KEY = process.env.OM_MERCHANT_KEY || ''; // Clé marchand fournie par Orange
const OM_RETURN_URL = process.env.OM_RETURN_URL || 'http://localhost:3000/parent/invoices';
const OM_CANCEL_URL = process.env.OM_CANCEL_URL || 'http://localhost:3000/parent/invoices';
const OM_NOTIF_URL = process.env.OM_NOTIF_URL || 'http://localhost:3000/api/finance/om-webhook';

/**
 * 1. Obtenir le Token d'accès (OAuth 2.0)
 */
export async function getAccessToken(): Promise<string | null> {
  if (!OM_AUTH_HEADER) {
    console.warn('⚠️ [Orange Money] OM_AUTH_HEADER manquant. Mode Simulation activé.');
    return 'SIMULATION_TOKEN';
  }

  try {
    const response = await fetch('https://api.orange.com/oauth/v3/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${OM_AUTH_HEADER}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: 'grant_type=client_credentials'
    });

    const data = await response.json();
    if (data.access_token) return data.access_token;
    
    console.error('[Orange Money] Erreur Token:', data);
    return null;
  } catch (error) {
    console.error('[Orange Money] Erreur réseau lors de la récupération du token:', error);
    return null;
  }
}

/**
 * 2. Initier un paiement Web (Push)
 * @param amount Montant à prélever
 * @param orderId Identifiant unique de la facture (Invoice ID)
 * @param phoneNumber Numéro de téléphone du client
 */
export async function initiatePayment(amount: number, orderId: string, phoneNumber: string) {
  const token = await getAccessToken();
  
  if (!token) {
    throw new Error('Impossible d\'obtenir le token Orange Money');
  }

  // --- MODE SIMULATION SI PAS DE CLÉS ---
  if (token === 'SIMULATION_TOKEN') {
    // On simule une latence réseau
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // On simule un succès
    return {
      success: true,
      status: 'SUCCESS',
      payToken: `PT_SIM_${Math.random().toString(36).substring(7)}`,
      paymentUrl: '', // Pas d'URL en simulation, on valide direct
      orderId: orderId,
      message: 'Simulation de paiement réussie'
    };
  }
  // --------------------------------------

  // MODE PRODUCTION
  try {
    const payload = {
      merchant_key: OM_MERCHANT_KEY,
      currency: "OUV", // Code devise Franc CFA (UEMOA) pour l'API OM
      order_id: orderId,
      amount: amount,
      return_url: OM_RETURN_URL,
      cancel_url: OM_CANCEL_URL,
      notif_url: OM_NOTIF_URL,
      lang: "fr",
      reference: `Paiement Ecole - ${orderId}`
    };

    const response = await fetch('https://api.orange.com/orange-money-webpay/dev/v1/webpayment', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.status === 201 || data.message === 'OK') {
      return {
        success: true,
        status: 'PENDING',
        payToken: data.pay_token,
        paymentUrl: data.payment_url,
        orderId: data.order_id,
        message: 'Transaction initiée avec succès'
      };
    } else {
      console.error('[Orange Money] Erreur init paiement:', data);
      return {
        success: false,
        status: 'FAILED',
        message: data.message || 'Erreur inconnue API Orange Money'
      };
    }

  } catch (error: any) {
    console.error('[Orange Money] Erreur réseau lors de l\'initiation:', error);
    return {
      success: false,
      status: 'NETWORK_ERROR',
      message: 'Erreur de connexion aux serveurs Orange Money'
    };
  }
}
