// utils.js
// Funciones utilitarias compartidas para MELANTIA

export function moneda(valor) {
  return `$${Number(valor || 0).toFixed(2)}`;
}

export function escapeHtml(texto) {
  return String(texto || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function fechaLarga(fecha = new Date()) {
  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(fecha));
}
