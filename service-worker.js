// Service Worker - Virtux
const CACHE = 'virtux-v1';

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

// Fix: handle navigation preload correctly
self.addEventListener('fetch', function(e) {
  // فقط للطلبات من نفس الأصل
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    (async function() {
      // استخدام preloadResponse بشكل صحيح مع waitUntil
      const preload = e.preloadResponse;
      if (preload) {
        try {
          const res = await preload;
          if (res) return res;
        } catch(err) {}
      }
      // fallback: network
      try {
        return await fetch(e.request);
      } catch(err) {
        // fallback: cache
        const cached = await caches.match(e.request);
        if (cached) return cached;
        return new Response('Offline', { status: 503 });
      }
    })()
  );
});
