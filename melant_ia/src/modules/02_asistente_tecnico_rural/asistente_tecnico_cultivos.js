// asistente_tecnico_cultivos.js
// Flujo de entrada para herramientas de cultivos.

const CULTIVOS = [
  { id: 'cacao', nombre: 'Cacao', seed: 'cultivos_cacao.json' },
  { id: 'cafe', nombre: 'Cafe', seed: 'cultivos_cafe.json' },
  { id: 'palma', nombre: 'Palma', seed: 'cultivos_palma_aceitera.json' },
  { id: 'maiz', nombre: 'Maiz', seed: 'cultivos_maiz_duro.json' },
  {
    id: 'platano',
    nombre: 'Platano',
    seed: 'cultivos_platano_barraganete.json',
  },
];

const HERRAMIENTAS_CULTIVOS = [
  'Calculadora Agrícola',
  'Cronograma de Siembra',
  'Calendario Lunar',
  'Agricultura de Precisión (Uso de Sensores)',
  'GPS (Medición de Terrenos)',
  'Levantamiento de Lote',
  'Inventario de Biodiversidad',
  'Biblioteca Técnica Rural',
];

const RECOMENDACIONES_CULTIVO = {
  cacao: {
    enfoque: 'Sombra regulada, poda sanitaria y trazabilidad para exportación.',
    acciones: [
      'Revisar monilia, escoba de bruja y mazorca negra antes de fertilizar.',
      'Usar el cronograma de siembra para ajustar podas y manejo de sombra.',
      'Activar calculadora para densidad y dosis con suelo franco arcilloso y drenaje.',
    ],
    alertas: [
      'Evitar encharcamiento y sombra excesiva.',
      'Priorizar cosecha frecuente para cortar ciclo de plagas.',
      'Registrar lotes para trazabilidad de exportación.',
    ],
  },
  cafe: {
    enfoque: 'Manejo de roya, broca y secado controlado para especialidad.',
    acciones: [
      'Priorizar revisión de roya, broca y minador antes de cosecha.',
      'Usar el calendario lunar y cronograma para labores de poda y fertilización.',
      'Abrir calculadora para ajustar distancias y nutrición bajo sombra.',
    ],
    alertas: [
      'No dejar cerezas sobremaduras en la planta.',
      'Controlar humedad en secado y fermentación.',
      'Mantener sombra y ventilación equilibradas.',
    ],
  },
  palma: {
    enfoque: 'Cobertura, control fitosanitario y manejo de gran escala.',
    acciones: [
      'Validar drenaje, cobertura viva y sanidad foliar antes de decisiones de siembra.',
      'Usar agricultura de precisión para monitorear vigor y humedad.',
      'Abrir calculadora para dosis altas y densidad amplia en palma aceitera.',
    ],
    alertas: [
      'Vigilar pudriciones y estrés hídrico en suelos compactados.',
      'Planificar drenajes y accesos para maquinaria.',
      'Usar monitoreo periódico de estado foliar.',
    ],
  },
  maiz: {
    enfoque:
      'Siembra por ventanas climáticas, control de cogollero y fertilización balanceada.',
    acciones: [
      'Revisar etapa fenológica y presión de plagas antes de sembrar.',
      'Usar cronograma y calendario lunar para la fecha de siembra.',
      'Abrir calculadora para densidad, NPK y rendimiento esperado.',
    ],
    alertas: [
      'Evitar siembra en suelos encharcados o salinos.',
      'Monitorear gusano cogollero desde emergencia.',
      'Ajustar fertilización por etapa de crecimiento.',
    ],
  },
  platano: {
    enfoque: 'Sanidad de racimo, control de sigatoka y riego estable.',
    acciones: [
      'Controlar picudo, nematodos y moko antes del enfundado.',
      'Usar GPS y levantamiento de lote para ordenar drenajes y distancias.',
      'Abrir calculadora para ajustar riego y nutrición del barraganete.',
    ],
    alertas: [
      'Revisar hojas viejas y el enfundado de racimos.',
      'Mantener drenajes limpios para evitar marchitez.',
      'Aplicar manejo fitosanitario preventivo en época lluviosa.',
    ],
  },
};

