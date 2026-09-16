const REVISION = '__COMMIT_SHA__';
const CACHE_PREFIX = 'marksnip-cache-';
const CACHE_NAME = CACHE_PREFIX + REVISION;
const APP_SHELL = [
  './',
  './index.html',
  './css/common.css?v=' + REVISION,
  './js/common.js?v=' + REVISION,
  './manifest.json?v=' + REVISION,
  './images/favicon.png?v=' + REVISION,
  './images/marksnip_icon.png?v=' + REVISION,
  './images/marksnip_logo.png?v=' + REVISION,
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('./', copy));
          return response;
        })
        .catch(() => caches.match('./'))
    );
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(cached => cached || fetch(request))
  );
});
