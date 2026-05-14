// Módulo Agricultura de Precisión
const AgriculturaPrecision = {
  cursos: [],
  sensores: [],
  catalogos: [],
  async init() {
    await this.cargarCursos();
    await this.cargarSensores();
    this.render();
  },
  async cargarCursos() {
    try {
      const cursos = await fetch('conocimiento/cursos_agricultura_precision.json').then(r => r.json());
      this.cursos = cursos;
    } catch (e) { this.cursos = []; }
  },
  async cargarSensores() {
    try {
      const sensores = await fetch('conocimiento/sensores_agricultura_precision.json').then(r => r.json());
      this.sensores = sensores;
    } catch (e) { this.sensores = []; }
    try {
      const catalogos = await fetch('conocimiento/catalogo_sensores.json').then(r => r.json());
      this.catalogos = catalogos;
    } catch (e) { this.catalogos = []; }
  },
  render() {
    const view = document.getElementById('view-precision');
    if (!view) return;
    view.innerHTML = `
      <h1 style="font-size:22px;margin-bottom:10px;">Agricultura de Precisión</h1>
      <p style="color:var(--fg-muted);font-size:14px;margin-bottom:18px;">Cursos, sensores y catálogos para medición avanzada.</p>
      ${this.cursos.length ? this.cursos.map(c => `
        <div class="card" style="margin-bottom:18px;">
          <h2 style="font-size:18px;margin-bottom:8px;">${c.titulo}</h2>
          <p style="color:var(--fg-muted);font-size:14px;margin-bottom:12px;">${c.descripcion}</p>
          <h3 style="margin-bottom:6px;">Módulos:</h3>
          <ul style="margin-left:18px;">
            ${c.modulos.map(m => `<li><b>${m.titulo}:</b> ${m.descripcion}</li>`).join('')}
          </ul>
          <h3 style="margin-bottom:6px;">Ejercicios:</h3>
          <ul style="margin-left:18px;">
            ${c.ejercicios.map(e => `<li>${e}</li>`).join('')}
          </ul>
          <h3 style="margin-bottom:6px;">Recursos:</h3>
          <ul style="margin-left:18px;">
            ${c.recursos.map(r => `<li><b>${r.nombre}</b> (${r.tipo}): <a href="${r.url}" target="_blank">${r.descripcion}</a></li>`).join('')}
          </ul>
          <h3 style="margin-bottom:6px;">Datasets:</h3>
          <ul style="margin-left:18px;">
            ${c.datasets.map(d => `<li><b>${d.nombre}:</b> <a href="${d.url}" target="_blank">${d.descripcion}</a></li>`).join('')}
          </ul>
          <h3 style="margin-bottom:6px;">Bibliografía y enlaces:</h3>
          <ul style="margin-left:18px;">
            ${c.enlaces_bibliografia.map(b => `<li><a href="${b.url}" target="_blank">${b.titulo}</a></li>`).join('')}
          </ul>
          <h3 style="margin-bottom:6px;">Tecnologías sugeridas:</h3>
          <ul style="margin-left:18px;">
            ${c.tecnologias_app.map(t => `<li><b>${t.nombre}:</b> <a href="${t.url}" target="_blank">${t.descripcion}</a></li>`).join('')}
          </ul>
        </div>
      `).join('') : '<div class="card"><h3>No hay cursos disponibles.</h3></div>'}
      <div class="card">
        <h3>Sensores conectables</h3>
        <ul>${this.sensores.length ? this.sensores.map(s => `<li>${s.nombre} (${s.tipo})</li>`).join('') : '<li>No hay sensores registrados.</li>'}</ul>
        <a class="btn btn-primary" href="#" onclick="AgriculturaPrecision.mostrarCatalogos();return false;">Ver catálogos de sensores</a>
      </div>
      <div id="catalogosPrecision" style="margin-top:18px;"></div>
      <div class="card" style="margin-top:22px;">
        <h3>Protocolo Técnico D-A-A-E</h3>
        <ol style="font-size:14px;line-height:1.6;">
          <li><b>Diagnóstico:</b> Captura de datos con cámara/sensores y georreferenciación.</li>
          <li><b>Análisis:</b> Inferencia cruzada con bibliografía (FAO/EPPO).</li>
          <li><b>Acción:</b> Prescripción técnica basada en umbrales económicos.</li>
          <li><b>Evaluación:</b> Registro y seguimiento en memoria_productor.md.</li>
        </ol>
        <a class="btn btn-ghost" href="#" onclick="AgriculturaPrecision.mostrarFormatoInforme();return false;">Ver formato profesional de informe</a>
        <a class="btn btn-ghost" href="#" onclick="AgriculturaPrecision.mostrarQRProceso();return false;">Ver proceso QR offline</a>
      </div>
      <div id="precisionExtra" style="margin-top:18px;"></div>
    `;
  },
  mostrarCatalogos() {
    const div = document.getElementById('catalogosPrecision');
    if (!div) return;
    div.innerHTML = `<h4>Catálogos de Sensores</h4><ul>${this.catalogos.length ? this.catalogos.map(c => `<li><a href="${c.link}" target="_blank">${c.nombre}</a></li>`).join('') : '<li>No hay catálogos disponibles.</li>'}</ul>`;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('view-precision')) AgriculturaPrecision.init();
});
  mostrarCursosGuias() {
    const div = document.getElementById('cursosGuiasPrecision');
    if (!div) return;
    div.innerHTML = `<h4>Cursos de Agricultura de Precisión</h4><ul>${this.cursos.length ? this.cursos.map(c => `<li>${c.nombre} <a href="${c.link}" target="_blank">Ver</a></li>`).join('') : '<li>No hay cursos disponibles.</li>'}</ul>`;
  },

  mostrarFormatoInforme() {
    const div = document.getElementById('precisionExtra');
    if (!div) return;
    div.innerHTML = `
      <h4>Formato Profesional de Informe Técnico</h4>
      <pre style="background:#222;color:#fff;padding:12px;border-radius:8px;font-size:13px;overflow-x:auto;white-space:pre-line;">ID Reporte: [Año]-[Mes]-[Día]-[ID_Lote]
Geoposicionamiento: Coordenadas GPS
Módulo: (Ej. Fisiología Vegetal / Control Fitosanitario)

Observación Visual: Descripción técnica del síntoma
Variables de Sensores: Humedad, T°, NPK (Valores reales vs. Óptimos)
Diagnóstico Presuntivo: Basado en manuales técnicos
Recomendación Técnica: Acción inmediata
</pre>
      <div style="font-size:12px;color:var(--fg-muted);margin-top:8px;">Pie de página: Protocolos ISPM (IPPC), Manual INTA, NDVI/SAVI, FAO/EPPO.</div>
    `;
  },

  mostrarQRProceso() {
    const div = document.getElementById('precisionExtra');
    if (!div) return;
    div.innerHTML = `
      <h4>Proceso QR Offline</h4>
      <ol style="font-size:13px;line-height:1.6;">
        <li>El celular genera un QR con el informe técnico.</li>
        <li>La oficina lo escanea y decodifica el texto.</li>
        <li>El informe se imprime o archiva como PDF.</li>
      </ol>
      <pre style="background:#222;color:#fff;padding:12px;border-radius:8px;font-size:12px;overflow-x:auto;white-space:pre-line;">import qrcode\ndef generar_qr_informe(datos_informe, nombre_archivo):\n    qr = qrcode.QRCode(version=1, box_size=10, border=5)\n    qr.add_data(datos_informe)\n    qr.make(fit=True)\n    img = qr.make_image(fill_color="black", back_color="white")\n    img.save(f"ATR_MELANTIA/{nombre_archivo}.png")\n</pre>
    `;
  },
