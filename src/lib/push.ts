import webpush from 'web-push';
import { prisma } from './prisma';

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || 'mailto:admin@schoolerp.pro';

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export async function sendPushNotification(userId: string, payload: { title: string; body: string; icon?: string; url?: string }) {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId }
    });

    if (subscriptions.length === 0) return { success: false, reason: 'No subscriptions found' };

    const results = await Promise.all(subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          },
          JSON.stringify(payload)
        );
        return { endpoint: sub.endpoint, success: true };
      } catch (error: any) {
        // If subscription is expired or invalid, remove it
        if (error.statusCode === 410 || error.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } });
        }
        return { endpoint: sub.endpoint, success: false, error: error.message };
      }
    }));

    return { success: true, results };
  } catch (error) {
    console.error('Push notification error:', error);
    return { success: false, error };
  }
}
