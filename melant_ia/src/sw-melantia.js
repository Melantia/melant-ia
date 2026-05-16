// sw-melantia.js — Service Worker para actualización híbrida MELANTIA
const CACHE_NAME = 'melantia-cache-v1';
const RECURSOS_CRITICOS = [
  '/knowledge_seeds/config.json',
  '/knowledge_seeds/10_comunidad_virtual/legal_data/guia_procesos_legales.json',
  '/knowledge_seeds/voces_melantia.json',
  '/knowledge_seeds/update.json',
  '/knowledge_seeds/modulo_seguridad.json',
  '/knowledge_seeds/don_eloy_historias.json',
  '/knowledge_seeds/config_voz.json',
  // Agrega más recursos si es necesario
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
