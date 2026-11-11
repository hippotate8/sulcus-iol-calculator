const CACHE = 'sulcus-iol-v113-headerfix';
const ASSETS = ['./', './index.html', './style.css', './app.js', './core.mjs', './manifest.webmanifest', './icon-192.png', './icon-512.png', './yes-logo.png', './eom-logo.png'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('sulcus-iol-') && key !== CACHE).map(key => caches.delete(key))))); self.clients.claim(); });
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)).catch(() => {}); }
    return response;
  }).catch(() => caches.match(event.request, { ignoreSearch: true })));
});
