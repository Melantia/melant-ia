// src/shared/offline/cache.js
// Caché local de respuestas de API (offline-first).
// Clave: endpoint + payload → los resultados de cálculo puro
// (densidad, cronograma, UTM...) quedan disponibles sin red.

const PREFIX = "melantia.cache.";
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

export function cacheKey(url, payload = null) {
  return PREFIX + url + "|" + JSON.stringify(payload ?? null);
}

export function setCached(key, data) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({ data, cachedAt: Date.now() }),
    );
  } catch {
    // Cuota llena: la caché es best-effort, nunca bloquea.
  }
}

export function getCached(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, cachedAt } = JSON.parse(raw);
    if (Date.now() - cachedAt > TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return { data, cachedAt };
  } catch {
    return null;
  }
}

export function removeCached(key) {
  localStorage.removeItem(key);
}
