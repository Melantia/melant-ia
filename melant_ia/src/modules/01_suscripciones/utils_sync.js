// Utilidades de sincronización offline para MELANTIA
const SYNC_QUEUE_KEY = 'melantia_sync_queue';

export function agregarASyncQueue(evento) {
  const queue = JSON.parse(window.localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
  queue.push(evento);
  window.localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

export function procesarSyncQueue(callback) {
  if (!navigator.onLine) return;
  const queue = JSON.parse(window.localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
  if (!queue.length) return;
  queue.forEach((evento) => {
    if (typeof callback === 'function') callback(evento);
  });
  window.localStorage.removeItem(SYNC_QUEUE_KEY);
}

export function inicializarSyncQueue(callback) {
  window.addEventListener('online', () => procesarSyncQueue(callback));
  setInterval(() => procesarSyncQueue(callback), 60000);
}
