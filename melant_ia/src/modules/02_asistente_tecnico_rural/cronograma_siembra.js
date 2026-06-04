// Cronograma de Siembra: modulo navegable con logica real y fallback local.

const CULTIVOS_FALLBACK = [
  {
    cultivo: 'Cacao',
    configuracion_calendario: {
      fase_lunar_ideal_siembra: 'Cuarto Creciente',
      hitos: [
        {
          dia_inicio: 0,
          tarea: 'Preparacion de suelo',
          instruccion: 'Limpieza y trazado de surcos.',
        },
        {
          dia_inicio: 7,
          tarea: 'Siembra',
          instruccion: 'Semilla seleccionada y desinfeccion previa.',
        },
        {
          dia_inicio: 30,
          tarea: 'Fertilizacion inicial',
          instruccion: 'Aplicar dosis recomendada por ha.',
        },
      ],
    },
  },
  {
    cultivo: 'Cafe',
    configuracion_calendario: {
      fase_lunar_ideal_siembra: 'Luna Nueva',
      hitos: [
        {
          dia_inicio: 0,
          tarea: 'Vivero',
          instruccion: 'Preparar semillero y sustrato.',
        },
        {
          dia_inicio: 20,
          tarea: 'Trasplante',
          instruccion: 'Trasladar plantulas con humedad controlada.',
        },
      ],
    },
  },
  {
    cultivo: 'Maiz',
    configuracion_calendario: {
      fase_lunar_ideal_siembra: 'Cuarto Menguante',
      hitos: [
        {
          dia_inicio: 0,
          tarea: 'Siembra',
          instruccion: 'Distribucion uniforme por surco.',
        },
        {
          dia_inicio: 15,
          tarea: 'Control de maleza',
          instruccion: 'Deshierbe temprano para evitar competencia.',
        },
      ],
    },
  },
];

const LUNAS_FALLBACK = {
  calendario_lunar: {
    fases: [
      {
        nombre: 'Luna Nueva',
        descripcion: 'Fase favorable para enraizamiento inicial.',
      },
      {
        nombre: 'Cuarto Creciente',
        descripcion: 'Fase favorable para desarrollo vegetativo.',
      },
      {
        nombre: 'Luna Llena',
        descripcion: 'Mayor actividad de savia; monitorear plagas.',
      },
      {
        nombre: 'Cuarto Menguante',
        descripcion: 'Fase util para poda y control sanitario.',
      },
    ],
  },
};

async function cargarCultivosCronograma() {
  try {
    const resp = await fetch(
      'knowledge_seeds/02_asistente_tecnico_rural/calendario_siembras.json'
    );
    if (!resp.ok) throw new Error('No encontrado');
    return await resp.json();
  } catch {
    return CULTIVOS_FALLBACK;
  }
}

async function cargarFasesLuna() {
  try {
    const resp = await fetch(
      'knowledge_seeds/02_asistente_tecnico_rural/calendario_lunar.json'
    );
    if (!resp.ok) throw new Error('No encontrado');
    return await resp.json();
  } catch {
    return LUNAS_FALLBACK;
  }
}

export async function generarCronogramaSiembra(fechaSiembra, cultivoNombre) {
  const cultivos = await cargarCultivosCronograma();
  const fasesLuna = await cargarFasesLuna();
  const cultivo = cultivos.find(
    (c) =>
      String(c.cultivo || '').toLowerCase() ===
      String(cultivoNombre || '').toLowerCase()
  );
  if (!cultivo) throw new Error('Cultivo no encontrado');

  const fechaCero = new Date(fechaSiembra);
  const eventos = [];
  (cultivo.configuracion_calendario?.hitos || []).forEach((hito) => {
    const fechaTarea = new Date(fechaCero);
    fechaTarea.setDate(fechaCero.getDate() + Number(hito.dia_inicio || 0));
    eventos.push({
      tarea: hito.tarea,
      fecha: fechaTarea.toISOString().split('T')[0],
      instruccion: hito.instruccion,
    });
  });

  const faseIdeal = cultivo.configuracion_calendario?.fase_lunar_ideal_siembra;
  const faseInfo = (fasesLuna.calendario_lunar?.fases || []).find(
    (f) => f.nombre === faseIdeal
  );

  return {
    cultivo: cultivo.cultivo,
    fecha_siembra: fechaSiembra,
    fase_lunar_ideal: faseIdeal,
    recomendacion_lunar: faseInfo ? faseInfo.descripcion : '',
    eventos,
  };
}

export function mostrarPanel() {
  const contenedor =
    document.getElementById('vista-activa') ||
    document.getElementById('contenedor-principal') ||
    document.body;

  contenedor.innerHTML = `
    <div style="max-width:860px;margin:24px auto;padding:20px;border-radius:12px;border:1px solid #e2e8f0;background:#fff;box-shadow:0 2px 8px #0001;display:grid;gap:12px;">
      <h2 style="margin:0;color:#276749;">Cronograma de Siembra</h2>
      <p style="margin:0;color:#445;">Genera tareas automaticas por cultivo y fecha de siembra.</p>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;align-items:end;">
        <label>Fecha de siembra
          <input id="cron-fecha" type="date" style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;" />
        </label>
        <label>Cultivo
          <input id="cron-cultivo" type="text" placeholder="Cacao, Cafe, Maiz..." style="width:100%;padding:8px;border:1px solid #cbd5e1;border-radius:8px;" />
        </label>
        <button id="cron-btn" style="padding:10px;border:none;border-radius:8px;background:#276749;color:#fff;cursor:pointer;">Generar cronograma</button>
      </div>

      <div id="cron-resultado" style="border:1px solid #e5e7eb;border-radius:10px;padding:12px;background:#fafafa;color:#334;">Sin cronograma generado.</div>
      <button onclick="window.volverAlMenu && window.volverAlMenu()" style="justify-self:start;padding:8px 14px;border:none;border-radius:8px;background:#276749;color:#fff;cursor:pointer;">Volver al menu</button>
    </div>
  `;

  const fecha = document.getElementById('cron-fecha');
  if (fecha) fecha.value = new Date().toISOString().slice(0, 10);

  document.getElementById('cron-btn')?.addEventListener('click', async () => {
    const fechaSiembra = document.getElementById('cron-fecha')?.value;
    const cultivo = document.getElementById('cron-cultivo')?.value || 'Cacao';
    const salida = document.getElementById('cron-resultado');
    if (!salida) return;

    try {
      const data = await generarCronogramaSiembra(fechaSiembra, cultivo);
      salida.innerHTML = `
        <div><strong>Cultivo:</strong> ${data.cultivo}</div>
        <div><strong>Fase lunar ideal:</strong> ${data.fase_lunar_ideal || '-'} - ${data.recomendacion_lunar || ''}</div>
        <div style="margin-top:8px;"><strong>Eventos:</strong></div>
        <ul style="margin:6px 0 0 16px;">${data.eventos
          .map(
            (e) => `<li><b>${e.fecha}</b> - ${e.tarea}: ${e.instruccion}</li>`
          )
          .join('')}</ul>
      `;
    } catch (error) {
      salida.textContent = `Error: ${error?.message || 'No fue posible generar cronograma.'}`;
    }
  });
}

export default { mostrarPanel, generarCronogramaSiembra };
