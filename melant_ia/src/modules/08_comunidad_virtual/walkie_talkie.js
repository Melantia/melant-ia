import {
  createWalkieNetworkManager,
  obtenerEstadoRedWalkie,
  actualizarConfigRedWalkie,
} from './walkie.js';

// Walkie Talkie MELANTIA (módulo canónico unificado)

const DB_NAME = 'comunidad_virtual_db';
const DB_VERSION = 2;
const STORE_MENSAJES = 'mensajes';
const LIMITE_MENSAJES = 60;
const LIMITE_AUDIOS = 10;
const MODERADOR_DEFAULT = 'Don Eloy';

const PALABRAS_PROHIBIDAS = [
  'politica',
  'eleccion',
  'voto',
  'partido',
  'insulto',
  'idiota',
  'tonto',
  'estupido',
  'ofensa',
  'grosero',
  'maldito',
  'carajo',
  'mierda',
  'imbecil',
  'puto',
  'puta',
  'propaganda',
  'campana',
  'candidato',
  'presidente',
  'alcalde',
  'concejal',
  'diputado',
  'senador',
  'asambleista',
  'gobierno',
  'corrupcion',
  'corrupto',
  'ladron',
  'ladrona',
  'delincuente',
  'odio',
  'racista',
  'discriminar',
  'discriminacion',
];

