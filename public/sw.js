// Service Worker — Yalo Glam's PWA v10 (Force-Refresh Cache)
const CACHE_NAME = 'yaloglamss-v10';
const ASSETS = [
  './',
  './index.html',
  './admin.html',
  './reservation.html',
  './manifest.json',
  './manifest-client.json',
  './icon-192.png',
  './icon-512.png',
  './logo.png',
  './logo.jpg',
  './css/style.css',
  './css/admin.css',
  './js/config.js',
  './js/admin.js',
  './js/client.js',
  './js/reservation.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(ASSETS.map(url => cache.add(url)));
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  // Network first, fallback to cache if offline
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
