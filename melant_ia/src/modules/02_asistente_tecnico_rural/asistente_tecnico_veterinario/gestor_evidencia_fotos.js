/**
 * gestor_evidencia_fotos.js
 * =========================
 * Gestión de evidencia fotográfica de trazabilidad para el
 * Asistente Técnico Veterinario de MELANTIA.
 *
 * Funciona 100% offline usando IndexedDB como almacén local.
 * Cuando hay internet, el módulo de sincronización sube las fotos pendientes.
 *
 * Animales soportados: bovino, porcino, avícola, equino.
 */

'use strict';

// ── Constantes ──────────────────────────────────────────────────────────────

const _STORE_FOTOS = 'evidencia_fotos';
const _STORE_ANIMALES = 'animales_local';
const _STORE_REPORTES = 'reportes_livianos';
const _STORE_MAPAS = 'mapas_gps_livianos';
const _DB_VERSION_FOTOS = 4; // v4 — WebP + thumbnail + purga + documentos/mapas ligeros
const _CLAVE_PRIVACIDAD_UBICACION = 'melantia_privacidad_ubicacion';
const _MODO_UBICACION_EXACTA = 'exacta';
const _MODO_UBICACION_APROXIMADA = 'aproximada';
const _MODO_UBICACION_PRIVADA = 'privada';

/** Límites de fotos por nivel de suscripción (null = ilimitado) */
const LIMITE_FOTOS = {
  basico: 2, // $10/mes — perfil + 1 evidencia
  pro: null, // $20/mes — álbum completo
  asociacion: null, // $25/mes — igual que pro
};

/** Etapas válidas del ciclo de vida del animal */
const ETAPAS = ['perfil', 'inicio', 'crecimiento', 'final'];

// ── QR local para ficha comercial ──────────────────────────────────────────

const _QR_VERSION = 5;
const _QR_SIZE = 17 + _QR_VERSION * 4;
const _QR_DATA_CODEWORDS = 108;
const _QR_ECC_CODEWORDS = 26;
const _QR_EXP = new Array(512).fill(0);
const _QR_LOG = new Array(256).fill(0);

(() => {
  let valor = 1;
  for (let i = 0; i < 255; i += 1) {
    _QR_EXP[i] = valor;
    _QR_LOG[valor] = i;
    valor <<= 1;
    if (valor & 0x100) valor ^= 0x11d;
  }
  for (let i = 255; i < _QR_EXP.length; i += 1) {
    _QR_EXP[i] = _QR_EXP[i - 255];
  }
})();

const _qrMul = (a, b) => {
  if (a === 0 || b === 0) return 0;
  return _QR_EXP[_QR_LOG[a] + _QR_LOG[b]];
};

const _qrPolyMul = (a, b) => {
  const resultado = new Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i += 1) {
    for (let j = 0; j < b.length; j += 1) {
      resultado[i + j] ^= _qrMul(a[i], b[j]);
    }
  }
  return resultado;
};

const _qrGeneratorPoly = (grado) => {
  let polinomio = [1];
  for (let i = 0; i < grado; i += 1) {
    polinomio = _qrPolyMul(polinomio, [1, _QR_EXP[i]]);
  }
  return polinomio;
};

const _qrRemainder = (datos, grado) => {
  const generador = _qrGeneratorPoly(grado);
  const resultado = datos.concat(new Array(grado).fill(0));
  for (let i = 0; i < datos.length; i += 1) {
    const factor = resultado[i];
    if (factor === 0) continue;
    for (let j = 0; j < generador.length; j += 1) {
      resultado[i + j] ^= _qrMul(generador[j], factor);
    }
  }
  return resultado.slice(-grado);
};

const _qrAgregarBits = (bits, valor, longitud) => {
  for (let i = longitud - 1; i >= 0; i -= 1) {
    bits.push((valor >>> i) & 1);
  }
};

const _qrCrearCodewords = (texto) => {
  const bytes = Array.from(new TextEncoder().encode(texto));
  if (bytes.length > 106) {
    throw new Error('El payload QR excede la capacidad del encoder local.');
  }

  const bits = [];
  _qrAgregarBits(bits, 0x4, 4);
  _qrAgregarBits(bits, bytes.length, 8);
  bytes.forEach((byte) => _qrAgregarBits(bits, byte, 8));

  const capacidad = _QR_DATA_CODEWORDS * 8;
  const terminador = Math.min(4, capacidad - bits.length);
  _qrAgregarBits(bits, 0, terminador);
  while (bits.length % 8 !== 0) bits.push(0);

  const datos = [];
  for (let i = 0; i < bits.length; i += 8) {
    let valor = 0;
    for (let j = 0; j < 8; j += 1) valor = (valor << 1) | bits[i + j];
    datos.push(valor);
  }

  const pads = [0xec, 0x11];
  let padIndex = 0;
  while (datos.length < _QR_DATA_CODEWORDS) {
    datos.push(pads[padIndex % pads.length]);
    padIndex += 1;
  }

  return datos.concat(_qrRemainder(datos, _QR_ECC_CODEWORDS));
};

const _qrNuevaMatriz = () =>
  Array.from({ length: _QR_SIZE }, () => Array(_QR_SIZE).fill(false));

const _qrNuevoMapa = () =>
  Array.from({ length: _QR_SIZE }, () => Array(_QR_SIZE).fill(false));

const _qrSetFuncion = (matriz, usadas, fila, col, valor) => {
  if (fila < 0 || col < 0 || fila >= _QR_SIZE || col >= _QR_SIZE) return;
  matriz[fila][col] = !!valor;
  usadas[fila][col] = true;
};

const _qrDibujarFinder = (matriz, usadas, fila, col) => {
  for (let dy = -1; dy <= 7; dy += 1) {
    for (let dx = -1; dx <= 7; dx += 1) {
      const y = fila + dy;
      const x = col + dx;
      const esBorde = dy === -1 || dy === 7 || dx === -1 || dx === 7;
      const esMarco = dy === 0 || dy === 6 || dx === 0 || dx === 6;
      const esCentro = dy >= 2 && dy <= 4 && dx >= 2 && dx <= 4;
      _qrSetFuncion(matriz, usadas, y, x, !esBorde && (esMarco || esCentro));
    }
  }
};

const _qrDibujarAlineacion = (matriz, usadas, centroFila, centroCol) => {
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      const borde = Math.max(Math.abs(dx), Math.abs(dy)) === 2;
      const centro = dx === 0 && dy === 0;
      _qrSetFuncion(
        matriz,
        usadas,
        centroFila + dy,
        centroCol + dx,
        borde || centro
      );
    }
  }
};

const _qrReservarFormato = (matriz, usadas) => {
  for (let i = 0; i <= 8; i += 1) {
    if (i !== 6) {
      _qrSetFuncion(matriz, usadas, 8, i, false);
      _qrSetFuncion(matriz, usadas, i, 8, false);
    }
  }
  for (let i = 0; i < 8; i += 1) {
    _qrSetFuncion(matriz, usadas, _QR_SIZE - 1 - i, 8, false);
    _qrSetFuncion(matriz, usadas, 8, _QR_SIZE - 1 - i, false);
  }
};

const _qrMascara0 = (fila, col) => (fila + col) % 2 === 0;

const _qrFormatoBits = (mascara) => {
  const nivelL = 1;
  let dato = (nivelL << 3) | mascara;
  let resto = dato;
  for (let i = 0; i < 10; i += 1) {
    resto = (resto << 1) ^ (((resto >>> 9) & 1) * 0x537);
  }
  return ((dato << 10) | resto) ^ 0x5412;
};

const _qrAplicarFormato = (matriz, usadas, mascara) => {
  const bits = _qrFormatoBits(mascara);
  const bit = (indice) => ((bits >>> indice) & 1) === 1;

  for (let i = 0; i <= 5; i += 1) _qrSetFuncion(matriz, usadas, 8, i, bit(i));
  _qrSetFuncion(matriz, usadas, 8, 7, bit(6));
  _qrSetFuncion(matriz, usadas, 8, 8, bit(7));
  _qrSetFuncion(matriz, usadas, 7, 8, bit(8));
  for (let i = 9; i < 15; i += 1) {
    _qrSetFuncion(matriz, usadas, 14 - i, 8, bit(i));
  }

  for (let i = 0; i < 8; i += 1) {
    _qrSetFuncion(matriz, usadas, _QR_SIZE - 1 - i, 8, bit(i));
  }
  for (let i = 8; i < 15; i += 1) {
    _qrSetFuncion(matriz, usadas, 8, _QR_SIZE - 15 + i, bit(i));
  }

  _qrSetFuncion(matriz, usadas, _QR_VERSION * 4 + 9, 8, true);
};

const _qrConstruirMatriz = (texto) => {
  const codewords = _qrCrearCodewords(texto);
  const bits = [];
  codewords.forEach((byte) => _qrAgregarBits(bits, byte, 8));

  const matriz = _qrNuevaMatriz();
  const usadas = _qrNuevoMapa();

  _qrDibujarFinder(matriz, usadas, 0, 0);
  _qrDibujarFinder(matriz, usadas, 0, _QR_SIZE - 7);
  _qrDibujarFinder(matriz, usadas, _QR_SIZE - 7, 0);
  _qrDibujarAlineacion(matriz, usadas, 30, 30);

  for (let i = 8; i < _QR_SIZE - 8; i += 1) {
    _qrSetFuncion(matriz, usadas, 6, i, i % 2 === 0);
    _qrSetFuncion(matriz, usadas, i, 6, i % 2 === 0);
  }

  _qrReservarFormato(matriz, usadas);

  let bitIndex = 0;
  let ascendente = true;
  for (let col = _QR_SIZE - 1; col >= 1; col -= 2) {
    if (col === 6) col -= 1;
    for (let offset = 0; offset < _QR_SIZE; offset += 1) {
      const fila = ascendente ? _QR_SIZE - 1 - offset : offset;
      for (let dx = 0; dx < 2; dx += 1) {
        const actualCol = col - dx;
        if (usadas[fila][actualCol]) continue;
        const bit = bitIndex < bits.length ? bits[bitIndex] === 1 : false;
        matriz[fila][actualCol] = _qrMascara0(fila, actualCol) ? !bit : bit;
        bitIndex += 1;
      }
    }
    ascendente = !ascendente;
  }

  _qrAplicarFormato(matriz, usadas, 0);
  return matriz;
};

