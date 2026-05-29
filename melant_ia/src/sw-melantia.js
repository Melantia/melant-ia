// sw-melantia.js — Service Worker para actualización híbrida MELANTIA
const CACHE_NAME = 'melantia-cache-v1';
// Solo recursos esenciales para arranque y uso offline básico
const RECURSOS_CRITICOS = [
  '/knowledge_seeds/config.json',
  '/knowledge_seeds/update.json',
  // Elimina PDFs, imágenes grandes y recursos no críticos
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(RECURSOS_CRITICOS))
  );
});

self.addEventListener('fetch', (event) => {
  if (RECURSOS_CRITICOS.some((r) => event.request.url.includes(r))) {
    event.respondWith(
      fetch(event.request)
        .then((resp) => {
          const respClone = resp.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, respClone));
          return resp;
        })
        .catch(() => caches.match(event.request))
    );
  }
});

// Actualización automática cuando hay conexión
self.addEventListener('sync', (event) => {
  if (event.tag === 'actualizar-cerebro') {
    event.waitUntil(
      Promise.all(
        RECURSOS_CRITICOS.map(async (recurso) => {
          try {
            const resp = await fetch(recurso + '?t=' + Date.now());
            if (resp.ok) {
              const cache = await caches.open(CACHE_NAME);
              await cache.put(recurso, resp.clone());
            }
          } catch (e) {}
        })
      )
    );
  }
});
