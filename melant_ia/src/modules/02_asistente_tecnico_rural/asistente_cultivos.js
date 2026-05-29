// asistente_cultivos.js
// Adaptación JS del módulo Python asistente_cultivos.py para integración web

export class AsistenteCultivosIA {
  constructor() {
    this.ruta_gps = '02_BIBLIOTECA/gps_agro';
    this.ruta_conocimiento = '02_BIBLIOTECA/cultivos_varios';
  }

  iniciarMonitoreoLote(loteId, coordenadas, cultivo) {
    // 1. Registrar posición (Agricultura de Precisión)
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.]/g, '')
      .slice(0, 15);
    const logGps = {
      lote: loteId,
      posicion: coordenadas, // Ej: {lat: -1.023, lon: -79.456}
      cultivo: cultivo,
      fecha: timestamp,
    };
    // Simulación: guardar en localStorage (en web no hay acceso a archivos locales)
    const key = `${this.ruta_gps}/lote_${loteId}_${timestamp}`;
    localStorage.setItem(key, JSON.stringify(logGps));
    // 2. Cargar conocimiento proactivo (Inferencia)
    return this.obtenerInstruccionesProactivas(cultivo);
  }

  obtenerInstruccionesProactivas(cultivo) {
    // Simulación: lógica simple para cacao
    if ((cultivo || '').toLowerCase().includes('cacao')) {
      return {
        ia_dice: 'He registrado las coordenadas de este lote de Cacao.',
        accion_precision:
          'Según la bioclimatología actual, toca abonado potásico.',
        manual_recomendado: '02_BIBLIOTECA/cacao/guia_nutricion.pdf',
      };
    }
    return { ia_dice: 'Lote registrado correctamente.' };
  }

  static getVoiceSummary() {
    return (
      'Módulo de Cultivos activo. ' +
      'Puedo monitorear lotes con GPS, vincular cada parcela con su cultivo, ' +
      'y dar instrucciones proactivas según la etapa de crecimiento. ' +
      'Dime el nombre del lote o cultivo para comenzar.'
    );
  }
}

// Panel interactivo para integración MELANTIA
export function mostrarPanel() {
  const cont = document.getElementById('contenedor-principal') || document.body;
  cont.innerHTML = `
    <div class="panel-especifico" style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
      <h2 style="color:#276749;">Asistente Técnico en Cultivos</h2>
      <p style="color:#444;font-size:1.1em;">Registra lotes, vincula cultivos y obtén recomendaciones inteligentes.</p>
      <form id="form-cultivo">
        <label>Lote: <input type="text" id="lote-id" required placeholder="Ej: Lote 1" style="margin-bottom:8px;"></label><br>
        <label>Cultivo: <input type="text" id="cultivo-nombre" required placeholder="Ej: Cacao" style="margin-bottom:8px;"></label><br>
        <label>Latitud: <input type="number" id="lat" step="any" required placeholder="Ej: -1.02" style="width:120px;margin-bottom:8px;"></label>
        <label>Longitud: <input type="number" id="lon" step="any" required placeholder="Ej: -79.45" style="width:120px;margin-bottom:8px;"></label><br>
        <button type="submit" style="margin-top:12px;padding:8px 20px;background:#276749;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:1em;">Registrar lote</button>
      </form>
      <div id="cultivo-resultado" style="margin-top:18px;color:#276749;font-weight:bold;"></div>
      <button onclick="window.cargarDatosModulo(null, 'Asistente Técnico Rural')" style="margin-top:30px;padding:10px 24px;background:#276749;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:1em;">← Volver</button>
    </div>
  `;

  const form = document.getElementById('form-cultivo');
  if (form) {
    form.onsubmit = function (e) {
      e.preventDefault();
      const loteId = document.getElementById('lote-id').value.trim();
      const cultivo = document.getElementById('cultivo-nombre').value.trim();
      const lat = parseFloat(document.getElementById('lat').value);
      const lon = parseFloat(document.getElementById('lon').value);
      if (!loteId || !cultivo || isNaN(lat) || isNaN(lon)) {
        document.getElementById('cultivo-resultado').textContent =
          'Completa todos los campos correctamente.';
        return;
      }
      const ia = new AsistenteCultivosIA();
      const resultado = ia.iniciarMonitoreoLote(loteId, { lat, lon }, cultivo);
      let html = `<div>✔ Lote registrado: <b>${loteId}</b> (${cultivo})</div>`;
      if (resultado.ia_dice) html += `<div>${resultado.ia_dice}</div>`;
      if (resultado.accion_precision)
        html += `<div><b>Recomendación:</b> ${resultado.accion_precision}</div>`;
      if (resultado.manual_recomendado)
        html += `<div><a href="${resultado.manual_recomendado}" target="_blank">Ver manual recomendado</a></div>`;
      document.getElementById('cultivo-resultado').innerHTML = html;
    };
  }
}
