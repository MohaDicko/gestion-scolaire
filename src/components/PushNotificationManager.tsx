'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { useToast } from './Toast';

export default function PushNotificationManager() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    setIsSubscribed(!!subscription);
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribe = async () => {
    setIsLoading(true);
    try {
      // 1. Register SW if not done
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      // 2. Get Public Key from API
      const resKey = await fetch('/api/notifications/subscribe');
      const { publicKey } = await resKey.json();

      // 3. Subscribe with PushManager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      // 4. Send to Server
      const res = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });

      if (res.ok) {
        setIsSubscribed(true);
        toast.success("Notifications activées ! Vous recevrez désormais des alertes en temps réel.");
      } else {
        throw new Error();
      }
    } catch (error) {
      toast.error("Impossible d'activer les notifications. Vérifiez les paramètres de votre navigateur.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) return null;

  return (
    <button 
      onClick={isSubscribed ? undefined : subscribe}
      disabled={isSubscribed || isLoading}
      className={`btn-icon ${isSubscribed ? 'text-primary' : 'text-dim'}`}
      title={isSubscribed ? "Notifications activées" : "Activer les notifications"}
      style={{ position: 'relative' }}
    >
      {isLoading ? <Loader2 size={18} className="spin" /> : isSubscribed ? <Bell size={18} /> : <BellOff size={18} />}
      {!isSubscribed && !isLoading && (
        <span style={{ 
          position: 'absolute', top: 0, right: 0, 
          width: '8px', height: '8px', background: '#f43f5e', 
          borderRadius: '50%', border: '2px solid white' 
        }} />
      )}
    </button>
  );
}
