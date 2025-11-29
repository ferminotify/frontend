import { API_URL } from '@/utils/config.js';

// Resolved at runtime from backend; fallback to env only if backend not reachable
let VAPID_PUBLIC_KEY = '';

export async function subscribeUser(enable) {

  if (!enable) {
    const unsubscribed = await unsubscribeUser();
    if (unsubscribed) {
      localStorage.removeItem('vapidPublicKey');
      localStorage.removeItem('endpoint');
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
      const r = await fetch(`${API_URL}/user/push/public-key`);
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
        localStorage.setItem('endpoint', subscription.endpoint);
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
    const deviceId = getDeviceId();
    const userAgent = navigator.userAgent || 'unknown';

    const json = subscription?.toJSON ? subscription.toJSON() : subscription; // some browser edge cases

    const subPayload = {
      endpoint: json.endpoint,
      keys: json.keys,
      device_id: deviceId,
      user_agent: userAgent,
    };

    try {
      const resp = await fetch(`${API_URL}/user/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(subPayload),
      });

      if (!resp.ok) {
        console.error('[push] Failed to register push subscription on backend', resp.status);
        throw new Error('Si è verificato un errore interno. Riprova più tardi.');
      }
    } catch (e) {
      console.error('[push] Network error sending subscription to backend', e);
      throw new Error('Si è verificato un errore interno. Riprova più tardi.');
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
    // Try to remove server-side record. Prefer deletion by device_id (stable)
    const token = localStorage.getItem('token');
    const device_id = localStorage.getItem('device_id');
    if (token && device_id) {
      try {
        const delResp = await fetch(`${API_URL}/user/push/devices/${encodeURIComponent(device_id)}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (!delResp.ok) {
          // fallback to endpoint-based unsubscribe if device delete didn't work
          console.warn('[push] delete by device_id failed, falling back to endpoint POST', delResp.status);
          try {
            const resp = await fetch(`${API_URL}/user/push/unsubscribe`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ endpoint: sub.endpoint }),
            });
            if (!resp.ok) console.error('[push] Failed to unregister push subscription on backend', resp.status);
          } catch (e) {
            console.error('[push] Network error sending unsubscription to backend (fallback)', e);
          }
        }
      } catch (e) {
        console.error('[push] Network error deleting push device by device_id', e);
        // try fallback
        if (token) {
          try {
            const resp = await fetch(`${API_URL}/user/push/unsubscribe`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ endpoint: sub.endpoint }),
            });
            if (!resp.ok) console.error('[push] Failed to unregister push subscription on backend', resp.status);
          } catch (e2) {
            console.error('[push] Network error sending unsubscription to backend (second fallback)', e2);
          }
        }
      }
    } else if (token) {
      // No device_id available; try endpoint-based unsubscribe
      try {
        const resp = await fetch(`${API_URL}/user/push/unsubscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        if (!resp.ok) console.error('[push] Failed to unregister push subscription on backend', resp.status);
      } catch (e) {
        console.error('[push] Network error sending unsubscription to backend', e);
      }
    }
    console.log('Push subscription revoked:', success);
    return success;
  } catch (e) {
    console.error('unsubscribeUser failed', e);
    return false;
  }
}

function getDeviceId() {
  let id = localStorage.getItem('device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('device_id', id);
  }
  return id;
}


// Update whether push notifications should be sent together with other channels (email/telegram)
// sendTogether: boolean
export async function setSendPushWithNotifications(sendTogether) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Utente non autenticato.');
  const device_id = localStorage.getItem('device_id');
  if (!device_id) throw new Error('Device non identificato.');
  try {
    const resp = await fetch(`${API_URL}/user/push/send-push-with-notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ send_push_with_notifications: !!sendTogether, device_id }),
    });
    if (!resp.ok) {
      throw new Error('Aggiornamento preferenza push fallito.');
    }
    return await resp.json();
  } catch (e) {
    console.error('[push] setSendPushWithNotifications error', e);
    throw e;
  }
}

// Get all push devices for authenticated user
export async function getPushDevices() {
  const token = localStorage.getItem('token') || ''
  try {
    const resp = await fetch(`${API_URL}/user/push/devices`, {
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const json = await resp.json()
    if (!json.ok) throw new Error(json.error || 'Errore recupero dispositivi push')
    return json.devices || []
  } catch (e) {
    console.error('[push] getPushDevices error', e)
    throw e
  }
}

// Delete a specific push device by device_id
export async function deletePushDevice(deviceId) {
  const token = localStorage.getItem('token') || ''
  if (!deviceId) throw new Error('deviceId mancante')
  try {
    const resp = await fetch(`${API_URL}/user/push/devices/${encodeURIComponent(deviceId)}`, {
      method: 'DELETE',
      headers: { Authorization: token ? `Bearer ${token}` : '' },
    })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const json = await resp.json()
    if (!json.ok) throw new Error(json.error || 'Errore eliminazione dispositivo push')
    return json.deleted === true
  } catch (e) {
    console.error('[push] deletePushDevice error', e)
    throw e
  }
}


export default subscribeUser;
