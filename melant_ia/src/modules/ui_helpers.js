// Paneles de asesores y asistentes
// ===============================

// FabrizzioAsesor
export const FabrizzioAsesor = {
  // ...copia aquí toda la definición de FabrizzioAsesor...
};

// DrJorgeVeterinario
export const DrJorgeVeterinario = {
  // ...copia aquí toda la definición de DrJorgeVeterinario...
};

// MelantiaAsistente
export const MelantiaAsistente = {
  // ...copia aquí toda la definición de MelantiaAsistente...
};
// modules/ui_helpers.js

// Botón y lógica para guiar al usuario a zona con mejor cobertura
export function guiarAZonaCobertura() {
  const msg =
    'Para completar la compra, acércate a una zona con mejor cobertura. Usa el mapa o sigue las indicaciones del asistente para encontrar señal.';
  if (typeof window.hablarAtencionVentas === 'function') {
    window.hablarAtencionVentas(msg);
  }
  alert(msg + '\n\nPróximamente: integración con mapa de cobertura y GPS.');
}

// Validación de cobertura para compras en tienda
export function validarCoberturaParaCompra() {
  if (!navigator.onLine) {
    const msg =
      'Para realizar compras necesitas conexión a internet o cobertura de red. Puedes explorar la tienda offline, pero la compra solo es posible con cobertura.';
    if (typeof window.hablarAtencionVentas === 'function') {
      window.hablarAtencionVentas(msg);
    }
    alert(msg);
    return false;
  }
  return true;
}

// Utilidad para atención/ventas con voces rotativas
export function hablarAtencionVentas(texto, tipo = 'normal') {
  if (
    window.MelantiaAsistente &&
    typeof window.MelantiaAsistente.hablarAtencionVentas === 'function'
  ) {
    window.MelantiaAsistente.hablarAtencionVentas(texto, tipo);
  } else {
    cargarVoz('Melantia');
    _voz(texto);
  }
}

// Puedes seguir extrayendo helpers visuales, banners, renderizadores, etc. aquí...
