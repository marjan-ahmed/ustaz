// hooks/useWebPushNotifications.ts
import { useState, useEffect } from 'react';

declare global {
  interface Window {
    PushManager: any;
  }
}

export const useWebPushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<globalThis.PushSubscription | null>(null);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    // Check if service workers and push notifications are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
    if (!supported) {
      console.error('Web Push is not supported in this browser');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered with scope:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  };

  const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if (!supported) {
      console.error('Web Push is not supported in this browser');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  };

  const subscribeToPushNotifications = async (
    registration: ServiceWorkerRegistration,
    vapidPublicKey: string
  ): Promise<PushSubscription | null> => {
    if (!supported || !registration.pushManager) {
      console.error('Push messaging is not supported');
      return null;
    }

    try {
      // Subscribe to push notifications
      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(vapidPublicKey),
      };

      const pushSubscription = await registration.pushManager.subscribe(subscribeOptions);
      setSubscription(pushSubscription);

      console.log('Push subscription successful:', JSON.stringify(pushSubscription));
      return pushSubscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  };

  const unsubscribeFromPushNotifications = async (
    registration: ServiceWorkerRegistration
  ): Promise<boolean> => {
    try {
      const pushSubscription = await registration.pushManager.getSubscription();
      if (pushSubscription) {
        await pushSubscription.unsubscribe();
        setSubscription(null);
        console.log('Unsubscribed from push notifications');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  };

  const sendSubscriptionToBackend = async (
    subscription: globalThis.PushSubscription,
    userId: string
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/save-push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          userId,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending subscription to backend:', error);
      return false;
    }
  };

  // Helper function to convert base64 string to Uint8Array
  const urlB64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  return {
    supported,
    permission,
    subscription,
    registerServiceWorker,
    requestNotificationPermission,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
    sendSubscriptionToBackend,
  };
};