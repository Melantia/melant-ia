/**
 * REPRODUCTOR ACÚSTICO RURAL - MELANTIA
 * Controla el comportamiento del ave guardiana de forma local (Offline-First).
 */
const AguilaAudioCtrl = {
  // Rutas a los assets en el almacenamiento local de la app
  audioAlertaUrl: 'src/storage/assets/audio/aguila_risco_alto.mp3',
  audioNormalUrl: 'src/storage/assets/audio/aguila_vuelo_bajo.mp3',

  /**
   * CHILLIDO EN LO ALTO DEL RISCO (Alerta Máxima / Emergencia)
   * Volumen al 100% y doble vibración larga para romper el ruido de motores o viento.
   */
  lanzarAlertaFuerte: function () {
    try {
      const elAguila = new Audio(this.audioAlertaUrl);
      elAguila.volume = 1.0; // Potencia total para el campo
      elAguila
        .play()
        .catch((e) =>
          console.log('Audio bloqueado hasta interacción del usuario.')
        );
      // Vibración fuerte en el bolsillo del productor
      if (navigator.vibrate) {
        navigator.vibrate([600, 250, 600]);
      }
    } catch (err) {
      console.error('No se pudo reproducir el canto de alerta:', err);
    }
  },

  /**
   * ECO SUAVE EN EL VALLE (Notificación / Tarea Finalizada)
   * Volumen bajo al 35% y un toque sutil de vibración para confirmación.
   */
  lanzarEcoSuave: function () {
    try {
      const elAguila = new Audio(this.audioNormalUrl);
      elAguila.volume = 0.35; // Sonido sutil y elegante
      elAguila.play().catch((e) => console.log('Audio en espera.'));
      // Un pulso cortito de confirmación
      if (navigator.vibrate) {
        navigator.vibrate(80);
      }
    } catch (err) {
      console.error('No se pudo reproducir el eco de notificación:', err);
    }
  },
};
