// apiccultura.js — Submódulo MELANTIA
export function mostrarPanel() {
  const contenedor =
    document.getElementById('contenedor-principal') || document.body;
  contenedor.innerHTML = `
    <div class="panel-especifico" style="max-width:800px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
      <h2 style="color:#276749;">Apicultura</h2>
      <p style="color:#444;font-size:1.1em;">Gestión integral de colmenas, libro de campo, calendario de vacunación y cálculos técnicos.</p>
      <form id="form-colmena" style="margin-bottom:18px;display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;">
        <input type="text" id="colmena-id" placeholder="ID Colmena" required style="width:120px;padding:6px 10px;border-radius:6px;border:1px solid #ccc;">
        <input type="date" id="fecha-registro" required style="padding:6px 10px;border-radius:6px;border:1px solid #ccc;">
        <input type="number" id="num-abejas" placeholder="N° Abejas" min="0" style="width:120px;padding:6px 10px;border-radius:6px;border:1px solid #ccc;">
        <input type="number" id="produccion-miel" placeholder="Miel (kg)" min="0" step="any" style="width:120px;padding:6px 10px;border-radius:6px;border:1px solid #ccc;">
        <input type="text" id="actividad" placeholder="Actividad (revisión, cosecha, etc.)" style="width:180px;padding:6px 10px;border-radius:6px;border:1px solid #ccc;">
        <button type="submit" style="background:#276749;color:#fff;padding:7px 18px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">Registrar</button>
      </form>
      <div id="tabla-libro-campo" style="margin-bottom:24px;"></div>
      <h3 style="color:#1976d2;">Calendario de Vacunación</h3>
      <div id="calendario-vacunacion" style="margin-bottom:24px;"></div>
      <h3 style="color:#1976d2;">Calculadora Técnica</h3>
      <div style="display:flex;gap:24px;flex-wrap:wrap;">
        <div style="flex:1;min-width:260px;">
          <b>Alimento diario recomendado (g):</b>
          <form id="form-alimento">
            <input type="number" id="colmena-alim" placeholder="N° Abejas" min="0" style="width:120px;padding:6px 10px;border-radius:6px;border:1px solid #ccc;">
            <button type="submit" style="background:#43a047;color:#fff;padding:6px 14px;border:none;border-radius:6px;font-size:1em;cursor:pointer;">Calcular</button>
          </form>
          <div id="resultado-alimento" style="margin-top:8px;color:#276749;"></div>
        </div>
        <div style="flex:1;min-width:260px;">
          <b>Fertilizante por apiario (g):</b>
          <form id="form-fertilizante">
            <input type="number" id="colmena-fert" placeholder="N° Colmenas" min="1" style="width:120px;padding:6px 10px;border-radius:6px;border:1px solid #ccc;">
            <button type="submit" style="background:#fbc02d;color:#222;padding:6px 14px;border:none;border-radius:6px;font-size:1em;cursor:pointer;">Calcular</button>
          </form>
          <div id="resultado-fertilizante" style="margin-top:8px;color:#1976d2;"></div>
        </div>
      </div>
      <h3 style="color:#1976d2;">Cosecha de la Miel y sus Derivados</h3>
      <div id="cosecha-miel" style="margin-bottom:24px;"></div>
      <h3 style="color:#1976d2;margin-top:32px;">Informe Técnico y Visualización</h3>
      <div id="informe-apicultura" style="margin-bottom:24px;"></div>
        // Cosecha de la Miel y sus Derivados
        const cosecha = [
          {
            etapa: 'Preparación para la cosecha',
            actividades: [
              'Seleccionar colmenas maduras (al menos 80% de opérculo en los panales)',
              'Preparar equipo de protección y herramientas limpias',
              'Evitar uso de productos químicos cerca de la cosecha',
            ],
          },
          {
            etapa: 'Extracción de la miel',
            actividades: [
              'Retirar panales con miel operculada',
              'Cepillar abejas suavemente para no dañarlas',
              'Transportar panales a sala de extracción',
              'Desopercular panales y extraer miel con extractor',
            ],
          },
          {
            etapa: 'Filtrado y almacenamiento',
            actividades: [
              'Filtrar la miel para eliminar impurezas',
              'Almacenar en envases limpios y herméticos',
              'Etiquetar con fecha y origen',
            ],
          },
          {
            etapa: 'Obtención de derivados',
            actividades: [
              'Recolectar cera de abejas y propóleos',
              'Procesar polen y jalea real si corresponde',
              'Registrar cantidades y lotes de cada derivado',
            ],
          },
          {
            etapa: 'Limpieza y cierre',
            actividades: [
              'Limpiar herramientas y sala de extracción',
              'Devolver panales vacíos a las colmenas',
              'Registrar la cosecha en el libro de campo',
            ],
          },
        ];
        const cosechaDiv = document.getElementById('cosecha-miel');
        cosechaDiv.innerHTML = '<ul style="padding-left:18px;">' + cosecha.map(ev => `<li><b>${ev.etapa}:</b><ul>${ev.actividades.map(act => `<li>${act}</li>`).join('')}</ul></li>`).join('') + '</ul>';
      <button onclick="window.cargarDatosModulo(null, 'Gestión de Fincas')" style="margin-top:30px;padding:10px 24px;background:#276749;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:1em;">← Volver</button>
    </div>
  `;

  // Lógica de libro de campo
  let libroCampo = JSON.parse(
    localStorage.getItem('libroCampoApicultura') || '[]'
  );
  function renderTabla() {
    const tabla = document.getElementById('tabla-libro-campo');
    if (!tabla) return;
    if (!libroCampo.length) {
      tabla.innerHTML = '<i>No hay registros aún.</i>';
      return;
    }
    let html = `<table style="width:100%;border-collapse:collapse;">
      <thead><tr style="background:#e3f2fd;"><th>ID</th><th>Fecha</th><th>Abejas</th><th>Miel (kg)</th><th>Actividad</th></tr></thead><tbody>`;
    libroCampo.forEach((r) => {
      html += `<tr><td>${r.id}</td><td>${r.fecha}</td><td>${r.abejas}</td><td>${r.miel}</td><td>${r.actividad}</td></tr>`;
    });
    html += '</tbody></table>';
    tabla.innerHTML = html;
  }
  renderTabla();

  document.getElementById('form-colmena').onsubmit = function (e) {
    e.preventDefault();
    const id = document.getElementById('colmena-id').value.trim();
    const fecha = document.getElementById('fecha-registro').value;
    const abejas = parseInt(document.getElementById('num-abejas').value) || 0;
    const miel =
      parseFloat(document.getElementById('produccion-miel').value) || 0;
    const actividad = document.getElementById('actividad').value.trim();
    if (!id || !fecha) return;
    libroCampo.push({ id, fecha, abejas, miel, actividad });
    localStorage.setItem('libroCampoApicultura', JSON.stringify(libroCampo));
    renderTabla();
    this.reset();
    renderInforme();
  };

  // Calendario de vacunación (simulado)
  const calendario = [
    { fecha: '2026-06-01', evento: 'Vacunación contra Loque americana' },
    { fecha: '2026-07-15', evento: 'Revisión sanitaria anual' },
    { fecha: '2026-08-10', evento: 'Tratamiento varroa' },
  ];
  const calDiv = document.getElementById('calendario-vacunacion');
  calDiv.innerHTML =
    '<ul style="padding-left:18px;">' +
    calendario
      .map((ev) => `<li><b>${ev.fecha}:</b> ${ev.evento}</li>`)
      .join('') +
    '</ul>';

  // Calculadora de alimento
  document.getElementById('form-alimento').onsubmit = function (e) {
    e.preventDefault();
    const abejas = parseInt(document.getElementById('colmena-alim').value) || 0;
    const resultado = abejas > 0 ? (abejas * 0.12).toFixed(2) : 0;
    document.getElementById('resultado-alimento').textContent =
      resultado + ' gramos/día';
  };
  // Calculadora de fertilizante
  document.getElementById('form-fertilizante').onsubmit = function (e) {
    e.preventDefault();
    const colmenas =
      parseInt(document.getElementById('colmena-fert').value) || 0;
    const resultado = colmenas > 0 ? (colmenas * 15).toFixed(2) : 0;
    document.getElementById('resultado-fertilizante').textContent =
      resultado + ' gramos/mes';
  };

  // Informe técnico y visualización
  function renderInforme() {
    const div = document.getElementById('informe-apicultura');
    if (!div) return;
    if (!libroCampo.length) {
      div.innerHTML = '<i>No hay datos para informe.</i>';
      return;
    }
    const totalMiel = libroCampo.reduce(
      (acc, r) => acc + (parseFloat(r.miel) || 0),
      0
    );
    const totalColmenas = new Set(libroCampo.map((r) => r.id)).size;
    const totalAbejas = libroCampo.reduce(
      (acc, r) => acc + (parseInt(r.abejas) || 0),
      0
    );
    div.innerHTML = `
      <div style="background:#e3f2fd;padding:18px;border-radius:12px;max-width:600px;margin:18px auto;">
        <b>Total colmenas:</b> ${totalColmenas}<br>
        <b>Total abejas registradas:</b> ${totalAbejas}<br>
        <b>Producción total de miel:</b> ${totalMiel.toFixed(2)} kg<br>
      </div>
    `;
  }
  renderInforme();
}