function normalizarTexto(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function contienePalabrasProhibidas(texto) {
  const limpio = normalizarTexto(texto);
  return PALABRAS_PROHIBIDAS.some((p) => limpio.includes(p));
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_MENSAJES)) {
        const store = db.createObjectStore(STORE_MENSAJES, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export class WalkieTalkie {
  constructor(moderador = MODERADOR_DEFAULT) {
    this.moderador = moderador;
    this.mensajes = [];
    this.audios = [];
  }

  async cargarDesdeDB() {
    const db = await openDB();
    const tx = db.transaction(STORE_MENSAJES, 'readonly');
    const store = tx.objectStore(STORE_MENSAJES);
    const lista = await reqToPromise(store.getAll());
    this.mensajes = (lista || []).sort((a, b) => a.timestamp - b.timestamp);
  }

  async guardarMensajeDB(mensaje) {
    const db = await openDB();
    const tx = db.transaction(STORE_MENSAJES, 'readwrite');
    const store = tx.objectStore(STORE_MENSAJES);
    await reqToPromise(store.add(mensaje));

    const all = await reqToPromise(store.getAll());
    if (all.length > LIMITE_MENSAJES) {
      const ids = all
        .sort((a, b) => a.timestamp - b.timestamp)
        .map((m) => m.id);
      const excedente = all.length - LIMITE_MENSAJES;
      for (let i = 0; i < excedente; i += 1) {
        await reqToPromise(store.delete(ids[i]));
      }
    }
  }

  async agregarMensaje(texto, autor, destinatario = null, canal = 'grupal') {
    const limpio = String(texto || '').trim();
    if (!limpio) return { ok: false, motivo: 'vacio' };

    if (canal === 'grupal' && contienePalabrasProhibidas(limpio)) {
      return { ok: false, motivo: 'moderado' };
    }

    const mensaje = {
      texto: limpio,
      autor: autor || 'Anonimo',
      destinatario,
      canal,
      timestamp: Date.now(),
    };

    this.mensajes.push(mensaje);
    if (this.mensajes.length > LIMITE_MENSAJES) {
      this.mensajes = this.mensajes.slice(-LIMITE_MENSAJES);
    }
    await this.guardarMensajeDB(mensaje);
    return { ok: true, mensaje };
  }

  async eliminarMensaje(idx) {
    const mensaje = this.mensajes[idx];
    if (!mensaje) return;
    this.mensajes.splice(idx, 1);

    const db = await openDB();
    const tx = db.transaction(STORE_MENSAJES, 'readwrite');
    const store = tx.objectStore(STORE_MENSAJES);
    const all = await reqToPromise(store.getAll());
    const found = all.find(
      (m) => m.timestamp === mensaje.timestamp && m.texto === mensaje.texto
    );
    if (found) {
      await reqToPromise(store.delete(found.id));
    }
  }

  obtenerMensajes() {
    return this.mensajes;
  }

  agregarAudio(blobUrl, autor, destinatario = null, canal = 'grupal') {
    const audio = {
      blobUrl,
      autor: autor || 'Anonimo',
      destinatario,
      canal,
      timestamp: Date.now(),
      escuchado: false,
      timestampEscucha: null,
    };
    this.audios.push(audio);
    if (this.audios.length > LIMITE_AUDIOS) {
      this.audios = this.audios.slice(-LIMITE_AUDIOS);
    }
    return audio;
  }

  marcarAudioEscuchado(audio) {
    if (!audio) return;
    audio.escuchado = true;
    audio.timestampEscucha = Date.now();
  }

  limpiarAudiosViejos(segundos = 30) {
    const ahora = Date.now();
    this.audios = this.audios.filter(
      (a) => !(a.escuchado && ahora - a.timestampEscucha > segundos * 1000)
    );
  }

  obtenerAudios() {
    return this.audios;
  }
}

export function mostrarPanel(contenedorId = 'app-menu') {
  const contenedor =
    document.getElementById(contenedorId) ||
    document.getElementById('contenedor-principal');
  if (!contenedor) return;

  const walkie = new WalkieTalkie();
  const networkManager = createWalkieNetworkManager({
    onPayload: async (msg) => {
      if (msg.tipo === 'texto') {
        await walkie.agregarMensaje(
          msg.texto,
          msg.autor,
          msg.destinatario || null,
          msg.canal || 'grupal'
        );
        await renderMensajes();
        await renderEstadoRed();
      } else if (msg.tipo === 'audio' && msg.blob) {
        const audioUrl = URL.createObjectURL(msg.blob);
        walkie.agregarAudio(
          audioUrl,
          msg.autor,
          msg.destinatario || null,
          msg.canal || 'grupal'
        );
        renderAudios();
        await renderEstadoRed();
      }
    },
  });

  let modo = 'grupal';
  const configTecnica = {
    tipoFinca: 'pequena',
    distanciaEstimadaMetros: null,
  };

  contenedor.innerHTML = `
    <div id="walkie-container" style="max-width:760px;margin:24px auto;padding:20px;border-radius:12px;border:1px solid #e2e8f0;background:#fff;box-shadow:0 2px 8px #0001;">
      <h2 id="walkie-titulo" style="margin-top:0;color:#276749;">Walkie Talkie MELANTIA</h2>
      <div id="modo-selector" style="margin-bottom:12px;display:flex;gap:12px;flex-wrap:wrap;">
        <label><input type="radio" name="modo" value="grupal" checked> Modo Grupal / SOS</label>
        <label><input type="radio" name="modo" value="privado"> Modo Privado</label>
      </div>

      <div id="normas-grupal" style="background:#fefcbf;color:#744210;border-radius:8px;padding:10px;margin-bottom:12px;border:1px solid #f6e05e;font-size:14px;">
        <b>Normas del canal grupal/SOS:</b><br>
        - Prohibido propaganda política e insultos.<br>
        - Don Eloy modera y puede bloquear mensajes ofensivos.<br>
        - Canal orientado a seguridad comunitaria y apoyo rural.<br>
      </div>

      <div id="estado-red-walkie" style="margin-bottom:12px;"></div>
      <div id="alerta-rango-walkie" style="margin-bottom:12px;"></div>
      <div id="panel-tecnico-walkie" style="display:none;margin-bottom:12px;"></div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
        <input id="alias-input" type="text" placeholder="Tu nombre o alias" style="flex:1;min-width:200px;padding:8px;border:1px solid #cbd5e1;border-radius:6px;">
        <input id="destinatario-input" type="text" placeholder="Usuario destinatario" style="display:none;flex:1;min-width:200px;padding:8px;border:1px solid #cbd5e1;border-radius:6px;">
      </div>

      <div id="mensajes-lista" style="margin-bottom:10px;min-height:60px;background:#f9fafb;border-radius:6px;padding:8px;border:1px solid #e2e8f0;max-height:220px;overflow-y:auto;"></div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        <input id="mensaje-input" type="text" placeholder="Escribe un mensaje..." style="flex:1;min-width:220px;padding:8px;border:1px solid #cbd5e1;border-radius:6px;" />
        <button id="enviar-mensaje" style="padding:8px 14px;border-radius:6px;border:none;background:#3182ce;color:#fff;cursor:pointer;">Enviar</button>
        <button id="push-to-talk" style="padding:8px 14px;border-radius:6px;border:none;background:#ed8936;color:#fff;cursor:pointer;">Push to Talk</button>
      </div>

      <div id="audios-lista" style="margin-top:12px;min-height:40px;background:#f9fafb;border-radius:6px;padding:8px;border:1px solid #e2e8f0;max-height:160px;overflow-y:auto;"></div>
    </div>
  `;

  const aliasInput = document.getElementById('alias-input');
  const destinatarioInput = document.getElementById('destinatario-input');
  const mensajeInput = document.getElementById('mensaje-input');
  const normasDiv = document.getElementById('normas-grupal');
  const estadoRedDiv = document.getElementById('estado-red-walkie');
  const alertaRangoDiv = document.getElementById('alerta-rango-walkie');
  const panelTecnicoDiv = document.getElementById('panel-tecnico-walkie');
  const tituloWalkie = document.getElementById('walkie-titulo');

  function usuarioActual() {
    return aliasInput.value.trim() || 'Yo';
  }

  function alertaDonEloy(mensaje) {
    normasDiv.style.background = '#feb2b2';
    normasDiv.style.color = '#742a2a';
    normasDiv.innerHTML = `<b>Don Eloy:</b> ${mensaje}<br>Recuerda las normas del canal.`;
    setTimeout(() => {
      normasDiv.style.background = '#fefcbf';
      normasDiv.style.color = '#744210';
      normasDiv.innerHTML =
        '<b>Normas del canal grupal/SOS:</b><br>- Prohibido propaganda política e insultos.<br>- Don Eloy modera y puede bloquear mensajes ofensivos.<br>- Canal orientado a seguridad comunitaria y apoyo rural.<br>';
    }, 5000);
  }

  function obtenerContextoRed() {
    const usuariosConfigurados = Number(
      localStorage.getItem('melantia_mesh_usuarios_comunidad') || 0
    );
    const gruposConfigurados = Number(
      localStorage.getItem('melantia_mesh_grupos_cercanos') || 1
    );
    return {
      usuariosComunidad:
        usuariosConfigurados > 0
          ? usuariosConfigurados
          : Math.max(walkie.obtenerMensajes().length, 1),
      gruposCercanosActivos: gruposConfigurados,
      conectividad: navigator.onLine ? 'online' : 'offline',
      modoEmergencia: modo === 'grupal' && walkie.obtenerMensajes().length > 0,
      tipoFinca: configTecnica.tipoFinca,
      distanciaEstimadaMetros:
        configTecnica.distanciaEstimadaMetros > 0
          ? configTecnica.distanciaEstimadaMetros
          : undefined,
    };
  }

  function renderPanelTecnico() {
    panelTecnicoDiv.innerHTML = `
      <div style="border:1px dashed #8aa39a;background:#f3fbf7;border-radius:10px;padding:10px 12px;color:#244;">
        <div style="font-weight:700;margin-bottom:8px;">Panel técnico (oculto)</div>
        <div style="font-size:12px;margin-bottom:8px;">Uso interno de calibración en campo. Este panel no se muestra por defecto.</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;align-items:end;">
          <label style="display:flex;flex-direction:column;gap:4px;font-size:12px;">
            <span>Tipo de finca</span>
            <select id="walkie-tecnico-tipo" style="padding:6px;border:1px solid #c3d4cc;border-radius:6px;">
              <option value="pequena">Pequeña</option>
              <option value="mediana">Mediana</option>
              <option value="quebrada">Quebrada</option>
            </select>
          </label>
          <label style="display:flex;flex-direction:column;gap:4px;font-size:12px;">
            <span>Distancia estimada (m)</span>
            <input id="walkie-tecnico-distancia" type="number" min="1" max="200" placeholder="Auto" style="padding:6px;border:1px solid #c3d4cc;border-radius:6px;" />
          </label>
        </div>
        <div style="margin-top:8px;display:flex;gap:8px;">
          <button id="walkie-tecnico-aplicar" style="padding:6px 10px;border:none;border-radius:6px;background:#2f855a;color:#fff;cursor:pointer;">Aplicar</button>
          <button id="walkie-tecnico-reset" style="padding:6px 10px;border:1px solid #98ada2;border-radius:6px;background:#fff;color:#234;cursor:pointer;">Reset</button>
        </div>
      </div>
    `;

    const tipoSelect = document.getElementById('walkie-tecnico-tipo');
    const distanciaInput = document.getElementById('walkie-tecnico-distancia');
    tipoSelect.value = configTecnica.tipoFinca;
    distanciaInput.value =
      configTecnica.distanciaEstimadaMetros &&
      Number.isFinite(configTecnica.distanciaEstimadaMetros)
        ? String(configTecnica.distanciaEstimadaMetros)
        : '';

    document
      .getElementById('walkie-tecnico-aplicar')
      .addEventListener('click', async () => {
        configTecnica.tipoFinca = tipoSelect.value || 'pequena';
        const distancia = Number(distanciaInput.value || 0);
        configTecnica.distanciaEstimadaMetros =
          distancia > 0 ? distancia : null;
        await renderEstadoRed();
      });

    document
      .getElementById('walkie-tecnico-reset')
      .addEventListener('click', async () => {
        configTecnica.tipoFinca = 'pequena';
        configTecnica.distanciaEstimadaMetros = null;
        tipoSelect.value = 'pequena';
        distanciaInput.value = '';
        await renderEstadoRed();
      });
  }

  function togglePanelTecnico() {
    const visible = panelTecnicoDiv.style.display !== 'none';
    panelTecnicoDiv.style.display = visible ? 'none' : 'block';
    if (!visible) {
      renderPanelTecnico();
    }
  }

  // Acceso oculto:
  // - Triple clic sobre el titulo
  // - Tecla Ctrl+Shift+M
  let clicksTitulo = 0;
  let timerClicksTitulo = null;
  tituloWalkie.addEventListener('click', () => {
    clicksTitulo += 1;
    if (timerClicksTitulo) clearTimeout(timerClicksTitulo);
    timerClicksTitulo = setTimeout(() => {
      clicksTitulo = 0;
    }, 700);
    if (clicksTitulo >= 3) {
      clicksTitulo = 0;
      togglePanelTecnico();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'm') {
      event.preventDefault();
      togglePanelTecnico();
    }
  });

  function detectarAndroidConBridge() {
    if (typeof navigator === 'undefined' || typeof window === 'undefined') {
      return false;
    }
    const userAgent = String(navigator.userAgent || '').toLowerCase();
    const esAndroid = userAgent.includes('android');
    const bridge = window.MelantiaSignalBridge;
    const bridgeValido = Boolean(
      bridge && typeof bridge.getCurrentRSSI === 'function'
    );
    return esAndroid && bridgeValido;
  }

  const rssiRealActivo = detectarAndroidConBridge();

  // Mantener etapa actual: finca pequena como default fijo y mesh grande inactivo.
  actualizarConfigRedWalkie({
    tipoFinca: 'pequena',
    rssiRealHabilitado: rssiRealActivo,
    habilitarMeshPropietario: false,
  });

  if (
    rssiRealActivo &&
    typeof window !== 'undefined' &&
    window.MelantiaSignalBridge &&
    typeof window.MelantiaSignalBridge.startSignalMonitor === 'function'
  ) {
    window.MelantiaSignalBridge.startSignalMonitor().catch(() => {
      // Si falla el monitor nativo, se conserva el flujo de estimacion local.
    });
  }

  async function renderEstadoRed() {
    await networkManager.actualizarContexto(obtenerContextoRed());
    const estado = obtenerEstadoRedWalkie();
    const esMesh = estado.estrategiaActiva === 'mesh_propietario';
    const esBridgefy = estado.estrategiaActiva === 'bridgefy_ble';
    const color = esMesh ? '#7b1fa2' : esBridgefy ? '#1565c0' : '#546e7a';
    const fondo = esMesh ? '#f5e9ff' : esBridgefy ? '#eaf4ff' : '#eef2f5';
    const colorCalidad =
      estado.calidadEnlace === 'alta'
        ? '#2e7d32'
        : estado.calidadEnlace === 'media'
          ? '#ef6c00'
          : estado.calidadEnlace === 'baja'
            ? '#c62828'
            : '#607d8b';

    estadoRedDiv.innerHTML = `
      <div style="border-left:6px solid ${color};background:${fondo};padding:10px 12px;border-radius:8px;color:#223;">
        <div style="font-weight:700;">Transporte activo: ${estado.estrategiaActiva}</div>
        <div style="font-size:13px;margin-top:4px;">${estado.mensaje}</div>
        <div style="font-size:12px;margin-top:6px;color:#5e6d66;">Modo: ${estado.config.modoDespliegue} | Tipo finca: ${estado.tipoFinca} | Alcance objetivo: ${estado.config.alcanceObjetivoMetros} m | Usuarios comunidad: ${estado.usuariosComunidad}</div>
        <div style="font-size:12px;margin-top:4px;color:#5e6d66;">Grupos cercanos: ${estado.gruposCercanosActivos} | Mesh propietario: ${estado.config.habilitarMeshPropietario ? 'habilitado' : 'preparado, no activo'} | Umbral futuro mesh: ${estado.config.umbralUsuariosMesh}</div>
        <div style="margin-top:8px;font-size:12px;color:#334;display:flex;justify-content:space-between;gap:8px;">
          <span>Calidad estimada del enlace: <b style="color:${colorCalidad};text-transform:capitalize;">${estado.calidadEnlace.replace('_', ' ')}</b></span>
          <span>${estado.calidadPct}%</span>
        </div>
        <div style="margin-top:4px;height:8px;background:#dbe4de;border-radius:999px;overflow:hidden;">
          <div style="height:100%;width:${estado.calidadPct}%;background:${colorCalidad};"></div>
        </div>
        <div style="font-size:12px;margin-top:6px;color:#5e6d66;">Distancia estimada actual: ${estado.distanciaEstimadaMetros || estado.config.alcanceObjetivoMetros} m</div>
      </div>
    `;

    if (estado.alertaRangoActiva) {
      alertaRangoDiv.innerHTML = `
        <div style="border-left:6px solid #c62828;background:#fff3f3;color:#7a2020;padding:10px 12px;border-radius:8px;">
          <div style="font-weight:700;">Alerta de rango</div>
          <div style="font-size:13px;margin-top:4px;">El enlace está en calidad baja o cerca del límite operativo para esta finca. Acérquese o reduzca obstáculos para evitar pérdida de comunicación.</div>
        </div>
      `;
    } else {
      alertaRangoDiv.innerHTML = '';
    }
  }

  async function renderMensajes() {
    await walkie.cargarDesdeDB();
    const lista = document.getElementById('mensajes-lista');
    lista.innerHTML = walkie
      .obtenerMensajes()
      .slice(-20)
      .map((m, idx) => {
        const destino = m.destinatario ? ` -> ${m.destinatario}` : '';
        const badge =
          m.autor === walkie.moderador
            ? ' <span style="color:#ed8936;font-weight:bold;">[MOD]</span>'
            : '';
        const puedeEliminar = usuarioActual() === walkie.moderador;
        const eliminar = puedeEliminar
          ? ` <button data-idx="${idx}" class="btn-del-msg" style="color:#fff;background:#e53e3e;border:none;border-radius:4px;padding:2px 6px;cursor:pointer;">Eliminar</button>`
          : '';
        return `<div style="margin-bottom:6px;"><b>${m.autor}${destino}:</b>${badge} ${m.texto}${eliminar}</div>`;
      })
      .join('');

    lista.querySelectorAll('.btn-del-msg').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const idx = Number(btn.getAttribute('data-idx'));
        await walkie.eliminarMensaje(idx);
        await renderMensajes();
      });
    });
  }

  function renderAudios() {
    const lista = document.getElementById('audios-lista');
    lista.innerHTML = walkie
      .obtenerAudios()
      .map((a, idx) => {
        const destino = a.destinatario ? ` -> ${a.destinatario}` : '';
        return `<div style="margin-bottom:8px;"><b>${a.autor}${destino}:</b> <audio src="${a.blobUrl}" controls data-idx="${idx}"></audio></div>`;
      })
      .join('');

    lista.querySelectorAll('audio[data-idx]').forEach((audioEl) => {
      audioEl.addEventListener('play', () => {
        const idx = Number(audioEl.getAttribute('data-idx'));
        const audio = walkie.obtenerAudios()[idx];
        walkie.marcarAudioEscuchado(audio);
        setTimeout(() => {
          walkie.limpiarAudiosViejos();
          renderAudios();
        }, 30000);
      });
    });
  }

  function obtenerDestinoSiPrivado() {
    if (modo !== 'privado') return null;
    const destino = destinatarioInput.value.trim();
    if (!destino) {
      alert('Debes indicar el destinatario.');
      return '__ERROR__';
    }
    return destino;
  }

  document.querySelectorAll('input[name="modo"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      modo = e.target.value;
      const esGrupal = modo === 'grupal';
      normasDiv.style.display = esGrupal ? 'block' : 'none';
      destinatarioInput.style.display = esGrupal ? 'none' : 'block';
    });
  });

  document
    .getElementById('enviar-mensaje')
    .addEventListener('click', async () => {
      const texto = mensajeInput.value;
      const destino = obtenerDestinoSiPrivado();
      if (destino === '__ERROR__') return;

      const resultado = await walkie.agregarMensaje(
        texto,
        usuarioActual(),
        destino,
        modo
      );

      if (!resultado.ok && resultado.motivo === 'moderado') {
        alertaDonEloy('Mensaje bloqueado por contenido ofensivo o político.');
        mensajeInput.value = '';
        return;
      }
      if (!resultado.ok) return;

      await networkManager.enviar({
        tipo: 'texto',
        texto: resultado.mensaje.texto,
        autor: resultado.mensaje.autor,
        destinatario: resultado.mensaje.destinatario,
        canal: resultado.mensaje.canal,
      });

      mensajeInput.value = '';
      await renderMensajes();
      await renderEstadoRed();
    });

  document
    .getElementById('push-to-talk')
    .addEventListener('click', async () => {
      const destino = obtenerDestinoSiPrivado();
      if (destino === '__ERROR__') return;

      if (modo === 'grupal' && contienePalabrasProhibidas(mensajeInput.value)) {
        alertaDonEloy(
          'Audio bloqueado por contenido ofensivo o político en mensaje asociado.'
        );
        mensajeInput.value = '';
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        walkie.agregarAudio(url, usuarioActual(), destino, modo);
        await networkManager.enviar({
          tipo: 'audio',
          blob,
          autor: usuarioActual(),
          destinatario: destino,
          canal: modo,
        });
        renderAudios();
        await renderEstadoRed();
      };

      recorder.start();
      setTimeout(() => recorder.stop(), 3000);
    });

  walkie.cargarDesdeDB().then(() => {
    renderMensajes();
    renderAudios();
    renderEstadoRed();
  });
}

if (typeof window !== 'undefined') {
  window.WalkieTalkie = WalkieTalkie;
}
