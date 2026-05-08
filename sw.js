/* ════════════════════════════════════════
   بسمة — Service Worker
   الإشعارات في الخلفية + التخزين المؤقت
════════════════════════════════════════ */

const CACHE_NAME = 'basmah-v1';
const ASSETS = [
  '/BASMAH/',
  '/BASMAH/index.html',
  '/BASMAH/prayer.html',
  '/BASMAH/notify.html',
  '/BASMAH/manifest.json',
  '/BASMAH/favicon.png'
];

/* ── INSTALL: cache assets ── */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

/* ── ACTIVATE: clean old caches ── */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* ── FETCH: serve from cache, fallback to network ── */
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

/* ── NOTIFICATION CLICK ── */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/BASMAH/';
  e.waitUntil(
    clients.matchAll({type:'window'}).then(list => {
      for(const c of list){
        if(c.url.includes('/BASMAH/') && 'focus' in c) return c.focus();
      }
      return clients.openWindow(url);
    })
  );
});

/* ── BACKGROUND SYNC: check & fire scheduled notifications ── */
self.addEventListener('message', e => {
  if(e.data?.type === 'SCHEDULE_NOTIFICATIONS'){
    const cfg = e.data.cfg;
    scheduleFromSW(cfg);
  }
});

/* ── PERIODIC CHECK (via setInterval message from page) ── */
self.addEventListener('message', e => {
  if(e.data?.type === 'FIRE_NOTIFICATION'){
    const {title, body, url} = e.data;
    self.registration.showNotification(title, {
      body,
      icon: '/BASMAH/favicon.png',
      badge: '/BASMAH/favicon.png',
      vibrate: [200, 100, 200],
      data: {url: url || '/BASMAH/'},
      requireInteraction: false,
      silent: false
    });
  }
});
