// sw.js

const CACHE_NAME = 'marksnip-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/common.css',
  '/js/common.js',
  '/manifest.json',
  '/images/icon-192x192.png',
  '/images/icon-512x512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
