(function () {
  'use strict';

  const STAFF_MELANTIA = {
    personajes: {
      fabrizzio: {
        id: 'fabrizzio',
        nombre: 'Fabrizzio',
        voz: 'Fabrizzio',
        color: '#2ecc71',
        modulo: 'Rural',
        prioridad: 'alta',
        pitch: 0.88,
        rate: 0.92,
        saludo:
          'Hola, soy Fabrizzio. Vamos a trabajar el lote con criterio técnico y evidencia.',
      },
      drjorge: {
        id: 'drjorge',
        nombre: 'Dr. Jorge',
        voz: 'Dr. Jorge',
        color: '#1f8a70',
        modulo: 'Asistente Técnico Veterinario',
        prioridad: 'alta',
        pitch: 0.9,
        rate: 0.93,
        saludo:
          'Hola, soy el doctor Jorge. Revisemos el estado técnico del animal y su evidencia sanitaria.',
      },
      valentina: {
        id: 'valentina',
        nombre: 'Valentina',
        voz: 'Valentina',
        color: '#9b59b6',
        modulo: 'Servicios Vet',
        prioridad: 'media',
        pitch: 1.08,
        rate: 0.98,
        saludo:
          'Hola, soy Valentina. Revisemos el servicio veterinario que necesitas hoy.',
      },
      angel: {
        id: 'angel',
        nombre: 'Angel',
        voz: 'Angel',
        color: '#f39c12',
        modulo: 'Comercio',
        prioridad: 'media',
        pitch: 1.04,
        rate: 1,
        saludo:
          'Hola, soy Angel. Revisemos precios, compras y oportunidades de mercado.',
      },
      melantia: {
        id: 'melantia',
        nombre: 'Melantia',
        voz: 'Melantia',
        color: '#40e0d0',
        modulo: 'Sostenibilidad',
        prioridad: 'alta',
        pitch: 1.02,
        rate: 0.95,
        saludo:
          'Hola, soy Melantia. Estoy aquí para cuidar la sostenibilidad y la memoria de tu tierra.',
      },
      pablo: {
        id: 'pablo',
        nombre: 'Dr. Pablo',
        voz: 'Dr. Pablo',
        color: '#34495e',
        modulo: 'Legal',
        prioridad: 'baja',
        pitch: 0.9,
        rate: 0.88,
        saludo:
          'Hola, soy el doctor Pablo. Revisemos la parte jurídica con calma y orden.',
      },
      paulette: {
        id: 'paulette',
        nombre: 'Paulette',
        voz: 'Paulette',
        color: '#ffb6c1',
        modulo: 'Salud Rural',
        prioridad: 'alta',
        pitch: 1.14,
        rate: 1,
        saludo: 'Soy Paulette. Estoy aquí para cuidar de ti y de los tuyos.',
      },
    },
  };

  const ALIAS_PERSONAJES = {
    fabrizzio: 'fabrizzio',
    'dr jorge': 'drjorge',
    'dr. jorge': 'drjorge',
    jorge: 'drjorge',
    drjorge: 'drjorge',
    valentina: 'valentina',
    angel: 'angel',
    melantia: 'melantia',
    pablo: 'pablo',
    'dr pablo': 'pablo',
    'dr. pablo': 'pablo',
    paulette: 'paulette',
  };

  const FICHAS_PAULETTE = [
    {
      id: 'hidratacion_jornada',
      titulo: 'Hidratación en jornada de campo',
      resumen:
        'Tomar agua antes de sentir sed reduce fatiga, dolor de cabeza y errores en labores agrícolas.',
      accion:
        'Cargar una botella, beber cada 20 a 30 minutos y protegerse del sol del mediodía.',
    },
    {
      id: 'golpe_calor',
      titulo: 'Señales de golpe de calor',
      resumen:
        'Mareo, piel muy caliente, debilidad y confusión son señales de alarma en climas fuertes.',
      accion:
        'Llevar a la sombra, aflojar ropa, enfriar con paños húmedos y buscar atención si no mejora rápido.',
    },
    {
      id: 'cortes_heridas',
      titulo: 'Cortes y heridas leves',
      resumen:
        'Una herida mal lavada en finca puede infectarse rápido por barro, estiércol o herramientas.',
      accion:
        'Lavar con agua limpia y jabón, cubrir con gasa y vigilar enrojecimiento o pus.',
    },
    {
      id: 'picaduras',
      titulo: 'Picaduras e insectos',
      resumen:
        'Las picaduras repetidas reducen rendimiento y en algunas personas pueden provocar reacciones fuertes.',
      accion:
        'Retirar aguijón si existe, lavar, aplicar compresa fría y vigilar hinchazón o dificultad para respirar.',
    },
    {
      id: 'botiquin_basico',
      titulo: 'Botiquín básico rural',
      resumen:
        'Un botiquín liviano evita perder tiempo crítico cuando sucede un accidente en la parcela o galpón.',
      accion:
        'Mantener gasas, vendas, jabón, tijera, suero oral, repelente y termómetro en un lugar seco.',
    },
    {
      id: 'dengue_prevencion',
      titulo: 'Prevención de dengue',
      resumen:
        'El dengue sube donde hay agua limpia estancada cerca de casa, tanque o canaletas.',
      accion:
        'Vaciar recipientes, tapar tanques, limpiar canaletas y usar repelente al amanecer y atardecer.',
    },
    {
      id: 'malaria_prevencion',
      titulo: 'Prevención de malaria',
      resumen:
        'En zonas cálidas y húmedas, las picaduras nocturnas aumentan riesgo de malaria.',
      accion:
        'Dormir con mosquitero, usar manga larga en la noche y consultar rápido ante fiebre y escalofríos.',
    },
    {
      id: 'dolor_espalda',
      titulo: 'Cuidado de espalda y carga',
      resumen:
        'Levantar peso mal reduce productividad y causa lesiones que se vuelven crónicas.',
      accion:
        'Doblar rodillas, acercar la carga al cuerpo y alternar hombros o herramientas.',
    },
    {
      id: 'rehidratacion_oral',
      titulo: 'Rehidratación oral',
      resumen:
        'Diarrea y calor intenso sacan agua y sales del cuerpo con rapidez.',
      accion:
        'Usar suero oral listo o mezcla segura con agua limpia y consultar si hay debilidad severa.',
    },
    {
      id: 'descanso_familiar',
      titulo: 'Descanso y bienestar familiar',
      resumen:
        'Una finca sana depende también de sueño, alimentación y descanso de la familia.',
      accion:
        'Reservar horas de descanso, revisar sueño de niños y adultos y mantener comida segura e hidratación.',
    },
  ];

  const GUIA_MELANTIA = [
    {
      titulo: 'Expediente agronómico',
      texto:
        'Cada foto, entrevista y recomendación construye la memoria técnica del lote y reduce decisiones a ciegas.',
    },
    {
      titulo: 'Certificado de sostenibilidad',
      texto:
        'Al registrar esta foto, estamos creando el certificado de sostenibilidad de tu tierra y la trazabilidad de tus buenas prácticas.',
    },
    {
      titulo: 'Mejora continua',
      texto:
        'La sostenibilidad no es un discurso: es comparar campañas, corregir manejo y demostrar evolución del suelo y del cultivo.',
    },
  ];

  const normalizar = (valor) =>
    String(valor || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const resolverPersonaje = (id) => {
    const clave = ALIAS_PERSONAJES[normalizar(id)] || normalizar(id);
    return STAFF_MELANTIA.personajes[clave] || null;
  };

  const SistemaBase = window.Sistema || {};
  const Sistema = {
    ...SistemaBase,
    pausarProcesosSecundarios() {
      if (document.body) {
        document.body.dataset.staffPrioridad = 'alta';
      }
      if (typeof SistemaBase.pausarProcesosSecundarios === 'function') {
        try {
          SistemaBase.pausarProcesosSecundarios();
        } catch {}
      }
    },
    ajustarPrioridad(prioridad = 'media') {
      if (document.body) {
        document.body.dataset.staffPrioridad = prioridad;
      }
      if (prioridad === 'alta') {
        this.pausarProcesosSecundarios();
      }
    },
  };
  window.Sistema = Sistema;

  const MelantiaVoz = {
    hablar(texto, id = null) {
      const personaje = id ? resolverPersonaje(id) : null;
      if (personaje) {
        StaffController.activarPersonaje(personaje.id);
      }
      if (!('speechSynthesis' in window)) return false;
      const activo =
        personaje ||
        resolverPersonaje(document.body?.dataset.voz) ||
        resolverPersonaje('melantia');
      const utt = new SpeechSynthesisUtterance(String(texto || ''));
      utt.lang = 'es-EC';
      utt.pitch = activo?.pitch || window._melantia_voz_pitch || 1.0;
      utt.rate = activo?.rate || window._melantia_voz_rate || 0.95;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utt);
      return true;
    },
  };
  window.MelantiaVoz = window.MelantiaVoz || MelantiaVoz;

  const StaffController = {
    personajes: STAFF_MELANTIA.personajes,

    activarPersonaje(id) {
      const personaje = resolverPersonaje(id);
      if (!personaje) return null;

      document.documentElement.style.setProperty(
        '--color-asistente',
        personaje.color
      );
      if (document.body) {
        document.body.dataset.voz = personaje.voz;
        document.body.dataset.staffModulo = personaje.modulo;
      }
      window._melantia_voz_pitch = personaje.pitch;
      window._melantia_voz_rate = personaje.rate;
      Sistema.ajustarPrioridad(personaje.prioridad);

      const btnVoz = document.getElementById('btn-voz-general');
      if (btnVoz) {
        btnVoz.style.backgroundColor = personaje.color;
        btnVoz.setAttribute('aria-label', `Activar voz de ${personaje.nombre}`);
        btnVoz.title = personaje.nombre;
      }

      console.log(
        `MELANTIA: ${personaje.nombre} ha tomado el control del módulo ${personaje.modulo}`
      );
      return personaje;
    },

    activarAsistente(id) {
      return this.activarPersonaje(id);
    },

    saludar(id) {
      const personaje = this.activarPersonaje(id);
      if (!personaje) return null;
      MelantiaVoz.hablar(personaje.saludo, personaje.id);
      return personaje;
    },

    _renderPanel(titulo, subtitulo, cuerpo, personajeId) {
      const panel = document.getElementById('panel-novedades');
      if (!panel) return false;
      const personaje = this.activarPersonaje(personajeId);
      panel.style.maxWidth = '760px';
      panel.innerHTML = `
        <div class="novedad-card" data-experto="${personaje?.voz || ''}" style="display:grid;gap:12px;max-height:80vh;overflow:auto">
          <div>
            <p class="novedad-n1" style="margin:0">${titulo}</p>
            <p class="novedad-n2" style="margin:6px 0 0">${subtitulo}</p>
          </div>
          ${cuerpo}
          <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px">
            <button type="button" onclick="document.getElementById('panel-novedades').style.display='none'">Cerrar</button>
          </div>
        </div>`;
      panel.style.display = 'block';
      return true;
    },

    abrirPaulette() {
      const fichas = FICHAS_PAULETTE.map(
        (ficha, indice) => `
          <article style="display:grid;gap:8px;border:1px solid #ecd6db;border-radius:12px;padding:12px;background:#fffafb">
            <div style="display:flex;justify-content:space-between;gap:8px;align-items:start;flex-wrap:wrap">
              <strong>${ficha.titulo}</strong>
              <span style="background:#ffe4ea;color:#8d3b5a;border-radius:999px;padding:4px 8px;font-size:12px;font-weight:700">Offline</span>
            </div>
            <div>${ficha.resumen}</div>
            <div style="font-size:13px;color:#5f4250"><strong>Acción:</strong> ${ficha.accion}</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button type="button" class="staff-accion" onclick="StaffController.leerFichaPaulette(${indice})">Escuchar ficha</button>
            </div>
          </article>`
      ).join('');
      this._renderPanel(
        'Paulette · Bienestar rural offline',
        'Primeros auxilios rurales y prevención para la familia campesina, disponibles sin internet.',
        `<section style="display:grid;gap:10px">${fichas}</section>`,
        'paulette'
      );
      MelantiaVoz.hablar(
        'Soy Paulette. Aquí tienes las fichas de bienestar rural disponibles sin internet.',
        'paulette'
      );
    },

    leerFichaPaulette(indice) {
      const ficha = FICHAS_PAULETTE[Number(indice)];
      if (!ficha) return false;
      MelantiaVoz.hablar(
        `${ficha.titulo}. ${ficha.resumen} Acción recomendada: ${ficha.accion}`,
        'paulette'
      );
      return true;
    },

    abrirMelantia() {
      const bloques = GUIA_MELANTIA.map(
        (item) => `
          <article style="display:grid;gap:8px;border:1px solid #cfeeed;border-radius:12px;padding:12px;background:#f5fffe">
            <strong>${item.titulo}</strong>
            <div>${item.texto}</div>
          </article>`
      ).join('');
      this._renderPanel(
        'Melantia · Guía de sostenibilidad',
        'La plataforma explica por qué registrar evidencia y expediente fortalece la sostenibilidad y la trazabilidad de la finca.',
        `<section style="display:grid;gap:10px">${bloques}</section><section style="background:#eefbfa;border:1px solid #bde9e4;border-radius:12px;padding:12px"><strong>Mensaje clave:</strong><div style="margin-top:6px">Al registrar esta foto, estamos creando el certificado de sostenibilidad de tu tierra.</div></section>`,
        'melantia'
      );
      MelantiaVoz.hablar(
        'Al registrar esta foto, estamos creando el certificado de sostenibilidad de tu tierra.',
        'melantia'
      );
    },

    explicarExpediente() {
      this.activarPersonaje('melantia');
      MelantiaVoz.hablar(
        'El expediente agronómico guarda entrevistas, fotos y decisiones. Así demostramos buenas prácticas y mejora continua.',
        'melantia'
      );
      return true;
    },

    montarTarjetasBase() {
      const menu = document.getElementById('app-menu');
      if (!menu) return;

      if (!menu.querySelector('[data-modulo="paulette-bienestar"]')) {
        const card = document.createElement('article');
        card.className = 'card';
        card.dataset.modulo = 'paulette-bienestar';
        card.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
            <h3 style="margin:0">Paulette</h3>
            <span class="staff-chip" style="background:#ffe4ea;color:#8d3b5a">Bienestar rural</span>
          </div>
          <p>Fichas offline de primeros auxilios, prevención de dengue y cuidado familiar para jornadas de campo.</p>
          <button type="button" class="staff-accion">Abrir fichas</button>`;
        card.addEventListener('click', () => this.abrirPaulette());
        card.querySelector('button')?.addEventListener('click', (event) => {
          event.stopPropagation();
          this.abrirPaulette();
        });
        menu.appendChild(card);
      }

      if (!menu.querySelector('[data-modulo="melantia-sostenibilidad"]')) {
        const card = document.createElement('article');
        card.className = 'card';
        card.dataset.modulo = 'melantia-sostenibilidad';
        card.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
            <h3 style="margin:0">Melantia</h3>
            <span class="staff-chip" style="background:#dbfbf8;color:#115e59">Sostenibilidad</span>
          </div>
          <p>Explica la trazabilidad del expediente agronómico y cómo cada evidencia fortalece el certificado de sostenibilidad.</p>
          <button type="button" class="staff-accion">Abrir guía</button>`;
        card.addEventListener('click', () => this.abrirMelantia());
        card.querySelector('button')?.addEventListener('click', (event) => {
          event.stopPropagation();
          this.abrirMelantia();
        });
        menu.appendChild(card);
      }
    },

    iniciar() {
      this.activarPersonaje('melantia');
      this.montarTarjetasBase();
    },
  };

  window.STAFF_MELANTIA = STAFF_MELANTIA;
  window.StaffController = StaffController;

  document.addEventListener('DOMContentLoaded', () => {
    StaffController.iniciar();
  });
})(); /**
 * staff_controller.js — MELANTIA
 * Gestor maestro del equipo de 6 personajes.
 * Carga perfiles bajo demanda (lazy), aplica colores CSS
 * y gestiona traspasos entre módulos. 100% offline.
 */

