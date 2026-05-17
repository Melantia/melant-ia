// modules/websocket_alertas.js
// Lógica de conexión WebSocket y gestión de mensajes de alerta/actualización

export function inicializarWebSocketAlertas() {
  try {
    const socket = new WebSocket('ws://localhost:8000/ws/mensajes');
    socket.onmessage = function (event) {
      try {
        const mensaje = JSON.parse(event.data);
        window.onMensajeBackend && window.onMensajeBackend(mensaje);
      } catch (e) {
        console.error('Mensaje no válido:', event.data);
      }
    };
    socket.onopen = function () {
      console.log('Conexión WebSocket establecida');
    };
    socket.onerror = function (error) {
      console.error('WebSocket error:', error);
    };
    socket.onclose = function () {
      console.log('WebSocket cerrado');
    };
  } catch (err) {
    console.error('No se pudo conectar al WebSocket de alertas:', err);
  }
}
