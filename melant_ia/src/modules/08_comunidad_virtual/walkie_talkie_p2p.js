// Esqueleto básico de sincronización P2P para Walkie Talkie MELANTIA
// Usa WebRTC/DataChannel en producción real

export class P2PWalkie {
  constructor({ onMensajeRecibido }) {
    this.onMensajeRecibido = onMensajeRecibido;
    this._activo = true; // Simulación: siempre activo
    // Aquí iría la inicialización real de WebRTC/DataChannel
  }

  estaActivo() {
    return this._activo;
  }

  // Simulación: reenvía localmente, en producción enviaría a otros peers
  enviarMensaje(msg) {
    setTimeout(() => {
      if (this.onMensajeRecibido) this.onMensajeRecibido(msg);
    }, 300); // Simula latencia
  }
}

// Para uso global en navegador
if (typeof window !== 'undefined') {
  window.P2PWalkie = P2PWalkie;
}
