// =====================
// Indicador visual de señal y brújula de cobertura (conectividad local)
// =====================

window.SemaforoUI = {
  // Muestra guía para buscar mejor señal según tipo actual
  mostrarGuiaCobertura(tipoActual) {
    const panel = document.getElementById('panel-novedades');
    if (!panel) return;
    const consejos = {
      '2g': 'Estás en 2G. Muévete hacia una zona alta o abierta, alejándote de edificios y árboles densos.',
      'slow-2g':
        'La señal está muy débil. Busca una loma, un lugar abierto o espera a conectarte a WiFi.',
      '3g': 'Tienes 3G. Para 4G prueba alejarte del área de sombra de cobertura o conectarte a WiFi.',
    };
    const consejo =
      consejos[tipoActual] ||
      'Busca un lugar alto y abierto, o conéctate a un WiFi estable.';
    panel.innerHTML = `
      <div class="novedad-card semaforo-alerta">
        <p class="novedad-n1">📡 Guía de Señal — Modo Emergencia</p>
        <p class="novedad-n2">Señal actual: <strong>${tipoActual.toUpperCase()}</strong></p>
        <p class="novedad-n3">💡 ${consejo}</p>
        <p style="font-size:0.8em;color:#888;margin-top:6px;">La descarga de emergencia iniciará aunque la señal no sea perfecta.</p>
        <div class="novedad-acciones">
          <button onclick="SemaforoUI.cerrar()">Entendido</button>
    ) {
      const tablero = await window.GestorGranjasMelantia._cargarTablero();
      const loteAgricola = tablero.lotes.find(
        (lote) => lote.tipo_lote === 'agricola'
      );
      return loteAgricola?.id_lote || null;
    }

    return null;
  },

  hablar(texto) {
    cargarVoz('Fabrizzio');
    _voz(texto);
  },

  async descargarNuevasReglas() {}

// =====================
// Referencias a módulos técnicos globales (modularizado)
// =====================
// UI del radar: window.RadarUIMelantia
// Vibración: window.VibracionMelantia
// Diagnóstico: window.DiagnosticoMelantia
// Puntos de señal: window.PuntosSenalMelantia
// Voces: window.vozFabrizzio, window.vozValentina, window.vozJorge
// Acceso central: window.MelantiaTecnico
