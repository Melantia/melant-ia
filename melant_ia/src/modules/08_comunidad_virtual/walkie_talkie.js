// Walkie Talkie con soporte para moderador (Don Eloy)
// y funciones básicas de mensajes y audios offline/online

// Límite de mensajes/audios para no llenar la memoria
const LIMITE_MENSAJES = 30;
const LIMITE_AUDIOS = 10;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('comunidad_virtual_db', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('mensajes')) {
        db.createObjectStore('mensajes', {
          keyPath: 'id',
          autoIncrement: true,
        });
      }
      if (!db.objectStoreNames.contains('audios')) {
        db.createObjectStore('audios', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export class WalkieTalkie {
  constructor(moderador = 'Don Eloy') {
    this.moderador = moderador;
    this.mensajes = [];
    this.audios = [];
    this.cargarDesdeDB();
  }

  async cargarDesdeDB() {
    const db = await openDB();
    // Mensajes
    const txM = db.transaction('mensajes', 'readonly');
    const storeM = txM.objectStore('mensajes');
    const reqM = storeM.getAll();
    reqM.onsuccess = () => {
      this.mensajes = reqM.result || [];
    };
    // Audios
    const txA = db.transaction('audios', 'readonly');
    const storeA = txA.objectStore('audios');
    const reqA = storeA.getAll();
    reqA.onsuccess = () => {
      this.audios = reqA.result || [];
    };
  }

  async guardarMensajeDB(mensaje) {
    const db = await openDB();
    const tx = db.transaction('mensajes', 'readwrite');
    const store = tx.objectStore('mensajes');
    await store.add(mensaje);
    // Limitar cantidad
    const all = await store.getAll();
    if (all.length > LIMITE_MENSAJES) {
      // Eliminar los más antiguos
      const ids = all
        .sort((a, b) => a.timestamp - b.timestamp)
        .map((m) => m.id);
      for (let i = 0; i < all.length - LIMITE_MENSAJES; i++) {
        await store.delete(ids[i]);
      }
    }
  }

  async guardarAudioDB(audio) {
    const db = await openDB();
    const tx = db.transaction('audios', 'readwrite');
    const store = tx.objectStore('audios');
    await store.add(audio);
    // Limitar cantidad
    const all = await store.getAll();
    if (all.length > LIMITE_AUDIOS) {
      const ids = all
        .sort((a, b) => a.timestamp - b.timestamp)
        .map((a) => a.id);
      for (let i = 0; i < all.length - LIMITE_AUDIOS; i++) {
        await store.delete(ids[i]);
      }
    }
  }

  async agregarMensaje(texto, autor) {
    const mensaje = { texto, autor, timestamp: Date.now() };
    this.mensajes.push(mensaje);
    if (this.mensajes.length > LIMITE_MENSAJES) {
      this.mensajes = this.mensajes.slice(-LIMITE_MENSAJES);
    }
    await this.guardarMensajeDB(mensaje);
  }

  async eliminarMensaje(idx) {
    const mensaje = this.mensajes[idx];
    this.mensajes.splice(idx, 1);
    // Eliminar de DB
    const db = await openDB();
    const tx = db.transaction('mensajes', 'readwrite');
    const store = tx.objectStore('mensajes');
    // Buscar por timestamp y texto (simple)
    const all = await store.getAll();
    const found = all.find(
      (m) => m.timestamp === mensaje.timestamp && m.texto === mensaje.texto
    );
    if (found) await store.delete(found.id);
  }

  obtenerMensajes() {
    return this.mensajes;
  }

  async agregarAudio(blobUrl, autor) {
    const audio = { blobUrl, autor, timestamp: Date.now(), escuchado: false };
    this.audios.push(audio);
    if (this.audios.length > LIMITE_AUDIOS) {
      this.audios = this.audios.slice(-LIMITE_AUDIOS);
    }
    await this.guardarAudioDB(audio);
  }

  marcarAudioEscuchado(audio) {
    audio.escuchado = true;
    audio.timestamp_escucha = Date.now();
    // No persistimos escuchado para simplificar
  }

  limpiarAudiosViejos(segundos = 30) {
    const ahora = Date.now();
    this.audios = this.audios.filter(
      (a) => !(a.escuchado && ahora - a.timestamp_escucha > segundos * 1000)
    );
    // No persistimos limpieza para simplificar
  }

  obtenerAudios() {
    return this.audios;
  }
}
