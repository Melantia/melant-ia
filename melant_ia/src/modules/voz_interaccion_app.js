import { hablarMelantia } from './voz_melantia.js';

const MAPA_COMANDOS = [
  {
    patron:
      /\b(asistente tecnico rural|asistente técnico rural|menu tecnico rural|menu técnico rural)\b/,
    destino: 'Asistente Técnico Rural',
  },
  {
    patron: /\b(cultivos|asistente de cultivos|abrir cultivos)\b/,
    destino: 'Asistente Técnico en Cultivos',
  },
  {
    patron: /\b(veterinario|abrir veterinario|asistente veterinario)\b/,
    destino: 'Asistente Técnico Veterinario',
  },
  {
    patron: /\b(salud|medicina veterinaria|salud veterinaria)\b/,
    destino: 'Salud y Medicina Veterinaria',
  },
  {
    patron: /\b(calculadora|abrir calculadora)\b/,
    destino: 'Calculadora Agrícola',
  },
  {
    patron: /\b(clima|clima inteligente|meteorologia|meteorología)\b/,
    destino: 'Clima Inteligente',
  },
  { patron: /\b(cronograma|siembra)\b/, destino: 'Cronograma de Siembra' },
  { patron: /\b(calendario lunar|luna)\b/, destino: 'Calendario Lunar' },
  {
    patron: /\b(levantamiento de lote|levantamiento|medir lote|lote)\b/,
    destino: 'Levantamiento de Lote',
  },
  {
    patron: /\b(gps|medicion de terrenos|medición de terrenos)\b/,
    destino: 'GPS (Medición de Terrenos)',
  },
  {
    patron: /\b(inventario|inventario bio|biodiversidad)\b/,
    destino: 'Inventario de Biodiversidad',
  },
  {
    patron: /\b(biblioteca|biblioteca tecnica|biblioteca técnica)\b/,
    destino: 'Biblioteca Técnica Rural',
  },
  {
    patron: /\b(agricultura de precision|agricultura de precisión|sensores)\b/,
    destino: 'Agricultura de Precisión (Uso de Sensores)',
  },
  {
    patron: /\b(vision artificial|visión artificial|foto|imagen)\b/,
    destino: 'Visión Artificial',
  },
  {
    patron: /\b(vision satelital|visión satelital|satelital)\b/,
    destino: 'Visión Satelital',
  },
  {
    patron: /\b(volver|menu principal|menú principal|inicio)\b/,
    destino: '__volver__',
  },
];

const CULTIVOS_VOZ = [
  { id: 'cacao', alias: ['cacao'] },
  { id: 'cafe', alias: ['cafe'] },
  { id: 'palma', alias: ['palma', 'palma aceitera'] },
  { id: 'maiz', alias: ['maiz', 'maiz duro'] },
  { id: 'platano', alias: ['platano', 'barraganete', 'banano'] },
];

function normalizarTexto(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function obtenerHabla() {
  return typeof hablarMelantia === 'function' ? hablarMelantia : null;
}

function detectarCultivo(textoNormalizado) {
  for (const cultivo of CULTIVOS_VOZ) {
    if (cultivo.alias.some((nombre) => textoNormalizado.includes(nombre))) {
      return cultivo.id;
    }
  }
  return null;
}

function esIntencionCultivo(textoNormalizado) {
  return /(quiero|necesito|revisar|ver|mostrar|abrir|consultar|analizar|trabajar|gestionar)/.test(
    textoNormalizado
  );
}

async function hablar(mensaje) {
  const hablarFn = obtenerHabla();
  if (hablarFn) {
    try {
      await hablarFn(mensaje, 2);
      return;
    } catch {
      // Fallback a voz simple.
    }
  }

  if ('speechSynthesis' in window) {
    const utt = new SpeechSynthesisUtterance(mensaje);
    utt.lang = 'es-EC';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utt);
  }
}

export class VozInteraccionApp {
  constructor() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = SpeechRecognition ? new SpeechRecognition() : null;
    this.activa = false;
    this._enCallback = null;

