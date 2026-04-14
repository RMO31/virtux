// Virtux Service Worker - fixes preloadResponse warning

self.addEventListener('install', function(e) {
  e.waitUntil(
    (self.registration.navigationPreload
      ? self.registration.navigationPreload.disable()
      : Promise.resolve()
    ).then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    Promise.all([
      self.registration.navigationPreload
        ? self.registration.navigationPreload.disable()
        : Promise.resolve(),
      caches.keys().then(function(keys) {
        return Promise.all(keys.map(function(k) { return caches.delete(k); }));
      }),
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', function(e) {
  e.respondWith(fetch(e.request).catch(function() {
    return new Response('', { status: 503 });
  }));
});
