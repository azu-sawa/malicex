// Malicex service worker: cache-first, refreshed in the background. Works for any folder layout.
const CACHE = 'malicex-md-5';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
    e.respondWith(caches.open(CACHE).then(c => c.match(e.request, { ignoreSearch: false }).then(hit => {
        const net = fetch(e.request).then(r => { if (r && r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
        return hit || net;
    })));
});
