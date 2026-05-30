// public/firebase-messaging-sw.js
// Firebase Cloud Messaging service worker — handles background push messages
// (when the app tab is closed or not focused).
//
// WHY the config is hardcoded here:
//   Service workers run in a separate global scope with no access to Node.js or
//   Next.js build-time variables. The Firebase web config values are NOT secrets
//   (they identify the project to the public Firebase SDK; access is controlled
//   by Firebase Security Rules and FCM server keys). Hardcoding them here is the
//   official Firebase-recommended approach for web push service workers.
//
// This file coexists with public/sw.js (Workbox PWA caching) — they register
// under different scopes and serve different purposes.

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            'AIzaSyAX-GhzAZ-yRgQENpxxCEHaxYE3tEle40o',
  authDomain:        'ustaz-app.firebaseapp.com',
  projectId:         'ustaz-app',
  storageBucket:     'ustaz-app.firebasestorage.app',
  messagingSenderId: '430784338026',
  appId:             '1:430784338026:web:ade67650050e145616d213',
});

const messaging = firebase.messaging();

// Called when a push message arrives and the app tab is closed / in background.
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw] background message received', payload);

  const { title, body, icon } = payload.notification ?? {};
  const data = payload.data ?? {};

  const notificationTitle = title ?? 'Ustaz';
  const notificationOptions = {
    body:  body  ?? '',
    icon:  icon  ?? '/ustaz_logo.png',
    badge: '/icon512_rounded.png',
    data:  { url: data.url ?? '/', ...data },
    requireInteraction: true,
    tag: data.requestId ?? 'ustaz-push',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Open / focus the app when the user taps the notification.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow(targetUrl);
      }),
  );
});
