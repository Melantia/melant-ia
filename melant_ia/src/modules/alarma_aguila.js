// modules/alarma_aguila.js
// Lógica de alarma diaria y control de audio del águila

export function inicializarAlarmaAguila() {
  if (localStorage.getItem('alarmaAguilaActiva') === null) {
    if (
      confirm(
        '¿Deseas que el sonido del águila te despierte todos los días a las 6:00 am?'
      )
    ) {
      localStorage.setItem('alarmaAguilaActiva', 'true');
    } else {
      localStorage.setItem('alarmaAguilaActiva', 'false');
    }
  }
  setInterval(() => {
    const ahora = new Date();
    const hora = ahora.getHours();
    const minutos = ahora.getMinutes();
    const alarmaActiva = localStorage.getItem('alarmaAguilaActiva') === 'true';
    if (hora === 6 && minutos === 0 && alarmaActiva) {
      if (
        window.AguilaAudioCtrl &&
        typeof AguilaAudioCtrl.lanzarAlertaFuerte === 'function'
      ) {
        AguilaAudioCtrl.lanzarAlertaFuerte();
      }
    }
  }, 60000);
}

export function desactivarAlarmaAguila() {
  localStorage.setItem('alarmaAguilaActiva', 'false');
  alert('La alarma diaria del águila ha sido desactivada.');
}
