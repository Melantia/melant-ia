// don_eloy_wisdom.js
// Módulo de Don Eloy: historias, amofinos y sabiduría popular

const HISTORIAS_JSON = 'knowledge_seeds/don_eloy_historias.json';

let historias = [];

export async function cargarHistorias() {
  try {
    if (historias.length > 0) return historias;
    const resp = await fetch(HISTORIAS_JSON);
    historias = await resp.json();
    return historias;
  } catch (err) {
    // Si offline, intenta cargar del cache del Service Worker
    if (window.caches) {
      const cache = await caches.open('melantia-static');
      const resp = await cache.match(HISTORIAS_JSON);
      if (resp) {
        historias = await resp.json();
        return historias;
      }
    }
    console.error('No se pudieron cargar historias de Don Eloy:', err);
    return [];
  }
}

export function narrarHistoria(idx = 0) {
  if (!('speechSynthesis' in window)) return;
  if (!historias.length) return;
  const texto = historias[idx % historias.length].texto;
  const utt = new SpeechSynthesisUtterance(texto);
  utt.voice = seleccionarVozDonEloy();
  utt.pitch = 0.82;
  utt.rate = 0.88;
  utt.lang = 'es-EC';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utt);
}

function seleccionarVozDonEloy() {
  const voces = window.speechSynthesis.getVoices();
  // Busca una voz masculina, grave y en español
  return (
    voces.find(
      (v) => v.lang.startsWith('es') && v.name.toLowerCase().includes('male')
    ) ||
    voces.find((v) => v.lang.startsWith('es')) ||
    voces[0]
  );
}

export const DonEloy = {
  cargarHistorias,
  narrarHistoria,
};
