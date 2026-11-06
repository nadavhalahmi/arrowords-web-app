// Service Worker for Arrowords Web Push Notifications (iOS PWA & Web)
'use strict';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || '🔥 Arrowords';
  const options = {
    body: data.body || 'Your daily Arroword puzzle is ready!',
    icon: 'icons/Icon-192.png',
    badge: 'icons/Icon-192.png',
    data: {
      url: data.url || '/'
    },
    tag: data.tag || 'arroword-notification',
    renotify: true
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const tag = event.notification.tag || 'web_push';
  let targetUrl = event.notification.data?.url || self.registration.scope;
  if (targetUrl === '/' || targetUrl === './') {
    targetUrl = self.registration.scope;
  } else if (!targetUrl.startsWith('http')) {
    targetUrl = new URL(targetUrl, self.registration.scope).href;
  }

  // Append notification query parameters for launch/navigation detection
  try {
    const parsedUrl = new URL(targetUrl);
    parsedUrl.searchParams.set('from_notif', '1');
    parsedUrl.searchParams.set('notif_tag', tag);
    targetUrl = parsedUrl.href;
  } catch (e) {
    if (targetUrl.includes('?')) {
      targetUrl += `&from_notif=1&notif_tag=${encodeURIComponent(tag)}`;
    } else {
      targetUrl += `?from_notif=1&notif_tag=${encodeURIComponent(tag)}`;
    }
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          try {
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              tag: tag,
              timestamp: new Date().toISOString()
            });
          } catch (e) {}
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
