/**
 * Service Worker phục vụ nhận Web Push Notification ngầm (Background Messaging)
 * Tương thích PWA trên iOS 16.4+ (Standalone) và Android
 */

// Lắng nghe sự kiện Push từ máy chủ Firebase Cloud Messaging
self.addEventListener('push', (event) => {
  let title = 'Tổ Ấm Nhỏ';
  let options = {
    body: 'Bạn có cập nhật mới từ gia đình',
    icon: '/vite.svg',
    badge: '/vite.svg',
    vibrate: [100, 50, 100],
    data: { url: '/' }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      if (payload.notification) {
        title = payload.notification.title || title;
        options.body = payload.notification.body || options.body;
      } else if (payload.data) {
        title = payload.data.title || title;
        options.body = payload.data.body || options.body;
      }
      if (payload.data?.url) {
        options.data.url = payload.data.url;
      }
    } catch {
      const text = event.data.text();
      if (text) options.body = text;
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Lắng nghe khi người dùng bấm vào thông báo
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
