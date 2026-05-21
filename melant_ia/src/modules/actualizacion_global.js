// --- Lógica centralizada de actualización y sincronización climática ---

// Configuración: solo dos ventanas por día (mañana y tarde)
const horasVentana = [8, 14]; // 8:00 y 14:00
const intentosPorVentana = 2;
const intervaloMin = 15;
let estadoActualizacion = {
  dia: null,
  ventana: null,
  intentos: 0,
  ultimaActualizacion: null,
  timerId: null,
};

function condicionesOptimas() {
  // Cobertura verde, conectado a red eléctrica, batería > 30%, no caliente
  const cobertura = window.SemaforoUI?.nivel === 'verde';
  const energia =
    typeof window.estaCargando === 'function' ? window.estaCargando() : false;
  const bateria = window.BateriaMelantia?.nivel ?? 1;
  const noCaliente = !window.BateriaMelantia?.caliente;
  return (
    cobertura && energia && bateria > 0.3 && noCaliente && navigator.onLine
  );
}

function proximaVentana() {
  const ahora = new Date();
  let siguiente = null;
  for (const hora of horasVentana) {
    const ventana = new Date(ahora);
    ventana.setHours(hora, 0, 0, 0);
    if (ventana > ahora) {
      siguiente = ventana;
      break;
    }
  }
  if (!siguiente) {
    // Siguiente día
    const futuro = new Date(ahora);
    futuro.setDate(futuro.getDate() + 1);
    futuro.setHours(horasVentana[0], 0, 0, 0);
    siguiente = futuro;
  }
  return siguiente;
}

function programarSiguienteIntento() {
  if (estadoActualizacion.timerId) clearTimeout(estadoActualizacion.timerId);
  let espera = intervaloMin * 60 * 1000;
  if (estadoActualizacion.intentos >= intentosPorVentana) {
    // Pasar a la siguiente ventana
    const siguiente = proximaVentana();
    espera = siguiente - new Date();
    estadoActualizacion.intentos = 0;
    estadoActualizacion.ventana = siguiente.getHours();
    estadoActualizacion.dia = siguiente.getDay();
  }
  estadoActualizacion.timerId = setTimeout(
    () => {
      intentarActualizacion();
    },
    Math.max(espera, 1000)
  );
}

async function intentarActualizacion(forzado = false) {
  const ahora = new Date();
  const dia = ahora.getDay();
  const hora = ahora.getHours();
  // Solo dos ventanas por día
  if (!forzado) {
    if (!horasVentana.includes(hora)) {
      programarSiguienteIntento();
      return;
    }
    if (estadoActualizacion.ultimaActualizacion) {
      const ultima = new Date(estadoActualizacion.ultimaActualizacion);
      if (
        ultima.getDate() === ahora.getDate() &&
        ultima.getMonth() === ahora.getMonth() &&
        ultima.getFullYear() === ahora.getFullYear()
      ) {
        // Ya se actualizó hoy
        programarSiguienteIntento();
        return;
      }
    }
  }
  if (!condicionesOptimas()) {
    programarSiguienteIntento();
    return;
  }
  // Ejecutar actualización de conocimientos y sincronización climática
  try {
    window.actualizarConocimientos?.(forzado, { origen: 'programado' });
    if (
      typeof window.GestorRuralMelantia?.sincronizarClimaTransparente ===
      'function'
    ) {
      await window.GestorRuralMelantia.sincronizarClimaTransparente();
    }
  } catch (e) {
    console.warn('[MELANTIA] Error en actualización global:', e);
  }
  estadoActualizacion.ultimaActualizacion = ahora.toISOString();
  estadoActualizacion.intentos++;
  programarSiguienteIntento();
}

function actualizarSiCondiciones() {
  if (condicionesOptimas()) {
    intentarActualizacion(true);
  }
}

function iniciarActualizacionGlobal() {
  if (estadoActualizacion.timerId) return;
  programarSiguienteIntento();
  window.addEventListener('online', actualizarSiCondiciones);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) actualizarSiCondiciones();
  });
  if (window.BateriaMelantia?.onChange) {
    window.BateriaMelantia.onChange(actualizarSiCondiciones);
  }
}

window.MelantiaActualizacionGlobal = {
  iniciar: iniciarActualizacionGlobal,
  intentar: intentarActualizacion,
  condicionesOptimas,
};

iniciarActualizacionGlobal();
