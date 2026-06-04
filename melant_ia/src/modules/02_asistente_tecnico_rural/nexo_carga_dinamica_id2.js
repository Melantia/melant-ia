// Nexo de carga dinamica para ID 2 (Asistente Tecnico Rural)
// Une camara y voz con rutas reales del menu principal.

const RUTAS_CONOCIMIENTO = [
  'modules/02_asistente_tecnico_rural/conocimiento_comite_global.json',
  'knowledge_seeds/02_asistente_tecnico_rural/conocimiento_comite_global.json',
];

const CULTIVOS_ALIAS = [
  { id: 'cacao', alias: ['cacao'] },
  { id: 'cafe', alias: ['cafe'] },
  { id: 'maiz', alias: ['maiz', 'maiz_duro'] },
  { id: 'platano', alias: ['platano', 'banano', 'barraganete'] },
  { id: 'palma', alias: ['palma', 'aceitera'] },
  { id: 'limon', alias: ['limon', 'limon_sutil'] },
];

async function hablarId2(mensaje) {
  try {
    const mod = await import('../voz_melantia.js');
    if (typeof mod?.hablarMelantia === 'function') {
      await mod.hablarMelantia(mensaje, 2);
      return;
    }
  } catch {
    // Fallback simple.
  }

  if ('speechSynthesis' in window) {
    const utt = new SpeechSynthesisUtterance(mensaje);
    utt.lang = 'es-EC';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utt);
  }
}

async function cargarConocimientoUnificado() {
  for (const ruta of RUTAS_CONOCIMIENTO) {
    try {
      const res = await fetch(ruta);
      if (!res.ok) continue;
      return await res.json();
    } catch {
      // Probar siguiente ruta.
    }
  }
  return null;
}

function normalizar(valor) {
  return String(valor || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectarCultivoDesdeTexto(texto) {
  const limpio = normalizar(texto);
  for (const cultivo of CULTIVOS_ALIAS) {
    if (cultivo.alias.some((a) => limpio.includes(a))) {
      return cultivo.id;
    }
  }
  return null;
}

function detectarVeterinariaDesdeConocimiento(texto, conocimiento) {
  const limpio = normalizar(texto);
  const clases = Object.keys(conocimiento?.imagenes_veterinaria || {});
  if (!clases.length) return false;
  return clases.some((clase) => limpio.includes(normalizar(clase)));
}

async function navegarConContextoCultivo(cultivoId) {
  try {
    localStorage.setItem('melantia_cultivo_activo', cultivoId);
    window.dispatchEvent(
      new CustomEvent('melantia:cultivo:seleccionado', {
        detail: { cultivo: cultivoId },
      })
    );
  } catch {
    // Mantener flujo aunque no se pueda emitir el evento.
  }

  if (typeof window.navegarA === 'function') {
    await window.navegarA('Asistente Técnico en Cultivos');
  }
}

async function enrutarDesdeFoto(file, conocimiento = null) {
  const nombre = file?.name || '';
  const cultivo = detectarCultivoDesdeTexto(nombre);

  if (cultivo) {
    await hablarId2(
      `Foto detectada para ${cultivo}. Abriendo Asistente Tecnico en Cultivos.`
    );
    await navegarConContextoCultivo(cultivo);
    return { ok: true, destino: 'Asistente Técnico en Cultivos', cultivo };
  }

  if (detectarVeterinariaDesdeConocimiento(nombre, conocimiento)) {
    await hablarId2(
      'La foto parece veterinaria. Abriendo Asistente Tecnico Veterinario.'
    );
    if (typeof window.navegarA === 'function') {
      await window.navegarA('Asistente Técnico Veterinario');
    }
    return { ok: true, destino: 'Asistente Técnico Veterinario' };
  }

  await hablarId2(
    'No detecte cultivo en el nombre de la foto. Abrire Vision Artificial para analisis.'
  );
  if (typeof window.navegarA === 'function') {
    await window.navegarA('Visión Artificial');
  }
  return { ok: true, destino: 'Visión Artificial' };
}

export async function abrirFlujoFotoRuralID2() {
  const conocimiento = await cargarConocimientoUnificado();
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.setAttribute('capture', 'environment');

  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) {
      await hablarId2('No se selecciono ninguna foto.');
      return;
    }
    await enrutarDesdeFoto(file, conocimiento);
  });

  input.click();
}

window.abrirFlujoFotoRuralID2 = abrirFlujoFotoRuralID2;

export default {
  abrirFlujoFotoRuralID2,
};
