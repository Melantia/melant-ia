const CACHE_NAME = 'melantia-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/js/ml5.min.js',
  // '/assets/ui/models/coco-ssd/model.json', // Ruta comentada porque no existe
];

// Instalar y cachear assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Interceptar peticiones para servir desde caché (Offline First)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