const _qrMatrizASvg = (matriz, borde = 2) => {
  const comandos = [];
  for (let fila = 0; fila < matriz.length; fila += 1) {
    for (let col = 0; col < matriz.length; col += 1) {
      if (!matriz[fila][col]) continue;
      comandos.push(`M${col + borde},${fila + borde}h1v1h-1z`);
    }
  }
  const tam = matriz.length + borde * 2;
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${tam} ${tam}" shape-rendering="crispEdges" aria-label="Código QR de trazabilidad Melantia">
  <rect width="100%" height="100%" fill="#ffffff"></rect>
  <path d="${comandos.join(' ')}" fill="#173728"></path>
</svg>`;
};

const _crearQrSvgLocal = (payload) =>
  _qrMatrizASvg(_qrConstruirMatriz(payload));

// ── Clase principal ──────────────────────────────────────────────────────────

class GestorEvidenciaFotos {
  /**
   * @param {string} nivelSuscripcion  'basico' | 'pro' | 'asociacion'
   */
  constructor(nivelSuscripcion = 'basico') {
    this.nivel = nivelSuscripcion.toLowerCase();
    this._db = null;
  }

  // ------------------------------------------------------------------
  // INICIALIZACIÓN / IndexedDB
  // ------------------------------------------------------------------

  /** Abre (o crea) la base de datos IndexedDB. Llama antes de usar cualquier método. */
  async inicializar() {
    if (this._db) return;
    this._db = await new Promise((resolve, reject) => {
      const req = indexedDB.open('melantia_fotos', _DB_VERSION_FOTOS);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        const tx = e.target.transaction;

        // === v1: stores base ===
        let fotoStore;
        if (!db.objectStoreNames.contains(_STORE_FOTOS)) {
          fotoStore = db.createObjectStore(_STORE_FOTOS, {
            keyPath: 'id',
            autoIncrement: true,
          });
          fotoStore.createIndex('idx_animal', 'id_animal', { unique: false });
          fotoStore.createIndex('idx_etapa', 'etapa', { unique: false });
          fotoStore.createIndex('idx_sync', 'pendiente_sync', {
            unique: false,
          });
          fotoStore.createIndex('idx_animal_etapa', ['id_animal', 'etapa'], {
            unique: false,
          });
        } else {
          fotoStore = tx.objectStore(_STORE_FOTOS);
        }

        if (!db.objectStoreNames.contains(_STORE_ANIMALES)) {
          db.createObjectStore(_STORE_ANIMALES, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(_STORE_REPORTES)) {
          const reportes = db.createObjectStore(_STORE_REPORTES, {
            keyPath: 'id',
            autoIncrement: true,
          });
          reportes.createIndex('idx_tipo', 'tipo', { unique: false });
          reportes.createIndex('idx_animal', 'id_animal', { unique: false });
        }

        if (!db.objectStoreNames.contains(_STORE_MAPAS)) {
          const mapas = db.createObjectStore(_STORE_MAPAS, {
            keyPath: 'id',
            autoIncrement: true,
          });
          mapas.createIndex('idx_lote', 'id_lote', { unique: false });
          mapas.createIndex('idx_tipo', 'tipo', { unique: false });
        }

        // === v2: índice por lote (Prueba de Origen GPS) ===
        if (!fotoStore.indexNames.contains('idx_lote')) {
          fotoStore.createIndex('idx_lote', 'id_lote', { unique: false });
        }

        // === v3: sincronización visible + purga segura ===
        if (!fotoStore.indexNames.contains('idx_sincronizado')) {
          fotoStore.createIndex('idx_sincronizado', 'sincronizado', {
            unique: false,
          });
        }
      };

      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  // ------------------------------------------------------------------
  // HELPERS INTERNOS
  // ------------------------------------------------------------------

  async _contarFotos(idAnimal) {
    const store = this._tx(_STORE_FOTOS, 'readonly');
    return new Promise((resolve, reject) => {
      const req = store.index('idx_animal').count(IDBKeyRange.only(idAnimal));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  _tx(storeName, modo = 'readwrite') {
    return this._db.transaction([storeName], modo).objectStore(storeName);
  }

  async _guardarRegistroLigero(storeName, payload, opciones = {}) {
    await this.inicializar();
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      const reqAll = store.getAll();

      reqAll.onsuccess = () => {
        const existentes = reqAll.result || [];
        const duplicados =
          typeof opciones.esDuplicado === 'function'
            ? existentes.filter((registro) =>
                opciones.esDuplicado(registro, payload)
              )
            : [];

        duplicados.forEach((registro) => {
          if (registro?.id != null) store.delete(registro.id);
        });

        const req = store.add(payload);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      };

      reqAll.onerror = () => reject(reqAll.error);
    });
  }

  async _leerTodosStore(storeName) {
    await this.inicializar();
    return new Promise((resolve, reject) => {
      const req = this._tx(storeName, 'readonly').getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  _estimarBytesLocal(dataUrl) {
    const valor = String(dataUrl || '');
    if (!valor) return 0;
    if (valor.startsWith('data:')) {
      const base64 = valor.split(',')[1] || '';
      return Math.floor((base64.length * 3) / 4);
    }
    return valor.length;
  }

  _normalizarModoUbicacion(modo) {
    const valor = String(modo || '')
      .trim()
      .toLowerCase();
    if (valor === _MODO_UBICACION_APROXIMADA) return _MODO_UBICACION_APROXIMADA;
    if (valor === _MODO_UBICACION_PRIVADA) return _MODO_UBICACION_PRIVADA;
    return _MODO_UBICACION_EXACTA;
  }

  obtenerConfiguracionPrivacidadUbicacion() {
    try {
      const raw = localStorage.getItem(_CLAVE_PRIVACIDAD_UBICACION);
      const data = raw ? JSON.parse(raw) : {};
      return {
        modo: this._normalizarModoUbicacion(data?.modo),
      };
    } catch {
      return {
        modo: _MODO_UBICACION_EXACTA,
      };
    }
  }

  guardarConfiguracionPrivacidadUbicacion(config = {}) {
    const siguiente = {
      modo: this._normalizarModoUbicacion(config?.modo),
    };
    localStorage.setItem(
      _CLAVE_PRIVACIDAD_UBICACION,
      JSON.stringify(siguiente)
    );
    return siguiente;
  }

  _resolverZonaAproximada(datosAnimal = {}) {
    const piezas = [
      datosAnimal.vereda,
      datosAnimal.recinto,
      datosAnimal.parroquia,
      datosAnimal.municipio,
      datosAnimal.canton,
      datosAnimal.provincia,
    ]
      .map((valor) => String(valor || '').trim())
      .filter(Boolean);

    return piezas.length ? piezas.join(' / ') : 'Zona rural verificada';
  }

  _resolverSeguridadUbicacion(
    datosAnimal,
    origenGPS,
    origenNombre,
    opciones = {}
  ) {
    const preferencia = this.obtenerConfiguracionPrivacidadUbicacion();
    const modo = this._normalizarModoUbicacion(
      typeof opciones.incluirGPS === 'boolean'
        ? opciones.incluirGPS
          ? _MODO_UBICACION_EXACTA
          : _MODO_UBICACION_PRIVADA
        : opciones.modoUbicacion || preferencia.modo
    );
    const zonaAproximada =
      String(opciones.ubicacionAproximada || '').trim() ||
      this._resolverZonaAproximada(datosAnimal);
    const coordenadasExactas = origenGPS
      ? `${origenGPS.latitud.toFixed(5)}, ${origenGPS.longitud.toFixed(5)}`
      : null;

    if (modo === _MODO_UBICACION_EXACTA && coordenadasExactas) {
      return {
        modo,
        nombreUbicacion: origenNombre,
        gpsFact: coordenadasExactas,
        qrGps: `${origenGPS.latitud.toFixed(5)},${origenGPS.longitud.toFixed(5)}`,
        gpsResumen: `${origenNombre} (${coordenadasExactas})`,
        gpsTimeline: (f) =>
          f.latitud != null
            ? `GPS ${f.latitud.toFixed(5)}, ${f.longitud.toFixed(5)}`
            : '',
        tablaHtml: null,
        verificacionTexto: coordenadasExactas,
        confianzaTexto:
          'Ubicación exacta compartida con permiso del productor.',
      };
    }

    if (modo === _MODO_UBICACION_APROXIMADA) {
      return {
        modo,
        nombreUbicacion: zonaAproximada,
        gpsFact: 'Ubicación aproximada',
        qrGps: `aprox:${zonaAproximada}`,
        gpsResumen: `${zonaAproximada} (ubicación aproximada)`,
        gpsTimeline: () => `Zona aproximada: ${zonaAproximada}`,
        tablaHtml:
          '<tr><td colspan="5">Ubicación exacta protegida. Melantia solo comparte la zona aproximada autorizada por el productor.</td></tr>',
        verificacionTexto: `Ubicación aproximada: ${zonaAproximada}`,
        confianzaTexto:
          'Ubicación protegida: se comparte solo vereda, parroquia o municipio.',
      };
    }

    return {
      modo: _MODO_UBICACION_PRIVADA,
      nombreUbicacion: 'Verificada por Melantia (Privada)',
      gpsFact: 'Protegido por seguridad',
      qrGps: 'privado',
      gpsResumen: 'Verificada por Melantia (Privada)',
      gpsTimeline: () => 'GPS protegido por seguridad',
      tablaHtml:
        '<tr><td colspan="5">Coordenadas ocultas por seguridad del productor. Melantia conserva el registro interno para respaldo legal.</td></tr>',
      verificacionTexto: 'Verificada por Melantia (Privada)',
      confianzaTexto:
        'Las coordenadas exactas quedan guardadas solo dentro de la app del productor.',
    };
  }

  _leerConfigSupabase(config = null) {
    const externa =
      config ||
      window.MELANTIA_SUPABASE_CONFIG ||
      (() => {
        try {
          const raw = localStorage.getItem('melantia_supabase_config');
          return raw ? JSON.parse(raw) : null;
        } catch {
          return null;
        }
      })();

    if (!externa?.url || !externa?.anonKey || !externa?.bucket) return null;

    return {
      url: String(externa.url).replace(/\/$/, ''),
      anonKey: externa.anonKey,
      bucket: externa.bucket,
      table: externa.table || null,
      schema: externa.schema || 'public',
      pathPrefix: externa.pathPrefix || 'trazabilidad',
      upsert: externa.upsert !== false,
    };
  }

  _dataUrlToBlob(dataUrl) {
    const [cabecera, contenido] = String(dataUrl || '').split(',');
    if (!cabecera || !contenido) {
      throw new Error('Formato de imagen local inválido para sincronización.');
    }
    const mime = (cabecera.match(/data:(.*?);base64/) || [])[1] || 'image/jpeg';
    const binario = atob(contenido);
    const bytes = new Uint8Array(binario.length);
    for (let i = 0; i < binario.length; i += 1)
      bytes[i] = binario.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  _crearRutaSupabase(registro, extension = 'webp', config) {
    const fecha = (
      registro.fecha_toma || new Date().toISOString().slice(0, 10)
    ).replace(/-/g, '');
    const carpeta = config.pathPrefix || 'trazabilidad';
    return [
      carpeta,
      `animal_${registro.id_animal}`,
      `${registro.etapa}_${registro.id_animal}_${fecha}_${registro.id}.${extension}`,
    ].join('/');
  }

  async _fetchSupabase(url, opciones = {}, timeoutMs = 20000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      return await fetch(url, { ...opciones, signal: ctrl.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  async _subirBlobASupabase(registro, dataUrl, config) {
    const blob = this._dataUrlToBlob(dataUrl);
    const extension =
      blob.type === 'image/webp'
        ? 'webp'
        : blob.type === 'image/png'
          ? 'png'
          : 'jpg';
    const ruta = this._crearRutaSupabase(registro, extension, config);
    const endpoint = `${config.url}/storage/v1/object/${config.bucket}/${ruta}`;
    const resp = await this._fetchSupabase(endpoint, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        'Content-Type': blob.type || 'application/octet-stream',
        'x-upsert': config.upsert ? 'true' : 'false',
      },
      body: blob,
    });

    if (!resp.ok) {
      const detalle = await resp.text().catch(() => '');
      throw new Error(`Supabase Storage respondió ${resp.status}: ${detalle}`);
    }

    return {
      ruta,
      publicUrl: `${config.url}/storage/v1/object/public/${config.bucket}/${ruta}`,
    };
  }

  async _sincronizarMetadataSupabase(payload, config) {
    if (!config.table) return true;
    const endpoint = `${config.url}/rest/v1/${config.table}`;
    const resp = await this._fetchSupabase(endpoint, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const detalle = await resp.text().catch(() => '');
      throw new Error(`Supabase REST respondió ${resp.status}: ${detalle}`);
    }
    return true;
  }

  /** Genera una versión liviana en WebP/JPEG y una miniatura extrema para offline. */
  async _procesarImagen(blob, opciones = {}) {
    const {
      maxKb = 150,
      maxDimension = 1280,
      thumbKb = 10,
      thumbDimension = 320,
    } = opciones;

    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const dibujar = (ancho, alto) => {
          const canvas = document.createElement('canvas');
          canvas.width = ancho;
          canvas.height = alto;
          canvas.getContext('2d').drawImage(img, 0, 0, ancho, alto);
          return canvas;
        };

        const exportar = (canvas, objetivoKb, tipoPreferido) =>
          new Promise((resolver) => {
            const tipos = [tipoPreferido, 'image/jpeg'];
            const intentarTipo = (tipoIndex, calidad = 0.82) => {
              const mime = tipos[tipoIndex] || 'image/jpeg';
              canvas.toBlob(
                (resultado) => {
                  if (!resultado) {
                    if (tipoIndex < tipos.length - 1) {
                      intentarTipo(tipoIndex + 1, 0.82);
                      return;
                    }
                    resolver({
                      blob: blob,
                      mimeType: blob.type || 'image/jpeg',
                    });
                    return;
                  }

                  if (resultado.size > objetivoKb * 1024 && calidad > 0.38) {
                    intentarTipo(tipoIndex, calidad - 0.08);
                    return;
                  }

                  if (
                    resultado.size > objetivoKb * 1024 &&
                    tipoIndex < tipos.length - 1
                  ) {
                    intentarTipo(tipoIndex + 1, 0.82);
                    return;
                  }

                  resolver({ blob: resultado, mimeType: mime });
                },
                mime,
                calidad
              );
            };
            intentarTipo(0);
          });

        const canvasPrincipal = dibujar(width, height);
        const thumbRatio = Math.min(
          thumbDimension / width,
          thumbDimension / height,
          1
        );
        const thumbWidth = Math.max(96, Math.round(width * thumbRatio));
        const thumbHeight = Math.max(96, Math.round(height * thumbRatio));
        const canvasThumb = dibujar(thumbWidth, thumbHeight);

        Promise.all([
          exportar(canvasPrincipal, maxKb, 'image/webp'),
          exportar(canvasThumb, thumbKb, 'image/webp'),
        ]).then(async ([principal, thumb]) => {
          resolve({
            blob: principal.blob,
            mimeType: principal.mimeType,
            thumbnailBlob: thumb.blob,
            thumbnailMimeType: thumb.mimeType,
          });
        });
      };
      img.src = url;
    });
  }

  // ------------------------------------------------------------------
  // REGISTRO DE EVIDENCIA (método principal)
  // ------------------------------------------------------------------

  /**
   * Guarda la referencia de una foto capturada con el estado del animal.
   *
   * @param {string|number} idAnimal   ID del animal en la BD.
   * @param {File|Blob}     archivoFoto Objeto File/Blob de la imagen.
   * @param {string}        etapa       'perfil'|'inicio'|'crecimiento'|'final'
   * @param {number}        peso        Peso estimado del animal en kg (0 = sin dato).
   * @param {string}        [fecha]     YYYY-MM-DD. Por defecto hoy.
   * @returns {Promise<{success:boolean, id?:number, mensaje:string}>}
   */
  async registrarEvidenciaFoto(
    idAnimal,
    archivoFoto,
    etapa = 'crecimiento',
    peso = 0,
    fecha = null,
    geoMeta = {}
  ) {
    await this.inicializar();

    if (!ETAPAS.includes(etapa)) {
      return {
        success: false,
        mensaje: `Etapa inválida: '${etapa}'. Use: ${ETAPAS.join(', ')}`,
      };
    }

    const limite = LIMITE_FOTOS[this.nivel];
    if (limite !== null) {
      const actual = await this._contarFotos(idAnimal);
      if (actual >= limite) {
        return {
          success: false,
          mensaje:
            `Límite de ${limite} foto(s) alcanzado para el plan '${this.nivel}'. ` +
            'Actualice al plan Pro para el Álbum de Trazabilidad completo.',
        };
      }
    }

    const procesada = await this._procesarImagen(archivoFoto);
    const fechaToma = fecha || new Date().toISOString().slice(0, 10);
    const extension = procesada.mimeType === 'image/webp' ? 'webp' : 'jpg';
    const rutaLocal = `animal_${idAnimal}_${etapa}_${fechaToma.replace(/-/g, '')}_${Date.now()}.${extension}`;
    const b64 = await this._blobToBase64(procesada.blob);
    const thumb64 = await this._blobToBase64(procesada.thumbnailBlob);

    const registro = {
      id_animal: idAnimal,
      url_foto: b64, // versión ligera local para trabajo offline inmediato
      url_thumb: thumb64,
      ruta_local: rutaLocal,
      etapa,
      fecha_toma: fechaToma,
      peso_estimado: peso || null,
      mime_type: procesada.mimeType,
      thumb_mime_type: procesada.thumbnailMimeType,
      id_lote: geoMeta.idLote ?? null,
      latitud: geoMeta.latitud ?? null,
      longitud: geoMeta.longitud ?? null,
      precision_gps_m: geoMeta.precision_m ?? null,
      pendiente_sync: 1, // 1 = pendiente subir a nube
      sincronizado: 0,
      purga_pendiente: 0,
      url_nube: null,
    };

    const id = await new Promise((resolve, reject) => {
      const req = this._tx(_STORE_FOTOS).add(registro);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    const gpsTexto =
      geoMeta.latitud != null
        ? ` Coordenadas GPS: ${geoMeta.latitud.toFixed(6)}, ${geoMeta.longitud.toFixed(6)}.`
        : '';
    console.log(
      `✅ Evidencia '${etapa}' guardada — animal ${idAnimal}, ID ${id}${gpsTexto}`
    );
    return {
      success: true,
      id,
      mensaje:
        `Evidencia de etapa '${etapa}' guardada correctamente en formato liviano.` +
        (peso ? ` Peso registrado: ${peso} kg.` : '') +
        gpsTexto,
    };
  }

  // ------------------------------------------------------------------
  // GALERÍA DE TRAZABILIDAD
  // ------------------------------------------------------------------

  /**
   * Devuelve todas las fotos del animal ordenadas cronológicamente.
   * Cada item incluye url_foto (base64) lista para mostrar en <img src=...>.
   *
   * @param {string|number} idAnimal
   * @returns {Promise<Array>}
   */
  async obtenerGaleria(idAnimal) {
    await this.inicializar();
    return new Promise((resolve, reject) => {
      const req = this._tx(_STORE_FOTOS, 'readonly')
        .index('idx_animal')
        .getAll(IDBKeyRange.only(idAnimal));
      req.onsuccess = () => {
        const fotos = (req.result || [])
          .sort((a, b) => {
            const orden = { perfil: 0, inicio: 1, crecimiento: 2, final: 3 };
            const o = (orden[a.etapa] ?? 9) - (orden[b.etapa] ?? 9);
            return o !== 0 ? o : a.fecha_toma.localeCompare(b.fecha_toma);
          })
          .map((foto) => {
            const urlMostrar =
              navigator.onLine && foto.url_nube
                ? foto.url_nube
                : foto.url_foto || foto.url_thumb || foto.url_nube || '';
            return {
              ...foto,
              url_foto: urlMostrar,
              url_full_local: foto.url_foto || null,
              url_thumb: foto.url_thumb || null,
            };
          });
        resolve(fotos);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async _persistirFichaLigera(datosAnimal, ficha) {
    const nombreBase =
      datosAnimal.identificacion ||
      datosAnimal.nombre ||
      `animal_${datosAnimal.id}`;
    const payload = {
      tipo: 'ficha_venta',
      id_animal: datosAnimal.id,
      nombre_archivo: `${nombreBase}_ficha_melantia.html`,
      mime_type: 'text/html',
      contenido: ficha.html,
      resumen: ficha.resumenTexto,
      created_at: new Date().toISOString(),
    };
    const id = await this._guardarRegistroLigero(_STORE_REPORTES, payload, {
      esDuplicado: (registro, nuevo) =>
        registro?.tipo === nuevo.tipo &&
        registro?.id_animal === nuevo.id_animal,
    });
    return {
      id,
      ...payload,
    };
  }

  async _persistirDocumentoLegal(payload) {
    const id = await this._guardarRegistroLigero(_STORE_REPORTES, payload, {
      esDuplicado: (registro, nuevo) =>
        registro?.tipo === nuevo.tipo &&
        String(registro?.id_lote ?? '') === String(nuevo.id_lote ?? ''),
    });
    return { id, ...payload };
  }

  async _hashTexto(texto) {
    const contenido = String(texto || '');
    if (globalThis.crypto?.subtle) {
      const bytes = new TextEncoder().encode(contenido);
      const hash = await crypto.subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }

    let hash = 0;
    for (let i = 0; i < contenido.length; i += 1) {
      hash = (hash << 5) - hash + contenido.charCodeAt(i);
      hash |= 0;
    }
    return `fallback-${Math.abs(hash)}`;
  }

  async obtenerResumenParaLegal(idLote) {
    const tablero = await this.obtenerTableroControl();
    const lote = tablero.lotes.find(
      (item) => String(item.id_lote) === String(idLote)
    );
    if (!lote) {
      throw new Error(`No existe un lote registrado con ID ${idLote}.`);
    }

    const tipoLote = lote.tipo_lote || 'pecuario';
    const esAgricola = tipoLote === 'agricola';
    const privacidad = this.obtenerConfiguracionPrivacidadUbicacion();
    const fichaLigera = lote.ficha_ligera || null;
    const mapaLigero = lote.mapa_ligero || null;
    const mapaData = this._leerMapaLigero(mapaLigero);
    const metaMapa = mapaData.meta || {};
    const fechaRevision =
      lote.ultima_foto_iso ||
      mapaLigero?.created_at ||
      new Date().toISOString();
    const ubicacion =
      privacidad.modo === 'privada'
        ? 'Verificada por Melantia (Privada)'
        : privacidad.modo === 'aproximada'
          ? metaMapa.cultivo || lote.nombre_lote
          : metaMapa.nombre_lote || lote.nombre_lote;

    const descripcion = esAgricola
      ? `${lote.cultivo || 'Cultivo'} en ${lote.nombre_lote}, área estimada ${Number(lote.area_ha || 0).toFixed(2)} ha, cosecha ${lote.cosecha_estimada || 'pendiente'}.`
      : `${lote.nombre_lote}, ${lote.poblacion} animal(es), etapa ${lote.ultima_etapa || 'activa'}, trazabilidad visual disponible.`;

    return {
      ...lote,
      tipo_lote: tipoLote,
      esAgricola,
      privacidad,
      descripcion,
      fechaUltimaRevision: fechaRevision,
      coordenadas: ubicacion,
      fichaLigera,
      mapaLigero,
      estadoSanitario: esAgricola
        ? lote.alerta_tecnica ||
          'Fitosanidad sin hallazgos críticos registrados.'
        : 'Revisión sanitaria respaldada por el registro técnico de MELANTIA.',
      evidenciaNube:
        lote.estado_sincronizacion === '📱 Solo Local'
          ? 'Pendiente de respaldo en nube del usuario.'
          : 'Disponible en nube MELANTIA del usuario.',
    };
  }

  _insertarClausulaTrazabilidad(cuerpoHtml, datosLote, hashSeguridad) {
    const clausula = `
      <section>
        <h2>CLÁUSULA QUINTA: RESPALDO DE TRAZABILIDAD DIGITAL</h2>
        <p>Las partes aceptan que el historial de vida, sanidad y manejo del producto descrito en este documento ha sido registrado mediante la plataforma <strong>MELANTIA IA</strong>.</p>
        <p>Ambas partes reconocen como evidencia válida e inalterable el registro de evidencia fotográfica, las fechas de captura, los registros sanitarios o fitosanitarios y los metadatos de tiempo y ubicación asociados al lote <strong>${datosLote.nombre_lote}</strong> con identificador <strong>${datosLote.id_lote}</strong>.</p>
        <p>Cualquier reclamación sobre el estado del producto deberá contrastarse contra el historial digital resguardado por el productor y su respaldo en nube, el cual sirve como garantía de cumplimiento de las buenas prácticas ${datosLote.esAgricola ? 'agrícolas' : 'pecuarias'}.</p>
        <div class="hash"><strong>Certificado de Trazabilidad MELANTIA:</strong><br>#${hashSeguridad}<br>Evidencias técnicas disponibles para auditoría bajo autorización del productor.</div>
      </section>
    `;

    return `${cuerpoHtml}${clausula}`;
  }

  _formatearUbicacionLegal(resumen) {
    if (resumen.privacidad?.modo === 'privada') {
      return 'Protegida por Seguridad (Oculta)';
    }

    if (resumen.privacidad?.modo === 'aproximada') {
      return `Protegida por Seguridad (Referencia aproximada: ${resumen.coordenadas})`;
    }

    return resumen.coordenadas;
  }

  _renderizarFirmaVectorialHtml(
    etiqueta,
    firmaVector,
    firmaFallback,
    firmante
  ) {
    if (!firmaVector?.strokes?.length) {
      return `<div class="firma"><strong>${etiqueta}</strong><br>${firmante}<br>${firmaFallback}</div>`;
    }

    const ancho = 240;
    const alto = 92;
    const trazosSvg = firmaVector.strokes
      .filter((trazo) => Array.isArray(trazo) && trazo.length)
      .map((trazo) => {
        const d = trazo
          .map((punto, indice) => {
            const x = Number(punto.x || 0) * ancho;
            const y = Number(punto.y || 0) * alto;
            return `${indice === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
          })
          .join(' ');
        return `<path d="${d}" fill="none" stroke="#173728" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"></path>`;
      })
      .join('');

    const selloHora =
      firmaVector.firmadoEn ||
      firmaVector.selloInterno?.timestamp ||
      'Sin sello horario';
    const selloGps = firmaVector.selloInterno?.gpsDisponible
      ? 'GPS interno registrado por MELANTIA'
      : 'GPS interno no disponible';

    return `<div class="firma"><strong>${etiqueta}</strong><br>${firmante}<br><svg viewBox="0 0 ${ancho} ${alto}" width="240" height="92" aria-label="Firma vectorial ${etiqueta}" style="display:block;margin-top:8px;background:#fff;border:1px solid #d7e2da;border-radius:10px">${trazosSvg}</svg><div class="firma-meta">Firma vectorial MELANTIA · ${selloHora}<br>${selloGps}</div></div>`;
  }

  _obtenerMarcaRanchoDocumento() {
    try {
      const raw = globalThis.localStorage?.getItem('melantia_marca_rancho');
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
  }

  async generarDocumentoLegalLote(
    idLote,
    tipoDocumento,
    datosPartes = {},
    opciones = {}
  ) {
    const resumen = await this.obtenerResumenParaLegal(idLote);
    const ahora = new Date();
    const fechaFormal = ahora.toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const horaFormal = ahora.toLocaleTimeString('es-EC');
    const productor = datosPartes.productor || 'Productor MELANTIA';
    const comprador = datosPartes.comprador || 'Comprador pendiente';
    const compradorId = datosPartes.identificacionComprador || 'Pendiente';
    const monto = datosPartes.monto || 'Pendiente';
    const vencimiento = datosPartes.vencimiento || 'Pendiente';
    const firmaComprador =
      datosPartes.firmaComprador || '________________________';
    const firmaVendedor =
      datosPartes.firmaVendedor || '________________________';
    const firmaCompradorVector = datosPartes.firmaCompradorVector || null;
    const firmaVendedorVector = datosPartes.firmaVendedorVector || null;
    const marcaRancho = this._obtenerMarcaRanchoDocumento();
    const ubicacionLegal = this._formatearUbicacionLegal(resumen);
    const hashTrazabilidad = await this._hashTexto(
      [
        resumen.id_lote,
        resumen.nombre_lote,
        resumen.descripcion,
        resumen.coordenadas,
        resumen.estadoSanitario,
        resumen.fechaUltimaRevision,
        resumen.evidenciaNube,
        JSON.stringify(firmaCompradorVector || {}),
        JSON.stringify(firmaVendedorVector || {}),
      ].join('|')
    );
    const titulo =
      tipoDocumento === 'acta_entrega'
        ? 'ACTA DE ENTREGA Y RECEPCION'
        : tipoDocumento === 'pagare'
          ? 'PAGARE Y COMPROMISO DE PAGO'
          : `CONTRATO DE COMPRA-VENTA ${resumen.esAgricola ? 'AGRICOLA' : 'PECUARIA'}`;

    const cuerpo =
      tipoDocumento === 'acta_entrega'
        ? `
          <h2>Objeto de entrega</h2>
          <p>En esta fecha se entrega el lote <strong>${resumen.nombre_lote}</strong> al comprador <strong>${comprador}</strong>.</p>
          <p>Descripción técnica: ${resumen.descripcion}</p>
          <p>Hora exacta de entrega: ${horaFormal}. Ubicación GPS: ${ubicacionLegal}.</p>
          <p>Evidencia visual: ${resumen.evidenciaNube}</p>
          <p>El comprador declara haber recibido el producto en el estado descrito por MELANTIA IA.</p>
        `
        : tipoDocumento === 'pagare'
          ? `
            <h2>Reconocimiento de deuda</h2>
            <p>Yo, <strong>${comprador}</strong>, identificado con <strong>${compradorId}</strong>, reconozco adeudar al productor <strong>${productor}</strong> la suma de <strong>${monto}</strong>, derivada de la operación sobre <strong>${resumen.nombre_lote}</strong>.</p>
            <p>Vencimiento pactado: <strong>${vencimiento}</strong>.</p>
            <p>Referencia técnica del lote: ${resumen.descripcion}</p>
            <p>Garantía de origen y trazabilidad: Ubicación GPS ${ubicacionLegal}. Estado verificado: ${resumen.estadoSanitario}</p>
          `
          : `
            <h2>Partes</h2>
            <p><strong>Vendedor:</strong> ${productor}</p>
            <p><strong>Comprador:</strong> ${comprador}</p>
            <h2>Objeto</h2>
            <p>${resumen.descripcion}</p>
            <h2>Trazabilidad verificada</h2>
            <ul>
              <li>Registro fotográfico: ${resumen.evidenciaNube}</li>
              <li>Ubicación GPS: ${ubicacionLegal}</li>
              <li>Estado sanitario o fitosanitario: ${resumen.estadoSanitario}</li>
              <li>Última revisión: ${resumen.fechaUltimaRevision}</li>
            </ul>
            <h2>Cláusulas</h2>
            <ol>
              <li>El vendedor garantiza que el lote corresponde con la información técnica registrada en MELANTIA IA.</li>
              <li>La privacidad geográfica se respeta según la configuración elegida por el productor.</li>
              <li>Cualquier alteración posterior del documento invalida su huella digital jurídica.</li>
            </ol>
          `;

    const cuerpoConClausula =
      tipoDocumento === 'contrato_venta' || tipoDocumento === 'acta_entrega'
        ? this._insertarClausulaTrazabilidad(cuerpo, resumen, hashTrazabilidad)
        : cuerpo;

    const textoBase = `${titulo}\nMarca del rancho: ${marcaRancho.nombreMarca || 'No configurada'}\nSlogan: ${marcaRancho.slogan || 'No configurado'}\nFecha: ${fechaFormal} ${horaFormal}\nLote: ${resumen.nombre_lote}\nDescripción: ${resumen.descripcion}\nUbicación GPS: ${ubicacionLegal}\nEstado: ${resumen.estadoSanitario}\nProductor: ${productor}\nComprador: ${comprador}\nMonto: ${monto}\nVencimiento: ${vencimiento}`;
    const hash = await this._hashTexto(
      `${textoBase}\n${tipoDocumento}\n${hashTrazabilidad}\n${JSON.stringify({
        firmaCompradorVector,
        firmaVendedorVector,
      })}`
    );
    const nombreArchivo = `${tipoDocumento}_${String(idLote).replace(/\s+/g, '_')}.html`;
    const firmaVendedorHtml = this._renderizarFirmaVectorialHtml(
      'Vendedor',
      firmaVendedorVector,
      firmaVendedor,
      productor
    );
    const firmaCompradorHtml = this._renderizarFirmaVectorialHtml(
      'Comprador',
      firmaCompradorVector,
      firmaComprador,
      comprador
    );
    const bloqueMarcaRancho =
      marcaRancho.nombreMarca || marcaRancho.slogan || marcaRancho.logoDataUrl
        ? `<div style="display:inline-flex;gap:8px;align-items:center;padding:4px 8px;border:1px solid #dbe7de;border-radius:999px;background:#f7faf8;margin-left:8px;vertical-align:middle">${marcaRancho.logoDataUrl ? `<img src="${marcaRancho.logoDataUrl}" alt="Marca del rancho" style="max-width:28px;max-height:28px;border-radius:8px;border:1px solid #d7e2da;background:#fff;padding:2px;object-fit:contain" />` : ''}<div>${marcaRancho.nombreMarca ? `<div style="font-size:12px;font-weight:700;color:#243b2d;line-height:1.1">${marcaRancho.nombreMarca}</div>` : ''}</div></div>`
        : '';
    const html = `<!doctype html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${titulo}</title><style>body{font-family:Georgia,serif;background:#f6f4ef;color:#1b1b1b;margin:0;padding:24px;line-height:1.55}.doc{max-width:820px;margin:0 auto;background:#fff;padding:28px;border:1px solid #ddd3c6;box-shadow:0 10px 30px rgba(0,0,0,.08)}.marca{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;border-bottom:2px solid #d7cebe;padding-bottom:14px;margin-bottom:18px}.sello{display:inline-block;background:#243b2d;color:#f3efe6;padding:6px 10px;border-radius:999px;font-size:11px;letter-spacing:.08em;text-transform:uppercase}.claim{font-size:13px;color:#4f5c52;max-width:360px;text-align:right}.cabecera-marca{display:flex;align-items:center;gap:8px;flex-wrap:wrap}h1{font-size:26px;margin:10px 0;color:#243b2d}h2{font-size:16px;margin:18px 0 8px;color:#304b3a}p,li{font-size:14px}.meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;background:#f4f0e7;padding:12px;border-radius:10px}.meta-alerta{margin-top:14px;padding:12px 14px;background:#fff8ea;border-left:4px solid #b77a1f;border-radius:8px;font-size:13px}.firmas{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:28px}.firma{padding-top:30px;border-top:1px solid #777}.firma-meta{margin-top:8px;font-size:11px;color:#56645a}.hash{margin-top:24px;padding:12px;background:#f8faf7;border:1px dashed #9fb29f;border-radius:10px;font-family:Consolas,monospace;font-size:12px;word-break:break-word}.respaldo{margin-top:16px;font-size:12px;color:#5c665f}</style></head><body><main class="doc"><div class="marca"><div><div class="cabecera-marca"><span class="sello">MELANTIA IA</span>${bloqueMarcaRancho}</div><h1>${titulo}</h1></div><div class="claim">Documento técnico-jurídico con auditoría digital de trazabilidad y evidencia verificable.</div></div><div class="meta"><div><strong>Fecha:</strong> ${fechaFormal}</div><div><strong>Hora:</strong> ${horaFormal}</div><div><strong>Lote:</strong> ${resumen.nombre_lote}</div><div><strong>Tipo:</strong> ${resumen.esAgricola ? 'Agrícola' : 'Pecuario'}</div></div><div class="meta-alerta"><strong>Trazabilidad protegida:</strong> Ubicación GPS: ${ubicacionLegal}. Certificado MELANTIA: #${hashTrazabilidad}</div>${cuerpoConClausula}<div class="firmas">${firmaVendedorHtml}${firmaCompradorHtml}</div><div class="hash"><strong>Huella digital jurídica SHA-256:</strong><br>${hash}</div><p class="respaldo">Respaldo operativo: este documento se genera al vuelo desde un registro ligero de MELANTIA IA y puede quedar asociado al lote para respaldo en nube del usuario y auditoría futura.</p></main></body></html>`;

    const payload = {
      tipo: `legal_${tipoDocumento}`,
      id_lote: idLote,
      id_animal: resumen.id_animal_representativo || null,
      nombre_archivo: nombreArchivo,
      mime_type: 'text/html',
      contenido: html,
      resumen: textoBase,
      hash_documento: hash,
      created_at: ahora.toISOString(),
      metadata: {
        tipoDocumento,
        comprador,
        productor,
        hashTrazabilidad,
        marcaRancho,
        firmaCompradorVector,
        firmaVendedorVector,
      },
    };

    const registro = await this._persistirDocumentoLegal(payload);
    return {
      success: true,
      ...registro,
      titulo,
      html,
      hash,
      mensaje: `${titulo} generado y guardado como documento ligero.`,
    };
  }

  // ------------------------------------------------------------------
  // FICHA DE VENTA DIGITAL
  // ------------------------------------------------------------------

  /**
   * Genera la Ficha de Venta Digital completa para un animal:
   * — Datos del animal
   * — Timeline de crecimiento con pesos
   * — Texto listo para WhatsApp
   * — HTML para mostrar en pantalla o imprimir
   *
   * @param {object} datosAnimal  { id, nombre, especie, raza, fechaNacimiento, estado }
   * @returns {Promise<object>}   { galeria, timeline, resumenTexto, html }
   */
  async generarFichaVentaDigital(datosAnimal, opciones = {}) {
    const {
      persistirLigera = true,
      modoUbicacion = null,
      incluirGPS = null,
      ubicacionAproximada = null,
    } = opciones;
    await this.inicializar();
    const galeria = await this.obtenerGaleria(datosAnimal.id);

    const escaparHTML = (valor) =>
      String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    const capitalizar = (valor) => {
      const texto = String(valor || '').trim();
      return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : '—';
    };
    const fechaBonita = (valor) => {
      if (!valor) return '—';
      const fecha = new Date(valor);
      return Number.isNaN(fecha.getTime())
        ? String(valor)
        : fecha.toLocaleDateString('es-EC', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
    };
    const comoLista = (valor) => {
      if (Array.isArray(valor)) return valor.filter(Boolean);
      if (valor == null || valor === '') return [];
      return [valor];
    };
    const textoItem = (item, tipo) => {
      if (!item) return '';
      if (typeof item === 'string') return item;
      if (tipo === 'sanidad') {
        const nombreItem =
          item.nombre || item.vacuna || item.evento || item.tipo;
        const fechaItem = item.fecha || item.aplicada || item.fechaAplicacion;
        const estadoItem = item.estado || item.resultado || item.detalle;
        return [
          nombreItem,
          fechaItem ? `(${fechaItem})` : '',
          estadoItem ? `- ${estadoItem}` : '',
        ]
          .filter(Boolean)
          .join(' ');
      }
      const nombreItem =
        item.nombre || item.tipo || item.dieta || item.descripcion;
      const detalleItem =
        item.detalle || item.fase || item.frecuencia || item.observacion;
      return [nombreItem, detalleItem ? `- ${detalleItem}` : '']
        .filter(Boolean)
        .join(' ');
    };

    const timeline = galeria
      .filter((f) => f.peso_estimado)
      .map((f) => ({
        etapa: f.etapa,
        fecha: f.fecha_toma,
        peso_kg: f.peso_estimado,
        url_foto: f.url_foto,
      }));

    const nombre =
      datosAnimal.nombre ||
      datosAnimal.identificacion ||
      `Animal ${datosAnimal.id}`;
    const especie = capitalizar(datosAnimal.especie || 'Animal');
    const raza = datosAnimal.raza || 'Sin especificar';
    const estado = capitalizar(datosAnimal.estado || 'activo');
    const fechaDisponibilidad =
      datosAnimal.fechaDisponibilidad ||
      datosAnimal.fechaVenta ||
      galeria[galeria.length - 1]?.fecha_toma ||
      new Date().toISOString().slice(0, 10);
    const fotosGeo = galeria.filter(
      (f) => f.latitud != null && f.longitud != null
    );
    const origenGPS = fotosGeo[0] || null;
    const origenNombre =
      datosAnimal.nombreFinca ||
      datosAnimal.finca ||
      datosAnimal.nombre_predio ||
      datosAnimal.origen ||
      'Finca de origen no registrada';
    const pesoActual =
      datosAnimal.pesoEstimado ||
      timeline[timeline.length - 1]?.peso_kg ||
      'No registrado';
    const dieta = comoLista(
      datosAnimal.alimentacion ||
        datosAnimal.dieta ||
        datosAnimal.dietaUtilizada
    ).map((item) => textoItem(item, 'alimentacion'));
    const sanidad = comoLista(
      datosAnimal.sanidad ||
        datosAnimal.historialSanitario ||
        datosAnimal.vacunas ||
        datosAnimal.manejoSanitario
    ).map((item) => textoItem(item, 'sanidad'));
    const seguridadUbicacion = this._resolverSeguridadUbicacion(
      datosAnimal,
      origenGPS,
      origenNombre,
      {
        modoUbicacion,
        incluirGPS,
        ubicacionAproximada,
      }
    );

    const fotoInicio =
      galeria.find((f) => f.etapa === 'inicio') || galeria[0] || null;
    const fotoCrecimiento =
      galeria.find((f) => f.etapa === 'crecimiento') ||
      galeria[1] ||
      fotoInicio;
    const fotoFinal =
      [...galeria].reverse().find((f) => f.etapa === 'final') ||
      galeria[galeria.length - 1] ||
      fotoCrecimiento ||
      fotoInicio;
    const fotosClave = [fotoInicio, fotoCrecimiento, fotoFinal].filter(
      (foto, index, arr) => foto && arr.indexOf(foto) === index
    );
    const fotoPrincipal = fotoFinal || fotoCrecimiento || fotoInicio;

    const qrPayload = [
      'MC1',
      datosAnimal.identificacion || nombre,
      especie,
      raza,
      estado,
      seguridadUbicacion.nombreUbicacion,
      String(fechaDisponibilidad),
      typeof pesoActual === 'number' ? `${pesoActual}kg` : String(pesoActual),
      seguridadUbicacion.qrGps,
    ].join('|');
    const hashVerificacion = `#vf=${encodeURIComponent(qrPayload)}`;
    const urlVerificacion = /^https?:$/i.test(window.location.protocol)
      ? `${window.location.origin}${window.location.pathname}${hashVerificacion}`
      : null;
    const qrData =
      urlVerificacion && new TextEncoder().encode(urlVerificacion).length <= 106
        ? urlVerificacion
        : qrPayload;
    const qrSvg = _crearQrSvgLocal(qrData);
    const payloadJS = JSON.stringify(qrPayload);
    const urlVerificacionJS = urlVerificacion
      ? JSON.stringify(urlVerificacion)
      : 'null';

    const loteReferencia =
      datosAnimal.idLote ||
      datosAnimal.id_lote ||
      datosAnimal.lote ||
      'general';
    const lineas = [
      `📄 *FICHA MELANTIA CERTIFIED*`,
      `🆔 ${datosAnimal.identificacion || nombre}`,
      `🐄 ${especie}: ${nombre} (${raza})`,
      `🏷️ Estado comercial: ${estado}`,
      `📅 Disponible desde: ${fechaBonita(fechaDisponibilidad)}`,
      `📍 Ubicación: ${seguridadUbicacion.gpsResumen}`,
      `⚖️ Peso estimado: ${typeof pesoActual === 'number' ? `${pesoActual} kg` : pesoActual}`,
      '',
      `📸 Evidencia visual: ${fotosClave.length} foto(s) clave y ${galeria.length} registro(s) totales`,
    ];

    if (sanidad.length) {
      lineas.push('', '🩺 *Resumen sanitario:*');
      sanidad.forEach((item) => lineas.push(`  • ${item}`));
    }
    if (dieta.length) {
      lineas.push('', '🌾 *Alimentación:*');
      dieta.forEach((item) => lineas.push(`  • ${item}`));
    }
    if (timeline.length) {
      lineas.push('', '📈 *Evolución de peso:*');
      timeline.forEach((t) =>
        lineas.push(
          `  • ${capitalizar(t.etapa)} (${fechaBonita(t.fecha)}): ${t.peso_kg} kg`
        )
      );
    }
    lineas.push('');
    lineas.push(
      '🛡️ Documentación generada automáticamente por Melantia IA. Datos validados por geolocalización inalterable.'
    );
    const resumenTexto = lineas.join('\n');
    const resumenSanitario =
      sanidad[0] || 'Registros sanitarios disponibles en la ficha.';
    const enlaceVisual =
      urlVerificacion ||
      'Enlace diferido: se abrirá desde Melantia cuando el comprador recupere señal.';
    const mensajeHibrido = [
      `*Asunto: Ficha de Trazabilidad - Lote ${loteReferencia}*`,
      '🤠 ¡Hola! Te comparto la información de los animales que consultaste:',
      `* Producto: ${especie} ${raza} - ${estado}.`,
      `* Ubicación: ${seguridadUbicacion.gpsResumen}.`,
      `* Sanidad: ${resumenSanitario}.`,
      '📸 *Ver Evidencia Fotográfica:*',
      enlaceVisual,
      '(Nota: si tienes poca señal, el enlace abrirá una versión ligera o quedará guardado para cuando vuelva la conectividad).',
    ].join('\n');
    const whatsappURL = `https://wa.me/?text=${encodeURIComponent(mensajeHibrido)}`;

    const fotosClaveHTML = fotosClave
      .map(
        (f) => `
      <article class="timeline-card">
        <div class="timeline-media">
          <img src="${escaparHTML(f.url_foto)}" alt="${escaparHTML(f.etapa)}" loading="lazy">
          <span class="timeline-badge">${escaparHTML(capitalizar(f.etapa))}</span>
        </div>
        <div class="timeline-copy">
          <strong>${escaparHTML(capitalizar(f.etapa))}</strong>
          <span>${escaparHTML(fechaBonita(f.fecha_toma))}</span>
          ${f.peso_estimado ? `<span class="timeline-meta">${escaparHTML(f.peso_estimado)} kg</span>` : ''}
          ${seguridadUbicacion.gpsTimeline(f) ? `<span class="timeline-meta">${escaparHTML(seguridadUbicacion.gpsTimeline(f))}</span>` : ''}
        </div>
      </article>`
      )
      .join('');

    const timelineHTML = timeline.length
      ? timeline
          .map(
            (t) => `
      <div class="peso-item">
        <img src="${escaparHTML(t.url_foto)}" class="peso-thumb" alt="${escaparHTML(t.etapa)}">
        <div>
          <strong>${escaparHTML(capitalizar(t.etapa))}</strong>
          <span>${escaparHTML(fechaBonita(t.fecha))}</span>
        </div>
        <b>${escaparHTML(t.peso_kg)} kg</b>
      </div>`
          )
          .join('')
      : '<p class="vacio">No hay pesos registrados todavía.</p>';

    const sanidadHTML = sanidad.length
      ? sanidad.map((item) => `<li>✅ ${escaparHTML(item)}</li>`).join('')
      : '<li>Sin registros sanitarios cargados.</li>';

    const alimentacionHTML = dieta.length
      ? dieta.map((item) => `<li>🌿 ${escaparHTML(item)}</li>`).join('')
      : '<li>Sin dieta registrada.</li>';

    const gpsTablaHTML = seguridadUbicacion.tablaHtml
      ? seguridadUbicacion.tablaHtml
      : fotosGeo.length
        ? fotosGeo
            .map(
              (f) => `
          <tr>
            <td>${escaparHTML(capitalizar(f.etapa))}</td>
            <td>${escaparHTML(fechaBonita(f.fecha_toma))}</td>
            <td>${escaparHTML(f.latitud.toFixed(6))}°</td>
            <td>${escaparHTML(f.longitud.toFixed(6))}°</td>
            <td>${
              f.precision_gps_m ? escaparHTML(`±${f.precision_gps_m} m`) : '—'
            }</td>
          </tr>`
            )
            .join('')
        : '<tr><td colspan="5">Sin coordenadas GPS registradas en las evidencias.</td></tr>';

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ficha Melantia Certified — ${escaparHTML(nombre)}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", "Helvetica Neue", sans-serif;
      color: #18261f;
      background: linear-gradient(180deg, #f8fbf7 0%, #eef4ef 100%);
      font-size: 12px;
      line-height: 1.45;
    }
    .sheet {
      padding: 18px;
    }
    .hero {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 14px;
      margin-bottom: 14px;
    }
    .hero-card,
    .panel,
    .trust-card,
    .timeline-card {
      background: #ffffff;
      border: 1px solid #d9e6dc;
      border-radius: 18px;
      box-shadow: 0 10px 24px rgba(32, 64, 45, 0.08);
    }
    .hero-card {
      overflow: hidden;
      position: relative;
      min-height: 300px;
    }
    .hero-card img {
      width: 100%;
      height: 100%;
      min-height: 300px;
      object-fit: cover;
      display: block;
    }
    .hero-overlay {
      position: absolute;
      inset: auto 0 0 0;
      padding: 18px;
      color: #fff;
      background: linear-gradient(180deg, rgba(8, 16, 11, 0) 0%, rgba(8, 16, 11, 0.88) 100%);
    }
    .hero-tag {
      display: inline-block;
      padding: 6px 10px;
      border-radius: 999px;
      background: rgba(199, 255, 217, 0.16);
      border: 1px solid rgba(255, 255, 255, 0.25);
      font-size: 10px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .hero-overlay h1 {
      margin: 0 0 6px;
      font-size: 28px;
      line-height: 1.05;
    }
    .hero-overlay p {
      margin: 0;
      font-size: 12px;
      opacity: 0.92;
    }
    .summary {
      padding: 18px;
      display: grid;
      gap: 12px;
    }
    .brand h2 {
      margin: 0;
      font-size: 13px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #2c6a4d;
    }
    .brand p {
      margin: 6px 0 0;
      color: #53635a;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .chip {
      border-radius: 999px;
      padding: 7px 10px;
      background: #edf6ef;
      color: #2e5842;
      font-size: 11px;
      border: 1px solid #d6e8d9;
    }
    .facts {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }
    .fact {
      background: #f9fbf8;
      border: 1px solid #e3ece4;
      border-radius: 14px;
      padding: 10px;
    }
    .fact span {
      display: block;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #6d7f72;
      margin-bottom: 4px;
    }
    .fact strong {
      font-size: 13px;
      color: #1f3327;
    }
    .grid {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 14px;
      margin-bottom: 14px;
    }
    .panel {
      padding: 16px;
    }
    .panel h3 {
      margin: 0 0 12px;
      font-size: 13px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #2c6a4d;
    }
    .timeline-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
    }
    .timeline-card {
      overflow: hidden;
    }
    .timeline-media {
      position: relative;
      height: 132px;
    }
    .timeline-media img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .timeline-badge {
      position: absolute;
      left: 8px;
      top: 8px;
      background: rgba(16, 28, 22, 0.82);
      color: #fff;
      font-size: 10px;
      padding: 5px 8px;
      border-radius: 999px;
    }
    .timeline-copy {
      padding: 10px;
      display: grid;
      gap: 4px;
    }
    .timeline-copy strong {
      font-size: 12px;
    }
    .timeline-copy span {
      font-size: 10px;
      color: #607166;
    }
    .timeline-meta {
      color: #27553d;
      font-weight: 600;
    }
    .peso-list {
      display: grid;
      gap: 9px;
    }
    .peso-item {
      display: grid;
      grid-template-columns: 58px 1fr auto;
      align-items: center;
      gap: 10px;
      padding: 8px;
      border-radius: 14px;
      background: #f8fbf8;
      border: 1px solid #e1ebe3;
    }
    .peso-thumb {
      width: 58px;
      height: 58px;
      object-fit: cover;
      border-radius: 10px;
    }
    .peso-item strong,
    .peso-item b {
      display: block;
    }
    .peso-item span {
      color: #627467;
      font-size: 10px;
    }
    .split {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
      margin-bottom: 14px;
    }
    ul.clean {
      margin: 0;
      padding-left: 18px;
      display: grid;
      gap: 8px;
    }
    .trust-card {
      display: grid;
      grid-template-columns: 1fr 180px;
      gap: 14px;
      padding: 16px;
      margin-bottom: 14px;
      align-items: stretch;
    }
    .trust-copy h3 {
      margin: 0 0 8px;
      font-size: 14px;
      color: #244f39;
    }
    .trust-copy p {
      margin: 0 0 10px;
      color: #4f6156;
    }
    .trust-side {
      display: grid;
      gap: 10px;
      align-content: start;
    }
    .qr-box {
      min-height: 150px;
      border-radius: 18px;
      background: #f4f8f5;
      border: 1px dashed #c8d8cb;
      display: grid;
      place-items: center;
      padding: 10px;
      color: #4f6156;
      text-align: center;
      font-size: 10px;
    }
    .qr-box canvas,
    .qr-box img {
      max-width: 100%;
      height: auto;
      display: block;
    }
    .trust-seal {
      border-radius: 18px;
      background: linear-gradient(180deg, #214f39 0%, #173728 100%);
      color: #fff;
      padding: 14px;
      display: grid;
      place-items: center;
      text-align: center;
      font-size: 11px;
    }
    .trust-seal strong {
      display: block;
      font-size: 17px;
      line-height: 1;
      margin-bottom: 6px;
    }
    .gps-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    .gps-table th,
    .gps-table td {
      padding: 8px 6px;
      text-align: left;
      border-bottom: 1px solid #e2ebe4;
    }
    .gps-table th {
      color: #2c6a4d;
      text-transform: uppercase;
      font-size: 9px;
      letter-spacing: 0.06em;
    }
    .cta-bar {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      padding: 14px 16px;
      background: #1f3d2c;
      color: #fff;
      border-radius: 18px;
    }
    .cta-copy strong {
      display: block;
      margin-bottom: 4px;
      font-size: 13px;
    }
    .cta-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 150px;
      border-radius: 999px;
      padding: 10px 14px;
      border: 1px solid rgba(255,255,255,0.14);
      color: #fff;
      text-decoration: none;
      background: rgba(255,255,255,0.1);
      font-weight: 600;
    }
    .btn.light {
      background: #fff;
      color: #1f3d2c;
      border-color: #fff;
    }
    .qr-payload {
      margin-top: 10px;
      padding: 10px;
      border-radius: 12px;
      background: #f5f8f6;
      border: 1px dashed #c9d9cd;
      font-family: Consolas, monospace;
      font-size: 9px;
      color: #456150;
      word-break: break-word;
    }
    .vacio { color: #6a7a70; }
    @media print {
      body { background: #fff; }
      .sheet { padding: 0; }
      .cta-bar { display: none; }
      .hero-card,
      .panel,
      .trust-card,
      .timeline-card { box-shadow: none; }
    }
  </style>
</head>
<body>
  <main class="sheet">
    <section class="hero">
      <article class="hero-card">
        ${fotoPrincipal ? `<img src="${escaparHTML(fotoPrincipal.url_foto)}" alt="${escaparHTML(nombre)}">` : ''}
        <div class="hero-overlay">
          <span class="hero-tag">Melantia Certified</span>
          <h1>${escaparHTML(datosAnimal.identificacion || nombre)}</h1>
          <p>${escaparHTML(especie)} · ${escaparHTML(raza)} · ${escaparHTML(estado)}</p>
        </div>
      </article>

      <aside class="hero-card summary">
        <div class="brand">
          <h2>Ficha de Trazabilidad y Venta</h2>
          <p>Documento comercial listo para compartir por WhatsApp o convertir a PDF.</p>
        </div>
        <div class="chips">
          <span class="chip">Disponible: ${escaparHTML(fechaBonita(fechaDisponibilidad))}</span>
          <span class="chip">${escaparHTML(galeria.length)} evidencias</span>
          <span class="chip">Peso: ${escaparHTML(typeof pesoActual === 'number' ? `${pesoActual} kg` : pesoActual)}</span>
        </div>
        <div class="facts">
          <div class="fact">
            <span>ID Animal/Lote</span>
            <strong>${escaparHTML(datosAnimal.identificacion || nombre)}</strong>
          </div>
          <div class="fact">
            <span>Ubicación de origen</span>
            <strong>${escaparHTML(seguridadUbicacion.nombreUbicacion)}</strong>
          </div>
          <div class="fact">
            <span>GPS fijo</span>
            <strong>${escaparHTML(seguridadUbicacion.gpsFact)}</strong>
          </div>
          <div class="fact">
            <span>Fecha de disponibilidad</span>
            <strong>${escaparHTML(fechaBonita(fechaDisponibilidad))}</strong>
          </div>
        </div>
      </aside>
    </section>

    <section class="panel">
      <h3>Historial visual</h3>
      <div class="timeline-grid">${fotosClaveHTML || '<p class="vacio">Aún no hay fotos clave registradas.</p>'}</div>
    </section>

    <section class="grid">
      <article class="panel">
        <h3>Historial de manejo</h3>
        <div class="peso-list">${timelineHTML}</div>
      </article>
      <article class="panel">
        <h3>Resumen comercial</h3>
        <div class="facts">
          <div class="fact"><span>Especie</span><strong>${escaparHTML(especie)}</strong></div>
          <div class="fact"><span>Raza</span><strong>${escaparHTML(raza)}</strong></div>
          <div class="fact"><span>Estado</span><strong>${escaparHTML(estado)}</strong></div>
          <div class="fact"><span>Peso estimado</span><strong>${escaparHTML(typeof pesoActual === 'number' ? `${pesoActual} kg` : pesoActual)}</strong></div>
        </div>
      </article>
    </section>

    <section class="split">
      <article class="panel">
        <h3>Sanidad</h3>
        <ul class="clean">${sanidadHTML}</ul>
      </article>
      <article class="panel">
        <h3>Alimentación</h3>
        <ul class="clean">${alimentacionHTML}</ul>
      </article>
    </section>

    <section class="trust-card">
      <div class="trust-copy">
        <h3>Sello de confianza legal</h3>
        <p>Documentación generada automáticamente por Melantia IA. Datos validados por geolocalización inalterable.</p>
        <p>Este registro comercial se construye en el dispositivo del productor, sin depender de conexión permanente.</p>
        <p>${escaparHTML(seguridadUbicacion.confianzaTexto)}</p>
        <div class="qr-payload">Payload QR: ${escaparHTML(qrPayload)}</div>
        <div class="qr-payload">QR de pánico offline: contiene la ficha textual y deja el enlace listo para abrir cuando regrese la señal.</div>
        ${urlVerificacion && qrData === urlVerificacion ? `<div class="qr-payload">Ruta interna: ${escaparHTML(hashVerificacion)}</div>` : ''}
      </div>
      <div class="trust-side">
        <div class="qr-box" id="melantia-qr-box">
          ${qrSvg}
        </div>
        <div class="trust-seal">
          <div>
            <strong>MELANTIA</strong>
            CERTIFIED<br>
            TRAZABILIDAD<br>
            OFFLINE VERIFICADA
          </div>
        </div>
      </div>
    </section>

    <section class="panel">
      <h3>Prueba de origen GPS</h3>
      <table class="gps-table">
        <thead>
          <tr>
            <th>Etapa</th>
            <th>Fecha</th>
            <th>Latitud</th>
            <th>Longitud</th>
            <th>Precisión</th>
          </tr>
        </thead>
        <tbody>${gpsTablaHTML}</tbody>
      </table>
    </section>

    <section class="cta-bar">
      <div class="cta-copy">
        <strong>Ficha lista para vender</strong>
        <span>Compártela por WhatsApp o genera un PDF A4 desde el navegador.</span>
      </div>
      <div class="cta-actions">
        <a class="btn" href="#" onclick='const payload = ${payloadJS}; const destino = window.opener?.MelantiaVerificacion || window.MelantiaVerificacion; if (destino) { if (window.opener) window.opener.focus(); destino.abrir(payload); } else { const url = ${urlVerificacionJS}; if (url) window.location.href = url; } return false;'>Abrir verificacion</a>
        <a class="btn light" href="${whatsappURL}" target="_blank" rel="noreferrer">Compartir por WhatsApp</a>
        <a class="btn" href="#" onclick="window.print(); return false;">Guardar como PDF</a>
      </div>
    </section>
  </main>
</body>
</html>`;

    const ficha = {
      galeria,
      timeline,
      resumenTexto,
      html,
      qrPayload,
      qrData,
      urlVerificacion,
      mensajeHibrido,
      modoUbicacion: seguridadUbicacion.modo,
      ubicacionCompartida: seguridadUbicacion.gpsResumen,
      whatsappURL,
    };

    if (persistirLigera) {
      try {
        const registroLigero = await this._persistirFichaLigera(
          datosAnimal,
          ficha
        );
        ficha.registroLigeroId = registroLigero.id;
      } catch (error) {
        console.warn('[Melantia] No se pudo persistir la ficha ligera:', error);
      }
    }

    return ficha;
  }

  // ------------------------------------------------------------------
  // COMPARTIR POR WHATSAPP
  // ------------------------------------------------------------------

  /**
   * Comparte la Ficha de Venta por WhatsApp (Web Share API)
   * o copia el resumen al portapapeles como alternativa.
   *
   * @param {object} datosAnimal
   */
  async compartirPorWhatsApp(datosAnimal, opciones = {}) {
    const ficha = await this.generarFichaVentaDigital(datosAnimal, opciones);

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ficha de Trazabilidad — ${datosAnimal.nombre || 'Animal'}`,
          text: ficha.mensajeHibrido || ficha.resumenTexto,
        });
        return { success: true };
      } catch (_) {
        // El usuario canceló o el método falló → caer al clipboard
      }
    }

    // Fallback: copiar al portapapeles
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(
        ficha.mensajeHibrido || ficha.resumenTexto
      );
      return {
        success: true,
        copiado: true,
        mensaje: 'Ficha copiada. Pégala en WhatsApp, correo o tus notas.',
      };
    }
    return {
      success: false,
      mensaje: 'Usa el botón compartir de tu teléfono.',
    };
  }

  /**
   * Abre una ventana de impresión con la Ficha de Venta en A4.
   * El productor elige "Guardar como PDF" → Documents.
   *
   * @param {object} datosAnimal
   */
  async imprimirFichaA4(datosAnimal, opciones = {}) {
    const ficha = await this.generarFichaVentaDigital(datosAnimal, opciones);
    const win = window.open('', '_blank', 'width=820,height=1160');
    if (!win) {
      return {
        success: false,
        mensaje: 'Permite ventanas emergentes para generar el PDF.',
      };
    }
    win.document.write(ficha.html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 700);
    return { success: true };
  }

  // ------------------------------------------------------------------
  // SINCRONIZACIÓN OFFLINE → NUBE
  // ------------------------------------------------------------------

  /** Devuelve todas las fotos pendientes de subir. */
  async fotosPendientesSync() {
    await this.inicializar();
    return new Promise((resolve, reject) => {
      const req = this._tx(_STORE_FOTOS, 'readonly')
        .index('idx_sync')
        .getAll(IDBKeyRange.only(1));
      req.onsuccess = () =>
        resolve(
          (req.result || []).map((foto) => ({
            ...foto,
            url_upload: foto.url_foto,
            url_preview: foto.url_thumb || foto.url_foto,
          }))
        );
      req.onerror = () => reject(req.error);
    });
  }

  /** Marca una foto como sincronizada y guarda la URL de nube. */
  async marcarSincronizada(id, urlNube) {
    await this.inicializar();
    return new Promise((resolve, reject) => {
      const store = this._tx(_STORE_FOTOS);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const reg = getReq.result;
        if (!reg) return resolve(false);
        reg.pendiente_sync = 0;
        reg.sincronizado = 1;
        reg.purga_pendiente = reg.url_foto ? 1 : 0;
        reg.url_nube = urlNube;
        const putReq = store.put(reg);
        putReq.onsuccess = () => resolve(true);
        putReq.onerror = () => reject(putReq.error);
      };
    });
  }

  /** Devuelve archivos ya sincronizados que aún conservan la versión local pesada. */
  async obtenerArchivosSincronizados() {
    await this.inicializar();
    return new Promise((resolve, reject) => {
      const req = this._tx(_STORE_FOTOS, 'readonly').getAll();
      req.onsuccess = () => {
        const registros = (req.result || []).filter(
          (foto) => foto.sincronizado === 1 && foto.url_nube && foto.url_foto
        );
        resolve(registros);
      };
      req.onerror = () => reject(req.error);
    });
  }

  /** Reemplaza la foto local pesada por la URL de nube y conserva solo la miniatura. */
  async actualizarARutaNube(id, urlNube) {
    await this.inicializar();
    return new Promise((resolve, reject) => {
      const store = this._tx(_STORE_FOTOS);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const reg = getReq.result;
        if (!reg) return resolve(false);
        reg.url_nube = urlNube || reg.url_nube;
        reg.sincronizado = 1;
        reg.pendiente_sync = 0;
        reg.purga_pendiente = 0;
        reg.url_foto = null;
        const putReq = store.put(reg);
        putReq.onsuccess = () => resolve(true);
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  /** Purga local: en web no existe archivo físico, así que borra la versión pesada de IndexedDB. */
  async limpiarCelularMelantia() {
    const archivos = await this.obtenerArchivosSincronizados();
    let liberados = 0;
    for (const archivo of archivos) {
      const actualizado = await this.actualizarARutaNube(
        archivo.id,
        archivo.url_nube
      );
      if (actualizado) liberados += 1;
    }
    return {
      success: true,
      liberados,
      mensaje: `Melantia liberó ${liberados} archivo(s) locales ya respaldados en la nube.`,
    };
  }

  /** Alias operativo: devuelve fotos pendientes con nombre alineado al protocolo de campo. */
  async obtenerFotosPendientes() {
    return this.fotosPendientesSync();
  }

  /** Alias operativo: marca como sincronizado y deja lista la purga selectiva. */
  async marcarComoSincronizado(id, urlNube) {
    return this.marcarSincronizada(id, urlNube);
  }

  /** Alias operativo: en web purga la versión pesada del IndexedDB. */
  async eliminarArchivoLocal(id, urlNube = null) {
    return this.actualizarARutaNube(id, urlNube);
  }

  /** Flujo completo de sincronización y purga selectiva. */
  async sincronizarYLimpiarMelantia(config = null, opciones = {}) {
    if (!navigator.onLine) {
      return {
        success: false,
        motivo: 'SIN_RED',
        mensaje: 'Sin internet disponible para sincronización silenciosa.',
      };
    }
    return this.sincronizarConSupabase(config, opciones);
  }

  /** Guarda una ficha comercial como HTML liviano para renderizado instantáneo. */
  _clasificarAnimalParaUGM(datosAnimal = {}) {
    const etapa = String(datosAnimal?.etapa || datosAnimal?.categoria || '')
      .trim()
      .toLowerCase();
    const sexo = String(datosAnimal?.sexo || '')
      .trim()
      .toLowerCase();
    const especie = String(datosAnimal?.especie || '')
      .trim()
      .toLowerCase();

    const esBovino =
      !especie ||
      especie.includes('bov') ||
      especie.includes('vaca') ||
      especie.includes('toro') ||
      especie.includes('terner');

    if (!esBovino) {
      return { vacas: 0, toros: 0, terneros: 0 };
    }

    if (etapa.includes('terner') || etapa.includes('cria')) {
      return { vacas: 0, toros: 0, terneros: 1 };
    }
    if (sexo === 'm' || sexo === 'macho' || etapa.includes('toro')) {
      return { vacas: 0, toros: 1, terneros: 0 };
    }
    return { vacas: 1, toros: 0, terneros: 0 };
  }

  async _actualizarUGMInventarioAnimal(datosAnimal = {}) {
    const key = 'melantia_inventario_pecuario';
    const ugmKey = 'melantia_ugm_resumen';

    let inventario = [];
    try {
      inventario = JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      inventario = [];
    }

    const id =
      datosAnimal?.id ||
      datosAnimal?.id_animal ||
      `animal_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const normalizado = { ...datosAnimal, id };
    const idx = inventario.findIndex((item) => String(item?.id) === String(id));
    if (idx >= 0) inventario[idx] = { ...inventario[idx], ...normalizado };
    else inventario.push(normalizado);

    localStorage.setItem(key, JSON.stringify(inventario));

    const conteo = inventario.reduce(
      (acc, item) => {
        const parcial = this._clasificarAnimalParaUGM(item);
        acc.vacas += parcial.vacas;
        acc.toros += parcial.toros;
        acc.terneros += parcial.terneros;
        return acc;
      },
      { vacas: 0, toros: 0, terneros: 0 }
    );

    const ugm = conteo.vacas * 1.0 + conteo.toros * 1.2 + conteo.terneros * 0.5;
    const resumen = {
      ugm,
      animales: conteo,
      total_animales: inventario.length,
      fecha: new Date().toISOString(),
      origen: 'inventario_pecuario',
    };
    localStorage.setItem(ugmKey, JSON.stringify(resumen));

    if (window.supabase?.from) {
      try {
        await window.supabase.from('inventario_pecuario_ugm').upsert(
          {
            id: 'global',
            vacas: conteo.vacas,
            toros: conteo.toros,
            terneros: conteo.terneros,
            ugm_total: ugm,
            total_animales: inventario.length,
            updated_at: resumen.fecha,
          },
          { onConflict: 'id' }
        );
      } catch {
        // Si la tabla no existe, mantenemos persistencia local para no romper flujo offline.
      }
    }

    try {
      window.dispatchEvent(
        new CustomEvent('melantia:inventario:ugm_actualizada', {
          detail: resumen,
        })
      );
    } catch {
      // Sin bloqueo.
    }

    return resumen;
  }

  async guardarFichaLigera(datosAnimal) {
    const ficha = await this.generarFichaVentaDigital(datosAnimal, {
      persistirLigera: false,
    });
    const registroLigero = await this._persistirFichaLigera(datosAnimal, ficha);
    const ugmResumen = await this._actualizarUGMInventarioAnimal(datosAnimal);
    return {
      success: true,
      id: registroLigero.id,
      ...registroLigero,
      ugm: ugmResumen,
      mensaje: 'Ficha ligera guardada para abrir o exportar sin imagen pesada.',
    };
  }

  /** Recupera la última ficha ligera guardada para un animal. */
  async obtenerFichaLigera(idAnimal) {
    await this.inicializar();
    return new Promise((resolve, reject) => {
      const req = this._tx(_STORE_REPORTES, 'readonly')
        .index('idx_animal')
        .getAll(IDBKeyRange.only(idAnimal));
      req.onsuccess = () => {
        const fichas = req.result || [];
        resolve(fichas.length ? fichas[fichas.length - 1] : null);
      };
      req.onerror = () => reject(req.error);
    });
  }

  /** Guarda el vector de coordenadas del mapa GPS como JSON liviano. */
  async guardarMapaGpsLigero({
    idLote = null,
    puntos = [],
    nombre = 'mapa_gps',
    meta = {},
  }) {
    const payload = {
      tipo: 'mapa_gps_json',
      id_lote: idLote,
      nombre_archivo: `${nombre}.json`,
      mime_type: 'application/json',
      contenido: JSON.stringify({ idLote, puntos, meta }, null, 2),
      puntos_total: Array.isArray(puntos) ? puntos.length : 0,
      created_at: new Date().toISOString(),
    };
    const id = await this._guardarRegistroLigero(_STORE_MAPAS, payload, {
      esDuplicado: (registro, nuevo) =>
        nuevo.id_lote != null &&
        registro?.tipo === nuevo.tipo &&
        registro?.id_lote === nuevo.id_lote,
    });
    return {
      success: true,
      id,
      ...payload,
      mensaje: 'Mapa GPS guardado como vector JSON liviano.',
    };
  }

  /** Recupera el último mapa liviano guardado para un lote. */
  async obtenerMapaGpsLigero(idLote) {
    await this.inicializar();
    return new Promise((resolve, reject) => {
      const req = this._tx(_STORE_MAPAS, 'readonly')
        .index('idx_lote')
        .getAll(IDBKeyRange.only(idLote));
      req.onsuccess = () => {
        const mapas = req.result || [];
        resolve(mapas.length ? mapas[mapas.length - 1] : null);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async listarFichasLigeras() {
    const fichas = await this._leerTodosStore(_STORE_REPORTES);
    return fichas.sort((a, b) =>
      String(b.created_at || '').localeCompare(String(a.created_at || ''))
    );
  }

  async listarMapasGpsLigeros() {
    const mapas = await this._leerTodosStore(_STORE_MAPAS);
    return mapas.sort((a, b) =>
      String(b.created_at || '').localeCompare(String(a.created_at || ''))
    );
  }

  async listarDocumentosLigeros() {
    const [fichas, mapas] = await Promise.all([
      this.listarFichasLigeras(),
      this.listarMapasGpsLigeros(),
    ]);
    return [...fichas, ...mapas].sort((a, b) =>
      String(b.created_at || '').localeCompare(String(a.created_at || ''))
    );
  }

  _leerMapaLigero(mapa) {
    try {
      return JSON.parse(mapa?.contenido || '{}');
    } catch {
      return {};
    }
  }

  async obtenerTableroControl() {
    const [fotos, fichas, mapas] = await Promise.all([
      this._leerTodosStore(_STORE_FOTOS),
      this.listarFichasLigeras(),
      this.listarMapasGpsLigeros(),
    ]);

    const grupos = new Map();

    for (const foto of fotos) {
      const idLote = foto.id_lote ?? 'sin-lote';
      if (!grupos.has(idLote)) {
        grupos.set(idLote, {
          id_lote: idLote,
          nombre_lote:
            idLote === 'sin-lote' ? 'Sin lote asignado' : `LOTE ${idLote}`,
          animales_ids: new Set(),
          total_fotos: 0,
          sincronizadas: 0,
          espacio_local_bytes: 0,
          ultima_foto_iso: null,
          ultima_etapa: 'sin datos',
          id_animal_representativo: null,
          thumb_url: null,
        });
      }

      const grupo = grupos.get(idLote);
      grupo.animales_ids.add(foto.id_animal);
      grupo.total_fotos += 1;
      if (foto.sincronizado === 1 || foto.url_nube) grupo.sincronizadas += 1;
      grupo.espacio_local_bytes += this._estimarBytesLocal(foto.url_foto);

      if (
        !grupo.ultima_foto_iso ||
        String(foto.fecha_toma || '') > String(grupo.ultima_foto_iso || '')
      ) {
        grupo.ultima_foto_iso = foto.fecha_toma || null;
        grupo.ultima_etapa = foto.etapa || 'sin datos';
        grupo.id_animal_representativo = foto.id_animal ?? null;
        grupo.thumb_url =
          foto.url_thumb || foto.url_foto || foto.url_nube || null;
      }
    }

    for (const mapa of mapas) {
      const idLote = mapa.id_lote ?? 'sin-lote';
      const datosMapa = this._leerMapaLigero(mapa);
      const metaMapa = datosMapa.meta || {};

      if (!grupos.has(idLote)) {
        grupos.set(idLote, {
          id_lote: idLote,
          nombre_lote:
            metaMapa.nombre_lote ||
            metaMapa.nombre ||
            (idLote === 'sin-lote'
              ? 'Lote agrícola sin código'
              : `LOTE ${idLote}`),
          animales_ids: new Set(),
          total_fotos: 0,
          sincronizadas: 0,
          espacio_local_bytes: 0,
          ultima_foto_iso: mapa.created_at || null,
          ultima_etapa: metaMapa.fase || metaMapa.cultivo || 'agricola',
          id_animal_representativo: null,
          thumb_url: null,
        });
      }

      const grupo = grupos.get(idLote);
      grupo.mapa_ligero = mapa;
      grupo.tipo_lote = grupo.animales_ids.size > 0 ? 'pecuario' : 'agricola';
      grupo.area_ha =
        metaMapa.area_ha ?? metaMapa.hectareas ?? grupo.area_ha ?? null;
      grupo.area_m2 = metaMapa.area_m2 ?? grupo.area_m2 ?? null;
      grupo.perimetro_m = metaMapa.perimetro_m ?? grupo.perimetro_m ?? null;
      grupo.cultivo =
        metaMapa.cultivo || metaMapa.tipo_cultivo || grupo.cultivo || 'Cultivo';
      grupo.cosecha_estimada =
        metaMapa.cosecha_estimada ||
        metaMapa.fecha_cosecha ||
        grupo.cosecha_estimada ||
        null;
      grupo.alerta_tecnica =
        metaMapa.alerta ||
        metaMapa.plaga ||
        metaMapa.observacion ||
        grupo.alerta_tecnica ||
        null;
      if (
        !grupo.ultima_foto_iso ||
        String(mapa.created_at || '') > String(grupo.ultima_foto_iso || '')
      ) {
        grupo.ultima_foto_iso = mapa.created_at || grupo.ultima_foto_iso;
      }
    }

    const lotes = Array.from(grupos.values())
      .map((grupo) => {
        const animalesIds = Array.from(grupo.animales_ids);
        const fichaLigera =
          fichas.find((ficha) => animalesIds.includes(ficha.id_animal)) || null;
        const mapaLigero =
          mapas.find(
            (mapa) =>
              String(mapa.id_lote ?? 'sin-lote') === String(grupo.id_lote)
          ) || null;
        const estaEnNube =
          grupo.total_fotos > 0 &&
          grupo.sincronizadas === grupo.total_fotos &&
          grupo.espacio_local_bytes === 0;
        const estado_sincronizacion = estaEnNube
          ? '☁️ Sincronizado'
          : grupo.sincronizadas > 0
            ? '🔄 Mixto'
            : '📱 Solo Local';

        return {
          ...grupo,
          animales_ids: animalesIds,
          tipo_lote:
            grupo.tipo_lote ||
            (animalesIds.length > 0 ? 'pecuario' : 'agricola'),
          poblacion: animalesIds.length,
          ficha_ligera: fichaLigera,
          mapa_ligero: grupo.mapa_ligero || mapaLigero,
          sincronizado: estaEnNube,
          estado_sincronizacion,
        };
      })
      .sort((a, b) =>
        String(b.ultima_foto_iso || '').localeCompare(
          String(a.ultima_foto_iso || '')
        )
      );

    return {
      lotes,
      total_lotes: lotes.length,
      total_lotes_agricolas: lotes.filter(
        (lote) => lote.tipo_lote === 'agricola'
      ).length,
      total_lotes_pecuarios: lotes.filter(
        (lote) => lote.tipo_lote === 'pecuario'
      ).length,
      total_animales: lotes.reduce((acc, lote) => acc + lote.poblacion, 0),
      total_area_ha: lotes.reduce(
        (acc, lote) => acc + (Number(lote.area_ha) || 0),
        0
      ),
      espacio_local_bytes: lotes.reduce(
        (acc, lote) => acc + lote.espacio_local_bytes,
        0
      ),
    };
  }

  async liberarEspacioLote(idLote) {
    const fotos = await this._leerTodosStore(_STORE_FOTOS);
    const objetivo = fotos.filter(
      (foto) =>
        String(foto.id_lote ?? 'sin-lote') === String(idLote) &&
        foto.url_foto &&
        foto.url_nube &&
        (foto.sincronizado === 1 || foto.pendiente_sync === 0)
    );

    let liberados = 0;
    for (const foto of objetivo) {
      const ok = await this.actualizarARutaNube(foto.id, foto.url_nube);
      if (ok) liberados += 1;
    }

    return {
      success: true,
      id_lote: idLote,
      liberados,
      mensaje:
        liberados > 0
          ? `Espacio liberado en el lote ${idLote}. Las fotos quedan seguras en la nube.`
          : `No hubo archivos pesados purgables en el lote ${idLote}.`,
    };
  }

  async prepararEnvioSeguro(datosAnimal, opciones = {}) {
    return this.generarFichaVentaDigital(datosAnimal, opciones);
  }

  /** Sincroniza evidencias pendientes hacia Supabase Storage y purga local tras confirmación. */
  async sincronizarConSupabase(config = null, opciones = {}) {
    const supabase = this._leerConfigSupabase(config);
    if (!supabase) {
      return {
        success: false,
        motivo: 'SUPABASE_NO_CONFIGURADO',
        mensaje: 'Falta configurar url, anonKey y bucket de Supabase.',
      };
    }
    if (!navigator.onLine) {
      return {
        success: false,
        motivo: 'SIN_RED',
        mensaje: 'No hay conexión disponible.',
      };
    }

    const { purgar = true, limite = 12 } = opciones;
    const pendientes = (await this.fotosPendientesSync()).slice(0, limite);
    if (!pendientes.length) {
      return {
        success: true,
        subidas: 0,
        purgadas: 0,
        mensaje: 'No hay evidencias pendientes para Supabase.',
      };
    }

    let subidas = 0;
    const errores = [];

    for (const foto of pendientes) {
      try {
        const subida = await this._subirBlobASupabase(
          foto,
          foto.url_upload || foto.url_foto,
          supabase
        );

        await this._sincronizarMetadataSupabase(
          {
            id_local: foto.id,
            id_animal: foto.id_animal,
            etapa: foto.etapa,
            fecha_toma: foto.fecha_toma,
            peso_estimado: foto.peso_estimado ?? null,
            id_lote: foto.id_lote ?? null,
            latitud: foto.latitud ?? null,
            longitud: foto.longitud ?? null,
            precision_gps_m: foto.precision_gps_m ?? null,
            url_nube: subida.publicUrl,
            mime_type: foto.mime_type || null,
          },
          supabase
        );

        await this.marcarSincronizada(foto.id, subida.publicUrl);
        subidas += 1;
      } catch (error) {
        errores.push({ id: foto.id, error: error.message || String(error) });
      }
    }

    let purgadas = 0;
    if (purgar && subidas > 0) {
      const limpieza = await this.limpiarCelularMelantia();
      purgadas = limpieza.liberados || 0;
    }

    return {
      success: errores.length === 0,
      subidas,
      purgadas,
      errores,
      mensaje:
        errores.length === 0
          ? `Supabase sincronizó ${subidas} evidencia(s) y purgó ${purgadas} archivo(s) local(es).`
          : `Supabase sincronizó ${subidas} evidencia(s) con ${errores.length} error(es).`,
    };
  }

  // ------------------------------------------------------------------
  // GPS + CÁMARA — Captura activada por voz
  // ------------------------------------------------------------------

  /**
   * Obtiene coordenadas GPS del dispositivo.
   * Retorna null si el GPS no está disponible o supera timeoutMs.
   * La captura fotográfica NO se bloquea si el GPS falla.
   */
  _obtenerGPS(timeoutMs = 8000) {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      const timer = setTimeout(() => resolve(null), timeoutMs);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timer);
          resolve({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            precision: Math.round(pos.coords.accuracy),
          });
        },
        () => {
          clearTimeout(timer);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30000 }
      );
    });
  }

  /**
   * Abre la cámara trasera del dispositivo y retorna el File seleccionado.
   * Retorna null si el usuario cancela.
   * Diseñado para manos sucias: el productor no necesita tocar la pantalla
   * más allá del disparo del obturador.
   */
  _abrirCamara() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment'; // cámara trasera
      input.style.display = 'none';
      document.body.appendChild(input);

      let resuelto = false;
      const limpiar = (file) => {
        if (resuelto) return;
        resuelto = true;
        if (document.body.contains(input)) document.body.removeChild(input);
        resolve(file || null);
      };

      input.addEventListener('change', () => limpiar(input.files?.[0]));

      // Detectar cancelación: ventana recupera foco sin archivo seleccionado
      setTimeout(() => {
        window.addEventListener(
          'focus',
          function onFocus() {
            window.removeEventListener('focus', onFocus);
            setTimeout(() => limpiar(null), 500);
          },
          { once: true }
        );
      }, 200);

      input.click();
    });
  }

  /**
   * Captura de evidencia activada por comando de voz.
   *
   * Trigger de voz: "Melantia, toma foto de crecimiento"
   *
   * Flujo automático:
   *   1. GPS y cámara se abren en paralelo (no esperamos GPS para abrir cámara).
   *   2. El productor toma la foto con las manos (manos libres en campo).
   *   3. Se comprime y guarda con coordenadas GPS + lote activo.
   *   4. Retorna mensaje listo para leer con voz.
   *
   * @param {string|number} idAnimal  ID del animal.
   * @param {string}        etapa     'inicio'|'crecimiento'|'final'|'perfil'
   * @param {number}        peso      Peso estimado en kg (0 = sin dato).
   * @param {string|null}   idLote    Lote activo de la sesión (session.getLoteActivo()).
   * @returns {Promise<{success:boolean, mensaje:string, id?:number}>}
   */
  async capturarEvidenciaIA(
    idAnimal,
    etapa = 'crecimiento',
    peso = 0,
    idLote = null
  ) {
    await this.inicializar();

    // GPS y cámara en paralelo: el usuario enfoca mientras el GPS se fija
    const [posicion, archivoFoto] = await Promise.all([
      this._obtenerGPS(),
      this._abrirCamara(),
    ]);

    if (!archivoFoto) {
      return {
        success: false,
        mensaje: 'Captura cancelada. No se tomó ninguna foto.',
      };
    }

    const geoMeta = {
      idLote,
      latitud: posicion?.lat ?? null,
      longitud: posicion?.lon ?? null,
      precision_m: posicion?.precision ?? null,
    };

    const resultado = await this.registrarEvidenciaFoto(
      idAnimal,
      archivoFoto,
      etapa,
      peso,
      null,
      geoMeta
    );

    if (resultado.success && posicion) {
      resultado.mensaje += ` Finca verificada en ${posicion.lat.toFixed(5)}, ${posicion.lon.toFixed(5)}.`;
    }
    return resultado;
  }

  // ------------------------------------------------------------------
  // UTILIDADES
  // ------------------------------------------------------------------

  _blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }
}

// ── Exportación (ESM y script clásico) ──────────────────────────────────────

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GestorEvidenciaFotos,
    LIMITE_FOTOS,
    ETAPAS,
  };
} else {
  window.GestorEvidenciaFotos = GestorEvidenciaFotos;
  window.LIMITE_FOTOS_MELANTIA = LIMITE_FOTOS;

  // Función global lista para el trigger de voz en main_controller.js:
  // if (comando === 'Melantia, toma foto de crecimiento') {
  //   melantiaHabla('Entendido, abriendo cámara. Prepárate.');
  //   await window.capturarEvidenciaIA(idAnimal, 'crecimiento', 0, session.getLoteActivo());
  // }
  window.capturarEvidenciaIA = (
    idAnimal,
    etapa = 'crecimiento',
    peso = 0,
    idLote = null
  ) => {
    const gestor = new GestorEvidenciaFotos(
      window._melantia_nivel_suscripcion || 'basico'
    );
    return gestor.capturarEvidenciaIA(idAnimal, etapa, peso, idLote);
  };

  window.limpiarCelularMelantia = async () => {
    const gestor = new GestorEvidenciaFotos(
      window._melantia_nivel_suscripcion || 'basico'
    );
    return gestor.limpiarCelularMelantia();
  };

  window.sincronizarYLimpiarMelantia = async (config = null, opciones = {}) => {
    const gestor = new GestorEvidenciaFotos(
      window._melantia_nivel_suscripcion || 'basico'
    );
    return gestor.sincronizarYLimpiarMelantia(config, opciones);
  };

  window.sincronizarFotosSupabase = async (config = null, opciones = {}) => {
    const gestor = new GestorEvidenciaFotos(
      window._melantia_nivel_suscripcion || 'basico'
    );
    return gestor.sincronizarConSupabase(config, opciones);
  };

  window.guardarFichaLigeraMelantia = async (datosAnimal) => {
    const gestor = new GestorEvidenciaFotos(
      window._melantia_nivel_suscripcion || 'basico'
    );
    return gestor.guardarFichaLigera(datosAnimal);
  };

  window.guardarMapaGpsLigeroMelantia = async (payload) => {
    const gestor = new GestorEvidenciaFotos(
      window._melantia_nivel_suscripcion || 'basico'
    );
    return gestor.guardarMapaGpsLigero(payload);
  };

  window.obtenerPrivacidadUbicacionMelantia = () => {
    const gestor = new GestorEvidenciaFotos(
      window._melantia_nivel_suscripcion || 'basico'
    );
    return gestor.obtenerConfiguracionPrivacidadUbicacion();
  };

  window.configurarPrivacidadUbicacionMelantia = (config = {}) => {
    const gestor = new GestorEvidenciaFotos(
      window._melantia_nivel_suscripcion || 'basico'
    );
    return gestor.guardarConfiguracionPrivacidadUbicacion(config);
  };

  window.prepararEnvioSeguroMelantia = async (datosAnimal, opciones = {}) => {
    const gestor = new GestorEvidenciaFotos(
      window._melantia_nivel_suscripcion || 'basico'
    );
    return gestor.prepararEnvioSeguro(datosAnimal, opciones);
  };

  window.generarFichaVentaProtegidaMelantia = async (
    datosAnimal,
    opciones = {}
  ) => {
    const gestor = new GestorEvidenciaFotos(
      window._melantia_nivel_suscripcion || 'basico'
    );
    return gestor.generarFichaVentaDigital(datosAnimal, {
      ...opciones,
      modoUbicacion: 'privada',
    });
  };

  window.obtenerTableroGranjasMelantia = async () => {
    const gestor = new GestorEvidenciaFotos(
      window._melantia_nivel_suscripcion || 'basico'
    );
    return gestor.obtenerTableroControl();
  };

  window.liberarEspacioLoteMelantia = async (idLote) => {
    const gestor = new GestorEvidenciaFotos(
      window._melantia_nivel_suscripcion || 'basico'
    );
    return gestor.liberarEspacioLote(idLote);
  };

  window.listarFichasLigerasMelantia = async () => {
    const gestor = new GestorEvidenciaFotos(
      window._melantia_nivel_suscripcion || 'basico'
    );
    return gestor.listarFichasLigeras();
  };

  window.listarMapasGpsLigerosMelantia = async () => {
    const gestor = new GestorEvidenciaFotos(
      window._melantia_nivel_suscripcion || 'basico'
    );
    return gestor.listarMapasGpsLigeros();
  };

  window.listarDocumentosLigerosMelantia = async () => {
    const gestor = new GestorEvidenciaFotos(
      window._melantia_nivel_suscripcion || 'basico'
    );
    return gestor.listarDocumentosLigeros();
  };

  window.generarDocumentoLegalMelantia = async (
    idLote,
    tipoDocumento,
    datosPartes = {},
    opciones = {}
  ) => {
    const gestor = new GestorEvidenciaFotos(
      window._melantia_nivel_suscripcion || 'basico'
    );
    return gestor.generarDocumentoLegalLote(
      idLote,
      tipoDocumento,
      datosPartes,
      opciones
    );
  };
}
