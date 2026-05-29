// Módulo: Mi Comunidad Virtual MELANTIA
// Plaza digital para interacción, preguntas, respuestas y noticias
// Moderador: Don Eloy

const ComunidadVirtual = {
  estado: null,
  storageKey: 'melantia_comunidad_virtual_estado',

  cargarEstado() {
    try {
      this.estado = JSON.parse(localStorage.getItem(this.storageKey)) || {
        miembros: [],
        preguntas: [],
        respuestas: [],
        noticias: [],
        alertas: [],
        salud: [],
        bienvenidaMostrada: false,
        ultimaNoticia: '',
        ultimaAlarma: '',
        notificaciones: [],
      };
    } catch {
      this.estado = {
        miembros: [],
        preguntas: [],
        respuestas: [],
        noticias: [],
        alertas: [],
        salud: [],
        bienvenidaMostrada: false,
        ultimaNoticia: '',
        ultimaAlarma: '',
        notificaciones: [],
      };
    }
    return this.estado;
  },

  guardarEstado() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.estado));
  },

export function mostrarPanel() {
  ComunidadVirtual.mostrarPanel('contenedor-principal');
}

  mostrarPanel(contenedorId = 'app-menu') {
    this.cargarEstado();
// --- IndexedDB helpers ---
const DB_NAME = 'comunidad_virtual_db';
const DB_VERSION = 1;
const STORE = 'comunidad';
const ACCIONES = 'cola_acciones';

function abrirDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      if (!db.objectStoreNames.contains(ACCIONES)) db.createObjectStore(ACCIONES, { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function guardarEnDB(store, obj) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).add(obj);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function obtenerTodosDeDB(store) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function borrarDeDB(store, id) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

const ComunidadVirtual = {
  estado: null,
  maxMensajes: 50,
  cargarEstado: async function () {
    const datos = await obtenerTodosDeDB(STORE);
    this.estado = datos[0] || {
      miembros: [], preguntas: [], respuestas: [], noticias: [], alertas: [], salud: [], bienvenidaMostrada: false, ultimaNoticia: '', ultimaAlarma: '', notificaciones: []
    };
    return this.estado;
  },
  guardarEstado: async function () {
    // Solo un registro, id=1
    const db = await abrirDB();
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ ...this.estado, id: 1 });
    return new Promise((res, rej) => {
      tx.oncomplete = res;
      tx.onerror = rej;
    });
  },
  // --- Cola de acciones offline y puente Don Eloy ---
  agregarAccionOffline: async function (accion, payload) {
    // Guarda acciones pendientes (noticias, alarmas, etc.)
    await guardarEnDB(ACCIONES, { accion, payload, fecha: Date.now() });
  },

  procesarColaAcciones: async function () {
    // Procesa la cola cuando hay cobertura
    const acciones = await obtenerTodosDeDB(ACCIONES);
    for (const a of acciones) {
      if (a.accion === 'difundirNoticia') {
        // Don Eloy anuncia la noticia pendiente
        await this.recibirNoticiaExterna(a.payload.titulo, a.payload.texto, a.payload.comunidadOrigen);
      }
      // Aquí puedes agregar otros tipos de acciones (alarmas, etc.)
      await borrarDeDB(ACCIONES, a.id);
    }
  },

  // Método para recibir y anunciar noticias externas (Don Eloy puente)
  async recibirNoticiaExterna(titulo, texto, comunidadOrigen) {
    await this.agregarNoticia(`[De ${comunidadOrigen}] ${titulo}`, texto, 'noticia');
    if (window.hablarMelantia && window.mandoVozActivo) {
      window.hablarMelantia(`Don Eloy informa desde la comunidad ${comunidadOrigen}: ${titulo}. ${texto}`, 8);
    }
    if (window.enviarNotificacion) {
      window.enviarNotificacion('Comunidad Virtual', `[De ${comunidadOrigen}] ${titulo}: ${texto}`);
    }
  },
    const cont = document.getElementById(contenedorId);
    if (!cont) return;
    cont.innerHTML = `
      <h2>Mi Comunidad Virtual</h2>
      <div class="plaza-don-eloy">
        <div class="noticias-comunidad" id="noticias-comunidad"></div>
        <div class="preguntas-comunidad" id="preguntas-comunidad"></div>
        <div class="salud-comunidad" id="salud-comunidad"></div>
      </div>
      <button onclick="ComunidadVirtual.mostrarFormularioPregunta()">Hacer una pregunta</button>
      <button onclick="ComunidadVirtual.mostrarNoticias()">Ver noticias</button>
      <button onclick="ComunidadVirtual.mostrarSalud()">Recomendaciones de salud rural</button>
    `;
    this.mostrarNoticias();
    this.mostrarPreguntas();
    this.mostrarSalud();
    // Voz bienvenida Don Eloy
  async mostrarNoticias() {
    await this.cargarEstado();
    const div = document.getElementById('noticias-comunidad');
    if (!div) return;
    let noticias = this.estado.noticias || [];
    // Limitar a 50, eliminar las más antiguas (excepto alarmas)
    if (noticias.length > this.maxMensajes) {
      noticias = noticias.filter(n => n.tipo === 'alarma' ? true : false);
      while (noticias.length > this.maxMensajes) noticias.shift();
      this.estado.noticias = noticias;
      await this.guardarEstado();
    }
    div.innerHTML = `<h3>Noticias de la Comunidad</h3>` +
      (noticias.length === 0 ? '<p>No hay noticias recientes.</p>' :
        '<ul>' + noticias.slice(-5).reverse().map(n => `<li>${n.fecha} — ${n.titulo}: ${n.texto}</li>`).join('') + '</ul>');
  },
    if (window.hablarMelantia && window.mandoVozActivo) {
      window.hablarMelantia(
        'Bienvenido a la Plaza de la Comunidad Virtual. Aquí puedes preguntar, responder y mantenerte informado. Recuerda: el respeto es la base de nuestra comunidad. Don Eloy es tu moderador.',
        8
      );
    }
  },

  mostrarNoticias() {
    this.cargarEstado();
    const div = document.getElementById('noticias-comunidad');
    if (!div) return;
    const noticias = this.estado.noticias.slice(-5).reverse();
    div.innerHTML =
      `<h3>Noticias de la Comunidad</h3>` +
      (noticias.length === 0
        ? '<p>No hay noticias recientes.</p>'
        : '<ul>' +
          noticias
            .map((n) => `<li>${n.fecha} — ${n.titulo}: ${n.texto}</li>`)
  async mostrarPreguntas() {
    await this.cargarEstado();
    const div = document.getElementById('preguntas-comunidad');
    if (!div) return;
    let preguntas = this.estado.preguntas || [];
    // Limitar a 50
    if (preguntas.length > this.maxMensajes) {
      preguntas = preguntas.slice(-this.maxMensajes);
      this.estado.preguntas = preguntas;
      await this.guardarEstado();
    }
    div.innerHTML = `<h3>Preguntas y Respuestas</h3>` +
      (preguntas.length === 0 ? '<p>No hay preguntas aún.</p>' :
        '<ul>' + preguntas.slice(-10).reverse().map(q => `<li><b>${q.usuario}:</b> ${q.texto}<br><i>Respuestas:</i><ul>${(q.respuestas||[]).map(r => `<li>${r.usuario}: ${r.texto}</li>`).join('')}</ul></li>`).join('') + '</ul>');
  },
            .join('') +
          '</ul>');
  },

  mostrarPreguntas() {
    this.cargarEstado();
    const div = document.getElementById('preguntas-comunidad');
    if (!div) return;
    const preguntas = this.estado.preguntas.slice(-10).reverse();
    div.innerHTML =
      `<h3>Preguntas y Respuestas</h3>` +
      (preguntas.length === 0
        ? '<p>No hay preguntas aún.</p>'
        : '<ul>' +
          preguntas
            .map(
              (q) =>
                `<li><b>${q.usuario}:</b> ${q.texto}<br><i>Respuestas:</i><ul>${(q.respuestas || []).map((r) => `<li>${r.usuario}: ${r.texto}</li>`).join('')}</ul></li>`
            )
  async agregarNoticia(titulo, texto, tipo = 'noticia') {
    await this.cargarEstado();
    this.estado.noticias.push({ titulo, texto, fecha: new Date().toLocaleString(), tipo });
    // Limitar a 50, salvo alarmas
    let noticias = this.estado.noticias;
    if (noticias.length > this.maxMensajes) {
      noticias = noticias.filter(n => n.tipo === 'alarma' ? true : false);
      while (noticias.length > this.maxMensajes) noticias.shift();
      this.estado.noticias = noticias;
    }
    await this.guardarEstado();
    // Notificación y voz Don Eloy
    if (window.hablarMelantia && window.mandoVozActivo) {
      window.hablarMelantia('Nueva noticia en la comunidad: ' + titulo, 8);
    }
    // Notificación visual
    if (window.enviarNotificacion) {
      window.enviarNotificacion('Comunidad Virtual', titulo + ': ' + texto);
    }
  },
            .join('') +
          '</ul>');
  },

  mostrarSalud() {
    // Conectar con módulo 9 Asistente Preventivo de Salud
    if (
      window.MelantiaSalud &&
      typeof window.MelantiaSalud.recomendaciones === 'function'
    ) {
      const recomendaciones = window.MelantiaSalud.recomendaciones();
      const div = document.getElementById('salud-comunidad');
      if (div) {
  async notificarAlarma(texto) {
    await this.cargarEstado();
    this.estado.alertas.push({ texto, fecha: new Date().toLocaleString() });
    await this.agregarNoticia('Alarma', texto, 'alarma');
    await this.guardarEstado();
    if (window.hablarMelantia && window.mandoVozActivo) {
      window.hablarMelantia('Atención: ' + texto, 8);
    }
    if (window.enviarNotificacion) {
      window.enviarNotificacion('Alarma Comunidad', texto);
    }
  },
        div.innerHTML =
          `<h3>Recomendaciones de Salud Rural</h3><ul>` +
          recomendaciones.map((r) => `<li>${r}</li>`).join('') +
          '</ul>';
      }
    }
  },

  mostrarFormularioPregunta() {
    const cont = document.getElementById('app-menu');
    if (!cont) return;
    cont.innerHTML = `
  async agregarRespuesta(idxPregunta, usuario, texto) {
    await this.cargarEstado();
    if (!this.estado.preguntas[idxPregunta]) return;
    if (/insulto|politi/gi.test(texto)) return;
    this.estado.preguntas[idxPregunta].respuestas = this.estado.preguntas[idxPregunta].respuestas || [];
    this.estado.preguntas[idxPregunta].respuestas.push({ usuario, texto });
    await this.guardarEstado();
    this.mostrarPanel();
  },
      <h2>Hacer una pregunta a la comunidad</h2>
      <form id="form-pregunta">
        <label>Tu nombre: <input name="usuario" required></label><br>
        <label>Pregunta: <textarea name="texto" required></textarea></label><br>
        <button type="submit">Enviar</button>
        <button type="button" onclick="ComunidadVirtual.mostrarPanel()">Cancelar</button>
      </form>
      <div id="msg-pregunta"></div>
    `;
    document.getElementById('form-pregunta').onsubmit = (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target).entries());
      if (/insulto|politi/gi.test(data.texto)) {
        document.getElementById('msg-pregunta').innerHTML =
          '<span style="color:red">No se permiten insultos ni temas políticos.</span>';
        return;
      }
      this.cargarEstado();
      this.estado.preguntas.push({
        usuario: data.usuario,
        texto: data.texto,
        respuestas: [],
      });
      this.guardarEstado();
      this.mostrarPanel();
    };
  },

  agregarNoticia(titulo, texto) {
    this.cargarEstado();
    this.estado.noticias.push({
  // --- Limpieza de alarmas vistas hace más de 1 día ---
  async limpiarAlarmasVistas() {
    await this.cargarEstado();
    const ahora = Date.now();
    this.estado.noticias = (this.estado.noticias || []).filter(n => {
      if (n.tipo !== 'alarma') return true;
      const fecha = new Date(n.fecha).getTime();
      return ahora - fecha < 24 * 60 * 60 * 1000; // 1 día
    });
    await this.guardarEstado();
  },

  // --- Difusión de noticias importantes por Don Eloy ---
  async difundirNoticiaImportante(titulo, texto, comunidadDestino) {
    // Si hay conexión, aquí se enviaría al backend/P2P
    // Si no hay conexión, se guarda en la cola para enviar después
    const online = navigator.onLine;
    if (online) {
      // Aquí iría la lógica real de envío (fetch, websocket, etc.)
      // Por ahora solo agrega localmente
      await this.agregarNoticia(`[Difusión] ${titulo}`, texto, 'noticia');
      if (window.hablarMelantia && window.mandoVozActivo) {
        window.hablarMelantia(`Don Eloy informa a la comunidad ${comunidadDestino}: ${titulo}. ${texto}`, 8);
      }
    } else {
      // Guardar en la cola para cuando vuelva la conexión
      await this.agregarAccionOffline('difundirNoticia', { titulo, texto, comunidadDestino, comunidadOrigen: 'Local' });
      if (window.hablarMelantia && window.mandoVozActivo) {
        window.hablarMelantia('Don Eloy guardó la noticia para difundirla cuando haya cobertura.', 8);
      }
    }
  },
      titulo,
      texto,
      fecha: new Date().toLocaleString(),
    });
    this.guardarEstado();
    // Notificación y voz Don Eloy
    if (window.hablarMelantia && window.mandoVozActivo) {
      window.hablarMelantia('Nueva noticia en la comunidad: ' + titulo, 8);
    }
    // Notificación visual
    if (window.enviarNotificacion) {
      window.enviarNotificacion('Comunidad Virtual', titulo + ': ' + texto);
    }
  },

  agregarRespuesta(idxPregunta, usuario, texto) {
    this.cargarEstado();
    if (!this.estado.preguntas[idxPregunta]) return;
    if (/insulto|politi/gi.test(texto)) return;
    this.estado.preguntas[idxPregunta].respuestas =
      this.estado.preguntas[idxPregunta].respuestas || [];
    this.estado.preguntas[idxPregunta].respuestas.push({ usuario, texto });
    this.guardarEstado();
    this.mostrarPanel();
  },

  notificarAlarma(texto) {
    this.cargarEstado();
    this.estado.alertas.push({ texto, fecha: new Date().toLocaleString() });
    this.guardarEstado();
    if (window.hablarMelantia && window.mandoVozActivo) {
      window.hablarMelantia('Atención: ' + texto, 8);
    }
    if (window.enviarNotificacion) {
      window.enviarNotificacion('Alarma Comunidad', texto);
    }
  },
};

// Procesar la cola automáticamente al recuperar conexión
window.addEventListener('online', () => {
  if (window.ComunidadVirtual && typeof window.ComunidadVirtual.procesarColaAcciones === 'function') {
    window.ComunidadVirtual.procesarColaAcciones();
  }
});

window.ComunidadVirtual = ComunidadVirtual;
export default ComunidadVirtual; // Módulo: Mi Comunidad Virtual
// Funciones y lógica de comunidad, asesoría legal, walkie talkie

window.MelantiaComunidadVirtual = {
  // Aquí se migrarán las funciones específicas del módulo
};
