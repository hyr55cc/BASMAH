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

const CACHE_NAME = 'basmah-v4';
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

  const url = new URL(e.request.url);
  const isHTML = e.request.mode === 'navigate' ||
                 e.request.destination === 'document' ||
                 url.pathname.endsWith('.html') ||
                 url.pathname.endsWith('/');

  if(isHTML){
    // NETWORK-FIRST: always try to get the freshest page, fall back to cache offline
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request))
    );
  } else {
    // CACHE-FIRST for static assets (icons, fonts) but refresh in background
    e.respondWith(
      caches.match(e.request).then(cached => {
        const network = fetch(e.request).then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
  }
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
  if (e.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
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
