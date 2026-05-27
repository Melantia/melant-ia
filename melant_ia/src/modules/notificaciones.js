// notificaciones.js — Módulo de Notificaciones MELANTIA
// Lógica base para notificaciones locales y futuras integraciones push

const NotificacionesMelantia = {
  // Enviar una notificación local simple
  enviarNotificacion: function (titulo, mensaje) {
    if (!('Notification' in window)) {
      alert(mensaje); // Fallback si no hay soporte
      return;
    }
    if (Notification.permission === 'granted') {
      new Notification(titulo, { body: mensaje });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(function (permiso) {
        if (permiso === 'granted') {
          new Notification(titulo, { body: mensaje });
        } else {
          alert(mensaje);
        }
      });
    } else {
      alert(mensaje);
    }
  },

  // Guardar notificación en localStorage para historial
  guardarNotificacion: function (titulo, mensaje) {
    const historial = JSON.parse(
      localStorage.getItem('notificacionesMelantia') || '[]'
    );
    historial.push({
      titulo,
      mensaje,
      fecha: new Date().toISOString(),
    });
    localStorage.setItem('notificacionesMelantia', JSON.stringify(historial));
  },

  // Obtener historial de notificaciones
  obtenerHistorial: function () {
    return JSON.parse(localStorage.getItem('notificacionesMelantia') || '[]');
  },
};

// Exponer globalmente si es necesario
window.NotificacionesMelantia = NotificacionesMelantia;

export default NotificacionesMelantia;
