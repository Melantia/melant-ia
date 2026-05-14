// main_controller_BANK.js (Mediador/Orquestador para MELANTIA)
// No contiene lógica de negocio, solo inicializa y coordina módulos

import { DonEloy } from './modules/don_eloy_wisdom.js';
let PauletteIA, LocationEngine, EconomyCore, SocioIdentity;

async function initModules() {
  try {
    [PauletteIA, LocationEngine, EconomyCore, SocioIdentity] =
      await Promise.all([
        import('./modules/paulette_ia.js'),
        import('./modules/location_engine.js'),
        import('./modules/economy_core.js'),
        import('./modules/socio_identity.js'),
      ]);
  } catch (err) {
    console.error('Error cargando módulos:', err);
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  await initModules();

  // Cargar historias de Don Eloy al inicio (para disponibilidad offline)
  DonEloy.cargarHistorias();

  LocationEngine?.init();
  EconomyCore?.init();
  SocioIdentity?.init();

  document.getElementById('btn-voz-general')?.addEventListener('click', () => {
    PauletteIA?.speak('¡Bienvenido a MELANTIA!');
    // Ejemplo: Don Eloy narra una historia aleatoria
    // DonEloy.narrarHistoria(Math.floor(Math.random() * 4));
  });

  document
    .getElementById('btn-gps-medidor')
    ?.addEventListener('click', async () => {
      const ubicacion = await LocationEngine?.getCurrentLocation();
      // ...actualizar UI...
    });

  EconomyCore?.onTransaction(async (data) => {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        tipo: 'GUARDAR_FINANZAS',
        payload: data,
      });
    }
  });
});

navigator.serviceWorker?.addEventListener('message', (event) => {
  if (event.data?.tipo === 'ACTUALIZAR_ESTADO') {
    // Actualizar estado global si es necesario
  }
});
