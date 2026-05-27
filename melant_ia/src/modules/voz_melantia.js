// voz_melantia.js — Utilidad para hablar con la voz y estilo correcto según el módulo MELANTIA
// Uso seguro, offline, y selecciona voz/estilo desde voces_melantia.json

let vocesConfig = null;

async function cargarVocesConfig() {
  if (vocesConfig) return vocesConfig;
  const resp = await fetch('knowledge_seeds/voces_melantia.json');
  vocesConfig = await resp.json();
  return vocesConfig;
}

export async function hablarMelantia(mensaje, moduloId, funcion = null) {
  if (!('speechSynthesis' in window)) return;
  await cargarVocesConfig();
  const voces = window.speechSynthesis.getVoices();
  // Buscar config del módulo
  let vozNombre = null,
    genero = null,
    estilo = {};
  for (const modulo of vocesConfig.modulos) {
    if (modulo.id === moduloId) {
      if (funcion && modulo.funciones && modulo.funciones[funcion]) {
        vozNombre = modulo.funciones[funcion].voz;
        genero = modulo.funciones[funcion].genero || modulo.genero;
        estilo = modulo.funciones[funcion].estilo || {};
      } else {
        vozNombre = modulo.voz_principal;
        genero = modulo.genero;
        estilo = modulo.estilo || {};
      }
      break;
    }
  }
  // Selección de voz
  let voz = null;
  if (vozNombre) {
    voz = voces.find((v) =>
      v.name.toLowerCase().includes(vozNombre.toLowerCase())
    );
  }
  if (!voz && genero) {
    voz = voces.find(
      (v) =>
        v.lang.startsWith('es') &&
        v.name.toLowerCase().includes(genero.toLowerCase())
    );
  }
  if (!voz) {
    voz = voces.find((v) => v.lang.startsWith('es')) || voces[0];
  }
  // Configuración de estilo
  const utt = new window.SpeechSynthesisUtterance(mensaje);
  utt.voice = voz;
  utt.lang = voz ? voz.lang : 'es-EC';
  utt.pitch = estilo.pitch || 1.0;
  utt.rate = estilo.rate || 1.0;
  utt.volume = estilo.volume || 1.0;
  // Seguridad: cancelar antes de hablar y dividir frases largas
  window.speechSynthesis.cancel();
  const partes = mensaje.match(/.{1,120}(\.|\!|\?|$)/g) || [mensaje];
  for (const parte of partes) {
    utt.text = parte.trim();
    window.speechSynthesis.speak(utt);
  }
}

// Ejemplo de uso en un comando por voz:
// import { hablarMelantia } from './voz_melantia.js';
// await hablarMelantia('Finca agregada correctamente.', 3); // 3 = Gestión de Fincas y Trazabilidad
