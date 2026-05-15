// walkie_talkie.js
// Módulo base para Walkie Talkie MELANTIA (Web/PWA)
class MensajeTexto {
  constructor(texto, autor, timestamp = Date.now()) {
    this.texto = texto;
    this.autor = autor;
    this.timestamp = timestamp;
  }
}

class MensajeAudio {
  constructor(blobUrl, autor, timestamp = Date.now()) {
    this.blobUrl = blobUrl;
    this.autor = autor;
    this.timestamp = timestamp;
    this.escuchado = false;
    this.timestampEscucha = null;
  }
}

class WalkieTalkie {
  constructor(maxMensajes = 10) {
    this.mensajes = [];
    this.maxMensajes = maxMensajes;
    this.audios = [];
  }

  agregarMensaje(texto, autor) {
    if (this.mensajes.length >= this.maxMensajes) {
      this.mensajes.shift(); // Elimina el más antiguo
    }
    this.mensajes.push(new MensajeTexto(texto, autor));
  }

  agregarAudio(blobUrl, autor) {
    const audio = new MensajeAudio(blobUrl, autor);
    this.audios.push(audio);
    return audio;
  }

  marcarAudioEscuchado(audio) {
    audio.escuchado = true;
    audio.timestampEscucha = Date.now();
  }

  limpiarAudiosViejos(segundos = 30) {
    const ahora = Date.now();
    this.audios = this.audios.filter(
      (a) => !(a.escuchado && ahora - a.timestampEscucha > segundos * 1000)
    );
  }

  obtenerMensajes() {
    return [...this.mensajes];
  }

  obtenerAudios() {
    return [...this.audios];
  }
}
