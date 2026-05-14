// Este archivo ahora solo CARGA la estructura desde el JSON
const fs = require('fs');
const path = require('path');

const Melant_ia = {
  // Cargamos los datos desde el archivo unificado
  data: JSON.parse(
    fs.readFileSync(
      path.join(__dirname, 'app_structure_melant_ia.json'),
      'utf8'
    )
  ),

  init() {
    console.log(
      `MELANTIA: Sistema Nervioso Activo - Versión ${this.data.config.version}`
    );
    console.log(`Modo Offline: ${this.data.offline_notice}`);
    // Aquí iría el código para renderizar el menú basado en data.menu_principal
  },

  // ==============================================
  // Melantín — Robot Guardián Amistoso
  // Uso: Melant_ia.pensar('activo') / pensar('listo')
  // Llámalo desde cualquier sub-módulo al procesar.
  // ==============================================
  pensar(estado) {
    const container = document.getElementById('ai-status-container');
    const text = document.querySelector('.status-text');
    if (!container || !text) return;

    if (estado === 'activo') {
      container.classList.add('thinking-active');
      text.style.display = 'block';
      text.innerText = 'MELANTIA ESTÁ TRABAJANDO LOCALMENTE...';
    } else {
      container.classList.remove('thinking-active');
      text.style.display = 'none';
    }
  },
};

Melant_ia.init();

// ==============================================
// Guardián del Silencio — Soberanía Offline
// ==============================================
const gestionarEstadoOffline = () => {
  const estadoBanner = document.getElementById('status-banner');
  const sloganTexto = document.getElementById('app-slogan');

  if (!navigator.onLine) {
    if (estadoBanner) {
      estadoBanner.innerHTML =
        '🟢 SISTEMA LOCAL ACTIVO | FUNCIONA SIN INTERNET';
      estadoBanner.style.backgroundColor = '#276749';
    }
    console.log('Modo 100% Local Activado');
  } else {
    if (estadoBanner) {
      estadoBanner.innerHTML =
        '⚠️ CONECTADO A LA RED | Sincronización disponible';
      estadoBanner.style.backgroundColor = '#1a4d34';
    }
    console.log('Conexión externa detectada — sincronización disponible');
  }
};

window.addEventListener('offline', gestionarEstadoOffline);
window.addEventListener('online', gestionarEstadoOffline);
document.addEventListener('DOMContentLoaded', gestionarEstadoOffline);

// ==============================================
// ui_melantia — Componente visual del Robot
// Uso desde cualquier módulo:
//   ui_melantia.pensar()  → activa pulso
//   ui_melantia.listo()   → estado reposo
// ==============================================
const ui_melantia = {
  get selector() {
    return document.getElementById('robot-asistente');
  },

  pensar() {
    const el = this.selector;
    if (el) {
      el.src = 'src/storage/assets/melantia_active.png';
      el.classList.add('pulse-animation');
    }
    // Activar también el texto de estado
    Melant_ia.pensar('activo');
    console.log('MELANTIA: Procesando consulta en modo offline...');
  },

  listo() {
    const el = this.selector;
    if (el) {
      el.src = 'src/storage/assets/melantia_idle.png';
      el.classList.remove('pulse-animation');
    }
    Melant_ia.pensar('listo');
  },
};

// ==============================================
// Gestión de Voces — delegada a StaffController
// cargarVoz() se mantiene como alias de compatibilidad.
// ==============================================
const cargarVoz = (nombreVoz) => {
  if (typeof StaffController !== 'undefined') {
    return StaffController.activarPersonaje(nombreVoz);
  }
};

// ==============================================
// Modo Ahorro de Energía "Campo"
// Desactiva sombras, animaciones y brillos
// en celulares de baja gama.
// ==============================================
const modoCampo = {
  activo: false,

  activar() {
    document.body.classList.add('modo-campo');
    this.activo = true;
    console.log('MELANTIA: Modo Campo activado — rendimiento máximo.');
  },

  desactivar() {
    document.body.classList.remove('modo-campo');
    this.activo = false;
    console.log('MELANTIA: Modo Campo desactivado.');
  },

  // Auto-detectar si el dispositivo es de gama baja
  autoDetectar() {
    const ram = navigator.deviceMemory || 4; // GB (API experimental)
    const cores = navigator.hardwareConcurrency || 4;
    if (ram <= 2 || cores <= 2) {
      this.activar();
    }
  },
};

document.addEventListener('DOMContentLoaded', () => {
  modoCampo.autoDetectar();
  // La voz por defecto la inicializa staff_controller.js automáticamente
});

// ==============================================
// PWA — Registro del Service Worker
// ==============================================
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('../service-worker.js')
    .then((reg) => console.log('[SW] Registrado. Scope:', reg.scope))
    .catch((err) => console.warn('[SW] Error al registrar:', err));
}

// ==============================================
// SEMÁFORO DE SINCRONIZACIÓN SEGURA
// 3 condiciones simultáneas:
//   1. Día programado (Lun/Jue/Sáb/Dom)
//   2. Energía: cargando ó batería > 80%
//   3. Señal: 4G, LTE o WiFi (no 2G/Edge)
// ==============================================
const DIAS_ACTUALIZACION = [0, 1, 4, 6]; // Domingo, Lunes, Jueves, Sábado

// --- Mensajes de voz del semáforo ---
const _voz = (texto) => {
  if (!('speechSynthesis' in window)) return;
  const utt = new SpeechSynthesisUtterance(texto);
  utt.lang = 'es-EC';
  utt.pitch = window._melantia_voz_pitch || 1.05;
  utt.rate = window._melantia_voz_rate || 0.95;
  speechSynthesis.cancel();
  speechSynthesis.speak(utt);
};

const MelantiaVerificacion = {
  _claveHash: '#vf=',

  _decodificarHash() {
    const hash = window.location.hash || '';
    if (!hash.startsWith(this._claveHash)) return null;
    try {
      return decodeURIComponent(hash.slice(this._claveHash.length));
    } catch {
      return null;
    }
  },

  _parsearPayload(payload) {
    const [
      firma,
      identificador,
      especie,
      raza,
      estado,
      finca,
      fecha,
      peso,
      gps,
    ] = String(payload || '').split('|');
    if (firma !== 'MC1') return null;
    const gpsTexto = String(gps || 'sin-gps');
    const gpsProtegido =
      gpsTexto === 'privado'
        ? 'Verificada por Melantia (Privada)'
        : gpsTexto.startsWith('aprox:')
          ? `Ubicación aproximada: ${gpsTexto.slice(6)}`
          : gpsTexto === 'sin-gps'
            ? 'No registrado'
            : gpsTexto;
    const [latitud, longitud] = gpsTexto.includes(',')
      ? gpsTexto.split(',')
      : [null, null];
    return {
      identificador: identificador || 'Sin identificador',
      especie: especie || 'Animal',
      raza: raza || 'Sin raza',
      estado: estado || 'Sin estado',
      finca: finca || 'Finca no registrada',
      fecha: fecha || 'Sin fecha',
      peso: peso || 'Sin peso',
      gps: gpsTexto,
      gps_visible: gpsProtegido,
      latitud: latitud || null,
      longitud: longitud || null,
    };
  },

  cerrar() {
    const panel = document.getElementById('panel-novedades');
    if (panel) {
      panel.style.display = 'none';
      panel.innerHTML = '';
    }
    if (window.location.hash.startsWith(this._claveHash)) {
      history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}`
      );
    }
  },

  abrir(payload) {
    const panel = document.getElementById('panel-novedades');
    const datos = this._parsearPayload(payload);
    if (!panel || !datos) return false;

    if (typeof StaffController !== 'undefined') {
      StaffController.activarPersonaje('Valentina');
    }

    panel.style.maxWidth = '420px';
    panel.innerHTML = `
      <div class="novedad-card" data-experto="Valentina">
        <p class="novedad-n1">Verificación interna MELANTIA</p>
        <p class="novedad-n2"><strong>ID:</strong> ${datos.identificador}</p>
        <p class="novedad-n2"><strong>Especie:</strong> ${datos.especie} (${datos.raza})</p>
        <p class="novedad-n2"><strong>Estado:</strong> ${datos.estado}</p>
        <p class="novedad-n2"><strong>Finca:</strong> ${datos.finca}</p>
        <p class="novedad-n2"><strong>Disponible:</strong> ${datos.fecha}</p>
        <p class="novedad-n2"><strong>Peso:</strong> ${datos.peso}</p>
        <p class="novedad-n3"><strong>GPS:</strong> ${datos.gps_visible}</p>
        <div class="novedad-acciones">
          <button onclick="MelantiaVerificacion.cerrar()">Cerrar</button>
          <button onclick="window.print()">Imprimir</button>
        </div>
      </div>`;
    panel.style.display = 'block';
    _voz(`Verificación Melantia abierta para ${datos.identificador}.`);
    return true;
  },

  abrirDesdeHash() {
    const payload = this._decodificarHash();
    if (!payload) return false;
    return this.abrir(payload);
  },
};

window.MelantiaVerificacion = MelantiaVerificacion;

window.addEventListener('hashchange', () => {
  MelantiaVerificacion.abrirDesdeHash();
});

document.addEventListener('DOMContentLoaded', () => {
  MelantiaVerificacion.abrirDesdeHash();
});

const MelantiaPrivacidadUbicacion = {
  _configActual() {
    if (typeof window.obtenerPrivacidadUbicacionMelantia === 'function') {
      return window.obtenerPrivacidadUbicacionMelantia();
    }
    return { modo: 'exacta' };
  },

  cerrar() {
    const panel = document.getElementById('panel-novedades');
    if (panel) {
      panel.style.display = 'none';
      panel.innerHTML = '';
    }
  },

  guardar(modo) {
    if (typeof window.configurarPrivacidadUbicacionMelantia !== 'function') {
      return false;
    }
    const config = window.configurarPrivacidadUbicacionMelantia({ modo });
    this.abrir();
    const mensajes = {
      exacta:
        'Melantia compartirá la ubicación exacta solo cuando tú lo permitas.',
      aproximada:
        'Melantia compartirá solo la vereda, parroquia o municipio del lote.',
      privada:
        'Melantia ocultará las coordenadas exactas en mensajes, PDF y QR externos.',
    };
    _voz(mensajes[config.modo] || 'Privacidad de ubicación actualizada.');
    return true;
  },

  abrir() {
    const panel = document.getElementById('panel-novedades');
    if (!panel) return false;
    const actual = this._configActual();
    const badge = (modo) =>
      actual.modo === modo
        ? ' style="outline:2px solid #1a4d34;font-weight:700"'
        : '';

    panel.style.maxWidth = '460px';
    panel.innerHTML = `
      <div class="novedad-card" data-experto="Melantia">
        <p class="novedad-n1">🛡️ Modo de Seguridad de Ubicación</p>
        <p class="novedad-n2">Internamente, MELANTIA conserva el GPS exacto para respaldo legal y trazabilidad.</p>
        <p class="novedad-n3">Externamente, tú decides si compartes ubicación exacta, aproximada o privada.</p>
        <div class="novedad-acciones" style="display:grid;grid-template-columns:1fr;gap:8px">
          <button${badge('exacta')} onclick="MelantiaPrivacidadUbicacion.guardar('exacta')">Compartir ubicación exacta</button>
          <button${badge('aproximada')} onclick="MelantiaPrivacidadUbicacion.guardar('aproximada')">Compartir solo ubicación aproximada</button>
          <button${badge('privada')} onclick="MelantiaPrivacidadUbicacion.guardar('privada')">Ocultar coordenadas en envíos</button>
          <button onclick="MelantiaPrivacidadUbicacion.cerrar()">Cerrar</button>
        </div>
      </div>`;
    panel.style.display = 'block';
    return true;
  },
};

window.MelantiaPrivacidadUbicacion = MelantiaPrivacidadUbicacion;

const FabrizzioAsesor = {
  _normalizar(texto) {
    return String(texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  },

  async _resolverLoteActual() {
    const sesion = window._melantia_session || {};
    const loteActivo =
      sesion.loteActivo || sesion.idLote || sesion.idLoteActual;
    if (loteActivo) return loteActivo;

    if (
      typeof window.obtenerTableroGranjasMelantia === 'function' &&
      window.GestorGranjasMelantia &&
      typeof window.GestorGranjasMelantia._cargarTablero === 'function'
    ) {
      const tablero = await window.GestorGranjasMelantia._cargarTablero();
      const loteAgricola = tablero.lotes.find(
        (lote) => lote.tipo_lote === 'agricola'
      );
      return loteAgricola?.id_lote || null;
    }

    return null;
  },

  hablar(texto) {
    cargarVoz('Fabrizzio');
    _voz(texto);
  },

  async descargarNuevasReglas() {
    if (typeof actualizarConocimientos !== 'function') {
      return { aplicado: false, motivo: 'SIN_CONTROLADOR_SYNC' };
    }
    return actualizarConocimientos(false, {
      posponerFotos: true,
      origen: 'fabrizzio_oportunista',
    });
  },

  async diagnosticarLoteActual(opciones = {}) {
    if (typeof window.analizarEstadoCultivoMelantia !== 'function') {
      this.hablar(
        'El puente rural de Fabrizzio no está disponible en esta vista.'
      );
      return false;
    }

    const idLote = await this._resolverLoteActual();
    if (!idLote) {
      this.hablar('No tengo un lote agrícola activo para analizar.');
      return true;
    }

    ui_melantia.pensar();
    try {
      const respuesta = await window.analizarEstadoCultivoMelantia(
        idLote,
        opciones
      );
      window.GestorRuralMelantia?.renderizarRecomendacion?.(respuesta);
      this.hablar(
        respuesta.recomendacionVoz ||
          'Analisis rural completado. Revisa el panel tecnico de Fabrizzio.'
      );
    } catch (error) {
      console.error('[Fabrizzio] Error al diagnosticar lote:', error);
      this.hablar(
        error?.message ||
          'No pude completar el diagnostico rural en este momento.'
      );
    } finally {
      ui_melantia.listo();
    }
    return true;
  },

  async abrirEntrevistaActual() {
    const idLote = await this._resolverLoteActual();
    if (!idLote || typeof window.abrirEntrevistaRuralMelantia !== 'function') {
      this.hablar('No pude abrir la entrevista tecnica rural en este momento.');
      return true;
    }

    ui_melantia.pensar();
    try {
      await window.abrirEntrevistaRuralMelantia(idLote, { conVoz: true });
      this.hablar(
        'Entrevista tecnica lista. Registra sintomas, manejo y evidencia del lote.'
      );
    } catch (error) {
      console.error('[Fabrizzio] Error al abrir entrevista:', error);
      this.hablar(
        error?.message ||
          'No pude abrir la entrevista tecnica rural en este momento.'
      );
    } finally {
      ui_melantia.listo();
    }
    return true;
  },

  async abrirExpedienteActual() {
    const idLote = await this._resolverLoteActual();
    if (
      !idLote ||
      typeof window.GestorRuralMelantia?.abrirExpedienteLote !== 'function'
    ) {
      this.hablar('No pude abrir el expediente agronomico del lote.');
      return true;
    }

    ui_melantia.pensar();
    try {
      await window.GestorRuralMelantia.abrirExpedienteLote(idLote);
      this.hablar(
        'Expediente agronomico abierto. Ya puedes comparar este lote con visitas anteriores.'
      );
    } catch (error) {
      console.error('[Fabrizzio] Error al abrir expediente:', error);
      this.hablar(
        error?.message || 'No pude abrir el expediente agronomico del lote.'
      );
    } finally {
      ui_melantia.listo();
    }
    return true;
  },

  async escucharOrden(comandoOriginal) {
    const comando = this._normalizar(comandoOriginal);
    if (!comando || !comando.includes('fabrizzio')) return false;

    if (
      comando.includes('actualiza clima') ||
      comando.includes('actualizar clima') ||
      comando.includes('refresca clima') ||
      comando.includes('sincroniza clima')
    ) {
      const idLote = await this._resolverLoteActual();
      if (
        !idLote ||
        typeof window.actualizarClimaRuralMelantia !== 'function'
      ) {
        this.hablar('No pude actualizar el clima rural en este momento.');
        return true;
      }
      ui_melantia.pensar();
      try {
        const clima = await window.actualizarClimaRuralMelantia(idLote);
        this.hablar(
          `Clima actualizado desde ${clima?.ubicacion || 'la estacion cercana'}. Ya puedo usar ese pronostico en el diagnostico del lote.`
        );
      } catch (error) {
        console.error('[Fabrizzio] Error al actualizar clima:', error);
        this.hablar(
          'No pude refrescar el clima remoto. Seguire usando el ultimo pronostico guardado.'
        );
      } finally {
        ui_melantia.listo();
      }
      return true;
    }

    if (
      comando.includes('como ves este lote') ||
      comando.includes('analiza este cultivo') ||
      comando.includes('diagnostica este lote') ||
      comando.includes('diagnosticar lote') ||
      comando.includes('analiza este lote')
    ) {
      return this.diagnosticarLoteActual();
    }

    if (
      comando.includes('inicia entrevista tecnica') ||
      comando.includes('abrir entrevista tecnica') ||
      comando.includes('abre entrevista tecnica') ||
      comando.includes('realizar diagnostico') ||
      comando.includes('realiza diagnostico')
    ) {
      return this.abrirEntrevistaActual();
    }

    if (
      comando.includes('abre expediente') ||
      comando.includes('abrir expediente') ||
      comando.includes('ver expediente') ||
      comando.includes('muestrame el expediente')
    ) {
      return this.abrirExpedienteActual();
    }

    if (comando.includes('genera reporte tecnico rural')) {
      const idLote = await this._resolverLoteActual();
      if (
        !idLote ||
        typeof window.generarReporteTecnicoRuralMelantia !== 'function'
      ) {
        this.hablar(
          'No pude generar el reporte tecnico rural en este momento.'
        );
        return true;
      }
      ui_melantia.pensar();
      try {
        await window.generarReporteTecnicoRuralMelantia(idLote);
        this.hablar('Reporte tecnico rural listo para consulta.');
      } catch (error) {
        console.error('[Fabrizzio] Error al generar reporte:', error);
        this.hablar('No pude generar el reporte tecnico rural.');
      } finally {
        ui_melantia.listo();
      }
      return true;
    }

    this.hablar(
      'Te escucho. Puedes decir: Fabrizzio, realiza diagnostico, como ves este lote o abre expediente.'
    );
    return true;
  },
};

window.FabrizzioAsesor = FabrizzioAsesor;

const DrJorgeVeterinario = {
  hablar(texto) {
    cargarVoz('Dr. Jorge');
    _voz(texto);
  },

  _resolverAnimalActivo() {
    return MelantiaComandosVoz._resolverAnimalActivo();
  },

  _mostrarPanelAnimal(datosAnimal, mensaje, detalle = '') {
    const panel = document.getElementById('panel-novedades');
    if (!panel || !datosAnimal) return false;

    panel.style.maxWidth = '560px';
    panel.innerHTML = `
      <div class="novedad-card" data-experto="Dr. Jorge">
        <p class="novedad-n1">Dr. Jorge · Asistente técnico veterinario</p>
        <p class="novedad-n2">Animal: <strong>${String(datosAnimal.nombre || datosAnimal.identificacion || `Animal ${datosAnimal.id || 'activo'}`).replace(/</g, '&lt;')}</strong> · Especie: <strong>${String(datosAnimal.especie || 'Animal').replace(/</g, '&lt;')}</strong></p>
        <p class="novedad-n3">${String(mensaje || '').replace(/</g, '&lt;')}</p>
        ${detalle ? `<div style="background:#eef6f1;border:1px solid #d8e5d9;border-radius:12px;padding:12px;margin-top:10px">${String(detalle).replace(/</g, '&lt;')}</div>` : ''}
        <div class="novedad-acciones">
          <button onclick="window.DrJorgeVeterinario?.capturarEvidenciaAnimalActivo()">Tomar evidencia</button>
          <button onclick="window.DrJorgeVeterinario?.generarFichaAnimalActivo()">Ficha técnica</button>
          <button onclick="document.getElementById('panel-novedades').style.display='none'">Cerrar</button>
        </div>
      </div>`;
    panel.style.display = 'block';
    return true;
  },

  async revisarAnimalActivo() {
    const animal = this._resolverAnimalActivo();
    if (!animal) {
      this.hablar('No tengo un animal activo para revisar.');
      return true;
    }

    const detalle = animal.idLote
      ? `Lote asociado: ${animal.idLote}. Puedo capturar evidencia sanitaria o generar su ficha técnica protegida.`
      : 'No tengo lote asociado todavía. Puedo capturar evidencia y dejar registro local.';
    this._mostrarPanelAnimal(
      animal,
      'Tengo el animal activo listo para acompañamiento técnico veterinario.',
      detalle
    );
    this.hablar(
      `Tengo listo el acompañamiento veterinario para ${animal.nombre || animal.identificacion || 'el animal activo'}.`
    );
    return true;
  },

  async capturarEvidenciaAnimalActivo(etapa = 'crecimiento') {
    const animal = this._resolverAnimalActivo();
    if (!animal) {
      this.hablar('No tengo un animal activo para capturar evidencia.');
      return true;
    }
    if (typeof window.capturarEvidenciaIA !== 'function') {
      this.hablar('El capturador de evidencia veterinaria no está disponible.');
      return true;
    }

    ui_melantia.pensar();
    try {
      const resultado = await window.capturarEvidenciaIA(
        animal.id,
        etapa,
        0,
        animal.idLote || animal.lote || null
      );
      this._mostrarPanelAnimal(
        animal,
        resultado?.mensaje || 'Evidencia veterinaria registrada.',
        'Dr. Jorge dejó la evidencia sanitaria asociada al animal activo.'
      );
      this.hablar(
        resultado?.mensaje || 'Evidencia veterinaria registrada correctamente.'
      );
    } catch (error) {
      console.error('[Dr. Jorge] Error al capturar evidencia:', error);
      this.hablar('No pude capturar la evidencia veterinaria en este momento.');
    } finally {
      ui_melantia.listo();
    }
    return true;
  },

  async generarFichaAnimalActivo() {
    const animal = this._resolverAnimalActivo();
    if (!animal) {
      this.hablar('No tengo un animal activo para generar la ficha técnica.');
      return true;
    }
    if (typeof window.prepararEnvioSeguroMelantia !== 'function') {
      this.hablar(
        'La ficha técnica veterinaria no está disponible en esta vista.'
      );
      return true;
    }

    ui_melantia.pensar();
    try {
      const ficha = await window.prepararEnvioSeguroMelantia(animal, {
        persistirLigera: true,
        modoUbicacion: 'privada',
      });
      window.MelantiaAsistente?.registrarDocumentoModulo({
        titulo: `Ficha veterinaria ${animal.nombre || animal.identificacion || 'animal'}`,
        contenido: ficha?.html || ficha?.resumenTexto || '',
        mimeType: 'text/html;charset=utf-8',
        modulo: 'Asistente Tecnico Veterinario',
        origen: 'dr_jorge_ficha',
        loteId: animal.idLote || animal.lote || '',
        resumen: ficha?.resumenTexto || 'Ficha tecnica veterinaria',
      }).catch((error) =>
        console.warn(
          '[Dr. Jorge] No pude centralizar ficha veterinaria:',
          error
        )
      );
      MelantiaComandosVoz._mostrarFichaCompartir(ficha, 'Dr. Jorge');
      this.hablar(
        'Ficha técnica veterinaria lista. Ya puedes compartirla o auditarla.'
      );
    } catch (error) {
      console.error('[Dr. Jorge] Error al generar ficha técnica:', error);
      this.hablar('No pude generar la ficha técnica veterinaria.');
    } finally {
      ui_melantia.listo();
    }
    return true;
  },

  async escucharOrden(comandoOriginal) {
    const comando = String(comandoOriginal || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (
      !comando ||
      !(comando.includes('jorge') || comando.includes('doctor jorge'))
    ) {
      return false;
    }

    if (
      comando.includes('revisa este animal') ||
      comando.includes('revisa el animal') ||
      comando.includes('diagnostica este animal') ||
      comando.includes('diagnosticar animal')
    ) {
      return this.revisarAnimalActivo();
    }

    if (
      comando.includes('toma evidencia') ||
      comando.includes('tomar evidencia') ||
      comando.includes('toma foto') ||
      comando.includes('captura evidencia')
    ) {
      return this.capturarEvidenciaAnimalActivo();
    }

    if (
      comando.includes('genera ficha tecnica') ||
      comando.includes('generar ficha tecnica') ||
      comando.includes('ficha veterinaria')
    ) {
      return this.generarFichaAnimalActivo();
    }

    this.hablar(
      'Te escucho. Puedes decir: Doctor Jorge, revisa este animal, toma evidencia o genera ficha técnica.'
    );
    return true;
  },
};

window.DrJorgeVeterinario = DrJorgeVeterinario;

const MelantiaAsistente = {
  _comunidadStorageKey: 'melantia_comunidad_virtual_estado',
  _evidenciaStorageKey: 'melantia_registro_evidencia_estado',
  _evidenciaDbName: 'melantia_registro_evidencia_db',
  _evidenciaDbStore: 'estado',
  _evidenciaDbVersion: 1,
  _registroEvidenciaCache: null,

  _normalizar(texto) {
    return String(texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  },

  hablar(texto) {
    cargarVoz('Melantia');
    _voz(texto);
  },

  hablarComo(nombre, texto) {
    cargarVoz(nombre);
    _voz(texto);
  },

  hablarDonEloy(texto) {
    this.hablarComo('Don Eloy', texto);
  },

  _estadoComunidad() {
    try {
      return (
        JSON.parse(
          window.localStorage?.getItem(this._comunidadStorageKey) || 'null'
        ) || {
          codigoAceptado: false,
          padrino: {
            contratoAceptado: false,
            contratoAceptadoEn: '',
            versionContrato: '1.0.0',
            estadoCuenta: 'ACTIVA',
            filtroAntiFraudeActivo: true,
            penalizaciones: 0,
            misionesValidadas: 0,
            misionesRechazadas: 0,
            invitacionesSocios: [],
            bonoLiderazgoPendiente: false,
          },
          primeraBienvenidaHecha: false,
          socioDestacado: 'Doña María',
          socioCertificado: 'Juan',
          medallaReciente: 'Manejo de Pastos',
          ofertasNuevas: 5,
          alertaClima: 'Alerta de clima en el sector norte',
          alertaSeguridad:
            'Movimiento extraño cerca de la vía principal. Estén atentos y cuiden sus animales.',
          noticiaDelDia:
            'Hoy hay feria en el cantón vecino y ya se reportan nuevas ofertas de ganado.',
          consejoVida:
            'Recuerde que el que siembra orden, cosecha tranquilidad. No olvide registrar sus gastos con Ángel.',
          tratosExitosos: 5,
          selloConfiable: true,
          tienda: {
            categoria: 'ganado',
            producto: 'Lote de terneros de engorde',
            cantidad: 10,
            valorCierre: 12000,
            esAfiliado: true,
            depositoEstado: 'PUBLICACION_ACTIVA',
            qrEntregaCodigo: 'MEL-QRP-001',
            qrEntregaConfirmado: false,
            tipoEntrega: 'transportista',
            certificadoSanitario: 'PENDIENTE',
            videoFuncionamiento: 'PENDIENTE',
            modalidadCosecha: 'directa',
            costoEnvio: 0,
          },
          comercioLocal: {
            parroquiaActual: 'El Carmen',
            referencia: 'Zona rural cercana a la finca',
            ultimaCalibracion: '',
            ultimoGPS: null,
            pedidoDirecto: {},
            ventasRegistradas: [],
            ultimoCorteMensual: '',
          },
          saludPreventiva: {
            adminPaulette: true,
            capacidadPacientes: 50,
            interfaz: 'Iconos_Grandes_Alta_Visibilidad',
            directorioEmergencia: {
              numeroPrincipal: '911',
              centroSalud: 'Centro de Salud El Carmen',
              telefonoCentro: '053000000',
            },
            pacientes: [
              {
                id: 'paciente-001',
                nombre: 'Don Carlos Zambrano',
                edad: 57,
                tipoSangre: 'O+',
                alergias: 'Alergia a la penicilina',
                foto: '',
                historialRapido: 'Presion alta en mayo',
              },
            ],
            libroSalud: [],
            alertasCriticas: [
              'critico',
              'grave',
              'inconsciente',
              'no respira',
              'convulsion',
              'paro',
              'hemorragia severa',
              'shock',
              'urgente',
            ],
            consejoSemanalEmitidoEn: '',
          },
          donEloyPlaza: {
            indiceRotativo: 0,
            ultimoNoticieroEn: '',
            ultimoCuentoEn: '',
            ultimoHumorEn: '',
            agendaDiaria: {
              dia: '',
              mananaEn: '',
              tardeEn: '',
            },
            cronProgramado: {
              manana: '06:00',
              tarde: '18:00',
            },
            saludoInauguralQuichua:
              'Alli punlla, socios. Kawsayta yuyarishun: allpata kuyaywan tarpuna kawsayta alli rikuchin.',
            saludoInauguralEmitidoEn: '',
            linguisticLearningEngine: {
              detectedLanguage: 'es',
              autoDetect: true,
              vocabularyExpansion: true,
              crossModuleTranslation: true,
              communityLanguageByZone: {
                sierra: 'quichua',
                oriente: 'shuar',
                costa: 'es',
              },
              learnedVocabulary: {},
              pendingValidation: [],
              lastLearningPromptAt: '',
            },
            tesoroAbuelos: [],
            carpetasDinamicas: {
              nuevosSaberesComunitarios:
                '05_intercultural_lenguaje/nuevos_saberes_comunitarios',
              archivoVocesAncestrales:
                '05_intercultural_lenguaje/archivo_voces_ancestrales',
            },
            guardianMemoria: {
              titulo: 'Guardian de la Memoria de Melantia',
              destacados: [],
              actualizadoEn: '',
            },
            aportesAnonimos: [],
          },
          propiedades: {
            comisionPorcentaje: 5,
            validacionDocumental: true,
            evidenciaObligatoria: true,
            custodiaMelantia: true,
            dobleConfirmacion: true,
            propiedad: 'Finca San Isidro',
            vendedor: 'Socio MELANTIA',
            comprador: 'Comprador en validacion',
            valorCierre: 25000,
            depositoEstado: 'EN_CUSTODIA',
            documentosEstado: 'PENDIENTE_REVISION',
            evidenciaNotarial: 'PENDIENTE_CARGA',
            zonaNotaria: 'Cabecera cantonal',
            confirmacionComprador: false,
            confirmacionVendedor: false,
            solicitudAnulacionComprador: false,
            solicitudAnulacionVendedor: false,
            contratoCustodiaAceptado: false,
            contratoIntermediacionAceptado: false,
            actaVozCompradorInicial: 'PENDIENTE',
            actaVozVendedorInicial: 'PENDIENTE',
            actaVozCompradorFinal: 'PENDIENTE',
            actaVozVendedorFinal: 'PENDIENTE',
            selloVerificacion: 'Documentacion Verificada por Melantia',
          },
        }
      );
    } catch {
      return {
        codigoAceptado: false,
        padrino: {
          contratoAceptado: false,
          contratoAceptadoEn: '',
          versionContrato: '1.0.0',
          estadoCuenta: 'ACTIVA',
          filtroAntiFraudeActivo: true,
          penalizaciones: 0,
          misionesValidadas: 0,
          misionesRechazadas: 0,
          invitacionesSocios: [],
          bonoLiderazgoPendiente: false,
        },
        primeraBienvenidaHecha: false,
        socioDestacado: 'Doña María',
        socioCertificado: 'Juan',
        medallaReciente: 'Manejo de Pastos',
        ofertasNuevas: 5,
        alertaClima: 'Alerta de clima en el sector norte',
        alertaSeguridad:
          'Movimiento extraño cerca de la vía principal. Estén atentos y cuiden sus animales.',
        noticiaDelDia:
          'Hoy hay feria en el cantón vecino y ya se reportan nuevas ofertas de ganado.',
        consejoVida:
          'Recuerde que el que siembra orden, cosecha tranquilidad. No olvide registrar sus gastos con Ángel.',
        tratosExitosos: 5,
        selloConfiable: true,
        tienda: {
          categoria: 'ganado',
          producto: 'Lote de terneros de engorde',
          cantidad: 10,
          valorCierre: 12000,
          esAfiliado: true,
          depositoEstado: 'PUBLICACION_ACTIVA',
          qrEntregaCodigo: 'MEL-QRP-001',
          qrEntregaConfirmado: false,
          tipoEntrega: 'transportista',
          certificadoSanitario: 'PENDIENTE',
          videoFuncionamiento: 'PENDIENTE',
          modalidadCosecha: 'directa',
          costoEnvio: 0,
        },
        comercioLocal: {
          parroquiaActual: 'El Carmen',
          referencia: 'Zona rural cercana a la finca',
          ultimaCalibracion: '',
          ultimoGPS: null,
          pedidoDirecto: {},
          ventasRegistradas: [],
          ultimoCorteMensual: '',
        },
        saludPreventiva: {
          adminPaulette: true,
          capacidadPacientes: 50,
          interfaz: 'Iconos_Grandes_Alta_Visibilidad',
          directorioEmergencia: {
            numeroPrincipal: '911',
            centroSalud: 'Centro de Salud El Carmen',
            telefonoCentro: '053000000',
          },
          pacientes: [
            {
              id: 'paciente-001',
              nombre: 'Don Carlos Zambrano',
              edad: 57,
              tipoSangre: 'O+',
              alergias: 'Alergia a la penicilina',
              foto: '',
              historialRapido: 'Presion alta en mayo',
            },
          ],
          libroSalud: [],
          alertasCriticas: [
            'critico',
            'grave',
            'inconsciente',
            'no respira',
            'convulsion',
            'paro',
            'hemorragia severa',
            'shock',
            'urgente',
          ],
          consejoSemanalEmitidoEn: '',
        },
        donEloyPlaza: {
          indiceRotativo: 0,
          ultimoNoticieroEn: '',
          ultimoCuentoEn: '',
          ultimoHumorEn: '',
          agendaDiaria: {
            dia: '',
            mananaEn: '',
            tardeEn: '',
          },
          cronProgramado: {
            manana: '06:00',
            tarde: '18:00',
          },
          saludoInauguralQuichua:
            'Alli punlla, socios. Kawsayta yuyarishun: allpata kuyaywan tarpuna kawsayta alli rikuchin.',
          saludoInauguralEmitidoEn: '',
          linguisticLearningEngine: {
            detectedLanguage: 'es',
            autoDetect: true,
            vocabularyExpansion: true,
            crossModuleTranslation: true,
            communityLanguageByZone: {
              sierra: 'quichua',
              oriente: 'shuar',
              costa: 'es',
            },
            learnedVocabulary: {},
            pendingValidation: [],
            lastLearningPromptAt: '',
          },
          tesoroAbuelos: [],
          carpetasDinamicas: {
            nuevosSaberesComunitarios:
              '05_intercultural_lenguaje/nuevos_saberes_comunitarios',
            archivoVocesAncestrales:
              '05_intercultural_lenguaje/archivo_voces_ancestrales',
          },
          guardianMemoria: {
            titulo: 'Guardian de la Memoria de Melantia',
            destacados: [],
            actualizadoEn: '',
          },
          aportesAnonimos: [],
        },
        propiedades: {
          comisionPorcentaje: 5,
          validacionDocumental: true,
          evidenciaObligatoria: true,
          custodiaMelantia: true,
          dobleConfirmacion: true,
          propiedad: 'Finca San Isidro',
          vendedor: 'Socio MELANTIA',
          comprador: 'Comprador en validacion',
          valorCierre: 25000,
          depositoEstado: 'EN_CUSTODIA',
          documentosEstado: 'PENDIENTE_REVISION',
          evidenciaNotarial: 'PENDIENTE_CARGA',
          evidenciaNotarialNombre: '',
          evidenciaNotarialArchivo: '',
          evidenciaNotarialMime: '',
          zonaNotaria: 'Cabecera cantonal',
          confirmacionComprador: false,
          confirmacionVendedor: false,
          solicitudAnulacionComprador: false,
          solicitudAnulacionVendedor: false,
          contratoCustodiaAceptado: false,
          contratoIntermediacionAceptado: false,
          actaVozCompradorInicial: 'PENDIENTE',
          actaVozVendedorInicial: 'PENDIENTE',
          actaVozCompradorFinal: 'PENDIENTE',
          actaVozVendedorFinal: 'PENDIENTE',
          actaVozCompradorFinalTexto: '',
          actaVozVendedorFinalTexto: '',
          actaVozCompradorInicialTexto: '',
          actaVozVendedorInicialTexto: '',
          reciboLiquidacionEmitidoEn: '',
          selloVerificacion: 'Documentacion Verificada por Melantia',
        },
        // ============================================================================
        // MELANTIOS - Sistema de moneda comunitaria con Candado de Fidelidad 12/12
        // ============================================================================
        // INTEGRACIÓN REQUERIDA: Llamar a registrarPago() cuando pago exitoso
        // Ver: FIDELIDAD_API_REFERENCE.md para ejemplos de integración
        // Ver: TEST_FIDELIDAD_12_12.js para validación del flujo
        // ============================================================================
        melantios: {
          saldoActual: 0,
          mesesPagados: 0,
          fechaIngresoCiclo: '',
          fondoReserva: {
            tipoDeCuenta: 'Alcancia_Navidena_Melantio',
            periodoAcumulacion: 'Enero - Noviembre',
            periodoLiberacion: 'Diciembre',
            reglaDeOro: '100% Cash para suscripciones mensuales',
            usoDelBono:
              'Canje exclusivo en Tiendas Afiliadas (Max 50% de la compra)',
            maximoCanjePorCompraPorcentaje: 50,
          },
          historialPagos: [],
          alcanciaNavideña: {
            saldoAcumulado: 0,
            estado: 'ACUMULANDO',
            periodoAcceso: 'Diciembre',
            historialDepositos: [],
            ultimaLiberacion: '',
            proximaLiberacion: '',
            requisito12_12Cumplido: false,
            bloqueoPorFaltaPago: false,
            auditoriaObligatoria: true,
            auditoriaAprobada: false,
            auditoriaUltimaRevision: '',
            auditoriaRevisor: '',
          },
          historialGanancia: [],
          historialGasto: [],
          ultimaActualizacion: '',
          vencimiento: '',
          diasRestantes: 0,
          encaje: {
            totalEnCirculacion: 0,
            valorDolarEquivalente: 0,
            reservaReal: 0,
          },
        },
      };
    }
  },

  _guardarEstadoComunidad(estado) {
    window.localStorage?.setItem(
      this._comunidadStorageKey,
      JSON.stringify(estado)
    );
    return estado;
  },

  _estadoPadrino(estado = null) {
    const base = estado || this._estadoComunidad();
    const padrino = base.padrino || {};
    const normalizado = {
      contratoAceptado: padrino.contratoAceptado === true,
      contratoAceptadoEn: String(padrino.contratoAceptadoEn || ''),
      versionContrato: String(padrino.versionContrato || '1.0.0'),
      estadoCuenta: String(padrino.estadoCuenta || 'ACTIVA'),
      filtroAntiFraudeActivo: padrino.filtroAntiFraudeActivo !== false,
      penalizaciones: Number(padrino.penalizaciones || 0),
      misionesValidadas: Number(padrino.misionesValidadas || 0),
      misionesRechazadas: Number(padrino.misionesRechazadas || 0),
      invitacionesSocios: Array.isArray(padrino.invitacionesSocios)
        ? padrino.invitacionesSocios
        : [],
      bonoLiderazgoPendiente: padrino.bonoLiderazgoPendiente === true,
    };
    base.padrino = normalizado;
    return normalizado;
  },

  _misionesPadrinoPendientes(plaza = null) {
    const tablero = plaza || this._estadoDonEloyPlaza();
    return (tablero.tesoroAbuelos || []).filter((item) => {
      const estado = this._normalizar(
        item?.estadoRevisionPadrino || 'pendiente'
      );
      return !estado || estado === 'pendiente';
    });
  },

  // ===== SISTEMA DE ALCANCÍA NAVIDEÑA =====

  /**
   * Acumular Melantios en Alcancía (bloqueado todo el año)
   * Los Melantios ganados van a la alcancía, NO al saldo disponible
   */
  acumularEnAlcanciaNavideña(melantios, tipoAccion = 'historia') {
    const estado = this._estadoComunidad();
    const mesActual = new Date().getMonth() + 1; // 1-12

    // Validar que no sea diciembre (mes de liberación)
    if (mesActual === 12) {
      return {
        permitido: false,
        mensaje:
          '¡Diciembre es mes de cosecha! Tus nuevos Melantios se liberan instantáneamente. Disfruta tu aguinaldo.',
      };
    }

    estado.melantios.alcanciaNavideña.saldoAcumulado += melantios;
    estado.melantios.alcanciaNavideña.historialDepositos.push({
      id: `deposito-${Date.now()}`,
      cantidad: melantios,
      tipo: tipoAccion,
      fecha: new Date().toISOString(),
      mes: mesActual,
      estado: 'BLOQUEADO_HASTA_DICIEMBRE',
    });

    estado.melantios.alcanciaNavideña.proximaLiberacion = `${new Date().getFullYear()}-12-01`;
    this._guardarEstadoComunidad(estado);

    return {
      permitido: true,
      saldoAlcancia: estado.melantios.alcanciaNavideña.saldoAcumulado,
      mensaje: `✅ +${melantios}M en tu alcancía. Ya llevas $${(estado.melantios.alcanciaNavideña.saldoAcumulado * 0.01).toFixed(2)} acumulados para Navidad.`,
    };
  },

  _resumenFidelidad(estado) {
    const ahora = new Date();
    const anioActual = ahora.getFullYear();
    const melantios = (estado.melantios = estado.melantios || {});
    const alcancia = (melantios.alcanciaNavideña =
      melantios.alcanciaNavideña || {});

    melantios.mesesPagados = Number(melantios.mesesPagados || 0);
    melantios.historialPagos = Array.isArray(melantios.historialPagos)
      ? melantios.historialPagos
      : [];
    melantios.fondoReserva = {
      tipoDeCuenta:
        melantios.fondoReserva?.tipoDeCuenta || 'Alcancia_Navidena_Melantio',
      periodoAcumulacion:
        melantios.fondoReserva?.periodoAcumulacion || 'Enero - Noviembre',
      periodoLiberacion:
        melantios.fondoReserva?.periodoLiberacion || 'Diciembre',
      reglaDeOro:
        melantios.fondoReserva?.reglaDeOro ||
        '100% Cash para suscripciones mensuales',
      usoDelBono:
        melantios.fondoReserva?.usoDelBono ||
        'Canje exclusivo en Tiendas Afiliadas (Max 50% de la compra)',
      maximoCanjePorCompraPorcentaje: Number(
        melantios.fondoReserva?.maximoCanjePorCompraPorcentaje || 50
      ),
    };

    if (!melantios.fechaIngresoCiclo) {
      const primerPago = melantios.historialPagos
        .filter((p) => Number(p?.mes) >= 1 && Number(p?.mes) <= 12)
        .sort(
          (a, b) =>
            Number(a.anio || anioActual) - Number(b.anio || anioActual) ||
            Number(a.mes || 1) - Number(b.mes || 1)
        )[0];
      if (primerPago) {
        melantios.fechaIngresoCiclo = `${Number(primerPago.anio || anioActual)}-${String(Number(primerPago.mes || 1)).padStart(2, '0')}`;
      }
    }

    if (!melantios.fechaIngresoCiclo) {
      melantios.fechaIngresoCiclo = `${anioActual}-01`;
    }

    const [anioTexto, mesTexto] = String(melantios.fechaIngresoCiclo).split(
      '-'
    );
    let anioIngreso = Number(anioTexto) || anioActual;
    let mesIngreso = Number(mesTexto) || 1;

    if (anioIngreso !== anioActual) {
      anioIngreso = anioActual;
      mesIngreso = 1;
      melantios.fechaIngresoCiclo = `${anioActual}-01`;
    }

    mesIngreso = Math.min(12, Math.max(1, mesIngreso));
    const mesesRequeridos = Math.max(1, 13 - mesIngreso);

    alcancia.auditoriaObligatoria = alcancia.auditoriaObligatoria !== false;
    alcancia.auditoriaAprobada = alcancia.auditoriaAprobada === true;
    alcancia.auditoriaUltimaRevision = String(
      alcancia.auditoriaUltimaRevision || ''
    );
    alcancia.auditoriaRevisor = String(alcancia.auditoriaRevisor || '');

    return {
      anioIngreso,
      mesIngreso,
      mesesPagados: melantios.mesesPagados,
      mesesRequeridos,
      mesesFaltantes: Math.max(0, mesesRequeridos - melantios.mesesPagados),
      auditoriaObligatoria: alcancia.auditoriaObligatoria,
      auditoriaAprobada: alcancia.auditoriaAprobada,
    };
  },

  aprobarAuditoriaAlcancia(revisor = 'Equipo de auditoria') {
    const estado = this._estadoComunidad();
    const resumen = this._resumenFidelidad(estado);

    if (!resumen.auditoriaObligatoria) {
      return {
        permitido: true,
        mensaje: 'La auditoría no es obligatoria para este ciclo.',
      };
    }

    estado.melantios.alcanciaNavideña.auditoriaAprobada = true;
    estado.melantios.alcanciaNavideña.auditoriaUltimaRevision =
      new Date().toISOString();
    estado.melantios.alcanciaNavideña.auditoriaRevisor = String(
      revisor || 'Equipo de auditoria'
    );
    this._guardarEstadoComunidad(estado);

    return {
      permitido: true,
      auditoriaAprobada: true,
      revisor: estado.melantios.alcanciaNavideña.auditoriaRevisor,
      fechaRevision: estado.melantios.alcanciaNavideña.auditoriaUltimaRevision,
      mensaje:
        '✅ Auditoría de contenido aprobada. La alcancía puede evaluarse para liberación en diciembre.',
    };
  },

  /**
   * Liberar alcancía en diciembre (automático o manual)
   */
  liberarAlcanciaNavideña() {
    const estado = this._estadoComunidad();
    const fidelidad = this._resumenFidelidad(estado);
    const mesActual = new Date().getMonth() + 1;

    // ============================================================================
    // CANDADO DE FIDELIDAD 12/12 - VALIDACIÓN PRIMARIA
    // Este es el mecanismo definitivo de retención y flujo de caja garantizado
    // Si mesesPagados < 12, BLOQUEAR hasta que complete 12 meses consecutivos
    // ============================================================================
    // CANDADO 12/12: Validar fidelidad de pago
    if (fidelidad.mesesPagados < fidelidad.mesesRequeridos) {
      this.hablarDonEloy(
        `¡Atención, socio! Usted ha pagado ${fidelidad.mesesPagados} meses, pero le faltan ${fidelidad.mesesFaltantes} para cumplir el requisito de fidelidad de este ciclo (${fidelidad.mesesRequeridos}/${fidelidad.mesesRequeridos}). El que se hace el vivo y no paga, se queda viendo la alcancía desde afuera. ¡Aquí premiamos la honradez y la constancia!`
      );
      estado.melantios.alcanciaNavideña.bloqueoPorFaltaPago = true;
      this._guardarEstadoComunidad(estado);
      return {
        permitido: false,
        razon: 'FIDELIDAD_INCOMPLETA',
        mesesPagados: fidelidad.mesesPagados,
        mesesRequeridos: fidelidad.mesesRequeridos,
        mesesFaltantes: fidelidad.mesesFaltantes,
        saldoAlcancia: estado.melantios.alcanciaNavideña.saldoAcumulado,
        mensaje: `❌ ¡Lo sentimos! No cumple requisito de fidelidad. Tiene ${fidelidad.mesesPagados}/${fidelidad.mesesRequeridos} meses pagados. Saldo alcancia: ${estado.melantios.alcanciaNavideña.saldoAcumulado}M bloqueado.`,
      };
    }

    if (
      estado.melantios.alcanciaNavideña.auditoriaObligatoria !== false &&
      !estado.melantios.alcanciaNavideña.auditoriaAprobada
    ) {
      this.hablarDonEloy(
        'Socio, su fidelidad está al día, pero la auditoría del Tesoro de los Abuelos sigue pendiente. Primero validamos contenido; luego, en diciembre, se abre la alcancía.'
      );
      return {
        permitido: false,
        razon: 'AUDITORIA_PENDIENTE',
        mensaje:
          '❌ Tu alcancía sigue bloqueada hasta completar la auditoría obligatoria de contenido.',
      };
    }

    if (mesActual !== 12) {
      const diasFalta = (12 - mesActual) * 30;
      return {
        permitido: false,
        razon: 'NO_ES_DICIEMBRE',
        mensaje: `Tu alcancía abre en diciembre. Faltan aproximadamente ${diasFalta} días para la cosecha.`,
        diasRestantes: diasFalta,
      };
    }

    const saldoLiberado = estado.melantios.alcanciaNavideña.saldoAcumulado;

    // Transferir de alcancía a saldo disponible
    estado.melantios.saldoActual += saldoLiberado;
    estado.melantios.alcanciaNavideña.ultimaLiberacion =
      new Date().toISOString();
    estado.melantios.alcanciaNavideña.saldoAcumulado = 0;
    estado.melantios.alcanciaNavideña.estado = 'LIBERADO_EN_DICIEMBRE';
    estado.melantios.alcanciaNavideña.requisito12_12Cumplido = true;
    estado.melantios.alcanciaNavideña.bloqueoPorFaltaPago = false;

    this._guardarEstadoComunidad(estado);

    this.hablarDonEloy(
      `¡Vea, socio! ¡Ha llegado el gran día! Su alcancía de Melantia se abrió. Ya tiene ${saldoLiberado}M ($${(saldoLiberado * 0.01).toFixed(2)}) para la cena de Navidad. ¡Vaya a las tiendas y haga realidad esos sueños!`
    );

    return {
      permitido: true,
      razon: 'LIBERACION_EXITOSA',
      saldoLiberado,
      saldoTotal: estado.melantios.saldoActual,
      mensaje: `🎄 ¡FELIZ NAVIDAD! Liberados $${(saldoLiberado * 0.01).toFixed(2)} en tu cuenta. Nuevo saldo: ${estado.melantios.saldoActual}M`,
    };
  },

  /**
   * Obtener estado de la alcancía
   */
  obtenerEstadoAlcancia() {
    const estado = this._estadoComunidad();
    this._resumenFidelidad(estado);
    const alcancia = estado.melantios.alcanciaNavideña;
    const mesActual = new Date().getMonth() + 1;
    const anio = new Date().getFullYear();

    let diasRestantes = 0;
    let estadoTexto = 'ACUMULANDO';

    if (mesActual === 12) {
      estadoTexto = '🎄 LIBERADO - ¡Es hora de la cosecha!';
      diasRestantes = 0;
    } else if (mesActual < 12) {
      diasRestantes = (12 - mesActual) * 30;
      estadoTexto = `ACUMULANDO (${diasRestantes} días para diciembre)`;
    }

    return {
      saldoAlcancia: alcancia.saldoAcumulado,
      saldoEnUSD: (alcancia.saldoAcumulado * 0.01).toFixed(2),
      estado: estadoTexto,
      diasRestantes,
      mesActual,
      historialDepositos: alcancia.historialDepositos,
      proximaLiberacion: alcancia.proximaLiberacion,
      fondoReserva: estado.melantios.fondoReserva,
    };
  },

  /**
   * Auditar historial de depósitos (prevenir estafas antes de diciembre)
   */
  auditarAlcancia(filtroMes = null) {
    const estado = this._estadoComunidad();
    this._resumenFidelidad(estado);
    const historial = estado.melantios.alcanciaNavideña.historialDepositos;

    if (filtroMes) {
      return historial.filter((d) => d.mes === filtroMes);
    }

    return {
      totalDepositos: historial.length,
      totalAcumulado: estado.melantios.alcanciaNavideña.saldoAcumulado,
      historial,
      auditoriaNotas: 'Revisar integridad de historias antes de diciembre',
      auditoriaObligatoria:
        estado.melantios.alcanciaNavideña.auditoriaObligatoria !== false,
      auditoriaAprobada: estado.melantios.alcanciaNavideña.auditoriaAprobada,
      auditoriaUltimaRevision:
        estado.melantios.alcanciaNavideña.auditoriaUltimaRevision || null,
      auditoriaRevisor:
        estado.melantios.alcanciaNavideña.auditoriaRevisor || '',
    };
  },

  /**
   * Registrar pago mensual de suscripción (Candado de Fidelidad 12/12)
   * Se llama cada vez que se procesa un pago exitoso
   */
  registrarPago(descripcion = 'Suscripción mensual') {
    const estado = this._estadoComunidad();
    const fidelidad = this._resumenFidelidad(estado);
    const mesActual = new Date().getMonth() + 1;
    const anio = new Date().getFullYear();

    if (!estado.melantios.fechaIngresoCiclo) {
      estado.melantios.fechaIngresoCiclo = `${anio}-${String(mesActual).padStart(2, '0')}`;
    }

    // Evitar registrar 2 pagos el mismo mes
    const mesYaRegistrado = estado.melantios.historialPagos.some(
      (p) => p.mes === mesActual && p.anio === anio
    );

    if (mesYaRegistrado) {
      return {
        exitoso: false,
        razon: 'YA_PAGADO_ESTE_MES',
        mensaje: `Ya registramos tu pago de este mes. Vigencia: ${mesActual}/${anio}`,
        mesesPagados: estado.melantios.mesesPagados,
        mesesRequeridos: fidelidad.mesesRequeridos,
      };
    }

    // Registrar el pago
    estado.melantios.mesesPagados += 1;
    estado.melantios.historialPagos.push({
      mes: mesActual,
      anio,
      descripcion,
      fechaPago: new Date().toISOString(),
      montoSuscripcion: 'variable', // Pendiente de integración con sistema de pagos
    });

    // Si llega a la meta del ciclo, marcar como cumplido
    if (estado.melantios.mesesPagados >= fidelidad.mesesRequeridos) {
      estado.melantios.alcanciaNavideña.requisito12_12Cumplido = true;
      estado.melantios.alcanciaNavideña.bloqueoPorFaltaPago = false;
      this.hablarDonEloy(
        `¡Vea, socio! ¡Lo hizo! Completó todos sus pagos del ciclo (${fidelidad.mesesRequeridos}/${fidelidad.mesesRequeridos}). En diciembre su alcancía se abrirá con todo lo que ha ganado. ¡Usted es un ahorrador verdadero!`
      );
    }

    this._guardarEstadoComunidad(estado);

    return {
      exitoso: true,
      mesesPagados: estado.melantios.mesesPagados,
      mesesRequeridos: fidelidad.mesesRequeridos,
      porcentajeAvance: Math.min(
        100,
        Math.round(
          (estado.melantios.mesesPagados / fidelidad.mesesRequeridos) * 100
        )
      ),
      mesesFaltantes: Math.max(
        0,
        fidelidad.mesesRequeridos - estado.melantios.mesesPagados
      ),
      mensaje: `✅ Pago registrado. Progreso de fidelidad: ${estado.melantios.mesesPagados}/${fidelidad.mesesRequeridos} meses`,
    };
  },

  /**
   * Validar si el socio puede desbloquear la alcancía (Candado 12/12)
   */
  canUnlockAlcancia() {
    const estado = this._estadoComunidad();
    const fidelidad = this._resumenFidelidad(estado);
    const mesActual = new Date().getMonth() + 1;

    const validaciones = {
      es_diciembre: mesActual === 12,
      tiene_pagos_requeridos:
        estado.melantios.mesesPagados >= fidelidad.mesesRequeridos,
      hay_saldo: estado.melantios.alcanciaNavideña.saldoAcumulado > 0,
      no_tiene_bloqueo: !estado.melantios.alcanciaNavideña.bloqueoPorFaltaPago,
      auditoria_aprobada:
        estado.melantios.alcanciaNavideña.auditoriaObligatoria === false ||
        estado.melantios.alcanciaNavideña.auditoriaAprobada === true,
    };

    const cumpleTodos =
      validaciones.es_diciembre &&
      validaciones.tiene_pagos_requeridos &&
      validaciones.hay_saldo &&
      validaciones.no_tiene_bloqueo &&
      validaciones.auditoria_aprobada;

    return {
      puedDesbloquear: cumpleTodos,
      puedeDesbloquear: cumpleTodos,
      validaciones,
      razonesBloqueo: Object.entries(validaciones)
        .filter(([_, v]) => !v)
        .map(([k]) => k),
      mesesPagados: estado.melantios.mesesPagados,
      mesesRequeridos: fidelidad.mesesRequeridos,
      mesActual,
    };
  },

  /**
   * Reiniciar contador de fidelidad en enero (reset anual)
   */
  reiniciarFidelidadEnero() {
    const estado = this._estadoComunidad();
    const mesActual = new Date().getMonth() + 1;

    if (mesActual !== 1) {
      return {
        exitoso: false,
        mensaje: 'El reinicio de fidelidad solo ocurre en enero',
      };
    }

    // Guardar histórico del año anterior
    const historialAnioAnterior = {
      anio: new Date().getFullYear() - 1,
      mesesPagados: estado.melantios.mesesPagados,
      mesesRequeridos: this._resumenFidelidad(estado).mesesRequeridos,
      saldoAlcanciaDiciembre: estado.melantios.alcanciaNavideña.saldoAcumulado,
      requisitoUxito: estado.melantios.alcanciaNavideña.requisito12_12Cumplido,
    };

    // Reiniciar contadores
    estado.melantios.mesesPagados = 0;
    estado.melantios.fechaIngresoCiclo = `${new Date().getFullYear()}-01`;
    estado.melantios.alcanciaNavideña.requisito12_12Cumplido = false;
    estado.melantios.alcanciaNavideña.bloqueoPorFaltaPago = false;
    estado.melantios.alcanciaNavideña.auditoriaAprobada = false;
    estado.melantios.alcanciaNavideña.auditoriaUltimaRevision = '';
    estado.melantios.alcanciaNavideña.auditoriaRevisor = '';
    estado.melantios.alcanciaNavideña.estado = 'ACUMULANDO';
    estado.melantios.alcanciaNavideña.proximaLiberacion = `Diciembre ${new Date().getFullYear()}`;

    this._guardarEstadoComunidad(estado);

    this.hablarDonEloy(
      `¡Bienvenido, socio! Comenzamos un nuevo año. Su contador de fidelidad está en cero, pero los Melantios que acumuló siguen en su bolsa. ¡Ahora a construir otros 12 meses de constancia!`
    );

    return {
      exitoso: true,
      historialAnioAnterior,
      mensaje: `🔄 Nuevo año comenzó. Fidelidad: 0/12. El ciclo de la alcancía se reinicia.`,
    };
  },

  _dinero(valor) {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(Number(valor || 0));
  },

  _escaparHtml(texto) {
    return String(texto || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  _crearQrSvgLocal(payload) {
    const texto = String(payload || 'MELANTIA');
    const QR_VERSION = 5;
    const QR_SIZE = 17 + QR_VERSION * 4;
    const QR_DATA_CODEWORDS = 108;
    const QR_ECC_CODEWORDS = 26;
    const QR_EXP = new Array(512).fill(0);
    const QR_LOG = new Array(256).fill(0);

    let valor = 1;
    for (let i = 0; i < 255; i += 1) {
      QR_EXP[i] = valor;
      QR_LOG[valor] = i;
      valor <<= 1;
      if (valor & 0x100) valor ^= 0x11d;
    }
    for (let i = 255; i < QR_EXP.length; i += 1) {
      QR_EXP[i] = QR_EXP[i - 255];
    }

    const qrMul = (a, b) => {
      if (a === 0 || b === 0) return 0;
      return QR_EXP[QR_LOG[a] + QR_LOG[b]];
    };

    const qrPolyMul = (a, b) => {
      const resultado = new Array(a.length + b.length - 1).fill(0);
      for (let i = 0; i < a.length; i += 1) {
        for (let j = 0; j < b.length; j += 1) {
          resultado[i + j] ^= qrMul(a[i], b[j]);
        }
      }
      return resultado;
    };

    const qrGeneratorPoly = (grado) => {
      let polinomio = [1];
      for (let i = 0; i < grado; i += 1) {
        polinomio = qrPolyMul(polinomio, [1, QR_EXP[i]]);
      }
      return polinomio;
    };

    const qrRemainder = (datos, grado) => {
      const generador = qrGeneratorPoly(grado);
      const resultado = datos.concat(new Array(grado).fill(0));
      for (let i = 0; i < datos.length; i += 1) {
        const factor = resultado[i];
        if (factor === 0) continue;
        for (let j = 0; j < generador.length; j += 1) {
          resultado[i + j] ^= qrMul(generador[j], factor);
        }
      }
      return resultado.slice(-grado);
    };

    const qrAgregarBits = (bits, valorBits, longitud) => {
      for (let i = longitud - 1; i >= 0; i -= 1) {
        bits.push((valorBits >>> i) & 1);
      }
    };

    const qrCrearCodewords = (contenido) => {
      const bytes = Array.from(new TextEncoder().encode(contenido));
      if (bytes.length > 106) {
        throw new Error('El payload QR excede la capacidad del encoder local.');
      }

      const bits = [];
      qrAgregarBits(bits, 0x4, 4);
      qrAgregarBits(bits, bytes.length, 8);
      bytes.forEach((byte) => qrAgregarBits(bits, byte, 8));

      const capacidad = QR_DATA_CODEWORDS * 8;
      const terminador = Math.min(4, capacidad - bits.length);
      qrAgregarBits(bits, 0, terminador);
      while (bits.length % 8 !== 0) bits.push(0);

      const datos = [];
      for (let i = 0; i < bits.length; i += 8) {
        let valorByte = 0;
        for (let j = 0; j < 8; j += 1) {
          valorByte = (valorByte << 1) | bits[i + j];
        }
        datos.push(valorByte);
      }

      const pads = [0xec, 0x11];
      let padIndex = 0;
      while (datos.length < QR_DATA_CODEWORDS) {
        datos.push(pads[padIndex % pads.length]);
        padIndex += 1;
      }

      return datos.concat(qrRemainder(datos, QR_ECC_CODEWORDS));
    };

    const qrNuevaMatriz = () =>
      Array.from({ length: QR_SIZE }, () => Array(QR_SIZE).fill(false));
    const qrNuevoMapa = () =>
      Array.from({ length: QR_SIZE }, () => Array(QR_SIZE).fill(false));

    const qrSetFuncion = (matriz, usadas, fila, col, valorCelda) => {
      if (fila < 0 || col < 0 || fila >= QR_SIZE || col >= QR_SIZE) return;
      matriz[fila][col] = !!valorCelda;
      usadas[fila][col] = true;
    };

    const qrDibujarFinder = (matriz, usadas, fila, col) => {
      for (let dy = -1; dy <= 7; dy += 1) {
        for (let dx = -1; dx <= 7; dx += 1) {
          const y = fila + dy;
          const x = col + dx;
          const esBorde = dy === -1 || dy === 7 || dx === -1 || dx === 7;
          const esMarco = dy === 0 || dy === 6 || dx === 0 || dx === 6;
          const esCentro = dy >= 2 && dy <= 4 && dx >= 2 && dx <= 4;
          qrSetFuncion(matriz, usadas, y, x, !esBorde && (esMarco || esCentro));
        }
      }
    };

    const qrDibujarAlineacion = (matriz, usadas, centroFila, centroCol) => {
      for (let dy = -2; dy <= 2; dy += 1) {
        for (let dx = -2; dx <= 2; dx += 1) {
          const borde = Math.max(Math.abs(dx), Math.abs(dy)) === 2;
          const centro = dx === 0 && dy === 0;
          qrSetFuncion(
            matriz,
            usadas,
            centroFila + dy,
            centroCol + dx,
            borde || centro
          );
        }
      }
    };

    const qrReservarFormato = (matriz, usadas) => {
      for (let i = 0; i <= 8; i += 1) {
        if (i !== 6) {
          qrSetFuncion(matriz, usadas, 8, i, false);
          qrSetFuncion(matriz, usadas, i, 8, false);
        }
      }
      for (let i = 0; i < 8; i += 1) {
        qrSetFuncion(matriz, usadas, QR_SIZE - 1 - i, 8, false);
        qrSetFuncion(matriz, usadas, 8, QR_SIZE - 1 - i, false);
      }
    };

    const qrMascara0 = (fila, col) => (fila + col) % 2 === 0;
    const qrFormatoBits = (mascara) => {
      const nivelL = 1;
      const dato = (nivelL << 3) | mascara;
      let resto = dato;
      for (let i = 0; i < 10; i += 1) {
        resto = (resto << 1) ^ (((resto >>> 9) & 1) * 0x537);
      }
      return ((dato << 10) | resto) ^ 0x5412;
    };

    const qrAplicarFormato = (matriz, usadas, mascara) => {
      const bits = qrFormatoBits(mascara);
      const bit = (indice) => ((bits >>> indice) & 1) === 1;

      for (let i = 0; i <= 5; i += 1) {
        qrSetFuncion(matriz, usadas, 8, i, bit(i));
      }
      qrSetFuncion(matriz, usadas, 8, 7, bit(6));
      qrSetFuncion(matriz, usadas, 8, 8, bit(7));
      qrSetFuncion(matriz, usadas, 7, 8, bit(8));
      for (let i = 9; i < 15; i += 1) {
        qrSetFuncion(matriz, usadas, 14 - i, 8, bit(i));
      }

      for (let i = 0; i < 8; i += 1) {
        qrSetFuncion(matriz, usadas, QR_SIZE - 1 - i, 8, bit(i));
      }
      for (let i = 8; i < 15; i += 1) {
        qrSetFuncion(matriz, usadas, 8, QR_SIZE - 15 + i, bit(i));
      }

      qrSetFuncion(matriz, usadas, QR_VERSION * 4 + 9, 8, true);
    };

    const qrConstruirMatriz = (contenido) => {
      const codewords = qrCrearCodewords(contenido);
      const bits = [];
      codewords.forEach((byte) => qrAgregarBits(bits, byte, 8));

      const matriz = qrNuevaMatriz();
      const usadas = qrNuevoMapa();

      qrDibujarFinder(matriz, usadas, 0, 0);
      qrDibujarFinder(matriz, usadas, 0, QR_SIZE - 7);
      qrDibujarFinder(matriz, usadas, QR_SIZE - 7, 0);
      qrDibujarAlineacion(matriz, usadas, 30, 30);

      for (let i = 8; i < QR_SIZE - 8; i += 1) {
        qrSetFuncion(matriz, usadas, 6, i, i % 2 === 0);
        qrSetFuncion(matriz, usadas, i, 6, i % 2 === 0);
      }

      qrReservarFormato(matriz, usadas);

      let bitIndex = 0;
      let ascendente = true;
      for (let col = QR_SIZE - 1; col >= 1; col -= 2) {
        if (col === 6) col -= 1;
        for (let offset = 0; offset < QR_SIZE; offset += 1) {
          const fila = ascendente ? QR_SIZE - 1 - offset : offset;
          for (let dx = 0; dx < 2; dx += 1) {
            const actualCol = col - dx;
            if (usadas[fila][actualCol]) continue;
            const bit = bitIndex < bits.length ? bits[bitIndex] === 1 : false;
            matriz[fila][actualCol] = qrMascara0(fila, actualCol) ? !bit : bit;
            bitIndex += 1;
          }
        }
        ascendente = !ascendente;
      }

      qrAplicarFormato(matriz, usadas, 0);
      return matriz;
    };

    const qrMatrizASvg = (matriz, borde = 2) => {
      const comandos = [];
      for (let fila = 0; fila < matriz.length; fila += 1) {
        for (let col = 0; col < matriz.length; col += 1) {
          if (!matriz[fila][col]) continue;
          comandos.push(`M${col + borde},${fila + borde}h1v1h-1z`);
        }
      }
      const tam = matriz.length + borde * 2;
      return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${tam} ${tam}" shape-rendering="crispEdges" aria-label="Codigo QR de entrega Melantia" style="width:116px;height:116px;display:block">
  <rect width="100%" height="100%" fill="#ffffff"></rect>
  <path d="${comandos.join(' ')}" fill="#173728"></path>
</svg>`;
    };

    return qrMatrizASvg(qrConstruirMatriz(texto));
  },

  _estadoTiendaMelantia() {
    return {
      ...(this._estadoComunidad().tienda || {}),
    };
  },

  _catalogoTiendasAfiliadasBase() {
    return [
      {
        id: 'ferreteria-la-vuelta',
        nombre: 'Ferreteria La Vuelta',
        tipo: 'Ferreteria afiliada',
        parroquia: 'El Carmen',
        canton: 'El Carmen',
        distancia: '12 minutos desde la finca',
        propietario: 'Rosa Zambrano',
        whatsapp: '593999111222',
        banco: 'Banco Pichincha · Ahorros · 2200457781',
        mesesGratis: 2,
        capacidadMaximaProductos: 20,
        inventarioPublicado: 14,
        productos: [
          { nombre: 'Machete reforzado', precio: 18.5, unidad: 'unidad' },
          { nombre: 'Bomba de mochila 20L', precio: 42, unidad: 'unidad' },
          { nombre: 'Alambre de puas', precio: 36, unidad: 'rollo' },
        ],
      },
      {
        id: 'agroinsumos-san-jose',
        nombre: 'Agroinsumos San Jose',
        tipo: 'Almacen agricola afiliado',
        parroquia: 'El Carmen',
        canton: 'El Carmen',
        distancia: '18 minutos por la via principal',
        propietario: 'Luis Anchundia',
        whatsapp: '593998222333',
        banco: 'BanEcuador · Corriente · 4412009987',
        mesesGratis: 2,
        capacidadMaximaProductos: 20,
        inventarioPublicado: 19,
        productos: [
          { nombre: 'Urea granulada', precio: 31, unidad: 'saco' },
          { nombre: 'Fertilizante foliar', precio: 9.75, unidad: 'litro' },
          {
            nombre: 'Semilla certificada de maiz',
            precio: 28,
            unidad: 'bolsa',
          },
        ],
      },
      {
        id: 'veterinaria-rancho-fiel',
        nombre: 'Veterinaria Rancho Fiel',
        tipo: 'Veterinaria afiliada',
        parroquia: 'El Carmen',
        canton: 'El Carmen',
        distancia: '25 minutos con entrega a domicilio',
        propietario: 'Dra. Andrea Cedeño',
        whatsapp: '593997333444',
        banco: 'Banco Guayaquil · Ahorros · 7712450091',
        mesesGratis: 2,
        capacidadMaximaProductos: 20,
        inventarioPublicado: 11,
        productos: [
          { nombre: 'Vitamina ADE', precio: 12.5, unidad: 'frasco' },
          { nombre: 'Antiparasitario bovino', precio: 21, unidad: 'frasco' },
          { nombre: 'Sal mineralizada', precio: 14, unidad: 'saco' },
        ],
      },
    ];
  },

  _catalogoTecnicosLocalesBase() {
    return [
      {
        id: 'ing-maria-vinueza',
        nombre: 'Ing. Maria Vinueza',
        perfil: 'Agronoma de campo',
        parroquia: 'El Carmen',
        canton: 'El Carmen',
        experiencia: '8 anos en cacao, maiz y bioinsumos',
        sugerido: true,
        whatsapp: '593995444555',
        tarifa: 25,
        curriculum:
          'Manejo integrado de plagas, planes de nutricion y recuperacion de lotes cansados.',
      },
      {
        id: 'dr-pablo-rios',
        nombre: 'Dr. Pablo Rios',
        perfil: 'Medico veterinario',
        parroquia: 'El Carmen',
        canton: 'El Carmen',
        experiencia: '11 anos en bovinos, porcinos y clinica preventiva rural',
        sugerido: true,
        whatsapp: '593996555666',
        tarifa: 30,
        curriculum:
          'Planes sanitarios, palpacion, chequeos reproductivos y urgencias de finca.',
      },
      {
        id: 'tec-jose-cabrera',
        nombre: 'Tec. Jose Cabrera',
        perfil: 'Tecnico agropecuario',
        parroquia: 'San Pedro',
        canton: 'El Carmen',
        experiencia: '6 anos en riego, cercas electricas y mejora de potreros',
        sugerido: false,
        whatsapp: '593994666777',
        tarifa: 18,
        curriculum:
          'Visitas practicas para infraestructura de finca, agua y manejo productivo.',
      },
    ];
  },

  _estadoComercioLocal() {
    const local = this._estadoComunidad().comercioLocal || {};
    return {
      parroquiaActual: local.parroquiaActual || 'El Carmen',
      referencia: local.referencia || 'Zona rural cercana a la finca',
      ultimaCalibracion: local.ultimaCalibracion || '',
      ultimoGPS: local.ultimoGPS || null,
      pedidoDirecto: local.pedidoDirecto || {},
      ventasRegistradas: Array.isArray(local.ventasRegistradas)
        ? local.ventasRegistradas
        : [],
      ultimoCorteMensual: local.ultimoCorteMensual || '',
      tiendasAfiliadas: this._catalogoTiendasAfiliadasBase(),
      tecnicosCampo: this._catalogoTecnicosLocalesBase(),
    };
  },

  _estadoSaludPreventiva() {
    const alertasCriticasDefault = [
      'critico',
      'grave',
      'inconsciente',
      'no respira',
      'convulsion',
      'paro',
      'hemorragia severa',
      'shock',
      'urgente',
    ];
    const salud = this._estadoComunidad().saludPreventiva || {};
    const pacientes = Array.isArray(salud.pacientes) ? salud.pacientes : [];
    const libroSalud = Array.isArray(salud.libroSalud) ? salud.libroSalud : [];
    const alertasCriticas = Array.isArray(salud.alertasCriticas)
      ? salud.alertasCriticas
          .map((item) => this._normalizar(String(item || '')))
          .filter(Boolean)
      : alertasCriticasDefault;
    return {
      adminPaulette: salud.adminPaulette !== false,
      capacidadPacientes: Number(salud.capacidadPacientes || 50),
      interfaz: salud.interfaz || 'Iconos_Grandes_Alta_Visibilidad',
      directorioEmergencia: {
        numeroPrincipal: salud.directorioEmergencia?.numeroPrincipal || '911',
        centroSalud:
          salud.directorioEmergencia?.centroSalud ||
          'Centro de Salud El Carmen',
        telefonoCentro:
          salud.directorioEmergencia?.telefonoCentro || '053000000',
      },
      pacientes,
      libroSalud,
      alertasCriticas,
      consejoSemanalEmitidoEn: salud.consejoSemanalEmitidoEn || '',
    };
  },

  configurarAlertasCriticasSalud() {
    const salud = this._estadoSaludPreventiva();
    const actual = (salud.alertasCriticas || []).join(', ');
    const entrada = String(
      window.prompt(
        'Palabras criticas separadas por coma para activar urgencia pediatrica.',
        actual || 'critico, grave, inconsciente, convulsion, hemorragia severa'
      ) || ''
    );
    const lista = entrada
      .split(',')
      .map((item) => this._normalizar(item))
      .filter(Boolean);
    if (!lista.length) return false;
    this._guardarEstadoSaludPreventiva({ alertasCriticas: lista });
    this.hablarComo(
      'Paulette',
      'Lista de alertas criticas actualizada para detectar urgencias pediatricas.'
    );
    return this.abrirAsistentePreventivoSalud();
  },

  _guardarEstadoSaludPreventiva(parcial = {}) {
    const estado = this._estadoComunidad();
    estado.saludPreventiva = {
      ...(estado.saludPreventiva || {}),
      ...parcial,
    };
    this._guardarEstadoComunidad(estado);
    return estado.saludPreventiva;
  },

  _catalogoEmergenciasRapidasSalud() {
    return {
      culebra: {
        icono: '🐍',
        titulo: 'Picadura de Culebra',
        dibujo: 'Serpiente en campo',
        signosPrompt: 'Dolor local, inflamacion, mareo o sudor frio',
        pasos: [
          'Mantener la calma y limitar el movimiento del paciente.',
          'NO succionar ni cortar la herida.',
          'Inmovilizar el miembro con entablillado suave.',
          'Retirar anillos, pulseras o botas apretadas.',
          'Organizar transporte inmediato al centro de salud.',
        ],
      },
      quemaduras: {
        icono: '🔥',
        titulo: 'Quemaduras',
        dibujo: 'Llama y cuidado de piel',
        signosPrompt: 'Enrojecimiento, ampollas, dolor intenso o piel blanca',
        pasos: [
          'Enfriar con agua corriente limpia por 15 a 20 minutos.',
          'NO aplicar pomadas caseras, cafe, pasta dental o aceite.',
          'Cubrir con tela limpia, seca y sin presionar.',
          'Retirar ropa o accesorios solo si no estan pegados.',
          'Trasladar si la quemadura es extensa o en cara/manos/genitales.',
        ],
      },
      herida_sangrante: {
        icono: '🩹',
        titulo: 'Herida Sangrante',
        dibujo: 'Venda con control de sangrado',
        signosPrompt: 'Sangrado continuo, palidez, debilidad o sudor frio',
        pasos: [
          'Aplicar presion directa fuerte con tela limpia.',
          'Elevar el miembro lesionado si no hay fractura visible.',
          'No retirar la primera tela si se empapa; agregar otra encima.',
          'Mantener al paciente acostado y vigilado.',
          'Trasladar de inmediato si el sangrado no cede.',
        ],
      },
      choque_desmayo: {
        icono: '⚡',
        titulo: 'Choque Electrico / Desmayo',
        dibujo: 'Rayo y posicion lateral de seguridad',
        signosPrompt: 'Perdida de conciencia, confusion o respiracion debil',
        pasos: [
          'NO tocar al paciente si hay corriente activa.',
          'Cortar la energia o separar con objeto seco no conductor.',
          'Verificar respiracion y pulso.',
          'Colocar en posicion lateral de seguridad si respira.',
          'Solicitar traslado urgente y vigilancia continua.',
        ],
      },
      parto_camino: {
        icono: '🤰',
        titulo: 'Parto en Camino',
        dibujo: 'Apoyo materno y panos limpios',
        signosPrompt: 'Contracciones frecuentes, dolor lumbar y pujo',
        pasos: [
          'Preparar panos limpios, agua segura y espacio privado.',
          'Guiar respiracion lenta: inhalar por nariz, exhalar por boca.',
          'No forzar salida del bebe ni tirar del cordon.',
          'Secar al recien nacido y mantener calor piel con piel.',
          'Coordinar transporte inmediato para control medico.',
        ],
      },
      intoxicacion: {
        icono: '🤢',
        titulo: 'Intoxicacion (Quimicos/Agro)',
        dibujo: 'Envase de quimico y proteccion respiratoria',
        signosPrompt: 'Nausea, vomito, mareo, dificultad para respirar',
        pasos: [
          'Retirar al paciente de la fuente de exposicion.',
          'Identificar producto y conservar envase o etiqueta.',
          'NO inducir vomito sin saber el producto exacto.',
          'Quitar ropa contaminada y lavar piel con agua abundante.',
          'Trasladar al centro medico llevando el envase.',
        ],
      },
    };
  },

  abrirEmergenciasRapidasSalud() {
    const catalogo = this._catalogoEmergenciasRapidasSalud();
    const botones = Object.entries(catalogo)
      .map(
        ([clave, item]) =>
          `<button style="min-height:180px;background:#fff;border:2px solid #dbe7de;border-radius:20px;font-weight:800;font-size:24px;display:grid;gap:8px;align-content:center;justify-items:center;cursor:pointer" onclick="window.MelantiaAsistente?.ejecutarProtocoloEmergenciaRapida('${clave}')"><div style="font-size:52px;line-height:1">${item.icono}</div><div>${this._escaparHtml(item.titulo)}</div></button>`
      )
      .join('');
    const cuerpo = `
      <section style="display:grid;gap:12px;background:#101518;border:1px solid #2a3339;border-radius:18px;padding:14px;color:#ffffff">
        <strong style="font-size:22px">Emergencias Rapidas · Botones de Panico Visual</strong>
        <div style="font-size:14px;opacity:.94">Toque un icono gigante. Paulette le guiara por voz y pasos visuales mientras llega el transporte.</div>
      </section>
      <section style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:10px">
        ${botones}
      </section>
      <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">
        <button onclick="window.MelantiaAsistente?.abrirAsistentePreventivoSalud()">Volver a Salud Preventiva</button>
      </div>`;
    this._abrirPanel(
      'Paulette · Manual de Emergencias Rapidas',
      'Modulo 100% visual y de reaccion inmediata para primeros auxilios en campo, sin internet.',
      cuerpo,
      'Paulette'
    );
    this.hablarComo(
      'Paulette',
      'Tranquilo, respire hondo. Soy Paulette y estoy aqui para ayudarle. Toque el icono de la emergencia y siga mis pasos visuales.'
    );
    return true;
  },

  ejecutarProtocoloEmergenciaRapida(clave = 'herida_sangrante') {
    const catalogo = this._catalogoEmergenciasRapidasSalud();
    const protocolo = catalogo[clave] || catalogo.herida_sangrante;
    const pasosHtml = (protocolo.pasos || [])
      .map(
        (paso, i) =>
          `<article style="background:#fff;border:1px solid #dbe7de;border-radius:12px;padding:10px"><strong>Paso ${i + 1}</strong><div style="margin-top:6px">${this._escaparHtml(paso)}</div></article>`
      )
      .join('');
    const cuerpo = `
      <section style="display:grid;gap:10px">
        <article style="background:#101518;color:#fff;border-radius:16px;padding:12px;display:grid;gap:6px">
          <strong style="font-size:22px">${this._escaparHtml(protocolo.titulo)}</strong>
          <div style="font-size:48px;line-height:1">${this._escaparHtml(protocolo.icono)}</div>
          <div style="font-size:13px;opacity:.9">Dibujo de referencia: ${this._escaparHtml(protocolo.dibujo)}</div>
        </article>
        ${pasosHtml}
        <article style="background:#fff8ef;border:1px solid #e6cfb1;border-radius:12px;padding:10px"><strong>Mensaje de calma</strong><div style="margin-top:6px">"Tranquilo, respire hondo. Mire el dibujo en pantalla y siga mis pasos. Usted puede hacerlo."</div></article>
      </section>
      <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">
        <button onclick="window.MelantiaAsistente?.finalizarProtocoloEmergenciaRapida('${this._escaparHtml(clave)}')">Finalizar emergencia</button>
        <button onclick="window.MelantiaAsistente?.abrirEmergenciasRapidasSalud()">Volver a botones de panico</button>
      </div>`;
    this._abrirPanel(
      `Paulette · Protocolo ${protocolo.icono}`,
      'Guia visual inmediata de primeros auxilios para campo y comunidad.',
      cuerpo,
      'Paulette'
    );
    this.hablarComo(
      'Paulette',
      `Tranquilo, respire hondo. Emergencia de ${protocolo.titulo}. Paso uno: ${protocolo.pasos[0]}. Paso dos: ${protocolo.pasos[1]}. Mantenga la calma mientras llega el transporte.`
    );
    return true;
  },

  finalizarProtocoloEmergenciaRapida(clave = 'herida_sangrante') {
    const registrar = window.confirm(
      'Desea registrar este evento en la ficha del paciente?'
    );
    if (!registrar) {
      this.hablarComo(
        'Paulette',
        'Entendido. Volvemos al panel de emergencias rapidas.'
      );
      return this.abrirEmergenciasRapidasSalud();
    }
    return this.registrarEventoEmergenciaRapidaSalud(clave);
  },

  registrarEventoEmergenciaRapidaSalud(clave = 'herida_sangrante') {
    const catalogo = this._catalogoEmergenciasRapidasSalud();
    const protocolo = catalogo[clave] || catalogo.herida_sangrante;
    const salud = this._estadoSaludPreventiva();

    let paciente = null;
    if (salud.pacientes.length) {
      const lista = salud.pacientes
        .map((p, i) => `${i + 1}. ${p.nombre}`)
        .join('\n');
      const indice = Number(
        window.prompt(
          `Seleccione paciente por numero:\n${lista}\n0. Registrar sin paciente guardado`,
          '1'
        ) || '1'
      );
      if (indice > 0) {
        paciente = salud.pacientes[Math.max(0, indice - 1)] || null;
      }
    }

    const nombreManual = paciente
      ? paciente.nombre
      : String(
          window.prompt('Nombre del paciente atendido.', 'Paciente eventual') ||
            'Paciente eventual'
        ).trim();
    const signos = String(
      window.prompt(
        'Signos observados.',
        protocolo.signosPrompt || 'Sin detalle'
      ) ||
        protocolo.signosPrompt ||
        'Sin detalle'
    ).trim();
    const traslado = String(
      window.prompt('Estado al cierre de emergencia.', 'Traslado coordinado') ||
        'Traslado coordinado'
    ).trim();

    const normal = this._normalizarEmergenciaSalud(protocolo.titulo);
    const evento = {
      id: this._crearIdSalud('evento'),
      fecha: new Date().toISOString(),
      pacienteId: paciente?.id || '',
      pacienteNombreLibre: nombreManual || 'Paciente eventual',
      tipo: normal.clave,
      tipoEtiqueta: protocolo.titulo,
      signos: signos || 'Sin detalle',
      acciones: (protocolo.pasos || []).slice(0, 3).join(' | '),
      traslado: traslado || 'En evaluacion',
      responsable: 'Primer respondedor MELANTIA',
      formatoFicha: 'comunitaria',
      perfilAtencion: this._normalizarPerfilSalud('', paciente?.edad || 0),
      origen: 'manual_emergencias_rapidas',
    };

    this._guardarEstadoSaludPreventiva({
      libroSalud: [...salud.libroSalud, evento],
    });

    const recompensa = this.acumularEnAlcanciaNavideña(
      10,
      'primer_respondedor_salud'
    );
    const ganoMelantios = recompensa?.permitido === true;

    this.hablarComo(
      'Paulette',
      `Evento guardado: ${protocolo.titulo} para ${nombreManual}. ${ganoMelantios ? 'Se acreditaron 10 Melantios en su alcancia navidena por actuar como primer respondedor.' : 'El evento quedo registrado en su Libro de Salud.'}`
    );

    return this.abrirAsistentePreventivoSalud();
  },

  _estadoDonEloyPlaza() {
    const plaza = this._estadoComunidad().donEloyPlaza || {};
    const agenda = plaza.agendaDiaria || {};
    const cron = plaza.cronProgramado || {};
    const le = plaza.linguisticLearningEngine || {};
    return {
      indiceRotativo: Number(plaza.indiceRotativo || 0),
      ultimoNoticieroEn: plaza.ultimoNoticieroEn || '',
      ultimoCuentoEn: plaza.ultimoCuentoEn || '',
      ultimoHumorEn: plaza.ultimoHumorEn || '',
      agendaDiaria: {
        dia: agenda.dia || '',
        mananaEn: agenda.mananaEn || '',
        tardeEn: agenda.tardeEn || '',
      },
      cronProgramado: {
        manana: String(cron.manana || '06:00'),
        tarde: String(cron.tarde || '18:00'),
      },
      saludoInauguralQuichua: String(
        plaza.saludoInauguralQuichua ||
          'Alli punlla, socios. Kawsayta yuyarishun: allpata kuyaywan tarpuna kawsayta alli rikuchin.'
      ),
      saludoInauguralEmitidoEn: plaza.saludoInauguralEmitidoEn || '',
      linguisticLearningEngine: {
        detectedLanguage: String(le.detectedLanguage || 'es'),
        autoDetect: le.autoDetect !== false,
        vocabularyExpansion: le.vocabularyExpansion !== false,
        crossModuleTranslation: le.crossModuleTranslation !== false,
        communityLanguageByZone: {
          sierra: String(le.communityLanguageByZone?.sierra || 'quichua'),
          oriente: String(le.communityLanguageByZone?.oriente || 'shuar'),
          costa: String(le.communityLanguageByZone?.costa || 'es'),
        },
        learnedVocabulary:
          le.learnedVocabulary && typeof le.learnedVocabulary === 'object'
            ? le.learnedVocabulary
            : {},
        pendingValidation: Array.isArray(le.pendingValidation)
          ? le.pendingValidation.slice(0, 120)
          : [],
        lastLearningPromptAt: le.lastLearningPromptAt || '',
      },
      tesoroAbuelos: Array.isArray(plaza.tesoroAbuelos)
        ? plaza.tesoroAbuelos.slice(0, 120)
        : [],
      carpetasDinamicas: {
        nuevosSaberesComunitarios:
          plaza.carpetasDinamicas?.nuevosSaberesComunitarios ||
          '05_intercultural_lenguaje/nuevos_saberes_comunitarios',
        archivoVocesAncestrales:
          plaza.carpetasDinamicas?.archivoVocesAncestrales ||
          '05_intercultural_lenguaje/archivo_voces_ancestrales',
      },
      guardianMemoria: {
        titulo:
          plaza.guardianMemoria?.titulo || 'Guardian de la Memoria de Melantia',
        destacados: Array.isArray(plaza.guardianMemoria?.destacados)
          ? plaza.guardianMemoria.destacados.slice(0, 10)
          : [],
        actualizadoEn: plaza.guardianMemoria?.actualizadoEn || '',
      },
      aportesAnonimos: Array.isArray(plaza.aportesAnonimos)
        ? plaza.aportesAnonimos.slice(0, 80)
        : [],
    };
  },

  _resumirGuardianesMemoriaDonEloy() {
    const plaza = this._estadoDonEloyPlaza();
    const conteo = new Map();
    (plaza.tesoroAbuelos || []).forEach((item) => {
      const nombre = String(item.nombreMayor || 'Mayor sin nombre').trim();
      conteo.set(nombre, (conteo.get(nombre) || 0) + 1);
    });
    return Array.from(conteo.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nombre, total]) => ({ nombre, total }));
  },

  _actualizarReconocimientoGuardianMemoriaDonEloy() {
    const plaza = this._estadoDonEloyPlaza();
    const destacados = this._resumirGuardianesMemoriaDonEloy();
    this._guardarEstadoDonEloyPlaza({
      guardianMemoria: {
        titulo: 'Guardian de la Memoria de Melantia',
        destacados,
        actualizadoEn: new Date().toISOString(),
      },
    });
    return destacados;
  },

  async grabarTesoroAbuelosDonEloy() {
    const audio = await this._seleccionarArchivoCustodia({ accept: 'audio/*' });
    if (!audio) return false;
    const limite = 1200 * 1024;
    if (Number(audio.size || 0) > limite) {
      this.hablarDonEloy(
        'El audio esta muy pesado para guardarlo localmente. Grabelo mas cortito, de un minuto aproximado, para asegurar el archivo de voces ancestrales.'
      );
      return false;
    }
    const nombreMayor = String(
      window.prompt(
        'Nombre del Taita o Mama (como desea ser reconocido).',
        'Taita de la comunidad'
      ) || 'Taita de la comunidad'
    ).trim();
    const categoria = this._normalizar(
      String(
        window.prompt(
          'Categoria: palabra antigua, cuento olvidado o historia de la comunidad.',
          'palabra antigua'
        ) || 'palabra antigua'
      )
    );
    const origen = String(
      window.prompt(
        'Origen de la sabiduria (comunidad/parroquia/provincia).',
        `${this._estadoComercioLocal().parroquiaActual || 'Comunidad local'}, Ecuador`
      ) || 'Comunidad local'
    ).trim();
    const resumen = String(
      window.prompt(
        'Resumen breve de lo grabado.',
        'Palabra y relato ancestral de la comunidad.'
      ) || ''
    ).trim();
    const lenguaSugerida = this.actualizarDeteccionLenguaDonEloy(
      `${resumen} ${origen}`
    );
    const palabra = String(
      window.prompt('Si aplica, palabra antigua destacada.', '') || ''
    ).trim();
    const significado = String(
      window.prompt(
        'Significado de esa palabra en castellano (si aplica).',
        ''
      ) || ''
    ).trim();
    const audioDataUrl = await this._leerArchivoComoDataUrl(audio);
    const plaza = this._estadoDonEloyPlaza();
    const registro = {
      id: this._crearIdSalud('tesoro'),
      nombreMayor: nombreMayor || 'Mayor sin nombre',
      categoria: categoria.includes('cuento')
        ? 'cuento_olvidado'
        : categoria.includes('historia')
          ? 'historia_comunidad'
          : 'palabra_antigua',
      origen,
      resumen: resumen || 'Sin resumen',
      language: this._normalizar(
        lenguaSugerida || this._inferirLenguaPorZonaDonEloy()
      ),
      audioNombre: audio.name || 'voz_ancestral.webm',
      audioMime: audio.type || 'audio/webm',
      audioDataUrl,
      fecha: new Date().toISOString(),
    };
    const tesoro = [registro, ...(plaza.tesoroAbuelos || [])].slice(0, 120);
    const le = plaza.linguisticLearningEngine || {};
    let pendingValidation = le.pendingValidation || [];
    if (palabra && significado) {
      pendingValidation = [
        {
          id: this._crearIdSalud('lingua'),
          terminoOriginal: palabra,
          significadoEs: significado,
          language: registro.language || 'es',
          claveSemantica: this._normalizar(palabra),
          validado: false,
          origen,
          creadoEn: new Date().toISOString(),
        },
        ...pendingValidation,
      ].slice(0, 120);
    }
    this._guardarEstadoDonEloyPlaza({
      tesoroAbuelos: tesoro,
      linguisticLearningEngine: {
        ...le,
        detectedLanguage: registro.language || le.detectedLanguage || 'es',
        pendingValidation,
      },
    });
    const destacados = this._actualizarReconocimientoGuardianMemoriaDonEloy();
    this.hablarDonEloy(
      `Gracias, ${nombreMayor || 'Taita'}. Su palabra ya esta segura en el corazon de Melantia. ${destacados.length ? `Reconocimiento activo: ${destacados[0].nombre} lidera con ${destacados[0].total} aporte(s).` : ''}`
    );
    return this.abrirTablonDonEloy();
  },

  verMapaSabiduriaDonEloy() {
    const plaza = this._estadoDonEloyPlaza();
    const mapa = new Map();
    (plaza.tesoroAbuelos || []).forEach((item) => {
      const clave = String(item.origen || 'Origen no especificado');
      mapa.set(clave, (mapa.get(clave) || 0) + 1);
    });
    const ranking = Array.from(mapa.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(
        ([origen, total]) =>
          `<article style="background:#fff;border:1px solid #dbe7de;border-radius:12px;padding:10px"><strong>${this._escaparHtml(origen)}</strong><div style="margin-top:6px">${this._escaparHtml(String(total))} tesoro(s) registrados</div></article>`
      )
      .join('');
    const destacados = this._resumirGuardianesMemoriaDonEloy()
      .map(
        (item, i) =>
          `<div>${i + 1}. ${this._escaparHtml(item.nombre)} · ${this._escaparHtml(String(item.total))} aporte(s)</div>`
      )
      .join('');
    const cuerpo = `
      <section style="display:grid;gap:10px">
        <article style="background:#fff8ef;border:1px solid #e6cfb1;border-radius:14px;padding:12px"><strong>Mision Tesoro de los Abuelos</strong><div style="margin-top:6px">Carpeta dinamica de saberes: ${this._escaparHtml(plaza.carpetasDinamicas?.nuevosSaberesComunitarios || '')}. Archivo de voces: ${this._escaparHtml(plaza.carpetasDinamicas?.archivoVocesAncestrales || '')}.</div></article>
        <article style="background:#eef7ff;border:1px solid #c9dcf7;border-radius:14px;padding:12px"><strong>Mapa de Sabiduria por origen</strong><div style="margin-top:8px;display:grid;gap:8px">${ranking || '<div>Sin registros todavia.</div>'}</div></article>
        <article style="background:#f5fbf5;border:1px solid #d3e7d3;border-radius:14px;padding:12px"><strong>${this._escaparHtml(plaza.guardianMemoria?.titulo || 'Guardian de la Memoria')}</strong><div style="margin-top:8px">${destacados || 'Sin destacados aun.'}</div></article>
      </section>
      <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px">
        <button onclick="window.MelantiaAsistente?.grabarTesoroAbuelosDonEloy()">Grabar tesoro</button>
        <button onclick="window.MelantiaAsistente?.compartirHallazgoAncestralDonEloy()">Compartir hallazgo</button>
        <button onclick="window.MelantiaAsistente?.abrirTablonDonEloy()">Volver al tablon</button>
      </div>`;
    this._abrirPanel(
      'Don Eloy · Mapa de Sabiduria Viva',
      'Archivo vivo del patrimonio inmaterial: voces ancestrales, lengua y orgullo comunitario.',
      cuerpo,
      'Don Eloy'
    );
    return true;
  },

  compartirHallazgoAncestralDonEloy() {
    const plaza = this._estadoDonEloyPlaza();
    const registro = this._tomarElementoRotativoDonEloy(
      plaza.tesoroAbuelos || []
    );
    if (!registro) {
      this.hablarDonEloy(
        'Todavia no hay hallazgos ancestrales guardados. Iniciemos con Grabar Tesoro para rescatar la palabra antigua.'
      );
      return false;
    }
    const texto = `Escuchen lo que me enseno ${registro.nombreMayor} desde ${registro.origen}: ${registro.resumen}. Asi cuidamos la memoria viva de nuestros pueblos.`;
    this.hablarDonEloy(texto);
    return true;
  },

  _inferirLenguaPorZonaDonEloy() {
    const plaza = this._estadoDonEloyPlaza();
    const zona = this._perfilZonaDonEloy();
    return (
      plaza.linguisticLearningEngine?.communityLanguageByZone?.[zona] || 'es'
    );
  },

  _detectarLenguaEnTextoDonEloy(texto = '') {
    const t = this._normalizar(texto);
    if (!t) return '';
    const perfiles = [
      {
        lang: 'quichua',
        pistas: ['alli', 'punlla', 'sumak', 'kawsay', 'yaku', 'chakana'],
      },
      {
        lang: 'shuar',
        pistas: ['winiaitiai', 'juarkitiai', 'nunk', 'iwia', 'etsa', 'entsa'],
      },
      {
        lang: 'tsafiki',
        pistas: ['tsara', 'joe', 'tsachila', 'tsa', 'shimi', 'chapi'],
      },
      {
        lang: 'aingae',
        pistas: ['aingae', 'cofan', 'kankue', 'atesu'],
      },
      {
        lang: 'achuar',
        pistas: ['chichamrua', 'achuar', 'wajai', 'nantar'],
      },
      {
        lang: 'paicoca',
        pistas: ['paicoca', 'siona', 'secoya', 'pai'],
      },
    ];
    for (const perfil of perfiles) {
      if (perfil.pistas.some((p) => t.includes(p))) return perfil.lang;
    }
    return 'es';
  },

  actualizarDeteccionLenguaDonEloy(texto = '') {
    const plaza = this._estadoDonEloyPlaza();
    const le = plaza.linguisticLearningEngine || {};
    const inferida = le.autoDetect
      ? this._detectarLenguaEnTextoDonEloy(texto)
      : '';
    const detectada =
      inferida && inferida !== 'es'
        ? inferida
        : this._inferirLenguaPorZonaDonEloy();
    this._guardarEstadoDonEloyPlaza({
      linguisticLearningEngine: {
        ...le,
        detectedLanguage: detectada || 'es',
      },
    });
    return detectada || 'es';
  },

  async _lexicoBaseDonEloy() {
    const b = await this._bibliotecaInterculturalDonEloy();
    const semillas = [
      ...(b.saberesQu || []),
      ...(b.saberesSh || []),
      ...(b.saberesTs || []),
    ];
    const terminos = new Set([
      'melantia',
      'don',
      'eloy',
      'comunidad',
      'plaza',
      'costa',
      'sierra',
      'oriente',
      'aingae',
      'achuar',
      'paicoca',
      'chichamrua',
    ]);
    semillas.forEach((item) => {
      const bloque = this._normalizar(
        `${item.titulo || ''} ${item.descripcion || ''}`
      );
      bloque
        .split(/[^a-z0-9]+/)
        .filter((w) => w.length >= 4)
        .forEach((w) => terminos.add(w));
    });
    return terminos;
  },

  async _detectarTerminosDesconocidosDonEloy(texto = '') {
    const t = this._normalizar(texto);
    if (!t) return [];
    const base = await this._lexicoBaseDonEloy();
    const comunes = new Set([
      'melantia',
      'quiero',
      'contar',
      'historia',
      'cuento',
      'saludo',
      'programacion',
      'noticiero',
      'comunidad',
      'virtual',
      'don',
      'eloy',
    ]);
    return t
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 5)
      .filter((w) => !comunes.has(w) && !base.has(w))
      .slice(0, 4);
  },

  async protocoloAprendizajeLinguisticoDonEloy(texto = '') {
    const plaza = this._estadoDonEloyPlaza();
    const le = plaza.linguisticLearningEngine || {};
    if (!le.vocabularyExpansion) return false;
    const ahora = Date.now();
    const ultimo = le.lastLearningPromptAt
      ? new Date(le.lastLearningPromptAt).getTime()
      : 0;
    if (ultimo && ahora - ultimo < 6 * 60 * 60 * 1000) return false;
    const lengua = this._detectarLenguaEnTextoDonEloy(texto);
    if (!lengua || lengua === 'es') return false;
    const desconocidos = await this._detectarTerminosDesconocidosDonEloy(texto);
    const termino = desconocidos[0];
    if (!termino) return false;
    this.hablarDonEloy(
      `Vea, socio, esa palabra ${termino} no la conocia. Me ensena que significa para hablar como ustedes?`
    );
    const significado = String(
      window.prompt(
        `Que significa "${termino}" en castellano?`,
        'Significado comunitario'
      ) || ''
    ).trim();
    if (!significado) {
      this._guardarEstadoDonEloyPlaza({
        linguisticLearningEngine: {
          ...le,
          lastLearningPromptAt: new Date().toISOString(),
        },
      });
      return false;
    }
    const pendiente = {
      id: this._crearIdSalud('lingua'),
      terminoOriginal: termino,
      significadoEs: significado,
      language: lengua,
      claveSemantica: this._normalizar(termino),
      validado: false,
      creadoEn: new Date().toISOString(),
    };
    const pendientes = [pendiente, ...(le.pendingValidation || [])].slice(
      0,
      120
    );
    this._guardarEstadoDonEloyPlaza({
      linguisticLearningEngine: {
        ...le,
        pendingValidation: pendientes,
        lastLearningPromptAt: new Date().toISOString(),
      },
    });
    this.hablarDonEloy(
      'Gracias, socio. Lo guardare para revision del padrino o presidente antes de usarlo en todos los modulos.'
    );
    return true;
  },

  registrarAprendizajeLinguisticoDonEloy() {
    const plaza = this._estadoDonEloyPlaza();
    const le = plaza.linguisticLearningEngine || {};
    const termino = String(
      window.prompt('Palabra en lengua local.', '') || ''
    ).trim();
    if (!termino) return false;
    const significado = String(
      window.prompt('Significado en castellano.', '') || ''
    ).trim();
    if (!significado) return false;
    const lengua = String(
      window.prompt(
        'Lengua (quichua, shuar, tsafiki, aingae, achuar, paicoca).',
        le.detectedLanguage || 'quichua'
      ) || 'quichua'
    ).trim();
    const clave = String(
      window.prompt(
        'Clave semantica para usar en modulos (ej: comunidad, salud, tienda, agua).',
        this._normalizar(termino)
      ) || this._normalizar(termino)
    ).trim();
    const pendiente = {
      id: this._crearIdSalud('lingua'),
      terminoOriginal: termino,
      significadoEs: significado,
      language: this._normalizar(lengua),
      claveSemantica: this._normalizar(clave || termino),
      validado: false,
      creadoEn: new Date().toISOString(),
    };
    this._guardarEstadoDonEloyPlaza({
      linguisticLearningEngine: {
        ...le,
        pendingValidation: [pendiente, ...(le.pendingValidation || [])].slice(
          0,
          120
        ),
      },
    });
    this.hablarDonEloy(
      'Aprendizaje guardado. Queda pendiente de validacion por el padrino o presidente.'
    );
    return true;
  },

  validarAprendizajeLinguisticoDonEloy() {
    const plaza = this._estadoDonEloyPlaza();
    const le = plaza.linguisticLearningEngine || {};
    const pendientes = (le.pendingValidation || []).filter(
      (item) => !item.validado
    );
    if (!pendientes.length) {
      this.hablarDonEloy(
        'No hay terminos pendientes de validacion en este momento.'
      );
      return false;
    }
    const menu = pendientes
      .map((item, i) => `${i + 1}. ${item.terminoOriginal} (${item.language})`)
      .join('\n');
    const indice = Number(
      window.prompt(`Seleccione termino a validar:\n${menu}`, '1') || '1'
    );
    const item = pendientes[Math.max(0, indice - 1)] || pendientes[0];
    if (!item) return false;
    const decision = this._normalizar(
      String(
        window.prompt('Decision: aprobar o rechazar.', 'aprobar') || 'aprobar'
      )
    );
    if (!decision.includes('apro')) {
      const nuevoPendiente = (le.pendingValidation || []).map((p) =>
        p.id === item.id ? { ...p, validado: true, rechazado: true } : p
      );
      this._guardarEstadoDonEloyPlaza({
        linguisticLearningEngine: {
          ...le,
          pendingValidation: nuevoPendiente,
        },
      });
      this.hablarDonEloy('Termino rechazado. No se aplicara en los modulos.');
      return true;
    }
    const clave = this._normalizar(
      String(
        window.prompt(
          'Clave semantica final para aplicacion transversal.',
          item.claveSemantica || this._normalizar(item.terminoOriginal)
        ) ||
          item.claveSemantica ||
          this._normalizar(item.terminoOriginal)
      )
    );
    const vocab =
      le.learnedVocabulary && typeof le.learnedVocabulary === 'object'
        ? { ...le.learnedVocabulary }
        : {};
    vocab[clave] = {
      ...(vocab[clave] || {}),
      es: item.significadoEs,
      [item.language]: item.terminoOriginal,
      validadoEn: new Date().toISOString(),
    };
    const nuevoPendiente = (le.pendingValidation || []).map((p) =>
      p.id === item.id
        ? { ...p, validado: true, aprobadoEn: new Date().toISOString() }
        : p
    );
    this._guardarEstadoDonEloyPlaza({
      linguisticLearningEngine: {
        ...le,
        learnedVocabulary: vocab,
        pendingValidation: nuevoPendiente,
      },
    });
    this.hablarDonEloy(
      `Termino validado. Desde hoy usare ${item.terminoOriginal} para la clave ${clave} en comunidad, salud, tienda y negocios.`
    );
    return true;
  },

  terminoModuloDonEloy(clave = '', fallback = '') {
    const plaza = this._estadoDonEloyPlaza();
    const le = plaza.linguisticLearningEngine || {};
    if (!le.crossModuleTranslation) return fallback || clave;
    const key = this._normalizar(clave || '');
    const lang = this._normalizar(le.detectedLanguage || 'es');
    const vocab = le.learnedVocabulary || {};
    const entrada = vocab[key] || null;
    if (!entrada) return fallback || clave;
    return entrada[lang] || entrada.es || fallback || clave;
  },

  _claveDiaDonEloy(fecha = new Date()) {
    const y = fecha.getFullYear();
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const d = String(fecha.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  _franjaHorariaDonEloy(fecha = new Date()) {
    const h = Number(fecha.getHours());
    if (h >= 5 && h < 14) return 'manana';
    if (h >= 14 && h < 22) return 'tarde';
    return '';
  },

  _minutosDesdeHoraTextoDonEloy(hhmm = '06:00') {
    const limpio = String(hhmm || '').trim();
    const partes = limpio.split(':');
    const hh = Number(partes[0] || 0);
    const mm = Number(partes[1] || 0);
    const h = Number.isFinite(hh) ? Math.max(0, Math.min(23, hh)) : 6;
    const m = Number.isFinite(mm) ? Math.max(0, Math.min(59, mm)) : 0;
    return h * 60 + m;
  },

  _minutosActualesDonEloy(fecha = new Date()) {
    return Number(fecha.getHours()) * 60 + Number(fecha.getMinutes());
  },

  _perfilZonaDonEloy() {
    const c = this._estadoComercioLocal();
    const texto = this._normalizar(
      `${c.parroquiaActual || ''} ${c.canton || ''} ${c.referencia || ''}`
    );
    if (
      texto.includes('napo') ||
      texto.includes('pastaza') ||
      texto.includes('orellana') ||
      texto.includes('morona') ||
      texto.includes('zamora') ||
      texto.includes('sucumbios') ||
      texto.includes('oriente') ||
      texto.includes('amazonia')
    ) {
      return 'oriente';
    }
    if (
      texto.includes('quito') ||
      texto.includes('chimborazo') ||
      texto.includes('cotopaxi') ||
      texto.includes('imbabura') ||
      texto.includes('sierra') ||
      texto.includes('ambato') ||
      texto.includes('riobamba')
    ) {
      return 'sierra';
    }
    return 'costa';
  },

  _saludoPorZonaDonEloy() {
    const plaza = this._estadoDonEloyPlaza();
    const lengua = this._normalizar(
      plaza.linguisticLearningEngine?.detectedLanguage || 'es'
    );
    if (lengua === 'achuar') {
      return 'Chichamrua, socios. Asi saludan nuestros hermanos Achuar y hoy compartimos palabra viva de la selva.';
    }
    if (lengua === 'aingae') {
      return 'Kankue, socios. Hoy abrimos la plaza con respeto a la palabra Aingae de nuestros pueblos amazónicos.';
    }
    if (lengua === 'paicoca') {
      return 'Pai, socios. Saludamos tambien en Paicoca para que ninguna lengua se quede afuera de Melantia.';
    }
    const zona = this._perfilZonaDonEloy();
    if (zona === 'sierra') {
      return 'Alli punlla, socios. Que alegria verlos activos por aqui en la Sierra.';
    }
    if (zona === 'oriente') {
      return 'Winiaitiai, socios. Como dicen nuestros hermanos Shuar, hoy es un gran dia para trabajar la tierra.';
    }
    return 'Que dice, familia. Desde la Costa les traigo un amorfino para empezar la jornada con alegria.';
  },

  async _capsulaSabiduriaPueblosDonEloy() {
    const b = await this._bibliotecaInterculturalDonEloy();
    const diaSemana = Number(new Date().getDay());
    if (diaSemana === 1) {
      const ancestral =
        this._tomarElementoRotativoDonEloy([...b.saberesQu, ...b.saberesSh]) ||
        b.saberesQu?.[0] ||
        b.saberesSh?.[0] ||
        null;
      return ancestral
        ? `Lunes de Saberes Ancestrales: ${ancestral.titulo || 'Sabiduria viva'}. ${ancestral.descripcion || ''}`
        : 'Lunes de Saberes Ancestrales: cuidemos la tierra y el agua con respeto.';
    }
    if (diaSemana === 3) {
      const manaba =
        this._tomarElementoRotativoDonEloy(b.manabitas || []) ||
        b.manabitas?.[0] ||
        null;
      return manaba
        ? `Miercoles de Manabitismo: ${manaba.texto || manaba.descripcion || 'Tradicion viva manabita.'}`
        : 'Miercoles de Manabitismo: gastronomia, pesca y agro con orgullo montuvio.';
    }
    const general =
      this._tomarElementoRotativoDonEloy(b.saberesEs || []) ||
      b.saberesEs?.[0] ||
      null;
    return general
      ? `Sabiduria de Nuestros Pueblos: ${general.titulo || 'Dato del dia'}. ${general.descripcion || ''}`
      : 'Sabiduria de Nuestros Pueblos: cada territorio nos deja una leccion para producir mejor.';
  },

  async publicarCapsulaMananaDonEloy(opciones = {}) {
    const plaza = this._estadoDonEloyPlaza();
    const silencioso = opciones.silencioso === true;
    const franja = opciones.franja || 'manana';
    const dia = this._claveDiaDonEloy(new Date());
    const saludoInauguralDisponible =
      plaza.saludoInauguralQuichua &&
      (!plaza.saludoInauguralEmitidoEn ||
        !String(plaza.saludoInauguralEmitidoEn).startsWith(dia));
    const saludo = saludoInauguralDisponible
      ? plaza.saludoInauguralQuichua
      : this._saludoPorZonaDonEloy();
    const capsula = await this._capsulaSabiduriaPueblosDonEloy();
    const mensaje = `${saludo} ${capsula}`;
    this._guardarEstadoDonEloyPlaza({
      ultimoNoticieroEn: new Date().toISOString(),
      saludoInauguralEmitidoEn: saludoInauguralDisponible
        ? `${dia}T${String(new Date().toTimeString()).slice(0, 8)}`
        : plaza.saludoInauguralEmitidoEn,
    });
    this._marcarAgendaDiariaDonEloy(franja);
    if (!silencioso) this.hablarDonEloy(mensaje);
    return true;
  },

  _marcarAgendaDiariaDonEloy(franja = '', fechaIso = '') {
    if (!franja) return this._estadoDonEloyPlaza().agendaDiaria;
    const fecha = fechaIso ? new Date(fechaIso) : new Date();
    const dia = this._claveDiaDonEloy(fecha);
    const plaza = this._estadoDonEloyPlaza();
    const agendaBase =
      plaza.agendaDiaria?.dia === dia
        ? plaza.agendaDiaria
        : { dia, mananaEn: '', tardeEn: '' };
    const agendaNueva = {
      ...agendaBase,
      [franja === 'manana' ? 'mananaEn' : 'tardeEn']:
        fechaIso || new Date().toISOString(),
    };
    this._guardarEstadoDonEloyPlaza({ agendaDiaria: agendaNueva });
    return agendaNueva;
  },

  async ejecutarProgramacionDonEloyDiaria() {
    const ahora = new Date();
    const franja = this._franjaHorariaDonEloy(ahora);
    if (!franja) return false;
    const dia = this._claveDiaDonEloy(ahora);
    const plaza = this._estadoDonEloyPlaza();
    const cron = plaza.cronProgramado || { manana: '06:00', tarde: '18:00' };
    const minutosAhora = this._minutosActualesDonEloy(ahora);
    const minutosManana = this._minutosDesdeHoraTextoDonEloy(cron.manana);
    const minutosTarde = this._minutosDesdeHoraTextoDonEloy(cron.tarde);
    const agenda =
      plaza.agendaDiaria?.dia === dia
        ? plaza.agendaDiaria
        : { dia, mananaEn: '', tardeEn: '' };
    if (
      franja === 'manana' &&
      !agenda.mananaEn &&
      minutosAhora >= minutosManana &&
      minutosAhora < minutosTarde
    ) {
      await this.publicarCapsulaMananaDonEloy({
        silencioso: false,
        franja: 'manana',
      });
      return true;
    }
    if (franja === 'tarde' && !agenda.tardeEn && minutosAhora >= minutosTarde) {
      await this.contarHistoriaDonEloy({
        silencioso: false,
        franja: 'tarde',
      });
      return true;
    }
    return false;
  },

  _guardarEstadoDonEloyPlaza(parcial = {}) {
    const estado = this._estadoComunidad();
    estado.donEloyPlaza = {
      ...(estado.donEloyPlaza || {}),
      ...parcial,
    };
    this._guardarEstadoComunidad(estado);
    return estado.donEloyPlaza;
  },

  async _cargarSeedIntercultural(nombreArchivo, fallback = null) {
    this._interculturalCache = this._interculturalCache || {};
    if (
      Object.prototype.hasOwnProperty.call(
        this._interculturalCache,
        nombreArchivo
      )
    ) {
      return this._interculturalCache[nombreArchivo];
    }
    try {
      const ruta = `./knowledge_seeds/05_intercultural_lenguaje/${nombreArchivo}`;
      const resp = await fetch(ruta, { cache: 'no-store' });
      if (!resp.ok) throw new Error(`Seed no disponible: ${nombreArchivo}`);
      const data = await resp.json();
      this._interculturalCache[nombreArchivo] = data;
      return data;
    } catch (error) {
      console.warn(
        '[Melantia] No pude cargar seed intercultural:',
        nombreArchivo,
        error
      );
      const seguro = fallback ?? [];
      this._interculturalCache[nombreArchivo] = seguro;
      return seguro;
    }
  },

  _tomarElementoRotativoDonEloy(lista = []) {
    if (!Array.isArray(lista) || !lista.length) return null;
    const plaza = this._estadoDonEloyPlaza();
    const indice =
      Math.abs(Number(plaza.indiceRotativo || 0)) % Math.max(1, lista.length);
    const elegido = lista[indice] || lista[0] || null;
    this._guardarEstadoDonEloyPlaza({ indiceRotativo: indice + 1 });
    return elegido;
  },

  async _bibliotecaInterculturalDonEloy() {
    if (this._donEloyBibliotecaCache) return this._donEloyBibliotecaCache;
    const [
      costa,
      sierra,
      oriente,
      cuentosAmazonia,
      cuentosSierra,
      saberesEs,
      saberesQu,
      saberesSh,
      saberesTs,
      manabitas,
      shuarGlosario,
      tsafikiGlosario,
    ] = await Promise.all([
      this._cargarSeedIntercultural('costa.json', []),
      this._cargarSeedIntercultural('sierra.json', []),
      this._cargarSeedIntercultural('oriente.json', []),
      this._cargarSeedIntercultural('cuentos_amazonia.json', []),
      this._cargarSeedIntercultural('cuentos_sierra.json', []),
      this._cargarSeedIntercultural('saberes_folclore_es.json', []),
      this._cargarSeedIntercultural('saberes_folclore_qu.json', []),
      this._cargarSeedIntercultural('saberes_folclore_sh.json', []),
      this._cargarSeedIntercultural('saberes_folclore_ts.json', []),
      this._cargarSeedIntercultural('saberes_manabitas_es.json', []),
      this._cargarSeedIntercultural('shuar_glosario.json', {}),
      this._cargarSeedIntercultural('tsafiki_glosario.json', {}),
    ]);
    this._donEloyBibliotecaCache = {
      costa: Array.isArray(costa) ? costa : [],
      sierra: Array.isArray(sierra) ? sierra : [],
      oriente: Array.isArray(oriente) ? oriente : [],
      cuentosAmazonia: Array.isArray(cuentosAmazonia) ? cuentosAmazonia : [],
      cuentosSierra: Array.isArray(cuentosSierra) ? cuentosSierra : [],
      saberesEs: Array.isArray(saberesEs) ? saberesEs : [],
      saberesQu: Array.isArray(saberesQu) ? saberesQu : [],
      saberesSh: Array.isArray(saberesSh) ? saberesSh : [],
      saberesTs: Array.isArray(saberesTs) ? saberesTs : [],
      manabitas: Array.isArray(manabitas) ? manabitas : [],
      shuarGlosario:
        shuarGlosario && typeof shuarGlosario === 'object' ? shuarGlosario : {},
      tsafikiGlosario:
        tsafikiGlosario && typeof tsafikiGlosario === 'object'
          ? tsafikiGlosario
          : {},
    };
    return this._donEloyBibliotecaCache;
  },

  async saludoInterculturalDonEloy() {
    const mensaje = `Atencion, mi gente. ${this._saludoPorZonaDonEloy()} Aqui compartimos saberes sin perder la identidad de cada territorio.`;
    this.hablarDonEloy(mensaje);
    return mensaje;
  },

  async publicarNoticieroDonEloy(opciones = {}) {
    const b = await this._bibliotecaInterculturalDonEloy();
    const abrirTablon = opciones.abrirTablon !== false;
    const silencioso = opciones.silencioso === true;
    const franja = opciones.franja || this._franjaHorariaDonEloy(new Date());
    const base = [
      ...b.costa,
      ...b.sierra,
      ...b.oriente,
      ...b.saberesEs,
      ...b.manabitas,
    ];
    const nota = this._tomarElementoRotativoDonEloy(base) || {
      titulo: 'Dato comunitario',
      descripcion: 'La plaza sigue activa.',
    };
    const titulo = nota.titulo || nota.tipo || 'Dato comunitario';
    const detalle = nota.descripcion || nota.texto || 'Sin detalle disponible.';
    const region = nota.region || nota.fuente || 'Plaza MELANTIA';
    const mensaje = `Oigan, socios. Noticiero de la plaza: ${titulo}. ${detalle} Fuente comunitaria: ${region}.`;
    this._guardarEstadoDonEloyPlaza({
      ultimoNoticieroEn: new Date().toISOString(),
    });
    this._marcarAgendaDiariaDonEloy(franja);
    if (!silencioso) this.hablarDonEloy(mensaje);
    if (!abrirTablon) return true;
    return this.abrirTablonDonEloy();
  },

  async contarHistoriaDonEloy(opciones = {}) {
    const b = await this._bibliotecaInterculturalDonEloy();
    const silencioso = opciones.silencioso === true;
    const franja = opciones.franja || this._franjaHorariaDonEloy(new Date());
    const relatos = [
      ...b.cuentosAmazonia,
      ...b.cuentosSierra,
      ...b.saberesQu,
      ...b.saberesSh,
      ...b.saberesTs,
    ];
    const historia = this._tomarElementoRotativoDonEloy(relatos) || {
      titulo: 'Cuento de la plaza',
      descripcion: 'Hoy toca cuidar la tierra y el agua.',
    };
    const mensaje = `Hora del cuentacuentos. ${historia.titulo || 'Relato ancestral'}. ${historia.descripcion || 'Sin descripcion.'}`;
    this._guardarEstadoDonEloyPlaza({
      ultimoCuentoEn: new Date().toISOString(),
    });
    this._marcarAgendaDiariaDonEloy(franja);
    if (!silencioso) this.hablarDonEloy(mensaje);
    return true;
  },

  async contarHumorDonEloy() {
    const b = await this._bibliotecaInterculturalDonEloy();
    const chistesBase = [
      {
        texto:
          'Dice un socio: para que pone musica a las vacas? Para que den leche bien animada, pues.',
      },
      {
        texto:
          'Refran de plaza: el que siembra orden, cosecha tranquilidad y buenas ventas.',
      },
    ];
    const dichos = (b.manabitas || [])
      .filter((item) =>
        String(item.tipo || '')
          .toLowerCase()
          .includes('dicho')
      )
      .map((item) => ({ texto: item.texto || item.descripcion || '' }));
    const pieza =
      this._tomarElementoRotativoDonEloy([...dichos, ...chistesBase]) ||
      chistesBase[0];
    const mensaje = `Humor de Don Eloy para alegrar la jornada: ${pieza.texto}`;
    this._guardarEstadoDonEloyPlaza({
      ultimoHumorEn: new Date().toISOString(),
    });
    this.hablarDonEloy(mensaje);
    return true;
  },

  registrarAporteAnonimoDonEloy() {
    const aporte = String(
      window.prompt(
        'Comparta su historia, aviso o saber (se publicara sin nombres).',
        ''
      ) || ''
    ).trim();
    if (!aporte) return false;
    const tipo = String(
      window.prompt(
        'Tipo de aporte: historia, aviso, consejo o chisme sano.',
        'historia'
      ) || 'historia'
    ).trim();
    const plaza = this._estadoDonEloyPlaza();
    const item = {
      id: this._crearIdSalud('plaza'),
      tipo: tipo || 'historia',
      texto: aporte,
      fecha: new Date().toISOString(),
    };
    this._guardarEstadoDonEloyPlaza({
      aportesAnonimos: [item, ...(plaza.aportesAnonimos || [])].slice(0, 80),
    });
    this.hablarDonEloy(
      'Recibido, socio. Su aporte quedo guardado sin nombres para compartir sabiduria popular con respeto.'
    );
    return true;
  },

  contarAporteAnonimoDonEloy() {
    const plaza = this._estadoDonEloyPlaza();
    if (!plaza.aportesAnonimos.length) {
      this.hablarDonEloy(
        'Todavia no tengo aportes anonimos. Si gusta, comparta una historia y la cuento en la plaza sin revelar su nombre.'
      );
      return false;
    }
    const aporte = this._tomarElementoRotativoDonEloy(plaza.aportesAnonimos);
    if (!aporte) return false;
    this.hablarDonEloy(
      `Aporte anonimo de la comunidad: ${aporte.texto}. Gracias por mantener vivo el folklore digital de nuestra gente.`
    );
    return true;
  },

  _normalizarEmergenciaSalud(tipo = '') {
    const t = this._normalizar(tipo);
    if (
      t.includes('culebra') ||
      t.includes('serpiente') ||
      t.includes('mordedura') ||
      t.includes('picadura')
    ) {
      return { clave: 'picaduras', etiqueta: 'Picadura de Culebra' };
    }
    if (t.includes('quemadura')) {
      return { clave: 'quemaduras', etiqueta: 'Quemaduras' };
    }
    if (t.includes('herida') || t.includes('hemorrag')) {
      return { clave: 'heridas', etiqueta: 'Herida Sangrante' };
    }
    if (
      t.includes('choque') ||
      t.includes('electrico') ||
      t.includes('desmayo') ||
      t.includes('presion') ||
      t.includes('mareo')
    ) {
      return { clave: 'desmayos', etiqueta: 'Choque Electrico / Desmayo' };
    }
    if (t.includes('parto')) {
      return { clave: 'parto', etiqueta: 'Parto en Camino' };
    }
    if (
      t.includes('intoxicacion') ||
      t.includes('quimico') ||
      t.includes('agro') ||
      t.includes('veneno')
    ) {
      return {
        clave: 'intoxicacion',
        etiqueta: 'Intoxicacion (Quimicos/Agro)',
      };
    }
    return { clave: 'general', etiqueta: 'Emergencia general' };
  },

  _crearIdSalud(prefix = 'salud') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  },

  _buscarPacienteSaludPorId(pacienteId) {
    const salud = this._estadoSaludPreventiva();
    return salud.pacientes.find((item) => item.id === pacienteId) || null;
  },

  async registrarPacienteSaludPreventiva() {
    const salud = this._estadoSaludPreventiva();
    if (salud.pacientes.length >= salud.capacidadPacientes) {
      this.hablarComo(
        'Paulette',
        'Ya alcanzaste la capacidad de 50 pacientes en este dispositivo.'
      );
      return false;
    }
    const nombre = String(
      window.prompt('Nombre del paciente.', '') || ''
    ).trim();
    if (!nombre) return false;
    const edad = Number(window.prompt('Edad del paciente.', '0') || '0');
    const tipoSangre = String(
      window.prompt('Tipo de sangre.', 'O+') || ''
    ).trim();
    const alergias = String(
      window.prompt(
        'Alergias o medicamentos restringidos.',
        'Sin alergias conocidas'
      ) || ''
    ).trim();
    const historialRapido = String(
      window.prompt(
        'Historial rapido (fiebre, presion alta, desmayo, etc.).',
        'Sin eventos recientes'
      ) || ''
    ).trim();

    const nuevo = {
      id: this._crearIdSalud('paciente'),
      nombre,
      edad: Math.max(0, edad || 0),
      tipoSangre: tipoSangre || 'No registrado',
      alergias: alergias || 'No registrado',
      foto: '',
      historialRapido: historialRapido || 'Sin eventos recientes',
    };
    this._guardarEstadoSaludPreventiva({
      pacientes: [...salud.pacientes, nuevo],
    });
    this.hablarComo(
      'Paulette',
      `Paciente ${nombre} registrado. Ya puede usarse en la ficha de emergencia.`
    );
    return this.abrirAsistentePreventivoSalud();
  },

  _resumenEventoSalud(evento = {}) {
    return [
      `Evento: ${evento.tipoEtiqueta || 'Emergencia general'}`,
      `Hora de atencion: ${new Date(evento.fecha || Date.now()).toLocaleString('es-EC')}`,
      `Acciones aplicadas: ${evento.acciones || 'Sin detalle'}`,
      `Signos observados: ${evento.signos || 'Sin detalle'}`,
      `Traslado: ${evento.traslado || 'En evaluacion'}`,
    ].join('\n');
  },

  _normalizarFormatoFichaSalud(formato = '') {
    const f = this._normalizar(formato);
    return f.includes('comun') ? 'comunitaria' : 'clinica';
  },

  _tituloFormatoFichaSalud(formato = 'clinica') {
    return formato === 'comunitaria'
      ? 'Comunitaria de brigada'
      : 'Clinica para hospital';
  },

  _normalizarPerfilSalud(perfil = '', edad = 0) {
    const p = this._normalizar(perfil);
    if (p.includes('pedi')) return 'pediatrico';
    return Number(edad || 0) <= 12 ? 'pediatrico' : 'general';
  },

  _tituloPerfilSalud(perfil = 'general') {
    return perfil === 'pediatrico' ? 'Pediatrico' : 'General';
  },

  _esEventoSaludUrgente(evento = {}) {
    const salud = this._estadoSaludPreventiva();
    const texto = this._normalizar(
      `${evento.tipoEtiqueta || ''} ${evento.signos || ''} ${evento.traslado || ''}`
    );
    const senales = Array.isArray(salud.alertasCriticas)
      ? salud.alertasCriticas
      : [];
    return senales.some((item) => texto.includes(this._normalizar(item)));
  },

  _dimensionesFormatoFichaSalud(formato = 'clinica') {
    const f = this._normalizarFormatoFichaSalud(formato);
    return f === 'comunitaria'
      ? { width: 1080, height: 1080 }
      : { width: 1200, height: 1700 };
  },

  _svgFichaEmergenciaClinica(payload = {}) {
    const p = payload.paciente || {};
    const e = payload.evento || {};
    const d = payload.directorio || {};
    const token = payload.token || this._crearIdSalud('ficha').toUpperCase();
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1700" viewBox="0 0 1200 1700" role="img" aria-label="Ficha de Emergencia MELANTIA">
  <rect width="1200" height="1700" fill="#f5f9f6"/>
  <rect x="40" y="40" width="1120" height="1620" rx="28" fill="#ffffff" stroke="#cfe2d3" stroke-width="4"/>
  <rect x="40" y="40" width="1120" height="220" rx="28" fill="#b31217"/>
  <text x="90" y="126" font-size="42" font-family="Georgia, 'Times New Roman', serif" fill="#ffffff" font-weight="700">MELANTIA · FICHA DE EMERGENCIA</text>
  <text x="90" y="174" font-size="26" font-family="Georgia, 'Times New Roman', serif" fill="#ffe9ea">Asistente Preventivo de Salud · Documento de traslado</text>
  <text x="90" y="218" font-size="20" font-family="Georgia, 'Times New Roman', serif" fill="#ffe9ea">Token: ${this._escaparHtml(token)} · Fecha: ${this._escaparHtml(new Date(e.fecha || Date.now()).toLocaleString('es-EC'))}</text>

  <rect x="80" y="300" width="1040" height="220" rx="20" fill="#f8fcf9" stroke="#d6e7da"/>
  <text x="110" y="350" font-size="30" font-family="Georgia, 'Times New Roman', serif" fill="#173526" font-weight="700">Paciente</text>
  <text x="110" y="395" font-size="24" font-family="Georgia, 'Times New Roman', serif" fill="#173526">Nombre: ${this._escaparHtml(p.nombre || 'Paciente no registrado')}</text>
  <text x="110" y="432" font-size="24" font-family="Georgia, 'Times New Roman', serif" fill="#173526">Edad: ${this._escaparHtml(String(p.edad || 0))} · Tipo de sangre: ${this._escaparHtml(p.tipoSangre || 'No registrado')}</text>
  <text x="110" y="469" font-size="24" font-family="Georgia, 'Times New Roman', serif" fill="#173526">Alergias: ${this._escaparHtml(p.alergias || 'No registradas')}</text>

  <rect x="80" y="560" width="1040" height="320" rx="20" fill="#fff6f2" stroke="#f0d2c2"/>
  <text x="110" y="610" font-size="30" font-family="Georgia, 'Times New Roman', serif" fill="#7b3419" font-weight="700">Atencion aplicada antes del traslado</text>
  <text x="110" y="655" font-size="24" font-family="Georgia, 'Times New Roman', serif" fill="#5a2f1a">Tipo: ${this._escaparHtml(e.tipoEtiqueta || 'Emergencia general')}</text>
  <text x="110" y="692" font-size="24" font-family="Georgia, 'Times New Roman', serif" fill="#5a2f1a">Signos observados: ${this._escaparHtml(e.signos || 'Sin detalle')}</text>
  <text x="110" y="729" font-size="24" font-family="Georgia, 'Times New Roman', serif" fill="#5a2f1a">Primeros auxilios: ${this._escaparHtml(e.acciones || 'Sin detalle')}</text>
  <text x="110" y="766" font-size="24" font-family="Georgia, 'Times New Roman', serif" fill="#5a2f1a">Estado al traslado: ${this._escaparHtml(e.traslado || 'En evaluacion')}</text>
  <text x="110" y="803" font-size="24" font-family="Georgia, 'Times New Roman', serif" fill="#5a2f1a">Responsable comunitario: ${this._escaparHtml(e.responsable || 'Promotor MELANTIA')}</text>

  <rect x="80" y="920" width="1040" height="220" rx="20" fill="#eff7ff" stroke="#c9dcf7"/>
  <text x="110" y="970" font-size="30" font-family="Georgia, 'Times New Roman', serif" fill="#1f4f80" font-weight="700">Directorio de emergencia local</text>
  <text x="110" y="1015" font-size="24" font-family="Georgia, 'Times New Roman', serif" fill="#1f4f80">Numero principal: ${this._escaparHtml(d.numeroPrincipal || '911')}</text>
  <text x="110" y="1052" font-size="24" font-family="Georgia, 'Times New Roman', serif" fill="#1f4f80">Centro de salud: ${this._escaparHtml(d.centroSalud || 'Centro local')}</text>
  <text x="110" y="1089" font-size="24" font-family="Georgia, 'Times New Roman', serif" fill="#1f4f80">Telefono del centro: ${this._escaparHtml(d.telefonoCentro || 'No registrado')}</text>

  <rect x="80" y="1180" width="1040" height="390" rx="20" fill="#f5fbf5" stroke="#cfe2d3"/>
  <text x="110" y="1230" font-size="30" font-family="Georgia, 'Times New Roman', serif" fill="#1b4f33" font-weight="700">Guia de voz registrada</text>
  <text x="110" y="1280" font-size="23" font-family="Georgia, 'Times New Roman', serif" fill="#214031">Paulette: Respire profundo, mantenga la calma. Siga el protocolo visual y mantenga la presion o estabilizacion segun el caso.</text>
  <text x="110" y="1322" font-size="23" font-family="Georgia, 'Times New Roman', serif" fill="#214031">Don Eloy: Usted sabe que hacer, socio. Ya registramos hora y acciones para que el medico reciba el contexto completo.</text>
  <text x="110" y="1364" font-size="23" font-family="Georgia, 'Times New Roman', serif" fill="#214031">Observaciones previas del paciente: ${this._escaparHtml(p.historialRapido || 'Sin observaciones')}</text>
  <text x="110" y="1406" font-size="23" font-family="Georgia, 'Times New Roman', serif" fill="#214031">Libro de Salud Comunitario: evento guardado en MELANTIA con sello de tiempo.</text>

  <rect x="80" y="1585" width="1040" height="50" rx="12" fill="#173526"/>
  <text x="110" y="1618" font-size="20" font-family="Georgia, 'Times New Roman', serif" fill="#dff0e3">Documento preventivo para apoyo de traslado. No reemplaza criterio medico profesional.</text>
</svg>`;
  },

  _svgFichaEmergenciaComunitaria(payload = {}) {
    const p = payload.paciente || {};
    const e = payload.evento || {};
    const d = payload.directorio || {};
    const token = payload.token || this._crearIdSalud('ficha').toUpperCase();
    const perfil = this._normalizarPerfilSalud(e.perfilAtencion || '', p.edad);
    const esPediatrico = perfil === 'pediatrico';
    const esUrgentePediatrico = esPediatrico && this._esEventoSaludUrgente(e);
    const checklist = esPediatrico
      ? [
          '1. Verificar respiracion y respuesta del nino.',
          '2. Controlar temperatura y evitar hipotermia.',
          '3. No dar medicamentos sin orden medica.',
          '4. Avisar alergias y peso aproximado al medico.',
          '5. Mantener acompanante adulto en el traslado.',
        ]
      : [
          '1. Mantener via respiratoria y observacion continua.',
          '2. No suspender compresion o inmovilizacion aplicada.',
          '3. Entregar esta ficha al llegar al centro de salud.',
          '4. Informar alergias e historial breve al medico.',
          '5. Registrar desenlace en Libro de Salud MELANTIA.',
        ];
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080" role="img" aria-label="Ficha Comunitaria de Emergencia MELANTIA">
  <rect width="1080" height="1080" fill="#f7faf8"/>
  <rect x="30" y="30" width="1020" height="1020" rx="24" fill="#ffffff" stroke="#cedfd2" stroke-width="4"/>
  <rect x="30" y="30" width="1020" height="144" rx="24" fill="#173526"/>
  ${
    esUrgentePediatrico
      ? '<rect x="706" y="44" width="320" height="42" rx="10" fill="#b31217"/><text x="726" y="72" font-size="20" font-family="Georgia, \"Times New Roman\", serif" fill="#ffffff" font-weight="700">URGENTE PEDIATRICO</text>'
      : ''
  }
  <text x="66" y="88" font-size="34" font-family="Georgia, 'Times New Roman', serif" fill="#ffffff" font-weight="700">MELANTIA · FICHA COMUNITARIA</text>
  <text x="66" y="120" font-size="18" font-family="Georgia, 'Times New Roman', serif" fill="#dff0e3">Formato WhatsApp movil · Perfil ${this._escaparHtml(this._tituloPerfilSalud(perfil))}</text>

  <rect x="56" y="196" width="968" height="124" rx="16" fill="#eff8ff" stroke="#c9dcf7"/>
  <text x="76" y="236" font-size="22" font-family="Georgia, 'Times New Roman', serif" fill="#1f4f80" font-weight="700">${this._escaparHtml(p.nombre || 'Paciente no registrado')}</text>
  <text x="76" y="264" font-size="18" font-family="Georgia, 'Times New Roman', serif" fill="#1f4f80">Edad ${this._escaparHtml(String(p.edad || 0))} · Sangre ${this._escaparHtml(p.tipoSangre || 'No registrado')} · Alergias ${this._escaparHtml(p.alergias || 'No registradas')}</text>
  <text x="76" y="292" font-size="16" font-family="Georgia, 'Times New Roman', serif" fill="#1f4f80">Token ${this._escaparHtml(token)} · ${this._escaparHtml(new Date(e.fecha || Date.now()).toLocaleString('es-EC'))}</text>

  <rect x="56" y="340" width="968" height="186" rx="16" fill="#fff5f1" stroke="#efc8b7"/>
  <text x="76" y="378" font-size="22" font-family="Georgia, 'Times New Roman', serif" fill="#7b3419" font-weight="700">Resumen del evento</text>
  <text x="76" y="408" font-size="18" font-family="Georgia, 'Times New Roman', serif" fill="#7b3419">Evento ${this._escaparHtml(e.tipoEtiqueta || 'Emergencia general')} · Estado ${this._escaparHtml(e.traslado || 'En evaluacion')}</text>
  <text x="76" y="436" font-size="17" font-family="Georgia, 'Times New Roman', serif" fill="#7b3419">Signos ${this._escaparHtml(e.signos || 'Sin detalle')}</text>
  <text x="76" y="464" font-size="17" font-family="Georgia, 'Times New Roman', serif" fill="#7b3419">Auxilios ${this._escaparHtml(e.acciones || 'Sin detalle')}</text>
  <text x="76" y="492" font-size="17" font-family="Georgia, 'Times New Roman', serif" fill="#7b3419">Responsable ${this._escaparHtml(e.responsable || 'Promotor MELANTIA')}</text>

  <rect x="56" y="546" width="968" height="108" rx="16" fill="#f5fbf5" stroke="#d3e7d3"/>
  <text x="76" y="584" font-size="22" font-family="Georgia, 'Times New Roman', serif" fill="#1b4f33" font-weight="700">Contactos inmediatos</text>
  <text x="76" y="614" font-size="18" font-family="Georgia, 'Times New Roman', serif" fill="#1b4f33">Emergencias ${this._escaparHtml(d.numeroPrincipal || '911')} · Centro ${this._escaparHtml(d.centroSalud || 'Centro local')} · Tel ${this._escaparHtml(d.telefonoCentro || 'No registrado')}</text>

  <rect x="56" y="674" width="968" height="292" rx="16" fill="#f7f9ff" stroke="#cdd8f5"/>
  <text x="76" y="712" font-size="22" font-family="Georgia, 'Times New Roman', serif" fill="#2a3f85" font-weight="700">Checklist de traslado ${esPediatrico ? 'pediatrico' : 'general'}</text>
  <text x="76" y="742" font-size="17" font-family="Georgia, 'Times New Roman', serif" fill="#2a3f85">${this._escaparHtml(checklist[0])}</text>
  <text x="76" y="770" font-size="17" font-family="Georgia, 'Times New Roman', serif" fill="#2a3f85">${this._escaparHtml(checklist[1])}</text>
  <text x="76" y="798" font-size="17" font-family="Georgia, 'Times New Roman', serif" fill="#2a3f85">${this._escaparHtml(checklist[2])}</text>
  <text x="76" y="826" font-size="17" font-family="Georgia, 'Times New Roman', serif" fill="#2a3f85">${this._escaparHtml(checklist[3])}</text>
  <text x="76" y="854" font-size="17" font-family="Georgia, 'Times New Roman', serif" fill="#2a3f85">${this._escaparHtml(checklist[4])}</text>
  <text x="76" y="892" font-size="16" font-family="Georgia, 'Times New Roman', serif" fill="#2a3f85">Historial previo ${this._escaparHtml(p.historialRapido || 'Sin observaciones')}</text>

  <rect x="56" y="986" width="968" height="38" rx="9" fill="#173526"/>
  <text x="74" y="1011" font-size="14" font-family="Georgia, 'Times New Roman', serif" fill="#dff0e3">Uso comunitario de apoyo. No reemplaza atencion medica profesional.</text>
</svg>`;
  },

  _svgFichaEmergencia(payload = {}, formato = 'clinica') {
    const f = this._normalizarFormatoFichaSalud(formato);
    return f === 'comunitaria'
      ? this._svgFichaEmergenciaComunitaria(payload)
      : this._svgFichaEmergenciaClinica(payload);
  },

  async _svgToPngDataUrl(svgMarkup, width = 1200, height = 1700) {
    const svgData = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(image, 0, 0, width, height);
          resolve(canvas.toDataURL('image/png'));
        } catch (error) {
          reject(error);
        }
      };
      image.onerror = () => reject(new Error('No pude renderizar la ficha.'));
      image.src = svgData;
    });
  },

  _dataUrlAFile(dataUrl, fileName) {
    const [meta, data] = String(dataUrl || '').split(',');
    const mime = (meta.match(/:(.*?);/) || [])[1] || 'image/png';
    const bin = atob(data || '');
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
    return new File([bytes], fileName, { type: mime });
  },

  _eventoSaludPorId(eventoId) {
    const salud = this._estadoSaludPreventiva();
    return salud.libroSalud.find((item) => item.id === eventoId) || null;
  },

  async generarFichaEmergenciaTraslado(opciones = {}) {
    const salud = this._estadoSaludPreventiva();
    if (!salud.pacientes.length) {
      this.hablarComo(
        'Paulette',
        'Primero registre al menos un paciente para generar la ficha de emergencia.'
      );
      return false;
    }
    const listaPacientes = salud.pacientes
      .map((p, i) => `${i + 1}. ${p.nombre}`)
      .join('\n');
    const indiceElegido = Number(
      window.prompt(
        `Seleccione paciente por numero:\n${listaPacientes}`,
        '1'
      ) || '1'
    );
    const paciente =
      salud.pacientes[Math.max(0, indiceElegido - 1)] || salud.pacientes[0];
    const formatoEntrada =
      opciones.formato ||
      window.prompt('Formato de ficha: clinica o comunitaria.', 'clinica') ||
      'clinica';
    const formatoFicha = this._normalizarFormatoFichaSalud(formatoEntrada);
    const perfilEntrada =
      opciones.perfil ||
      (Number(paciente.edad || 0) <= 12
        ? 'pediatrico'
        : window.prompt(
            'Perfil de atencion: general o pediatrico.',
            'general'
          )) ||
      'general';
    const perfilAtencion = this._normalizarPerfilSalud(
      perfilEntrada,
      paciente.edad
    );
    const tipo = String(
      opciones.tipo ||
        window.prompt(
          'Tipo de emergencia: heridas, picaduras, quemaduras, desmayos.',
          'heridas'
        ) ||
        ''
    ).trim();
    const signos = String(
      window.prompt('Signos observados.', 'Dolor y sangrado moderado') || ''
    ).trim();
    const acciones = String(
      window.prompt(
        'Primeros auxilios aplicados por el promotor.',
        'Compresion directa, limpieza superficial y control de tiempo'
      ) || ''
    ).trim();
    const traslado = String(
      window.prompt('Estado al traslado.', 'Paciente consciente y estable') ||
        ''
    ).trim();
    const responsable = String(
      window.prompt(
        'Responsable comunitario que atendio.',
        'Promotor MELANTIA'
      ) || ''
    ).trim();

    const normal = this._normalizarEmergenciaSalud(tipo);
    const evento = {
      id: this._crearIdSalud('evento'),
      fecha: new Date().toISOString(),
      pacienteId: paciente.id,
      tipo: normal.clave,
      tipoEtiqueta: normal.etiqueta,
      signos: signos || 'Sin detalle',
      acciones: acciones || 'Sin detalle',
      traslado: traslado || 'En evaluacion',
      responsable: responsable || 'Promotor MELANTIA',
      formatoFicha,
      perfilAtencion,
    };
    this._guardarEstadoSaludPreventiva({
      libroSalud: [...salud.libroSalud, evento],
    });
    this.hablarComo(
      'Paulette',
      `He guardado este evento en el Libro de Salud de ${paciente.nombre}. Preparare el formato ${this._tituloFormatoFichaSalud(formatoFicha).toLowerCase()} para traslado.`
    );
    return this.verFichaEmergenciaTraslado(evento.id, formatoFicha);
  },

  async _resolverFichaEmergencia(eventoId = '', formatoOverride = '') {
    const salud = this._estadoSaludPreventiva();
    const evento = eventoId
      ? this._eventoSaludPorId(eventoId)
      : salud.libroSalud[salud.libroSalud.length - 1] || null;
    if (!evento) return null;
    const paciente = this._buscarPacienteSaludPorId(evento.pacienteId);
    if (!paciente) return null;
    const formatoFicha = this._normalizarFormatoFichaSalud(
      formatoOverride || evento.formatoFicha || 'clinica'
    );
    const token = `MEL-SALUD-${new Date(evento.fecha).getTime().toString().slice(-6)}`;
    const svg = this._svgFichaEmergencia(
      {
        paciente,
        evento,
        directorio: salud.directorioEmergencia,
        token,
      },
      formatoFicha
    );
    const dimensiones = this._dimensionesFormatoFichaSalud(formatoFicha);
    const pngDataUrl = await this._svgToPngDataUrl(
      svg,
      dimensiones.width,
      dimensiones.height
    );
    return {
      paciente,
      evento,
      token,
      formatoFicha,
      pngDataUrl,
    };
  },

  async verFichaEmergenciaTraslado(eventoId = '', formato = '') {
    const ficha = await this._resolverFichaEmergencia(eventoId, formato);
    if (!ficha) {
      this.hablarComo(
        'Paulette',
        'No encontre una ficha de emergencia para mostrar.'
      );
      return false;
    }
    const cuerpo = `
      <section style="display:grid;gap:10px">
        <article style="background:#fff;border:1px solid #dbe7de;border-radius:16px;padding:12px">
          <strong>Ficha de Emergencia lista para traslado</strong>
          <div style="margin-top:8px">Formato: ${this._escaparHtml(this._tituloFormatoFichaSalud(ficha.formatoFicha))} · Paciente: ${this._escaparHtml(ficha.paciente.nombre)} · Tipo: ${this._escaparHtml(ficha.evento.tipoEtiqueta)} · Hora: ${this._escaparHtml(new Date(ficha.evento.fecha).toLocaleString('es-EC'))}</div>
        </article>
        <article style="background:#fff;border:1px solid #dbe7de;border-radius:16px;padding:12px;display:grid;justify-items:center;gap:8px">
          <img src="${ficha.pngDataUrl}" alt="Ficha de emergencia" style="width:min(100%,420px);border:1px solid #d8e5d9;border-radius:14px" />
          <div style="font-size:12px;color:#4f6f5a">Imagen unica de emergencia para impresion o envio al medico.</div>
        </article>
      </section>
      <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px">
        <button onclick="window.MelantiaAsistente?.descargarFichaEmergenciaTraslado('${ficha.evento.id}','${ficha.formatoFicha}')">Descargar imagen</button>
        <button onclick="window.MelantiaAsistente?.imprimirFichaEmergenciaTraslado('${ficha.evento.id}','${ficha.formatoFicha}')">Imprimir</button>
        <button onclick="window.MelantiaAsistente?.compartirFichaEmergenciaTraslado('${ficha.evento.id}','whatsapp','${ficha.formatoFicha}')">WhatsApp</button>
        <button onclick="window.MelantiaAsistente?.compartirFichaEmergenciaTraslado('${ficha.evento.id}','app','${ficha.formatoFicha}')">Compartir app</button>
        <button onclick="window.MelantiaAsistente?.verFichaEmergenciaTraslado('${ficha.evento.id}','${ficha.formatoFicha === 'clinica' ? 'comunitaria' : 'clinica'}')">Ver ${ficha.formatoFicha === 'clinica' ? 'comunitaria' : 'clinica'}</button>
        <button onclick="window.MelantiaAsistente?.abrirAsistentePreventivoSalud()">Volver a Salud</button>
      </div>`;
    this._abrirPanel(
      'Paulette · Ficha de Emergencia',
      `Documento ${this._tituloFormatoFichaSalud(ficha.formatoFicha).toLowerCase()} para traslado con datos vitales y directorio local.`,
      cuerpo,
      'Paulette'
    );
    this.hablarComo(
      'Don Eloy',
      'Usted sabe que hacer, socio. Lleve esta ficha al medico para que vea de inmediato que se hizo y a que hora.'
    );
    return true;
  },

  async descargarFichaEmergenciaTraslado(eventoId = '', formato = '') {
    const ficha = await this._resolverFichaEmergencia(eventoId, formato);
    if (!ficha) return false;
    const enlace = document.createElement('a');
    enlace.href = ficha.pngDataUrl;
    enlace.download = `ficha_${ficha.formatoFicha}_${ficha.paciente.id}_${Date.now()}.png`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    this.hablarComo(
      'Paulette',
      'Ficha descargada. Ya puede enviarla o imprimirla.'
    );
    return true;
  },

  async imprimirFichaEmergenciaTraslado(eventoId = '', formato = '') {
    const ficha = await this._resolverFichaEmergencia(eventoId, formato);
    if (!ficha) return false;
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Ficha de emergencia</title><style>body{margin:0;padding:20px;background:#f4f7f4;font-family:Georgia,'Times New Roman',serif;display:grid;justify-items:center}img{max-width:100%;height:auto;border:1px solid #d8e5d9;border-radius:12px;background:#fff}.acciones{margin-top:14px;display:flex;gap:8px;flex-wrap:wrap}button{border:none;border-radius:999px;padding:10px 14px;background:#173728;color:#fff;font-weight:700;cursor:pointer}@media print{.acciones{display:none}body{background:#fff;padding:0}}</style></head><body><img src="${ficha.pngDataUrl}" alt="Ficha emergencia"/><div class="acciones"><button onclick="window.print()">Imprimir</button><button onclick="window.close()">Cerrar</button></div></body></html>`;
    return this._abrirVentanaDocumento(html, 'Ficha de emergencia');
  },

  async compartirFichaEmergenciaTraslado(
    eventoId = '',
    canal = 'whatsapp',
    formato = ''
  ) {
    const ficha = await this._resolverFichaEmergencia(eventoId, formato);
    if (!ficha) return false;
    const perfil = this._normalizarPerfilSalud(
      ficha.evento.perfilAtencion,
      ficha.paciente.edad
    );
    const esUrgentePediatrico =
      perfil === 'pediatrico' && this._esEventoSaludUrgente(ficha.evento);
    const resumen = [
      esUrgentePediatrico ? 'ALERTA: URGENTE PEDIATRICO' : '',
      'MELANTIA IA · Ficha de Emergencia',
      `Formato: ${this._tituloFormatoFichaSalud(ficha.formatoFicha)}`,
      `Paciente: ${ficha.paciente.nombre}`,
      `Tipo: ${ficha.evento.tipoEtiqueta}`,
      `Hora: ${new Date(ficha.evento.fecha).toLocaleString('es-EC')}`,
      `Signos: ${ficha.evento.signos}`,
      `Acciones: ${ficha.evento.acciones}`,
      `Estado traslado: ${ficha.evento.traslado}`,
    ]
      .filter(Boolean)
      .join('\n');
    try {
      const file = this._dataUrlAFile(
        ficha.pngDataUrl,
        `ficha_${ficha.formatoFicha}_${ficha.paciente.id}.png`
      );
      if (navigator.share && canal === 'app') {
        await navigator.share({
          title: 'Ficha de Emergencia MELANTIA',
          text: resumen,
          files: [file],
        });
        this.hablarComo(
          'Paulette',
          'Ficha compartida con la app del dispositivo.'
        );
        return true;
      }
      const whatsappURL = `https://wa.me/?text=${encodeURIComponent(resumen)}`;
      window.open(whatsappURL, '_blank', 'noopener');
      this.hablarComo(
        'Paulette',
        'Abri WhatsApp con el resumen. Puede adjuntar la imagen descargada de la ficha en ese chat.'
      );
      return true;
    } catch (error) {
      console.error(
        '[Melantia] No pude compartir la ficha de emergencia:',
        error
      );
      return false;
    }
  },

  _consejoSemanalSalud() {
    const salud = this._estadoSaludPreventiva();
    const parroquia =
      this._estadoComercioLocal().parroquiaActual || 'tu parroquia';
    const consejo = `Socio, Don Eloy me cuenta que esta haciendo mucho calor en ${parroquia}. No olvide hidratarse bien y usar sombrero. Cuidar su salud es su mejor herramienta de trabajo.`;
    this._guardarEstadoSaludPreventiva({
      consejoSemanalEmitidoEn: new Date().toISOString(),
    });
    this.hablarComo('Paulette', consejo);
    return consejo;
  },

  abrirAsistentePreventivoSalud() {
    const salud = this._estadoSaludPreventiva();
    const ultimoEvento = salud.libroSalud[salud.libroSalud.length - 1] || null;
    const directorio = salud.directorioEmergencia || {};
    const alertasCriticas = (salud.alertasCriticas || []).join(', ');
    const cuerpo = `
      <section style="display:grid;gap:10px;background:#101518;border:1px solid #2a3339;border-radius:18px;padding:14px;color:#ffffff">
        <strong style="font-size:20px">Asistente Preventivo de Salud</strong>
        <div style="font-size:13px;opacity:.92">Interfaz de alto contraste para uso bajo estres. Paulette guia la tecnica y Don Eloy refuerza la calma comunitaria.</div>
      </section>
      <section style="display:grid;gap:10px;margin-top:10px">
        <article style="background:#fff8ef;border:1px solid #e6cfb1;border-radius:16px;padding:12px"><strong>Manual de Emergencias Rapidas</strong><div style="margin-top:6px">Use los 6 iconos gigantes para activar protocolos visuales. Paulette hablara automaticamente en cada caso.</div></article>
      </section>
      <section style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:10px">
        <button style="min-height:180px;background:#fff;border:2px solid #dbe7de;border-radius:20px;font-weight:800;font-size:24px;display:grid;gap:8px;align-content:center;justify-items:center;cursor:pointer" onclick="window.MelantiaAsistente?.ejecutarProtocoloEmergenciaRapida('culebra')"><div style="font-size:52px">🐍</div><div>Picadura de Culebra</div></button>
        <button style="min-height:180px;background:#fff;border:2px solid #dbe7de;border-radius:20px;font-weight:800;font-size:24px;display:grid;gap:8px;align-content:center;justify-items:center;cursor:pointer" onclick="window.MelantiaAsistente?.ejecutarProtocoloEmergenciaRapida('quemaduras')"><div style="font-size:52px">🔥</div><div>Quemaduras</div></button>
        <button style="min-height:180px;background:#fff;border:2px solid #dbe7de;border-radius:20px;font-weight:800;font-size:24px;display:grid;gap:8px;align-content:center;justify-items:center;cursor:pointer" onclick="window.MelantiaAsistente?.ejecutarProtocoloEmergenciaRapida('herida_sangrante')"><div style="font-size:52px">🩹</div><div>Herida Sangrante</div></button>
        <button style="min-height:180px;background:#fff;border:2px solid #dbe7de;border-radius:20px;font-weight:800;font-size:24px;display:grid;gap:8px;align-content:center;justify-items:center;cursor:pointer" onclick="window.MelantiaAsistente?.ejecutarProtocoloEmergenciaRapida('choque_desmayo')"><div style="font-size:52px">⚡</div><div>Choque / Desmayo</div></button>
        <button style="min-height:180px;background:#fff;border:2px solid #dbe7de;border-radius:20px;font-weight:800;font-size:24px;display:grid;gap:8px;align-content:center;justify-items:center;cursor:pointer" onclick="window.MelantiaAsistente?.ejecutarProtocoloEmergenciaRapida('parto_camino')"><div style="font-size:52px">🤰</div><div>Parto en Camino</div></button>
        <button style="min-height:180px;background:#fff;border:2px solid #dbe7de;border-radius:20px;font-weight:800;font-size:24px;display:grid;gap:8px;align-content:center;justify-items:center;cursor:pointer" onclick="window.MelantiaAsistente?.ejecutarProtocoloEmergenciaRapida('intoxicacion')"><div style="font-size:52px">🤢</div><div>Intoxicacion</div></button>
      </section>
      <section style="display:grid;gap:10px;margin-top:10px">
        <article style="background:#fff;border:1px solid #dbe7de;border-radius:14px;padding:12px"><strong>Mis pacientes</strong><div style="margin-top:6px">${this._escaparHtml(String(salud.pacientes.length))}/${this._escaparHtml(String(salud.capacidadPacientes))} registrados.</div></article>
        <article style="background:#fff;border:1px solid #dbe7de;border-radius:14px;padding:12px"><strong>Directorio de emergencia</strong><div style="margin-top:6px">Numero principal: ${this._escaparHtml(directorio.numeroPrincipal || '911')} · Centro: ${this._escaparHtml(directorio.centroSalud || 'No registrado')}</div></article>
        <article style="background:#fff;border:1px solid #dbe7de;border-radius:14px;padding:12px"><strong>Alertas criticas configuradas</strong><div style="margin-top:6px">${this._escaparHtml(alertasCriticas || 'Sin configuracion')}</div></article>
        <article style="background:#fff;border:1px solid #dbe7de;border-radius:14px;padding:12px"><strong>Libro de Salud Comunitario</strong><div style="margin-top:6px">Eventos guardados: ${this._escaparHtml(String(salud.libroSalud.length))}. ${ultimoEvento ? `Ultimo: ${this._escaparHtml(this._resumenEventoSalud(ultimoEvento))}` : 'Sin eventos aun.'}</div></article>
      </section>
      <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px">
        <button onclick="window.MelantiaAsistente?.registrarPacienteSaludPreventiva()">Registrar paciente</button>
        <button onclick="window.MelantiaAsistente?.configurarAlertasCriticasSalud()">Configurar alertas criticas</button>
        <button onclick="window.MelantiaAsistente?.abrirEmergenciasRapidasSalud()">Abrir Manual de Emergencias Rapidas</button>
        <button onclick="window.MelantiaAsistente?.generarFichaEmergenciaTraslado({ formato: 'clinica' })">Nueva ficha clinica</button>
        <button onclick="window.MelantiaAsistente?.generarFichaEmergenciaTraslado({ formato: 'comunitaria' })">Nueva ficha comunitaria</button>
        <button onclick="window.MelantiaAsistente?.generarFichaEmergenciaTraslado({ formato: 'comunitaria', perfil: 'pediatrico' })">Nueva ficha pediatrica</button>
        <button onclick="window.MelantiaAsistente?.verFichaEmergenciaTraslado()">Ver ultima ficha</button>
        <button onclick="window.open('tel:${this._escaparHtml(directorio.numeroPrincipal || '911')}','_self')" style="background:#b31217;color:#fff">Llamada de emergencia</button>
        <button onclick="window.MelantiaAsistente?._consejoSemanalSalud()">Consejo semanal</button>
        <button onclick="window.MelantiaAsistente?.abrirComunidadVirtual()">Volver a Comunidad</button>
      </div>`;
    this._abrirPanel(
      'Paulette · Salud Preventiva',
      'Manual visual de emergencia, pacientes comunitarios y ficha unica de traslado para apoyo medico.',
      cuerpo,
      'Paulette'
    );
    this.hablarComo(
      'Paulette',
      'Tranquilo, respire hondo. Soy Paulette y estoy aqui para ayudarle. Use los iconos gigantes y yo le guiare paso a paso.'
    );
    return true;
  },

  _mesClave(fecha = new Date()) {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  },

  _etiquetaMes(fecha = new Date()) {
    return fecha.toLocaleDateString('es-EC', {
      month: 'long',
      year: 'numeric',
    });
  },

  _inicioMes(fecha = new Date()) {
    return new Date(fecha.getFullYear(), fecha.getMonth(), 1);
  },

  _sumarMeses(fecha = new Date(), delta = 0) {
    return new Date(fecha.getFullYear(), fecha.getMonth() + delta, 1);
  },

  _crearIdVentaTienda() {
    return `VTA-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  },

  _ventasTienda(idTienda, estadoFiltro = null) {
    const ventas = this._estadoComercioLocal().ventasRegistradas || [];
    return ventas.filter(
      (venta) =>
        venta.tiendaId === idTienda &&
        (!estadoFiltro || venta.estado === estadoFiltro)
    );
  },

  _resumirTopProductos(ventas = []) {
    const mapa = new Map();
    ventas.forEach((venta) => {
      const clave = venta.producto || 'Producto';
      const previo = mapa.get(clave) || {
        producto: clave,
        cantidad: 0,
        monto: 0,
      };
      previo.cantidad += Number(venta.cantidad || 0);
      previo.monto += Number(venta.monto || 0);
      mapa.set(clave, previo);
    });
    return Array.from(mapa.values()).sort((a, b) => {
      if (b.cantidad !== a.cantidad) return b.cantidad - a.cantidad;
      return b.monto - a.monto;
    });
  },

  _resumirClientesRecurrentes(ventas = []) {
    const mapa = new Map();
    ventas.forEach((venta) => {
      const clave = venta.socio || 'Socio MELANTIA';
      const previo = mapa.get(clave) || {
        socio: clave,
        pedidos: 0,
        monto: 0,
      };
      previo.pedidos += 1;
      previo.monto += Number(venta.monto || 0);
      mapa.set(clave, previo);
    });
    return Array.from(mapa.values()).sort((a, b) => {
      if (b.pedidos !== a.pedidos) return b.pedidos - a.pedidos;
      return b.monto - a.monto;
    });
  },

  _obtenerReporteMensualTienda(idTienda, referencia = new Date()) {
    const comercioLocal = this._estadoComercioLocal();
    const tienda = comercioLocal.tiendasAfiliadas.find(
      (item) => item.id === idTienda
    );
    if (!tienda) return null;

    const mesReporte = this._sumarMeses(referencia, -1);
    const mesPrevio = this._sumarMeses(referencia, -2);
    const claveReporte = this._mesClave(mesReporte);
    const clavePrevia = this._mesClave(mesPrevio);
    const ventas = comercioLocal.ventasRegistradas || [];
    const delMes = ventas.filter(
      (venta) =>
        venta.tiendaId === idTienda &&
        this._mesClave(new Date(venta.fecha)) === claveReporte
    );
    const delMesEntregadas = delMes.filter(
      (venta) => venta.estado === 'ENTREGADA'
    );
    const previoEntregadas = ventas.filter(
      (venta) =>
        venta.tiendaId === idTienda &&
        venta.estado === 'ENTREGADA' &&
        this._mesClave(new Date(venta.fecha)) === clavePrevia
    );

    const pedidosGenerados = delMes.length;
    const entregadas = delMesEntregadas.length;
    const valorEstimado = delMes.reduce(
      (total, venta) => total + Number(venta.monto || 0),
      0
    );
    const ingresosBrutos = delMesEntregadas.reduce(
      (total, venta) => total + Number(venta.monto || 0),
      0
    );
    const ingresosPrevios = previoEntregadas.reduce(
      (total, venta) => total + Number(venta.monto || 0),
      0
    );
    const diferencia = ingresosBrutos - ingresosPrevios;
    const comparativaPorcentaje = ingresosPrevios
      ? (diferencia / ingresosPrevios) * 100
      : ingresosBrutos > 0
        ? 100
        : 0;
    const topProductos = this._resumirTopProductos(
      delMesEntregadas.length ? delMesEntregadas : delMes
    );
    const clientesRecurrentes = this._resumirClientesRecurrentes(
      delMesEntregadas.length ? delMesEntregadas : delMes
    );

    return {
      tienda,
      parroquia:
        comercioLocal.parroquiaActual || tienda.parroquia || 'Sin parroquia',
      periodo: claveReporte,
      etiquetaPeriodo: this._etiquetaMes(mesReporte),
      etiquetaComparativa: this._etiquetaMes(mesPrevio),
      pedidosGenerados,
      entregadas,
      valorEstimado,
      ingresosBrutos,
      ingresosPrevios,
      comparativaPorcentaje,
      diferencia,
      detalle: delMes,
      topProductos,
      clientesRecurrentes,
    };
  },

  _consejoProAngelTienda(reporte) {
    if (!reporte) return '';
    const parroquia = reporte.parroquia || 'la parroquia';
    const top = reporte.topProductos[0]?.producto || '';
    const ahora = new Date();
    const mes = ahora.getMonth();

    if (/urea|fertilizante|potas/i.test(top)) {
      return `Socio, he analizado los movimientos en ${parroquia}. He notado que la demanda fuerte viene por fertilizacion. Le sugiero poner en oferta sus fertilizantes potasicos y reforzar combos con herramientas de poda durante las proximas dos semanas.`;
    }
    if (/vitamina|antiparasitario|sal mineral/i.test(top)) {
      return `Socio, he analizado los movimientos en ${parroquia}. Hay señales claras de mayor manejo sanitario en finca. Este es buen momento para destacar vitaminas, antiparasitarios y sales mineralizadas en la vitrina.`;
    }
    if (mes >= 3 && mes <= 6) {
      return `Socio, he analizado los movimientos en ${parroquia}. He notado que muchos productores estan entrando a siembra y mantenimiento de cacao este mes. Le sugiero poner en oferta fertilizantes potasicos o herramientas de poda durante las proximas dos semanas.`;
    }
    return `Socio, he analizado los movimientos en ${parroquia}. El producto que mas rotacion le genera es ${top || 'su vitrina principal'}. Conviene destacarlo arriba del catalogo y ofrecer un descuento corto para clientes recurrentes.`;
  },

  _textoReporteMensualTienda(reporte) {
    if (!reporte) return '';
    const comparativaTexto = reporte.ingresosPrevios
      ? `${reporte.comparativaPorcentaje >= 0 ? 'subio' : 'bajo'} ${Math.abs(reporte.comparativaPorcentaje).toFixed(1)}% frente a ${reporte.etiquetaComparativa}`
      : 'no tiene mes previo para comparar';
    return [
      'MELANTIA IA · Reporte Mensual de Ventas',
      `Tienda: ${reporte.tienda.nombre}`,
      `Periodo: ${reporte.etiquetaPeriodo}`,
      `Pedidos generados: ${reporte.pedidosGenerados}`,
      `Ventas entregadas: ${reporte.entregadas}`,
      `Valor estimado movido: ${this._dinero(reporte.valorEstimado)}`,
      `Ingresos brutos confirmados: ${this._dinero(reporte.ingresosBrutos)}`,
      `Comparativa: ${comparativaTexto}`,
      `Top producto: ${reporte.topProductos[0]?.producto || 'Sin datos'}`,
      `Cliente recurrente: ${reporte.clientesRecurrentes[0]?.socio || 'Sin datos'}`,
      `Consejo Pro de Angel: ${this._consejoProAngelTienda(reporte)}`,
    ].join('\n');
  },

  _htmlReporteMensualTienda(reporte) {
    const detalle = (reporte?.detalle || [])
      .map(
        (venta) =>
          `<tr><td>${this._escaparHtml(new Date(venta.fecha).toLocaleDateString('es-EC'))}</td><td>${this._escaparHtml(venta.socio || 'Socio MELANTIA')}</td><td>${this._escaparHtml(venta.producto || 'Producto')}</td><td>${this._escaparHtml(String(venta.cantidad || 0))}</td><td>${this._dinero(venta.monto || 0)}</td><td>${this._escaparHtml(venta.estado || 'PENDIENTE')}</td></tr>`
      )
      .join('');
    const topProductos = (reporte?.topProductos || [])
      .slice(0, 3)
      .map(
        (item) =>
          `<p class="linea"><strong>${this._escaparHtml(item.producto)}:</strong> ${this._escaparHtml(String(item.cantidad))} unidades · ${this._dinero(item.monto)}</p>`
      )
      .join('');
    const clientes = (reporte?.clientesRecurrentes || [])
      .slice(0, 3)
      .map(
        (item) =>
          `<p class="linea"><strong>${this._escaparHtml(item.socio)}:</strong> ${this._escaparHtml(String(item.pedidos))} pedido(s) · ${this._dinero(item.monto)}</p>`
      )
      .join('');
    const comparativaTexto = reporte.ingresosPrevios
      ? `${reporte.comparativaPorcentaje >= 0 ? 'Este mes vendio' : 'Este mes retrocedio'} ${Math.abs(reporte.comparativaPorcentaje).toFixed(1)}% frente a ${this._escaparHtml(reporte.etiquetaComparativa)}.`
      : 'Todavia no hay un mes previo con ventas entregadas para comparar.';
    return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Reporte mensual de ventas</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: Georgia, 'Times New Roman', serif; background:#eef4ee; color:#173526; }
    .sheet { max-width: 980px; margin: 24px auto; background:#fff; border:1px solid #d6e6d9; border-radius:24px; overflow:hidden; box-shadow:0 18px 60px rgba(17,58,35,.10); }
    .hero { padding:28px 32px; background:linear-gradient(135deg,#1f8f4e 0%,#2e6d46 100%); color:#fff; }
    .eyebrow { font-size:12px; letter-spacing:.18em; text-transform:uppercase; opacity:.9; }
    h1 { margin:10px 0 6px; font-size:30px; line-height:1.08; }
    .hero p { margin:0; max-width:760px; color:rgba(255,255,255,.9); }
    .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:14px; padding:24px 32px; }
    .card { border:1px solid #dce8de; border-radius:18px; padding:16px; background:#fbfdfb; }
    .card h2 { margin:0 0 10px; font-size:16px; color:#1b4f33; }
    .linea { margin:0 0 8px; font-size:14px; line-height:1.45; }
    .tabla-wrap { padding:0 32px 24px; overflow:auto; }
    table { width:100%; border-collapse:collapse; background:#fff; border:1px solid #dce8de; border-radius:16px; overflow:hidden; }
    th, td { padding:12px 10px; border-bottom:1px solid #e2ebe4; text-align:left; font-size:13px; }
    th { background:#f4f8f5; color:#1f4c33; }
    .acciones { display:flex; gap:10px; flex-wrap:wrap; padding:0 32px 28px; }
    button { border:none; border-radius:999px; padding:12px 18px; cursor:pointer; font-weight:700; background:#1f8f4e; color:#fff; }
    button.sec { background:#ecf4ed; color:#1c4a31; border:1px solid #cfe2d2; }
    .pie { padding:0 32px 28px; font-size:12px; color:#4f6f5a; }
    @media print {
      body { background:#fff; }
      .sheet { margin:0; max-width:none; border:none; border-radius:0; box-shadow:none; }
      .acciones { display:none; }
    }
  </style>
</head>
<body>
  <main class="sheet">
    <section class="hero">
      <div class="eyebrow">Libro de Ventas Digital Melantia</div>
      <h1>Reporte mensual de ${this._escaparHtml(reporte.tienda.nombre)}</h1>
      <p>Socio ${this._escaparHtml(reporte.tienda.propietario || 'afiliado')}, este mes Melantia le generó ${this._escaparHtml(String(reporte.pedidosGenerados))} pedido(s) con un valor estimado de ${this._dinero(reporte.valorEstimado)}.</p>
    </section>
    <section class="grid">
      <article class="card">
        <h2>Resumen ejecutivo</h2>
        <p class="linea"><strong>Periodo:</strong> ${this._escaparHtml(reporte.etiquetaPeriodo)}</p>
        <p class="linea"><strong>Pedidos generados:</strong> ${this._escaparHtml(String(reporte.pedidosGenerados))}</p>
        <p class="linea"><strong>Ventas entregadas:</strong> ${this._escaparHtml(String(reporte.entregadas))}</p>
        <p class="linea"><strong>Valor estimado:</strong> ${this._dinero(reporte.valorEstimado)}</p>
      </article>
      <article class="card">
        <h2>Ingresos</h2>
        <p class="linea"><strong>Ingresos brutos confirmados:</strong> ${this._dinero(reporte.ingresosBrutos)}</p>
        <p class="linea"><strong>Comparativa:</strong> ${this._escaparHtml(comparativaTexto)}</p>
      </article>
      <article class="card">
        <h2>Productos mas vendidos</h2>
        ${topProductos || '<p class="linea">Sin datos todavia.</p>'}
      </article>
      <article class="card">
        <h2>Clientes recurrentes</h2>
        ${clientes || '<p class="linea">Sin datos todavia.</p>'}
      </article>
      <article class="card" style="grid-column:1/-1">
        <h2>Consejo Pro de Angel</h2>
        <p class="linea">${this._escaparHtml(this._consejoProAngelTienda(reporte))}</p>
      </article>
    </section>
    <div class="tabla-wrap">
      <table>
        <thead>
          <tr><th>Fecha</th><th>Socio</th><th>Producto</th><th>Cantidad</th><th>Monto</th><th>Estado</th></tr>
        </thead>
        <tbody>
          ${detalle || '<tr><td colspan="6">Sin movimientos en este periodo.</td></tr>'}
        </tbody>
      </table>
    </div>
    <div class="acciones">
      <button onclick="window.print()">Imprimir / PDF</button>
      <button class="sec" onclick="window.close()">Cerrar</button>
    </div>
    <p class="pie">Don Eloy: Cuentas claras, amistades largas. Melantia deja ordenadito lo que trabajó su vitrina este mes.</p>
  </main>
</body>
</html>`;
  },

  verReporteMensualTienda(idTienda) {
    const reporte = this._obtenerReporteMensualTienda(idTienda);
    if (!reporte) return false;
    this._marcarCorteMensualComercio(reporte.periodo);
    return this._abrirVentanaDocumento(
      this._htmlReporteMensualTienda(reporte),
      `Reporte mensual ${reporte.tienda.nombre}`
    );
  },

  descargarExcelTiendaAfiliada(idTienda) {
    const reporte = this._obtenerReporteMensualTienda(idTienda);
    if (!reporte) return false;
    const encabezado = [
      'Fecha',
      'Socio',
      'Producto',
      'Cantidad',
      'Monto',
      'Estado',
    ];
    const filas = reporte.detalle.map((venta) => [
      new Date(venta.fecha).toLocaleDateString('es-EC'),
      venta.socio || 'Socio MELANTIA',
      venta.producto || 'Producto',
      String(venta.cantidad || 0),
      String(Number(venta.monto || 0).toFixed(2)),
      venta.estado || 'PENDIENTE',
    ]);
    const csv = [encabezado, ...filas]
      .map((fila) =>
        fila.map((valor) => `"${String(valor).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `reporte_tienda_${idTienda}_${reporte.periodo}.csv`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
    this.hablarComo(
      'Angel',
      'Excel listo. Ya puede abrir el registro mensual en hoja de calculo.'
    );
    return true;
  },

  async compartirReporteMensualTienda(idTienda, canal = 'whatsapp') {
    const reporte = this._obtenerReporteMensualTienda(idTienda);
    if (!reporte) return false;
    const resumen = this._textoReporteMensualTienda(reporte);
    this._marcarCorteMensualComercio(reporte.periodo);
    try {
      if (canal === 'app' && navigator.share) {
        await navigator.share({
          title: `Reporte mensual ${reporte.tienda.nombre}`,
          text: resumen,
        });
        this.hablarComo(
          'Angel',
          'Reporte mensual listo para compartirse desde la app.'
        );
        return true;
      }
      const whatsappURL = `https://wa.me/?text=${encodeURIComponent(resumen)}`;
      window.open(whatsappURL, '_blank', 'noopener');
      this.hablarComo(
        'Angel',
        'Abri WhatsApp con el resumen mensual del tendero.'
      );
      return true;
    } catch (error) {
      console.error('[Melantia] No pude compartir el reporte mensual:', error);
      return false;
    }
  },

  _marcarCorteMensualComercio(periodo) {
    const estado = this._estadoComunidad();
    estado.comercioLocal = {
      ...(estado.comercioLocal || {}),
      ultimoCorteMensual:
        periodo || this._mesClave(this._sumarMeses(new Date(), -1)),
    };
    this._guardarEstadoComunidad(estado);
    return true;
  },

  abrirPanelTendero(idTienda) {
    const comercioLocal = this._estadoComercioLocal();
    const tienda = comercioLocal.tiendasAfiliadas.find(
      (item) => item.id === idTienda
    );
    if (!tienda) return false;
    const pendientes = this._ventasTienda(idTienda, 'PENDIENTE_ENTREGA');
    const resumenMesActual = (() => {
      const mesActual = this._mesClave(new Date());
      const ventasMes = (comercioLocal.ventasRegistradas || []).filter(
        (venta) =>
          venta.tiendaId === idTienda &&
          this._mesClave(new Date(venta.fecha)) === mesActual
      );
      const entregadas = ventasMes.filter(
        (venta) => venta.estado === 'ENTREGADA'
      );
      return {
        pedidos: ventasMes.length,
        ingresos: entregadas.reduce(
          (total, venta) => total + Number(venta.monto || 0),
          0
        ),
        top: this._resumirTopProductos(
          entregadas.length ? entregadas : ventasMes
        )[0],
      };
    })();
    const reporte = this._obtenerReporteMensualTienda(idTienda);
    const listaPendientes = pendientes.length
      ? pendientes
          .map(
            (venta) =>
              `<article style="background:#fff;border:1px solid #dbe7de;border-radius:14px;padding:12px;display:grid;gap:6px"><strong>${this._escaparHtml(venta.producto)}</strong><div style="font-size:13px;color:#4f6f5a">${this._escaparHtml(venta.socio || 'Socio MELANTIA')} · ${this._escaparHtml(String(venta.cantidad || 0))} unidad(es) · ${this._dinero(venta.monto || 0)}</div><div style="font-size:12px;color:#5f6e65">Pedido generado: ${this._escaparHtml(new Date(venta.fecha).toLocaleString('es-EC'))}</div><div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px"><button onclick="window.MelantiaAsistente?.marcarVentaCompletadaTienda('${idTienda}','${venta.id}')">Venta completada</button></div></article>`
          )
          .join('')
      : '<div style="background:#fff;border:1px dashed #dbe7de;border-radius:14px;padding:12px;color:#4f6f5a">No hay ventas pendientes por marcar como entregadas.</div>';
    const cuerpo = `
      <section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">
        <article style="background:#fff9ef;border:1px solid #ead4aa;border-radius:16px;padding:14px"><strong>${this._escaparHtml(tienda.nombre)}</strong><div style="margin-top:6px">Plan tendero: ${this._dinero(25)} al mes · 2 meses gratis. Capacidad activa: ${this._escaparHtml(String(tienda.inventarioPublicado))}/${this._escaparHtml(String(tienda.capacidadMaximaProductos))} productos.</div></article>
        <article style="background:#f5fbf5;border:1px solid #d3e7d3;border-radius:16px;padding:14px"><strong>Libro de ventas digital</strong><div style="margin-top:6px">Pedidos del mes: ${this._escaparHtml(String(resumenMesActual.pedidos))}. Ingreso oficial entregado: ${this._dinero(resumenMesActual.ingresos)}.</div></article>
        <article style="background:#eef7ff;border:1px solid #c9dcf7;border-radius:16px;padding:14px"><strong>Producto fuerte</strong><div style="margin-top:6px">${this._escaparHtml(resumenMesActual.top?.producto || 'Sin suficiente data todavia')}</div></article>
      </section>
      <section style="display:grid;gap:10px;margin-top:10px">
        <article style="background:#fff;border:1px solid #dbe7de;border-radius:16px;padding:14px"><strong>Ventas pendientes de entrega</strong><div style="margin-top:8px;display:grid;gap:8px">${listaPendientes}</div></article>
      </section>
      <section style="display:grid;gap:10px;margin-top:10px">
        <article style="background:#ffffff;border:1px solid #d1ead7;border-radius:16px;padding:14px"><strong>Reporte mensual listo</strong><div style="margin-top:6px">Socio ${this._escaparHtml(tienda.propietario || 'afiliado')}, este mes Melantia le generó ${this._escaparHtml(String(reporte?.pedidosGenerados || 0))} pedido(s) con valor estimado de ${this._dinero(reporte?.valorEstimado || 0)}.</div><div style="margin-top:8px;font-size:12px;color:#4f6f5a">Consejo Pro de Angel: ${this._escaparHtml(this._consejoProAngelTienda(reporte))}</div></article>
      </section>
      <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px">
        <button onclick="window.MelantiaAsistente?.verReporteMensualTienda('${idTienda}')">Ver reporte mensual</button>
        <button onclick="window.MelantiaAsistente?.compartirReporteMensualTienda('${idTienda}','whatsapp')">WhatsApp reporte</button>
        <button onclick="window.MelantiaAsistente?.compartirReporteMensualTienda('${idTienda}','app')">Compartir app</button>
        <button onclick="window.MelantiaAsistente?.descargarExcelTiendaAfiliada('${idTienda}')">Excel</button>
        <button onclick="window.MelantiaAsistente?.abrirTiendaMelantia()">Volver a Tienda</button>
      </div>`;
    this._abrirPanel(
      `Angel · Panel del Tendero`,
      'Control simple para marcar entregas, revisar el libro de ventas y recibir el reporte mensual del almacen.',
      cuerpo,
      'Angel'
    );
    this.hablarDonEloy(
      'Buenas noticias, vecino. Aqui le traigo las cuentas claras de lo que Melantia trabajo por usted este mes. Ya no tiene que andar con cuadernos viejos porque aqui le llevo el orden del negocio.'
    );
    return true;
  },

  marcarVentaCompletadaTienda(idTienda, ventaId) {
    const estado = this._estadoComunidad();
    const ventas = Array.isArray(estado.comercioLocal?.ventasRegistradas)
      ? [...estado.comercioLocal.ventasRegistradas]
      : [];
    const indice = ventas.findIndex(
      (venta) => venta.id === ventaId && venta.tiendaId === idTienda
    );
    if (indice < 0) return false;
    ventas[indice] = {
      ...ventas[indice],
      estado: 'ENTREGADA',
      entregadoEn: new Date().toISOString(),
    };
    estado.comercioLocal = {
      ...(estado.comercioLocal || {}),
      ventasRegistradas: ventas,
      pedidoDirecto:
        estado.comercioLocal?.pedidoDirecto?.id === ventaId
          ? {}
          : estado.comercioLocal?.pedidoDirecto || {},
    };
    this._guardarEstadoComunidad(estado);
    this.hablarComo(
      'Angel',
      'Venta marcada como entregada. Ya la sumé oficialmente al registro mensual del almacén.'
    );
    return this.abrirPanelTendero(idTienda);
  },

  _filtrarOfertaLocalPorParroquia(items = [], parroquia = '') {
    const destino = this._normalizar(parroquia || '');
    const filtrados = items.filter(
      (item) => this._normalizar(item.parroquia || '') === destino
    );
    return filtrados.length ? filtrados : items.slice(0, 3);
  },

  async calibrarGeocercaComercial() {
    const estado = this._estadoComunidad();
    const local = this._estadoComercioLocal();
    const sello = await this._obtenerSelloGeoTemporalInterno();
    const parroquia = String(
      window.prompt(
        'Parroquia o zona principal para filtrar almacenes y tecnicos.',
        local.parroquiaActual || 'El Carmen'
      ) || ''
    ).trim();
    if (!parroquia) return false;
    const referencia = String(
      window.prompt(
        'Referencia corta de tu ubicacion guardada.',
        local.referencia || 'Zona rural cercana a la finca'
      ) || ''
    ).trim();

    estado.comercioLocal = {
      ...(estado.comercioLocal || {}),
      parroquiaActual: parroquia,
      referencia: referencia || local.referencia,
      ultimaCalibracion: new Date().toISOString(),
      ultimoGPS: sello.gpsDisponible
        ? {
            latitud: sello.latitud,
            longitud: sello.longitud,
            precisionMetros: sello.precisionMetros,
          }
        : local.ultimoGPS || null,
    };
    this._guardarEstadoComunidad(estado);
    this.hablarComo(
      'Angel',
      `Geocerca comercial guardada para ${parroquia}. A partir de ahora priorizare almacenes y tecnicos de esa parroquia.`
    );
    return this.abrirTiendaMelantia();
  },

  confirmarPagoTiendaAfiliada(idTienda) {
    const comercioLocal = this._estadoComercioLocal();
    const tienda = comercioLocal.tiendasAfiliadas.find(
      (item) => item.id === idTienda
    );
    if (!tienda) return false;

    const sugerido = tienda.productos[0] || { nombre: 'producto', precio: 0 };
    const producto = String(
      window.prompt(
        `Producto a pedir en ${tienda.nombre}.`,
        sugerido.nombre || 'producto'
      ) || ''
    ).trim();
    if (!producto) return false;
    const socio = String(
      window.prompt('Nombre del socio comprador.', 'Socio MELANTIA') || ''
    ).trim();
    const cantidad = Number(window.prompt('Cantidad requerida.', '1') || '1');
    const productoBase =
      tienda.productos.find(
        (item) => this._normalizar(item.nombre) === this._normalizar(producto)
      ) || sugerido;
    const total = Number(productoBase.precio || 0) * Math.max(1, cantidad || 1);

    const estado = this._estadoComunidad();
    const ventaId = this._crearIdVentaTienda();
    const fecha = new Date().toISOString();
    const registroVenta = {
      id: ventaId,
      fecha,
      socio: socio || 'Socio MELANTIA',
      producto,
      cantidad: Math.max(1, cantidad || 1),
      monto: total,
      estado: 'PENDIENTE_ENTREGA',
      tiendaId: tienda.id,
      tiendaNombre: tienda.nombre,
      parroquia: comercioLocal.parroquiaActual || tienda.parroquia,
      canal: 'WHATSAPP',
      propietario: tienda.propietario,
    };
    const ventasRegistradas = Array.isArray(
      estado.comercioLocal?.ventasRegistradas
    )
      ? [...estado.comercioLocal.ventasRegistradas, registroVenta]
      : [registroVenta];
    estado.comercioLocal = {
      ...(estado.comercioLocal || {}),
      pedidoDirecto: {
        id: ventaId,
        tiendaId: tienda.id,
        tiendaNombre: tienda.nombre,
        socio: socio || 'Socio MELANTIA',
        producto,
        cantidad: Math.max(1, cantidad || 1),
        total,
        confirmadoEn: fecha,
      },
      ventasRegistradas,
    };
    this._guardarEstadoComunidad(estado);

    const mensaje = [
      'Pago realizado desde MELANTIA.',
      `Almacen: ${tienda.nombre}.`,
      `Socio: ${socio || 'Socio MELANTIA'}.`,
      `Producto: ${producto}.`,
      `Cantidad: ${Math.max(1, cantidad || 1)}.`,
      `Total reportado: ${this._dinero(total)}.`,
      'Por favor coordinen entrega o retiro del pedido.',
    ].join(' ');
    const whatsappURL = `https://wa.me/${String(tienda.whatsapp || '').replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`;
    window.open(whatsappURL, '_blank', 'noopener');
    this.hablarDonEloy(
      `Listo, socio. Ya puede transferir directo a ${tienda.nombre} en ${tienda.banco} y seguir por WhatsApp para que le tengan el pedido listo.`
    );
    return this.abrirPanelTendero(idTienda);
  },

  agendarVisitaTecnicaLocal(idTecnico) {
    const comercioLocal = this._estadoComercioLocal();
    const tecnico = comercioLocal.tecnicosCampo.find(
      (item) => item.id === idTecnico
    );
    if (!tecnico) return false;

    const motivo = String(
      window.prompt(
        `Motivo de la visita para ${tecnico.nombre}.`,
        tecnico.perfil.includes('veterinario')
          ? 'Revision sanitaria del hato'
          : 'Diagnostico de cultivo y plan de nutricion'
      ) || ''
    ).trim();
    if (!motivo) return false;

    const mensaje = [
      `Hola ${tecnico.nombre}, vi tu perfil en MELANTIA.`,
      `Estoy en ${comercioLocal.parroquiaActual}.`,
      `Necesito: ${motivo}.`,
      `Referencia: ${comercioLocal.referencia}.`,
      'Quiero agendar una visita presencial a la finca.',
    ].join(' ');
    const whatsappURL = `https://wa.me/${String(tecnico.whatsapp || '').replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`;
    window.open(whatsappURL, '_blank', 'noopener');
    this.hablarComo(
      'Angel',
      `Abri el canal directo con ${tecnico.nombre}. Ya puede revisar su curriculum y cerrar la visita tecnica.`
    );
    return true;
  },

  _generarCodigoEntregaTienda(tienda = {}) {
    const base = `${tienda.categoria || 'tienda'}-${tienda.producto || 'producto'}-${tienda.cantidad || 1}`;
    const limpio = this._normalizar(base)
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 18)
      .toUpperCase();
    return `MEL-${limpio}-${String(Date.now()).slice(-4)}`;
  },

  _resolverComisionTienda(tienda = {}) {
    const categoria = this._normalizar(tienda.categoria || 'ganado');
    const cantidad = Number(tienda.cantidad || 0);
    const valorCierre = Number(tienda.valorCierre || 0);
    const esAfiliado = Boolean(tienda.esAfiliado);
    let porcentaje = 5;
    let regla = 'Intermediacion estandar MELANTIA';

    if (categoria === 'maquinaria') {
      porcentaje = 5;
      regla =
        'Maquinaria e insumos con custodia y verificacion de funcionamiento';
    } else if (categoria === 'ganado') {
      if (esAfiliado && cantidad <= 1) {
        porcentaje = 0;
        regla = 'Venta pequena entre afiliados sin cobro MELANTIA';
      } else if (cantidad >= 10) {
        porcentaje = 3;
        regla = 'Movimiento masivo incentivado';
      } else {
        porcentaje = 5;
        regla = 'Semovientes con custodia, sanidad y trazabilidad';
      }
    } else if (categoria === 'cosechas') {
      if (esAfiliado && (cantidad <= 5 || valorCierre <= 500)) {
        porcentaje = 0;
        regla = 'Producto pequeno de afiliado sin cobro MELANTIA';
      } else if (cantidad >= 10 || valorCierre >= 5000) {
        porcentaje = 3;
        regla = 'Venta agricola masiva con incentivo de volumen';
      } else {
        porcentaje = 0;
        regla = 'Venta directa pequena con respaldo MELANTIA';
      }
    }

    const comision = (valorCierre * porcentaje) / 100;
    const netoVendedor = valorCierre - comision;
    return {
      porcentaje,
      comision,
      netoVendedor,
      regla,
    };
  },

  _cerrarEscanerTienda() {
    const activo = this._scannerTiendaActivo;
    if (!activo) return;
    activo.activo = false;
    if (activo.frameId) {
      window.cancelAnimationFrame(activo.frameId);
    }
    (activo.stream?.getTracks?.() || []).forEach((track) => track.stop());
    if (activo.overlay?.parentNode) {
      activo.overlay.parentNode.removeChild(activo.overlay);
    }
    this._scannerTiendaActivo = null;
  },

  _confirmarCodigoEntregaTienda(codigoIngresado, origen = 'manual') {
    const codigo = String(codigoIngresado || '').trim();
    if (!codigo) return false;

    const estado = this._estadoComunidad();
    const tienda = { ...(estado.tienda || {}) };
    if (codigo !== String(tienda.qrEntregaCodigo || '')) {
      this.hablarDonEloy(
        'Ese codigo no coincide con la guia de entrega. Revise al transportista antes de soltar la plata.'
      );
      return false;
    }

    tienda.qrEntregaConfirmado = true;
    tienda.depositoEstado = 'ENTREGA_CONFIRMADA';
    tienda.confirmadoPor = origen;
    tienda.confirmadoEn = new Date().toISOString();
    estado.tienda = tienda;
    this._guardarEstadoComunidad(estado);

    if (this._normalizar(tienda.categoria) === 'ganado') {
      this.hablarDonEloy(
        'Socio, ya me avisaron que las vacas llegaron al corral. Reviselas bien, cuentelas y como ya confirmo el QR, procedere con la luz verde para liquidar al vendedor.'
      );
    } else {
      this.hablarComo(
        'Angel',
        origen === 'camara'
          ? 'Entrega verificada con camara. El flujo queda listo para liquidacion segun la categoria y la comision aplicable.'
          : 'Entrega verificada por QR. El flujo queda listo para liquidacion segun la categoria y la comision aplicable.'
      );
    }
    return this.abrirTiendaMelantia();
  },

  activarCustodiaTienda(categoria = 'ganado') {
    const estado = this._estadoComunidad();
    const tiendaActual = { ...(estado.tienda || {}) };
    const cantidad = Number(
      window.prompt(
        'Cantidad o volumen del negocio en Tienda Melantia.',
        String(tiendaActual.cantidad || (categoria === 'ganado' ? 10 : 1))
      ) ||
        tiendaActual.cantidad ||
        1
    );
    const valorCierre = Number(
      window.prompt(
        'Valor total del negocio en USD.',
        String(tiendaActual.valorCierre || 12000)
      ) ||
        tiendaActual.valorCierre ||
        0
    );
    const producto =
      String(
        window.prompt(
          'Nombre del producto o lote.',
          tiendaActual.producto ||
            (categoria === 'ganado'
              ? 'Lote de terneros de engorde'
              : categoria === 'maquinaria'
                ? 'Tractor usado'
                : 'Reserva de quintales de papa')
        ) || ''
      ).trim() || tiendaActual.producto;
    const tienda = {
      ...tiendaActual,
      categoria,
      cantidad,
      valorCierre,
      producto,
      depositoEstado: 'DINERO_EN_CUSTODIA',
      qrEntregaConfirmado: false,
      qrEntregaCodigo: this._generarCodigoEntregaTienda({
        categoria,
        cantidad,
        producto,
      }),
      certificadoSanitario:
        categoria === 'ganado' ? 'RECIBIDO' : tiendaActual.certificadoSanitario,
      videoFuncionamiento:
        categoria === 'maquinaria'
          ? 'RECIBIDO'
          : tiendaActual.videoFuncionamiento,
      modalidadCosecha:
        categoria === 'cosechas'
          ? tiendaActual.modalidadCosecha || 'futuro'
          : tiendaActual.modalidadCosecha,
    };
    estado.tienda = tienda;
    this._guardarEstadoComunidad(estado);
    this.hablarComo(
      'Angel',
      'Dinero en custodia confirmado. Vendedor, ya puede preparar el despacho mientras Melantia espera la confirmacion con QR de entrega.'
    );
    return this.abrirTiendaMelantia();
  },

  confirmarEntregaTiendaPorQr() {
    const codigoIngresado = String(
      window.prompt(
        'Escanea o escribe el codigo QR/token de entrega.',
        this._estadoTiendaMelantia().qrEntregaCodigo || ''
      ) || ''
    ).trim();
    return this._confirmarCodigoEntregaTienda(codigoIngresado, 'manual');
  },

  async escanearEntregaTiendaConCamara() {
    const tienda = this._estadoTiendaMelantia();
    if (!tienda.qrEntregaCodigo) {
      this.hablarComo(
        'Angel',
        'Primero activa la custodia para generar el QR de entrega.'
      );
      return false;
    }

    const soporteCamara = Boolean(
      navigator.mediaDevices?.getUserMedia && window.BarcodeDetector
    );
    const contextoSeguro =
      window.isSecureContext ||
      /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname || '');

    if (!soporteCamara || !contextoSeguro) {
      this.hablarComo(
        'Angel',
        'El lector QR por camara necesita navegador compatible y contexto seguro. Abrire el respaldo manual para no detener el negocio.'
      );
      return this.confirmarEntregaTiendaPorQr();
    }

    if (typeof window.BarcodeDetector.getSupportedFormats === 'function') {
      try {
        const formatos = await window.BarcodeDetector.getSupportedFormats();
        if (!formatos.includes('qr_code')) {
          this.hablarComo(
            'Angel',
            'Este dispositivo no expone lectura QR nativa. Continuare con validacion manual.'
          );
          return this.confirmarEntregaTiendaPorQr();
        }
      } catch (error) {
        console.warn(
          '[Melantia] No pude consultar formatos de BarcodeDetector:',
          error
        );
      }
    }

    this._cerrarEscanerTienda();
    const overlay = document.createElement('div');
    overlay.innerHTML = `
      <div style="position:fixed;inset:0;background:rgba(8,24,15,.72);z-index:9999;display:grid;place-items:center;padding:16px">
        <div style="width:min(440px,100%);background:#fcfffc;border:1px solid #cfe2d2;border-radius:24px;box-shadow:0 20px 60px rgba(0,0,0,.28);overflow:hidden">
          <div style="padding:16px 18px;background:linear-gradient(135deg,#1f8f4e 0%,#2d6e46 100%);color:#fff">
            <strong style="font-size:18px">Escaner QR de entrega</strong>
            <div style="margin-top:6px;font-size:12px;opacity:.92">Apunta la camara al QR del vendedor o transportista.</div>
          </div>
          <div style="padding:14px;display:grid;gap:12px">
            <video autoplay playsinline muted style="width:100%;min-height:240px;background:#102118;border-radius:18px;object-fit:cover"></video>
            <div data-melantia-estado style="font-size:13px;color:#46614f">Iniciando camara...</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px">
              <button type="button" data-melantia-manual style="border:none;border-radius:999px;padding:11px 16px;background:#eef5ef;color:#18402c;font-weight:700;cursor:pointer">Ingresar codigo</button>
              <button type="button" data-melantia-cerrar style="border:none;border-radius:999px;padding:11px 16px;background:#173728;color:#fff;font-weight:700;cursor:pointer">Cerrar</button>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const video = overlay.querySelector('video');
    const estadoNodo = overlay.querySelector('[data-melantia-estado]');
    const cerrarBtn = overlay.querySelector('[data-melantia-cerrar]');
    const manualBtn = overlay.querySelector('[data-melantia-manual]');

    cerrarBtn?.addEventListener('click', () => this._cerrarEscanerTienda());
    manualBtn?.addEventListener('click', () => {
      this._cerrarEscanerTienda();
      this.confirmarEntregaTiendaPorQr();
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      this._scannerTiendaActivo = {
        activo: true,
        overlay,
        stream,
        frameId: 0,
      };
      video.srcObject = stream;
      await video.play();
      estadoNodo.textContent = 'Camara lista. Esperando lectura del QR...';

      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      const detectar = async () => {
        const scanner = this._scannerTiendaActivo;
        if (!scanner?.activo) return;
        try {
          if (video.readyState >= 2) {
            const lecturas = await detector.detect(video);
            const codigo = String(lecturas?.[0]?.rawValue || '').trim();
            if (codigo) {
              estadoNodo.textContent = 'QR detectado. Validando entrega...';
              this._cerrarEscanerTienda();
              this._confirmarCodigoEntregaTienda(codigo, 'camara');
              return;
            }
          }
        } catch (error) {
          console.warn('[Melantia] Error detectando QR en tienda:', error);
          estadoNodo.textContent =
            'No pude leer el QR todavia. Mantenga el codigo estable frente a la camara.';
        }
        if (this._scannerTiendaActivo?.activo) {
          this._scannerTiendaActivo.frameId =
            window.requestAnimationFrame(detectar);
        }
      };

      this._scannerTiendaActivo.frameId =
        window.requestAnimationFrame(detectar);
      return true;
    } catch (error) {
      console.error('[Melantia] Error iniciando escaner QR de tienda:', error);
      this._cerrarEscanerTienda();
      this.hablarComo(
        'Angel',
        'No pude abrir la camara en este momento. Continuare con validacion manual para no frenar la entrega.'
      );
      return this.confirmarEntregaTiendaPorQr();
    }
  },

  liquidarTiendaMelantia() {
    const estado = this._estadoComunidad();
    const tienda = { ...(estado.tienda || {}) };
    if (!tienda.qrEntregaConfirmado) {
      this.hablarComo(
        'Angel',
        'Todavia falta la confirmacion de entrega por QR antes de liquidar.'
      );
      return false;
    }
    tienda.depositoEstado = 'LIQUIDADO';
    estado.tienda = tienda;
    this._guardarEstadoComunidad(estado);
    const resumen = this._resolverComisionTienda(tienda);
    this.hablarComo(
      'Angel',
      `Liquidacion completada. Aplique ${resumen.porcentaje}% de comision y transferi ${this._dinero(resumen.netoVendedor)} al vendedor.`
    );
    return this.abrirTiendaMelantia();
  },

  _leerArchivoComoDataUrl(file) {
    if (!file) return Promise.resolve('');
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () =>
        reject(reader.error || new Error('No pude leer el archivo.'));
      reader.readAsDataURL(file);
    });
  },

  _seleccionarArchivoCustodia({ accept = 'image/*,.pdf' } = {}) {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;
      input.style.display = 'none';
      input.onchange = () => {
        const [file] = Array.from(input.files || []);
        input.remove();
        resolve(file || null);
      };
      document.body.appendChild(input);
      input.click();
    });
  },

  _estadoRegistroEvidenciaBase() {
    return {
      reloj: {
        ultimaFuente: 'local_pendiente_sync',
        ultimaMarca: '',
      },
      evidencias: [],
      documentos: {
        limite: 160,
        ultimoDocumentoId: '',
        items: [],
      },
    };
  },

  _normalizarEstadoRegistroEvidencia(estado = null) {
    const base = this._estadoRegistroEvidenciaBase();
    const actual = estado && typeof estado === 'object' ? estado : {};
    const documentos =
      actual.documentos && typeof actual.documentos === 'object'
        ? actual.documentos
        : {};
    return {
      ...base,
      ...actual,
      reloj: {
        ...base.reloj,
        ...(actual.reloj || {}),
      },
      evidencias: Array.isArray(actual.evidencias) ? actual.evidencias : [],
      documentos: {
        ...base.documentos,
        ...documentos,
        items: Array.isArray(documentos.items) ? documentos.items : [],
      },
    };
  },

  _estadoRegistroEvidenciaLocal() {
    try {
      return this._normalizarEstadoRegistroEvidencia(
        JSON.parse(
          window.localStorage?.getItem(this._evidenciaStorageKey) || 'null'
        ) || this._estadoRegistroEvidenciaBase()
      );
    } catch {
      return this._estadoRegistroEvidenciaBase();
    }
  },

  _abrirBovedaEvidenciaDb() {
    if (!window.indexedDB) return Promise.resolve(null);
    return new Promise((resolve, reject) => {
      const req = window.indexedDB.open(
        this._evidenciaDbName,
        this._evidenciaDbVersion
      );
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(this._evidenciaDbStore)) {
          db.createObjectStore(this._evidenciaDbStore, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  async _estadoRegistroEvidencia(opciones = {}) {
    const forzar = Boolean(opciones.forzar);
    if (this._registroEvidenciaCache && !forzar) {
      return this._registroEvidenciaCache;
    }

    const respaldoLocal = this._estadoRegistroEvidenciaLocal();

    try {
      const db = await this._abrirBovedaEvidenciaDb();
      if (!db) {
        this._registroEvidenciaCache = respaldoLocal;
        return respaldoLocal;
      }

      const registro = await new Promise((resolve, reject) => {
        const tx = db.transaction(this._evidenciaDbStore, 'readonly');
        const store = tx.objectStore(this._evidenciaDbStore);
        const req = store.get('principal');
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
      db.close();

      const estado = this._normalizarEstadoRegistroEvidencia(
        registro?.payload || respaldoLocal
      );
      this._registroEvidenciaCache = estado;

      if (!registro && respaldoLocal.evidencias?.length) {
        await this._guardarRegistroEvidencia(estado);
      }

      return estado;
    } catch (error) {
      console.warn('[Melantia] No pude abrir la boveda de evidencia:', error);
      this._registroEvidenciaCache = respaldoLocal;
      return respaldoLocal;
    }
  },

  async _guardarRegistroEvidencia(estado) {
    window.localStorage?.setItem(
      this._evidenciaStorageKey,
      JSON.stringify(estado)
    );
    this._registroEvidenciaCache = estado;

    try {
      const db = await this._abrirBovedaEvidenciaDb();
      if (db) {
        await new Promise((resolve, reject) => {
          const tx = db.transaction(this._evidenciaDbStore, 'readwrite');
          const store = tx.objectStore(this._evidenciaDbStore);
          const req = store.put({
            id: 'principal',
            payload: estado,
            actualizadoEn: new Date().toISOString(),
          });
          req.onsuccess = () => resolve(true);
          req.onerror = () => reject(req.error);
        });
        db.close();
      }
    } catch (error) {
      console.warn(
        '[Melantia] No pude persistir la evidencia en IndexedDB:',
        error
      );
    }

    return estado;
  },

  _inferirModuloDocumento(titulo = '') {
    const texto = this._normalizar(titulo);
    if (/ficha de emergencia|salud/.test(texto))
      return 'Asistente Preventivo de Salud';
    if (/tienda|ventas|reporte mensual/.test(texto)) return 'Comercio - Tienda';
    if (/legal|contrato|acta|pagare|auditoria/.test(texto))
      return 'Asesoria Legal';
    if (/rural|agronomico|cultivo/.test(texto))
      return 'Asistente Tecnico Rural';
    if (/ficha de trazabilidad|veterinaria|animal/.test(texto)) {
      return 'Asistente Tecnico Veterinario';
    }
    if (/certificado|escuela/.test(texto)) return 'Escuela de Campo MELANTIA';
    return 'General';
  },

  _compactarContenidoDocumento(contenido, mimeType = 'text/html') {
    const mime = String(mimeType || 'text/html').toLowerCase();
    let texto = String(contenido || '').trim();
    if (!texto) return '';
    if (mime.includes('html')) {
      texto = texto
        .replace(/\n+/g, '\n')
        .replace(/\s{2,}/g, ' ')
        .trim();
    }
    if (texto.length > 180000) {
      texto = `${texto.slice(0, 180000)}\n\n[DOCUMENTO_COMPACTADO_TRUNCADO]`;
    }
    return texto;
  },

  async registrarDocumentoModulo(datos = {}) {
    const estado = await this._estadoRegistroEvidencia();
    const titulo = String(datos.titulo || 'Documento MELANTIA').trim();
    const mimeType = String(datos.mimeType || 'text/html').trim();
    const modulo = String(
      datos.modulo || this._inferirModuloDocumento(titulo)
    ).trim();
    const contenidoCompacto = this._compactarContenidoDocumento(
      datos.contenido || '',
      mimeType
    );

    if (!contenidoCompacto) return null;

    const item = {
      id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      titulo,
      modulo,
      mimeType,
      contenidoCompacto,
      nombreArchivo:
        String(datos.nombreArchivo || '').trim() ||
        `melantia_${this._normalizar(modulo)}_${Date.now()}.${
          mimeType.includes('csv')
            ? 'csv'
            : mimeType.includes('html')
              ? 'html'
              : 'txt'
        }`,
      origen: String(datos.origen || 'modulo').trim(),
      creadoEn: new Date().toISOString(),
      loteId: datos.loteId || '',
      resumen: String(datos.resumen || '').slice(0, 220),
    };

    const documentos = estado.documentos || {
      limite: 160,
      ultimoDocumentoId: '',
      items: [],
    };
    const limite = Number(documentos.limite || 160);
    documentos.items = [item, ...(documentos.items || [])].slice(0, limite);
    documentos.ultimoDocumentoId = item.id;
    estado.documentos = documentos;
    await this._guardarRegistroEvidencia(estado);
    return item;
  },

  async _obtenerDocumentoRegistro(idDocumento) {
    const estado = await this._estadoRegistroEvidencia();
    return (estado.documentos?.items || []).find(
      (item) => item.id === idDocumento
    );
  },

  async abrirDocumentoRegistro(idDocumento, opciones = {}) {
    const item = await this._obtenerDocumentoRegistro(idDocumento);
    if (!item) {
      this.hablar('No encontre ese documento en la carpeta centralizada.');
      return false;
    }
    const win = window.open('', '_blank', 'width=980,height=860');
    if (!win) {
      this.hablar('Permite ventanas emergentes para abrir el documento.');
      return false;
    }

    if (String(item.mimeType || '').includes('html')) {
      win.document.write(item.contenidoCompacto || '');
      win.document.close();
    } else {
      win.document.write(
        `<!doctype html><html lang="es"><head><meta charset="utf-8" /><title>${this._escaparHtml(item.titulo)}</title><style>body{font-family:Consolas,monospace;background:#f4f7f6;padding:20px;color:#173728}pre{white-space:pre-wrap;word-break:break-word;background:#fff;border:1px solid #d7e6dc;border-radius:12px;padding:14px}</style></head><body><h2>${this._escaparHtml(item.titulo)}</h2><pre>${this._escaparHtml(item.contenidoCompacto || '')}</pre></body></html>`
      );
      win.document.close();
    }
    if (opciones.imprimir) {
      setTimeout(() => {
        try {
          win.print();
        } catch {}
      }, 250);
    }
    return true;
  },

  async descargarDocumentoRegistro(idDocumento) {
    const item = await this._obtenerDocumentoRegistro(idDocumento);
    if (!item) return false;
    const blob = new Blob([item.contenidoCompacto || ''], {
      type: item.mimeType || 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = item.nombreArchivo || `documento_${idDocumento}.txt`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
    this.hablar('Documento descargado desde la carpeta centralizada.');
    return true;
  },

  async compartirDocumentoRegistro(idDocumento, canal = 'whatsapp') {
    const item = await this._obtenerDocumentoRegistro(idDocumento);
    if (!item) return false;
    const texto = `MELANTIA · ${item.titulo}\nModulo: ${item.modulo}\nFecha: ${new Date(item.creadoEn).toLocaleString('es-EC')}\n${item.resumen || ''}`;
    if (canal === 'app' && navigator.share) {
      try {
        await navigator.share({
          title: item.titulo,
          text: texto,
        });
        return true;
      } catch {}
    }
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank', 'noopener');
    return true;
  },

  async abrirCarpetaDocumentosRegistro(filtroModulo = '') {
    const estado = await this._estadoRegistroEvidencia();
    const filtro = this._normalizar(filtroModulo || '');
    const lista = (estado.documentos?.items || []).filter((item) =>
      filtro ? this._normalizar(item.modulo || '').includes(filtro) : true
    );
    const htmlLista = lista.length
      ? lista
          .slice(0, 40)
          .map(
            (item) =>
              `<article style="background:#fff;border:1px solid #dbe7de;border-radius:12px;padding:10px"><strong>${this._escaparHtml(item.titulo)}</strong><div style="margin-top:6px;font-size:12px;color:#486454">${this._escaparHtml(item.modulo)} · ${this._escaparHtml(new Date(item.creadoEn).toLocaleString('es-EC'))}</div><div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:8px"><button onclick="window.MelantiaAsistente?.abrirDocumentoRegistro('${item.id}')">Abrir</button><button onclick="window.MelantiaAsistente?.compartirDocumentoRegistro('${item.id}','whatsapp')">Compartir</button><button onclick="window.MelantiaAsistente?.descargarDocumentoRegistro('${item.id}')">Descargar</button><button onclick="window.MelantiaAsistente?.abrirDocumentoRegistro('${item.id}',{imprimir:true})">Imprimir</button></div></article>`
          )
          .join('')
      : '<div style="background:#fff;border:1px dashed #dbe7de;border-radius:12px;padding:12px;color:#4f6f5a">Todavia no hay documentos centralizados para este filtro.</div>';

    this._abrirPanel(
      'Registro de Evidencia · Carpeta Documentos',
      'Boveda centralizada y compactada para descargar, compartir e imprimir desde un solo lugar.',
      `<section style="display:grid;gap:10px"><article style="background:#eefaf0;border:1px solid #cfe7d4;border-radius:12px;padding:12px"><strong>Orden documental MELANTIA</strong><div style="margin-top:6px">Documentos compactados: ${this._escaparHtml(String((estado.documentos?.items || []).length))}. Filtro activo: ${this._escaparHtml(filtroModulo || 'todos')}.</div></article><div style="display:grid;gap:10px">${htmlLista}</div><div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px"><button onclick="window.MelantiaAsistente?.abrirRegistroEvidencia()">Volver a Registro de Evidencia</button><button onclick="window.MelantiaAsistente?.abrirCarpetaDocumentosRegistro('')">Ver todos</button><button onclick="window.MelantiaAsistente?.abrirCarpetaDocumentosRegistro('Comercio')">Solo tienda</button><button onclick="window.MelantiaAsistente?.abrirCarpetaDocumentosRegistro('Rural')">Solo rural</button><button onclick="window.MelantiaAsistente?.abrirCarpetaDocumentosRegistro('Veterinario')">Solo veterinario</button><button onclick="window.MelantiaAsistente?.abrirCarpetaDocumentosRegistro('Escuela')">Solo certificados</button></div></section>`,
      'Don Eloy'
    );
    return true;
  },

  async _obtenerTimestampMelantia() {
    if (typeof window.obtenerFechaServidorMelantia === 'function') {
      try {
        const respuesta = await window.obtenerFechaServidorMelantia();
        const iso = new Date(
          respuesta?.iso || respuesta?.timestamp || Date.now()
        ).toISOString();
        return {
          iso,
          fuente: 'servidor_melantia',
          sincronizado: true,
        };
      } catch (error) {
        console.warn('[Melantia] No pude leer la hora de servidor:', error);
      }
    }

    if (
      navigator.onLine &&
      typeof fetch === 'function' &&
      /^https?:$/i.test(window.location.protocol)
    ) {
      try {
        const respuesta = await fetch(window.location.href, {
          method: 'HEAD',
          cache: 'no-store',
        });
        const fechaCabecera = respuesta.headers.get('date');
        if (fechaCabecera) {
          return {
            iso: new Date(fechaCabecera).toISOString(),
            fuente: 'cabecera_http',
            sincronizado: true,
          };
        }
      } catch (error) {
        console.warn(
          '[Melantia] No pude validar la hora por cabecera HTTP:',
          error
        );
      }
    }

    return {
      iso: new Date().toISOString(),
      fuente: 'local_pendiente_sync',
      sincronizado: false,
    };
  },

  async _resolverLoteEvidencia() {
    try {
      const animal = window.DrJorgeVeterinario?._resolverAnimalActivo?.();
      if (animal?.idLote || animal?.lote) return animal.idLote || animal.lote;
    } catch {}
    try {
      const lote = await window.FabrizzioAsesor?._resolverLoteActual?.();
      if (lote) return lote;
    } catch {}
    return 'general';
  },

  _resolverSocioEvidencia() {
    return 'Socio MELANTIA';
  },

  async _obtenerGpsEvidencia() {
    const sello = await this._obtenerSelloGeoTemporalInterno();
    return {
      disponible: Boolean(sello.gpsDisponible),
      latitud: sello.latitud ?? null,
      longitud: sello.longitud ?? null,
      precisionMetros: sello.precisionMetros ?? null,
    };
  },

  _tituloModoEvidencia(modo) {
    if (modo === 'negocios') return 'Evidencia para Negocios';
    if (modo === 'asistencia') return 'Reporte de Asistencia';
    return 'Seguimiento de Produccion';
  },

  _descripcionModoEvidencia(modo) {
    if (modo === 'negocios') {
      return 'Guia de camara para escrituras, predios, ganado y soporte documental legible para el Dr. Pablo.';
    }
    if (modo === 'asistencia') {
      return 'Foto de plaga, cultivo o animal con ubicacion exacta para que Fabrizzio o el Dr. Jorge den una receta precisa.';
    }
    return 'Trazabilidad por lote con referencia visual para repetir angulo y construir una linea real de crecimiento.';
  },

  async _historialEvidenciaLote(idLote) {
    const estado = await this._estadoRegistroEvidencia();
    return (estado.evidencias || []).filter(
      (item) => String(item.idLote || 'general') === String(idLote || 'general')
    );
  },

  async registrarEvidenciaInteligente(modo = 'trazabilidad') {
    const loteId = await this._resolverLoteEvidencia();
    const historial = await this._historialEvidenciaLote(loteId);
    const referencia = historial.find((item) => item.modo === modo) || null;
    const accept = modo === 'negocios' ? 'image/*,.pdf' : 'image/*';
    const archivo = await this._seleccionarArchivoCustodia({ accept });
    if (!archivo) return false;

    const [dataUrl, gps, reloj] = await Promise.all([
      this._leerArchivoComoDataUrl(archivo),
      this._obtenerGpsEvidencia(),
      this._obtenerTimestampMelantia(),
    ]);

    let destinoAsistencia = '';
    if (modo === 'asistencia') {
      destinoAsistencia = this._normalizar(
        window.prompt(
          'Destino del reporte: veterinaria o agronomia.',
          'veterinaria'
        ) || 'veterinaria'
      );
    }

    const estado = await this._estadoRegistroEvidencia();
    const evidencia = {
      id: `ev-${Date.now()}`,
      modo,
      idLote: loteId,
      socioId: this._resolverSocioEvidencia(),
      archivoNombre: archivo.name || 'evidencia.jpg',
      mimeType: archivo.type || 'application/octet-stream',
      archivoDataUrl: dataUrl,
      creadaEn: reloj.iso,
      fuenteTiempo: reloj.fuente,
      gps,
      destinoAsistencia:
        modo === 'asistencia'
          ? destinoAsistencia.includes('agro')
            ? 'Fabrizzio'
            : 'Dr. Jorge'
          : '',
      overlayReferenciaId: referencia?.id || null,
      sello: 'EVIDENCIA_CERTIFICADA',
    };

    estado.reloj = {
      ultimaFuente: reloj.fuente,
      ultimaMarca: reloj.iso,
    };
    estado.evidencias = [evidencia, ...(estado.evidencias || [])].slice(0, 80);
    await this._guardarRegistroEvidencia(estado);

    if (modo === 'asistencia') {
      const destino = evidencia.destinoAsistencia || 'Fabrizzio';
      this.hablarComo(
        destino,
        `Reporte visual recibido con sello tecnico MELANTIA. Ya tengo la ubicacion del problema en el lote ${loteId}.`
      );
    } else {
      this.hablarDonEloy(
        'Muy bien, socio. Esa foto tiene el sello de Melantia. Con el GPS y la hora que registramos, nadie puede dudar de que esa es la verdad del campo.'
      );
    }

    return this.abrirRegistroEvidencia(modo);
  },

  async abrirRegistroEvidencia(modoActivo = 'trazabilidad') {
    const loteId = await this._resolverLoteEvidencia();
    const estado = await this._estadoRegistroEvidencia();
    const evidenciasLote = (estado.evidencias || []).filter(
      (item) => String(item.idLote || 'general') === String(loteId || 'general')
    );
    const referencia = evidenciasLote.find(
      (item) => item.modo === 'trazabilidad'
    );
    const lista = evidenciasLote
      .slice(0, 6)
      .map((item) => {
        const gpsTexto = item.gps?.disponible
          ? `${Number(item.gps.latitud).toFixed(5)}, ${Number(item.gps.longitud).toFixed(5)} · ±${item.gps.precisionMetros || 0} m`
          : 'GPS pendiente o no disponible';
        const tiempoTexto = new Date(item.creadaEn).toLocaleString('es-EC');
        const preview = String(item.mimeType || '').startsWith('image/')
          ? `<img src="${item.archivoDataUrl}" alt="${this._escaparHtml(item.archivoNombre)}" style="width:92px;height:92px;object-fit:cover;border-radius:12px;border:1px solid #dbe7de" />`
          : `<div style="width:92px;height:92px;border-radius:12px;border:1px dashed #dbe7de;display:grid;place-items:center;background:#f8fbf8;font-size:12px;color:#4d6657">PDF</div>`;
        return `<article style="display:grid;grid-template-columns:92px 1fr;gap:12px;background:#fff;border:1px solid #dbe7de;border-radius:16px;padding:12px"><div>${preview}</div><div><strong>${this._escaparHtml(this._tituloModoEvidencia(item.modo))}</strong><div style="margin-top:6px;font-size:12px;color:#486454">${this._escaparHtml(tiempoTexto)} · ${this._escaparHtml(item.sello)}</div><div style="margin-top:6px;font-size:12px;color:#486454">${this._escaparHtml(gpsTexto)}</div><div style="margin-top:6px;font-size:12px;color:#486454">Hora MELANTIA: ${this._escaparHtml(item.fuenteTiempo)}</div></div></article>`;
      })
      .join('');
    const overlay = referencia
      ? `<div style="display:grid;grid-template-columns:96px 1fr;gap:12px;align-items:center;background:#f7fbf7;border:1px solid #dce8de;border-radius:14px;padding:12px"><img src="${referencia.archivoDataUrl}" alt="Referencia de trazabilidad" style="width:96px;height:96px;object-fit:cover;border-radius:12px;border:1px solid #d7e5d9" /><div><strong>Superposicion de referencia</strong><div style="margin-top:6px;font-size:12px;color:#4f6f5a">Usa esta toma anterior para repetir angulo, distancia y altura. Cuando juntes varias capturas del mismo lote, MELANTIA deja listo el album para una secuencia tipo time-lapse.</div></div></div>`
      : `<div style="background:#f7fbf7;border:1px solid #dce8de;border-radius:14px;padding:12px;font-size:12px;color:#4f6f5a">Todavia no existe una foto base de este lote. La primera captura de trazabilidad se usara como referencia para la siguiente.</div>`;

    this._abrirPanel(
      'Registro de Evidencia · Foto Inteligente',
      `Modulo transversal para capturar evidencia certificada del lote ${this._escaparHtml(String(loteId))}.`,
      `<section style="display:grid;gap:10px">
        <article style="background:#eefaf0;border:1px solid #cfe7d4;border-radius:14px;padding:12px"><strong>Metadatos de seguridad</strong><div style="margin-top:6px">Cada captura se guarda con GPS, sello de hora MELANTIA, ID del socio y lote activo. Si hay conectividad, la hora se valida con servidor o cabecera segura; si no, se marca como local pendiente de sincronizacion.</div><div style="margin-top:8px;font-size:12px;color:#4f6f5a">Ultima fuente de tiempo: ${this._escaparHtml(estado.reloj?.ultimaFuente || 'sin registro')} · Ultima marca: ${this._escaparHtml(estado.reloj?.ultimaMarca ? new Date(estado.reloj.ultimaMarca).toLocaleString('es-EC') : 'sin registro')}</div></article>
        <article style="background:${modoActivo === 'trazabilidad' ? '#f5fbf5' : '#fff'};border:1px solid #d3e7d3;border-radius:14px;padding:12px"><strong>Seguimiento de Produccion</strong><div style="margin-top:6px">${this._descripcionModoEvidencia('trazabilidad')}</div></article>
        <article style="background:${modoActivo === 'negocios' ? '#fff8ef' : '#fff'};border:1px solid #e6cfb1;border-radius:14px;padding:12px"><strong>Evidencia para Negocios</strong><div style="margin-top:6px">${this._descripcionModoEvidencia('negocios')}</div></article>
        <article style="background:${modoActivo === 'asistencia' ? '#eef7ff' : '#fff'};border:1px solid #c9dcf7;border-radius:14px;padding:12px"><strong>Reporte de Asistencia</strong><div style="margin-top:6px">${this._descripcionModoEvidencia('asistencia')}</div></article>
      </section>
      <section style="display:grid;gap:10px;margin-top:10px">
        ${overlay}
      </section>
      <section style="display:grid;gap:10px;margin-top:10px">
        <article style="background:#fff;border:1px solid #dbe7de;border-radius:14px;padding:12px"><strong>Sello de Don Eloy</strong><div style="margin-top:6px">Evidencia Certificada. El album historico por lote se convierte en prueba de manejo real para ventas, credito, acompanamiento tecnico y prestigio del Ciudadano Rural.</div></article>
      </section>
      <section style="display:grid;gap:10px;margin-top:10px">
        <strong>Historial fotografico por lote</strong>
        ${lista || '<div style="background:#fff;border:1px dashed #dbe7de;border-radius:14px;padding:12px;color:#4f6f5a">No hay evidencias todavia en este lote.</div>'}
      </section>
      <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">
        <button onclick="window.MelantiaAsistente?.registrarEvidenciaInteligente('trazabilidad')">Captura trazabilidad</button>
        <button onclick="window.MelantiaAsistente?.registrarEvidenciaInteligente('negocios')">Captura negocios</button>
        <button onclick="window.MelantiaAsistente?.registrarEvidenciaInteligente('asistencia')">Captura asistencia</button>
        <button onclick="window.MelantiaAsistente?.abrirNegociosConDonEloy()">Negocios</button>
        <button onclick="window.MelantiaAsistente?.explicarRegistro()">Ciudadano Rural</button>
      </div>`,
      modoActivo === 'asistencia' ? 'Fabrizzio' : 'Don Eloy'
    );

    if (modoActivo === 'asistencia') {
      this.hablarComo(
        'Fabrizzio',
        'Abri el registro de evidencia para soporte tecnico. Si me envias la foto del problema con GPS, podre ubicar mejor la receta o recomendacion.'
      );
    } else {
      this.hablarDonEloy(
        'Aqui tengo el album de evidencias del lote. Fotos con fecha y lugar que demuestran el cuidado real de la tierra y de los animales.'
      );
    }
    return true;
  },

  _actualizarEstadoLiberacionCustodia(propiedades) {
    const tienePrueba = Boolean(propiedades.evidenciaNotarialArchivo);
    const dobleConfirmacion =
      Boolean(propiedades.confirmacionComprador) &&
      Boolean(propiedades.confirmacionVendedor);
    if (propiedades.depositoEstado === 'DEVUELTO_INTEGRO') return propiedades;
    if (tienePrueba && dobleConfirmacion) {
      propiedades.depositoEstado = 'LIBERADO_A_VENDEDOR';
      propiedades.reciboLiquidacionEmitidoEn =
        propiedades.reciboLiquidacionEmitidoEn || new Date().toISOString();
    } else if (tienePrueba) {
      propiedades.depositoEstado = 'EN_REVISION_NOTARIAL';
    } else {
      propiedades.depositoEstado = propiedades.depositoEstado || 'EN_CUSTODIA';
    }
    return propiedades;
  },

  _textoReciboCustodia(propiedades = {}) {
    const comision =
      (Number(propiedades.valorCierre || 0) *
        Number(propiedades.comisionPorcentaje || 5)) /
      100;
    const netoVendedor = Number(propiedades.valorCierre || 0) - comision;
    return [
      'MELANTIA IA · Acta de Liquidacion de Negocio Rural',
      `Transaccion: #MR-2026-00X`,
      `Propiedad: ${propiedades.propiedad || 'Finca no definida'}`,
      `Comprador: ${propiedades.comprador || 'Comprador'}`,
      `Vendedor: ${propiedades.vendedor || 'Vendedor'}`,
      `Zona notarial: ${propiedades.zonaNotaria || 'No registrada'}`,
      `Estado de custodia: ${propiedades.depositoEstado || 'EN_CUSTODIA'}`,
      `Precio de venta: ${this._dinero(propiedades.valorCierre)}`,
      `Comision MELANTIA (${Number(propiedades.comisionPorcentaje || 5)}%): ${this._dinero(comision)}`,
      `Monto neto al vendedor: ${this._dinero(netoVendedor)}`,
      `Prueba notarial: ${propiedades.evidenciaNotarialNombre || propiedades.evidenciaNotarial || 'PENDIENTE_CARGA'}`,
      `Acta voz comprador inicial: ${propiedades.actaVozCompradorInicial}`,
      `Acta voz vendedor inicial: ${propiedades.actaVozVendedorInicial}`,
      `Acta voz comprador final: ${propiedades.actaVozCompradorFinal}`,
      `Acta voz vendedor final: ${propiedades.actaVozVendedorFinal}`,
      `Emitido: ${new Date(propiedades.reciboLiquidacionEmitidoEn || Date.now()).toLocaleString('es-EC')}`,
      'Blindaje documental: foto/escritura notariada, doble conformidad y trazabilidad MELANTIA.',
    ].join('\n');
  },

  _htmlReciboCustodia(propiedades = {}) {
    const comision =
      (Number(propiedades.valorCierre || 0) *
        Number(propiedades.comisionPorcentaje || 5)) /
      100;
    const netoVendedor = Number(propiedades.valorCierre || 0) - comision;
    const fechaEmision = new Date(
      propiedades.reciboLiquidacionEmitidoEn || Date.now()
    ).toLocaleString('es-EC');
    const evidencia = propiedades.evidenciaNotarialArchivo
      ? propiedades.evidenciaNotarialMime.startsWith('image/')
        ? `<img src="${propiedades.evidenciaNotarialArchivo}" alt="Prueba notarial" style="width:100%;max-height:220px;object-fit:cover;border-radius:14px;border:1px solid #d7e6da" />`
        : `<div class="mini">Archivo cargado: ${this._escaparHtml(propiedades.evidenciaNotarialNombre || 'documento.pdf')}</div>`
      : '<div class="mini">Sin archivo notarial adjunto.</div>';
    return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Recibo de liquidacion MELANTIA</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: Georgia, 'Times New Roman', serif; background:#eef4ee; color:#173526; }
    .sheet { max-width: 920px; margin: 24px auto; background:#fff; border:1px solid #d6e6d9; border-radius:24px; overflow:hidden; box-shadow:0 18px 60px rgba(17,58,35,.10); }
    .hero { padding:28px 32px; background:linear-gradient(135deg,#1f8f4e 0%,#2e6d46 100%); color:#fff; }
    .eyebrow { font-size:12px; letter-spacing:.18em; text-transform:uppercase; opacity:.9; }
    h1 { margin:10px 0 6px; font-size:32px; line-height:1.08; }
    .hero p { margin:0; max-width:700px; color:rgba(255,255,255,.9); }
    .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:14px; padding:24px 32px; }
    .card { border:1px solid #dce8de; border-radius:18px; padding:16px; background:#fbfdfb; }
    .card h2 { margin:0 0 10px; font-size:16px; color:#1b4f33; }
    .linea { margin:0 0 8px; font-size:14px; line-height:1.45; }
    .linea strong { color:#163a28; }
    .destacado { background:#f3fbf4; border-color:#cbe6d1; }
    .acciones { display:flex; gap:10px; flex-wrap:wrap; padding:0 32px 28px; }
    button { border:none; border-radius:999px; padding:12px 18px; cursor:pointer; font-weight:700; background:#1f8f4e; color:#fff; }
    button.sec { background:#ecf4ed; color:#1c4a31; border:1px solid #cfe2d2; }
    .pie { padding:0 32px 28px; font-size:12px; color:#4f6f5a; }
    .mini { font-size:12px; color:#4f6f5a; line-height:1.5; }
    @media print {
      body { background:#fff; }
      .sheet { margin:0; max-width:none; border:none; border-radius:0; box-shadow:none; }
      .acciones { display:none; }
    }
  </style>
</head>
<body>
  <main class="sheet">
    <section class="hero">
      <div class="eyebrow">Transaccion Protegida MELANTIA</div>
      <h1>Acta de Liquidacion de Negocio Rural</h1>
      <p>Certificado institucional de cierre con custodia, verificacion notarial, doble conformidad y liquidacion final al vendedor.</p>
    </section>
    <section class="grid">
      <article class="card destacado">
        <h2>Resumen oficial</h2>
        <p class="linea"><strong>Transaccion:</strong> #MR-2026-00X</p>
        <p class="linea"><strong>Estado:</strong> ${this._escaparHtml(propiedades.depositoEstado || 'EN_CUSTODIA')}</p>
        <p class="linea"><strong>Emitido:</strong> ${this._escaparHtml(fechaEmision)}</p>
        <p class="linea"><strong>Sello MELANTIA:</strong> ${this._escaparHtml(propiedades.selloVerificacion || 'Documentacion Verificada por Melantia')}</p>
      </article>
      <article class="card">
        <h2>Partes del negocio</h2>
        <p class="linea"><strong>Propiedad:</strong> ${this._escaparHtml(propiedades.propiedad || 'Finca no definida')}</p>
        <p class="linea"><strong>Comprador:</strong> ${this._escaparHtml(propiedades.comprador || 'Comprador')}</p>
        <p class="linea"><strong>Vendedor:</strong> ${this._escaparHtml(propiedades.vendedor || 'Vendedor')}</p>
        <p class="linea"><strong>Zona notarial:</strong> ${this._escaparHtml(propiedades.zonaNotaria || 'No registrada')}</p>
      </article>
      <article class="card">
        <h2>Liquidacion economica</h2>
        <p class="linea"><strong>Precio de venta:</strong> ${this._dinero(propiedades.valorCierre)}</p>
        <p class="linea"><strong>Comision MELANTIA (${Number(propiedades.comisionPorcentaje || 5)}%):</strong> ${this._dinero(comision)}</p>
        <p class="linea"><strong>Monto neto al vendedor:</strong> ${this._dinero(netoVendedor)}</p>
      </article>
      <article class="card">
        <h2>Conformidad de cierre</h2>
        <p class="linea"><strong>Comprador:</strong> ${propiedades.confirmacionComprador ? 'ACEPTADO' : 'PENDIENTE'}</p>
        <p class="linea"><strong>Vendedor:</strong> ${propiedades.confirmacionVendedor ? 'ACEPTADO' : 'PENDIENTE'}</p>
        <p class="linea"><strong>Acta voz comprador final:</strong> ${this._escaparHtml(propiedades.actaVozCompradorFinalTexto || 'Sin transcripcion')}</p>
        <p class="linea"><strong>Acta voz vendedor final:</strong> ${this._escaparHtml(propiedades.actaVozVendedorFinalTexto || 'Sin transcripcion')}</p>
      </article>
      <article class="card" style="grid-column:1/-1">
        <h2>Evidencia notarial</h2>
        <p class="linea"><strong>Estado documental:</strong> ${this._escaparHtml(propiedades.evidenciaNotarial || 'PENDIENTE_CARGA')}</p>
        <p class="linea"><strong>Archivo:</strong> ${this._escaparHtml(propiedades.evidenciaNotarialNombre || 'Sin archivo cargado')}</p>
        ${evidencia}
      </article>
    </section>
    <div class="acciones">
      <button onclick="window.print()">Imprimir recibo</button>
      <button class="sec" onclick="window.close()">Cerrar</button>
    </div>
    <p class="pie">MELANTIA IA · Documento institucional emitido desde el modulo de custodia rural para respaldo tecnico, legal y comercial.</p>
  </main>
</body>
</html>`;
  },

  verReciboCustodia() {
    const propiedades = this._estadoComunidad().propiedades || {};
    return this._abrirVentanaDocumento(
      this._htmlReciboCustodia(propiedades),
      'Recibo de liquidacion MELANTIA'
    );
  },

  async cargarPruebaNotarial() {
    try {
      const file = await this._seleccionarArchivoCustodia();
      if (!file) return false;
      const dataUrl = await this._leerArchivoComoDataUrl(file);
      const estado = this._estadoComunidad();
      const propiedades = { ...(estado.propiedades || {}) };
      propiedades.evidenciaNotarial = 'CARGADA';
      propiedades.evidenciaNotarialNombre = file.name || 'evidencia_notarial';
      propiedades.evidenciaNotarialArchivo = dataUrl;
      propiedades.evidenciaNotarialMime =
        file.type || 'application/octet-stream';
      this._actualizarEstadoLiberacionCustodia(propiedades);
      estado.propiedades = propiedades;
      this._guardarEstadoComunidad(estado);
      this.hablarComo(
        'Dr. Pablo',
        'Prueba notarial cargada. Iniciare la verificacion documental antes de liberar los fondos.'
      );
      this.abrirIntermediacionPropiedades();
      return true;
    } catch (error) {
      console.error('[Melantia] Error al cargar prueba notarial:', error);
      this.hablarComo(
        'Dr. Pablo',
        'No pude leer la prueba notarial en este momento.'
      );
      return false;
    }
  },

  async registrarActaVoz(parte, momento = 'final') {
    const clave =
      parte === 'comprador'
        ? momento === 'inicial'
          ? 'actaVozCompradorInicial'
          : 'actaVozCompradorFinal'
        : momento === 'inicial'
          ? 'actaVozVendedorInicial'
          : 'actaVozVendedorFinal';
    const claveTexto = `${clave}Texto`;
    const actor = parte === 'comprador' ? 'comprador' : 'vendedor';
    let texto = '';
    try {
      const Reconocimiento =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (Reconocimiento) {
        texto = await new Promise((resolve, reject) => {
          const speech = new Reconocimiento();
          speech.lang = 'es-EC';
          speech.maxAlternatives = 1;
          speech.interimResults = false;
          speech.onresult = (event) => {
            const resultado = event.results?.[0]?.[0]?.transcript || '';
            resolve(String(resultado).trim());
          };
          speech.onerror = () =>
            reject(new Error('No se pudo capturar la voz.'));
          speech.onnomatch = () =>
            reject(new Error('Sin coincidencia de voz.'));
          speech.start();
        });
      }
    } catch (error) {
      console.warn(
        '[Melantia] Captura de voz con navegador no disponible:',
        error
      );
    }

    if (!texto) {
      texto = String(
        window.prompt(
          `Escribe el acta de voz del ${actor} (${momento}).`,
          actor === 'comprador'
            ? 'Confirmo que recibi la propiedad y autorizo la liberacion del pago.'
            : 'Confirmo que entregue la propiedad y acepto el cierre del negocio.'
        ) || ''
      ).trim();
    }

    if (!texto) return false;

    const estado = this._estadoComunidad();
    const propiedades = { ...(estado.propiedades || {}) };
    propiedades[clave] = 'VALIDADA';
    propiedades[claveTexto] = texto;
    if (parte === 'comprador' && momento === 'final') {
      propiedades.confirmacionComprador = true;
    }
    if (parte === 'vendedor' && momento === 'final') {
      propiedades.confirmacionVendedor = true;
    }
    this._actualizarEstadoLiberacionCustodia(propiedades);
    estado.propiedades = propiedades;
    this._guardarEstadoComunidad(estado);
    this.hablarDonEloy(
      `La palabra del ${actor} ya quedo registrada en el acta de voz ${momento}.`
    );
    this.abrirIntermediacionPropiedades();
    return true;
  },

  confirmarLiberacionCustodia(parte) {
    const estado = this._estadoComunidad();
    const propiedades = { ...(estado.propiedades || {}) };
    if (parte === 'comprador') propiedades.confirmacionComprador = true;
    if (parte === 'vendedor') propiedades.confirmacionVendedor = true;
    this._actualizarEstadoLiberacionCustodia(propiedades);
    estado.propiedades = propiedades;
    this._guardarEstadoComunidad(estado);
    if (propiedades.depositoEstado === 'LIBERADO_A_VENDEDOR') {
      this.hablarComo(
        'Angel',
        'Liberacion confirmada. El desembolso al vendedor y el recibo final ya estan autorizados.'
      );
    } else {
      this.hablarComo(
        'Angel',
        'Confirmacion registrada. Aun falta completar prueba notarial o la segunda conformidad.'
      );
    }
    return this.abrirIntermediacionPropiedades();
  },

  descargarReciboCustodia() {
    const propiedades = this._estadoComunidad().propiedades || {};
    const contenido = this._htmlReciboCustodia(propiedades);
    const blob = new Blob([contenido], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'recibo_liquidacion_melantia.html';
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
    this.hablarComo('Angel', 'Recibo de liquidacion listo para descarga.');
    return true;
  },

  async compartirReciboCustodia(canal = 'whatsapp') {
    const propiedades = this._estadoComunidad().propiedades || {};
    const resumen = this._textoReciboCustodia(propiedades);
    try {
      if (canal === 'compartir' && navigator.share) {
        await navigator.share({
          title: 'Recibo de liquidacion MELANTIA',
          text: resumen,
        });
        this.hablarComo('Angel', 'Recibo listo para compartirse.');
        return true;
      }
      if (canal === 'correo') {
        const asunto = encodeURIComponent('Recibo de liquidacion MELANTIA');
        const cuerpo = encodeURIComponent(resumen);
        window.open(`mailto:?subject=${asunto}&body=${cuerpo}`, '_self');
        this.hablarComo('Angel', 'He preparado el correo con el recibo final.');
        return true;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(resumen);
      }
      const whatsappURL = `https://wa.me/?text=${encodeURIComponent(resumen)}`;
      window.open(whatsappURL, '_blank', 'noopener');
      this.hablarComo(
        'Angel',
        'Abrire WhatsApp con el recibo final listo para enviarse.'
      );
      return true;
    } catch (error) {
      console.error('[Melantia] Error al compartir recibo:', error);
      this.hablarComo(
        'Angel',
        'No pude abrir el canal de envio del recibo final.'
      );
      return false;
    }
  },

  aceptarContratoCustodia() {
    const estado = this._estadoComunidad();
    const propiedades = { ...(estado.propiedades || {}) };
    propiedades.contratoCustodiaAceptado = true;
    propiedades.actaVozCompradorInicial = 'VALIDADA';
    propiedades.actaVozCompradorInicialTexto =
      propiedades.actaVozCompradorInicialTexto ||
      'Acepto depositar el dinero en custodia segura de MELANTIA.';
    propiedades.depositoEstado = propiedades.depositoEstado || 'EN_CUSTODIA';
    estado.propiedades = propiedades;
    this._guardarEstadoComunidad(estado);
    this.hablarComo(
      'Angel',
      'Contrato de custodia aceptado. El deposito queda protegido hasta que se cumpla la verificacion notarial y la doble conformidad.'
    );
    return this.abrirIntermediacionPropiedades();
  },

  aceptarContratoIntermediacion() {
    const estado = this._estadoComunidad();
    const propiedades = { ...(estado.propiedades || {}) };
    propiedades.contratoIntermediacionAceptado = true;
    propiedades.actaVozVendedorInicial = 'VALIDADA';
    propiedades.actaVozVendedorInicialTexto =
      propiedades.actaVozVendedorInicialTexto ||
      'Autorizo a MELANTIA a intermediar y custodiar este negocio.';
    estado.propiedades = propiedades;
    this._guardarEstadoComunidad(estado);
    this.hablarComo(
      'Dr. Pablo',
      'Autorizacion de venta e intermediacion registrada. El pago solo sera liberado tras la verificacion de la documentacion notarial.'
    );
    return this.abrirIntermediacionPropiedades();
  },

  anularTransaccionCustodia(parte) {
    const estado = this._estadoComunidad();
    const propiedades = { ...(estado.propiedades || {}) };
    if (parte === 'comprador') propiedades.solicitudAnulacionComprador = true;
    if (parte === 'vendedor') propiedades.solicitudAnulacionVendedor = true;
    if (
      propiedades.solicitudAnulacionComprador &&
      propiedades.solicitudAnulacionVendedor
    ) {
      propiedades.depositoEstado = 'DEVUELTO_INTEGRO';
      propiedades.evidenciaNotarial = 'ANULADA';
      propiedades.confirmacionComprador = false;
      propiedades.confirmacionVendedor = false;
      this.hablarDonEloy(
        'Vaya, parece que el trato no se dio. No se preocupen, aqui somos gente de honor. Procederemos a devolverle su dinero completo al comprador y la propiedad volvera a estar disponible en la plaza.'
      );
      this.hablarComo(
        'Angel',
        'Nota de credito generada. Hare la transferencia de retorno de forma inmediata y sin descuentos.'
      );
    } else {
      this.hablarDonEloy(
        'He registrado la anulacion. Para devolver el dinero completo necesito la confirmacion de ambas partes.'
      );
    }
    estado.propiedades = propiedades;
    this._guardarEstadoComunidad(estado);
    return this.abrirIntermediacionPropiedades();
  },

  abrirIntermediacionPropiedades() {
    const estado = this._estadoComunidad();
    const propiedades = estado.propiedades || {};
    const comision =
      (Number(propiedades.valorCierre || 0) *
        Number(propiedades.comisionPorcentaje || 5)) /
      100;
    const netoVendedor = Number(propiedades.valorCierre || 0) - comision;
    const evidenciaVista = propiedades.evidenciaNotarialArchivo
      ? propiedades.evidenciaNotarialMime.startsWith('image/')
        ? `<div style="margin-top:8px"><img src="${propiedades.evidenciaNotarialArchivo}" alt="Prueba notarial" style="max-width:100%;max-height:220px;border-radius:12px;border:1px solid #d8e5d9" /></div>`
        : `<div style="margin-top:8px;font-size:12px;color:#355246">Archivo cargado: ${this._escaparHtml(propiedades.evidenciaNotarialNombre || 'documento.pdf')}</div>`
      : '<div style="margin-top:8px;font-size:12px;color:#7a5a35">Todavia no se ha cargado la prueba notarial.</div>';
    const contratoCustodia = `Yo, ${this._escaparHtml(propiedades.comprador || 'Comprador')}, acepto depositar el valor de ${this._dinero(propiedades.valorCierre)} en las cuentas de custodia de MELANTIA. Entiendo que este dinero quedara resguardado y solo sera entregado al vendedor cuando yo confirme la recepcion del bien y se cargue en la App la evidencia fotografica de las escrituras firmadas ante Notario. Si por cualquier motivo legal o de mutuo acuerdo la venta no se concreta, MELANTIA me devolvera el 100% de mi dinero sin descuentos.`;
    const contratoIntermediacion = `Yo, ${this._escaparHtml(propiedades.vendedor || 'Vendedor')}, autorizo a MELANTIA a actuar como intermediario y veedor en la venta de mi propiedad o activo. Acepto que, al concretarse la venta con exito, la plataforma descuente automaticamente el ${Number(propiedades.comisionPorcentaje || 5)}% del valor total en concepto de comision por servicios de publicidad, verificacion legal y custodia segura. Reconozco que el pago se liberara a mi favor unicamente tras la verificacion de la documentacion notarial pertinente.`;
    const cuerpo = `
      <section style="display:grid;gap:10px;background:linear-gradient(180deg,#e8fff0 0%,#f7fff9 100%);border:1px solid #b9e2c3;border-radius:20px;padding:18px">
        <div style="display:grid;justify-items:center;gap:8px;text-align:center">
          <div style="width:88px;height:88px;border-radius:999px;background:#1f8f4e;color:#fff;display:grid;place-items:center;font-size:20px;font-weight:800;box-shadow:0 10px 24px rgba(31,143,78,.22)">OK</div>
          <strong style="font-size:26px;color:#17663a;letter-spacing:.04em">PAGO RESGUARDADO</strong>
          <div style="font-size:13px;color:#2f5e41">Certificado de Deposito en Garantia · MELANTIA</div>
        </div>
        <article style="background:#ffffff;border:1px solid #d1ead7;border-radius:14px;padding:14px"><strong>Angel · Finanzas</strong><div style="margin-top:6px">Atencion, socio vendedor. Confirmamos que hemos recibido el deposito total de ${this._dinero(propiedades.valorCierre)} por parte del comprador. El dinero se encuentra bajo la custodia segura de Melantia. Ya puede proceder con la firma en Notaria con total confianza.</div></article>
        <article style="background:#fff8ef;border:1px solid #e6cfb1;border-radius:14px;padding:14px"><strong>Don Eloy · La Palabra</strong><div style="margin-top:6px">Buenas noticias. La plata ya esta en nuestro poncho. Vaya tranquilo a firmar esos papeles, que aqui en Melantia somos los garantes de que su pago esta listo y esperando por usted. Una vez que suban la foto de la escritura, yo mismo doy la orden de soltar el dinero.</div></article>
        <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">
          <button onclick="window.MelantiaAsistente?.aceptarContratoCustodia()" style="min-width:240px;font-weight:800">IR A LA NOTARIA / SUBIR PRUEBAS</button>
        </div>
      </section>
      <section style="display:grid;gap:10px">
        <article style="background:#fff8ef;border:1px solid #e6cfb1;border-radius:14px;padding:12px"><strong>Acuerdo de Custodia Segura Melantia</strong><div style="margin-top:6px">${contratoCustodia}</div><div style="margin-top:10px;font-size:12px;color:#45627a">Estado: ${propiedades.contratoCustodiaAceptado ? 'ACEPTADO' : 'PENDIENTE'} · Actas de voz iniciales: comprador ${propiedades.actaVozCompradorInicial}, vendedor ${propiedades.actaVozVendedorInicial}</div></article>
        <article style="background:#fff8f3;border:1px solid #f0d6bd;border-radius:14px;padding:12px"><strong>Autorizacion de Venta e Intermediacion</strong><div style="margin-top:6px">${contratoIntermediacion}</div><div style="margin-top:10px;font-size:12px;color:#76553a">Estado: ${propiedades.contratoIntermediacionAceptado ? 'ACEPTADO' : 'PENDIENTE'}</div></article>
        <article style="background:#eefaf0;border:1px solid #cfe7d4;border-radius:14px;padding:12px"><strong>Regla de oro · Devolucion total</strong><div style="margin-top:6px">Si el negocio no se firma, el dinero se devuelve integro al comprador. Trigger de devolucion: BOTON_ANULAR + CONFIRMACION_AMBAS_PARTES.</div></article>
      </section>
      <section style="display:grid;gap:10px">
        <article style="background:#fff8ef;border:1px solid #e6cfb1;border-radius:14px;padding:12px"><strong>Fase 1 · Deposito en garantia</strong><div style="margin-top:6px">El comprador transfiere el valor total del negocio a la cuenta recaudadora de MELANTIA. Estado actual: ${this._escaparHtml(String(propiedades.depositoEstado || 'EN_CUSTODIA'))}</div></article>
        <article style="background:#f7fcff;border:1px solid #cfe3f6;border-radius:14px;padding:12px"><strong>Fase 2 · Verificacion notarial</strong><div style="margin-top:6px">Se exige foto nitida del acta o escritura nueva con firma del comprador, firma del vendedor y sello de notaria. Estado: ${this._escaparHtml(String(propiedades.evidenciaNotarial || 'PENDIENTE_CARGA'))}.</div><div style="margin-top:10px;font-size:12px;color:#355246">Documento: ${this._escaparHtml(propiedades.evidenciaNotarialNombre || 'Sin archivo cargado')}</div>${evidenciaVista}</article>
        <article style="background:#eef7ff;border:1px solid #c9dcf7;border-radius:14px;padding:12px"><strong>Fase 3 · Visto bueno doble</strong><div style="margin-top:6px">Comprador: ${propiedades.confirmacionComprador ? 'ACEPTADO' : 'PENDIENTE'}. Vendedor: ${propiedades.confirmacionVendedor ? 'ACEPTADO' : 'PENDIENTE'}. MELANTIA no libera fondos si falta alguna conformidad.</div></article>
        <article style="background:#fff4f0;border:1px solid #efc8b7;border-radius:14px;padding:12px"><strong>Fase 4 · Desembolso y liquidacion</strong><div style="margin-top:6px">Total deposito ${this._dinero(propiedades.valorCierre)} menos ${Number(propiedades.comisionPorcentaje || 5)}% de comision ${this._dinero(comision)} igual a ${this._dinero(netoVendedor)} para el vendedor.</div></article>
      </section>
      <section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px">
        <article style="background:#fff;border:1px solid #d8e5d9;border-radius:14px;padding:12px"><strong>Propiedad</strong><div style="margin-top:6px">${this._escaparHtml(String(propiedades.propiedad || 'Finca no definida'))}</div></article>
        <article style="background:#fff;border:1px solid #d8e5d9;border-radius:14px;padding:12px"><strong>Zona notarial</strong><div style="margin-top:6px">${this._escaparHtml(String(propiedades.zonaNotaria || 'No registrada'))}</div></article>
        <article style="background:#fff;border:1px solid #d8e5d9;border-radius:14px;padding:12px"><strong>Comision MELANTIA</strong><div style="margin-top:6px">${this._dinero(comision)}</div></article>
        <article style="background:#fff;border:1px solid #d8e5d9;border-radius:14px;padding:12px"><strong>Centro de Mando</strong><div style="margin-top:6px">Alerta activa: Transaccion en Custodia. Trigger de liberacion: FOTO_NOTARIA + ACEPTACION_COMPRADOR + ACEPTACION_VENDEDOR.</div></article>
      </section>
      <section style="display:grid;gap:10px">
        <article style="background:#f4f8ff;border:1px solid #cad7f7;border-radius:14px;padding:12px"><strong>Triple blindaje</strong><div style="margin-top:6px">Texto, fotos notariales y audios quedan guardados como prueba del negocio. La voz funciona como firma humana y tecnica del cierre.</div></article>
        <article style="background:#eef7ff;border:1px solid #c9dcf7;border-radius:14px;padding:12px"><strong>Actas de voz</strong><div style="margin-top:6px">Comprador inicial: ${propiedades.actaVozCompradorInicial}. Vendedor inicial: ${propiedades.actaVozVendedorInicial}. Comprador final: ${propiedades.actaVozCompradorFinal}. Vendedor final: ${propiedades.actaVozVendedorFinal}.</div><div style="margin-top:8px;font-size:12px;color:#355246">Comprador final: ${this._escaparHtml(propiedades.actaVozCompradorFinalTexto || 'Sin transcripcion')}<br>Vendedor final: ${this._escaparHtml(propiedades.actaVozVendedorFinalTexto || 'Sin transcripcion')}</div></article>
        <article style="background:#fff8ef;border:1px solid #e6cfb1;border-radius:14px;padding:12px"><strong>Acta de Liquidacion de Negocio Rural - Melantia</strong><div style="margin-top:6px">ID de Transaccion: #MR-2026-00X. Precio de venta acordado: ${this._dinero(propiedades.valorCierre)}. Intermediacion Melantia (5%): - ${this._dinero(comision)}. Monto neto transferido al vendedor: ${this._dinero(netoVendedor)}. Anexos digitales: foto de escritura notariada, audios de aceptacion y GPS de la notaria.</div></article>
      </section>
      <section style="display:grid;gap:10px">
        <article style="background:#fff8ef;border:1px solid #e6cfb1;border-radius:14px;padding:12px"><strong>Don Eloy · Mediador</strong><div style="margin-top:6px">Escucheme bien, socio: Melantia es como ese amigo de confianza que guarda el dinero en su poncho mientras ustedes firman los papeles. Si al final no hay firma, el dinero regresa a quien lo puso.</div></article>
        <article style="background:#f6f3ff;border:1px solid #d9cdf5;border-radius:14px;padding:12px"><strong>Dr. Pablo · Legal</strong><div style="margin-top:6px">La foto de la escritura ha sido recibida. Verifico que los sellos notariales coincidan para proceder con la liberacion de los fondos.</div></article>
        <article style="background:#fff8ef;border:1px solid #e6cfb1;border-radius:14px;padding:12px"><strong>Angel · Finanzas</strong><div style="margin-top:6px">Transaccion completada. Se ha transferido el valor neto al vendedor y se ha registrado el ${Number(propiedades.comisionPorcentaje || 5)}% de comision por intermediacion de Melantia.</div></article>
      </section>
      <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px">
        <button onclick="window.MelantiaAsistente?.aceptarContratoCustodia()">Aceptar custodia</button>
        <button onclick="window.MelantiaAsistente?.aceptarContratoIntermediacion()">Aceptar intermediacion</button>
        <button onclick="window.MelantiaAsistente?.cargarPruebaNotarial()">Cargar prueba notarial</button>
        <button onclick="window.MelantiaAsistente?.registrarActaVoz('comprador','final')">Voz comprador final</button>
        <button onclick="window.MelantiaAsistente?.registrarActaVoz('vendedor','final')">Voz vendedor final</button>
        <button onclick="window.MelantiaAsistente?.confirmarLiberacionCustodia('comprador')">Confirmar comprador</button>
        <button onclick="window.MelantiaAsistente?.confirmarLiberacionCustodia('vendedor')">Confirmar vendedor</button>
        <button onclick="window.MelantiaAsistente?.verReciboCustodia()">Ver recibo</button>
        <button onclick="window.MelantiaAsistente?.descargarReciboCustodia()">Descargar recibo</button>
        <button onclick="window.MelantiaAsistente?.compartirReciboCustodia('whatsapp')">WhatsApp</button>
        <button onclick="window.MelantiaAsistente?.compartirReciboCustodia('correo')">Correo</button>
        <button onclick="window.MelantiaAsistente?.anularTransaccionCustodia('comprador')">Anular comprador</button>
        <button onclick="window.MelantiaAsistente?.anularTransaccionCustodia('vendedor')">Anular vendedor</button>
        <button onclick="window.MelantiaAsistente?.abrirItemComunidad('legal')">Revision Dr. Pablo</button>
        <button onclick="window.MelantiaAsistente?.abrirNegociosConDonEloy()">Volver a Negocios</button>
      </div>`;
    this._abrirPanel(
      'Don Eloy · Transaccion Protegida MELANTIA',
      'Sistema de custodia digital para propiedades, tierras y semovientes con evidencia notarial, doble conformidad y comision garantizada.',
      cuerpo,
      'Don Eloy'
    );
    this.hablarDonEloy(
      'Amigos, estamos ante un negocio importante. Melantia esta aqui para que el vendedor reciba su pago justo y el comprador reciba su tierra sin problemas legales.'
    );
    return true;
  },

  async _cargarResumenOperacion() {
    const idLote = await window.FabrizzioAsesor?._resolverLoteActual?.();
    let tablero = null;
    let loteActual = null;
    let historial = [];
    let clima = null;

    if (window.GestorGranjasMelantia?._cargarTablero) {
      try {
        tablero = await window.GestorGranjasMelantia._cargarTablero();
      } catch (error) {
        console.warn('[Melantia] No pude cargar el tablero resumido:', error);
      }
    }

    if (tablero?.lotes?.length) {
      loteActual =
        tablero.lotes.find((item) => String(item.id_lote) === String(idLote)) ||
        tablero.lotes.find((item) => item.tipo_lote === 'agricola') ||
        tablero.lotes[0] ||
        null;
    }

    if (idLote && typeof window.obtenerExpedienteRuralMelantia === 'function') {
      try {
        historial =
          (await window.obtenerExpedienteRuralMelantia(idLote, 3)) || [];
      } catch (error) {
        console.warn('[Melantia] No pude leer el expediente rural:', error);
      }
    }

    if (idLote && typeof window.actualizarClimaRuralMelantia === 'function') {
      try {
        clima = await window.actualizarClimaRuralMelantia(idLote);
      } catch (error) {
        console.warn(
          '[Melantia] No pude refrescar el clima para el resumen:',
          error
        );
      }
    }

    const ultimoCaso = historial[0] || null;
    const areaTotal = Number(
      tablero?.total_area_ha || loteActual?.area_ha || 0
    );
    const animales = Number(tablero?.total_animales || 0);
    let scoreHuella = 0;
    if (areaTotal > 3) scoreHuella += 1;
    if (areaTotal > 8) scoreHuella += 1;
    if (animales > 15) scoreHuella += 1;
    if (animales > 40) scoreHuella += 1;
    if (
      ultimoCaso?.estado_seguimiento &&
      ultimoCaso.estado_seguimiento !== 'APLICADO'
    ) {
      scoreHuella += 1;
    }

    const huella =
      scoreHuella >= 4
        ? {
            nivel: 'Alta',
            color: '#8b1e1e',
            detalle:
              'Estimación rápida: la operación ya necesita más disciplina de registro para bajar consumo oculto y riesgo operativo.',
          }
        : scoreHuella >= 2
          ? {
              nivel: 'Media',
              color: '#8a6300',
              detalle:
                'Estimación rápida: la finca está en transición. Registrar tareas y seguimiento ayuda a reducir desperdicio y corregir a tiempo.',
            }
          : {
              nivel: 'Baja',
              color: '#1f6b3a',
              detalle:
                'Estimación rápida: la escala operativa y el registro actual sugieren una huella contenida y controlable.',
            };

    return {
      tablero,
      loteActual,
      idLote,
      historial,
      ultimoCaso,
      clima,
      huella,
      saludApp:
        typeof ReporteLunes !== 'undefined' &&
        typeof ReporteLunes._leerSalud === 'function'
          ? ReporteLunes._leerSalud()
          : {},
    };
  },

  _abrirPanel(titulo, subtitulo, cuerpo, experto = 'Melantia') {
    const panel = document.getElementById('panel-novedades');
    if (!panel) return false;
    if (typeof StaffController !== 'undefined') {
      StaffController.activarPersonaje(experto);
    }
    panel.style.maxWidth = '780px';
    panel.innerHTML = `
      <div class="novedad-card" data-experto="${experto}" style="display:grid;gap:12px;max-height:84vh;overflow:auto">
        <div>
          <p class="novedad-n1" style="margin:0">${titulo}</p>
          <p class="novedad-n2" style="margin:6px 0 0">${subtitulo}</p>
        </div>
        ${cuerpo}
        <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px">
          <button onclick="document.getElementById('panel-novedades').style.display='none'">Cerrar</button>
        </div>
      </div>`;
    panel.style.display = 'block';
    return true;
  },

  async mostrarEstadoFinca() {
    const resumen = await this._cargarResumenOperacion();
    const lote = resumen.loteActual;
    const nombreLote =
      lote?.nombre_lote || lote?.nombre || resumen.idLote || 'Sin lote activo';
    const ultimo = resumen.ultimoCaso;
    const cuerpo = `
      <section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px">
        <article style="background:#f5fffe;border:1px solid #cfeeed;border-radius:14px;padding:12px"><strong>Lote actual</strong><div style="margin-top:6px">${String(nombreLote).replace(/</g, '&lt;')}</div></article>
        <article style="background:#f5fffe;border:1px solid #cfeeed;border-radius:14px;padding:12px"><strong>Lotes activos</strong><div style="margin-top:6px">${Number(resumen.tablero?.total_lotes || 0)} registrados</div></article>
        <article style="background:#f5fffe;border:1px solid #cfeeed;border-radius:14px;padding:12px"><strong>Área total</strong><div style="margin-top:6px">${Number(resumen.tablero?.total_area_ha || lote?.area_ha || 0).toFixed(2)} ha</div></article>
        <article style="background:#f5fffe;border:1px solid #cfeeed;border-radius:14px;padding:12px"><strong>Huella operativa</strong><div style="margin-top:6px;color:${resumen.huella.color};font-weight:700">${resumen.huella.nivel}</div></article>
      </section>
      <section style="background:#eefbfa;border:1px solid #bde9e4;border-radius:14px;padding:12px">
        <strong>Sostenibilidad y trazabilidad</strong>
        <div style="margin-top:6px">${resumen.historial.length} registro(s) recientes en expediente rural. ${ultimo ? `Último síntoma observado: ${String(ultimo.sintoma_observado || 'sin novedad').replace(/</g, '&lt;')}.` : 'Aún no hay expediente agrícola reciente para este lote.'}</div>
      </section>
      <section style="background:#fff;border:1px solid #d8e5d9;border-radius:14px;padding:12px">
        <strong>Huella de carbono - estimación rápida</strong>
        <div style="margin-top:6px">${resumen.huella.detalle}</div>
      </section>
      <section style="background:#fff9ef;border:1px solid #ead4aa;border-radius:14px;padding:12px">
        <strong>El Tesoro de los Abuelos (Memoria Viva)</strong>
        <div style="margin-top:6px">La sostenibilidad tambien se cultiva con memoria. Este Arca Digital resguarda saberes de salud, lengua, historias y reconocimiento a los mayores.</div>
      </section>
      <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px">
        <button onclick="window.MelantiaAsistente?.abrirTesoroAbuelosSostenibilidad()">Abrir Tesoro de los Abuelos</button>
        <button onclick="window.MelantiaAsistente?.abrirCatalogoFormacion()">Quiero aprender</button>
        <button onclick="window.MelantiaAsistente?.explicarRegistro()">Por qué registrar</button>
        <button onclick="window.GestorGranjasMelantia?.abrirTableroControl()">Abrir finca</button>
      </div>`;
    this._abrirPanel(
      'Melantia · Resumen de tu finca',
      'Lectura rápida de sostenibilidad, trazabilidad y huella operativa estimada.',
      cuerpo
    );
    this.hablar(
      `Tu finca tiene ${Number(resumen.tablero?.total_lotes || 0)} lotes activos. La huella operativa estimada hoy es ${resumen.huella.nivel.toLowerCase()}. ${resumen.huella.detalle}`
    );
    return true;
  },

  abrirTesoroAbuelosSostenibilidad() {
    const plaza = this._estadoDonEloyPlaza();
    const tesoros = plaza.tesoroAbuelos || [];
    const guardianTop = (plaza.guardianMemoria?.destacados || [])[0] || null;
    const cuerpo = `
      <section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">
        <article style="background:#f3fff5;border:1px solid #cfead3;border-radius:14px;padding:12px"><strong>1. El Herbario de Saberes</strong><div style="margin-top:6px">Salud y naturaleza: plantas, siembra por luna y remedios de los mayores. Alimenta al Asistente Preventivo de Salud y al Asistente Tecnico Rural.</div></article>
        <article style="background:#f5fbff;border:1px solid #cfe3f6;border-radius:14px;padding:12px"><strong>2. Voces de la Tierra</strong><div style="margin-top:6px">Lenguas y dialectos: diccionarios dinamicos por etnia (Quichua, Shuar, Tsafiki y variantes detectadas) para traduccion progresiva de la app.</div></article>
        <article style="background:#fff8ef;border:1px solid #e6cfb1;border-radius:14px;padding:12px"><strong>3. El Relicario de Historias</strong><div style="margin-top:6px">Folklore olvidado: audios originales + transcripcion IA. Don Eloy puede extraer de aqui la historia del dia.</div></article>
        <article style="background:#fff7f2;border:1px solid #f0d6bd;border-radius:14px;padding:12px"><strong>4. Galeria de Guardianes</strong><div style="margin-top:6px">Reconocimiento de honor a los mayores. Titulo: Guardian Mayor de Melantia. Los padrinos suman puntos por cada tesoro registrado.</div></article>
      </section>
      <section style="background:#fff;border:1px solid #e7e3da;border-radius:14px;padding:12px;display:grid;gap:8px">
        <strong>Don Eloy en Sostenibilidad</strong>
        <div>"Pase, socio, mire este tesoro. Aqui no guardamos oro ni plata, aqui guardamos lo que de verdad vale: la palabra de nuestros mayores. Cada audio que usted ve aqui es una raiz que sostiene a Melantia."</div>
      </section>
      <section style="background:#fffaf3;border:1px solid #ead4aa;border-radius:14px;padding:12px;display:grid;gap:6px">
        <strong>Estado actual del Arca Digital</strong>
        <div>Tesoros registrados: ${this._escaparHtml(String(tesoros.length))}.</div>
        <div>${guardianTop ? `Guardian destacado: ${this._escaparHtml(guardianTop.nombre)} con ${this._escaparHtml(String(guardianTop.total))} aporte(s).` : 'Aun no hay Guardian destacado.'}</div>
      </section>
      <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px">
        <button onclick="window.MelantiaAsistente?.grabarTesoroAbuelosDonEloy()">Grabar Tesoro</button>
        <button onclick="window.MelantiaAsistente?.verMapaSabiduriaDonEloy()">Ver Mapa de Sabiduria</button>
        <button onclick="window.MelantiaAsistente?.compartirHallazgoAncestralDonEloy()">Compartir Hallazgo</button>
        <button onclick="window.MelantiaAsistente?.abrirAsistentePreventivoSalud()">Conectar con Salud</button>
        <button onclick="window.MelantiaAsistente?.abrirComunidadVirtual()">Ir a Comunidad Virtual</button>
      </div>`;
    this._abrirPanel(
      'Sostenibilidad y Proyectos · El Tesoro de los Abuelos',
      'Arca Digital de memoria viva para sostener cultura, salud comunitaria y aprendizaje intercultural.',
      cuerpo,
      'Don Eloy'
    );
    this.hablarDonEloy(
      'Pase, socio. Aqui la sostenibilidad se mide tambien por la memoria viva. Cada tesoro guardado fortalece la raiz de Melantia.'
    );
    return true;
  },

  abrirCatalogoFormacion() {
    const cuerpo = `
      <section style="display:grid;gap:10px">
        <article style="background:#f5fffe;border:1px solid #cfeeed;border-radius:14px;padding:12px"><strong>Escuela de Campo MELANTIA</strong><div style="margin-top:6px">Cursos practicos para suelo, cultivo, manejo regenerativo y decisiones de campo.</div></article>
        <article style="background:#f5fffe;border:1px solid #cfeeed;border-radius:14px;padding:12px"><strong>Cursos tecnicos</strong><div style="margin-top:6px">Rutas formativas con examen accesible, certificacion y descarga unica para estudio offline.</div></article>
        <article style="background:#f5fffe;border:1px solid #cfeeed;border-radius:14px;padding:12px"><strong>Practicas regenerativas</strong><div style="margin-top:6px">Cobertura del suelo, agua, biodiversidad y mejora continua con trazabilidad.</div></article>
      </section>
      <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px">
        <button onclick="window.EscuelaCampoMelantia?.abrirPanel()">Entrar a Escuela</button>
        <button onclick="window.EscuelaCampoMelantia?.abrirBovedaCertificados()">Mi Bóveda</button>
        <button onclick="window.MelantiaAsistente?.abrirComunidadVirtual()">Mi Comunidad Virtual</button>
        <button onclick="window.StaffController?.abrirMelantia?.()">Guía Melantia</button>
      </div>`;
    this._abrirPanel(
      'Melantia · Escuela de Campo MELANTIA',
      'Rutas rapidas para aprender, certificar habilidades y fortalecer practicas regenerativas desde el centro de mando.',
      cuerpo
    );
    this.hablar(
      'Abri la Escuela de Campo Melantia para que avances paso a paso y certifiques tus nuevas habilidades con sello institucional.'
    );
    return true;
  },

  abrirComunidadVirtual() {
    const estado = this._estadoComunidad();
    this.ejecutarProgramacionDonEloyDiaria().catch((error) => {
      console.warn(
        '[Melantia] No pude ejecutar la programacion de Don Eloy:',
        error
      );
    });
    if (!estado.primeraBienvenidaHecha) {
      estado.primeraBienvenidaHecha = true;
      this._guardarEstadoComunidad(estado);
      this.hablarDonEloy(
        'Pase adelante, socio, bienvenido a nuestra plaza. Aquí nos manejamos con la palabra de hombre y mujer de campo. Para que todos nos llevemos bien, solo le pido tres cositas: honestidad en el trato, respeto al vecino y mano amiga con quien necesite apoyo.'
      );
    } else {
      this.hablarDonEloy(
        `Buen día, socio. Soy Don Eloy. Aquí en la plaza virtual hoy tenemos ${estado.ofertasNuevas} ofertas nuevas de ganado y ${estado.alertaClima.toLowerCase()}. Quedó abierto también mi tablón comunitario para que revise avisos, prestigio y oportunidades.`
      );
    }
    const cuerpo = `
      <section style="background:#fff8ef;border:1px solid #e6cfb1;border-radius:16px;padding:14px;display:grid;gap:10px">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap">
          <div>
            <strong>Don Eloy · Moderador y anfitrion</strong>
            <div style="margin-top:6px">La voz serena de la plaza virtual. Da la bienvenida, mantiene el respeto y cuida la palabra entre socios.</div>
          </div>
          <span style="background:#f4e3ca;color:#7a4f20;border-radius:999px;padding:6px 10px;font-size:12px;font-weight:700">Sombrero de palabra</span>
        </div>
        <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px">
          <button onclick="window.MelantiaAsistente?.abrirCodigoEticaComunidad()">Codigo de Etica</button>
          <button onclick="window.MelantiaAsistente?.abrirTablonDonEloy()">Tablon de Don Eloy</button>
          <button onclick="window.MelantiaAsistente?.grabarTesoroAbuelosDonEloy()">Mision: Grabar Tesoro</button>
          <button onclick="window.MelantiaAsistente?.verMapaSabiduriaDonEloy()">Mapa de sabiduria</button>
          <button onclick="window.MelantiaAsistente?.registrarAprendizajeLinguisticoDonEloy()">Ensenar palabra</button>
          <button onclick="window.MelantiaAsistente?.validarAprendizajeLinguisticoDonEloy()">Validar lengua (Padrino)</button>
          <button onclick="window.MelantiaAsistente?.publicarNoticieroDonEloy()">Noticiero de la plaza</button>
          <button onclick="window.MelantiaAsistente?.contarHistoriaDonEloy()">Hora del cuento</button>
          <button onclick="window.MelantiaAsistente?.abrirNegociosConDonEloy()">Negocios con palabra</button>
        </div>
      </section>
      <section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">
        <article style="background:#fff8ef;border:1px solid #e6cfb1;border-radius:14px;padding:12px;display:grid;gap:10px">
          <div>
            <strong>Don Eloy</strong>
            <div style="margin-top:6px">Moderador de voz, guardian del Codigo de Etica y anfitrion del Tablon comunitario.</div>
          </div>
          <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px">
            <button onclick="window.MelantiaAsistente?.abrirTablonDonEloy()">Abrir</button>
          </div>
        </article>
        <article style="background:#f7fcff;border:1px solid #cfe3f6;border-radius:14px;padding:12px;display:grid;gap:10px">
          <div>
            <strong>Ciudadano Rural</strong>
            <div style="margin-top:6px">Perfil con prestigio, sello de confianza y reconocimiento comunitario por cumplir su palabra.</div>
          </div>
          <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px">
            <button onclick="window.MelantiaAsistente?.abrirItemComunidad('ciudadano')">Abrir</button>
          </div>
        </article>
        <article style="background:#fff8f3;border:1px solid #f0d6bd;border-radius:14px;padding:12px;display:grid;gap:10px">
          <div>
            <strong>Asesoria Legal (Dr. Pablo)</strong>
            <div style="margin-top:6px">Consultas legales rurales, orientacion documental y acompanamiento inicial para situaciones de riesgo o tramite.</div>
          </div>
          <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px">
            <button onclick="window.MelantiaAsistente?.abrirItemComunidad('legal')">Abrir</button>
          </div>
        </article>
        <article style="background:#f7fcff;border:1px solid #cfe3f6;border-radius:14px;padding:12px;display:grid;gap:10px">
          <div>
            <strong>Noticias y Precios Referenciales</strong>
            <div style="margin-top:6px">Lectura rapida de novedades del territorio y precios orientativos para comprar, vender y negociar mejor.</div>
          </div>
          <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px">
            <button onclick="window.MelantiaAsistente?.abrirItemComunidad('noticias')">Abrir</button>
          </div>
        </article>
      </section>
      <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px">
        <button onclick="window.MelantiaAsistente?.abrirCodigoEticaComunidad()">${this._escaparHtml(this.terminoModuloDonEloy('comunidad', 'Palabra de Socio'))}</button>
        <button onclick="window.MelantiaAsistente?.abrirContratoPadrinoMelantia()">Contrato del Padrino</button>
        <button onclick="window.MelantiaAsistente?.abrirMisionesPadrinoPorValidar()">Misiones por Validar</button>
        <button onclick="window.MelantiaAsistente?.abrirTablonDonEloy()">Tablon</button>
        <button onclick="window.MelantiaAsistente?.saludoInterculturalDonEloy()">Saludo intercultural</button>
        <button onclick="window.MelantiaAsistente?.grabarTesoroAbuelosDonEloy()">Grabar tesoro</button>
        <button onclick="window.MelantiaAsistente?.verMapaSabiduriaDonEloy()">Guardián de la memoria</button>
        <button onclick="window.MelantiaAsistente?.registrarAprendizajeLinguisticoDonEloy()">Ensenar nueva palabra</button>
        <button onclick="window.MelantiaAsistente?.registrarAporteAnonimoDonEloy()">Aporte anonimo</button>
        <button onclick="window.MelantiaAsistente?.abrirAsistentePreventivoSalud()">Salud preventiva</button>
        <button onclick="window.MelantiaAsistente?.abrirItemComunidad('legal')">Asesoria Legal</button>
        <button onclick="window.MelantiaAsistente?.abrirItemComunidad('ciudadano')">Ciudadano Rural</button>
        <button onclick="window.MelantiaAsistente?.abrirItemComunidad('noticias')">Noticias y Precios</button>
      </div>`;
    this._abrirPanel(
      'Don Eloy · Mi Comunidad Virtual',
      'Plaza de confianza, palabra y orientacion comunitaria con acompanamiento de voz y moderacion sabia.',
      cuerpo,
      'Don Eloy'
    );
    return true;
  },

  abrirCodigoEticaComunidad() {
    const cuerpo = `
      <section style="display:grid;gap:10px">
        <article style="background:#fff8ef;border:1px solid #e6cfb1;border-radius:14px;padding:12px"><strong>Honestidad en el trato</strong><div style="margin-top:6px">Si usted vende algo o ofrece un servicio, que sea legal y de buena calidad. Aqui la palabra vale mas que el papel.</div></article>
        <article style="background:#fff8ef;border:1px solid #e6cfb1;border-radius:14px;padding:12px"><strong>Respeto al vecino</strong><div style="margin-top:6px">Podemos no estar de acuerdo, pero aqui no hay espacio para insultos ni peleas. Somos una familia productiva.</div></article>
        <article style="background:#fff8ef;border:1px solid #e6cfb1;border-radius:14px;padding:12px"><strong>Mano amiga</strong><div style="margin-top:6px">Si alguien pregunta algo que usted sabe, comparta su conocimiento. Hoy por ellos, mañana por nosotros.</div></article>
      </section>
      <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px">
        <button onclick="window.MelantiaAsistente?.aceptarCodigoEticaComunidad()">Aceptar palabra de socio</button>
        <button onclick="window.MelantiaAsistente?.abrirComunidadVirtual()">Volver a Comunidad</button>
      </div>`;
    this._abrirPanel(
      'Don Eloy · Codigo de Etica',
      'La palabra de socio que sostiene el respeto, la confianza y la colaboracion dentro de la plaza virtual.',
      cuerpo,
      'Don Eloy'
    );
    this.hablarDonEloy(
      'Pase adelante, socio, bienvenido a nuestra plaza. Aquí nos manejamos con la palabra de hombre y mujer de campo. Para que todos nos llevemos bien, solo le pido tres cositas: honestidad en el trato, respeto al vecino y mano amiga con quien necesite apoyo.'
    );
    return true;
  },

  aceptarCodigoEticaComunidad() {
    const estado = this._estadoComunidad();
    estado.codigoAceptado = true;
    this._guardarEstadoComunidad(estado);
    this.hablarDonEloy(
      'Así me gusta, socio. Su palabra queda registrada en esta plaza. Bienvenido a una comunidad donde el respeto y el cumplimiento abren puertas.'
    );
    return this.abrirComunidadVirtual();
  },

  abrirContratoPadrinoMelantia() {
    const estado = this._estadoComunidad();
    const padrino = this._estadoPadrino(estado);
    const estadoContrato = padrino.contratoAceptado
      ? `ACEPTADO · ${new Date(padrino.contratoAceptadoEn || Date.now()).toLocaleString('es-EC')}`
      : 'PENDIENTE';
    const cuerpo = `
      <section style="display:grid;gap:10px">
        <article style="background:#fff8ef;border:1px solid #e6cfb1;border-radius:14px;padding:12px"><strong>1. Rol del Padrino</strong><div style="margin-top:6px">Usted guia a su comunidad para uso correcto de la App, pago puntual de cuotas y aportes veraces al Tesoro de los Abuelos.</div></article>
        <article style="background:#fff4f0;border:1px solid #efc8b7;border-radius:14px;padding:12px"><strong>2. Guardian de la verdad</strong><div style="margin-top:6px">Cada audio debe revisarse con criterio real. Aprobar contenido inventado activa penalizaciones y riesgo de expulsion del sistema de afiliados.</div></article>
        <article style="background:#f7fcff;border:1px solid #cfe3f6;border-radius:14px;padding:12px"><strong>3. Gestion de Alcancia Navidena</strong><div style="margin-top:6px">El Padrino explica que Melantios son ahorro. Si un socio incumple pagos del ciclo, su desbloqueo se bloquea.</div></article>
        <article style="background:#f5fbf5;border:1px solid #d3e7d3;border-radius:14px;padding:12px"><strong>4. Beneficios del Padrino</strong><div style="margin-top:6px">Comision en cascada por Melantios legitimos y bono especial de liderazgo si su grupo llega completo a diciembre.</div></article>
        <article style="background:#fff;border:1px solid #dbe7de;border-radius:14px;padding:12px"><strong>Estado de contrato:</strong><div style="margin-top:6px">${this._escaparHtml(estadoContrato)}.</div></article>
      </section>
      <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px">
        <button onclick="window.MelantiaAsistente?.aceptarContratoPadrinoMelantia()">☑ Aceptar contrato del Padrino</button>
        <button onclick="window.MelantiaAsistente?.abrirMisionesPadrinoPorValidar()">Misiones por Validar</button>
        <button onclick="window.MelantiaAsistente?.abrirComunidadVirtual()">Volver a Comunidad</button>
      </div>`;
    this._abrirPanel(
      'Sistema de Afiliados · Contrato del Padrino',
      'Compromiso digital de liderazgo, lealtad y filtro anti-fraude para proteger la economia Melantia.',
      cuerpo,
      'Don Eloy'
    );
    this.hablarDonEloy(
      'Mire, Padrino, este no es un papel cualquiera. Usted es quien pone orden y cuida que la verdad camine primero en Melantia.'
    );
    return true;
  },

  aceptarContratoPadrinoMelantia() {
    const confirmar = window.confirm(
      'Confirmo que acepto el Contrato del Padrino Melantia y sus responsabilidades de validacion anti-fraude.'
    );
    if (!confirmar) {
      this.hablarDonEloy(
        'Sin problema. Revise el compromiso con calma y cuando este listo lo aceptamos.'
      );
      return false;
    }
    const estado = this._estadoComunidad();
    const padrino = this._estadoPadrino(estado);
    padrino.contratoAceptado = true;
    padrino.contratoAceptadoEn = new Date().toISOString();
    this._guardarEstadoComunidad(estado);
    this.hablarDonEloy(
      'Contrato aceptado. Desde ahora usted puede invitar socios y validar misiones como Guardian de la Verdad.'
    );
    return this.abrirMisionesPadrinoPorValidar();
  },

  invitarSocioPadrinoMelantia() {
    const estado = this._estadoComunidad();
    const padrino = this._estadoPadrino(estado);
    if (!padrino.contratoAceptado) {
      this.hablarDonEloy(
        'Antes de invitar su primer socio, debe aceptar digitalmente el Contrato del Padrino.'
      );
      this.abrirContratoPadrinoMelantia();
      return {
        permitido: false,
        razon: 'CONTRATO_PADRINO_PENDIENTE',
      };
    }

    const nombre = String(
      window.prompt('Nombre del socio a invitar.', 'Socio nuevo') || ''
    ).trim();
    if (!nombre) return false;
    const telefono = String(
      window.prompt('Telefono de contacto del socio invitado.', '') || ''
    ).trim();

    padrino.invitacionesSocios = [
      {
        id: this._crearIdSalud('invita'),
        nombre,
        telefono,
        estado: 'INVITADO',
        fecha: new Date().toISOString(),
      },
      ...padrino.invitacionesSocios,
    ].slice(0, 120);
    this._guardarEstadoComunidad(estado);
    this.hablarDonEloy(
      `Invitacion registrada para ${nombre}. Asi se construye una red cumplida y sin viveza criolla.`
    );
    return this.abrirMisionesPadrinoPorValidar();
  },

  resolverMisionPadrinoTesoro(idMision, decision = 'APROBADO') {
    const plaza = this._estadoDonEloyPlaza();
    const estado = this._estadoComunidad();
    const padrino = this._estadoPadrino(estado);
    const decisionNormalizada =
      this._normalizar(decision) === 'rechazado' ? 'RECHAZADO' : 'APROBADO';
    const razon = String(
      window.prompt(
        decisionNormalizada === 'APROBADO'
          ? 'Observacion de validacion (opcional).'
          : 'Motivo de rechazo (obligatorio para auditoria).',
        decisionNormalizada === 'APROBADO'
          ? 'Aporte veraz validado por Padrino.'
          : 'Contenido no verificable o inconsistente.'
      ) || ''
    ).trim();

    if (decisionNormalizada === 'RECHAZADO' && !razon) {
      this.hablarDonEloy(
        'Para rechazar una mision necesitamos un motivo claro en la auditoria.'
      );
      return false;
    }

    let encontrado = false;
    const tesoroActualizado = (plaza.tesoroAbuelos || []).map((item) => {
      if (String(item.id) !== String(idMision)) return item;
      encontrado = true;
      return {
        ...item,
        estadoRevisionPadrino: decisionNormalizada,
        revisionPadrinoEn: new Date().toISOString(),
        revisionPadrinoPor: 'Padrino Melantia',
        observacionRevisionPadrino: razon,
        bloqueadoParaMelantios: decisionNormalizada === 'RECHAZADO',
      };
    });

    if (!encontrado) {
      this.hablarDonEloy('No encontre esa mision en el tablero de validacion.');
      return false;
    }

    this._guardarEstadoDonEloyPlaza({ tesoroAbuelos: tesoroActualizado });

    if (decisionNormalizada === 'APROBADO') {
      padrino.misionesValidadas += 1;
    } else {
      padrino.misionesRechazadas += 1;
    }
    this._guardarEstadoComunidad(estado);

    this.hablarDonEloy(
      decisionNormalizada === 'APROBADO'
        ? 'Mision aprobada. Esta historia queda como memoria valida de la comunidad.'
        : 'Mision rechazada. Se bloquea para Melantios hasta nueva revision.'
    );
    return this.abrirMisionesPadrinoPorValidar();
  },

  abrirMisionesPadrinoPorValidar() {
    const estado = this._estadoComunidad();
    const padrino = this._estadoPadrino(estado);
    const plaza = this._estadoDonEloyPlaza();
    const pendientes = this._misionesPadrinoPendientes(plaza);

    const listado = pendientes
      .slice(0, 20)
      .map((item) => {
        const fecha = item.fecha
          ? new Date(item.fecha).toLocaleDateString('es-EC')
          : 'Sin fecha';
        const audio = item.audioDataUrl
          ? `<audio controls style="width:100%;margin-top:8px"><source src="${item.audioDataUrl}" type="${item.audioMime || 'audio/webm'}" /></audio>`
          : '<div style="margin-top:8px;font-size:12px;color:#6d5234">Sin audio adjunto</div>';
        return `<article style="background:#fff;border:1px solid #dbe7de;border-radius:12px;padding:10px;display:grid;gap:6px"><strong>${this._escaparHtml(item.nombreMayor || 'Mayor sin nombre')}</strong><div style="font-size:12px;color:#4f6f5a">${this._escaparHtml(item.origen || 'Origen no definido')} · ${this._escaparHtml(fecha)}</div><div style="font-size:13px">${this._escaparHtml(item.resumen || 'Sin resumen')}</div>${audio}<div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px"><button onclick="window.MelantiaAsistente?.resolverMisionPadrinoTesoro('${this._escaparHtml(String(item.id || ''))}','APROBADO')">Aprobado</button><button onclick="window.MelantiaAsistente?.resolverMisionPadrinoTesoro('${this._escaparHtml(String(item.id || ''))}','RECHAZADO')">Rechazado</button></div></article>`;
      })
      .join('');

    const cuerpo = `
      <section style="display:grid;gap:10px">
        <article style="background:#fff8ef;border:1px solid #e6cfb1;border-radius:14px;padding:12px"><strong>Contrato del Padrino</strong><div style="margin-top:6px">Estado: ${padrino.contratoAceptado ? 'ACEPTADO' : 'PENDIENTE'}. ${padrino.contratoAceptado ? `Aceptado en ${this._escaparHtml(new Date(padrino.contratoAceptadoEn).toLocaleString('es-EC'))}.` : 'Debe aceptar para invitar su primer socio.'}</div></article>
        <article style="background:#f7fcff;border:1px solid #cfe3f6;border-radius:14px;padding:12px"><strong>Misiones por Validar</strong><div style="margin-top:6px">Pendientes: ${this._escaparHtml(String(pendientes.length))} · Validadas: ${this._escaparHtml(String(padrino.misionesValidadas))} · Rechazadas: ${this._escaparHtml(String(padrino.misionesRechazadas))}.</div></article>
        <article style="background:#fff4f0;border:1px solid #efc8b7;border-radius:14px;padding:12px"><strong>Filtro anti-fraude activo</strong><div style="margin-top:6px">Cada rechazo bloquea la historia para Melantios y deja trazabilidad de auditoria.</div></article>
        <section style="display:grid;gap:8px">${listado || '<article style="background:#fff;border:1px solid #dbe7de;border-radius:12px;padding:10px">No hay audios pendientes de validacion. Excelente disciplina del grupo.</article>'}</section>
      </section>
      <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px">
        <button onclick="window.MelantiaAsistente?.aceptarContratoPadrinoMelantia()">Aceptar contrato</button>
        <button onclick="window.MelantiaAsistente?.invitarSocioPadrinoMelantia()">Invitar socio</button>
        <button onclick="window.MelantiaAsistente?.abrirContratoPadrinoMelantia()">Ver contrato completo</button>
        <button onclick="window.MelantiaAsistente?.abrirTablonDonEloy()">Volver al tablon</button>
      </div>`;

    this._abrirPanel(
      'Sistema de Afiliados · Misiones por Validar',
      'Panel del Padrino para validar audios del Tesoro de los Abuelos con aprobacion o rechazo trazable.',
      cuerpo,
      'Don Eloy'
    );

    this.hablarDonEloy(
      pendientes.length
        ? `Padrino, tiene ${pendientes.length} mision(es) por validar. Aqui premiamos verdad y constancia.`
        : 'Padrino, su mesa esta al dia. No hay misiones pendientes de validacion.'
    );
    return true;
  },

  async abrirTablonDonEloy() {
    const estado = this._estadoComunidad();
    const plaza = this._estadoDonEloyPlaza();
    const padrino = this._estadoPadrino(estado);
    const engine = plaza.linguisticLearningEngine || {};
    const pendientesLing = (engine.pendingValidation || []).filter(
      (item) => !item.validado
    ).length;
    const totalTesoros = (plaza.tesoroAbuelos || []).length;
    const misionesPendientesPadrino =
      this._misionesPadrinoPendientes(plaza).length;
    const guardianTop = (plaza.guardianMemoria?.destacados || [])[0] || null;
    const diaActual = this._claveDiaDonEloy(new Date());
    const agenda =
      plaza.agendaDiaria?.dia === diaActual
        ? plaza.agendaDiaria
        : { dia: diaActual, mananaEn: '', tardeEn: '' };
    const selloTiempo = (iso = '') =>
      iso ? new Date(iso).toLocaleString('es-EC') : 'Aun no publicado hoy';
    const cuerpo = `
      <section style="display:grid;gap:10px">
        <article style="background:#fff8ef;border:1px solid #e6cfb1;border-radius:14px;padding:12px"><strong>La noticia del dia</strong><div style="margin-top:6px">${estado.noticiaDelDia}</div></article>
        <article style="background:#f7fcff;border:1px solid #cfe3f6;border-radius:14px;padding:12px"><strong>Socio destacado</strong><div style="margin-top:6px">Hoy quiero saludar a ${estado.socioDestacado}, que subio fotos de su produccion. Que hermosura de trabajo bien hecho.</div></article>
        <article style="background:#f5fbf5;border:1px solid #d3e7d3;border-radius:14px;padding:12px"><strong>Consejo de vida</strong><div style="margin-top:6px">${estado.consejoVida}</div></article>
        <article style="background:#fff4f0;border:1px solid #efc8b7;border-radius:14px;padding:12px"><strong>Alerta de seguridad</strong><div style="margin-top:6px">${estado.alertaSeguridad}</div></article>
        <article style="background:#eef7ff;border:1px solid #c9dcf7;border-radius:14px;padding:12px"><strong>Hora de Don Eloy</strong><div style="margin-top:6px">Noticiero: ${this._escaparHtml(selloTiempo(plaza.ultimoNoticieroEn))} · Cuento: ${this._escaparHtml(selloTiempo(plaza.ultimoCuentoEn))} · Humor: ${this._escaparHtml(selloTiempo(plaza.ultimoHumorEn))}</div></article>
        <article style="background:#f0fff5;border:1px solid #c8e7d2;border-radius:14px;padding:12px"><strong>Programacion automatica diaria</strong><div style="margin-top:6px">Manana: ${this._escaparHtml(selloTiempo(agenda.mananaEn))} · Tarde: ${this._escaparHtml(selloTiempo(agenda.tardeEn))}</div></article>
        <article style="background:#fff8ef;border:1px solid #e6cfb1;border-radius:14px;padding:12px"><strong>Motor Linguistico Comunitario</strong><div style="margin-top:6px">Lengua detectada: ${this._escaparHtml(engine.detectedLanguage || 'es')} · Pendientes de validacion: ${this._escaparHtml(String(pendientesLing))}.</div></article>
        <article style="background:#fff9ef;border:1px solid #ead4aa;border-radius:14px;padding:12px"><strong>Mision Tesoro de los Abuelos</strong><div style="margin-top:6px">Voces ancestrales guardadas: ${this._escaparHtml(String(totalTesoros))}. ${guardianTop ? `Reconocimiento de honor: ${this._escaparHtml(guardianTop.nombre)} (${this._escaparHtml(String(guardianTop.total))} aporte[s]).` : 'Aun no hay Guardian destacado.'}</div></article>
        <article style="background:#fff8ef;border:1px solid #e6cfb1;border-radius:14px;padding:12px"><strong>Panel del Padrino</strong><div style="margin-top:6px">Contrato: ${padrino.contratoAceptado ? 'ACEPTADO' : 'PENDIENTE'} · Misiones por validar: ${this._escaparHtml(String(misionesPendientesPadrino))}.</div></article>
        <article style="background:#f7fff8;border:1px solid #cfe2d3;border-radius:14px;padding:12px"><strong>Aportes anonimos</strong><div style="margin-top:6px">${this._escaparHtml(String((plaza.aportesAnonimos || []).length))} aporte(s) listos para compartir en la plaza sin exponer nombres.</div></article>
      </section>
      <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px">
        <button onclick="window.MelantiaAsistente?.ejecutarProgramacionDonEloyDiaria()">Ejecutar programacion ahora</button>
        <button onclick="window.MelantiaAsistente?.grabarTesoroAbuelosDonEloy()">Grabar tesoro</button>
        <button onclick="window.MelantiaAsistente?.verMapaSabiduriaDonEloy()">Mapa de sabiduria</button>
        <button onclick="window.MelantiaAsistente?.compartirHallazgoAncestralDonEloy()">Compartir hallazgo ancestral</button>
        <button onclick="window.MelantiaAsistente?.registrarAprendizajeLinguisticoDonEloy()">Ensenar palabra</button>
        <button onclick="window.MelantiaAsistente?.validarAprendizajeLinguisticoDonEloy()">Validar termino</button>
        <button onclick="window.MelantiaAsistente?.saludoInterculturalDonEloy()">Saludo intercultural</button>
        <button onclick="window.MelantiaAsistente?.publicarNoticieroDonEloy()">Noticiero de la plaza</button>
        <button onclick="window.MelantiaAsistente?.contarHistoriaDonEloy()">Cuentacuentos</button>
        <button onclick="window.MelantiaAsistente?.contarHumorDonEloy()">Humor y refranes</button>
        <button onclick="window.MelantiaAsistente?.registrarAporteAnonimoDonEloy()">Recibir aporte anonimo</button>
        <button onclick="window.MelantiaAsistente?.contarAporteAnonimoDonEloy()">Contar aporte anonimo</button>
        <button onclick="window.MelantiaAsistente?.abrirContratoPadrinoMelantia()">Contrato del Padrino</button>
        <button onclick="window.MelantiaAsistente?.abrirMisionesPadrinoPorValidar()">Misiones por Validar</button>
        <button onclick="window.MelantiaAsistente?.anunciarMedallaEscuela()">Anunciar medalla</button>
        <button onclick="window.MelantiaAsistente?.abrirComunidadVirtual()">Volver a Comunidad</button>
      </div>`;
    this._abrirPanel(
      'Don Eloy · Tablon comunitario',
      'Noticias, avisos, prestigio y consejos para mantener viva la union entre socios.',
      cuerpo,
      'Don Eloy'
    );
    this.hablarDonEloy(
      `Buen día, socio. Soy Don Eloy. Aquí en la plaza virtual hoy tenemos ${estado.ofertasNuevas} ofertas nuevas de ganado y ${estado.alertaClima.toLowerCase()}. Quiere que le cuente los detalles del tablón?`
    );
    return true;
  },

  anunciarMedallaEscuela() {
    const estado = this._estadoComunidad();
    this.hablarDonEloy(
      `Atención, comunidad. Quiero felicitar al socio ${estado.socioCertificado}, que acaba de certificarse en ${estado.medallaReciente}. Da gusto ver gente que se sigue superando. Un aplauso virtual para él.`
    );
    return true;
  },

  abrirNegociosConDonEloy() {
    const estado = this._estadoComunidad();
    const propiedades = estado.propiedades || {};
    const cuerpo = `
      <section style="display:grid;gap:10px">
        <article style="background:#fff8ef;border:1px solid #e6cfb1;border-radius:14px;padding:12px"><strong>Aval en las ventas</strong><div style="margin-top:6px">Don Eloy presenta al socio, da fe de su cumplimiento y acompana el tablero de negocios con respeto.</div></article>
        <article style="background:#f7fcff;border:1px solid #cfe3f6;border-radius:14px;padding:12px"><strong>Filtro de calidad y etica</strong><div style="margin-top:6px">Antes de publicar, Don Eloy recuerda que lo ofrecido debe estar sano, garantizado y dicho con claridad.</div></article>
        <article style="background:#f5fbf5;border:1px solid #d3e7d3;border-radius:14px;padding:12px"><strong>Tienda Melantia</strong><div style="margin-top:6px">Ganado, maquinaria, insumos, cosechas y productos procesados tienen una plaza rapida con custodia, QR de entrega y reglas de comision segun volumen.</div></article>
        <article style="background:#eef7ff;border:1px solid #c9dcf7;border-radius:14px;padding:12px"><strong>Inversiones y Propiedades</strong><div style="margin-top:6px">La intermediacion de alto valor funciona con custodia MELANTIA, validacion documental y comision del ${Number(propiedades.comisionPorcentaje || 5)} por ciento.</div></article>
        <article style="background:#fff8f3;border:1px solid #f0d6bd;border-radius:14px;padding:12px"><strong>Tratos de palabra digitales</strong><div style="margin-top:6px">Socio, usted ya lleva ${estado.tratosExitosos} tratos cerrados y su palabra en esta app vale oro. Aqui se construye reputacion comercial.</div></article>
        <article style="background:#eef7ff;border:1px solid #c9dcf7;border-radius:14px;padding:12px"><strong>Paso a formalizacion</strong><div style="margin-top:6px">Cuando un trato crece, Don Eloy lo pasa con el Dr. Pablo para dejar el acuerdo por escrito y cuidar la amistad.</div></article>
      </section>
      <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px">
        <button onclick="window.MelantiaAsistente?.abrirTiendaMelantia()">Tienda Melantia</button>
        <button onclick="window.MelantiaAsistente?.abrirIntermediacionPropiedades()">Inversiones y Propiedades</button>
        <button onclick="window.MelantiaAsistente?.abrirRegistroEvidencia('negocios')">Registro de Evidencia</button>
        <button onclick="window.MelantiaAsistente?.abrirItemComunidad('legal')">Pasar con Dr. Pablo</button>
        <button onclick="window.MelantiaAsistente?.abrirComunidadVirtual()">Volver a Comunidad</button>
      </div>`;
    this._abrirPanel(
      'Don Eloy · Negocios con palabra',
      'La confianza comunitaria se convierte en reputacion comercial y mejores cierres dentro de Negocios Rurales.',
      cuerpo,
      'Don Eloy'
    );
    this.hablarDonEloy(
      'Atención, socios. Mi amigo ha puesto a la venta ejemplares de primera. Yo doy fe de que es una persona trabajadora y cumplida. Échenle un ojo al tablero de negocios y, si cierran trato, los paso con el Dr. Pablo para dejar las cuentas claras.'
    );
    return true;
  },

  abrirTiendaMelantia() {
    const tienda = this._estadoTiendaMelantia();
    const comercioLocal = this._estadoComercioLocal();
    const parroquiaActiva = comercioLocal.parroquiaActual || 'El Carmen';
    const tiendasLocales = this._filtrarOfertaLocalPorParroquia(
      comercioLocal.tiendasAfiliadas,
      parroquiaActiva
    );
    const tecnicosLocales = this._filtrarOfertaLocalPorParroquia(
      comercioLocal.tecnicosCampo,
      parroquiaActiva
    );
    const liquidacion = this._resolverComisionTienda(tienda);
    const qrVisual = this._crearQrSvgLocal(
      String(tienda.qrEntregaCodigo || 'MEL-SIN-CODIGO')
    );
    const tiendasLocalesHtml = tiendasLocales
      .map((item) => {
        const pendientes = this._ventasTienda(
          item.id,
          'PENDIENTE_ENTREGA'
        ).length;
        const reporte = this._obtenerReporteMensualTienda(item.id);
        const reporteListo =
          reporte?.periodo &&
          reporte.periodo !== comercioLocal.ultimoCorteMensual;
        return `<article style="background:#fff;border:1px solid #dbe7de;border-radius:16px;padding:14px;display:grid;gap:8px"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><div><strong>${this._escaparHtml(item.nombre)}</strong><div style="font-size:12px;color:#4f6f5a">${this._escaparHtml(item.tipo)} · ${this._escaparHtml(item.parroquia)} · ${this._escaparHtml(item.distancia)}</div></div><span style="font-size:11px;background:#eef7f0;border:1px solid #cfe2d2;border-radius:999px;padding:4px 8px;color:#1f5a37">2 meses gratis</span></div><div style="font-size:13px;color:#355246">Vitrina virtual: ${item.inventarioPublicado}/${item.capacidadMaximaProductos} productos publicados. Propietario: ${this._escaparHtml(item.propietario)}.</div><div style="font-size:13px;color:#355246">Transferencia directa: ${this._escaparHtml(item.banco)}</div><div style="font-size:12px;color:#5b6f60">Registro obligatorio: foto de fachada con georreferenciacion GPS. Catalogo visible offline segun la ultima ubicacion guardada.</div><div style="display:flex;flex-wrap:wrap;gap:8px">${item.productos.map((producto) => `<span style="font-size:12px;background:#f6f8f7;border:1px solid #d8e1db;border-radius:999px;padding:5px 9px;color:#244230">${this._escaparHtml(producto.nombre)} · ${this._dinero(producto.precio)} / ${this._escaparHtml(producto.unidad)}</span>`).join('')}</div><div style="display:flex;flex-wrap:wrap;gap:8px;font-size:12px;color:#4f6f5a"><span style="background:#fff9ef;border:1px solid #ead4aa;border-radius:999px;padding:4px 8px">Pendientes: ${this._escaparHtml(String(pendientes))}</span>${reporteListo ? `<span style="background:#eef7ff;border:1px solid #c9dcf7;border-radius:999px;padding:4px 8px">Reporte ${this._escaparHtml(reporte.etiquetaPeriodo)} listo</span>` : ''}</div><div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px"><button onclick="window.MelantiaAsistente?.confirmarPagoTiendaAfiliada('${item.id}')">Pago directo + WhatsApp</button><button onclick="window.MelantiaAsistente?.abrirPanelTendero('${item.id}')">Panel tendero</button><button onclick="window.MelantiaAsistente?.verReporteMensualTienda('${item.id}')">Reporte mensual</button></div></article>`;
      })
      .join('');
    const tecnicosLocalesHtml = tecnicosLocales
      .map(
        (item) =>
          `<article style="background:#fff;border:1px solid #dbe7de;border-radius:16px;padding:14px;display:grid;gap:8px"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><div><strong>${this._escaparHtml(item.nombre)}</strong><div style="font-size:12px;color:#4f6f5a">${this._escaparHtml(item.perfil)} · ${this._escaparHtml(item.parroquia)}</div></div>${item.sugerido ? '<span style="font-size:11px;background:#fff4d8;border:1px solid #efd7a0;border-radius:999px;padding:4px 8px;color:#8a5a13">Tecnico sugerido</span>' : ''}</div><div style="font-size:13px;color:#355246">${this._escaparHtml(item.experiencia)}</div><div style="font-size:13px;color:#355246"><strong>Curriculum:</strong> ${this._escaparHtml(item.curriculum)}</div><div style="font-size:13px;color:#355246">Visita desde ${this._dinero(item.tarifa)} en la misma parroquia.</div><div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px"><button onclick="window.MelantiaAsistente?.agendarVisitaTecnicaLocal('${item.id}')">Agendar visita</button></div></article>`
      )
      .join('');
    const cuerpo = `
      <section style="display:grid;gap:10px">
        <article style="background:#f5fbf5;border:1px solid #d3e7d3;border-radius:14px;padding:12px"><strong>Venta de Ganado</strong><div style="margin-top:6px">Para publicar semovientes se exige certificado de vacunacion o guia de movilizacion. La luz verde solo se activa cuando el comprador revisa el lote en su corral y confirma que llego conforme.</div><div style="margin-top:8px;font-size:12px;color:#47624f">Comision estandar: 5%. Venta pequena entre afiliados como 1 vaca, 1 cerdo o pollos: trato y pago directo sin cobro MELANTIA.</div></article>
        <article style="background:#fff8ef;border:1px solid #e6cfb1;border-radius:14px;padding:12px"><strong>Maquinaria e Insumos</strong><div style="margin-top:6px">Si la maquinaria es usada, es obligatorio subir video de funcionamiento grabado desde la App con sello MELANTIA. El pago queda en custodia hasta que el comprador recibe y verifica el equipo.</div><div style="margin-top:8px;font-size:12px;color:#6d5234">Si la maquina no enciende o no coincide con lo prometido, se devuelve el dinero menos el costo logistico si aplicara.</div></article>
        <article style="background:#eef7ff;border:1px solid #c9dcf7;border-radius:14px;padding:12px"><strong>Cosechas y Productos Procesados</strong><div style="margin-top:6px">La venta directa funciona como tienda respaldada por Melantia. En venta a futuro, el comprador puede reservar un lote depositando una parte en custodia.</div><div style="margin-top:8px;font-size:12px;color:#36566f">Insumos y productos pequenos para afiliados: 0%. Ventas masivas, por ejemplo 10 vacas o 10 cerdos, pueden pasar a 3% para incentivar el movimiento grande.</div></article>
      </section>
      <section style="display:grid;gap:10px;margin-top:10px">
        <article style="background:linear-gradient(180deg,#e8fff0 0%,#f7fff9 100%);border:1px solid #b9e2c3;border-radius:18px;padding:14px"><strong style="font-size:18px;color:#17663a">DINERO EN CUSTODIA</strong><div style="margin-top:8px">Categoria activa: ${this._escaparHtml(
          this._tituloModoEvidencia(
            tienda.categoria === 'cosechas'
              ? 'trazabilidad'
              : tienda.categoria === 'maquinaria'
                ? 'negocios'
                : 'asistencia'
          )
            .replace('Reporte de Asistencia', 'Venta de Ganado')
            .replace('Evidencia para Negocios', 'Maquinaria e Insumos')
            .replace(
              'Seguimiento de Produccion',
              'Cosechas y Productos Procesados'
            )
        )}</div><div style="margin-top:6px">Producto: ${this._escaparHtml(tienda.producto || 'Sin producto')} · Cantidad/volumen: ${this._escaparHtml(String(tienda.cantidad || 0))}</div><div style="margin-top:6px">Estado actual: <strong>${this._escaparHtml(tienda.depositoEstado || 'PUBLICACION_ACTIVA')}</strong></div><div style="margin-top:8px;font-size:12px;color:#486454">Angel: El dinero ya esta bajo custodia MELANTIA. Cuando el comprador confirme la entrega por QR, yo liquido automaticamente.</div></article>
        <article style="background:#fff;border:1px solid #dbe7de;border-radius:14px;padding:12px"><strong>Liquidacion real segun categoria y volumen</strong><div style="margin-top:6px">Valor de venta: ${this._dinero(tienda.valorCierre || 0)}</div><div style="margin-top:6px">Comision aplicada: ${liquidacion.porcentaje}% · ${this._dinero(liquidacion.comision)}</div><div style="margin-top:6px">Neto al vendedor: ${this._dinero(liquidacion.netoVendedor)}</div><div style="margin-top:8px;font-size:12px;color:#4f6f5a">Regla aplicada: ${this._escaparHtml(liquidacion.regla)}</div></article>
      </section>
      <section style="display:grid;gap:10px;margin-top:10px">
        <article style="background:#fff;border:1px solid #dbe7de;border-radius:14px;padding:12px"><strong>Logistica de Palabra</strong><div style="margin-top:6px">1. Publicacion con foto GPS, precio y descripcion de voz. 2. Deposito en custodia. 3. Entrega. 4. Confirmacion con codigo QR del vendedor o transportista. 5. Liquidacion con 5% o porcentaje aplicable segun categoria.</div></article>
        <article style="background:#fff;border:1px solid #dbe7de;border-radius:14px;padding:12px"><strong>Contratos y planes</strong><div style="margin-top:6px">Si el afiliado es Standard, puede solicitar contrato de compraventa redactado incluso cuando el negocio pequeno se haga directo entre las partes.</div></article>
      </section>
      <section style="display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:center;margin-top:10px;background:#fff;border:1px solid #dbe7de;border-radius:14px;padding:12px">
        <div>${qrVisual}</div>
        <div><strong>QR de entrega</strong><div style="margin-top:6px">Codigo de entrega: <strong>${this._escaparHtml(tienda.qrEntregaCodigo || 'SIN-CODIGO')}</strong></div><div style="margin-top:6px;font-size:12px;color:#4f6f5a">Ahora el codigo visible si es un QR valido. El comprador puede leerlo con camara desde su dispositivo o escribir el token si esta sin soporte nativo.</div><div style="margin-top:8px;font-size:12px;color:#4f6f5a">Estado QR: ${tienda.qrEntregaConfirmado ? 'ENTREGA_CONFIRMADA' : 'PENDIENTE_CONFIRMACION'}</div></div>
      </section>
      <section style="display:grid;gap:10px;margin-top:10px">
        <article style="background:#fff8ef;border:1px solid #e6cfb1;border-radius:14px;padding:12px"><strong>Don Eloy · Comisario de la Feria</strong><div style="margin-top:6px">Atencion. Hay un nuevo lote de terneros de engorde en la plaza. El dueno es hombre de palabra. El dinero aqui se cuida hasta que los animales esten en el potrero del comprador.</div></article>
        <article style="background:#ffffff;border:1px solid #d1ead7;border-radius:14px;padding:12px"><strong>Angel · Custodia</strong><div style="margin-top:6px">He verificado que el pago por la maquinaria o el lote grande esta en custodia. Vendedor, ya puede realizar el despacho con confianza.</div></article>
      </section>
      <section style="display:grid;gap:10px;margin-top:10px">
        <article style="background:linear-gradient(135deg,#fff9ef 0%,#fffef8 100%);border:1px solid #ead4aa;border-radius:18px;padding:14px"><strong style="font-size:18px;color:#8a5a13">Almacenes y Tiendas Afiliadas</strong><div style="margin-top:8px">Parroquia activa: <strong>${this._escaparHtml(parroquiaActiva)}</strong> · Referencia guardada: ${this._escaparHtml(comercioLocal.referencia || 'Sin referencia')}.</div><div style="margin-top:6px">Suscripcion de vitrina: ${this._dinero(25)} al mes con <strong>2 meses gratis</strong>. Cada negocio puede publicar hasta <strong>20 productos</strong> con precio, foto y descripcion.</div><div style="margin-top:8px;font-size:12px;color:#6d5234">La geocerca local prioriza la parroquia guardada para que el productor vea primero lo que tiene a la vuelta de su finca.</div></article>
        <article style="background:#ffffff;border:1px solid #d1ead7;border-radius:18px;padding:14px"><strong style="font-size:18px;color:#17663a">Libro de Ventas Digital</strong><div style="margin-top:8px">Cada clic en comprar registra una intencion de venta. El tendero marca <strong>Venta completada</strong> cuando entrega el pedido y Melantia consolida volumen, ingresos brutos, clientes recurrentes y comparativa mensual.</div><div style="margin-top:8px;font-size:12px;color:#4f6f5a">Angel entrega el reporte en formato imprimible para PDF, resumen por WhatsApp/App y exportacion CSV para Excel.</div></article>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px">${tiendasLocalesHtml}</div>
      </section>
      <section style="display:grid;gap:10px;margin-top:10px">
        <article style="background:linear-gradient(135deg,#eef7ff 0%,#fbfdff 100%);border:1px solid #c9dcf7;border-radius:18px;padding:14px"><strong style="font-size:18px;color:#2a5d91">Asistencia Tecnica Profesional</strong><div style="margin-top:8px">Los profesionales del campo de la misma parroquia aparecen como sugeridos para visitas presenciales. El productor revisa curriculum, tarifa base y agenda la visita directo.</div></article>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:10px">${tecnicosLocalesHtml}</div>
      </section>
      <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px">
        <button onclick="window.MelantiaAsistente?.calibrarGeocercaComercial()">Actualizar geocerca</button>
        <button onclick="window.MelantiaAsistente?.activarCustodiaTienda('ganado')">Custodia ganado</button>
        <button onclick="window.MelantiaAsistente?.activarCustodiaTienda('maquinaria')">Custodia maquinaria</button>
        <button onclick="window.MelantiaAsistente?.activarCustodiaTienda('cosechas')">Custodia cosechas</button>
        <button onclick="window.MelantiaAsistente?.escanearEntregaTiendaConCamara()">Escanear con camara</button>
        <button onclick="window.MelantiaAsistente?.confirmarEntregaTiendaPorQr()">Confirmar QR entrega</button>
        <button onclick="window.MelantiaAsistente?.liquidarTiendaMelantia()">Liquidar tienda</button>
        <button onclick="window.MelantiaAsistente?.abrirRegistroEvidencia('negocios')">Foto GPS y evidencia</button>
        <button onclick="window.MelantiaAsistente?.abrirIntermediacionPropiedades()">Custodia protegida</button>
        <button onclick="window.MelantiaAsistente?.abrirItemComunidad('legal')">Contrato con Dr. Pablo</button>
        <button onclick="window.MelantiaAsistente?.abrirNegociosConDonEloy()">Volver a Negocios</button>
      </div>`;
    this._abrirPanel(
      'Don Eloy · Tienda Melantia',
      'Ganado, maquinaria, insumos y cosechas con flujo rapido de feria, custodia segura y reglas por categoria.',
      cuerpo,
      'Don Eloy'
    );
    this.hablarDonEloy(
      'Vea, socio. La ferreteria de la vuelta, los agroinsumos y los tecnicos de la zona ya pueden aparecer filtrados por su parroquia. Revise precios, pagueles directo y escribales por WhatsApp para que le tengan todo listo.'
    );
    return true;
  },

  abrirIntermediacionPropiedades() {
    const estado = this._estadoComunidad();
    const propiedades = estado.propiedades || {};
    const comision =
      (Number(propiedades.valorCierre || 0) *
        Number(propiedades.comisionPorcentaje || 5)) /
      100;
    const netoVendedor = Number(propiedades.valorCierre || 0) - comision;
    const contratoCustodia = `Yo, ${this._escaparHtml(propiedades.comprador || 'Comprador')}, acepto depositar el valor de ${this._dinero(propiedades.valorCierre)} en las cuentas de custodia de MELANTIA. Entiendo que este dinero quedara resguardado y solo sera entregado al vendedor cuando yo confirme la recepcion del bien y se cargue en la App la evidencia fotografica de las escrituras firmadas ante Notario. Si por cualquier motivo legal o de mutuo acuerdo la venta no se concreta, MELANTIA me devolvera el 100% de mi dinero sin descuentos.`;
    const contratoIntermediacion = `Yo, ${this._escaparHtml(propiedades.vendedor || 'Vendedor')}, autorizo a MELANTIA a actuar como intermediario y veedor en la venta de mi propiedad o activo. Acepto que, al concretarse la venta con exito, la plataforma descuente automaticamente el ${Number(propiedades.comisionPorcentaje || 5)}% del valor total en concepto de comision por servicios de publicidad, verificacion legal y custodia segura. Reconozco que el pago se liberara a mi favor unicamente tras la verificacion de la documentacion notarial pertinente.`;
    const cuerpo = `
      <section style="display:grid;gap:10px;background:linear-gradient(180deg,#e8fff0 0%,#f7fff9 100%);border:1px solid #b9e2c3;border-radius:20px;padding:18px">
        <div style="display:grid;justify-items:center;gap:8px;text-align:center">
          <div style="width:88px;height:88px;border-radius:999px;background:#1f8f4e;color:#fff;display:grid;place-items:center;font-size:40px;box-shadow:0 10px 24px rgba(31,143,78,.22)">LOCK</div>
          <strong style="font-size:26px;color:#17663a;letter-spacing:.04em">PAGO RESGUARDADO</strong>
          <div style="font-size:13px;color:#2f5e41">Certificado de Deposito en Garantia · MELANTIA</div>
        </div>
        <article style="background:#ffffff;border:1px solid #d1ead7;border-radius:14px;padding:14px"><strong>Angel · Finanzas</strong><div style="margin-top:6px">Atencion, socio vendedor. Confirmamos que hemos recibido el deposito total de ${this._dinero(propiedades.valorCierre)} por parte del comprador. El dinero se encuentra bajo la custodia segura de Melantia. Ya puede proceder con la firma en Notaria con total confianza.</div></article>
        <article style="background:#fff8ef;border:1px solid #e6cfb1;border-radius:14px;padding:14px"><strong>Don Eloy · La Palabra</strong><div style="margin-top:6px">Buenas noticias. La plata ya esta en nuestro poncho. Vaya tranquilo a firmar esos papeles, que aqui en Melantia somos los garantes de que su pago esta listo y esperando por usted. Una vez que suban la foto de la escritura, yo mismo doy la orden de soltar el dinero.</div></article>
        <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">
          <button onclick="window.MelantiaAsistente?.aceptarContratoCustodia()" style="min-width:240px;font-weight:800">IR A LA NOTARIA / SUBIR PRUEBAS</button>
        </div>
      </section>
      <section style="display:grid;gap:10px">
        <article style="background:#fff8ef;border:1px solid #e6cfb1;border-radius:14px;padding:12px"><strong>Acuerdo de Custodia Segura Melantia</strong><div style="margin-top:6px">${contratoCustodia}</div><div style="margin-top:10px;font-size:12px;color:#45627a">Estado: ${propiedades.contratoCustodiaAceptado ? 'ACEPTADO' : 'PENDIENTE'} · Actas de voz iniciales: comprador ${propiedades.actaVozCompradorInicial}, vendedor ${propiedades.actaVozVendedorInicial}</div></article>
        <article style="background:#fff8f3;border:1px solid #f0d6bd;border-radius:14px;padding:12px"><strong>Autorizacion de Venta e Intermediacion</strong><div style="margin-top:6px">${contratoIntermediacion}</div><div style="margin-top:10px;font-size:12px;color:#76553a">Estado: ${propiedades.contratoIntermediacionAceptado ? 'ACEPTADO' : 'PENDIENTE'}</div></article>
        <article style="background:#eefaf0;border:1px solid #cfe7d4;border-radius:14px;padding:12px"><strong>Regla de oro · Devolucion total</strong><div style="margin-top:6px">Si el negocio no se firma, el dinero se devuelve integro al comprador. Trigger de devolucion: BOTON_ANULAR + CONFIRMACION_AMBAS_PARTES.</div></article>
      </section>
      <section style="display:grid;gap:10px">
        <article style="background:#fff8ef;border:1px solid #e6cfb1;border-radius:14px;padding:12px"><strong>Fase 1 · Deposito en garantia</strong><div style="margin-top:6px">El comprador transfiere el valor total del negocio a la cuenta recaudadora de MELANTIA. Estado actual: ${this._escaparHtml(String(propiedades.depositoEstado || 'EN_CUSTODIA'))}</div></article>
        <article style="background:#f7fcff;border:1px solid #cfe3f6;border-radius:14px;padding:12px"><strong>Fase 2 · Verificacion notarial</strong><div style="margin-top:6px">Se exige foto nitida del acta o escritura nueva con firma del comprador, firma del vendedor y sello de notaria. Estado: ${this._escaparHtml(String(propiedades.evidenciaNotarial || 'PENDIENTE_CARGA'))}.</div></article>
        <article style="background:#eef7ff;border:1px solid #c9dcf7;border-radius:14px;padding:12px"><strong>Fase 3 · Visto bueno doble</strong><div style="margin-top:6px">Comprador: ${propiedades.confirmacionComprador ? 'ACEPTADO' : 'PENDIENTE'}. Vendedor: ${propiedades.confirmacionVendedor ? 'ACEPTADO' : 'PENDIENTE'}. MELANTIA no libera fondos si falta alguna conformidad.</div></article>
        <article style="background:#fff4f0;border:1px solid #efc8b7;border-radius:14px;padding:12px"><strong>Fase 4 · Desembolso y liquidacion</strong><div style="margin-top:6px">Total deposito ${this._dinero(propiedades.valorCierre)} menos ${Number(propiedades.comisionPorcentaje || 5)}% de comision ${this._dinero(comision)} igual a ${this._dinero(netoVendedor)} para el vendedor.</div></article>
      </section>
      <section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px">
        <article style="background:#fff;border:1px solid #d8e5d9;border-radius:14px;padding:12px"><strong>Propiedad</strong><div style="margin-top:6px">${this._escaparHtml(String(propiedades.propiedad || 'Finca no definida'))}</div></article>
        <article style="background:#fff;border:1px solid #d8e5d9;border-radius:14px;padding:12px"><strong>Zona notarial</strong><div style="margin-top:6px">${this._escaparHtml(String(propiedades.zonaNotaria || 'No registrada'))}</div></article>
        <article style="background:#fff;border:1px solid #d8e5d9;border-radius:14px;padding:12px"><strong>Comision MELANTIA</strong><div style="margin-top:6px">${this._dinero(comision)}</div></article>
        <article style="background:#fff;border:1px solid #d8e5d9;border-radius:14px;padding:12px"><strong>Centro de Mando</strong><div style="margin-top:6px">Alerta activa: Transaccion en Custodia. Trigger de liberacion: FOTO_NOTARIA + ACEPTACION_COMPRADOR + ACEPTACION_VENDEDOR.</div></article>
      </section>
      <section style="display:grid;gap:10px">
        <article style="background:#f4f8ff;border:1px solid #cad7f7;border-radius:14px;padding:12px"><strong>Triple blindaje</strong><div style="margin-top:6px">Texto, fotos notariales y audios quedan guardados como prueba del negocio. La voz funciona como firma humana y tecnica del cierre.</div></article>
        <article style="background:#eef7ff;border:1px solid #c9dcf7;border-radius:14px;padding:12px"><strong>Actas de voz</strong><div style="margin-top:6px">Comprador inicial: ${propiedades.actaVozCompradorInicial}. Vendedor inicial: ${propiedades.actaVozVendedorInicial}. Comprador final: ${propiedades.actaVozCompradorFinal}. Vendedor final: ${propiedades.actaVozVendedorFinal}.</div></article>
        <article style="background:#fff8ef;border:1px solid #e6cfb1;border-radius:14px;padding:12px"><strong>Acta de Liquidacion de Negocio Rural - Melantia</strong><div style="margin-top:6px">ID de Transaccion: #MR-2026-00X. Precio de venta acordado: ${this._dinero(propiedades.valorCierre)}. Intermediacion Melantia (5%): - ${this._dinero(comision)}. Monto neto transferido al vendedor: ${this._dinero(netoVendedor)}. Anexos digitales: foto de escritura notariada, audios de aceptacion y GPS de la notaria.</div></article>
      </section>
      <section style="display:grid;gap:10px">
        <article style="background:#fff8ef;border:1px solid #e6cfb1;border-radius:14px;padding:12px"><strong>Don Eloy · Mediador</strong><div style="margin-top:6px">Escucheme bien, socio: Melantia es como ese amigo de confianza que guarda el dinero en su poncho mientras ustedes firman los papeles. Si al final no hay firma, el dinero regresa a quien lo puso.</div></article>
        <article style="background:#f6f3ff;border:1px solid #d9cdf5;border-radius:14px;padding:12px"><strong>Dr. Pablo · Legal</strong><div style="margin-top:6px">La foto de la escritura ha sido recibida. Verifico que los sellos notariales coincidan para proceder con la liberacion de los fondos.</div></article>
        <article style="background:#fff8ef;border:1px solid #e6cfb1;border-radius:14px;padding:12px"><strong>Angel · Finanzas</strong><div style="margin-top:6px">Transaccion completada. Se ha transferido el valor neto al vendedor y se ha registrado el ${Number(propiedades.comisionPorcentaje || 5)}% de comision por intermediacion de Melantia.</div></article>
      </section>
      <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px">
        <button onclick="window.MelantiaAsistente?.aceptarContratoCustodia()">Aceptar custodia</button>
        <button onclick="window.MelantiaAsistente?.aceptarContratoIntermediacion()">Aceptar intermediacion</button>
        <button onclick="window.MelantiaAsistente?.anularTransaccionCustodia('comprador')">Anular comprador</button>
        <button onclick="window.MelantiaAsistente?.anularTransaccionCustodia('vendedor')">Anular vendedor</button>
        <button onclick="window.MelantiaAsistente?.abrirItemComunidad('legal')">Revision Dr. Pablo</button>
        <button onclick="window.MelantiaAsistente?.abrirNegociosConDonEloy()">Volver a Negocios</button>
      </div>`;
    this._abrirPanel(
      'Don Eloy · Transaccion Protegida MELANTIA',
      'Sistema de custodia digital para propiedades, tierras y semovientes con evidencia notarial, doble conformidad y comision garantizada.',
      cuerpo,
      'Don Eloy'
    );
    this.hablarDonEloy(
      'Amigos, estamos ante un negocio importante. Melantia está aquí para que el vendedor reciba su pago justo y el comprador reciba su tierra sin problemas legales.'
    );
    return true;
  },

  abrirItemComunidad(item) {
    const paneles = {
      legal: {
        titulo: 'Dr. Pablo · Asesoria Legal',
        subtitulo:
          'Orientacion inicial para consultas rurales, documentos y rutas de proteccion o tramite.',
        voz: 'Me alegra que hayan llegado a un trato. Ahora, para que duerman tranquilos, los voy a pasar con el doctor Pablo. Él les ayudará a dejar por escrito este acuerdo para que las cuentas queden claras y la amistad se mantenga.',
        experto: 'Dr. Pablo',
        cuerpo: `
          <section style="display:grid;gap:10px">
            <article style="background:#fff8f3;border:1px solid #f0d6bd;border-radius:14px;padding:12px"><strong>Orientacion inmediata</strong><div style="margin-top:6px">Recibe una primera guia sobre denuncias, medidas de proteccion, compraventa y pasos documentales basicos.</div></article>
            <article style="background:#fff8f3;border:1px solid #f0d6bd;border-radius:14px;padding:12px"><strong>Documentos y plantillas</strong><div style="margin-top:6px">La base de conocimiento legal de MELANTIA conserva entrevistas, guias y formatos para casos rurales frecuentes.</div></article>
            <article style="background:#fff8f3;border:1px solid #f0d6bd;border-radius:14px;padding:12px"><strong>Siguiente integracion</strong><div style="margin-top:6px">Este acceso queda listo para enlazar con el modulo legal y sus flujos de asesoria asistida.</div></article>
          </section>`,
      },
      ciudadano: {
        titulo: 'Don Eloy · Ciudadano Rural',
        subtitulo:
          'Herramientas de organizacion, derechos y acompanamiento practico para la vida comunitaria.',
        voz: 'Socio, su prestigio se construye con respeto, cumplimiento y mano amiga. Aqui verá cómo crece su palabra dentro de la comunidad.',
        experto: 'Don Eloy',
        cuerpo: `
          <section style="display:grid;gap:10px">
            <article style="background:#f5fbf5;border:1px solid #d3e7d3;border-radius:14px;padding:12px"><strong>Sello de Socio Confiable</strong><div style="margin-top:6px">${this._estadoComunidad().selloConfiable ? 'Activo. Los demás socios verán su nombre con el sello de aprobación de Don Eloy.' : 'Aún pendiente. Mantenga buen trato, cumplimiento y colaboración para ganarlo.'}</div></article>
            <article style="background:#f5fbf5;border:1px solid #d3e7d3;border-radius:14px;padding:12px"><strong>Comerciante de Palabra</strong><div style="margin-top:6px">El historial de tratos exitosos se convierte en reputación comercial dentro de Negocios Rurales.</div></article>
            <article style="background:#f5fbf5;border:1px solid #d3e7d3;border-radius:14px;padding:12px"><strong>Organizacion comunitaria</strong><div style="margin-top:6px">Material pensado para lideres, socios y familias rurales que buscan ordenar procesos y dialogos locales.</div></article>
          </section>`,
      },
      noticias: {
        titulo: 'Don Eloy · Tablon de avisos',
        subtitulo:
          'Lectura rapida de contexto productivo para decidir mejor en compras, ventas y seguimiento territorial.',
        voz: 'Hermanos, me informan que hay movimiento y novedades importantes en el territorio. Revisemos juntos el tablón para tomar decisiones con calma y buena información.',
        experto: 'Don Eloy',
        cuerpo: `
          <section style="display:grid;gap:10px">
            <article style="background:#f4f8ff;border:1px solid #cad7f7;border-radius:14px;padding:12px"><strong>Radar de novedades</strong><div style="margin-top:6px">Aqui quedara visible el pulso del territorio: alertas, noticias utiles y mensajes de interes para la comunidad.</div></article>
            <article style="background:#f4f8ff;border:1px solid #cad7f7;border-radius:14px;padding:12px"><strong>Precios referenciales</strong><div style="margin-top:6px">Punto de consulta para precios orientativos de productos, insumos y referencias de mercado.</div></article>
            <article style="background:#fff4f0;border:1px solid #efc8b7;border-radius:14px;padding:12px"><strong>Alerta de seguridad</strong><div style="margin-top:6px">Oiga, socio, ese lenguaje o ese movimiento no es el que cuidamos aqui en Melantia. Si hace falta, Don Eloy reporta al padrino para mantener la plaza limpia.</div></article>
          </section>`,
      },
      salud: {
        titulo: 'Paulette · Asistente Preventivo de Salud',
        subtitulo:
          'Panel visual de alto contraste para atencion preventiva bajo estres y traslado asistido.',
        voz: 'Respire profundo, mantenga la calma. Le abrire el panel de salud para crear la ficha de emergencia y guiar el traslado.',
        experto: 'Paulette',
        cuerpo: `
          <section style="display:grid;gap:10px">
            <article style="background:#eef7ff;border:1px solid #c9dcf7;border-radius:14px;padding:12px"><strong>Mis 50 pacientes</strong><div style="margin-top:6px">Registro rapido con nombre, edad, tipo de sangre y alergias, listo para respuesta comunitaria.</div></article>
            <article style="background:#fff4f0;border:1px solid #efc8b7;border-radius:14px;padding:12px"><strong>Manual de emergencia</strong><div style="margin-top:6px">Heridas, picaduras, quemaduras y desmayos con guia visual y apoyo de voz.</div></article>
            <article style="background:#f5fbf5;border:1px solid #d3e7d3;border-radius:14px;padding:12px"><strong>Ficha de traslado</strong><div style="margin-top:6px">Imagen unica lista para imprimir o compartir por WhatsApp/app con el medico.</div></article>
          </section>
          <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px">
            <button onclick="window.MelantiaAsistente?.abrirAsistentePreventivoSalud()">Abrir panel de salud</button>
            <button onclick="window.MelantiaAsistente?.generarFichaEmergenciaTraslado()">Crear ficha de emergencia</button>
          </div>`,
      },
    };
    const panel = paneles[item];
    if (!panel) return false;
    this._abrirPanel(
      panel.titulo,
      panel.subtitulo,
      `${panel.cuerpo}
      <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px">
        <button onclick="window.MelantiaAsistente?.abrirComunidadVirtual()">Volver a Comunidad</button>
      </div>`,
      panel.experto || 'Don Eloy'
    );
    if ((panel.experto || 'Don Eloy') === 'Dr. Pablo') {
      this.hablarComo('Dr. Pablo', panel.voz);
    } else if ((panel.experto || 'Don Eloy') === 'Paulette') {
      this.hablarComo('Paulette', panel.voz);
    } else {
      this.hablarDonEloy(panel.voz);
    }
    return true;
  },

  explicarRegistro() {
    const cuerpo = `
      <section style="display:grid;gap:10px">
        <article style="background:#eefbfa;border:1px solid #bde9e4;border-radius:14px;padding:12px"><strong>Vendes con más confianza</strong><div style="margin-top:6px">Un lote con evidencia, historial y documentos inspira más confianza al comprador y reduce discusión posterior.</div></article>
        <article style="background:#eefbfa;border:1px solid #bde9e4;border-radius:14px;padding:12px"><strong>Corriges antes de perder</strong><div style="margin-top:6px">Registrar clima, síntomas y decisiones permite detectar patrones y corregir antes de que el daño escale.</div></article>
        <article style="background:#eefbfa;border:1px solid #bde9e4;border-radius:14px;padding:12px"><strong>Construyes trazabilidad</strong><div style="margin-top:6px">Cada registro suma memoria técnica y sostiene la narrativa de sostenibilidad de tu finca.</div></article>
      </section>`;
    this._abrirPanel(
      'Melantia · Valor del registro',
      'La trazabilidad no es burocracia: es capacidad de vender mejor, defender tu manejo y aprender campaña a campaña.',
      cuerpo
    );
    this.hablar(
      'Registrar importa porque te ayuda a vender mejor, defender tu trazabilidad y corregir problemas con evidencia.'
    );
    return true;
  },

  async resumenDelDia() {
    const resumen = await this._cargarResumenOperacion();
    const ultimo = resumen.ultimoCaso;
    const climaTexto = resumen.clima
      ? `Clima validado desde ${resumen.clima.ubicacion || 'estación cercana'}.`
      : 'Sin actualización climática nueva; sigo usando el último contexto disponible.';
    const tareaTexto = ultimo?.recomendacion_fabrizzio
      ? `Última tarea sugerida: ${ultimo.recomendacion_fabrizzio}`
      : 'No tengo una recomendación agrícola reciente guardada para este lote.';
    const saludTexto = resumen.saludApp?.fecha
      ? `Estado de la app al día ${resumen.saludApp.fecha}, con ${resumen.saludApp.errores || 0} errores registrados.`
      : 'El estado de salud de la app no tiene un registro semanal reciente.';
    const estadoLote = ultimo
      ? `Seguimiento del lote: ${String(ultimo.estado_seguimiento || 'PENDIENTE').replace(/</g, '&lt;')}. Síntoma observado: ${String(ultimo.sintoma_observado || 'sin novedad').replace(/</g, '&lt;')}.`
      : 'No encontré un expediente reciente del lote activo.';

    this._abrirPanel(
      'Melantia · Resumen del día',
      'Clima, tareas, salud del lote y estado operativo en una sola lectura.',
      `<section style="display:grid;gap:10px">
        <article style="background:#fff;border:1px solid #d8e5d9;border-radius:14px;padding:12px"><strong>Clima</strong><div style="margin-top:6px">${String(climaTexto).replace(/</g, '&lt;')}</div></article>
        <article style="background:#fff;border:1px solid #d8e5d9;border-radius:14px;padding:12px"><strong>Tareas</strong><div style="margin-top:6px">${String(tareaTexto).replace(/</g, '&lt;')}</div></article>
        <article style="background:#fff;border:1px solid #d8e5d9;border-radius:14px;padding:12px"><strong>Salud del lote</strong><div style="margin-top:6px">${estadoLote}</div></article>
        <article style="background:#fff;border:1px solid #d8e5d9;border-radius:14px;padding:12px"><strong>Salud de MELANTIA</strong><div style="margin-top:6px">${String(saludTexto).replace(/</g, '&lt;')}</div></article>
      </section>`
    );
    this.hablar(`${climaTexto} ${tareaTexto} ${estadoLote} ${saludTexto}`);
    return true;
  },

  // ===== FUNCIONES DE VOZ PARA MELANTIOS - ALCANCÍA NAVIDEÑA =====

  verSaldoMelantiosVoz() {
    const estado = this._estadoComunidad();
    const melantios = estado.melantios || {};
    const saldo = Number(melantios.saldoActual || 0);
    const usd = (saldo * 0.01).toFixed(2);

    this.hablarDonEloy(
      `Usted tiene ${saldo} Melantios disponibles, que valen $${usd} en las tiendas afiliadas. Con esos Melantios puede hacer compras.`
    );
    return this.abrirAlforjaVirtualMelantios();
  },

  verEstadoAlcanciaVoz() {
    const estado = this._estadoComunidad();
    const melantios = estado.melantios || {};
    const alcancia = melantios.alcanciaNavideña || {};
    const mesActual = new Date().getMonth() + 1;
    const saldoAlcancia = Number(alcancia.saldoAcumulado || 0);
    const usd = (saldoAlcancia * 0.01).toFixed(2);
    const mesesPagados = estado.melantios.mesesPagados || 0;
    const fidelidadMsg =
      mesesPagados === 12
        ? `¡Excelente! Ha cumplido los 12 meses de fidelidad. Su alcancía está desbloqueada.`
        : `Lleva ${mesesPagados} de 12 meses. Necesita ${12 - mesesPagados} meses más de pagos para desbloquear.`;

    if (mesActual === 12) {
      this.hablarDonEloy(
        `¡Vea, socio, es diciembre! Su alcancía de Navidad está abierta. Tiene ${saldoAlcancia} Melantios acumulados, que suman $${usd}. ${fidelidadMsg} Ya puede irlos a gastar en las tiendas. Eso es fruto de su cosecha comunitaria todo el año.`
      );
    } else {
      const diasRestantes = (12 - mesActual) * 30;
      this.hablarDonEloy(
        `Su alcancía de Navidad está acumulando. Lleva ${saldoAlcancia} Melantios ($${usd}), y falta poco más de ${diasRestantes} días para que se abra en diciembre. ${fidelidadMsg} Esos Melantios no se pueden tocar ahora, pero en Navidad será todo suyo si mantiene la constancia.`
      );
    }
    return this.abrirAlforjaVirtualMelantios();
  },

  explicarOportunidadesMelantios() {
    const cuerpo = `
      <section style="display:grid;gap:12px">
        <article style="background:#f5fbf5;border:1px solid #d3e7d3;border-radius:16px;padding:14px">
          <strong>🌾 Rescate de Historia (25M = $0.25)</strong>
          <div style="margin-top:8px;font-size:13px;color:#1b4a33">
            Comparta una historia de su finca: cómo nació, sus primeras siembras, anécdotas que valgan la pena recordar. El padrino la valida, y gana Melantios para la alcancía.
          </div>
        </article>

        <article style="background:#fff8f0;border:1px solid #e6cfb1;border-radius:16px;padding:14px">
          <strong>📝 Palabra Nueva (10M = $0.10)</strong>
          <div style="margin-top:8px;font-size:13px;color:#7b3d1a">
            Enseña una técnica, un refrán, una palabra nueva de la comunidad que no existía registrada. Fabrizzio o Don Eloy la aprueban y gana Melantios.
          </div>
        </article>

        <article style="background:#eff7ff;border:1px solid #c9dcf7;border-radius:16px;padding:14px">
          <strong>❤️ Fidelidad (100M = $1.00)</strong>
          <div style="margin-top:8px;font-size:13px;color:#1f4f80">
            Cumpla 6 meses registrando sin faltar: crecimiento del lote, movimientos, evidencia sostenida. La fidelidad rinde sus frutos en Melantios gordos.
          </div>
        </article>

        <article style="background:#f5f9f8;border:1px solid #cfe2d3;border-radius:16px;padding:14px">
          <strong>💊 Registro de Salud (15M = $0.15)</strong>
          <div style="margin-top:8px;font-size:13px;color:#1b4a33">
            Cada control de salud registrado en la carpeta comunitaria suma Melantios. Cuidarse es invertir en la comunidad.
          </div>
        </article>

        <article style="background:#eef5ff;border:1px solid #d4dff6;border-radius:16px;padding:14px">
          <strong>👥 Traer Afiliado Nuevo (50M cascada = distribución en red)</strong>
          <div style="margin-top:8px;font-size:13px;color:#1a3a70">
            Si trae un nuevo socio, usted, su padrino y el presidente ganan en cascada. Cada acción del nuevo socio genera recompensas en tres niveles.
          </div>
        </article>

        <article style="background:#fff;border:2px dashed #dbe7de;border-radius:16px;padding:14px">
          <strong>⚠️ Importante</strong>
          <div style="margin-top:8px;font-size:12px;color:#4f6f5a">
            <div>• Los Melantios ganados van directo a la <strong>Alcancía Navideña</strong> (enero-noviembre bloqueados)</div>
            <div>• En <strong>diciembre</strong> se liberan y puede gastarlos en tiendas afiliadas</div>
            <div>• Máximo: 50% de descuento en compras (el otro 50% con dinero real)</div>
            <div>• Las historias que ganan Melantios quedan en revisión del padrino antes de liberar</div>
          </div>
        </article>
      </section>
      <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">
        <button onclick="window.MelantiaAsistente?.abrirAlforjaVirtualMelantios()">Ver mi cartera</button>
        <button onclick="window.MelantiaAsistente?.abrirComunidadVirtual()">Volver a Comunidad</button>
      </div>`;

    this._abrirPanel(
      'Oportunidades para Ganar Melantios',
      'Cada acción en la comunidad rinde Melantios que se guardan en tu alcancía navideña.',
      cuerpo,
      'Don Eloy'
    );

    this.hablarDonEloy(
      'Socio, ganarse Melantios es reconocer lo que usted sabe y hace. Historias, palabras, fidelidad, salud y traer gente nueva. Todo suma para la cena de Navidad. Eso es lo lindo del sistema.'
    );
    return true;
  },

  mostrarResumenAlcanciaVoz() {
    const estado = this._estadoComunidad();
    const melantios = estado.melantios || {};
    const alcancia = melantios.alcanciaNavideña || {};

    const totalGanado = (alcancia.historialDepositos || []).reduce(
      (sum, dep) => sum + dep.cantidad,
      0
    );
    const mesActual = new Date().getMonth() + 1;

    const cuerpo = `
      <section style="display:grid;gap:12px">
        <article style="background:#f5fbf5;border:1px solid #d3e7d3;border-radius:16px;padding:14px">
          <strong>📊 Auditoria de Alcancía</strong>
          <div style="margin-top:8px;display:grid;gap:6px;font-size:13px">
            <div><strong>Total acumulado año:</strong> ${this._escaparHtml(String(totalGanado))} Melantios</div>
            <div><strong>Saldo actual alcancía:</strong> ${this._escaparHtml(String(alcancia.saldoAcumulado || 0))} Melantios = $${(Number(alcancia.saldoAcumulado || 0) * 0.01).toFixed(2)}</div>
            <div><strong>Mes actual:</strong> ${this._escaparHtml(String(mesActual))}</div>
            <div><strong>Estado:</strong> ${mesActual === 12 ? '🎄 LIBERADO' : '🔒 BLOQUEADO'}</div>
          </div>
        </article>

        <article style="background:#fff;border:1px solid #dbe7de;border-radius:16px;padding:14px">
          <strong>📅 Movimientos por mes</strong>
          <div style="margin-top:8px;max-height:200px;overflow-y:auto">
            ${
              (alcancia.historialDepositos || []).length > 0
                ? (() => {
                    const porMes = new Map();
                    (alcancia.historialDepositos || []).forEach((dep) => {
                      const m = dep.mes || 1;
                      const actual = porMes.get(m) || {
                        mes: m,
                        cantidad: 0,
                        depositos: 0,
                      };
                      actual.cantidad += dep.cantidad;
                      actual.depositos += 1;
                      porMes.set(m, actual);
                    });
                    const meses = [
                      'Enero',
                      'Febrero',
                      'Marzo',
                      'Abril',
                      'Mayo',
                      'Junio',
                      'Julio',
                      'Agosto',
                      'Septiembre',
                      'Octubre',
                      'Noviembre',
                      'Diciembre',
                    ];
                    return Array.from(porMes.values())
                      .sort((a, b) => a.mes - b.mes)
                      .map(
                        (m) =>
                          `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e2ebe4;font-size:12px"><strong>${meses[m.mes - 1]}</strong> <span>${m.depositos} depósito(s) = ${m.cantidad}M</span></div>`
                      )
                      .join('');
                  })()
                : '<div style="font-size:12px;color:#4f6f5a">Sin movimientos aún</div>'
            }
          </div>
        </article>

        <article style="background:#eef7ff;border:1px solid #c9dcf7;border-radius:16px;padding:14px">
          <strong>✅ Integridad del Sistema</strong>
          <div style="margin-top:8px;font-size:12px;color:#1f4f80">
            <div>• Cada Melantio está respaldado por una acción registrada</div>
            <div>• Las historias quedan bajo revisión del padrino antes de confirmar</div>
            <div>• La alcancía es auditable: solo en diciembre se libera</div>
            <div>• Previene fraudes y mantiene la confianza comunitaria</div>
          </div>
        </article>
      </section>
      <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px">
        <button onclick="window.MelantiaAsistente?.abrirAlforjaVirtualMelantios()">Volver a Alforja</button>
        <button onclick="window.MelantiaAsistente?.abrirComunidadVirtual()">Volver a Comunidad</button>
      </div>`;

    this._abrirPanel(
      'Auditoria de Alcancía Navideña',
      'Revisión completa de tu historial de depósitos y estado actual.',
      cuerpo,
      'Don Eloy'
    );

    const frase =
      mesActual === 12
        ? 'Diciembre está aquí, socio. Su alcancía se abrió con todo lo que acumuló. Revisela bien.'
        : `Lleva ${totalGanado} Melantios ganados este año. Todo guardadito en la alcancía. En diciembre será la gran cosecha.`;

    this.hablarDonEloy(frase);
    return true;
  },

  abrirAlforjaVirtualMelantios() {
    const estado = this._estadoComunidad();
    const fidelidad = this._resumenFidelidad(estado);
    const melantios = estado.melantios || {};
    const alcancia = melantios.alcanciaNavideña || {};

    // Determinar estado y color
    const mesActual = new Date().getMonth() + 1;
    const estadoAlcancia = mesActual === 12 ? 'LIBERADO 🎄' : 'ACUMULANDO 📅';
    const colorEstado = mesActual === 12 ? '#2d7d3d' : '#0d4e8f';
    const diasRestantes = mesActual === 12 ? 0 : (12 - mesActual) * 30;
    const progresoFidelidad = Math.min(
      100,
      (fidelidad.mesesPagados / fidelidad.mesesRequeridos) * 100
    );
    const faltantesFidelidad = Math.max(
      0,
      fidelidad.mesesRequeridos - fidelidad.mesesPagados
    );

    const cuerpo = `
      <section style="display:grid;gap:12px">
        <article style="background:linear-gradient(135deg,#ffd700 0%,#ffed4e 100%);border:2px solid #daa520;border-radius:20px;padding:16px">
          <div style="display:flex;align-items:center;gap:12px">
            <img src="/src/assets/ui/icons/melantio_gold.svg" alt="Melantio" style="width:48px;height:36px" />
            <div>
              <strong style="font-size:28px;color:#5a3a0a">${this._escaparHtml(String(melantios.saldoActual || 0))}</strong>
              <div style="font-size:12px;color:#7a5a1a">Melantios disponibles para gastar</div>
            </div>
          </div>
        </article>

        <article style="background:linear-gradient(135deg,${colorEstado} 0%,${colorEstado === '#2d7d3d' ? '#1f6b33' : '#0a3d7a'} 100%);border:2px solid ${colorEstado};border-radius:20px;padding:16px;color:#fff">
          <strong style="font-size:18px">${this._escaparHtml(estadoAlcancia)}</strong>
          <div style="margin-top:10px;font-size:14px">
            <strong>${this._escaparHtml(String(alcancia.saldoAcumulado || 0))}</strong> Melantios acumulados
            <div style="margin-top:6px;font-size:12px;opacity:0.95">USD $${(Number(alcancia.saldoAcumulado || 0) * 0.01).toFixed(2)}</div>
          </div>
          ${diasRestantes > 0 ? `<div style="margin-top:10px;font-size:12px;background:rgba(255,255,255,0.2);border-radius:8px;padding:8px">⏳ Faltan ~${this._escaparHtml(String(diasRestantes))} días para la cosecha de Navidad</div>` : '<div style="margin-top:10px;font-size:12px;background:rgba(255,255,255,0.2);border-radius:8px;padding:8px">🎉 ¡Tu alcancía está ABIERTA! Disfruta tus Melantios en tiendas afiliadas</div>'}
        </article>

        <article style="background:#fff;border:1px solid #dbe7de;border-radius:16px;padding:14px">
          <strong>Regla de Oro de la Alcancía</strong>
          <div style="margin-top:8px;font-size:13px;color:#4f6f5a">
            <div>✅ Enero-Noviembre: acumulas sin poder gastar</div>
            <div>🎄 Diciembre: se abre y usas en tiendas (máx 50% de compra)</div>
            <div>💰 Flujo de caja: 11 meses de retención + auditoría</div>
            <div>🛡️ Protección: previene fraudes y mantiene valor comunitario</div>
          </div>
        </article>

        <article style="background:linear-gradient(135deg,#fff3e0 0%,#fff8e1 100%);border:2px solid #ffb74d;border-radius:16px;padding:14px">
          <strong style="display:flex;align-items:center;gap:8px">🔐 Candado de Fidelidad 12/12</strong>
          <div style="margin-top:10px;font-size:13px;color:#5d4037">
            <div style="margin-bottom:10px">Para desbloquear tu alcancía en diciembre, debes pagar todos los meses desde tu ingreso al ciclo anual.</div>
            <div style="display:grid;gap:8px">
              <div style="background:#fff;border-radius:8px;padding:8px;display:flex;align-items:center;justify-content:space-between">
                <strong>Progreso de fidelidad:</strong>
                <span style="font-size:16px;font-weight:bold;color:${fidelidad.mesesPagados >= fidelidad.mesesRequeridos ? '#2e7d32' : '#1976d2'}">${fidelidad.mesesPagados}/${fidelidad.mesesRequeridos}</span>
              </div>
              <div style="background:#fff;border-radius:8px;padding:8px">
                <div style="font-size:11px;color:#666;margin-bottom:4px">Barra de avance</div>
                <div style="width:100%;height:20px;background:#e0e0e0;border-radius:10px;overflow:hidden">
                  <div style="width:${progresoFidelidad}%;height:100%;background:linear-gradient(90deg,${fidelidad.mesesPagados >= fidelidad.mesesRequeridos ? '#4caf50' : '#ff9800'} 0%,${fidelidad.mesesPagados >= fidelidad.mesesRequeridos ? '#2e7d32' : '#f57c00'} 100%);transition:width 0.3s"></div>
                </div>
              </div>
              ${
                faltantesFidelidad > 0
                  ? `
                <div style="background:#fff;border-radius:8px;padding:8px;color:#d32f2f;font-size:12px">
                  ⚠️ Faltan ${faltantesFidelidad} meses de pago para desbloquear
                </div>
              `
                  : `
                <div style="background:#e8f5e9;border-radius:8px;padding:8px;color:#2e7d32;font-size:12px;font-weight:bold">
                  ✅ ¡Requisito cumplido! Tu alcancía se puede abrir en diciembre
                </div>
              `
              }
              <div style="background:#fff;border-radius:8px;padding:8px;font-size:12px;color:${alcancia.auditoriaAprobada ? '#2e7d32' : '#d84315'}">
                ${alcancia.auditoriaAprobada ? '✅ Auditoría de contenido aprobada' : '🧾 Auditoría pendiente: requisito obligatorio antes de liberar'}
              </div>
            </div>
            <div style="margin-top:10px;font-size:12px;background:#ffebee;border-left:3px solid #c62828;padding:8px;border-radius:4px;color:#c62828">
              <strong>⚠️ Advertencia:</strong> Si falta un pago, el contador reinicia. El que se hace el vivo y no paga, se queda viendo la alcancía desde afuera.
            </div>
          </div>
        </article>

        <article style="background:#f5fbf5;border:1px solid #d3e7d3;border-radius:16px;padding:14px">
          <strong>Historial de depósitos este año</strong>
          <div style="margin-top:8px;max-height:180px;overflow-y:auto">
            ${
              (alcancia.historialDepositos || []).length > 0
                ? (alcancia.historialDepositos || [])
                    .slice(0, 12)
                    .map(
                      (dep) =>
                        `<div style="display:flex;justify-content:space-between;font-size:12px;padding:6px 0;border-bottom:1px solid #e2ebe4">${this._escaparHtml(new Date(dep.fecha).toLocaleDateString('es-EC'))} · ${this._escaparHtml(dep.tipo)} · <strong>+${this._escaparHtml(String(dep.cantidad))}M</strong></div>`
                    )
                    .join('')
                : '<div style="font-size:12px;color:#4f6f5a">Aún no hay depósitos registrados este año</div>'
            }
          </div>
        </article>
      </section>
      <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">
        <button onclick="window.MelantiaAsistente?.verEstadoAlcanciaVoz()">Detalles</button>
        <button onclick="window.MelantiaAsistente?.explicarOportunidadesMelantios()">¿Cómo ganar?</button>
        <button onclick="window.MelantiaAsistente?.abrirComunidadVirtual()">Volver</button>
      </div>`;

    this._abrirPanel(
      'Alforja Virtual · Mis Melantios',
      'Tu cartera personal de Melantios con alcancía de Navidad integrada y auditoría de integridad.',
      cuerpo,
      'Don Eloy'
    );

    this.hablarDonEloy(
      `Socio, bienvenido a su alforja virtual. Usted tiene ${melantios.saldoActual || 0} Melantios listos para gastar, y ${alcancia.saldoAcumulado || 0} bloqueados en la alcancía navideña. Lleva ${fidelidad.mesesPagados} meses de ${fidelidad.mesesRequeridos} para cumplir su fidelidad del ciclo. ${fidelidad.mesesPagados >= fidelidad.mesesRequeridos ? '¡Felicitaciones! Ya cumplió el requisito de pagos.' : 'Siga pagando con constancia para desbloquear su premio en diciembre.'} ${alcancia.auditoriaAprobada ? 'La auditoría de contenido está aprobada.' : 'Recuerde que la auditoría de contenido es obligatoria antes de liberar.'}`
    );
    return true;
  },

  async escucharOrden(comandoOriginal) {
    const comando = this._normalizar(comandoOriginal);
    if (!comando || !comando.includes('melantia')) return false;
    const lenguaDetectada =
      this.actualizarDeteccionLenguaDonEloy(comandoOriginal);
    if (lenguaDetectada && lenguaDetectada !== 'es') {
      await this.protocoloAprendizajeLinguisticoDonEloy(comandoOriginal);
    }

    if (comando.includes('como va mi finca')) {
      return this.mostrarEstadoFinca();
    }

    if (comando.includes('quiero aprender')) {
      return this.abrirCatalogoFormacion();
    }

    if (
      comando.includes('mi comunidad virtual') ||
      comando.includes('comunidad virtual')
    ) {
      return this.abrirComunidadVirtual();
    }

    if (comando.includes('asesoria legal')) {
      return this.abrirItemComunidad('legal');
    }

    if (
      comando.includes('don eloy') ||
      comando.includes('codigo de etica') ||
      comando.includes('palabra de socio')
    ) {
      return this.abrirCodigoEticaComunidad();
    }

    if (
      comando.includes('contrato del padrino') ||
      comando.includes('compromiso del padrino') ||
      comando.includes('acuerdo del padrino')
    ) {
      return this.abrirContratoPadrinoMelantia();
    }

    if (
      comando.includes('misiones por validar') ||
      comando.includes('panel de auditoria del padrino') ||
      comando.includes('validar misiones del padrino')
    ) {
      return this.abrirMisionesPadrinoPorValidar();
    }

    if (
      comando.includes('invitar socio') ||
      comando.includes('invitar primer socio') ||
      comando.includes('invitacion de padrino')
    ) {
      return this.invitarSocioPadrinoMelantia();
    }

    if (comando.includes('ciudadano rural')) {
      return this.abrirItemComunidad('ciudadano');
    }

    if (
      comando.includes('noticias y precios') ||
      comando.includes('precios referenciales') ||
      comando.includes('noticias precios referenciales')
    ) {
      return this.abrirItemComunidad('noticias');
    }

    if (
      comando.includes('emergencias rapidas') ||
      comando.includes('manual de emergencias rapidas') ||
      comando.includes('botones de panico') ||
      comando.includes('picadura de culebra') ||
      comando.includes('herida sangrante') ||
      comando.includes('parto en camino') ||
      comando.includes('intoxicacion') ||
      comando.includes('choque electrico') ||
      comando.includes('desmayo')
    ) {
      return this.abrirEmergenciasRapidasSalud();
    }

    if (
      comando.includes('asistente preventivo de salud') ||
      comando.includes('salud preventiva') ||
      comando.includes('ficha de emergencia') ||
      comando.includes('manual de emergencia')
    ) {
      return this.abrirAsistentePreventivoSalud();
    }

    if (comando.includes('tablon de don eloy') || comando.includes('tablon')) {
      return this.abrirTablonDonEloy();
    }

    if (
      comando.includes('noticiero de don eloy') ||
      comando.includes('noticiero de la plaza') ||
      comando.includes('dato del dia')
    ) {
      return this.publicarNoticieroDonEloy();
    }

    if (
      comando.includes('cuenteme algo') ||
      comando.includes('cuento de don eloy') ||
      comando.includes('hora de don eloy') ||
      comando.includes('historia de don eloy')
    ) {
      return this.contarHistoriaDonEloy();
    }

    if (
      comando.includes('chiste de don eloy') ||
      comando.includes('humor de don eloy') ||
      comando.includes('refran de don eloy')
    ) {
      return this.contarHumorDonEloy();
    }

    if (
      comando.includes('programacion de don eloy') ||
      comando.includes('ejecutar programacion de la plaza')
    ) {
      return this.ejecutarProgramacionDonEloyDiaria();
    }

    if (
      comando.includes('saludo intercultural') ||
      comando.includes('don eloy poliglota') ||
      comando.includes('palabra en quichua') ||
      comando.includes('palabra en shuar')
    ) {
      return this.saludoInterculturalDonEloy();
    }

    if (
      comando.includes('aportar historia anonima') ||
      comando.includes('chisme anonimo') ||
      comando.includes('contar aporte anonimo')
    ) {
      if (comando.includes('contar')) return this.contarAporteAnonimoDonEloy();
      return this.registrarAporteAnonimoDonEloy();
    }

    if (
      comando.includes('ensenar palabra') ||
      comando.includes('aprendizaje linguistico') ||
      comando.includes('don eloy aprende')
    ) {
      return this.registrarAprendizajeLinguisticoDonEloy();
    }

    if (
      comando.includes('validar termino') ||
      comando.includes('validar aprendizaje') ||
      comando.includes('validar lengua')
    ) {
      return this.validarAprendizajeLinguisticoDonEloy();
    }

    if (
      comando.includes('grabar tesoro') ||
      comando.includes('tesoro de los abuelos') ||
      comando.includes('mision rescate palabra antigua')
    ) {
      return this.grabarTesoroAbuelosDonEloy();
    }

    if (
      comando.includes('mapa de sabiduria') ||
      comando.includes('guardian de la memoria') ||
      comando.includes('archivo de voces ancestrales')
    ) {
      return this.verMapaSabiduriaDonEloy();
    }

    if (
      comando.includes('compartir hallazgo ancestral') ||
      comando.includes('contar voz ancestral')
    ) {
      return this.compartirHallazgoAncestralDonEloy();
    }

    if (
      comando.includes('sostenibilidad y proyectos') ||
      comando.includes('arca digital de memoria') ||
      comando.includes('tesoro sostenible')
    ) {
      return this.abrirTesoroAbuelosSostenibilidad();
    }

    if (
      comando.includes('negocios con palabra') ||
      comando.includes('tratos de palabra') ||
      comando.includes('don eloy en negocios')
    ) {
      return this.abrirNegociosConDonEloy();
    }

    if (
      comando.includes('tienda melantia') ||
      comando.includes('venta de ganado') ||
      comando.includes('maquinaria e insumos') ||
      comando.includes('cosechas y productos') ||
      comando.includes('semovientes')
    ) {
      return this.abrirTiendaMelantia();
    }

    if (
      comando.includes('inversiones y propiedades') ||
      comando.includes('transaccion protegida') ||
      comando.includes('custodia melantia') ||
      comando.includes('venta de finca') ||
      comando.includes('bienes raices rurales')
    ) {
      return this.abrirIntermediacionPropiedades();
    }

    if (
      comando.includes('registro de evidencia') ||
      comando.includes('foto inteligente') ||
      comando.includes('evidencia certificada') ||
      comando.includes('album de evidencias')
    ) {
      return this.abrirRegistroEvidencia();
    }

    if (
      comando.includes('evidencia para negocios') ||
      comando.includes('scanner notarial')
    ) {
      return this.abrirRegistroEvidencia('negocios');
    }

    if (
      comando.includes('reporte de asistencia') ||
      comando.includes('foto para fabrizzio') ||
      comando.includes('foto para doctor jorge')
    ) {
      return this.abrirRegistroEvidencia('asistencia');
    }

    if (
      comando.includes('carpeta documentos') ||
      comando.includes('boveda documental') ||
      comando.includes('documentos de evidencia')
    ) {
      return this.abrirCarpetaDocumentosRegistro();
    }

    if (comando.includes('escuela de campo')) {
      return window.EscuelaCampoMelantia?.abrirPanel?.() || false;
    }

    if (
      comando.includes('mi certificado') ||
      comando.includes('mi diploma') ||
      comando.includes('boveda de documentos')
    ) {
      return window.EscuelaCampoMelantia?.abrirBovedaCertificados?.() || false;
    }

    if (comando.includes('por que es importante el registro')) {
      return this.explicarRegistro();
    }

    if (comando.includes('resumen del dia')) {
      return this.resumenDelDia();
    }

    // ===== COMANDOS DE VOZ PARA MELANTIOS - ALCANCÍA NAVIDEÑA =====

    if (
      comando.includes('cuantos melantios tengo') ||
      comando.includes('mi saldo de melantios') ||
      comando.includes('cuantos melantios') ||
      comando.includes('saldo melantios')
    ) {
      return this.verSaldoMelantiosVoz();
    }

    if (
      comando.includes('mi alcancia de navidad') ||
      comando.includes('alcancia navideña') ||
      comando.includes('alcancia navidad') ||
      comando.includes('mi alcancia melantios') ||
      comando.includes('estado de la alcancia')
    ) {
      return this.verEstadoAlcanciaVoz();
    }

    if (
      comando.includes('como gano melantios') ||
      comando.includes('como obtener melantios') ||
      comando.includes('oportunidades melantios') ||
      comando.includes('rescate historia melantios') ||
      comando.includes('palabra nueva melantios')
    ) {
      return this.explicarOportunidadesMelantios();
    }

    if (
      comando.includes('resumen alcancia') ||
      comando.includes('informe alcancia') ||
      comando.includes('auditoria alcancia')
    ) {
      return this.mostrarResumenAlcanciaVoz();
    }

    if (
      comando.includes('abrir alforja virtual') ||
      comando.includes('mis melantios') ||
      comando.includes('cartera melantios') ||
      comando.includes('billetera virtual')
    ) {
      return this.abrirAlforjaVirtualMelantios();
    }

    // ===== FIN COMANDOS MELANTIOS =====

    this.hablar(
      'Puedes decir: Melantia, mi comunidad virtual; Don Eloy; codigo de etica; tablon de Don Eloy; noticiero de la plaza; cuenteme algo; chiste de Don Eloy; programacion de Don Eloy; saludo intercultural; ensenar palabra; validar termino; grabar tesoro; mapa de sabiduria; guardian de la memoria; compartir hallazgo ancestral; sostenibilidad y proyectos; tesoro sostenible; aporte anonimo; asesoria legal; ciudadano rural; noticias y precios; salud preventiva; emergencias rapidas; picadura de culebra; ficha de emergencia; negocios con palabra; inversiones y propiedades; transaccion protegida; registro de evidencia; foto inteligente; evidencia para negocios; reporte de asistencia; carpeta documentos; escuela de campo; mi certificado; como va mi finca; cuantos melantios tengo; mi alcancia de navidad; como gano melantios; por que es importante el registro; o resumen del dia.'
    );
    return true;
  },
};

window.MelantiaAsistente = MelantiaAsistente;

const MelantiaComandosVoz = {
  _escuchaActiva: false,

  _normalizar(texto) {
    return String(texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  },

  _resolverAnimalActivo() {
    const sesion = window._melantia_session || {};
    const idAnimal =
      sesion.idAnimalActivo || sesion.idAnimalActual || sesion.animalId || null;
    const lote = sesion.loteActivo || sesion.idLote || null;
    const datosSesion =
      sesion.datosAnimalActivo ||
      sesion.animalActivo ||
      sesion.animal ||
      sesion.datosAnimal ||
      null;

    if (datosSesion && typeof datosSesion === 'object') {
      return {
        id: datosSesion.id || idAnimal,
        idLote: datosSesion.idLote || datosSesion.id_lote || lote,
        ...datosSesion,
      };
    }

    if (!idAnimal) return null;

    return {
      id: idAnimal,
      idLote: lote,
      identificacion: `Animal ${idAnimal}`,
      nombre: `Animal ${idAnimal}`,
      especie: 'Animal',
      estado: 'disponible',
      lote,
    };
  },

  _mostrarFichaCompartir(ficha, experto = 'Valentina') {
    const panel = document.getElementById('panel-novedades');
    if (!panel || !ficha) return false;

    if (typeof StaffController !== 'undefined') {
      StaffController.activarPersonaje(experto);
    }

    const textoPreview = String(
      ficha.mensajeHibrido || ficha.resumenTexto || ''
    )
      .split('\n')
      .slice(0, 8)
      .join('<br>');

    panel.style.maxWidth = '480px';
    panel.innerHTML = `
      <div class="novedad-card" data-experto="${experto}">
        <p class="novedad-n1">🛡️ Ficha de venta protegida generada</p>
        <p class="novedad-n2">Las coordenadas externas quedaron en modo <strong>${ficha.modoUbicacion || 'privada'}</strong>.</p>
        <p class="novedad-n3">${textoPreview}</p>
        <div class="novedad-acciones">
          <button onclick="window.open('${String(ficha.whatsappURL || '').replace(/'/g, '%27')}', '_blank', 'noopener')">WhatsApp</button>
          <button onclick="navigator.clipboard?.writeText(${JSON.stringify('')});">Copiar</button>
          <button onclick="MelantiaVerificacion.cerrar()">Cerrar</button>
        </div>
      </div>`;
    const botones = panel.querySelectorAll('button');
    if (botones[1]) {
      botones[1].onclick = async () => {
        try {
          await navigator.clipboard?.writeText(
            ficha.mensajeHibrido || ficha.resumenTexto || ''
          );
          _voz('Mensaje híbrido copiado para compartir.');
        } catch {
          _voz('No pude copiar el mensaje automáticamente.');
        }
      };
    }
    if (botones[2]) {
      botones[2].onclick = () => {
        panel.style.display = 'none';
        panel.innerHTML = '';
      };
    }
    panel.style.display = 'block';
    return true;
  },

  async ejecutar(textoOriginal) {
    const texto = this._normalizar(textoOriginal);
    if (!texto) return false;

    if (window.ComandosPaulette?.procesar?.(textoOriginal)) {
      return true;
    }

    if (window.ComandosAngel?.procesar?.(textoOriginal)) {
      return true;
    }

    if (await window.MelantiaAsistente?.escucharOrden?.(textoOriginal)) {
      return true;
    }

    if (await DrJorgeVeterinario.escucharOrden(textoOriginal)) {
      return true;
    }

    if (await FabrizzioAsesor.escucharOrden(textoOriginal)) {
      return true;
    }

    if (
      texto.includes('privacidad') ||
      texto.includes('ocultar coordenadas') ||
      texto.includes('abrir privacidad gps')
    ) {
      MelantiaPrivacidadUbicacion.abrir();
      _voz('Panel de privacidad de ubicación abierto.');
      return true;
    }

    if (
      texto.includes('genera ficha de venta protegida') ||
      texto.includes('generar ficha de venta protegida') ||
      texto.includes('ficha protegida')
    ) {
      const animal = this._resolverAnimalActivo();
      if (!animal) {
        _voz('No tengo un animal activo para generar la ficha protegida.');
        return true;
      }
      if (typeof window.generarFichaVentaProtegidaMelantia !== 'function') {
        _voz(
          'El generador de ficha protegida no está disponible en esta vista.'
        );
        return true;
      }

      ui_melantia.pensar();
      try {
        const fichaSegura = await window.generarFichaVentaProtegidaMelantia(
          animal,
          { persistirLigera: true }
        );
        this._mostrarFichaCompartir(fichaSegura);
        _voz(
          'Ficha generada con éxito. Las coordenadas exactas han sido ocultadas por tu seguridad.'
        );
      } catch (error) {
        console.error('[Voz] Error al generar ficha protegida:', error);
        _voz('No pude generar la ficha protegida en este momento.');
      } finally {
        ui_melantia.listo();
      }
      return true;
    }

    if (
      texto.includes('genera acta de entrega') ||
      texto.includes('generar acta de entrega') ||
      texto.includes('acta de entrega')
    ) {
      const sesion = window._melantia_session || {};
      const idLote = sesion.loteActivo || sesion.idLote || null;
      if (!idLote) {
        _voz('No tengo un lote activo para generar el acta de entrega.');
        return true;
      }
      await GestorGranjasMelantia.generarDocumentoLegal(idLote, 'acta_entrega');
      return true;
    }

    if (texto.includes('trato hecho')) {
      const sesion = window._melantia_session || {};
      const idLote = sesion.loteActivo || sesion.idLote || null;
      if (!idLote) {
        _voz('No tengo un lote activo para cerrar la venta.');
        return true;
      }
      await GestorGranjasMelantia.generarDocumentoLegal(
        idLote,
        'contrato_venta',
        {
          capturarFirmas: true,
          sincronizarPost: true,
          liberarEspacioPost: true,
          mensajeCierre:
            '¡Felicidades por la venta! Generando contrato final y liberando espacio en memoria. Los documentos quedan en resguardo seguro y se subirán a la nube automáticamente.',
        }
      );
      return true;
    }

    return false;
  },

  iniciar() {
    const boton = document.getElementById('btn-voz-general');
    if (!boton) return;

    boton.addEventListener('click', async () => {
      const Reconocedor =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!Reconocedor) {
        const comando = window.prompt(
          'Escribe tu comando para MELANTIA',
          'Melantia, genera ficha de venta protegida'
        );
        if (comando) await this.ejecutar(comando);
        return;
      }

      if (this._escuchaActiva) return;
      const recognition = new Reconocedor();
      recognition.lang = 'es-EC';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      this._escuchaActiva = true;
      ui_melantia.pensar();

      recognition.onresult = async (event) => {
        const comando = event.results?.[0]?.[0]?.transcript || '';
        await this.ejecutar(comando);
      };

      recognition.onerror = () => {
        _voz('No pude escuchar con claridad. Intenta de nuevo.');
      };

      recognition.onend = () => {
        this._escuchaActiva = false;
        ui_melantia.listo();
      };

      recognition.start();
    });
  },
};

window.MelantiaComandosVoz = MelantiaComandosVoz;

const GestorGranjasMelantia = {
  _cacheTablero: null,
  _cacheDocumentos: [],
  _claveMarcaRancho: 'melantia_marca_rancho',

  _escaparHtml(valor) {
    return String(valor ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  _capitalizar(valor) {
    const texto = String(valor || '').trim();
    return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : '—';
  },

  _formatearTamano(bytes = 0) {
    const total = Number(bytes) || 0;
    if (total <= 0) return '0 KB';
    if (total < 1024 * 1024)
      return `${Math.max(1, Math.round(total / 1024))} KB`;
    return `${(total / (1024 * 1024)).toFixed(1)} MB`;
  },

  _tiempoRelativo(fechaIso) {
    if (!fechaIso) return 'Sin fotos';
    const fecha = new Date(fechaIso);
    if (Number.isNaN(fecha.getTime())) return String(fechaIso);
    const diffMs = Date.now() - fecha.getTime();
    const diffMin = Math.max(1, Math.round(diffMs / 60000));
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffH = Math.round(diffMin / 60);
    if (diffH < 24) return `Hace ${diffH} h`;
    const diffD = Math.round(diffH / 24);
    return `Hace ${diffD} día(s)`;
  },

  _modoPrivacidadActual() {
    if (typeof window.obtenerPrivacidadUbicacionMelantia === 'function') {
      return window.obtenerPrivacidadUbicacionMelantia().modo;
    }
    return 'exacta';
  },

  _resolverAnimalLote(lote) {
    const idAnimal =
      lote.id_animal_representativo || lote.animales_ids?.[0] || null;
    return {
      id: idAnimal,
      idLote: lote.id_lote,
      lote: lote.id_lote,
      identificacion: lote.nombre_lote,
      nombre: lote.nombre_lote,
      especie: 'Animal',
      estado: lote.ultima_etapa || 'activo',
      fechaDisponibilidad: lote.ultima_foto_iso || new Date().toISOString(),
    };
  },

  _resolverLoteAgricola(lote) {
    return {
      id: lote.id_lote,
      idLote: lote.id_lote,
      identificacion: lote.nombre_lote,
      nombre: lote.nombre_lote,
      especie: lote.cultivo || 'Cultivo',
      estado: lote.alerta_tecnica || lote.ultima_etapa || 'monitoreo',
      fechaDisponibilidad:
        lote.cosecha_estimada ||
        lote.ultima_foto_iso ||
        new Date().toISOString(),
      finca: lote.nombre_lote,
    };
  },

  _buscarLote(idLote) {
    return (
      this._cacheTablero?.lotes?.find(
        (lote) => String(lote.id_lote) === String(idLote)
      ) || null
    );
  },

  _abrirVentanaDocumento(html, titulo = 'Melantia') {
    window.MelantiaAsistente?.registrarDocumentoModulo({
      titulo,
      contenido: html,
      mimeType: 'text/html;charset=utf-8',
      origen: 'visor_documento',
    }).catch((error) =>
      console.warn('[Melantia] No pude centralizar documento en visor:', error)
    );
    const win = window.open('', '_blank', 'width=980,height=860');
    if (!win) {
      _voz('Permite ventanas emergentes para abrir el documento.');
      return false;
    }
    win.document.write(html);
    win.document.close();
    win.document.title = titulo;
    win.focus();
    return true;
  },

  _obtenerMarcaRancho() {
    try {
      const raw = localStorage.getItem(this._claveMarcaRancho);
      if (!raw) {
        return {
          nombreMarca: '',
          slogan: '',
          logoDataUrl: '',
        };
      }
      const data = JSON.parse(raw);
      return {
        nombreMarca: String(data?.nombreMarca || '').trim(),
        slogan: String(data?.slogan || '').trim(),
        logoDataUrl: String(data?.logoDataUrl || '').trim(),
      };
    } catch {
      return {
        nombreMarca: '',
        slogan: '',
        logoDataUrl: '',
      };
    }
  },

  _guardarMarcaRancho(data = {}) {
    const payload = {
      nombreMarca: String(data.nombreMarca || '').trim(),
      slogan: String(data.slogan || '').trim(),
      logoDataUrl: String(data.logoDataUrl || '').trim(),
    };
    localStorage.setItem(this._claveMarcaRancho, JSON.stringify(payload));
    return payload;
  },

  async _leerImagenMarcaComoDataUrl(file) {
    if (!file) return '';

    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () =>
        reject(reader.error || new Error('No pude leer la imagen.'));
      reader.readAsDataURL(file);
    });

    const imagen = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () =>
        reject(new Error('No pude procesar la imagen de la marca.'));
      img.src = dataUrl;
    });

    const maxLado = 320;
    const escala = Math.min(1, maxLado / Math.max(imagen.width, imagen.height));
    const width = Math.max(1, Math.round(imagen.width * escala));
    const height = Math.max(1, Math.round(imagen.height * escala));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;
    ctx.drawImage(imagen, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.82);
  },

  abrirConfiguracionMarcaRancho(vistaRetorno = 'tablero') {
    const panel = document.getElementById('panel-novedades');
    if (!panel) return;

    const marca = this._obtenerMarcaRancho();
    const preview = marca.logoDataUrl
      ? `<img src="${marca.logoDataUrl}" alt="Marca del rancho" style="max-width:180px;max-height:110px;border-radius:12px;border:1px solid #d7e2da;background:#fff;padding:6px;object-fit:contain" />`
      : '<div style="padding:18px;border:1px dashed #c8d6cc;border-radius:12px;color:#607266;font-size:12px">Sin imagen de marca cargada.</div>';

    panel.style.maxWidth = '760px';
    panel.innerHTML = `
      <div class="novedad-card" data-experto="Melantia" style="display:grid;gap:12px">
        <p class="novedad-n1">🏷️ Marca del Rancho</p>
        <p class="novedad-n2">Sube una imagen ligera del nombre, logo o letrero de tu rancho y agrega un slogan para que aparezca en contratos y actas.</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;align-items:start">
          <div style="display:grid;gap:10px">
            <label style="display:grid;gap:6px;font-size:13px;color:#355246"><span>Nombre o marca comercial</span><input data-marca-nombre type="text" value="${this._escaparHtml(marca.nombreMarca)}" placeholder="Ej. Rancho La Esperanza" style="padding:10px 12px;border:1px solid #ccd8d0;border-radius:10px" /></label>
            <label style="display:grid;gap:6px;font-size:13px;color:#355246"><span>Slogan o frase</span><input data-marca-slogan type="text" value="${this._escaparHtml(marca.slogan)}" placeholder="Ej. Crianza con trazabilidad real" style="padding:10px 12px;border:1px solid #ccd8d0;border-radius:10px" /></label>
            <label style="display:grid;gap:6px;font-size:13px;color:#355246"><span>Imagen o foto del nombre</span><input data-marca-imagen type="file" accept="image/*" style="padding:8px;border:1px solid #ccd8d0;border-radius:10px;background:#fff" /></label>
          </div>
          <div style="display:grid;gap:8px"><strong style="font-size:13px;color:#294435">Vista actual</strong><div data-marca-preview>${preview}</div></div>
        </div>
        <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px">
          <button type="button" data-marca-guardar>Guardar marca</button>
          <button type="button" data-marca-limpiar>Quitar imagen</button>
          <button type="button" data-marca-volver>Volver</button>
        </div>
      </div>`;
    panel.style.display = 'block';

    const inputNombre = panel.querySelector('[data-marca-nombre]');
    const inputSlogan = panel.querySelector('[data-marca-slogan]');
    const inputImagen = panel.querySelector('[data-marca-imagen]');
    const contenedorPreview = panel.querySelector('[data-marca-preview]');
    const botonGuardar = panel.querySelector('[data-marca-guardar]');
    const botonLimpiar = panel.querySelector('[data-marca-limpiar]');
    const botonVolver = panel.querySelector('[data-marca-volver]');
    if (
      !inputNombre ||
      !inputSlogan ||
      !inputImagen ||
      !contenedorPreview ||
      !botonGuardar ||
      !botonLimpiar ||
      !botonVolver
    ) {
      return;
    }

    let logoDataUrl = marca.logoDataUrl || '';
    const renderPreview = () => {
      contenedorPreview.innerHTML = logoDataUrl
        ? `<img src="${logoDataUrl}" alt="Marca del rancho" style="max-width:180px;max-height:110px;border-radius:12px;border:1px solid #d7e2da;background:#fff;padding:6px;object-fit:contain" />`
        : '<div style="padding:18px;border:1px dashed #c8d6cc;border-radius:12px;color:#607266;font-size:12px">Sin imagen de marca cargada.</div>';
    };

    inputImagen.addEventListener('change', async (event) => {
      const archivo = event.target.files?.[0];
      if (!archivo) return;
      try {
        logoDataUrl = await this._leerImagenMarcaComoDataUrl(archivo);
        renderPreview();
      } catch (error) {
        console.error('[Marca] Error al procesar imagen:', error);
        _voz('No pude procesar la imagen de la marca.');
      }
    });

    botonGuardar.onclick = async () => {
      this._guardarMarcaRancho({
        nombreMarca: inputNombre.value,
        slogan: inputSlogan.value,
        logoDataUrl,
      });
      _voz(
        'Marca del rancho guardada. Los nuevos documentos usarán tu identidad visual.'
      );
      if (vistaRetorno === 'documentos') {
        await this.abrirDocumentos();
        return;
      }
      await this.abrirTableroControl();
    };

    botonLimpiar.onclick = () => {
      logoDataUrl = '';
      inputImagen.value = '';
      renderPreview();
    };

    botonVolver.onclick = async () => {
      if (vistaRetorno === 'documentos') {
        await this.abrirDocumentos();
        return;
      }
      await this.abrirTableroControl();
    };
  },

  _renderMarcaRanchoVisual(opciones = {}) {
    const marca = this._obtenerMarcaRancho();
    const compacta = opciones.compacta !== false;
    const enLinea = opciones.enLinea === true;
    const soloLogoEnMovil =
      enLinea && typeof window !== 'undefined' && window.innerWidth <= 640;
    const textoAyuda = [marca.nombreMarca, marca.slogan]
      .filter(Boolean)
      .join(' • ');
    if (!marca.nombreMarca && !marca.slogan && !marca.logoDataUrl) {
      return compacta
        ? `<div style="display:flex;align-items:center;gap:8px;padding:${enLinea ? '4px 8px' : '10px 12px'};border:1px dashed #cdd9d1;border-radius:12px;background:#f8fbf9"><div style="font-size:${enLinea ? '11px' : '12px'};color:#617166">Personaliza el nombre o logo de tu finca.</div></div>`
        : `<div style="display:flex;align-items:center;gap:12px;padding:14px 16px;border:1px dashed #cdd9d1;border-radius:14px;background:#f8fbf9"><div style="font-size:13px;color:#617166">Aún no has configurado la identidad visual de tu finca o rancho.</div></div>`;
    }

    const logo = marca.logoDataUrl
      ? `<img src="${marca.logoDataUrl}" alt="Marca del rancho" style="max-width:${enLinea ? 28 : compacta ? 58 : 84}px;max-height:${enLinea ? 28 : compacta ? 58 : 84}px;border-radius:${enLinea ? '8px' : '12px'};border:1px solid #d7e2da;background:#fff;padding:${enLinea ? '2px' : '4px'};object-fit:contain" />`
      : '';
    if (soloLogoEnMovil) {
      return `<button type="button" title="${this._escaparHtml(textoAyuda || 'Marca del rancho')}" onclick="const popup=this.nextElementSibling; if(popup){ popup.style.display=popup.style.display==='block' ? 'none' : 'block'; }" style="position:relative;display:flex;align-items:center;gap:8px;padding:4px 8px;border:1px solid #dbe7de;border-radius:999px;background:#f7faf8;max-width:fit-content;cursor:pointer">${logo || `<span style="font-size:12px;font-weight:700;color:#214031">R</span>`}</button><div style="display:none;position:absolute;top:100%;right:0;margin-top:6px;background:#214031;color:#fff;font-size:11px;line-height:1.3;padding:8px 10px;border-radius:10px;box-shadow:0 8px 20px rgba(0,0,0,.16);max-width:180px;z-index:5">${this._escaparHtml(textoAyuda || marca.nombreMarca || 'Marca del rancho')}</div>`;
    }
    return `<div title="${this._escaparHtml(textoAyuda || 'Marca del rancho')}" style="display:flex;align-items:center;gap:${enLinea ? '8px' : '12px'};padding:${enLinea ? '4px 8px' : compacta ? '10px 12px' : '14px 16px'};border:1px solid #dbe7de;border-radius:${enLinea ? '999px' : '14px'};background:#f7faf8;max-width:fit-content">${logo}<div style="min-width:0"><div style="font-size:${enLinea ? '12px' : compacta ? '14px' : '18px'};font-weight:700;color:#214031;line-height:1.1">${this._escaparHtml(marca.nombreMarca || 'Mi finca / mi rancho')}</div>${marca.slogan && !enLinea ? `<div style="font-size:${compacta ? '11px' : '13px'};color:#5d6d63;margin-top:2px">${this._escaparHtml(marca.slogan)}</div>` : ''}</div></div>`;
  },

  async _obtenerSelloGeoTemporalInterno() {
    const selloBase = {
      timestamp: new Date().toISOString(),
      origen: 'melantia_firma_vectorial',
      gpsDisponible: false,
    };

    if (!navigator.geolocation) {
      return selloBase;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (posicion) => {
          resolve({
            ...selloBase,
            gpsDisponible: true,
            latitud: Number(posicion.coords.latitude.toFixed(6)),
            longitud: Number(posicion.coords.longitude.toFixed(6)),
            precisionMetros: Math.round(posicion.coords.accuracy || 0),
          });
        },
        () => resolve(selloBase),
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 30000,
        }
      );
    });
  },

  async _capturarFirmaVectorial({ titulo, firmante, subtitulo }) {
    const panel = document.getElementById('panel-novedades');
    if (!panel) return null;

    panel.style.maxWidth = '760px';
    panel.innerHTML = `
      <div class="novedad-card" data-experto="Melantia">
        <p class="novedad-n1">🖋️ ${this._escaparHtml(titulo || 'Firma digital')}</p>
        <p class="novedad-n2">${this._escaparHtml(subtitulo || 'Firma con el dedo sobre la pantalla. MELANTIA guardará solo el trazo vectorial, con sello interno de tiempo y ubicación.')}</p>
        <p class="novedad-n3"><strong>Firmante:</strong> ${this._escaparHtml(firmante || 'Pendiente')}</p>
        <div style="background:#f6f8f7;border:1px solid #d8e1db;border-radius:16px;padding:12px">
          <canvas data-firma-canvas width="680" height="220" style="width:100%;height:220px;background:#fff;border:1px dashed #a8b8ad;border-radius:12px;touch-action:none;display:block"></canvas>
        </div>
        <div class="novedad-acciones" style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
          <button type="button" data-firma-limpiar>Limpiar</button>
          <button type="button" data-firma-confirmar>Confirmar firma</button>
          <button type="button" data-firma-cancelar>Cancelar</button>
        </div>
      </div>`;
    panel.style.display = 'block';

    return new Promise((resolve) => {
      const canvas = panel.querySelector('[data-firma-canvas]');
      const botonLimpiar = panel.querySelector('[data-firma-limpiar]');
      const botonConfirmar = panel.querySelector('[data-firma-confirmar]');
      const botonCancelar = panel.querySelector('[data-firma-cancelar]');
      if (!canvas || !botonLimpiar || !botonConfirmar || !botonCancelar) {
        resolve(null);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      const trazos = [];
      let trazoActual = null;
      const inicio = Date.now();

      const dibujarBase = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#173728';
        ctx.lineWidth = 2.2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
      };

      const normalizarPunto = (evento) => {
        const rect = canvas.getBoundingClientRect();
        const escalaX = canvas.width / rect.width;
        const escalaY = canvas.height / rect.height;
        const x = (evento.clientX - rect.left) * escalaX;
        const y = (evento.clientY - rect.top) * escalaY;
        return {
          x: Math.max(0, Math.min(canvas.width, x)),
          y: Math.max(0, Math.min(canvas.height, y)),
        };
      };

      const agregarPunto = (evento) => {
        if (!trazoActual) return;
        const punto = normalizarPunto(evento);
        trazoActual.push({
          x: Number((punto.x / canvas.width).toFixed(4)),
          y: Number((punto.y / canvas.height).toFixed(4)),
          t: Date.now() - inicio,
        });
        const largo = trazoActual.length;
        if (largo === 1) {
          ctx.beginPath();
          ctx.moveTo(punto.x, punto.y);
          ctx.lineTo(punto.x + 0.01, punto.y + 0.01);
          ctx.stroke();
          return;
        }
        const previo = trazoActual[largo - 2];
        ctx.beginPath();
        ctx.moveTo(previo.x * canvas.width, previo.y * canvas.height);
        ctx.lineTo(punto.x, punto.y);
        ctx.stroke();
      };

      const iniciarTrazo = (evento) => {
        evento.preventDefault();
        trazoActual = [];
        trazos.push(trazoActual);
        canvas.setPointerCapture?.(evento.pointerId);
        agregarPunto(evento);
      };

      const moverTrazo = (evento) => {
        if (!trazoActual) return;
        evento.preventDefault();
        agregarPunto(evento);
      };

      const finalizarTrazo = (evento) => {
        if (!trazoActual) return;
        evento.preventDefault();
        agregarPunto(evento);
        if (trazoActual.length < 2) {
          trazoActual.push({ ...trazoActual[0] });
        }
        trazoActual = null;
        canvas.releasePointerCapture?.(evento.pointerId);
      };

      const limpiar = () => {
        trazos.length = 0;
        trazoActual = null;
        dibujarBase();
      };

      const cerrar = (resultado) => {
        canvas.removeEventListener('pointerdown', iniciarTrazo);
        canvas.removeEventListener('pointermove', moverTrazo);
        canvas.removeEventListener('pointerup', finalizarTrazo);
        canvas.removeEventListener('pointerleave', finalizarTrazo);
        botonLimpiar.onclick = null;
        botonConfirmar.onclick = null;
        botonCancelar.onclick = null;
        panel.style.display = 'none';
        panel.innerHTML = '';
        resolve(resultado);
      };

      dibujarBase();
      canvas.addEventListener('pointerdown', iniciarTrazo);
      canvas.addEventListener('pointermove', moverTrazo);
      canvas.addEventListener('pointerup', finalizarTrazo);
      canvas.addEventListener('pointerleave', finalizarTrazo);

      botonLimpiar.onclick = () => limpiar();
      botonCancelar.onclick = () => cerrar(null);
      botonConfirmar.onclick = async () => {
        const trazosValidos = trazos.filter((trazo) => trazo.length > 0);
        if (!trazosValidos.length) {
          _voz('Necesito una firma antes de confirmar.');
          return;
        }
        const selloInterno = await this._obtenerSelloGeoTemporalInterno();
        cerrar({
          firmante: firmante || 'Pendiente',
          width: canvas.width,
          height: canvas.height,
          strokes: trazosValidos,
          selloInterno,
          firmadoEn: selloInterno.timestamp,
        });
      };
    });
  },

  async _postProcesarDocumentoLegal(idLote, opciones = {}) {
    if (!idLote) return;
    if (
      opciones.sincronizarPost &&
      typeof window.sincronizarYLimpiarMelantia === 'function'
    ) {
      try {
        await window.sincronizarYLimpiarMelantia(idLote, {
          purgar: true,
          limite: 50,
        });
      } catch (error) {
        console.warn(
          '[Granjas] No se pudo sincronizar tras cerrar la venta:',
          error
        );
      }
    }

    if (
      opciones.liberarEspacioPost &&
      typeof window.liberarEspacioLoteMelantia === 'function'
    ) {
      try {
        await window.liberarEspacioLoteMelantia(idLote);
      } catch (error) {
        console.warn(
          '[Granjas] No se pudo liberar espacio tras cerrar la venta:',
          error
        );
      }
    }
  },

  _obtenerDocumentoCache(indice) {
    const documento = this._cacheDocumentos?.[Number(indice)] || null;
    if (!documento) {
      _voz('Ese documento ya no está en memoria. Abre de nuevo el explorador.');
    }
    return documento;
  },

  _formatearFechaFirma(fechaIso) {
    if (!fechaIso) return 'Sin sello horario';
    const fecha = new Date(fechaIso);
    if (Number.isNaN(fecha.getTime())) return String(fechaIso);
    return `${fecha.toLocaleDateString('es-EC')} ${fecha.toLocaleTimeString('es-EC')}`;
  },

  _estadoSelloFirma(firmaVector) {
    if (!firmaVector?.selloInterno) return 'Sin sello interno';
    return firmaVector.selloInterno.gpsDisponible
      ? 'Sello interno OK'
      : 'Sello interno sin GPS';
  },

  _renderFirmaVectorialMini(firmaVector, etiqueta) {
    if (!firmaVector?.strokes?.length) {
      return `<div style="height:72px;display:flex;align-items:center;justify-content:center;color:#6d7d73;font-size:12px;border:1px dashed #cfd9d2;border-radius:10px">Sin firma</div>`;
    }

    const ancho = 220;
    const alto = 72;
    const paths = firmaVector.strokes
      .filter((trazo) => Array.isArray(trazo) && trazo.length)
      .map((trazo) => {
        const d = trazo
          .map((punto, indice) => {
            const x = Number(punto.x || 0) * ancho;
            const y = Number(punto.y || 0) * alto;
            return `${indice === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
          })
          .join(' ');
        return `<path d="${d}" fill="none" stroke="#173728" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path>`;
      })
      .join('');

    return `<svg viewBox="0 0 ${ancho} ${alto}" width="220" height="72" aria-label="Vista previa firma ${this._escaparHtml(etiqueta)}" style="display:block;background:#fff;border:1px solid #d7e2da;border-radius:10px">${paths}</svg>`;
  },

  _resumenFirmasDocumento(metadata = {}) {
    const vendedor = metadata.firmaVendedorVector || null;
    const comprador = metadata.firmaCompradorVector || null;
    const partesFirmadas = [vendedor, comprador].filter(
      (firma) => firma?.strokes?.length
    ).length;
    const firmado = partesFirmadas === 2;
    const marcasTiempo = [vendedor?.firmadoEn, comprador?.firmadoEn].filter(
      Boolean
    );

    return {
      firmado,
      texto: firmado
        ? 'Firmado por ambas partes'
        : partesFirmadas === 1
          ? 'Firma parcial registrada'
          : 'Sin firma vectorial',
      detalle: `Vendedor: ${this._estadoSelloFirma(vendedor)} · Comprador: ${this._estadoSelloFirma(comprador)}`,
      fecha: marcasTiempo.length
        ? this._formatearFechaFirma(marcasTiempo.sort().slice(-1)[0])
        : 'Sin sello horario',
    };
  },

  _insigniaDocumentoLegal(firma) {
    if (firma.firmado) {
      return {
        texto: 'Contrato firmado',
        fondo: '#e8f6ed',
        color: '#1f6a3a',
      };
    }

    if (firma.texto === 'Firma parcial registrada') {
      return {
        texto: 'Firma parcial',
        fondo: '#fff4df',
        color: '#9a5b00',
      };
    }

    return {
      texto: 'Sin firma',
      fondo: '#f0f3f1',
      color: '#5f6f64',
    };
  },

  _resumenAuditoriaPeritaje(documento) {
    const metadata = documento.metadata || {};
    const firma = this._resumenFirmasDocumento(metadata);
    const vendedor = metadata.firmaVendedorVector || null;
    const comprador = metadata.firmaCompradorVector || null;
    const marca = this._obtenerMarcaRancho();

    return [
      'MELANTIA IA - RESUMEN DE AUDITORIA TECNICO-JURIDICA',
      `Marca del rancho: ${marca.nombreMarca || 'No configurada'}`,
      `Slogan: ${marca.slogan || 'No configurado'}`,
      `Documento: ${documento.nombre_archivo || 'Documento legal'}`,
      `Lote: ${documento.id_lote || 'sin lote'}`,
      `Fecha de registro: ${documento.created_at || 'sin fecha'}`,
      `Huella juridica SHA-256: ${documento.hash_documento || 'pendiente'}`,
      `Certificado de trazabilidad MELANTIA: ${metadata.hashTrazabilidad || 'no disponible'}`,
      `Estado de firmas: ${firma.texto}`,
      `Ultimo sello registrado: ${firma.fecha}`,
      `Detalle de sellos: ${firma.detalle}`,
      `Firma productor - hora: ${this._formatearFechaFirma(vendedor?.firmadoEn)}`,
      `Firma productor - estado: ${this._estadoSelloFirma(vendedor)}`,
      `Firma comprador - hora: ${this._formatearFechaFirma(comprador?.firmadoEn)}`,
      `Firma comprador - estado: ${this._estadoSelloFirma(comprador)}`,
      'Uso sugerido: peritaje, inspeccion de campo, conciliacion o validacion contractual.',
    ].join('\n');
  },

  _renderActaBreveAuditoria(documento) {
    const metadata = documento.metadata || {};
    const firma = this._resumenFirmasDocumento(metadata);
    const vendedor = metadata.firmaVendedorVector || null;
    const comprador = metadata.firmaCompradorVector || null;
    const marca = this._obtenerMarcaRancho();
    const fechaRegistro = this._formatearFechaFirma(documento.created_at);
    const fechaProductor = this._formatearFechaFirma(vendedor?.firmadoEn);
    const fechaComprador = this._formatearFechaFirma(comprador?.firmadoEn);
    const bloqueMarca =
      marca.nombreMarca || marca.slogan || marca.logoDataUrl
        ? `<div style="display:flex;gap:12px;align-items:center;margin-top:10px">${marca.logoDataUrl ? `<img src="${marca.logoDataUrl}" alt="Marca del rancho" style="max-width:92px;max-height:72px;border-radius:10px;border:1px solid #d8cfbf;padding:4px;background:#fff;object-fit:contain" />` : ''}<div>${marca.nombreMarca ? `<div class="fila"><strong>${this._escaparHtml(marca.nombreMarca)}</strong></div>` : ''}${marca.slogan ? `<div class="fila" style="color:#5f6a61">${this._escaparHtml(marca.slogan)}</div>` : ''}</div></div>`
        : '';

    return `<!doctype html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Acta breve de auditoría</title><style>body{font-family:Georgia,serif;background:#f5f2eb;color:#1e1e1e;margin:0;padding:24px}.acta{max-width:860px;margin:0 auto;background:#fff;border:1px solid #d8cfbf;box-shadow:0 10px 28px rgba(0,0,0,.08);padding:32px}.encabezado{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;border-bottom:2px solid #d3c7b5;padding-bottom:14px;margin-bottom:20px}.marca{font-size:12px;letter-spacing:.08em;text-transform:uppercase;background:#1f3d2c;color:#f6f1e8;padding:6px 10px;border-radius:999px;display:inline-block}.titulo{font-size:28px;margin:10px 0 4px;color:#1f3d2c}.subtitulo{font-size:13px;color:#5e695f;max-width:320px;text-align:right}.bloque{margin-top:16px;padding:14px;border:1px solid #e1dbcf;border-radius:12px;background:#fbfaf7}.bloque h2{margin:0 0 10px;font-size:16px;color:#294435}.fila{margin:6px 0;font-size:14px}.hash{font-family:Consolas,monospace;font-size:12px;word-break:break-word}.acciones{margin-top:18px;display:flex;gap:10px;flex-wrap:wrap}.acciones button{background:#1f3d2c;color:#fff;border:none;border-radius:10px;padding:10px 14px;cursor:pointer;font-weight:700}.pie{margin-top:18px;font-size:12px;color:#5d675f}@media print{body{background:#fff;padding:0}.acta{box-shadow:none;border:none;max-width:none}.acciones{display:none}}</style></head><body><main class="acta"><div class="encabezado"><div><span class="marca">MELANTIA IA</span><h1 class="titulo">Acta breve de auditoría</h1><div class="fila">Documento institucional de verificación técnico-jurídica</div>${bloqueMarca}</div><div class="subtitulo">Soporte resumido para inspección, conciliación, peritaje o validación contractual.</div></div><section class="bloque"><h2>Identificación del documento</h2><div class="fila"><strong>Archivo:</strong> ${this._escaparHtml(documento.nombre_archivo || 'Documento legal')}</div><div class="fila"><strong>Lote:</strong> ${this._escaparHtml(documento.id_lote || 'sin lote')}</div><div class="fila"><strong>Fecha de registro:</strong> ${this._escaparHtml(fechaRegistro)}</div><div class="fila"><strong>Tipo:</strong> ${this._escaparHtml(metadata.tipoDocumento || 'Documento legal')}</div></section><section class="bloque"><h2>Integridad jurídica</h2><div class="fila hash"><strong>Huella SHA-256:</strong><br>${this._escaparHtml(documento.hash_documento || 'pendiente')}</div><div class="fila hash"><strong>Certificado MELANTIA:</strong><br>${this._escaparHtml(metadata.hashTrazabilidad || 'no disponible')}</div></section><section class="bloque"><h2>Estado de firmas</h2><div class="fila"><strong>Resumen:</strong> ${this._escaparHtml(firma.texto)}</div><div class="fila"><strong>Último sello:</strong> ${this._escaparHtml(firma.fecha)}</div><div class="fila"><strong>Detalle:</strong> ${this._escaparHtml(firma.detalle)}</div><div class="fila"><strong>Productor:</strong> ${this._escaparHtml(fechaProductor)} • ${this._escaparHtml(this._estadoSelloFirma(vendedor))}</div><div class="fila"><strong>Comprador:</strong> ${this._escaparHtml(fechaComprador)} • ${this._escaparHtml(this._estadoSelloFirma(comprador))}</div></section><section class="bloque"><h2>Constancia</h2><div class="fila">Se deja constancia de que este resumen fue emitido por MELANTIA IA a partir del documento ligero almacenado para el lote indicado, con fines de inspección, soporte pericial o validación contractual.</div></section><div class="acciones"><button onclick="window.print()">Imprimir acta</button><button onclick="window.close()">Cerrar</button></div><p class="pie">MELANTIA IA • Resumen institucional generado al vuelo sin duplicar archivos pesados.</p></main></body></html>`;
  },

  async exportarAuditoriaDocumentoLigero(indice, modo = 'copiar') {
    const documento = this._obtenerDocumentoCache(indice);
    if (!documento) return;

    const resumen = this._resumenAuditoriaPeritaje(documento);

    try {
      if (modo === 'acta') {
        const html = this._renderActaBreveAuditoria(documento);
        this._abrirVentanaDocumento(
          html,
          `Acta auditoría ${documento.id_lote || 'Melantia'}`
        );
        _voz('Acta breve de auditoría lista para impresión.');
        return;
      }

      if (modo === 'compartir' && navigator.share) {
        await navigator.share({
          title: documento.nombre_archivo || 'Auditoría MELANTIA',
          text: resumen,
        });
        _voz('Resumen de auditoría listo para compartirse.');
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(resumen);
        _voz('Resumen de auditoría copiado para peritaje o inspección.');
        return;
      }

      const whatsappURL = `https://wa.me/?text=${encodeURIComponent(resumen)}`;
      window.open(whatsappURL, '_blank', 'noopener');
      _voz('Abrí un canal de envío con el resumen de auditoría.');
    } catch (error) {
      console.error('[Granjas] Error al exportar auditoría:', error);
      _voz('No pude exportar el resumen de auditoría en este momento.');
    }
  },

  abrirAuditoriaDocumentoLigero(indice) {
    const documento = this._obtenerDocumentoCache(indice);
    if (!documento) return;

    const panel = document.getElementById('panel-novedades');
    if (!panel) return;

    const metadata = documento.metadata || {};
    const firma = this._resumenFirmasDocumento(metadata);
    const vendedor = metadata.firmaVendedorVector || null;
    const comprador = metadata.firmaCompradorVector || null;
    const gpsVendedor = vendedor?.selloInterno?.gpsDisponible
      ? 'GPS interno registrado'
      : 'GPS interno no disponible';
    const gpsComprador = comprador?.selloInterno?.gpsDisponible
      ? 'GPS interno registrado'
      : 'GPS interno no disponible';

    panel.style.maxWidth = '760px';
    panel.innerHTML = `
      <div class="novedad-card" data-experto="Melantia">
        <p class="novedad-n1">🧾 Ficha corta de auditoría</p>
        <p class="novedad-n2">${this._escaparHtml(documento.nombre_archivo || 'Documento legal')} • Lote <strong>${this._escaparHtml(documento.id_lote || 'sin lote')}</strong></p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin-top:12px">
          <div style="background:#f7faf8;border:1px solid #dbe7de;border-radius:14px;padding:12px">
            <strong>Integridad jurídica</strong>
            <div style="margin-top:8px;font-size:12px;color:#355246"><div><strong>Huella SHA-256:</strong><br>${this._escaparHtml(documento.hash_documento || 'pendiente')}</div><div style="margin-top:8px"><strong>Certificado MELANTIA:</strong><br>${this._escaparHtml(metadata.hashTrazabilidad || 'no disponible')}</div></div>
          </div>
          <div style="background:#f7faf8;border:1px solid #dbe7de;border-radius:14px;padding:12px">
            <strong>Estado de firmas</strong>
            <div style="margin-top:8px;font-size:12px;color:#355246"><div><strong>Resumen:</strong> ${this._escaparHtml(firma.texto)}</div><div><strong>Último sello:</strong> ${this._escaparHtml(firma.fecha)}</div><div><strong>Estado:</strong> ${this._escaparHtml(firma.detalle)}</div></div>
          </div>
          <div style="background:#f7faf8;border:1px solid #dbe7de;border-radius:14px;padding:12px">
            <strong>Firmante productor</strong>
            <div style="margin-top:8px;font-size:12px;color:#355246"><div><strong>Hora:</strong> ${this._escaparHtml(this._formatearFechaFirma(vendedor?.firmadoEn))}</div><div><strong>Sello:</strong> ${this._escaparHtml(this._estadoSelloFirma(vendedor))}</div><div><strong>GPS:</strong> ${this._escaparHtml(gpsVendedor)}</div></div>
          </div>
          <div style="background:#f7faf8;border:1px solid #dbe7de;border-radius:14px;padding:12px">
            <strong>Firmante comprador</strong>
            <div style="margin-top:8px;font-size:12px;color:#355246"><div><strong>Hora:</strong> ${this._escaparHtml(this._formatearFechaFirma(comprador?.firmadoEn))}</div><div><strong>Sello:</strong> ${this._escaparHtml(this._estadoSelloFirma(comprador))}</div><div><strong>GPS:</strong> ${this._escaparHtml(gpsComprador)}</div></div>
          </div>
        </div>
        <div class="novedad-acciones" style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">
          <button type="button" onclick="GestorGranjasMelantia.abrirDocumentoLigero(${Number(indice)})">Abrir documento</button>
          <button type="button" onclick="GestorGranjasMelantia.abrirConfiguracionMarcaRancho('documentos')">Marca del rancho</button>
          <button type="button" onclick="GestorGranjasMelantia.exportarAuditoriaDocumentoLigero(${Number(indice)}, 'acta')">Acta breve</button>
          <button type="button" onclick="GestorGranjasMelantia.exportarAuditoriaDocumentoLigero(${Number(indice)}, 'copiar')">Copiar resumen</button>
          <button type="button" onclick="GestorGranjasMelantia.exportarAuditoriaDocumentoLigero(${Number(indice)}, 'compartir')">Compartir resumen</button>
          <button type="button" onclick="GestorGranjasMelantia.abrirDocumentos()">Volver al explorador</button>
        </div>
      </div>`;
    panel.style.display = 'block';
  },

  async _confirmarFirmasAntesDeGenerar({
    tipoDocumento,
    lote,
    datosPartes,
    firmaVendedorVector,
    firmaCompradorVector,
  }) {
    const panel = document.getElementById('panel-novedades');
    if (!panel) return 'confirmar';

    const titulo =
      tipoDocumento === 'acta_entrega'
        ? 'Acta de entrega'
        : tipoDocumento === 'pagare'
          ? 'Pagaré'
          : 'Contrato final';
    const selloVendedor = this._estadoSelloFirma(firmaVendedorVector);
    const selloComprador = this._estadoSelloFirma(firmaCompradorVector);

    panel.style.maxWidth = '860px';
    panel.innerHTML = `
      <div class="novedad-card" data-experto="Melantia">
        <p class="novedad-n1">✅ Vista previa de firmas</p>
        <p class="novedad-n2">Revisa las firmas antes de generar el ${this._escaparHtml(titulo)} de <strong>${this._escaparHtml(lote?.nombre_lote || 'lote')}</strong>.</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;margin-top:14px">
          <div style="background:#f7faf8;border:1px solid #dbe7de;border-radius:14px;padding:12px">
            <strong>Productor</strong>
            <div style="margin-top:8px">${this._renderFirmaVectorialMini(firmaVendedorVector, 'productor')}</div>
            <div style="margin-top:8px;font-size:12px;color:#446052">${this._escaparHtml(datosPartes.productor || 'Productor')}<br>${this._escaparHtml(this._formatearFechaFirma(firmaVendedorVector?.firmadoEn))}<br>${this._escaparHtml(selloVendedor)}</div>
          </div>
          <div style="background:#f7faf8;border:1px solid #dbe7de;border-radius:14px;padding:12px">
            <strong>Comprador</strong>
            <div style="margin-top:8px">${this._renderFirmaVectorialMini(firmaCompradorVector, 'comprador')}</div>
            <div style="margin-top:8px;font-size:12px;color:#446052">${this._escaparHtml(datosPartes.comprador || 'Comprador')}<br>${this._escaparHtml(this._formatearFechaFirma(firmaCompradorVector?.firmadoEn))}<br>${this._escaparHtml(selloComprador)}</div>
          </div>
        </div>
        <div class="novedad-acciones" style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">
          <button type="button" data-firma-regenerar>Volver a firmar</button>
          <button type="button" data-firma-generar>Generar documento final</button>
          <button type="button" data-firma-cancelar>Cancelar</button>
        </div>
      </div>`;
    panel.style.display = 'block';

    return new Promise((resolve) => {
      const botonRegenerar = panel.querySelector('[data-firma-regenerar]');
      const botonGenerar = panel.querySelector('[data-firma-generar]');
      const botonCancelar = panel.querySelector('[data-firma-cancelar]');
      if (!botonRegenerar || !botonGenerar || !botonCancelar) {
        resolve('confirmar');
        return;
      }

      const cerrar = (respuesta) => {
        botonRegenerar.onclick = null;
        botonGenerar.onclick = null;
        botonCancelar.onclick = null;
        panel.style.display = 'none';
        panel.innerHTML = '';
        resolve(respuesta);
      };

      botonRegenerar.onclick = () => cerrar('repetir');
      botonGenerar.onclick = () => cerrar('confirmar');
      botonCancelar.onclick = () => cerrar('cancelar');
    });
  },

  _resumenDocumentoLigero(documento) {
    const nombre = documento.nombre_archivo || 'documento_melantia.html';
    const lote = documento.id_lote || 'sin lote';
    const hash = documento.hash_documento || 'pendiente';
    const certificado = documento.metadata?.hashTrazabilidad || 'no disponible';
    const familia = documento.familia || 'Documento';
    const firma = this._resumenFirmasDocumento(documento.metadata || {});
    return [
      `MELANTIA IA · ${familia}`,
      `Archivo: ${nombre}`,
      `Lote: ${lote}`,
      `Estado de firmas: ${firma.texto}`,
      `Sello de firma: ${firma.detalle}`,
      `Huella jurídica SHA-256: ${hash}`,
      `Certificado de trazabilidad: ${certificado}`,
      'Documento técnico-jurídico con respaldo ligero y auditoría verificable.',
    ].join('\n');
  },

  abrirDocumentoLigero(indice) {
    const documento = this._obtenerDocumentoCache(indice);
    if (!documento) return;
    if (!documento.contenido) {
      _voz('Este documento no tiene contenido para abrirse.');
      return;
    }
    this._abrirVentanaDocumento(
      documento.contenido,
      documento.nombre_archivo || 'Documento MELANTIA'
    );
  },

  async compartirDocumentoWhatsApp(indice) {
    const documento = this._obtenerDocumentoCache(indice);
    if (!documento) return;

    const resumen = this._resumenDocumentoLigero(documento);
    const nombreArchivo = documento.nombre_archivo || 'documento_melantia.html';

    try {
      if (
        navigator.share &&
        navigator.canShare &&
        documento.contenido &&
        window.File &&
        navigator.canShare({
          files: [
            new File([documento.contenido], nombreArchivo, {
              type: documento.mime_type || 'text/html',
            }),
          ],
        })
      ) {
        const archivo = new File([documento.contenido], nombreArchivo, {
          type: documento.mime_type || 'text/html',
        });
        await navigator.share({
          title: nombreArchivo,
          text: resumen,
          files: [archivo],
        });
        _voz(
          'Documento listo para enviarse por WhatsApp o compartir desde tu teléfono.'
        );
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(resumen);
      }

      const whatsappURL = `https://wa.me/?text=${encodeURIComponent(resumen)}`;
      window.open(whatsappURL, '_blank', 'noopener');
      _voz('Abrí WhatsApp con el resumen técnico copiado para compartir.');
    } catch (error) {
      console.error('[Granjas] Error al compartir documento legal:', error);
      _voz('No pude abrir el flujo de WhatsApp para este documento.');
    }
  },

  async _cargarTablero() {
    if (typeof window.obtenerTableroGranjasMelantia !== 'function') {
      throw new Error('El tablero de granjas no está disponible.');
    }
    const tablero = await window.obtenerTableroGranjasMelantia();
    this._cacheTablero = tablero;
    return tablero;
  },

  async actualizarResumenTarjeta() {
    const card = document.querySelector('[data-modulo="gestion-granjas"]');
    if (!card || typeof window.obtenerTableroGranjasMelantia !== 'function') {
      return;
    }

    try {
      const tablero = await this._cargarTablero();
      const resumen = card.querySelector('[data-granjas-resumen]');
      const bloqueMarca = card.querySelector('[data-granjas-brand]');
      if (resumen) {
        resumen.textContent = `${tablero.total_lotes} lote(s) • ${tablero.total_lotes_agricolas} agrícolas • ${tablero.total_lotes_pecuarios} pecuarios • ${this._formatearTamano(tablero.espacio_local_bytes)} locales`;
      }
      if (bloqueMarca) {
        bloqueMarca.innerHTML = this._renderMarcaRanchoVisual({
          compacta: true,
        });
      }
    } catch (error) {
      console.warn('[Granjas] No se pudo actualizar el resumen:', error);
    }
  },

  iniciar() {
    const menu = document.getElementById('app-menu');
    if (!menu) return;

    let card = menu.querySelector('[data-modulo="gestion-granjas"]');
    if (!card) {
      card = document.createElement('article');
      card.className = 'card';
      card.dataset.modulo = 'gestion-granjas';
      card.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
          <h3 style="margin:0">Gestión Productiva</h3>
          <div data-granjas-brand>${this._renderMarcaRanchoVisual({ compacta: true, enLinea: true })}</div>
        </div>
        <p>Centro dual para lotes agrícolas y pecuarios, con limpieza local, nube y seguridad de activos.</p>
        <p data-granjas-resumen>Cargando tablero local...</p>
        <button type="button" style="margin-top:10px;background:#1f3d2c;color:#fff;border:none;border-radius:10px;padding:10px 14px;cursor:pointer;font-weight:700">Abrir Gestión Productiva</button>`;
      menu.prepend(card);
      card.addEventListener('click', () => this.abrirTableroControl());
      card.querySelector('button')?.addEventListener('click', (event) => {
        event.stopPropagation();
        this.abrirTableroControl();
      });
    }

    this.actualizarResumenTarjeta();
  },

  async abrirFichaLigera(idLote) {
    const lote = this._buscarLote(idLote);
    if (!lote) return;

    if (lote.ficha_ligera?.contenido) {
      this._abrirVentanaDocumento(
        lote.ficha_ligera.contenido,
        `Ficha ${lote.nombre_lote}`
      );
      return;
    }

    await this.cerrarTrato(idLote, { soloVista: true });
  },

  abrirMapaLigero(idLote) {
    const lote = this._buscarLote(idLote);
    if (!lote?.mapa_ligero?.contenido) {
      _voz('Este lote todavía no tiene un mapa GPS ligero guardado.');
      return;
    }

    const html = `<!doctype html><html lang="es"><head><meta charset="UTF-8"><title>Mapa ligero ${this._escaparHtml(lote.nombre_lote)}</title><style>body{font-family:Consolas,monospace;background:#f4f7f6;margin:0;padding:20px;color:#173728}pre{white-space:pre-wrap;word-break:break-word;background:#fff;border:1px solid #d7e6dc;border-radius:14px;padding:16px}</style></head><body><h2>${this._escaparHtml(lote.nombre_lote)} — Mapa GPS ligero</h2><pre>${this._escaparHtml(lote.mapa_ligero.contenido)}</pre></body></html>`;
    this._abrirVentanaDocumento(html, `Mapa ${lote.nombre_lote}`);
  },

  async abrirDocumentos() {
    if (typeof window.listarDocumentosLigerosMelantia !== 'function') {
      _voz('El explorador de documentos no está disponible.');
      return;
    }

    const panel = document.getElementById('panel-novedades');
    if (!panel) return;

    const items = (await window.listarDocumentosLigerosMelantia())
      .map((item) => ({
        ...item,
        familia: item.tipo?.startsWith('legal_')
          ? 'Legal'
          : item.tipo === 'mapa_gps_json'
            ? 'Mapa'
            : 'Ficha',
      }))
      .sort((a, b) =>
        String(b.created_at || '').localeCompare(String(a.created_at || ''))
      );
    this._cacheDocumentos = items;

    const lista = items.length
      ? items
          .map((item, indice) => {
            const firma = this._resumenFirmasDocumento(item.metadata || {});
            const insignia = this._insigniaDocumentoLegal(firma);
            return `
              <div style="padding:10px 0;border-bottom:1px solid #dbe7de">
                <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap">
                  <div><strong>${this._escaparHtml(item.familia)}:</strong> ${this._escaparHtml(item.nombre_archivo || 'documento')}</div>
                  ${
                    item.familia === 'Legal'
                      ? `<span style="display:inline-flex;align-items:center;padding:4px 10px;border-radius:999px;background:${insignia.fondo};color:${insignia.color};font-size:12px;font-weight:700">${this._escaparHtml(insignia.texto)}</span>`
                      : ''
                  }
                </div>
                <div style="color:#567261;font-size:12px">${this._escaparHtml(item.created_at || 'sin fecha')}</div>
                ${
                  item.familia === 'Legal'
                    ? `<div style="margin-top:6px;font-size:12px;color:#355246"><div><strong>Huella:</strong> ${this._escaparHtml(item.hash_documento || 'pendiente')}</div><div><strong>Certificado:</strong> ${this._escaparHtml(item.metadata?.hashTrazabilidad || 'no disponible')}</div><div><strong>Firmas:</strong> ${this._escaparHtml(firma.texto)}</div><div><strong>Último sello:</strong> ${this._escaparHtml(firma.fecha)}</div><div><strong>Estado:</strong> ${this._escaparHtml(firma.detalle)}</div></div>`
                    : ''
                }
                <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">
                  <button onclick="GestorGranjasMelantia.abrirDocumentoLigero(${indice})">Abrir</button>
                  ${
                    item.familia === 'Legal'
                      ? `<button onclick="GestorGranjasMelantia.abrirAuditoriaDocumentoLigero(${indice})">Auditoría</button><button onclick="GestorGranjasMelantia.compartirDocumentoWhatsApp(${indice})">WhatsApp</button>`
                      : ''
                  }
                </div>
              </div>`;
          })
          .join('')
      : '<p class="novedad-n3">No hay documentos ligeros guardados todavía.</p>';

    panel.style.maxWidth = '640px';
    panel.innerHTML = `
      <div class="novedad-card" data-experto="Melantia" style="max-height:75vh;overflow-y:auto">
        <p class="novedad-n1">📁 Documentos MELANTIA</p>
        <p class="novedad-n2">En la web no puedo abrir la carpeta física del sistema. Este explorador ligero te da acceso directo a fichas y mapas guardados sin cargar la base pesada.</p>
        <div>${lista}</div>
        <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px"><button onclick="GestorGranjasMelantia.abrirConfiguracionMarcaRancho('documentos')">Marca del rancho</button><button onclick="GestorGranjasMelantia.abrirTableroControl()">Volver al tablero</button></div>
      </div>`;
    panel.style.display = 'block';
  },

  async sincronizarTodoAhora() {
    if (typeof window.sincronizarYLimpiarMelantia !== 'function') {
      _voz('La sincronización total no está disponible en esta vista.');
      return;
    }

    ui_melantia.pensar();
    try {
      const resultado = await window.sincronizarYLimpiarMelantia(null, {
        purgar: true,
        limite: 200,
      });
      _voz(
        resultado?.mensaje ||
          'Sincronización selectiva completada. La memoria local fue limpiada donde correspondía.'
      );
      await this.abrirTableroControl();
    } catch (error) {
      console.error('[Granjas] Error en sincronización total:', error);
      _voz('No pude sincronizar todos los lotes en este momento.');
    } finally {
      ui_melantia.listo();
    }
  },

  calcularInsumos(idLote) {
    const lote = this._buscarLote(idLote);
    if (!lote || lote.tipo_lote !== 'agricola') return;
    const area = Number(lote.area_ha) || 0;
    if (area <= 0) {
      _voz(
        'Este lote agrícola aún no tiene un área GPS válida para calcular insumos.'
      );
      return;
    }
    const dosis = Number(
      window.prompt(`Dosis para ${lote.nombre_lote} en kg por hectárea`, '150')
    );
    if (!Number.isFinite(dosis) || dosis <= 0) return;
    const total = area * dosis;
    const panel = document.getElementById('panel-novedades');
    if (!panel) return;
    panel.style.maxWidth = '520px';
    panel.innerHTML = `
      <div class="novedad-card" data-experto="Fabrizzio">
        <p class="novedad-n1">🌿 Cálculo de Insumos</p>
        <p class="novedad-n2">Lote: <strong>${this._escaparHtml(lote.nombre_lote)}</strong></p>
        <p class="novedad-n2">Área medida: <strong>${this._escaparHtml(area.toFixed(2))} ha</strong></p>
        <p class="novedad-n2">Dosis aplicada: <strong>${this._escaparHtml(dosis.toFixed(2))} kg/ha</strong></p>
        <p class="novedad-n3">Necesitas aproximadamente <strong>${this._escaparHtml(total.toFixed(2))} kg</strong> de insumo para este lote.</p>
        <div class="novedad-acciones"><button onclick="GestorGranjasMelantia.abrirTableroControl()">Volver</button></div>
      </div>`;
    panel.style.display = 'block';
    _voz(
      `Necesitas aproximadamente ${total.toFixed(1)} kilogramos de insumo para ${lote.nombre_lote}.`
    );
  },

  async generarDocumentoLegal(idLote, tipoDocumento, opciones = {}) {
    const lote = this._buscarLote(idLote);
    if (!lote) return;
    if (typeof window.generarDocumentoLegalMelantia !== 'function') {
      _voz('El generador legal no está disponible en esta vista.');
      return;
    }

    const datosPartes = {
      productor: window._melantia_session?.productor || 'Productor MELANTIA',
      comprador:
        window.prompt('Nombre del comprador', 'Comprador pendiente') ||
        'Comprador pendiente',
      identificacionComprador:
        window.prompt('Identificación del comprador', 'Pendiente') ||
        'Pendiente',
      monto:
        tipoDocumento === 'pagare'
          ? window.prompt('Monto reconocido', 'Pendiente') || 'Pendiente'
          : 'N/A',
      vencimiento:
        tipoDocumento === 'pagare'
          ? window.prompt('Fecha de vencimiento', 'Pendiente') || 'Pendiente'
          : 'N/A',
    };

    const requiereFirma =
      opciones.capturarFirmas !== false &&
      ['contrato_venta', 'acta_entrega', 'pagare'].includes(tipoDocumento);

    ui_melantia.pensar();
    try {
      if (requiereFirma) {
        while (true) {
          const firmaVendedorVector = await this._capturarFirmaVectorial({
            titulo: 'Firma del productor',
            firmante: datosPartes.productor,
            subtitulo:
              'El productor firma con el dedo. Se guardan vectores ligeros, hora exacta y sello GPS interno.',
          });
          if (!firmaVendedorVector) {
            _voz('Se canceló la firma del productor.');
            return;
          }

          const firmaCompradorVector = await this._capturarFirmaVectorial({
            titulo: 'Firma del comprador',
            firmante: datosPartes.comprador,
            subtitulo:
              'Ahora firma el comprador. El trazo se incrustará de inmediato en el documento final.',
          });
          if (!firmaCompradorVector) {
            _voz('Se canceló la firma del comprador.');
            return;
          }

          const decision = await this._confirmarFirmasAntesDeGenerar({
            tipoDocumento,
            lote,
            datosPartes,
            firmaVendedorVector,
            firmaCompradorVector,
          });
          if (decision === 'cancelar') {
            _voz('Se canceló la confirmación del documento firmado.');
            return;
          }
          if (decision === 'repetir') {
            continue;
          }

          datosPartes.firmaVendedorVector = firmaVendedorVector;
          datosPartes.firmaCompradorVector = firmaCompradorVector;
          break;
        }
      }

      if (
        tipoDocumento === 'acta_entrega' &&
        lote.tipo_lote === 'pecuario' &&
        lote.id_animal_representativo &&
        typeof window.capturarEvidenciaIA === 'function'
      ) {
        try {
          await window.capturarEvidenciaIA(
            lote.id_animal_representativo,
            'final',
            0,
            lote.id_lote
          );
        } catch (error) {
          console.warn(
            '[Legal] No se pudo capturar evidencia final para acta:',
            error
          );
        }
      }

      const documento = await window.generarDocumentoLegalMelantia(
        idLote,
        tipoDocumento,
        datosPartes
      );
      await this._postProcesarDocumentoLegal(idLote, opciones);
      this._abrirVentanaDocumento(
        documento.html,
        `${documento.titulo} ${lote.nombre_lote}`
      );
      _voz(
        opciones.mensajeCierre ||
          documento.mensaje ||
          'Documento legal generado correctamente.'
      );
    } catch (error) {
      console.error('[Granjas] Error al generar documento legal:', error);
      _voz('No pude generar el documento legal para este lote.');
    } finally {
      ui_melantia.listo();
    }
  },

  async compartirProtegido(idLote) {
    await this.cerrarTrato(idLote, { modoForzado: 'privada' });
  },

  async cerrarTrato(idLote, opciones = {}) {
    const lote = this._buscarLote(idLote);
    if (!lote) return;

    const datosAnimal =
      lote.tipo_lote === 'agricola'
        ? this._resolverLoteAgricola(lote)
        : this._resolverAnimalLote(lote);
    if (!datosAnimal.id) {
      _voz(
        'Este lote aún no tiene un registro base para generar una ficha o cierre de trato.'
      );
      return;
    }
    if (typeof window.prepararEnvioSeguroMelantia !== 'function') {
      _voz('El generador de envíos protegidos no está disponible.');
      return;
    }

    let modo = opciones.modoForzado || this._modoPrivacidadActual();
    if (!opciones.modoForzado && modo === 'exacta') {
      const incluirGps = window.confirm(
        `Cerrar trato para ${lote.nombre_lote}. ¿Deseas incluir la ubicación exacta en el envío?`
      );
      modo = incluirGps ? 'exacta' : 'privada';
    }

    ui_melantia.pensar();
    try {
      const ficha = await window.prepararEnvioSeguroMelantia(datosAnimal, {
        modoUbicacion: modo,
        persistirLigera: true,
      });

      if (opciones.soloVista) {
        this._abrirVentanaDocumento(ficha.html, `Ficha ${lote.nombre_lote}`);
      } else if (typeof MelantiaComandosVoz !== 'undefined') {
        MelantiaComandosVoz._mostrarFichaCompartir(ficha);
      }

      _voz(
        modo === 'exacta'
          ? 'Trato listo. La ficha incluye ubicación exacta autorizada por el productor.'
          : 'Trato listo. La ficha salió en modo protegido para cuidar la ubicación de la finca.'
      );
      await this.actualizarResumenTarjeta();
    } catch (error) {
      console.error('[Granjas] Error al cerrar trato:', error);
      _voz('No pude preparar el cierre de trato para este lote.');
    } finally {
      ui_melantia.listo();
    }
  },

  async liberarEspacioLote(idLote) {
    if (typeof window.liberarEspacioLoteMelantia !== 'function') {
      _voz('La limpieza de lote no está disponible en esta vista.');
      return;
    }

    ui_melantia.pensar();
    try {
      const resultado = await window.liberarEspacioLoteMelantia(idLote);
      _voz(resultado.mensaje || 'Limpieza de lote completada.');
      await this.abrirTableroControl();
    } catch (error) {
      console.error('[Granjas] Error al liberar espacio:', error);
      _voz('No pude liberar espacio en este lote.');
    } finally {
      ui_melantia.listo();
    }
  },

  _renderTarjetaLote(lote) {
    const idLoteJs = JSON.stringify(lote.id_lote);
    const esAgricola = lote.tipo_lote === 'agricola';
    const fichaInfo = lote.ficha_ligera
      ? `<button onclick='event.stopPropagation(); GestorGranjasMelantia.abrirFichaLigera(${idLoteJs})'>Ver ficha</button>`
      : `<button onclick='event.stopPropagation(); GestorGranjasMelantia.cerrarTrato(${idLoteJs}, { soloVista: true })'>Generar ficha</button>`;
    const mapaInfo = lote.mapa_ligero
      ? `<button onclick='event.stopPropagation(); GestorGranjasMelantia.abrirMapaLigero(${idLoteJs})'>Mapa GPS</button>`
      : `<button disabled title='Sin mapa guardado'>Mapa GPS</button>`;

    return `
      <article style="background:#fff;border:1px solid #d7e6dc;border-radius:18px;padding:16px;box-shadow:0 10px 24px rgba(23,55,40,.08);display:grid;gap:12px">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:start">
          <div>
            <strong style="font-size:16px;color:#173728">${this._escaparHtml(lote.nombre_lote)}</strong>
            <div style="color:#567261;margin-top:4px">Estado: ${this._escaparHtml(lote.estado_sincronizacion)}</div>
          </div>
          <div style="font-size:12px;background:${esAgricola ? '#eef4ff' : '#eef6f1'};color:${esAgricola ? '#1d4f91' : '#1f3d2c'};border-radius:999px;padding:6px 10px">${this._escaparHtml(esAgricola ? 'Agrícola' : 'Pecuario')} · ${this._escaparHtml(this._capitalizar(lote.ultima_etapa))}</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;font-size:13px;color:#244634">
          <div><strong>${esAgricola ? 'Cultivo' : 'Población'}:</strong> ${this._escaparHtml(esAgricola ? lote.cultivo || 'Cultivo' : `${lote.poblacion} animales`)}</div>
          <div><strong>Última foto:</strong> ${this._escaparHtml(this._tiempoRelativo(lote.ultima_foto_iso))}</div>
          <div><strong>Espacio local:</strong> ${this._escaparHtml(this._formatearTamano(lote.espacio_local_bytes))}</div>
          <div><strong>${esAgricola ? 'Área/Mapa' : 'Fichas/Mapas'}:</strong> ${this._escaparHtml(esAgricola ? `${Number(lote.area_ha || 0).toFixed(2)} ha` : lote.ficha_ligera ? 'Ficha OK' : 'Sin ficha')} · ${lote.mapa_ligero ? 'Mapa OK' : 'Sin mapa'}</div>
          ${esAgricola ? `<div><strong>Cosecha estimada:</strong> ${this._escaparHtml(lote.cosecha_estimada || 'Sin fecha')}</div>` : `<div><strong>Sanidad:</strong> ${this._escaparHtml(lote.alerta_tecnica || 'Sin alerta sanitaria')}</div>`}
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${fichaInfo}
          <button onclick='event.stopPropagation(); GestorGranjasMelantia.compartirProtegido(${idLoteJs})'>Compartir protegido 🛡️</button>
          ${mapaInfo}
          ${esAgricola ? `<button onclick='event.stopPropagation(); GestorGranjasMelantia.calcularInsumos(${idLoteJs})'>Calcular insumos</button>` : ''}
          <button onclick='event.stopPropagation(); GestorGranjasMelantia.generarDocumentoLegal(${idLoteJs}, "contrato_venta")'>Contrato</button>
          <button onclick='event.stopPropagation(); GestorGranjasMelantia.generarDocumentoLegal(${idLoteJs}, "acta_entrega")'>Acta</button>
          <button onclick='event.stopPropagation(); GestorGranjasMelantia.generarDocumentoLegal(${idLoteJs}, "pagare")'>Pagaré</button>
          <button onclick='event.stopPropagation(); GestorGranjasMelantia.liberarEspacioLote(${idLoteJs})'>Liberar espacio</button>
          <button onclick='event.stopPropagation(); GestorGranjasMelantia.cerrarTrato(${idLoteJs})'>Cerrar trato</button>
        </div>
      </article>`;
  },

  async abrirTableroControl() {
    const panel = document.getElementById('panel-novedades');
    if (!panel) return;

    ui_melantia.pensar();
    try {
      const tablero = await this._cargarTablero();
      const modoPrivacidad = this._modoPrivacidadActual();
      const lotesAgricolas = tablero.lotes.filter(
        (lote) => lote.tipo_lote === 'agricola'
      );
      const lotesPecuarios = tablero.lotes.filter(
        (lote) => lote.tipo_lote === 'pecuario'
      );
      const bloqueMarca = this._renderMarcaRanchoVisual({
        compacta: true,
        enLinea: true,
      });
      const renderGrupo = (titulo, subtitulo, lotes) => `
        <section style="display:grid;gap:10px">
          <div>
            <strong style="font-size:15px;color:#173728">${this._escaparHtml(titulo)}</strong>
            <div style="color:#567261;font-size:13px">${this._escaparHtml(subtitulo)}</div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px">${lotes.length ? lotes.map((lote) => this._renderTarjetaLote(lote)).join('') : '<p class="novedad-n3">Sin lotes registrados en esta rama.</p>'}</div>
        </section>`;

      panel.style.maxWidth = '980px';
      panel.innerHTML = `
        <div class="novedad-card" data-experto="Melantia" style="max-height:82vh;overflow-y:auto;display:grid;gap:14px">
          <div>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
              <p class="novedad-n1" style="margin:0">🏡 Gestión Productiva</p>
              <div>${bloqueMarca}</div>
            </div>
            <p class="novedad-n2">${tablero.total_lotes} lote(s) activos • ${tablero.total_lotes_agricolas} agrícolas • ${tablero.total_lotes_pecuarios} pecuarios • ${tablero.total_animales} animales • ${this._escaparHtml(Number(tablero.total_area_ha || 0).toFixed(2))} ha medidas.</p>
            <p class="novedad-n3">Privacidad maestra de ubicación: <strong>${this._escaparHtml(modoPrivacidad)}</strong>. Internamente el GPS exacto se conserva; externamente se aplica tu modo de seguridad. La app usa documentos y mapas vectoriales livianos para no saturar el teléfono.</p>
          </div>
          <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px">
            <button onclick="MelantiaPrivacidadUbicacion.abrir()">Interruptor maestro GPS</button>
            <button onclick="GestorGranjasMelantia.sincronizarTodoAhora()">Sincronizar todo ahora</button>
            <button onclick="GestorGranjasMelantia.abrirDocumentos()">Documentos MELANTIA</button>
            <button onclick="GestorGranjasMelantia.abrirConfiguracionMarcaRancho('tablero')">Marca del rancho</button>
            <button onclick="GestorGranjasMelantia.abrirTableroControl()">Recargar tablero</button>
            <button onclick="document.getElementById('panel-novedades').style.display='none'">Cerrar</button>
          </div>
          ${renderGrupo('🌿 Lotes Agrícolas', 'Fitosanidad, área GPS, cosecha estimada y documentos livianos.', lotesAgricolas)}
          ${renderGrupo('🐄 Lotes Pecuarios', 'Pesaje, trazabilidad fotográfica, fichas y alertas sanitarias.', lotesPecuarios)}
        </div>`;
      panel.style.display = 'block';
      await this.actualizarResumenTarjeta();
    } catch (error) {
      console.error('[Granjas] Error al abrir tablero:', error);
      panel.innerHTML = `
        <div class="novedad-card" data-experto="Melantia">
          <p class="novedad-n1">No pude abrir el centro de control de granjas.</p>
          <p class="novedad-n2">${this._escaparHtml(error.message || String(error))}</p>
          <div class="novedad-acciones"><button onclick="document.getElementById('panel-novedades').style.display='none'">Cerrar</button></div>
        </div>`;
      panel.style.display = 'block';
    } finally {
      ui_melantia.listo();
    }
  },
};

window.GestorGranjasMelantia = GestorGranjasMelantia;

document.addEventListener('DOMContentLoaded', () => {
  const btnPrivacidad = document.getElementById('btn-privacidad-gps');
  if (btnPrivacidad) {
    btnPrivacidad.addEventListener('click', () => {
      MelantiaPrivacidadUbicacion.abrir();
    });
  }
  MelantiaComandosVoz.iniciar();
  window.GestorRuralMelantia?.iniciar?.();
  GestorGranjasMelantia.iniciar();
});

// Verifica las 3 condiciones y retorna { verde, motivo, esDomingo }
const evaluarSemaforo = async () => {
  // ── Condición 1: día programado ──
  const dia = new Date().getDay();
  const esDomingo = dia === 0;
  if (!DIAS_ACTUALIZACION.includes(dia)) {
    return { verde: false, motivo: 'DIA_NO_PROGRAMADO' };
  }

  // ── Condición 2: energía asegurada ──
  // El domingo ("día de pueblo") el umbral baja al 50% si hay WiFi
  // porque el productor está en el pueblo con acceso a corriente.
  const net =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection;
  const hayWifi = net?.type === 'wifi';
  const umbralBateria = esDomingo && hayWifi ? 50 : 80;

  if ('getBattery' in navigator) {
    const bat = await navigator.getBattery();
    const pct = Math.round(bat.level * 100);
    if (!bat.charging && pct <= umbralBateria) {
      _voz(
        esDomingo
          ? 'Hay buena señal, pero prefiero que me conectes a la corriente para no agotarme mientras descargo todo el conocimiento nuevo.'
          : 'Lo siento, la batería está al ' +
              pct +
              ' por ciento y no estás cargando. Prefiero esperar a que conectes el cargador para no dejarte incomunicado.'
      );
      return { verde: false, motivo: 'BATERIA_BAJA', bateria: pct, esDomingo };
    }
  }

  // ── Condición 3: calidad de señal ──
  if (net) {
    const tipo = net.effectiveType || ''; // '4g', '3g', '2g', 'slow-2g'
    const tipoFisico = net.type || ''; // 'wifi', 'cellular', etc.
    const buena = tipo === '4g' || tipoFisico === 'wifi';
    if (!buena) {
      _voz(
        'Lo siento, la señal es muy débil ahora. Prefiero esperar a que estemos en un lugar seguro para no agotar tu batería ni dañar mi cerebro.'
      );
      return {
        verde: false,
        motivo: 'SENAL_DEBIL',
        tipo,
        tipoFisico,
        esDomingo,
      };
    }
  }

  return { verde: true, motivo: 'OK', esDomingo };
};

const verificarRetroalimentacion = async () => {
  if (!navigator.onLine) return;
  const { verde, motivo, esDomingo } = await evaluarSemaforo();
  if (!verde) {
    console.log(
      `[MELANTIA] Semáforo ROJO — ${motivo}. Actualización bloqueada.`
    );
    return;
  }

  // ── Perfil Prioridad Baja — Domingo ──
  // Si la pantalla está activa (el productor la usa), posponer.
  // Solo descarga cuando el celular esté en el bolsillo (oculto) o cargando.
  if (esDomingo && document.visibilityState === 'visible') {
    // Esperar a que la pantalla se apague o pase al segundo plano
    console.log(
      '[MELANTIA] Domingo — pantalla activa. Esperando modo bolsillo…'
    );
    const escucharIdle = () => {
      if (document.visibilityState === 'hidden') {
        document.removeEventListener('visibilitychange', escucharIdle);
        console.log(
          '[MELANTIA] Domingo — celular en bolsillo. Descarga silenciosa iniciada.'
        );
        actualizarConocimientos(false);
      }
    };
    document.addEventListener('visibilitychange', escucharIdle);
    return; // No lanzar ahora; esperar el evento
  }

  // Semáforo VERDE → informar y actualizar
  const vozInicio = esDomingo
    ? 'He detectado una señal excelente aquí. Aprovecharé para actualizar todos mis módulos mientras descansas.'
    : 'Hola. He detectado que estás cargando el celular y tienes buena señal. Estoy aprovechando para descargar nuevas experiencias de otros productores. No te preocupes, yo me encargo de todo.';
  _voz(vozInicio);
  console.log(
    `[MELANTIA] Semáforo VERDE${esDomingo ? ' — Sincronización de Pueblo (Domingo)' : ''} — iniciando retroalimentación segura.`
  );
  actualizarConocimientos(false);
};

// Actualización normal (forzar=false) o de emergencia (forzar=true)
let _syncConocimientoActiva = null;

const actualizarConocimientos = (forzar = false, opciones = {}) => {
  if (_syncConocimientoActiva && !forzar) {
    return _syncConocimientoActiva;
  }

  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    return Promise.resolve({
      aplicado: false,
      motivo: 'SERVICE_WORKER_NO_DISPONIBLE',
    });
  }

  // ── Cortafuegos Económico ──
  // Las actualizaciones de conocimiento están exentas de costo directo
  // (son JSON locales), pero se registra como uso del presupuesto de sync.
  const estado = BudgetGuard.verificar('sync');
  if (estado === 'HARD_STOP_ACTIVE') {
    return Promise.resolve({ aplicado: false, motivo: 'HARD_STOP_ACTIVE' });
  }

  if (estado === 'ALERTA' && !forzar) {
    // En zona de alerta sólo sincronizar archivos vitales (precios + alertas)
    console.log('[BUDGET] Zona de alerta — sincronizando solo datos vitales.');
  }

  ui_melantia.pensar();

  _syncConocimientoActiva = new Promise((resolve) => {
    navigator.serviceWorker.controller.postMessage({
      tipo: 'ACTUALIZAR_CONOCIMIENTO',
      forzar,
      soloVital: estado === 'ALERTA' && !forzar,
      origen: opciones.origen || 'manual',
    });

    navigator.serviceWorker.addEventListener(
      'message',
      async (event) => {
        if (event.data?.tipo !== 'ACTUALIZACION_COMPLETA') return;
        ui_melantia.listo();
        const { actualizados, errores, fallidos, timestamp } = event.data;
        console.log(
          `[MELANTIA] Actualizados: ${actualizados} | Errores: ${errores} | ${timestamp}`
        );

        if (actualizados > 0) BudgetGuard.registrarGasto(0.05);

        if (actualizados > 0) {
          SincronizacionDelta.verificarDelta().then((res) => {
            if (res.aplicado)
              console.log(
                `[DELTA] ${res.aplicados} cambios delta. Versión: ${res.version}`
              );
          });
          if (
            !opciones.posponerFotos &&
            typeof window.sincronizarFotosSupabase === 'function'
          ) {
            window
              .sincronizarFotosSupabase()
              .then((res) => {
                if (res?.motivo === 'SUPABASE_NO_CONFIGURADO') return;
                if (res?.motivo === 'SIN_RED') return;
                console.log(
                  '[SUPABASE]',
                  res?.mensaje || 'Sync de fotos completada.'
                );
              })
              .catch((err) =>
                console.warn(
                  '[SUPABASE] No se pudo sincronizar evidencia:',
                  err.message
                )
              )
              .finally(() => {
                if (
                  typeof window.sincronizarExpedienteRuralMelantia ===
                  'function'
                ) {
                  window
                    .sincronizarExpedienteRuralMelantia()
                    .then((res) => {
                      if (res?.motivo === 'SUPABASE_NO_CONFIGURADO') return;
                      if (res?.motivo === 'SIN_RED') return;
                      console.log(
                        '[CENTRO-MANDO-RURAL]',
                        res?.mensaje || 'Expediente rural sincronizado.'
                      );
                    })
                    .catch((err) =>
                      console.warn(
                        '[CENTRO-MANDO-RURAL] No se pudo sincronizar expediente rural:',
                        err.message
                      )
                    );
                }
              });
          } else if (
            typeof window.sincronizarExpedienteRuralMelantia === 'function'
          ) {
            window
              .sincronizarExpedienteRuralMelantia()
              .then((res) => {
                if (res?.motivo === 'SUPABASE_NO_CONFIGURADO') return;
                if (res?.motivo === 'SIN_RED') return;
                console.log(
                  '[CENTRO-MANDO-RURAL]',
                  res?.mensaje || 'Expediente rural sincronizado.'
                );
              })
              .catch((err) =>
                console.warn(
                  '[CENTRO-MANDO-RURAL] No se pudo sincronizar expediente rural:',
                  err.message
                )
              );
          }
          const cola = TuberiaInteligente.exportarCola();
          if (cola.length > 0)
            console.log(
              `[TUBERIA] ${cola.length} consultas en cola para la próxima sync.`
            );
        }

        let bateria = 100;
        if ('getBattery' in navigator) {
          const bat = await navigator.getBattery();
          bateria = Math.round(bat.level * 100);
        }
        ReporteLunes.guardarSalud(actualizados, errores, bateria);

        if (typeof StaffController !== 'undefined') {
          StaffController.activarPersonaje('Melantia');
        }
        MelantiaReporte.mostrar(actualizados, errores, forzar);
        resolve({
          aplicado: true,
          actualizados,
          errores,
          fallidos,
          timestamp,
        });
      },
      { once: true }
    );
  }).finally(() => {
    _syncConocimientoActiva = null;
  });

  return _syncConocimientoActiva;
};

// ==============================================
// ACTUALIZACIÓN DE EMERGENCIA
// Para plagas urgentes: ignora señal/batería,
// pero advierte al usuario del riesgo.
// ==============================================
const actualizacionEmergencia = async () => {
  const net =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection;
  const tipo = net?.effectiveType || 'desconocida';

  // Guiar hacia mejor cobertura si la señal es mala
  if (net && tipo !== '4g' && net.type !== 'wifi') {
    SemaforoUI.mostrarGuiaCobertura(tipo);
  }

  _voz(
    'Modo emergencia activado. Voy a descargar la información urgente aunque la señal no sea perfecta. Por favor, no cierres la aplicación.'
  );
  console.log('[MELANTIA] ⚠️ Actualización de EMERGENCIA iniciada.');
  actualizarConocimientos(true);
};

const MelantiaSyncOportunista = {
  _CLAVE_CONFIG: 'melantia_sync_admin_config',
  config: {
    ventanas: [6, 12, 19],
    maxIntentos: 4,
    intervalo: 15 * 60 * 1000,
    agresividad: 'equilibrado',
  },
  _fotoTimer: null,
  _timerVentana: null,
  _enCurso: false,
  _listenersRegistrados: false,
  _intentosActuales: 0,
  _ventanaActiva: null,
  _bannerTimer: null,

  _obtenerClaveVentana(fecha = new Date()) {
    const hora = fecha.getHours();
    if (!this.config.ventanas.includes(hora)) return null;
    return `${fecha.toISOString().slice(0, 10)}_${hora}`;
  },

  _leerConfigGuardada() {
    try {
      const raw = localStorage.getItem(this._CLAVE_CONFIG);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return {
        ventanas: Array.isArray(data?.ventanas)
          ? data.ventanas
              .map((hora) => Number(hora))
              .filter(
                (hora) => Number.isInteger(hora) && hora >= 0 && hora <= 23
              )
              .slice(0, 6)
          : null,
        maxIntentos: Number(data?.maxIntentos),
        intervalo: Number(data?.intervalo),
        agresividad: String(data?.agresividad || '')
          .trim()
          .toLowerCase(),
      };
    } catch {
      return null;
    }
  },

  _guardarConfigInterna(config = {}) {
    const ventanas = Array.isArray(config.ventanas)
      ? config.ventanas
          .map((hora) => Number(hora))
          .filter((hora) => Number.isInteger(hora) && hora >= 0 && hora <= 23)
          .sort((a, b) => a - b)
      : [...this.config.ventanas];
    const payload = {
      ventanas: ventanas.length ? ventanas : [6, 12, 19],
      maxIntentos: Math.min(12, Math.max(1, Number(config.maxIntentos) || 4)),
      intervalo: Math.min(
        120 * 60 * 1000,
        Math.max(5 * 60 * 1000, Number(config.intervalo) || 15 * 60 * 1000)
      ),
      agresividad: ['conservador', 'equilibrado', 'intensivo'].includes(
        config.agresividad
      )
        ? config.agresividad
        : 'equilibrado',
    };
    this.config = payload;
    localStorage.setItem(this._CLAVE_CONFIG, JSON.stringify(payload));
    return payload;
  },

  cargarConfigInterna() {
    const guardada = this._leerConfigGuardada();
    if (!guardada) return this.config;
    return this._guardarConfigInterna({
      ventanas: guardada.ventanas || this.config.ventanas,
      maxIntentos:
        Number.isFinite(guardada.maxIntentos) && guardada.maxIntentos > 0
          ? guardada.maxIntentos
          : this.config.maxIntentos,
      intervalo:
        Number.isFinite(guardada.intervalo) && guardada.intervalo > 0
          ? guardada.intervalo
          : this.config.intervalo,
      agresividad:
        guardada.agresividad || this.config.agresividad || 'equilibrado',
    });
  },

  _perfilAgresividad() {
    const perfil = this.config.agresividad || 'equilibrado';
    if (perfil === 'conservador') {
      return {
        fotoDelayMs: 45000,
        permiteTipos: ['4g'],
        requiereWifiFisico: true,
      };
    }
    if (perfil === 'intensivo') {
      return {
        fotoDelayMs: 15000,
        permiteTipos: ['3g', '4g'],
        requiereWifiFisico: false,
      };
    }
    return {
      fotoDelayMs: 30000,
      permiteTipos: ['4g', '3g'],
      requiereWifiFisico: false,
    };
  },

  _programar(fechaObjetivo, accion) {
    if (this._timerVentana) {
      clearTimeout(this._timerVentana);
    }
    const espera = Math.max(1000, fechaObjetivo.getTime() - Date.now());
    this._timerVentana = setTimeout(() => {
      accion();
    }, espera);
  },

  _proximaVentana(fechaBase = new Date()) {
    for (const hora of this.config.ventanas) {
      const fecha = new Date(fechaBase);
      fecha.setHours(hora, 0, 0, 0);
      if (fecha > fechaBase) return fecha;
    }
    const manana = new Date(fechaBase);
    manana.setDate(manana.getDate() + 1);
    manana.setHours(this.config.ventanas[0], 0, 0, 0);
    return manana;
  },

  _mostrarBannerActualizacion() {
    let banner = document.getElementById('melantia-sync-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'melantia-sync-banner';
      banner.style.cssText = [
        'position:fixed',
        'top:14px',
        'left:50%',
        'transform:translateX(-50%)',
        'z-index:11001',
        'background:#173728',
        'color:#fff',
        'padding:10px 14px',
        'border-radius:14px',
        'box-shadow:0 10px 24px rgba(0,0,0,.18)',
        'display:flex',
        'align-items:center',
        'gap:10px',
        'max-width:min(92vw,540px)',
        'font-size:13px',
      ].join(';');
      document.body.appendChild(banner);
    }

    banner.innerHTML = `
      <strong style="letter-spacing:.4px">MELANTIA SE HA ACTUALIZADO</strong>
      <span style="opacity:.9">La app y el sistema siguen trabajando y actualizándose para brindarte un mejor servicio.</span>
      <button type="button" style="margin-left:auto;background:#fff;color:#173728;border:none;border-radius:999px;padding:6px 10px;cursor:pointer;font-weight:700">🔊</button>`;
    banner.style.display = 'flex';
    banner
      .querySelector('button')
      ?.addEventListener('click', () => this.notificarActualizacion(true), {
        once: true,
      });

    if (this._bannerTimer) clearTimeout(this._bannerTimer);
    this._bannerTimer = setTimeout(() => {
      banner.style.display = 'none';
    }, 7000);
  },

  _senalApta() {
    const perfil = this._perfilAgresividad();
    const net =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;
    if (!net) return navigator.onLine;
    const tipo = String(net.effectiveType || '').toLowerCase();
    const tipoFisico = String(net.type || '').toLowerCase();
    if (perfil.requiereWifiFisico && tipoFisico === 'wifi')
      return navigator.onLine;
    if (tipo === 'slow-2g' || tipo === '2g') return false;
    return navigator.onLine && perfil.permiteTipos.includes(tipo || '4g');
  },

  async _actualizarClimaCritico() {
    if (typeof window.actualizarClimaRuralMelantia !== 'function') {
      return { aplicado: false, motivo: 'CLIMA_NO_DISPONIBLE' };
    }
    try {
      const lote = await FabrizzioAsesor._resolverLoteActual();
      if (!lote) return { aplicado: false, motivo: 'SIN_LOTE' };
      const resultado = await window.actualizarClimaRuralMelantia(lote);
      console.log(
        '[SALTO-SENAL] Clima rural actualizado desde',
        resultado?.ubicacion || 'estación cercana'
      );
      return { aplicado: true, resultado };
    } catch (error) {
      console.warn('[SALTO-SENAL] No pude actualizar clima:', error.message);
      return { aplicado: false, motivo: error.message };
    }
  },

  async _actualizarReglasFabrizzio() {
    try {
      const resultado = await FabrizzioAsesor.descargarNuevasReglas();
      console.log('[SALTO-SENAL] Reglas de Fabrizzio revisadas.');
      return resultado;
    } catch (error) {
      console.warn('[SALTO-SENAL] No pude actualizar reglas:', error.message);
      return { aplicado: false, motivo: error.message };
    }
  },

  async _sincronizarCentroMandoRural() {
    if (typeof window.sincronizarExpedienteRuralMelantia !== 'function') {
      return { aplicado: false, motivo: 'EXPEDIENTE_RURAL_NO_DISPONIBLE' };
    }
    try {
      const resultado = await window.sincronizarExpedienteRuralMelantia();
      if (resultado?.motivo === 'SUPABASE_NO_CONFIGURADO') return resultado;
      if (resultado?.motivo === 'SIN_RED') return resultado;
      console.log(
        '[SALTO-SENAL]',
        resultado?.mensaje || 'Expediente rural enviado al centro de mando.'
      );
      return {
        aplicado: Boolean(resultado?.aplicado),
        resultado,
      };
    } catch (error) {
      console.warn(
        '[SALTO-SENAL] No pude sincronizar expediente rural:',
        error.message
      );
      return { aplicado: false, motivo: error.message };
    }
  },

  notificarActualizacion(conVoz = false) {
    this._mostrarBannerActualizacion();
    if (conVoz) {
      FabrizzioAsesor.hablar(
        'Melantia se ha actualizado. Ya tengo los últimos datos del clima y las recomendaciones para tus lotes.'
      );
    }
  },

  async actualizarDatosCriticos() {
    const clima = await this._actualizarClimaCritico();
    const reglas = await this._actualizarReglasFabrizzio();
    const expedienteRural = await this._sincronizarCentroMandoRural();
    const exito = Boolean(
      clima?.aplicado || reglas?.aplicado || expedienteRural?.aplicado
    );
    if (exito) {
      this.notificarActualizacion(false);
      this._programarFotosPendientes();
    }
    return {
      exito,
      clima,
      reglas,
      expedienteRural,
    };
  },

  _reprogramarDentroDeVentana() {
    const siguiente = new Date(Date.now() + this.config.intervalo);
    this._programar(siguiente, () => this.ejecutarIntento());
  },

  iniciarCiclo() {
    const ahora = new Date();
    const claveVentana = this._obtenerClaveVentana(ahora);
    if (!claveVentana) {
      this._ventanaActiva = null;
      this._intentosActuales = 0;
      this._programar(this._proximaVentana(ahora), () => this.iniciarCiclo());
      return;
    }

    if (this._ventanaActiva !== claveVentana) {
      this._ventanaActiva = claveVentana;
      this._intentosActuales = 0;
    }

    this.ejecutarIntento();
  },

  async ejecutarIntento() {
    const ahora = new Date();
    const claveVentana = this._obtenerClaveVentana(ahora);
    if (!claveVentana) {
      this.iniciarCiclo();
      return;
    }

    if (this._ventanaActiva !== claveVentana) {
      this._ventanaActiva = claveVentana;
      this._intentosActuales = 0;
    }

    if (this._intentosActuales >= this.config.maxIntentos) {
      this._programar(this._proximaVentana(ahora), () => this.iniciarCiclo());
      return;
    }

    if (!navigator.onLine || this._enCurso) {
      this._intentosActuales += 1;
      this._reprogramarDentroDeVentana();
      return;
    }

    this._intentosActuales += 1;
    const resultado = await this.actualizarDatosCriticos();
    if (resultado.exito) {
      this._intentosActuales = 0;
      this._programar(this._proximaVentana(new Date()), () =>
        this.iniciarCiclo()
      );
    } else if (this._intentosActuales < this.config.maxIntentos) {
      this._reprogramarDentroDeVentana();
    } else {
      this._programar(this._proximaVentana(new Date()), () =>
        this.iniciarCiclo()
      );
    }
  },

  _programarFotosPendientes() {
    const perfil = this._perfilAgresividad();
    if (this._fotoTimer) {
      clearTimeout(this._fotoTimer);
    }
    this._fotoTimer = setTimeout(async () => {
      this._fotoTimer = null;
      if (!this._senalApta()) {
        console.log(
          '[SALTO-SENAL] La señal no se sostuvo 30 segundos. Fotos pospuestas.'
        );
        return;
      }
      if (typeof window.sincronizarFotosSupabase !== 'function') return;
      try {
        const res = await window.sincronizarFotosSupabase();
        if (
          res?.motivo === 'SUPABASE_NO_CONFIGURADO' ||
          res?.motivo === 'SIN_RED'
        ) {
          return;
        }
        console.log(
          '[SALTO-SENAL]',
          res?.mensaje || 'Fotos pendientes sincronizadas.'
        );
      } catch (error) {
        console.warn('[SALTO-SENAL] No pude sincronizar fotos:', error.message);
      }
    }, perfil.fotoDelayMs);
  },

  abrirPanelInterno() {
    const panel = document.getElementById('panel-novedades');
    if (!panel) return;

    const config = this.cargarConfigInterna();
    const ventanasTexto = (config.ventanas || []).join(', ');
    const intervaloMin = Math.round((config.intervalo || 0) / 60000) || 15;
    panel.style.maxWidth = '760px';
    panel.innerHTML = `
      <div class="novedad-card" data-experto="Melantia" style="display:grid;gap:12px">
        <p class="novedad-n1">Panel Interno de Sincronización MELANTIA</p>
        <p class="novedad-n2">Uso exclusivo de administración interna. Este panel no se expone en la interfaz pública.</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">
          <label style="display:grid;gap:6px;font-size:13px;color:#355246"><span>Ventanas horarias (0-23, separadas por coma)</span><input data-sync-ventanas type="text" value="${this._escaparHtml(ventanasTexto)}" style="padding:10px 12px;border:1px solid #ccd8d0;border-radius:10px" /></label>
          <label style="display:grid;gap:6px;font-size:13px;color:#355246"><span>Máximo de intentos por ventana</span><input data-sync-intentos type="number" min="1" max="12" value="${this._escaparHtml(String(config.maxIntentos || 4))}" style="padding:10px 12px;border:1px solid #ccd8d0;border-radius:10px" /></label>
          <label style="display:grid;gap:6px;font-size:13px;color:#355246"><span>Intervalo entre intentos (minutos)</span><input data-sync-intervalo type="number" min="5" max="120" value="${this._escaparHtml(String(intervaloMin))}" style="padding:10px 12px;border:1px solid #ccd8d0;border-radius:10px" /></label>
          <label style="display:grid;gap:6px;font-size:13px;color:#355246"><span>Agresividad</span><select data-sync-agresividad style="padding:10px 12px;border:1px solid #ccd8d0;border-radius:10px;background:#fff"><option value="conservador" ${config.agresividad === 'conservador' ? 'selected' : ''}>Conservador</option><option value="equilibrado" ${config.agresividad === 'equilibrado' ? 'selected' : ''}>Equilibrado</option><option value="intensivo" ${config.agresividad === 'intensivo' ? 'selected' : ''}>Intensivo</option></select></label>
        </div>
        <div style="font-size:12px;color:#587063;background:#f7faf8;border:1px solid #d7e2da;border-radius:12px;padding:12px">Conservador: prioriza WiFi/4G estable y retrasa más la carga pesada. Equilibrado: recomendado para operación normal. Intensivo: aprovecha 3G/4G y reduce la espera para fotos.</div>
        <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px">
          <button type="button" data-sync-guardar>Guardar</button>
          <button type="button" data-sync-probar>Probar ciclo ahora</button>
          <button type="button" data-sync-cerrar>Cerrar</button>
        </div>
      </div>`;
    panel.style.display = 'block';

    const inputVentanas = panel.querySelector('[data-sync-ventanas]');
    const inputIntentos = panel.querySelector('[data-sync-intentos]');
    const inputIntervalo = panel.querySelector('[data-sync-intervalo]');
    const selectAgresividad = panel.querySelector('[data-sync-agresividad]');
    const botonGuardar = panel.querySelector('[data-sync-guardar]');
    const botonProbar = panel.querySelector('[data-sync-probar]');
    const botonCerrar = panel.querySelector('[data-sync-cerrar]');

    if (
      !inputVentanas ||
      !inputIntentos ||
      !inputIntervalo ||
      !selectAgresividad ||
      !botonGuardar ||
      !botonProbar ||
      !botonCerrar
    ) {
      return;
    }

    botonGuardar.onclick = () => {
      const ventanas = String(inputVentanas.value || '')
        .split(',')
        .map((item) => Number(String(item).trim()))
        .filter((hora) => Number.isInteger(hora) && hora >= 0 && hora <= 23);
      const guardada = this._guardarConfigInterna({
        ventanas,
        maxIntentos: Number(inputIntentos.value),
        intervalo: Number(inputIntervalo.value) * 60000,
        agresividad: String(selectAgresividad.value || 'equilibrado'),
      });
      this.iniciarCiclo();
      _voz(
        `Configuración interna guardada. ${guardada.ventanas.length} ventanas activas y perfil ${guardada.agresividad}.`
      );
    };

    botonProbar.onclick = async () => {
      await this.aprovecharSaltoDeSenal();
    };

    botonCerrar.onclick = () => {
      panel.style.display = 'none';
      panel.innerHTML = '';
    };
  },

  async aprovecharSaltoDeSenal() {
    if (this._enCurso || !navigator.onLine) return;
    this._enCurso = true;
    try {
      console.log(
        '¡Señal detectada! MELANTIA actualizará clima, reglas y luego evidencias pendientes.'
      );
      const resultado = await this.actualizarDatosCriticos();
      if (resultado.exito) {
        this.notificarActualizacion(true);
      }
    } finally {
      this._enCurso = false;
    }
  },

  iniciar() {
    if (this._listenersRegistrados) return;
    this.cargarConfigInterna();
    window.addEventListener('online', () => {
      this.aprovecharSaltoDeSenal();
    });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.iniciarCiclo();
    });
    this._listenersRegistrados = true;
    this.iniciarCiclo();
  },
};

window.MelantiaSyncOportunista = MelantiaSyncOportunista;
window.MelantiaSync = MelantiaSyncOportunista;
window.MelantiaSyncAdmin = {
  abrir: () => MelantiaSyncOportunista.abrirPanelInterno(),
  obtenerConfig: () => ({ ...MelantiaSyncOportunista.config }),
  guardar: (config = {}) =>
    MelantiaSyncOportunista._guardarConfigInterna(config),
};

// ==============================================
// Reporte de Actualización de MELANTIA
// 3 niveles: Bienvenida, Novedades, Acción
// ==============================================

const MelantiaReporte = {
  // Plantillas por día de actualización
  _mensajes: {
    1: {
      // Lunes
      novedad:
        'He actualizado los precios de mercado con Fabrizzio y Ángel para que empieces la semana con datos frescos.',
      experto: 'Angel',
    },
    4: {
      // Jueves
      novedad:
        'He inyectado nuevas experiencias de otros productores sobre manejo de suelos y control de plagas.',
      experto: 'Fabrizzio',
    },
    6: {
      // Sábado
      novedad:
        'He preparado el resumen de la semana, novedades legales y alertas del Asistente Preventivo de Salud para tu hogar rural.',
      experto: 'Paulette',
    },
    0: {
      // Domingo — Sincronización de Pueblo: todo el equipo
      novedad:
        '¡Hoy es domingo de pueblo! Todo el equipo ha trabajado: Ángel actualizó precios de mercado, Fabrizzio inyectó alertas técnicas, el Dr. Pablo trajo nuevas normativas y Paulette reforzó banderas rojas y protocolos del Asistente Preventivo de Salud.',
      experto: 'Melantia',
      etiqueta: '🏛️ Sincronización de Pueblo',
    },
  },

  mostrar(actualizados, errores, forzar = false) {
    if (actualizados === 0 && errores === 0) return;
    const dia = new Date().getDay();
    const datos = this._mensajes[dia] || this._mensajes[1];
    const panel = document.getElementById('panel-novedades');
    if (!panel) return;

    // Nivel 1 — Bienvenida
    const nivel1 =
      'Hola, soy Melantia. He aprovechado la última conexión para fortalecer nuestro conocimiento.';
    // Nivel 2 — Novedades técnicas
    const nivel2 =
      errores > 0
        ? `${datos.novedad} (${actualizados} elementos actualizados, ${errores} no disponibles por la señal.)`
        : `${datos.novedad} (${actualizados} elementos nuevos listos.)`;
    // Nivel 3 — Llamada a la acción
    const nivel3 =
      '¿Quieres que te cuente la técnica más exitosa de esta semana o prefieres ir directamente a tus módulos?';

    panel.innerHTML = `
      <div class="novedad-card" data-experto="${datos.experto}">
        <p class="novedad-n1">🌿 ${nivel1}</p>
        <p class="novedad-n2">📊 ${nivel2}</p>
        <p class="novedad-n3">📢 ${nivel3}</p>
        <div class="novedad-acciones">
          <button onclick="MelantiaReporte.escucharTecnica('${datos.experto}')">Ver técnica nueva</button>
          <button onclick="MelantiaReporte.cerrar()">Ir a mis módulos</button>
        </div>
      </div>`;
    panel.style.display = 'block';

    // Hablar (Web Speech API offline)
    this._hablar(`${nivel1} ${nivel2}`);
  },

  escucharTecnica(experto) {
    if (typeof StaffController !== 'undefined') {
      StaffController.activarPersonaje(experto);
    }
    this.cerrar();
  },

  cerrar() {
    const panel = document.getElementById('panel-novedades');
    if (panel) panel.style.display = 'none';
  },

  _hablar(texto) {
    if (!('speechSynthesis' in window)) return;
    const utt = new SpeechSynthesisUtterance(texto);
    utt.lang = 'es-EC';
    utt.pitch = window._melantia_voz_pitch || 1.05;
    utt.rate = window._melantia_voz_rate || 0.95;
    speechSynthesis.cancel();
    speechSynthesis.speak(utt);
  },
};

// ==============================================
// Recolector de Basura Inteligente
// Libera caché obsoleta al actualizar.
// Prioridad: conserva lo más consultado.
// ==============================================
const LimpiarCerebro = {
  async ejecutar() {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller)
      return;
    navigator.serviceWorker.controller.postMessage({ tipo: 'LIMPIAR_CACHE' });
    console.log('[MELANTIA] Recolector de basura ejecutado.');
  },
};

// ==============================================
// SemaforoUI — indicador visual + guía cobertura
// ==============================================
const SemaforoUI = {
  // Muestra guía para buscar mejor señal según tipo actual
  mostrarGuiaCobertura(tipoActual) {
    const panel = document.getElementById('panel-novedades');
    if (!panel) return;
    const consejos = {
      '2g': 'Estás en 2G. Muévete hacia una zona alta o abierta, alejándote de edificios y árboles densos.',
      'slow-2g':
        'La señal está muy débil. Busca una loma, un lugar abierto o espera a conectarte a WiFi.',
      '3g': 'Tienes 3G. Para 4G prueba alejarte del área de sombra de cobertura o conectarte a WiFi.',
    };
    const consejo =
      consejos[tipoActual] ||
      'Busca un lugar alto y abierto, o conéctate a un WiFi estable.';
    panel.innerHTML = `
      <div class="novedad-card semaforo-alerta">
        <p class="novedad-n1">📡 Guía de Señal — Modo Emergencia</p>
        <p class="novedad-n2">Señal actual: <strong>${tipoActual.toUpperCase()}</strong></p>
        <p class="novedad-n3">💡 ${consejo}</p>
        <p style="font-size:0.8em;color:#888;margin-top:6px;">La descarga de emergencia iniciará aunque la señal no sea perfecta.</p>
        <div class="novedad-acciones">
          <button onclick="SemaforoUI.cerrar()">Entendido</button>
        </div>
      </div>`;
    panel.style.display = 'block';
    // Leer el consejo en voz alta
    _voz(consejo);
  },

  cerrar() {
    const panel = document.getElementById('panel-novedades');
    if (panel) panel.style.display = 'none';
  },
};

// ==============================================
// RADAR DE COBERTURA — Brújula de Señal
// Convierte MELANTIA en guía de campo para
// encontrar el mejor punto de señal.
// Sondeo cada 2s (bajo consumo de batería).
// ==============================================
const RadarCobertura = {
  _intervalo: null,
  _mejorFuerza: 0,
  _vibrando: false,

  // Mapa de calor histórico guardado en localStorage
  _CLAVE_PUNTOS: 'melantia_puntos_senal',

  // ── Abrir radar ──
  abrir() {
    const panel = document.getElementById('panel-radar');
    if (!panel) return;
    panel.style.display = 'flex';
    // Transformar robot en brújula
    const robot = document.getElementById('robot-asistente');
    if (robot) robot.classList.add('radar-activo');
    // Voz de Fabrizzio orienta al productor
    this._vozFabrizzio(
      'Bienvenido al buscador de cobertura. Camina lentamente y yo te diré cuándo tenemos suficiente señal para actualizarme.'
    );
    this._iniciarSondeo();
    this._recordarMejorPunto();
  },

  // ── Cerrar radar ──
  cerrar() {
    this._detenerSondeo();
    const panel = document.getElementById('panel-radar');
    if (panel) panel.style.display = 'none';
    const robot = document.getElementById('robot-asistente');
    if (robot) robot.classList.remove('radar-activo');
  },

  // ── Sondeo periódico cada 2 segundos ──
  _iniciarSondeo() {
    if (this._intervalo) return;
    this._intervalo = setInterval(() => this._medir(), 2000);
    this._medir(); // primera lectura inmediata
  },

  _detenerSondeo() {
    if (this._intervalo) {
      clearInterval(this._intervalo);
      this._intervalo = null;
    }
    if (this._vibrando) {
      navigator.vibrate && navigator.vibrate(0);
      this._vibrando = false;
    }
  },

  // ── Medir señal y actualizar UI ──
  _medir() {
    const net =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;
    let fuerza = 0;

    if (!navigator.onLine) {
      fuerza = 0;
    } else if (net) {
      switch (net.effectiveType) {
        case '4g':
          fuerza = net.type === 'wifi' ? 100 : 90;
          break;
        case '3g':
          fuerza = 60;
          break;
        case '2g':
          fuerza = 20;
          break;
        case 'slow-2g':
          fuerza = 8;
          break;
        default:
          fuerza = net.type === 'wifi' ? 100 : 50;
      }
    } else if (navigator.onLine) {
      fuerza = 50; // online pero sin Network Info API
    }

    this._actualizarUI(fuerza);

    // Guardar punto de buena señal en el historial GPS
    if (fuerza >= 80) {
      this._guardarPunto(fuerza);
    }
  },

  // ── Actualizar círculo de calor ──
  _actualizarUI(fuerza) {
    const circulo = document.getElementById('radar-circulo');
    const etiqueta = document.getElementById('radar-etiqueta');
    const barra = document.getElementById('radar-barra');
    if (!circulo) return;

    // Hue: 0=rojo, 30=naranja, 60=amarillo, 120=verde
    const hue = Math.round(fuerza * 1.2);
    circulo.style.background = `radial-gradient(circle, hsl(${hue},100%,60%) 0%, hsl(${hue},80%,35%) 100%)`;
    circulo.style.boxShadow = `0 0 ${fuerza / 3}px hsl(${hue},100%,55%)`;

    if (barra) {
      barra.style.width = `${fuerza}%`;
      barra.style.background = `hsl(${hue},90%,45%)`;
    }

    // Etiqueta textual
    let texto = '';
    let mensaje = '';
    if (fuerza >= 80) {
      texto = '✅ SEÑAL EXCELENTE';
      mensaje =
        '¡Detente aquí! Tenemos cobertura suficiente para actualizar mi cerebro.';
    } else if (fuerza >= 50) {
      texto = '🟡 SEÑAL REGULAR (3G)';
      mensaje = 'Sigue caminando hacia la loma, la señal está mejorando...';
    } else if (fuerza >= 15) {
      texto = '🟠 SEÑAL DÉBIL (2G)';
      mensaje =
        'Busca una zona alta y abierta, alejándote de la vegetación densa.';
    } else {
      texto = '🔴 SIN SEÑAL';
      mensaje =
        'No hay cobertura aquí. Camina hacia zonas elevadas o despejadas.';
    }
    if (etiqueta) etiqueta.textContent = texto;

    // Voz solo cuando cambia de zona semafórica
    const zonaAnterior = Math.floor(this._mejorFuerza / 25);
    const zonaActual = Math.floor(fuerza / 25);
    if (
      zonaActual !== zonaAnterior ||
      (fuerza >= 80 && this._mejorFuerza < 80)
    ) {
      this._vozFabrizzio(mensaje);
    }
    this._mejorFuerza = fuerza;

    // Vibración proporcional a la señal (más rápido = más cerca)
    if ('vibrate' in navigator && fuerza > 10) {
      const pausa = Math.max(100, 1000 - fuerza * 9);
      navigator.vibrate([50, pausa]);
      this._vibrando = true;
    }

    // Si llega a 80%, ofrecer actualización automática
    if (fuerza >= 80 && !this._ofrecioActualizar) {
      this._ofrecioActualizar = true;
      setTimeout(() => {
        const panel = document.getElementById('panel-radar');
        const btn = document.getElementById('radar-btn-actualizar');
        if (btn) btn.style.display = 'block';
      }, 500);
    } else if (fuerza < 80) {
      this._ofrecioActualizar = false;
      const btn = document.getElementById('radar-btn-actualizar');
      if (btn) btn.style.display = 'none';
    }
  },

  // ── Guardar punto GPS histórico ──
  _guardarPunto(fuerza) {
    if (!('geolocation' in navigator)) return;
    const esDomingo = new Date().getDay() === 0;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const puntos = this._cargarPuntos();
        const nuevo = {
          lat: +pos.coords.latitude.toFixed(5),
          lon: +pos.coords.longitude.toFixed(5),
          acc: Math.round(pos.coords.accuracy),
          tipo: fuerza >= 90 ? '4G/WiFi' : '3G',
          ts: new Date().toLocaleDateString('es-EC'),
          // Marcar como Zona de Alta Velocidad si es domingo con señal excelente
          zona: esDomingo && fuerza >= 90 ? 'ALTA_VELOCIDAD' : 'NORMAL',
        };
        // Evitar duplicados muy cercanos (±0.0005° ≈ 50 m)
        const duplicado = puntos.find(
          (p) =>
            Math.abs(p.lat - nuevo.lat) < 0.0005 &&
            Math.abs(p.lon - nuevo.lon) < 0.0005
        );
        if (!duplicado) {
          puntos.push(nuevo);
          // Mantener máx 20 puntos (no abusar del localStorage)
          if (puntos.length > 20) puntos.shift();
          localStorage.setItem(this._CLAVE_PUNTOS, JSON.stringify(puntos));
          if (nuevo.zona === 'ALTA_VELOCIDAD') {
            console.log(
              '[RADAR] ⭐ Zona de Alta Velocidad guardada (domingo):',
              nuevo
            );
          } else {
            console.log('[RADAR] Punto de buena señal guardado:', nuevo);
          }
        }
      },
      () => {}, // silenciar error de permisos GPS
      { timeout: 5000, maximumAge: 60000, enableHighAccuracy: false }
    );
  },

  _cargarPuntos() {
    try {
      return JSON.parse(localStorage.getItem(this._CLAVE_PUNTOS) || '[]');
    } catch {
      return [];
    }
  },

  // ── Recordar y narrar el mejor punto conocido ──
  _recordarMejorPunto() {
    const puntos = this._cargarPuntos();
    if (puntos.length === 0) return;
    // Priorizar Zonas de Alta Velocidad (guardadas en domingo)
    const zonaEstrella = puntos.find((p) => p.zona === 'ALTA_VELOCIDAD');
    const referencia = zonaEstrella || puntos[puntos.length - 1];
    const prefijo = zonaEstrella
      ? 'Tengo una Zona de Alta Velocidad registrada, del último domingo en el pueblo.'
      : 'La última vez encontré buena señal';
    this._vozFabrizzio(
      `${prefijo} El último registro es del ${referencia.ts} ` +
        `con una precisión de ${referencia.acc} metros. Intenta ir hacia ese punto primero.`
    );
  },

  // ── Historial de puntos en el panel radar ──
  _mostrarHistorial() {
    const el = document.getElementById('radar-historial');
    if (!el) return;
    const puntos = this._cargarPuntos();
    if (puntos.length === 0) {
      el.innerHTML =
        '<p style="color:#aaa;font-size:0.8em">Sin puntos guardados aún.</p>';
      return;
    }
    el.innerHTML = puntos
      .slice(-5)
      .reverse()
      .map((p) => {
        const icono = p.zona === 'ALTA_VELOCIDAD' ? '⭐ ' : '';
        return `<div class="radar-punto${p.zona === 'ALTA_VELOCIDAD' ? ' punto-estrella' : ''}">
            <span class="punto-tipo">${icono}${p.tipo}</span>
            <span class="punto-fecha">${p.ts}</span>
            <span class="punto-coord">${p.lat}, ${p.lon}</span></div>`;
      })
      .join('');
  },

  // ── Voz de Fabrizzio (guía de campo) ──
  _vozFabrizzio(texto) {
    if (!('speechSynthesis' in window)) return;
    const utt = new SpeechSynthesisUtterance(texto);
    utt.lang = 'es-EC';
    utt.pitch = 0.85; // voz de Fabrizzio: grave y calmada
    utt.rate = 0.92;
    speechSynthesis.cancel();
    speechSynthesis.speak(utt);
  },
};

document.addEventListener('DOMContentLoaded', () => {
  MelantiaSyncOportunista.iniciar();
  verificarRetroalimentacion();
  if (navigator.onLine) {
    MelantiaSyncOportunista.aprovecharSaltoDeSenal();
  }
  ReporteLunes.verificarYSaludar();
  // Mostrar estado actual del presupuesto al arrancar
  BudgetGuard.mostrarBarra();
  // Exponer tubería para llamadas desde módulos del menú
  window.procesarConsulta = (p) => TuberiaInteligente.procesarConsulta(p);
});

// ==============================================
// REPORTE DE LUNES — Resumen Matutino del Equipo
// Coordina a los 4 expertos en carrusel de voces.
// Watchdog de 15 s total, timeout 3 s por módulo.
// ==============================================
const ReporteLunes = {
  // ── Estado persistido en localStorage ──
  _CLAVE_SYNC: 'melantia_ultima_sync',
  _CLAVE_SALUD: 'melantia_salud_semana',
  _CLAVE_PREFS: 'melantia_reporte_prefs', // preferencias de formato
  _CLAVE_PERIODICO: 'melantia_periodico', // texto del periódico pendiente
  _watchdog: null,
  _cancelado: false,
  _enCarga: false, // true cuando está enchufado

  // ── Guiones del carrusel (se reemplazan con datos reales al actualizar) ──
  _guiones: {
    Angel: {
      pitch: 1.1,
      rate: 1.0,
      texto: () => {
        const d = ReporteLunes._leerDato('angel_novedad');
        return (
          d ||
          'Los precios del mercado se han mantenido estables esta semana. Te recomiendo revisar los precios del cacao y el café antes de negociar.'
        );
      },
    },
    Fabrizzio: {
      pitch: 0.85,
      rate: 0.92,
      texto: () => {
        const d = ReporteLunes._leerDato('fabrizzio_novedad');
        return (
          d ||
          'He incorporado nuevas experiencias de productores vecinos en tu manual técnico. Revisa la sección de control de plagas.'
        );
      },
    },
    'Dr. Pablo': {
      pitch: 0.9,
      rate: 0.88,
      texto: () => {
        const d = ReporteLunes._leerDato('pablo_novedad');
        return (
          d ||
          'He revisado las normativas vigentes. No hay cambios críticos esta semana, pero te recomiendo verificar el estado de tu registro de productor.'
        );
      },
    },
    Paulette: {
      pitch: 1.15,
      rate: 1.0,
      texto: () => {
        const d = ReporteLunes._leerDato('paulette_novedad');
        return (
          d ||
          'Recuerda revisar banderas rojas, mantener el botiquin al dia e hidratarte durante las jornadas de campo. La prevencion oportuna evita emergencias mayores.'
        );
      },
    },
  },

  // ── Punto de entrada: verificar si es lunes y hay sync completada ──
  verificarYSaludar() {
    const hoy = new Date().getDay();
    if (hoy !== 1) return; // Solo lunes

    const ultimaSync = localStorage.getItem(this._CLAVE_SYNC);
    if (!ultimaSync) return; // Nunca se sincronizó

    // Evitar mostrar el reporte más de una vez por día
    const claveHoy = `melantia_reporte_${new Date().toLocaleDateString('es-EC')}`;
    if (localStorage.getItem(claveHoy)) return;
    localStorage.setItem(claveHoy, '1');

    // ── Modo Estación de Carga ──
    // El reporte completo solo cuando el celular está enchufado.
    // Si no está cargando: aviso silencioso + escuchar si conectan el cable.
    if (!('getBattery' in navigator)) {
      // Sin Battery API — lanzar directamente
      this._lanzarReporte();
      return;
    }
    navigator.getBattery().then((bat) => {
      if (bat.charging) {
        this._enCarga = true;
        this._lanzarReporte();
      } else {
        // Aviso silencioso en pantalla (sin hablar para no molestar)
        this._mostrarAvisoCargador();
        // Vigilante: si conecta el cable en el mismo lunes, reporte arranca
        const vigilante = () => {
          if (bat.charging && new Date().getDay() === 1) {
            bat.removeEventListener('chargingchange', vigilante);
            this._enCarga = true;
            this._lanzarReporte();
          }
        };
        bat.addEventListener('chargingchange', vigilante);
      }
    });
  },

  // ── Aviso de cargador (sin audio, no invasivo) ──
  _mostrarAvisoCargador() {
    const panel = document.getElementById('panel-novedades');
    if (!panel) return;
    panel.innerHTML = `
      <div class="novedad-card" data-experto="Melantia" style="border-top-color:#facc15">
        <p class="novedad-n1">🔌 Reporte de novedades listo</p>
        <p class="novedad-n2">
          Conecta el cargador para escuchar el resumen de novedades de la semana.
          Mi equipo tiene muchas cosas que contarte.
        </p>
        <div class="novedad-acciones">
          <button onclick="ReporteLunes.mostrarPeriodico()">📰 Ver como periódico</button>
          <button onclick="ReporteLunes.cerrar()">Más tarde</button>
        </div>
      </div>`;
    panel.style.display = 'block';
    console.log('[REPORTE] Lunes sin cargador — aviso silencioso mostrado.');
  },

  // ── Lanzar el flujo completo (ya con cargador confirmado) ──
  _lanzarReporte() {
    ui_melantia.pensar();
    setTimeout(() => {
      ui_melantia.listo();
      this._mostrarPreguntaApertura();
    }, 1500);
  },

  // ── Panel de cortesía: pregunta antes de hablar ──
  _mostrarPreguntaApertura() {
    const panel = document.getElementById('panel-novedades');
    if (!panel) return;

    // Verificar preferencias del usuario
    const prefs = this._leerPrefs();
    const veces = prefs.vecesPostpuesto || 0;

    // Si el usuario ha pospuesto 3 veces o más → ofrecer periódico directamente
    const sugerirTexto = veces >= 3;
    const mensajeExtra = sugerirTexto
      ? '<p class="novedad-n3" style="color:#facc15">He notado que prefieres leer las novedades. ¿Te dejo el periódico de esta semana?</p>'
      : '<p class="novedad-n3">¿Tienes un par de minutos para escucharlo ahora?</p>';

    const botonPrincipal = sugerirTexto
      ? `<button onclick="ReporteLunes.mostrarPeriodico()">📰 Sí, dame el periódico</button>`
      : `<button onclick="ReporteLunes.ejecutarSecuencia()">✅ ¡Claro, cuéntame!</button>`;

    panel.innerHTML = `
      <div class="novedad-card" data-experto="Melantia">
        <p class="novedad-n1">🌿 Hola. He preparado el resumen de novedades.</p>
        <p class="novedad-n2">
          Detecto que estamos conectados a la energía. Es el momento perfecto:
          mientras recupero fuerzas, te daré el resumen de lo que el equipo
          aprendió este fin de semana en el pueblo.
        </p>
        ${mensajeExtra}
        <div class="novedad-acciones">
          ${botonPrincipal}
          <button onclick="ReporteLunes.mostrarPeriodico()">📰 Leer</button>
          <button onclick="ReporteLunes._posponer()">⏳ Más tarde</button>
        </div>
      </div>`;
    panel.style.display = 'block';

    // Frase corta de cortesía — no consume procesador con audio largo
    _voz(
      sugerirTexto
        ? 'He notado que prefieres leer las novedades. Te dejo el periódico de la semana.'
        : 'Hola. He preparado el resumen de novedades con el equipo. ¿Tienes un par de minutos para escucharlo ahora?'
    );
  },

  // ── Posponer: guardar preferencia y mostrar icono discreto ──
  _posponer() {
    const prefs = this._leerPrefs();
    prefs.vecesPostpuesto = (prefs.vecesPostpuesto || 0) + 1;
    prefs.ultimoPostpuesto = new Date().toLocaleDateString('es-EC');
    localStorage.setItem(this._CLAVE_PREFS, JSON.stringify(prefs));
    this.cerrar();
    _voz('Entendido. Estaré lista cuando tengas tiempo.');
    // Mostrar icono flotante de reporte pendiente
    const btn = document.getElementById('btn-reporte-pendiente');
    if (btn) btn.style.display = 'block';
    console.log(
      '[REPORTE] Pospuesto por el usuario. Veces:',
      prefs.vecesPostpuesto
    );
  },

  // ── Periódico de texto — lectura rápida sin audio ──
  mostrarPeriodico() {
    this.cerrar();
    const panel = document.getElementById('panel-novedades');
    if (!panel) return;

    // Construir texto del periódico con los datos de cada experto
    const lineas = Object.entries(this._guiones)
      .map(([nombre, cfg]) => {
        let t = 'Sin novedades esta semana.';
        try {
          t = cfg.texto();
        } catch {}
        return `<p><strong>${nombre}:</strong> ${t}</p>`;
      })
      .join('');

    const salud = this._leerSalud();
    panel.innerHTML = `
      <div class="novedad-card" data-experto="Melantia" style="max-height:70vh;overflow-y:auto">
        <p class="novedad-n1">📰 Periódico Semanal — MELANTIA</p>
        <p style="font-size:0.75em;color:#aaa;margin-bottom:8px">
          ${new Date().toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <hr style="border-color:#333;margin:8px 0">
        ${lineas}
        <hr style="border-color:#333;margin:8px 0">
        <p style="font-size:0.75em;color:#777">
          📦 ${salud.actualizados || 0} archivos actualizados | 🕒 ${salud.fecha || 'N/D'}
        </p>
        <div class="novedad-acciones">
          <button onclick="ReporteLunes.cerrar()">Cerrar</button>
        </div>
      </div>`;
    panel.style.display = 'block';
    // Guardar periódico en localStorage por si quiere releerlo
    localStorage.setItem(
      this._CLAVE_PERIODICO,
      panel.querySelector('.novedad-card').innerHTML
    );
    console.log('[REPORTE] Periódico de texto generado y guardado.');
  },

  // ── Leer preferencias del usuario ──
  _leerPrefs() {
    try {
      return JSON.parse(localStorage.getItem(this._CLAVE_PREFS) || '{}');
    } catch {
      return {};
    }
  },

  // ── Ejecutar carrusel de voces con watchdog ──
  ejecutarSecuencia() {
    this.cerrar(); // Cerrar panel de pregunta
    this._cancelado = false;

    // Cortafuegos global: 15 s máx para todo el carrusel
    this._watchdog = setTimeout(() => {
      if (!this._cancelado) this.forzarCierre();
    }, 15000);

    // Activar robot pensando
    ui_melantia.pensar();

    // Construir secuencia de turnos
    const turnos = Object.entries(this._guiones);
    this._ejecutarTurno(turnos, 0);
  },

  // ── Turno recursivo con timeout por módulo ──
  _ejecutarTurno(turnos, idx) {
    if (this._cancelado) return;
    if (idx >= turnos.length) {
      // Todos los expertos hablaron
      clearTimeout(this._watchdog);
      this._watchdog = null;
      ui_melantia.listo();
      this._mostrarEstadoSalud();
      return;
    }

    const [nombre, cfg] = turnos[idx];

    // Activar color del experto activo
    if (typeof StaffController !== 'undefined') {
      StaffController._aplicarColor(nombre);
    }

    // Timeout de 3 s por módulo — si tarda, salta al siguiente
    const timeoutModulo = setTimeout(() => {
      console.warn(`[REPORTE] ${nombre} tardó más de 3 s — saltando.`);
      speechSynthesis.cancel();
      this._ejecutarTurno(turnos, idx + 1);
    }, 3000);

    // Validación de integridad del texto antes de hablar
    let texto;
    try {
      texto = cfg.texto();
      if (typeof texto !== 'string' || texto.trim().length < 5)
        throw new Error('Texto inválido');
    } catch (e) {
      console.warn(`[REPORTE] Error de integridad en ${nombre}:`, e.message);
      clearTimeout(timeoutModulo);
      this._ejecutarTurno(turnos, idx + 1);
      return;
    }

    // Prefijo con nombre del experto
    const guion = `${nombre} dice: ${texto}`;
    const utt = new SpeechSynthesisUtterance(guion);
    utt.lang = 'es-EC';
    utt.pitch = cfg.pitch;
    utt.rate = cfg.rate;

    utt.onend = () => {
      clearTimeout(timeoutModulo);
      // Pausa térmica entre expertos:
      // Con cargador → 8 s (permite que el procesador respire en clima cálido)
      // Sin cargador → 600 ms (modo normal, ya fue bloqueado antes si no carga)
      const pausaTermica = this._enCarga ? 8000 : 600;
      if (this._enCarga && idx < turnos.length - 1) {
        console.log(
          `[REPORTE] Pausa térmica de ${pausaTermica / 1000}s tras ${nombre}.`
        );
      }
      setTimeout(() => this._ejecutarTurno(turnos, idx + 1), pausaTermica);
    };
    utt.onerror = () => {
      clearTimeout(timeoutModulo);
      this._ejecutarTurno(turnos, idx + 1);
    };

    speechSynthesis.cancel();
    speechSynthesis.speak(utt);

    // Mostrar ficha del experto en el panel durante su turno
    this._mostrarFichaExperto(nombre, texto);
  },

  // ── Ficha visual del experto en turno ──
  _mostrarFichaExperto(nombre, texto) {
    const panel = document.getElementById('panel-novedades');
    if (!panel) return;
    panel.innerHTML = `
      <div class="novedad-card" data-experto="${nombre}">
        <p class="novedad-n1">🎙️ ${nombre}</p>
        <p class="novedad-n2">${texto}</p>
        <p style="font-size:0.75em;color:#aaa;margin-top:8px">
          Reporte del equipo MELANTIA — ${new Date().toLocaleDateString('es-EC')}
        </p>
        <div class="novedad-acciones">
          <button onclick="ReporteLunes.forzarCierre()">Saltar resumen</button>
        </div>
      </div>`;
    panel.style.display = 'block';
  },

  // ── Estado de Salud de la App ──
  _mostrarEstadoSalud() {
    const salud = this._leerSalud();
    const panel = document.getElementById('panel-novedades');
    if (!panel) return;

    const iconoBat =
      salud.bateria >= 80 ? '🟢' : salud.bateria >= 50 ? '🟡' : '🔴';
    const iconoErr = salud.errores === 0 ? '✅' : '⚠️';

    panel.innerHTML = `
      <div class="novedad-card salud-app" data-experto="Melantia">
        <p class="novedad-n1">🌿 Estado de Salud de MELANTIA</p>
        <p class="novedad-n2">
          ${iconoBat} Batería al momento de sincronizar: <strong>${salud.bateria}%</strong><br>
          ${iconoErr} Errores durante la semana: <strong>${salud.errores}</strong><br>
          📦 Archivos actualizados: <strong>${salud.actualizados}</strong><br>
          🕒 Última sincronización: <strong>${salud.fecha}</strong>
        </p>
        <p class="novedad-n3">Todo está en orden. ¡Tu finca tiene un asistente saludable!</p>
        <div class="novedad-acciones">
          <button onclick="ReporteLunes.cerrar()">¡Excelente! Ir a módulos</button>
        </div>
      </div>`;
    panel.style.display = 'block';

    // Melantia cierra el reporte con voz
    if (typeof StaffController !== 'undefined') {
      StaffController._aplicarColor('Melantia');
    }
    _voz(
      `Todo está en orden. Batería al ${salud.bateria} por ciento, ${salud.errores} errores durante la semana. ` +
        `Actualizamos ${salud.actualizados} archivos. ¡Tu finca tiene un asistente saludable!`
    );

    // Limpiar datos del reporte para liberar memoria
    setTimeout(() => this._limpiarDatosReporte(), 5000);
  },

  // ── Cerrar cortafuegos ──
  forzarCierre() {
    this._cancelado = true;
    if (this._watchdog) {
      clearTimeout(this._watchdog);
      this._watchdog = null;
    }
    speechSynthesis.cancel();
    ui_melantia.listo();
    _voz('He terminado de procesar lo más importante por ahora. ¡A trabajar!');
    this.cerrar();
    console.warn('[REPORTE] Watchdog activado o cierre manual.');
  },

  cerrar() {
    const panel = document.getElementById('panel-novedades');
    if (panel) panel.style.display = 'none';
  },

  // ── Guardar datos de salud tras cada sincronización ──
  guardarSalud(actualizados, errores, bateria) {
    const salud = {
      actualizados,
      errores,
      bateria: Math.round(bateria),
      fecha: new Date().toLocaleString('es-EC'),
    };
    localStorage.setItem(this._CLAVE_SALUD, JSON.stringify(salud));
    localStorage.setItem(this._CLAVE_SYNC, new Date().toISOString());
  },

  _leerSalud() {
    try {
      return JSON.parse(localStorage.getItem(this._CLAVE_SALUD) || '{}');
    } catch {
      return {};
    }
  },

  _leerDato(clave) {
    return localStorage.getItem(`melantia_reporte_dato_${clave}`) || null;
  },

  // Guardar una novedad específica de un experto (llamado desde actualizarConocimientos)
  guardarDato(clave, valor) {
    if (typeof valor !== 'string' || valor.length > 300) return; // Validar antes de guardar
    localStorage.setItem(`melantia_reporte_dato_${clave}`, valor);
  },

  // ── Limpieza automática de memoria ──
  _limpiarDatosReporte() {
    const claves = [
      'angel_novedad',
      'fabrizzio_novedad',
      'pablo_novedad',
      'paulette_novedad',
    ];
    claves.forEach((c) =>
      localStorage.removeItem(`melantia_reporte_dato_${c}`)
    );
    console.log('[REPORTE] Datos del reporte anterior liberados de memoria.');
  },
};

// ==============================================
// BUDGET GUARD — Cortafuegos Económico
// Tres zonas: Segura ($0-$10) / Alerta ($10-$15) / Bloqueo ($15)
// Cuota mensual: 50 consultas de conocimiento nuevo.
// Las consultas a módulos locales son ILIMITADAS y gratuitas.
// ==============================================
const BudgetGuard = {
  _CLAVE: 'melantia_budget',
  _LIMITE: {
    alerta: 10.0, // Zona de alerta — solo datos vitales
    tope: 15.0, // Bloqueo total — Soberanía Local Pura
    preguntas_mes: 50, // Máx consultas de conocimiento externo por mes
  },

  // ── Carga stats del mes actual (auto-reset si es mes nuevo) ──
  _cargar() {
    try {
      const raw = JSON.parse(localStorage.getItem(this._CLAVE) || '{}');
      const mesActual = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
      if (raw.mes !== mesActual) {
        // Reset mensual automático
        return { mes: mesActual, gasto: 0.0, preguntas: 0 };
      }
      return raw;
    } catch {
      return {
        mes: new Date().toISOString().slice(0, 7),
        gasto: 0.0,
        preguntas: 0,
      };
    }
  },

  _guardar(stats) {
    localStorage.setItem(this._CLAVE, JSON.stringify(stats));
  },

  // ── Verificar estado antes de cualquier operación de red/pago ──
  // tipo: 'sync' | 'pregunta'
  // Retorna: 'OK' | 'ALERTA' | 'HARD_STOP_ACTIVE' | 'CUOTA_AGOTADA'
  verificar(tipo = 'sync') {
    const s = this._cargar();

    // Cuota de preguntas mensuales
    if (tipo === 'pregunta' && s.preguntas >= this._LIMITE.preguntas_mes) {
      _voz(
        'He alcanzado mi límite de aprendizaje externo por este mes para proteger tu presupuesto y mi estabilidad. ' +
          'Pero no te preocupes: sigo siendo experta en todo lo que ya hemos descargado. ¡Sigamos trabajando con mi cerebro local!'
      );
      console.warn('[BUDGET] Cuota de preguntas agotada.');
      BudgetGuard.mostrarBarra();
      return 'CUOTA_AGOTADA';
    }

    // Bloqueo total de gasto
    if (s.gasto >= this._LIMITE.tope) {
      _voz(
        'He llegado al límite de gasto del mes. Entro en modo Soberanía Local Pura. ' +
          'Solo usaré lo que ya tengo guardado en mi cerebro.'
      );
      console.warn('[BUDGET] HARD STOP activo. Gasto:', s.gasto);
      BudgetGuard.mostrarBarra();
      return 'HARD_STOP_ACTIVE';
    }

    // Zona de alerta
    if (s.gasto >= this._LIMITE.alerta) {
      console.log('[BUDGET] Zona de alerta. Gasto:', s.gasto);
      return 'ALERTA';
    }

    return 'OK';
  },

  // ── Registrar gasto (llamado tras cada sync exitosa) ──
  registrarGasto(monto) {
    const s = this._cargar();
    s.gasto = Math.min(+(s.gasto + monto).toFixed(4), this._LIMITE.tope);
    this._guardar(s);
    console.log(
      `[BUDGET] Gasto registrado: $${monto} | Acumulado: $${s.gasto}`
    );
    this.mostrarBarra();
  },

  // ── Registrar pregunta de conocimiento nuevo ──
  registrarPregunta() {
    const estado = this.verificar('pregunta');
    if (estado !== 'OK' && estado !== 'ALERTA') return false;
    const s = this._cargar();
    s.preguntas++;
    this._guardar(s);
    this.mostrarBarra();
    return true;
  },

  // ── Barra visual de Energía de Consulta ──
  mostrarBarra() {
    const s = this._cargar();
    const barra = document.getElementById('budget-barra');
    const label = document.getElementById('budget-label');
    const wrap = document.getElementById('budget-wrap');
    if (!barra || !label || !wrap) return;

    // Porcentaje de presupuesto consumido (el mayor de gasto vs preguntas)
    const pctGasto = (s.gasto / this._LIMITE.tope) * 100;
    const pctPreguntas = (s.preguntas / this._LIMITE.preguntas_mes) * 100;
    const pct = Math.min(Math.max(pctGasto, pctPreguntas), 100);

    const hue = Math.round((1 - pct / 100) * 120); // verde→rojo
    barra.style.width = `${pct.toFixed(1)}%`;
    barra.style.background = `hsl(${hue},80%,45%)`;

    let zona = '✅ Zona Segura';
    if (
      s.gasto >= this._LIMITE.tope ||
      s.preguntas >= this._LIMITE.preguntas_mes
    ) {
      zona = '🔴 Límite alcanzado';
    } else if (s.gasto >= this._LIMITE.alerta) {
      zona = '⚠️ Zona de Alerta';
    }

    label.textContent = `${zona} — $${s.gasto.toFixed(2)}/$${this._LIMITE.tope} • ${s.preguntas}/${this._LIMITE.preguntas_mes} consultas`;
    wrap.style.display = 'block';
  },

  // ── Desactivar acceso a nube (modo Soberanía Local Pura) ──
  desactivarAPI() {
    console.warn('[BUDGET] API de nube desactivada. Solo modo local.');
    const banner = document.getElementById('status-banner');
    if (banner) {
      banner.innerHTML =
        '🔴 MODO SOBERANÍA LOCAL PURA | Límite de gasto alcanzado';
      banner.style.backgroundColor = '#7f1d1d';
    }
  },

  // ── Info de stats para debug / Reporte de Lunes ──
  stats() {
    return this._cargar();
  },
};

// ==============================================
// TUBERÍA INTELIGENTE — Arquitectura Elástica
// 3 filtros en cascada: Local → Colectivo → Cola
// Costo real: $0 para pasos 1 y 2.
// El paso 3 solo toca la red en el próximo domingo.
// ==============================================
const TuberiaInteligente = {
  _CLAVE_COLA: 'melantia_cola_consultas',
  _CLAVE_ENCICLOPEDIA: 'melantia_enciclopedia',
  _CLAVE_INDICE: 'melantia_indice_local',

  // ── Punto de entrada: cascada de 3 filtros ──
  async procesarConsulta(preguntaUsuario) {
    if (!preguntaUsuario || preguntaUsuario.trim().length < 3) return;
    ui_melantia.pensar();

    // PASO 1: Cerebros locales (RAM baja, Costo $0)
    const local = this.buscarEnCerebrosLocales(preguntaUsuario);
    if (local) {
      ui_melantia.listo();
      return this.mostrarRespuesta(local, 'local');
    }

    // PASO 2: Enciclopedia Colectiva descargada (también $0)
    const colectiva = this.buscarEnHistorialDescargado(preguntaUsuario);
    if (colectiva) {
      ui_melantia.listo();
      return this.mostrarRespuesta(colectiva, 'colectiva');
    }

    // PASO 3: No existe aún → encolar para el próximo domingo
    ui_melantia.listo();
    return this.encolarParaActualizacion(preguntaUsuario);
  },

  // ── Búsqueda en índice local (generado desde knowledge_seeds) ──
  buscarEnCerebrosLocales(pregunta) {
    try {
      const indice = JSON.parse(
        localStorage.getItem(this._CLAVE_INDICE) || '{}'
      );
      const palabras = pregunta
        .toLowerCase()
        .split(/\s+/)
        .filter((p) => p.length > 3);
      if (palabras.length === 0) return null;

      let mejor = null;
      let maxCoincidencias = 0;
      for (const [termino, dato] of Object.entries(indice)) {
        const coincidencias = palabras.filter(
          (p) => termino.includes(p) || p.includes(termino)
        ).length;
        if (coincidencias > maxCoincidencias) {
          maxCoincidencias = coincidencias;
          mejor = dato;
        }
      }
      return maxCoincidencias > 0 ? mejor : null;
    } catch {
      return null;
    }
  },

  // ── Búsqueda en enciclopedia colectiva descargada ──
  buscarEnHistorialDescargado(pregunta) {
    try {
      const enc = JSON.parse(
        localStorage.getItem(this._CLAVE_ENCICLOPEDIA) || '[]'
      );
      const palabras = pregunta
        .toLowerCase()
        .split(/\s+/)
        .filter((p) => p.length > 3);
      if (palabras.length === 0 || enc.length === 0) return null;

      let mejor = null;
      let maxScore = 0;
      for (const entrada of enc) {
        if (!entrada.pregunta || !entrada.respuesta) continue;
        const score = palabras.filter(
          (p) =>
            entrada.pregunta.toLowerCase().includes(p) ||
            (entrada.tags || []).some((t) => t.includes(p))
        ).length;
        if (score > maxScore) {
          maxScore = score;
          mejor = entrada.respuesta;
        }
      }
      return maxScore > 0 ? mejor : null;
    } catch {
      return null;
    }
  },

  // ── Encolar consulta para próxima sincronización ──
  encolarParaActualizacion(pregunta) {
    try {
      const cola = JSON.parse(localStorage.getItem(this._CLAVE_COLA) || '[]');
      const yaExiste = cola.some((q) => q.texto === pregunta);
      if (!yaExiste) {
        cola.push({
          texto: pregunta,
          ts: new Date().toISOString(),
          estado: 'pendiente',
        });
        if (cola.length > 20) cola.shift(); // Máx 20 en cola
        localStorage.setItem(this._CLAVE_COLA, JSON.stringify(cola));
      }
    } catch {}
    _voz(
      'He enviado tu consulta al panel de expertos. Gracias a ti, los otros productores también aprenderán la respuesta este lunes.'
    );
    const panel = document.getElementById('panel-novedades');
    if (!panel) return;
    panel.innerHTML = `
      <div class="novedad-card" data-experto="Melantia">
        <p class="novedad-n1">📬 Consulta registrada</p>
        <p class="novedad-n2">He anotado tu pregunta: <em>"${pregunta.slice(0, 80)}"</em></p>
        <p class="novedad-n3">
          Gracias a ti, los otros productores también aprenderán la respuesta este lunes.
          Mientras tanto, sigo trabajando con todo lo que ya tengo en mi cerebro local.
        </p>
        <div class="novedad-acciones">
          <button onclick="document.getElementById('panel-novedades').style.display='none'">Entendido</button>
        </div>
      </div>`;
    panel.style.display = 'block';
  },

  // ── Mostrar respuesta con badge de fuente ──
  mostrarRespuesta(texto, fuente) {
    const meta = {
      local: { icono: '🧠', etiqueta: 'Mi cerebro local' },
      colectiva: { icono: '🌿', etiqueta: 'Experiencias de la comunidad' },
    };
    const { icono, etiqueta } = meta[fuente] || {
      icono: '📚',
      etiqueta: 'Base de conocimiento',
    };
    _voz(texto.slice(0, 200));
    const panel = document.getElementById('panel-novedades');
    if (!panel) return;
    panel.innerHTML = `
      <div class="novedad-card" data-experto="Melantia">
        <p class="novedad-n1">${icono} ${etiqueta}</p>
        <p class="novedad-n2">${texto.slice(0, 300)}</p>
        <div class="novedad-acciones">
          <button onclick="document.getElementById('panel-novedades').style.display='none'">Continuar</button>
        </div>
      </div>`;
    panel.style.display = 'block';
  },

  // ── Indexar datos locales (llamado tras cada delta aplicado) ──
  indexarLocal(datos = {}) {
    try {
      const indice = JSON.parse(
        localStorage.getItem(this._CLAVE_INDICE) || '{}'
      );
      let nuevas = 0;
      for (const [clave, valor] of Object.entries(datos)) {
        if (typeof valor === 'string' && valor.length > 5) {
          indice[clave.toLowerCase()] = valor.slice(0, 150);
          nuevas++;
        }
      }
      localStorage.setItem(this._CLAVE_INDICE, JSON.stringify(indice));
      if (nuevas > 0)
        console.log(`[TUBERIA] ${nuevas} entradas indexadas localmente.`);
    } catch (e) {
      console.warn('[TUBERIA] Error al indexar:', e.message);
    }
  },

  // ── Absorber respuestas colectivas que llegan en el delta ──
  absorberEnciclopedia(entradas = []) {
    try {
      const enc = JSON.parse(
        localStorage.getItem(this._CLAVE_ENCICLOPEDIA) || '[]'
      );
      const nuevas = entradas.filter(
        (e) =>
          e.pregunta &&
          e.respuesta &&
          !enc.find((x) => x.pregunta === e.pregunta)
      );
      const combinado = [...enc, ...nuevas].slice(-100); // Máx 100 entradas
      localStorage.setItem(this._CLAVE_ENCICLOPEDIA, JSON.stringify(combinado));
      if (nuevas.length > 0)
        console.log(
          `[TUBERIA] ${nuevas.length} respuestas colectivas absorbidas.`
        );
    } catch (e) {
      console.warn('[TUBERIA] Error al absorber enciclopedia:', e.message);
    }
  },

  // ── Exportar cola para el servidor en próximo ciclo de sync ──
  exportarCola() {
    try {
      return JSON.parse(localStorage.getItem(this._CLAVE_COLA) || '[]');
    } catch {
      return [];
    }
  },

  limpiarCola() {
    localStorage.removeItem(this._CLAVE_COLA);
    console.log('[TUBERIA] Cola de consultas procesada y liberada.');
  },
};

// ==============================================
// SINCRONIZACIÓN DIFERENCIAL — Delta Updates
// El celular solo descarga lo que NO tiene.
// Si ya tiene la versión, protege batería y datos.
// ==============================================
const SincronizacionDelta = {
  _CLAVE_VERSION: 'melantia_version_cerebro',
  _URL_DELTA: './src/knowledge_seeds/update.json',

  versionLocal() {
    return localStorage.getItem(this._CLAVE_VERSION) || '1.0.0';
  },

  // ── Verificar servidor y aplicar solo si hay versión nueva ──
  async verificarDelta() {
    if (!navigator.onLine) return { aplicado: false, motivo: 'SIN_RED' };
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const resp = await fetch(this._URL_DELTA, {
        signal: ctrl.signal,
        headers: { 'Accept-Encoding': 'gzip, deflate, br' },
      });
      clearTimeout(timer);
      if (!resp.ok) return { aplicado: false, motivo: 'SIN_DELTA' };
      const delta = await resp.json();

      if (!delta.version_cerebro || !delta.cambios)
        return { aplicado: false, motivo: 'DELTA_INVALIDO' };

      // Misma versión → sin cambios → proteger batería
      if (delta.version_cerebro === this.versionLocal()) {
        console.log(
          `[DELTA] Versión ${delta.version_cerebro} ya instalada. Sin cambios.`
        );
        return {
          aplicado: false,
          motivo: 'YA_ACTUALIZADO',
          version: delta.version_cerebro,
        };
      }

      return this.aplicarDelta(delta);
    } catch (err) {
      console.warn('[DELTA] No se pudo verificar el delta:', err.message);
      return { aplicado: false, motivo: 'ERROR' };
    }
  },

  // ── Aplicar solo los módulos que cambiaron ──
  async aplicarDelta(delta) {
    const cambios = delta.cambios || {};
    let aplicados = 0;
    const datosParaIndice = {};

    for (const [modulo, dato] of Object.entries(cambios)) {
      try {
        if (dato.nuevo_dato) {
          localStorage.setItem(
            `melantia_delta_${modulo}`,
            JSON.stringify({
              modulo,
              dato: dato.nuevo_dato,
              id: dato.id || modulo,
              ts: new Date().toISOString(),
              prioridad: delta.prioridad || 'Normal',
            })
          );
          datosParaIndice[modulo] = dato.nuevo_dato;
          aplicados++;
        }
        if (dato.precio_hoy !== undefined) {
          localStorage.setItem(
            `melantia_precio_${modulo}`,
            String(dato.precio_hoy)
          );
          datosParaIndice[`precio_${modulo}`] =
            `Precio hoy: ${dato.precio_hoy}`;
          aplicados++;
        }
      } catch (e) {
        console.warn(`[DELTA] Error en módulo ${modulo}:`, e.message);
      }
    }

    // Guardar nueva versión local
    localStorage.setItem(this._CLAVE_VERSION, delta.version_cerebro);

    // Indexar para búsqueda local futura
    if (aplicados > 0) TuberiaInteligente.indexarLocal(datosParaIndice);

    // Absorber enciclopedia colectiva si viene en el paquete
    if (Array.isArray(delta.enciclopedia_colectiva))
      TuberiaInteligente.absorberEnciclopedia(delta.enciclopedia_colectiva);

    // Limpiar cola si el servidor ya procesó las consultas
    if (delta.consultas_resueltas) TuberiaInteligente.limpiarCola();

    _voz(
      'Sincronizando conocimientos de la comunidad... He optimizado mi base de datos para que siga volando en tu equipo.'
    );
    console.log(
      `[DELTA] ${aplicados} cambios aplicados. Nueva versión: ${delta.version_cerebro} | Prioridad: ${delta.prioridad || 'Normal'}`
    );
    return {
      aplicado: true,
      aplicados,
      version: delta.version_cerebro,
      prioridad: delta.prioridad || 'Normal',
    };
  },
};

// ==============================================
// GPS MEDIDOR DE ÁREAS — Precisión de Campo
// Calcula hectáreas a partir de vértices GPS.
// Convierte a UTM zona 17S (Ecuador).
// Funciona 100% offline, sin mapas externos.
// ==============================================
const GpsMedidor = {
  _puntos: [], // [{ lat, lon, utmX, utmY }]
  _canvas: null,
  _ctx: null,

  async _persistirMapaLigero() {
    if (
      !this._puntos.length ||
      typeof window.guardarMapaGpsLigeroMelantia !== 'function'
    ) {
      return null;
    }

    const ahora = new Date();
    const { ha, m2 } = this._calcularArea();
    const perimetro = this._calcularPerimetro();
    const idLote = window._melantia_session?.loteActivo ?? null;

    try {
      return await window.guardarMapaGpsLigeroMelantia({
        idLote,
        nombre: `lote_${idLote || 'general'}_${ahora.toISOString().slice(0, 19).replace(/[T:]/g, '-')}`,
        puntos: this._puntos.map((p, index) => ({
          orden: index + 1,
          lat: p.lat,
          lon: p.lon,
          utmX: p.utmX,
          utmY: p.utmY,
          precision_m: p.acc,
        })),
        meta: {
          total_puntos: this._puntos.length,
          area_ha: ha,
          area_m2: m2,
          perimetro_m: perimetro,
          guardado_desde: 'GpsMedidor.cerrar',
          fecha_iso: ahora.toISOString(),
        },
      });
    } catch (error) {
      console.warn('[GPS] No se pudo guardar el mapa ligero:', error);
      return null;
    }
  },

  // ── Abrir panel ──
  abrir() {
    const panel = document.getElementById('panel-gps');
    if (!panel) return;
    panel.style.display = 'flex';
    this._canvas = document.getElementById('gps-canvas');
    this._ctx = this._canvas ? this._canvas.getContext('2d') : null;
    this._dibujar();
    _voz(
      'Medidor de hectáreas activo. Toca el botón Punto GPS para marcar cada vértice del terreno.'
    );
  },

  // ── Cerrar panel ──
  async cerrar() {
    await this._persistirMapaLigero();
    const panel = document.getElementById('panel-gps');
    if (panel) panel.style.display = 'none';
  },

  // ── Agregar punto desde GPS real del dispositivo ──
  agregarPuntoGPS() {
    if (!('geolocation' in navigator)) {
      _voz('Tu dispositivo no tiene GPS disponible.');
      return;
    }
    ui_melantia.pensar();
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        ui_melantia.listo();
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const utm = this._latLonToUTM(lat, lon);
        this._puntos.push({
          lat,
          lon,
          utmX: utm.x,
          utmY: utm.y,
          acc: Math.round(pos.coords.accuracy),
        });
        this._actualizarUI();
        _voz(
          `Punto ${this._puntos.length} registrado. Precisión: ${Math.round(pos.coords.accuracy)} metros.`
        );
      },
      (err) => {
        ui_melantia.listo();
        _voz(
          'No pude obtener la posición GPS. Verifica los permisos de ubicación.'
        );
        console.warn('[GPS] Error:', err.message);
      },
      { timeout: 10000, maximumAge: 0, enableHighAccuracy: true }
    );
  },

  // ── Deshacer último punto ──
  deshacer() {
    if (this._puntos.length === 0) return;
    this._puntos.pop();
    this._actualizarUI();
    _voz(`Punto eliminado. Quedan ${this._puntos.length} vértices.`);
  },

  // ── Cerrar polígono y calcular ──
  cerrarPoligono() {
    if (this._puntos.length < 3) {
      _voz('Necesito al menos tres puntos para calcular el área.');
      return;
    }
    this._actualizarUI();
    const { ha, m2 } = this._calcularArea();
    _voz(
      `Tu terreno tiene ${ha.toFixed(4)} hectáreas, equivalentes a ${Math.round(m2)} metros cuadrados.`
    );
  },

  // ── Limpiar todo ──
  limpiar() {
    this._puntos = [];
    this._actualizarUI();
    _voz('Medición reiniciada.');
  },

  // ── Actualizar resultados y canvas ──
  _actualizarUI() {
    // Vértices
    const nEl = document.getElementById('gps-nPuntos');
    if (nEl) nEl.textContent = this._puntos.length;

    // UTM del último punto
    const utmEl = document.getElementById('gps-utm');
    if (utmEl && this._puntos.length > 0) {
      const p = this._puntos[this._puntos.length - 1];
      utmEl.textContent = `17S  E ${Math.round(p.utmX)}  N ${Math.round(p.utmY)}`;
    } else if (utmEl) {
      utmEl.textContent = 'esperando GPS…';
    }

    // Área y perímetro
    if (this._puntos.length >= 3) {
      const { ha, m2 } = this._calcularArea();
      const haEl = document.getElementById('gps-area-ha');
      const m2El = document.getElementById('gps-area-m2');
      const perEl = document.getElementById('gps-perimetro');
      if (haEl) haEl.textContent = `${ha.toFixed(4)} ha`;
      if (m2El) m2El.textContent = `${Math.round(m2)} m²`;
      if (perEl)
        perEl.textContent = `${this._calcularPerimetro().toFixed(1)} m`;
    }

    // Lista de puntos
    this._renderLista();
    // Dibujar en canvas
    this._dibujar();
  },

  // ── Render lista de puntos ──
  _renderLista() {
    const lista = document.getElementById('gps-puntos-lista');
    if (!lista) return;
    lista.innerHTML = this._puntos
      .map(
        (p, i) => `
      <div class="gps-punto">
        <span>P${i + 1} — 17S E${Math.round(p.utmX)} N${Math.round(p.utmY)} (±${p.acc}m)</span>
        <button onclick="GpsMedidor._eliminarPunto(${i})" title="Eliminar">✕</button>
      </div>`
      )
      .join('');
  },

  _eliminarPunto(idx) {
    this._puntos.splice(idx, 1);
    this._actualizarUI();
  },

  // ── Dibujar polígono en canvas ──
  _dibujar() {
    if (!this._ctx || !this._canvas) return;
    const ctx = this._ctx;
    const W = this._canvas.width;
    const H = this._canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Fondo
    ctx.fillStyle = '#0d1f0d';
    ctx.fillRect(0, 0, W, H);

    if (this._puntos.length === 0) {
      ctx.fillStyle = '#276749';
      ctx.font = '13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        'Toca "Punto GPS" para marcar el primer vértice',
        W / 2,
        H / 2
      );
      return;
    }

    // Normalizar coordenadas UTM al canvas
    const xs = this._puntos.map((p) => p.utmX);
    const ys = this._puntos.map((p) => p.utmY);
    const minX = Math.min(...xs),
      maxX = Math.max(...xs);
    const minY = Math.min(...ys),
      maxY = Math.max(...ys);
    const pad = 30;

    const scaleX = maxX - minX < 1 ? 1 : (W - pad * 2) / (maxX - minX);
    const scaleY = maxY - minY < 1 ? 1 : (H - pad * 2) / (maxY - minY);
    const sc = Math.min(scaleX, scaleY);

    const toCanvas = (p) => ({
      x: pad + (p.utmX - minX) * sc,
      y: H - pad - (p.utmY - minY) * sc,
    });

    const pts = this._puntos.map(toCanvas);

    // Relleno del polígono
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.fillStyle = 'rgba(39,103,73,0.35)';
    ctx.fill();

    // Borde
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Puntos vértice
    pts.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#4ade80';
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`P${i + 1}`, p.x, p.y - 10);
    });

    // Área en canvas si hay 3+ puntos
    if (this._puntos.length >= 3) {
      const { ha } = this._calcularArea();
      ctx.fillStyle = '#a7f3d0';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${ha.toFixed(4)} ha`, W / 2, 20);
    }
  },

  // ── Cálculo de área — Fórmula de Shoelace sobre coordenadas UTM ──
  // Usa UTM (metros) para precisión real en campo.
  _calcularArea() {
    const pts = this._puntos;
    const n = pts.length;
    if (n < 3) return { ha: 0, m2: 0 };

    let suma = 0;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      suma += pts[i].utmX * pts[j].utmY;
      suma -= pts[j].utmX * pts[i].utmY;
    }
    const m2 = Math.abs(suma) / 2;
    const ha = m2 / 10000;
    return { ha, m2 };
  },

  // ── Conversión WGS84 → UTM Zona 17S (Ecuador) ──
  // Implementación de la proyección Transversal de Mercator.
  // Sin dependencias externas — 100% offline.
  _latLonToUTM(lat, lon) {
    const a = 6378137.0; // semieje mayor WGS84
    const f = 1 / 298.257223563; // achatamiento WGS84
    const k0 = 0.9996; // factor de escala UTM
    const E0 = 500000.0; // falso este
    const N0 = lat < 0 ? 10000000.0 : 0.0; // falso norte hemisferio sur

    const lon0 = ((-81 + (17 - 1) * 6) * Math.PI) / 180; // meridiano central zona 17

    const latR = (lat * Math.PI) / 180;
    const lonR = (lon * Math.PI) / 180;

    const e2 = 2 * f - f * f;
    const e = Math.sqrt(e2);
    const n = f / (2 - f);

    const nu = a / Math.sqrt(1 - e2 * Math.sin(latR) ** 2);
    const p = lonR - lon0;

    const A0 = 1 - e2 / 4 - (3 * e2 ** 2) / 64 - (5 * e2 ** 3) / 256;
    const A2 = (3 / 8) * (e2 + e2 ** 2 / 4 + (15 * e2 ** 3) / 128);
    const A4 = (15 / 256) * (e2 ** 2 + (3 * e2 ** 3) / 4);
    const A6 = (35 * e2 ** 3) / 3072;

    const M =
      a *
      (A0 * latR -
        A2 * Math.sin(2 * latR) +
        A4 * Math.sin(4 * latR) -
        A6 * Math.sin(6 * latR));

    const T = Math.tan(latR) ** 2;
    const C = (e2 / (1 - e2)) * Math.cos(latR) ** 2;
    const pC = Math.cos(latR) * p;

    const easting =
      k0 *
        nu *
        (pC +
          ((1 - T + C) * pC ** 3) / 6 +
          ((5 - 18 * T + T ** 2 + 72 * C - (58 * e2) / (1 - e2)) * pC ** 5) /
            120) +
      E0;

    const northing =
      k0 *
        (M +
          nu *
            Math.tan(latR) *
            (pC ** 2 / 2 +
              ((5 - T + 9 * C + 4 * C ** 2) * pC ** 4) / 24 +
              ((61 - 58 * T + T ** 2 + 600 * C - (330 * e2) / (1 - e2)) *
                pC ** 6) /
                720)) +
      N0;

    return { x: easting, y: northing };
  },

  // ── Perímetro total del polígono (metros) ──
  _calcularPerimetro() {
    const pts = this._puntos;
    if (pts.length < 2) return 0;
    let total = 0;
    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length;
      const dx = pts[j].utmX - pts[i].utmX;
      const dy = pts[j].utmY - pts[i].utmY;
      total += Math.sqrt(dx * dx + dy * dy);
    }
    return total;
  },

  // ── Azimut en grados entre dos puntos UTM (0°=Norte, sentido horario) ──
  _calcularAzimut(p1, p2) {
    const dx = p2.utmX - p1.utmX;
    const dy = p2.utmY - p1.utmY;
    let az = Math.atan2(dx, dy) * (180 / Math.PI);
    if (az < 0) az += 360;
    return az;
  },

  // ── Exportar reporte como PDF A4 ──
  // Abre ventana de impresión del navegador con formato A4.
  // El productor elige "Guardar como PDF" y la carpeta (Documentos).
  exportarPDF() {
    if (this._puntos.length < 3) {
      _voz('Necesito al menos tres vértices para generar el reporte.');
      return;
    }
    const canvas = document.getElementById('gps-canvas');
    const imgData = canvas ? canvas.toDataURL('image/png', 1.0) : '';
    const { ha, m2 } = this._calcularArea();
    const perimetro = this._calcularPerimetro();
    const fecha = new Date().toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
    const hora = new Date().toLocaleTimeString('es-EC');

    const filasCoordenadas = this._puntos
      .map(
        (p, i) => `
      <tr>
        <td><strong>P${i + 1}</strong></td>
        <td>${Math.round(p.utmX)}</td>
        <td>${Math.round(p.utmY)}</td>
        <td>${p.lat.toFixed(7)}°</td>
        <td>${p.lon.toFixed(7)}°</td>
        <td>±${p.acc} m</td>
      </tr>`
      )
      .join('');

    const filasDistancias = this._puntos
      .map((p, i) => {
        if (i === 0) return '';
        const prev = this._puntos[i - 1];
        const dx = p.utmX - prev.utmX;
        const dy = p.utmY - prev.utmY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const az = this._calcularAzimut(prev, p);
        return `<tr><td>P${i}→P${i + 1}</td><td>${dist.toFixed(2)} m</td><td>${az.toFixed(1)}°</td></tr>`;
      })
      .join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Levantamiento Topográfico — MELANTIA</title>
  <style>
    @page { size: A4 portrait; margin: 18mm 20mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; }
    .cabecera { display: flex; align-items: flex-start; border-bottom: 3px solid #276749; padding-bottom: 10px; margin-bottom: 14px; }
    .logo-bloque { flex: 1; }
    .logo-bloque h1 { font-size: 24px; color: #276749; letter-spacing: 3px; font-weight: 900; }
    .logo-bloque .subtitulo { font-size: 8.5px; color: #555; margin-top: 2px; }
    .logo-bloque .doc-titulo { font-size: 12px; font-weight: bold; margin-top: 6px; color: #1a1a1a; text-transform: uppercase; letter-spacing: 1px; }
    .meta-bloque { text-align: right; font-size: 9px; color: #555; line-height: 1.6; }
    .meta-bloque strong { color: #1a1a1a; }
    .resumen { display: flex; gap: 10px; margin-bottom: 14px; }
    .r-item { flex: 1; background: #f1faf4; border: 1px solid #c3e6cb; border-radius: 6px; padding: 8px 6px; text-align: center; }
    .r-val { font-size: 16px; font-weight: bold; color: #276749; }
    .r-lbl { font-size: 8.5px; color: #555; margin-top: 2px; }
    h2 { font-size: 11px; font-weight: bold; color: #276749; background: #f1faf4;
         border-left: 4px solid #276749; padding: 4px 8px; margin: 14px 0 6px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 10px; }
    th { background: #276749; color: #fff; padding: 5px 6px; text-align: center; }
    td { padding: 4px 6px; border-bottom: 1px solid #e8f5e9; text-align: center; }
    tr:nth-child(even) td { background: #f9fef9; }
    .mapa { width: 100%; border: 1px solid #c3e6cb; border-radius: 6px; display: block; margin-bottom: 14px; }
    .pie { margin-top: 16px; border-top: 1px solid #c3e6cb; padding-top: 8px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 8.5px; color: #888; }
    .sello { border: 2px solid #276749; border-radius: 50%; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 7px; color: #276749; font-weight: bold; line-height: 1.3; }
  </style>
</head>
<body>
  <div class="cabecera">
    <div class="logo-bloque">
      <h1>MELANTIA</h1>
      <div class="subtitulo">Sistema de Asistencia Agrícola Inteligente Offline</div>
      <div class="doc-titulo">Reporte de Levantamiento Topográfico</div>
    </div>
    <div class="meta-bloque">
      <div>Fecha: <strong>${fecha}</strong></div>
      <div>Hora: <strong>${hora}</strong></div>
      <div>Datum: <strong>WGS84 / UTM Zona 17S</strong></div>
      <div>Generado en dispositivo (offline)</div>
    </div>
  </div>

  <div class="resumen">
    <div class="r-item"><div class="r-val">${ha.toFixed(4)}</div><div class="r-lbl">Hectáreas</div></div>
    <div class="r-item"><div class="r-val">${Math.round(m2).toLocaleString()}</div><div class="r-lbl">m² de área</div></div>
    <div class="r-item"><div class="r-val">${perimetro.toFixed(1)}</div><div class="r-lbl">m de perímetro</div></div>
    <div class="r-item"><div class="r-val">${this._puntos.length}</div><div class="r-lbl">Vértices</div></div>
  </div>

  ${imgData ? `<h2>🗺️ Croquis del Polígono (UTM)</h2><img src="${imgData}" class="mapa" alt="Polígono">` : ''}

  <h2>📍 Coordenadas de Vértices</h2>
  <table>
    <thead>
      <tr>
        <th>Vértice</th>
        <th>UTM Este (m)</th>
        <th>UTM Norte (m)</th>
        <th>Latitud</th>
        <th>Longitud</th>
        <th>Precisión GPS</th>
      </tr>
    </thead>
    <tbody>${filasCoordenadas}</tbody>
  </table>

  ${
    filasDistancias
      ? `
  <h2>📏 Distancias y Azimuts por Tramo</h2>
  <table>
    <thead><tr><th>Tramo</th><th>Distancia</th><th>Azimut (N)</th></tr></thead>
    <tbody>${filasDistancias}</tbody>
  </table>`
      : ''
  }

  <div class="pie">
    <div>
      <div>Generado con MELANTIA — Productividad Agrícola Inteligente Offline</div>
      <div>Cálculo local en dispositivo • Sin conexión a internet • WGS84 / UTM Zona 17S Ecuador</div>
    </div>
    <div class="sello">MELANTIA<br>CAMPO<br>✓ OFFLINE</div>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=820,height=1160');
    if (!win) {
      _voz('Permite las ventanas emergentes para generar el PDF.');
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 700);
    _voz(
      'Reporte listo. En el diálogo elige Guardar como PDF y selecciona la carpeta Documentos.'
    );
  },

  // ── Compartir reporte vía Web Share API o copiar al portapapeles ──
  compartirReporte() {
    if (this._puntos.length === 0) {
      _voz('No hay puntos registrados aún.');
      return;
    }
    const { ha, m2 } = this._calcularArea();
    const perimetro = this._calcularPerimetro();
    const fecha = new Date().toLocaleDateString('es-EC');

    let texto = `📐 LEVANTAMIENTO TOPOGRÁFICO — MELANTIA\n`;
    texto += `Fecha: ${fecha}\n`;
    texto += `━━━━━━━━━━━━━━━━━━━━\n`;
    if (this._puntos.length >= 3) {
      texto += `🌍 Área: ${ha.toFixed(4)} ha (${Math.round(m2)} m²)\n`;
      texto += `📏 Perímetro: ${perimetro.toFixed(1)} m\n`;
    }
    texto += `🔵 Vértices: ${this._puntos.length}\n`;
    texto += `━━━━━━━━━━━━━━━━━━━━\n`;
    texto += `COORDENADAS UTM Zona 17S (WGS84)\n`;
    this._puntos.forEach((p, i) => {
      const az =
        i > 0
          ? ` | Az: ${this._calcularAzimut(this._puntos[i - 1], p).toFixed(1)}°`
          : '';
      texto += `P${i + 1}: E ${Math.round(p.utmX)}  N ${Math.round(p.utmY)}  (±${p.acc}m)${az}\n`;
    });
    texto += `━━━━━━━━━━━━━━━━━━━━\n`;
    texto += `Generado con MELANTIA — Funciona sin internet`;

    if (navigator.share) {
      navigator
        .share({
          title: 'Levantamiento Topográfico — MELANTIA',
          text: texto,
        })
        .catch(() => this._copiarAlPortapapeles(texto));
    } else {
      this._copiarAlPortapapeles(texto);
    }
  },

  _copiarAlPortapapeles(texto) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(texto)
        .then(() =>
          _voz(
            'Reporte copiado. Pégalo en WhatsApp, correo o tus notas de campo.'
          )
        )
        .catch(() =>
          _voz(
            'No se pudo copiar automáticamente. Usa el botón compartir de tu teléfono.'
          )
        );
    } else {
      _voz('Usa el botón compartir del sistema para enviar el reporte.');
    }
  },
};
// ── Fin de GpsMedidor ──