    if (this.recognition) {
      this.recognition.lang = 'es-EC';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.onresult = async (event) => {
        const texto = event.results?.[0]?.[0]?.transcript || '';
        await this.procesarComando(texto);
      };
      this.recognition.onerror = async (event) => {
        if (event?.error !== 'aborted') {
          await hablar('No pude entender el comando de voz. Intenta de nuevo.');
        }
      };
      this.recognition.onend = () => {
        this.activa = false;
        this._actualizarBoton(false);
      };
    }
  }

  _actualizarBoton(activa) {
    const boton = document.getElementById('btn-voz-general');
    if (!boton) return;
    boton.setAttribute('aria-pressed', String(activa));
    boton.style.background = activa
      ? '#14532d'
      : 'var(--color-asistente, #27ae60)';
    const icono = boton.querySelector('span');
    if (icono) icono.textContent = activa ? '🎙️' : '🔊';
  }

  _cerrarPanelesEspeciales() {
    if (typeof window.volverAlMenuPrincipal === 'function') {
      window.volverAlMenuPrincipal();
      return true;
    }
    if (typeof window.volverAlMenu === 'function') {
      window.volverAlMenu();
      return true;
    }
    return false;
  }

  _resolverDestino(texto) {
    const limpio = normalizarTexto(texto);
    for (const item of MAPA_COMANDOS) {
      if (item.patron.test(limpio)) return item.destino;
    }
    return null;
  }

  async ayudar() {
    await hablar(
      'Di: abre cultivos, abre veterinario, abre calculadora, clima inteligente, cronograma, calendario lunar, levantamiento de lote, GPS, inventario bio, visión artificial o volver al menú principal.'
    );
  }

  async procesarComando(texto) {
    const limpio = normalizarTexto(texto);
    if (!limpio) {
      await hablar('No escuché nada claro. Intenta de nuevo.');
      return { ok: false, motivo: 'vacio' };
    }

    if (/\bayuda\b/.test(limpio)) {
      await this.ayudar();
      return { ok: true, accion: 'ayuda' };
    }

    if (
      /\b(foto|camara|cámara|tomar foto|subir foto|analizar foto)\b/.test(
        limpio
      )
    ) {
      try {
        await import('./02_asistente_tecnico_rural/nexo_carga_dinamica_id2.js');
        if (typeof window.abrirFlujoFotoRuralID2 === 'function') {
          await hablar(
            'Abriendo camara para direccionarte al servicio tecnico del modulo rural.'
          );
          await window.abrirFlujoFotoRuralID2();
          return { ok: true, accion: 'foto_id2' };
        }
      } catch {
        // Continuar con flujo de comandos normal.
      }
    }

    const cultivoDetectado = detectarCultivo(limpio);
    if (cultivoDetectado && esIntencionCultivo(limpio)) {
      try {
        localStorage.setItem('melantia_cultivo_activo', cultivoDetectado);
        window.dispatchEvent(
          new CustomEvent('melantia:cultivo:seleccionado', {
            detail: { cultivo: cultivoDetectado },
          })
        );
      } catch {
        // Mantener flujo de voz aun si falla el evento.
      }

      if (typeof window.navegarA === 'function') {
        await hablar(
          `Listo. Revisemos ${cultivoDetectado}. Abriendo Asistente Técnico en Cultivos.`
        );
        await window.navegarA('Asistente Técnico en Cultivos');
        return {
          ok: true,
          accion: 'navegar_cultivo',
          destino: 'Asistente Técnico en Cultivos',
          cultivo: cultivoDetectado,
        };
      }
    }

    const destino = this._resolverDestino(limpio);
    if (!destino) {
      await hablar(
        'No reconocí ese comando. Di ayuda para escuchar las opciones.'
      );
      return { ok: false, motivo: 'no_reconocido', texto: limpio };
    }

    if (destino === '__volver__') {
      this._cerrarPanelesEspeciales();
      await hablar('Volviendo al menú principal.');
      return { ok: true, accion: 'volver' };
    }

    if (typeof window.navegarA === 'function') {
      await hablar(`Abriendo ${destino}.`);
      await window.navegarA(destino);
      return { ok: true, accion: 'navegar', destino };
    }

    await hablar(
      'La navegación por voz todavía no está disponible en este momento.'
    );
    return { ok: false, motivo: 'sin_navegacion', destino };
  }

  async toggle() {
    if (!this.recognition) {
      await hablar('Este navegador no soporta reconocimiento de voz.');
      return { ok: false, motivo: 'sin_soporte' };
    }

    if (!window.isSecureContext) {
      await hablar(
        'El reconocimiento de voz requiere un contexto seguro, como localhost o HTTPS.'
      );
      return { ok: false, motivo: 'contexto_inseguro' };
    }

    if (this.activa) {
      this.recognition.stop();
      this.activa = false;
      this._actualizarBoton(false);
      await hablar('Mando de voz desactivado.');
      return { ok: true, activa: false };
    }

    this.activa = true;
    this._actualizarBoton(true);
    await hablar(
      'Mando de voz activado. Di ayuda para escuchar los comandos disponibles.'
    );
    try {
      this.recognition.start();
    } catch {
      this.activa = false;
      this._actualizarBoton(false);
      await hablar('No pude iniciar el reconocimiento de voz.');
      return { ok: false, motivo: 'inicio_fallido' };
    }
    return { ok: true, activa: true };
  }
}

export async function activarVozMelantia() {
  if (!window.__melantiaVozInteraccion) {
    window.__melantiaVozInteraccion = new VozInteraccionApp();
  }
  return window.__melantiaVozInteraccion.toggle();
}

export async function ejecutarComandoVoz(texto) {
  if (!window.__melantiaVozInteraccion) {
    window.__melantiaVozInteraccion = new VozInteraccionApp();
  }
  return window.__melantiaVozInteraccion.procesarComando(texto);
}

window.activarVozMelantia = activarVozMelantia;
window.ejecutarComandoVoz = ejecutarComandoVoz;
