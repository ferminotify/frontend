import { API_URL } from './config.js';

// Resolved at runtime from backend; fallback to env only if backend not reachable
let VAPID_PUBLIC_KEY = '';

export async function subscribeUser(enable) {

  if (!enable) {
    const unsubscribed = await unsubscribeUser();
    if (unsubscribed) {
      localStorage.removeItem('vapidPublicKey');
      console.log('User unsubscribed from push notifications');
    }
    return;
  }
  
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push notifications are not supported by this browser.');
    }

    // Ensure service worker is registered
    let registration;
    try {
      registration = await navigator.serviceWorker.register('/service-worker.js');
    } catch (e) {
      console.error('Service worker registration failed', e);
      throw new Error('Impossibile registrare il service worker per le notifiche push.');
    }

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Permesso per le notifiche push negato.');
    }

    // Always resolve the backend VAPID public key first
    try {
      const r = await fetch(`${API_URL}/push/public-key`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      VAPID_PUBLIC_KEY = j.key || '';
      console.log('[push] Using VAPID key from backend');
    } catch (e) {
      console.warn('[push] Failed to fetch VAPID key from backend', e);
      VAPID_PUBLIC_KEY = import.meta.env?.VITE_VAPID_PUBLIC_KEY || '';
      if (VAPID_PUBLIC_KEY) console.log('[push] Using VAPID key from frontend env');
    }

    if (!VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY.length < 80) {
      console.error('[push] VAPID public key is not configured properly.');
      throw new Error('Si è verificato un errore interno. Riprova più tardi.');
    }

    // If the stored key differs from backend key, unsubscribe to force re-subscription with the new key
    const storedKey = localStorage.getItem('vapidPublicKey');
    let subscription = await registration.pushManager.getSubscription();
    if (subscription && storedKey && storedKey !== VAPID_PUBLIC_KEY) {
      try {
        console.log('[push] VAPID key changed; unsubscribing old subscription');
        await subscription.unsubscribe();
      } catch (e) {
        console.warn('[push] Failed to unsubscribe old subscription', e);
      }
      subscription = null;
    }

    if (!subscription) {
      const appServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      // Validate uncompressed P-256 public key: 65 bytes starting with 0x04
      if (!(appServerKey instanceof Uint8Array) || appServerKey.length !== 65 || appServerKey[0] !== 0x04) {
        console.error('[push] VAPID public key is not a valid uncompressed P-256 key.');
        throw new Error('Si è verificato un errore interno. Riprova più tardi.');
      }

      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: appServerKey,
        });
        // Persist the key we used to subscribe
        localStorage.setItem('vapidPublicKey', VAPID_PUBLIC_KEY);
      } catch (e) {
        const name = e?.name || 'Error';
        console.error('pushManager.subscribe failed:', e);
        if (name === 'NotAllowedError') {
          throw new Error('Permesso per le notifiche push negato.');
        } else if (name === 'AbortError') {
          throw new Error('Errore del servizio push del browser. Controlla che i servizi di push non siano bloccati (ad blocker/Brave/Chrome impostazioni) e riprova.');
        } else {
          console.error('pushManager.subscribe failed:', e);
          throw new Error('Impossibile completare l\'iscrizione alle notifiche: ' + (e.message || name));
        }
      }
    }
    // Send subscription to backend with Bearer token so it can be linked to the authenticated user
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('[push] No auth token found; subscription will not be associated with a user.');
    }
    const subPayload = subscription?.toJSON ? subscription.toJSON() : subscription;
    try {
      const resp = await fetch(`${API_URL}/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(subPayload),
      });
      if (!resp.ok) {
        console.error('[push] Failed to register push subscription on backend', resp.status);
      }
    } catch (e) {
      console.error('[push] Network error sending subscription to backend', e);
    }

    console.log('User subscribed:', subscription);
    return subscription;
  } catch (err) {
    console.error('subscribeUser failed', err);
    throw new Error("Si è verificato un errore interno. Riprova più tardi.");
  }
}

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64Safe);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export async function unsubscribeUser() {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return false;
    const sub = await registration.pushManager.getSubscription();
    if (!sub) return false;
    const success = await sub.unsubscribe();
    console.log('Push subscription revoked:', success);
    return success;
  } catch (e) {
    console.error('unsubscribeUser failed', e);
    return false;
  }
}

export default subscribeUser;
