// public/sw.js - Service Worker for Web Push Notifications

self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (error) {
      console.error('Error parsing push data:', error);
      payload = { title: 'Notification', body: 'New notification received' };
    }
  } else {
    payload = { title: 'New Notification', body: 'You have a new notification' };
  }

  const options = {
    body: payload.body || 'Notification body',
    icon: '/icon-192x192.png', // You can customize this icon
    badge: '/icon-192x192.png', // Badge icon for notification
    data: {
      url: payload.url || '/' // URL to open when notification is clicked
    },
    actions: payload.actions || [] // Optional notification actions
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Ustaz Notification', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);

  event.notification.close();

  // Open a new window or focus existing one
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});

// Handle push subscription expiration (if needed)
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Push subscription expired or changed');
  // You would typically send the new subscription to your server here
});