// agricultura_precision.js
// Flujo funcional: cursos, estado de conectividad y acceso a herramientas.

async function cargarCursosPrecision() {
  const rutas = [
    'knowledge_seeds/02_asistente_tecnico_rural/cursos_agricultura_precision.json',
    'modules/07_escuela de campo/cursos_agricultura_precision.json',
  ];

  for (const ruta of rutas) {
    try {
      const res = await fetch(ruta);
      if (!res.ok) continue;
      const data = await res.json();
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.cursos)) return data.cursos;
    } catch {
      // Probar siguiente ruta.
    }
  }
  return [];
}

function estadoConexionTexto() {
  const on = navigator.onLine;
  const t = navigator.connection?.effectiveType || 'desconocida';
  const d = navigator.connection?.downlink;
  const dl = typeof d === 'number' ? `${d} Mbps` : 'N/D';
  return on
    ? `Conectado (${t}, downlink: ${dl})`
    : 'Sin internet: operando en modo local';
}

export async function mostrarPanel() {
  const contenedor =
    document.getElementById('vista-activa') ||
    document.getElementById('contenedor-principal') ||
    document.body;

  const cursos = await cargarCursosPrecision();
  const cursosHtml = cursos.length
    ? cursos
        .map(
          (c, idx) => `
        <article style="border:1px solid #e5e7eb;border-radius:10px;padding:12px;background:#fff;display:grid;gap:6px;">
          <h4 style="margin:0;color:#1f2937;">${c.titulo || `Curso ${idx + 1}`}</h4>
          <p style="margin:0;color:#475569;">${c.descripcion || 'Curso de agricultura de precision.'}</p>
        </article>`
        )
        .join('')
    : '<p style="margin:0;color:#64748b;">No se encontraron cursos en el repositorio local. Puedes seguir usando Calculadora Agricola y Cronograma.</p>';

  contenedor.innerHTML = `
    <div style="max-width:900px;margin:24px auto;padding:20px;border-radius:12px;border:1px solid #e2e8f0;background:#fff;box-shadow:0 2px 8px #0001;display:grid;gap:14px;">
      <h2 style="margin:0;color:#276749;">Agricultura de Precision (Sensores)</h2>
      <p style="margin:0;color:#334;">Estado de conectividad: <b>${estadoConexionTexto()}</b></p>

      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button id="btn-precision-calculadora" style="padding:10px 14px;border:none;border-radius:8px;background:#276749;color:#fff;cursor:pointer;">Abrir Calculadora Agricola</button>
        <button id="btn-precision-crono" style="padding:10px 14px;border:none;border-radius:8px;background:#1f8b4c;color:#fff;cursor:pointer;">Abrir Cronograma de Siembra</button>
      </div>

      <section style="display:grid;gap:10px;">
        <h3 style="margin:0;color:#1f2937;">Cursos especializados disponibles</h3>
        ${cursosHtml}
      </section>

      <button onclick="window.volverAlMenu && window.volverAlMenu()" style="justify-self:start;padding:8px 14px;border:none;border-radius:8px;background:#276749;color:#fff;cursor:pointer;">Volver al menu</button>
    </div>
  `;

  document
    .getElementById('btn-precision-calculadora')
    ?.addEventListener('click', () => {
      window.navegarA && window.navegarA('Calculadora Agrícola');
    });
  document
    .getElementById('btn-precision-crono')
    ?.addEventListener('click', () => {
      window.navegarA && window.navegarA('Cronograma de Siembra');
    });
}

export default { mostrarPanel };
