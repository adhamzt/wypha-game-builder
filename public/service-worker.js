// Offline-first App-Shell Service Worker for WYPHA Game & Lesson Pack Builder (V41 PWA)
const CACHE_NAME = 'wypha-pack-builder-pwa-v41-20261119';
const SHELL_URLS = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png']
  .map(p => new URL(p, self.registration.scope).href);

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(SHELL_URLS.map(u => cache.add(new Request(u, { cache: 'reload' }))))
    )
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('wypha-pack-builder-pwa-') && k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const root = new URL(self.registration.scope);
  if (url.origin !== root.origin) return;
  const isIndex = url.pathname === root.pathname || url.pathname === new URL('index.html', root).pathname;
  const key = isIndex ? SHELL_URLS[1] : url.href;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(isIndex ? new Request(event.request, { cache: 'no-store' }) : event.request);
      if (response && response.ok) {
        await cache.put(key, response.clone());
        return response;
      }
      return (await cache.match(key)) || response;
    } catch (err) {
      return (await cache.match(key)) || (await cache.match(SHELL_URLS[1])) || Response.error();
    }
  })());
});
