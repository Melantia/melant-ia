/**
 * service-worker.js — MELANTIA PWA
 * Instalador y Actualizador Offline.
 * Gestiona caché de assets, conocimientos JSON y módulos.
 * Estrategia: Cache-First para assets, Network-First para JSON de conocimiento.
 */

const CACHE_VERSION = 'melantia-v1';
const CACHE_KNOWLEDGE = 'melantia-knowledge-v1';

// Assets de shell — se cachean en la instalación inicial
const SHELL_ASSETS = [
  './',
  './index.html',
  './src/staff_controller.js',
  './src/main_controller.js',
  './src/manifest.json',
  './src/knowledge_seeds/voces_melantia.json',
  './src/knowledge_seeds/config_voz.json',
  './src/knowledge_seeds/config.json',
  './src/config_structure_melant_ia/app_structure_melant_ia.json',
  './src/storage/assets/melantia_idle.png',
  './src/storage/assets/melantia_active.png',
];

// Archivos de conocimiento técnico — actualizables en días programados
const KNOWLEDGE_ASSETS = [
  './src/database/guia_procesos_legales.json',
  './src/database/tramites_instituciones_gobierno.json',
  './src/database/asesor_legal_agro.json',
  './src/database/conocimiento_agro.json',
  './src/knowledge_seeds/01_cerebros_tecnicos/cerebro_agricola.md',
  './src/knowledge_seeds/01_cerebros_tecnicos/cerebro_legal.md',
  './src/knowledge_seeds/01_cerebros_tecnicos/cerebro_pecuario.md',
  './src/knowledge_seeds/01_cerebros_tecnicos/cerebro_regenerativo.md',
  './src/knowledge_seeds/01_cerebros_tecnicos/cerebro_carbono.md',
];

// ─────────────────────────────────────────────
// INSTALACIÓN — guarda el shell completo
// ─────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => {
        return cache.addAll(SHELL_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// ─────────────────────────────────────────────
// ACTIVACIÓN — limpia versiones antiguas
// ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_VERSION && k !== CACHE_KNOWLEDGE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─────────────────────────────────────────────
// FETCH — estrategia según tipo de recurso
// ─────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignorar peticiones externas (analytics, CDN, etc.)
  if (url.origin !== self.location.origin) return;

  const esConocimiento = KNOWLEDGE_ASSETS.some((a) =>
    url.pathname.endsWith(a.replace('./', ''))
  );

  if (esConocimiento) {
    // Network-First para conocimiento: intenta red, cae a caché
    event.respondWith(
      fetch(event.request)
        .then((resp) => {
          const clon = resp.clone();
          caches.open(CACHE_KNOWLEDGE).then((c) => c.put(event.request, clon));
          return resp;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache-First para shell: respuesta instantánea
    event.respondWith(
      caches
        .match(event.request)
        .then((cached) => cached || fetch(event.request))
    );
  }
});

// ─────────────────────────────────────────────
// SEMÁFORO DE SINCRONIZACIÓN
// Solo descarga si: energía OK + señal 4G/WiFi
// Retorna: { verde, motivo }
// ─────────────────────────────────────────────
async function semaforoSeguro(forzar = false) {
  if (forzar) return { verde: true, motivo: 'FORZADO' };

  // — Energía —
  let estaCargando = false;
  let nivelBateria = 100;
  try {
    const bat = await self.clients.matchAll().then(() => null); // getBattery no existe en SW; el cliente la envía
    // Los datos de batería llegan en el mensaje como `bateria`
    // (ver main_controller.js que los adjunta al postMessage)
  } catch (_) {}

  // En el SW solo disponemos de lo que el cliente nos pasó en el mensaje
  return { verde: true, motivo: 'PRE_VALIDADO' }; // validación real en cliente
}

// ─────────────────────────────────────────────
// SYNC — retroalimentación programada
// Recibe mensaje desde main_controller.js
// Soporta modo forzado (emergencia de plaga)
// ─────────────────────────────────────────────
// Cola de reintento para descargas interrumpidas
const _colaReintento = new Map(); // url → intentos fallidos

self.addEventListener('message', async (event) => {
  if (event.data?.tipo !== 'ACTUALIZAR_CONOCIMIENTO') return;

  const forzar = event.data?.forzar === true;
  const cache = await caches.open(CACHE_KNOWLEDGE);
  let actualizados = 0;
  let errores = 0;
  const fallidos = [];

  for (const url of KNOWLEDGE_ASSETS) {
    // Obtener versión anterior para rollback si la descarga corrompe
    const versionAnterior = await cache.match(url);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 s max

      const resp = await fetch(url, {
        cache: 'no-cache',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        // Validar que la respuesta tiene contenido real (anti-corrupción)
        const texto = await resp.clone().text();
        if (texto && texto.length > 10) {
          await cache.put(url, resp);
          actualizados++;
          _colaReintento.delete(url); // éxito → limpiar de cola
        } else {
          // Respuesta vacía/corrupta — mantener versión anterior
          if (versionAnterior) await cache.put(url, versionAnterior);
          errores++;
        }
      } else {
        if (versionAnterior) await cache.put(url, versionAnterior);
        fallidos.push(url);
        errores++;
      }
    } catch (err) {
      // Señal cortada a mitad — rollback atómico
      if (versionAnterior) await cache.put(url, versionAnterior);
      const intentos = (_colaReintento.get(url) || 0) + 1;
      _colaReintento.set(url, intentos);
      fallidos.push(url);
      errores++;
      console.log(`[SW] Pausa atómica en ${url} (intento ${intentos})`);
    }
  }

  // Notificar resultado a la app
  event.source?.postMessage({
    tipo: 'ACTUALIZACION_COMPLETA',
    actualizados,
    errores,
    fallidos,
    forzar,
    timestamp: new Date().toISOString(),
  });

  // GC automático tras actualización exitosa
  if (actualizados > 0) {
    const allKeys = await cache.keys();
    const LIMITE_ENTRADAS = 60;
    if (allKeys.length > LIMITE_ENTRADAS) {
      const sobrantes = allKeys.slice(0, allKeys.length - LIMITE_ENTRADAS);
      await Promise.all(sobrantes.map((k) => cache.delete(k)));
      console.log(`[SW] GC: ${sobrantes.length} entradas antiguas eliminadas.`);
    }
  }

  // Reencolar archivos fallidos para próximo intento
  if (fallidos.length > 0) {
    console.log(`[SW] ${fallidos.length} archivos en cola de reintento.`);
  }
});

// ─────────────────────────────────────────────
// LIMPIAR_CACHE — Recolector manual desde la app
// ─────────────────────────────────────────────
self.addEventListener('message', async (event) => {
  if (event.data?.tipo !== 'LIMPIAR_CACHE') return;
  const cache = await caches.open(CACHE_KNOWLEDGE);
  const keys = await cache.keys();
  const LIMITE = 40;
  let eliminados = 0;
  if (keys.length > LIMITE) {
    const sobrantes = keys.slice(0, keys.length - LIMITE);
    await Promise.all(sobrantes.map((k) => cache.delete(k)));
    eliminados = sobrantes.length;
  }
  event.source?.postMessage({
    tipo: 'CACHE_LIMPIA',
    eliminados,
    restantes: Math.min(keys.length, LIMITE),
  });
});