const StaffController = (() => {
  // --------------------------------------------------
  // Mapa estático módulo → personaje
  // Evita leer el JSON solo para saber quién habla.
  // --------------------------------------------------
  const MAPA_MODULOS = {
    1: 'Melantia', // Inicio
    2: 'Angel', // Sistema de Afiliados
    3: 'Fabrizzio', // Asistente Técnico Rural
    4: 'Valentina', // Asistente Técnico Veterinario
    5: 'Melantia', // Agricultura Digital
    6: 'Fabrizzio', // Gestión Productiva
    7: 'Angel', // Comercio
    8: 'Angel', // Emprendedor y Finanzas
    9: 'Melantia', // Sostenibilidad y Proyectos
    10: 'Dr. Pablo', // Formación / Asesoría Legal
    11: 'Paulette', // Salud y Bienestar Rural
  };

  // Colores de identidad embebidos (sin fetch) para respuesta instantánea
  const COLORES = {
    Fabrizzio: '#1b4d3e', // Verde Campo oscuro
    Valentina: '#6a4a7d', // Violeta Salud
    Angel: '#d97706', // Naranja Ámbar
    'Don Eloy': '#8a5a2b', // Tierra noble
    Melantia: '#0d9488', // Azul Turquesa profundo
    'Dr. Pablo': '#334155', // Gris Oxford
    Paulette: '#db2777', // Rosa Fuerte
  };

  const VOCES_BASE = {
    'Don Eloy': {
      pitch: 0.82,
      rate: 0.9,
      categorias: ['Comunidad Virtual'],
    },
  };

  // Estado interno
  let _perfiles = null; // cache del JSON (se carga una sola vez)
  let _vozActiva = null;
  let _cargando = false;

  // --------------------------------------------------
  // Privadas
  // --------------------------------------------------
  const _aplicarColor = (nombre) => {
    const color = COLORES[nombre] || '#76c7c0';
    document.documentElement.style.setProperty('--color-asistente', color);
    document.body.setAttribute('data-voz', nombre);
  };

  const _anunciarTraspaso = (nuevo, anterior, categoria) => {
    if (!anterior || anterior === nuevo) return;
    const msg = `Hola, soy ${nuevo}. He tomado el relevo de ${anterior} para ayudarte en ${categoria}.`;
    console.info(`[MELANTIA traspaso] ${msg}`);
    return msg;
  };

  const _cargarJSON = async () => {
    if (_perfiles) return _perfiles; // ya en memoria
    if (_cargando) return null; // evitar llamadas paralelas
    _cargando = true;
    try {
      const resp = await fetch('src/knowledge_seeds/voces_melantia.json');
      const data = await resp.json();
      _perfiles = data.equipo_voces;
      return _perfiles;
    } catch {
      console.warn(
        '[StaffController] JSON offline no disponible — usando datos embebidos.'
      );
      return null;
    } finally {
      _cargando = false;
    }
  };

  const _aplicarSpeechAPI = (perfil) => {
    if (!perfil || !('speechSynthesis' in window)) return;
    window._melantia_voz_pitch = perfil.pitch;
    window._melantia_voz_rate = perfil.rate;
  };

  // --------------------------------------------------
  // API pública
  // --------------------------------------------------
  return {
    /**
     * Activa al personaje asignado al módulo indicado.
     * @param {number} moduloId  — ID del módulo (1-11)
     */
    async activarModulo(moduloId) {
      const nombre = MAPA_MODULOS[moduloId];
      if (!nombre) {
        console.warn(`[StaffController] Módulo ${moduloId} sin asignación.`);
        return;
      }
      await this.activarPersonaje(nombre);
    },

    /**
     * Activa un personaje por su nombre directamente.
     * @param {string} nombre  — Ej: 'Fabrizzio', 'Dr. Pablo'
     */
    async activarPersonaje(nombre) {
      if (_vozActiva === nombre) return; // ya activo, no hacer nada

      // Aplicar color de forma instantánea (sin esperar JSON)
      _aplicarColor(nombre);

      // Cargar perfil completo desde JSON (lazy, una sola vez)
      const perfiles = await _cargarJSON();
      const perfil =
        perfiles?.find((p) => p.nombre === nombre) ||
        VOCES_BASE[nombre] ||
        null;

      if (perfil) {
        _aplicarSpeechAPI(perfil);
        const msg = _anunciarTraspaso(
          nombre,
          _vozActiva,
          perfil.categorias?.[0] || ''
        );
        if (msg) this._ultimoTraspaso = msg;
      }

      const anterior = _vozActiva;
      _vozActiva = nombre;

      console.log(
        `[StaffController] Activo: ${nombre} | color: ${COLORES[nombre]}`
      );

      // Actualizar robot visual si existe
      if (typeof ui_melantia !== 'undefined') ui_melantia.listo();

      return { nombre, perfil, anterior };
    },

    /**
     * Devuelve el nombre del personaje activo.
     */
    vozActiva() {
      return _vozActiva;
    },

    /**
     * Devuelve el personaje asignado a un módulo sin activarlo.
     * @param {number} moduloId
     */
    personajeDe(moduloId) {
      return MAPA_MODULOS[moduloId] || null;
    },

    /**
     * Devuelve todos los perfiles cargados (o null si no se cargó el JSON).
     */
    perfiles() {
      return _perfiles;
    },

    /**
     * Precarga el JSON en memoria (útil al iniciar la app con señal).
     */
    async precargar() {
      await _cargarJSON();
      console.log('[StaffController] Perfiles precargados en memoria.');
    },

    /**
     * Limpia el caché (útil para liberar RAM en gama baja).
     */
    liberarMemoria() {
      _perfiles = null;
      console.log('[StaffController] Caché de perfiles liberado.');
    },

    // ----------------------------------------------------------------
    // CAPTURA MULTIMEDIA CON TRAZABILIDAD
    // Activa la cámara trasera, obtiene GPS y registra la evidencia
    // fotográfica en IndexedDB a través de GestorEvidenciaFotos.
    // ----------------------------------------------------------------

    /**
     * Ejecuta el flujo completo de captura de evidencia de crecimiento.
     * Llamado desde el motor de voz cuando el productor dice:
     *   "Melantia, toma foto de crecimiento"
     *
     * @param {string|number} idAnimal     ID del animal activo en sesión.
     * @param {string}        etapa        'perfil'|'inicio'|'crecimiento'|'final'
     * @param {number}        pesoActual   Peso estimado en kg (0 = sin dato).
     * @param {string|null}   idLote       Lote activo (session.getLoteActivo()).
     * @returns {Promise<{success:boolean, mensaje:string}>}
     */
    async ejecutarComandoFotoCrecimiento(
      idAnimal = window._melantia_session?.idAnimalActivo ?? null,
      etapa = 'crecimiento',
      pesoActual = 0,
      idLote = window._melantia_session?.loteActivo ?? null
    ) {
      // 1. Feedback de voz inmediato — Valentina toma el control del módulo veterinario
      await this.activarPersonaje('Valentina');
      console.log(
        '[Valentina] Entendido, preparando cámara para registro de evidencia...'
      );

      try {
        if (!idAnimal) {
          const msg =
            'No hay un animal activo en sesión para registrar la evidencia.';
          console.warn('[StaffController] ' + msg);
          if (typeof _voz === 'function') _voz(msg);
          return { success: false, mensaje: msg };
        }

        if (typeof window.capturarEvidenciaIA !== 'function') {
          const msg =
            'El gestor de evidencia no está disponible en esta vista.';
          console.error('[StaffController] ' + msg);
          return { success: false, mensaje: msg };
        }

        const resultado = await window.capturarEvidenciaIA(
          idAnimal,
          etapa,
          pesoActual,
          idLote
        );

        if (resultado?.mensaje) {
          console.log('[Valentina] ' + resultado.mensaje);
          if (typeof _voz === 'function') _voz(resultado.mensaje);
        }

        return resultado;
      } catch (err) {
        const msg = 'Error en el flujo de captura. Intenta de nuevo.';
        console.error('[StaffController] Error en foto crecimiento:', err);
        return { success: false, mensaje: msg };
      }
    },

    // Referencia al mapa y colores para uso externo
    MAPA_MODULOS,
    COLORES,
  };
})();

// --------------------------------------------------
// Inicialización automática al cargar el DOM
// --------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  StaffController.activarPersonaje('Melantia'); // Voz por defecto
});