async function cargarConocimientoCultivo(cultivoId) {
  const cultivo = CULTIVOS.find((item) => item.id === cultivoId);
  if (!cultivo?.seed) return null;

  const rutas = [
    `knowledge_seeds/02_asistente_tecnico_rural/asistente_tecnico_cultivos/${cultivo.seed}`,
    `modules/02_asistente_tecnico_rural/${cultivo.seed}`,
  ];

  for (const ruta of rutas) {
    try {
      const response = await fetch(ruta);
      if (!response.ok) continue;
      const data = await response.json();
      const key = Object.keys(data || {})[0];
      return data?.[key] || data || null;
    } catch {
      // Probar siguiente origen.
    }
  }

  return null;
}

function normalizarTexto(valor) {
  return String(valor || '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resumenLista(items, limite = 3) {
  if (!Array.isArray(items) || !items.length) return 'Sin datos disponibles.';
  return items
    .slice(0, limite)
    .map((item) => normalizarTexto(item.nombre || item.elemento || item))
    .join(' · ');
}

function construirRecomendaciones(cultivoId, conocimiento) {
  const cultivo = CULTIVOS.find((item) => item.id === cultivoId);
  const rec = RECOMENDACIONES_CULTIVO[cultivoId] || {};
  const nombre = cultivo?.nombre || normalizarTexto(cultivoId);
  const manejo = normalizarTexto(
    conocimiento?.agricultura_regenerativa ||
      conocimiento?.manejo_organico ||
      conocimiento?.manejo_convencional ||
      ''
  );
  const plagas = Array.isArray(conocimiento?.plagas_comunes)
    ? conocimiento.plagas_comunes
        .slice(0, 2)
        .map((item) => normalizarTexto(item.nombre || item))
        .join(' · ')
    : 'Sin datos';
  const enfermedades = Array.isArray(conocimiento?.enfermedades_comunes)
    ? conocimiento.enfermedades_comunes
        .slice(0, 2)
        .map((item) => normalizarTexto(item.nombre || item))
        .join(' · ')
    : 'Sin datos';

  return `
    <section style="border:1px solid #dbeafe;border-radius:12px;padding:14px;background:#eff6ff;display:grid;gap:10px;">
      <h3 style="margin:0;color:#1d4ed8;">Recomendación técnica para ${nombre}</h3>
      <p style="margin:0;color:#334155;">${rec.enfoque || 'Revisión técnica general del cultivo.'}</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;">
        <article style="padding:10px;border:1px solid #bfdbfe;border-radius:10px;background:#fff;"><b>Plagas clave</b><div style="margin-top:6px;color:#475569;">${plagas}</div></article>
        <article style="padding:10px;border:1px solid #bfdbfe;border-radius:10px;background:#fff;"><b>Enfermedades clave</b><div style="margin-top:6px;color:#475569;">${enfermedades}</div></article>
        <article style="padding:10px;border:1px solid #bfdbfe;border-radius:10px;background:#fff;"><b>Enfoque de manejo</b><div style="margin-top:6px;color:#475569;">${manejo || 'Sin dato'}</div></article>
      </div>
      <div style="padding:10px;border:1px solid #bfdbfe;border-radius:10px;background:#fff;display:grid;gap:6px;">
        <b>Alertas técnicas</b>
        <ul style="margin:0;padding-left:18px;color:#475569;display:grid;gap:4px;">${(rec.alertas || ['Sin alertas cargadas.']).map((item) => `<li>${item}</li>`).join('')}</ul>
      </div>
      <ul style="margin:0;padding-left:18px;color:#334155;display:grid;gap:6px;">
        ${(
          rec.acciones || [
            'Abrir la calculadora para ajustar densidad y dosis.',
            'Consultar cronograma de siembra para la ventana técnica.',
            'Revisar calendario lunar y herramientas de precisión.',
          ]
        )
          .map((item) => `<li>${item}</li>`)
          .join('')}
      </ul>
    </section>
  `;
}

function renderizarHerramientasActivas(cultivoId) {
  const cultivo = CULTIVOS.find((item) => item.id === cultivoId);
  const nombre = cultivo?.nombre || 'cultivo';
  return `
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
      <button id="btn-abrir-calculadora" style="padding:10px 16px;background:#1f8b4c;color:#fff;border:none;border-radius:8px;cursor:pointer;">Abrir Calculadora para ${nombre}</button>
      <button id="btn-abrir-cronograma" style="padding:10px 16px;background:#0f766e;color:#fff;border:none;border-radius:8px;cursor:pointer;">Ver Cronograma</button>
      <button id="btn-abrir-calendario" style="padding:10px 16px;background:#14532d;color:#fff;border:none;border-radius:8px;cursor:pointer;">Ver Calendario Lunar</button>
      <button id="btn-abrir-gps" style="padding:10px 16px;background:#0369a1;color:#fff;border:none;border-radius:8px;cursor:pointer;">Abrir GPS / Lote</button>
      <button id="btn-abrir-inventario" style="padding:10px 16px;background:#7c3aed;color:#fff;border:none;border-radius:8px;cursor:pointer;">Inventario Bio</button>
    </div>
  `;
}

function seleccionarCultivo(cultivoId) {
  const cultivo = CULTIVOS.find((item) => item.id === cultivoId);
  if (!cultivo) return;

  localStorage.setItem('melantia_cultivo_activo', cultivo.id);
  try {
    window.dispatchEvent(
      new CustomEvent('melantia:cultivo:seleccionado', {
        detail: { cultivo: cultivo.id, nombre: cultivo.nombre },
      })
    );
  } catch {
    // Sin bloqueo.
  }
}

function navegarHerramienta(nombreItem) {
  if (typeof window.navegarA === 'function') {
    window.navegarA(nombreItem);
  }
}

function renderizarConocimiento(cultivoId, conocimiento) {
  const cultivo = CULTIVOS.find((item) => item.id === cultivoId);
  if (!cultivo) return '';

  const descripcion = normalizarTexto(conocimiento?.descripcion || '');
  const suelo = normalizarTexto(conocimiento?.tipo_suelo_recomendado || '');
  const manejo = normalizarTexto(
    conocimiento?.agricultura_regenerativa ||
      conocimiento?.manejo_organico ||
      ''
  );
  const plagas = resumenLista(conocimiento?.plagas_comunes);
  const enfermedades = resumenLista(conocimiento?.enfermedades_comunes);
  const calendario = conocimiento?.calendario_lunar;

  return `
    <section style="border:1px solid #e5e7eb;border-radius:12px;padding:14px;background:#f8fafc;display:grid;gap:10px;">
      <h3 style="margin:0;color:#1f2937;">${cultivo.nombre}</h3>
      <p style="margin:0;color:#334;">${descripcion || 'Conocimiento técnico no disponible todavía para este cultivo.'}</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;">
        <article style="padding:10px;border:1px solid #e5e7eb;border-radius:10px;background:#fff;"><b>Suelo</b><div style="margin-top:6px;color:#475569;">${suelo || 'Sin dato'}</div></article>
        <article style="padding:10px;border:1px solid #e5e7eb;border-radius:10px;background:#fff;"><b>Plagas</b><div style="margin-top:6px;color:#475569;">${plagas}</div></article>
        <article style="padding:10px;border:1px solid #e5e7eb;border-radius:10px;background:#fff;"><b>Enfermedades</b><div style="margin-top:6px;color:#475569;">${enfermedades}</div></article>
        <article style="padding:10px;border:1px solid #e5e7eb;border-radius:10px;background:#fff;"><b>Manejo regenerativo</b><div style="margin-top:6px;color:#475569;">${manejo || 'Sin dato'}</div></article>
      </div>
      <div style="padding:10px;border:1px solid #e5e7eb;border-radius:10px;background:#fff;">
        <b>Calendario lunar</b>
        <div style="margin-top:6px;color:#475569;">Siembra: ${normalizarTexto(calendario?.siembra || 'No definido')} · Fertilización: ${normalizarTexto(calendario?.fertilizacion || 'No definido')} · Cosecha: ${normalizarTexto(calendario?.cosecha || 'No definido')}</div>
      </div>
    </section>
  `;
}

export async function mostrarPanel() {
  const contenedor =
    document.getElementById('vista-activa') ||
    document.getElementById('contenedor-principal') ||
    document.body;

  const cultivoActivo =
    localStorage.getItem('melantia_cultivo_activo') || 'cacao';
  const conocimientoInicial = await cargarConocimientoCultivo(cultivoActivo);

  contenedor.innerHTML = `
    <div class="panel-especifico" style="max-width:980px;margin:24px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:24px;display:grid;gap:14px;">
      <h2 style="margin:0;color:#276749;">Asistente Tecnico en Cultivos</h2>
      <p style="margin:0;color:#334;">Seleccione su cultivo para cargar su conocimiento tecnico y navegar a las herramientas reales del submodulo.</p>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;">
        ${CULTIVOS.map(
          (c) =>
            `<button data-cultivo="${c.id}" style="padding:12px;border:none;border-radius:10px;background:#276749;color:#fff;cursor:pointer;font-weight:700;">${c.nombre}</button>`
        ).join('')}
      </div>

      <div id="cultivo-conocimiento" style="display:grid;gap:12px;">
        ${renderizarConocimiento(cultivoActivo, conocimientoInicial)}
        ${construirRecomendaciones(cultivoActivo, conocimientoInicial)}
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;">
        ${HERRAMIENTAS_CULTIVOS.map(
          (herramienta) =>
            `<button data-herramienta="${herramienta}" style="padding:10px 14px;background:#1f8b4c;color:#fff;border:none;border-radius:8px;cursor:pointer;">${herramienta}</button>`
        ).join('')}
      </div>

      <p style="margin:0;color:#556;font-size:14px;">Flujo conectado: conocimiento tecnico -> Calculadora Agricola -> Cronograma -> Calendario Lunar -> GPS / Levantamiento / Inventario / Biblioteca.</p>

      <div id="cultivo-acciones">${renderizarHerramientasActivas(cultivoActivo)}</div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button onclick="window.cargarDatosModulo && window.cargarDatosModulo(null, 'Asistente Técnico Rural')" style="padding:10px 16px;background:#276749;color:#fff;border:none;border-radius:8px;cursor:pointer;">Volver</button>
      </div>
    </div>
  `;

  contenedor.querySelectorAll('[data-cultivo]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const cultivoId = btn.getAttribute('data-cultivo');
      seleccionarCultivo(cultivoId);
      const conocimiento = await cargarConocimientoCultivo(cultivoId);
      const caja = document.getElementById('cultivo-conocimiento');
      if (caja) {
        caja.innerHTML = [
          renderizarConocimiento(cultivoId, conocimiento),
          construirRecomendaciones(cultivoId, conocimiento),
        ].join('');
      }
      const acciones = document.getElementById('cultivo-acciones');
      if (acciones)
        acciones.innerHTML = renderizarHerramientasActivas(cultivoId);

      document
        .getElementById('btn-abrir-calculadora')
        ?.addEventListener('click', () => {
          navegarHerramienta('Calculadora Agrícola');
        });
      document
        .getElementById('btn-abrir-cronograma')
        ?.addEventListener('click', () => {
          navegarHerramienta('Cronograma de Siembra');
        });
      document
        .getElementById('btn-abrir-calendario')
        ?.addEventListener('click', () => {
          navegarHerramienta('Calendario Lunar');
        });
      document
        .getElementById('btn-abrir-gps')
        ?.addEventListener('click', () => {
          navegarHerramienta('GPS (Medición de Terrenos)');
        });
      document
        .getElementById('btn-abrir-inventario')
        ?.addEventListener('click', () => {
          navegarHerramienta('Inventario de Biodiversidad');
        });
    });
  });

  contenedor.querySelectorAll('[data-herramienta]').forEach((btn) => {
    btn.addEventListener('click', () => {
      navegarHerramienta(btn.getAttribute('data-herramienta'));
    });
  });

  document
    .getElementById('btn-abrir-calculadora')
    ?.addEventListener('click', () => {
      navegarHerramienta('Calculadora Agrícola');
    });
  document
    .getElementById('btn-abrir-cronograma')
    ?.addEventListener('click', () => {
      navegarHerramienta('Cronograma de Siembra');
    });
  document
    .getElementById('btn-abrir-calendario')
    ?.addEventListener('click', () => {
      navegarHerramienta('Calendario Lunar');
    });
  document.getElementById('btn-abrir-gps')?.addEventListener('click', () => {
    navegarHerramienta('GPS (Medición de Terrenos)');
  });
  document
    .getElementById('btn-abrir-inventario')
    ?.addEventListener('click', () => {
      navegarHerramienta('Inventario de Biodiversidad');
    });
}

export default { mostrarPanel };
