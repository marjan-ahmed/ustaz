'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getToken, onMessage, isSupported } from 'firebase/messaging';
import { getFirebaseMessaging } from '@/lib/firebase';
import { toast } from 'sonner';

export type NotificationStatus =
  | 'loading'
  | 'unsupported'
  | 'denied'
  | 'granted'
  | 'registered'
  | 'error';

/**
 * Requests notification permission, obtains an FCM registration token, and
 * registers it server-side. Also wires foreground messages to a toast.
 *
 * Pass `enabled` (e.g. once the user is signed in) so we only prompt for
 * permission in an authenticated context. Safe no-op on unsupported browsers.
 *
 * Returns the current `status` and a `retry` function the user can call
 * to re-prompt permission / re-register (e.g. after initially denying).
 */
export function useFcmToken(enabled: boolean) {
  const done = useRef(false);
  const [status, setStatus] = useState<NotificationStatus>('loading');
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(() => {
    done.current = false;
    setStatus('loading');
    setRetryCount((c) => c + 1);
  }, []);

  useEffect(() => {
    if (!enabled || done.current) return;
    if (typeof window === 'undefined') return;

    let unsub: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      try {
        if (cancelled) return;

        if (!(await isSupported())) {
          if (!cancelled) setStatus('unsupported');
          return;
        }
        if (!('serviceWorker' in navigator) || !('Notification' in window)) {
          if (!cancelled) setStatus('unsupported');
          return;
        }

        // Check current permission state without prompting first
        if (Notification.permission === 'denied') {
          if (!cancelled) setStatus('denied');
          return;
        }

        // Only request permission if not already granted
        let permission: NotificationPermission = Notification.permission;
        if (permission !== 'granted') {
          permission = await Notification.requestPermission();
        }

        if (permission !== 'granted') {
          if (!cancelled) {
            setStatus('denied');
            console.info('[fcm] notification permission not granted:', permission);
          }
          return;
        }

        if (!cancelled) setStatus('granted');

        const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        const messaging = getFirebaseMessaging();

        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (!vapidKey || vapidKey.startsWith('REPLACE_')) {
          if (!cancelled) setStatus('error');
          console.warn('[fcm] NEXT_PUBLIC_FIREBASE_VAPID_KEY not set — skipping token registration');
          return;
        }

        const token = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration: swReg,
        });
        if (!token) {
          if (!cancelled) setStatus('error');
          console.warn('[fcm] getToken returned empty');
          return;
        }

        done.current = true;

        await fetch('/api/fcm/register-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (!cancelled) setStatus('registered');

        // Foreground messages (tab focused) — surface as a toast.
        unsub = onMessage(messaging, (payload) => {
          const title = payload.notification?.title ?? 'Ustaz';
          const body = payload.notification?.body ?? '';
          toast(title, { description: body });
        });
      } catch (e) {
        if (!cancelled) {
          setStatus('error');
          console.warn('[fcm] setup failed (non-fatal)', e);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, [enabled, retryCount]);

  return { status, retry };
}
