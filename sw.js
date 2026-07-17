/* ════════════════════════════════════════
   بسمة — Service Worker + FCM
════════════════════════════════════════ */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBo-Uyp1ykA1HcPMm5LV5puvBGF5_-jJFU",
  authDomain: "basmah-ad91f.firebaseapp.com",
  projectId: "basmah-ad91f",
  storageBucket: "basmah-ad91f.firebasestorage.app",
  messagingSenderId: "841162019434",
  appId: "1:841162019434:web:5fbbbef1b504a97a67b013"
});

const messaging = firebase.messaging();

const CACHE_NAME = 'basmah-v3';
const ASSETS = [
  '/BASMAH/',
  '/BASMAH/index.html',
  '/BASMAH/kahf.html',
  '/BASMAH/manifest.json',
  '/BASMAH/favicon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS).catch(()=>{})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(()=>cached))
  );
});

messaging.onBackgroundMessage(payload => {
  const { title, body, url } = payload.data || payload.notification || {};
  return self.registration.showNotification(title || 'بسمة', {
    body: body || '',
    icon: '/BASMAH/favicon.png',
    badge: '/BASMAH/favicon.png',
    vibrate: [200, 100, 200],
    data: { url: url || '/BASMAH/' }
  });
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/BASMAH/';
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      for (const c of list) {
        if (c.url.includes('/BASMAH/') && 'focus' in c) return c.focus();
      }
      return clients.openWindow(url);
    })
  );
});

self.addEventListener('message', e => {
  if (e.data?.type === 'FIRE_NOTIFICATION') {
    const { title, body, url } = e.data;
    self.registration.showNotification(title, {
      body,
      icon: '/BASMAH/favicon.png',
      badge: '/BASMAH/favicon.png',
      vibrate: [200, 100, 200],
      data: { url: url || '/BASMAH/' }
    });
  }
});
