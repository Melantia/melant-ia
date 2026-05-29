// Módulo: Asistente Técnico Rural
// Funciones y lógica del Asistente Técnico Rural

// asistente_tecnico_rural.js — HUB de Asistencia Técnica Rural MELANTIA
// Este archivo centraliza el acceso a todos los submódulos técnicos rurales

const SUBMODULOS = [
  {
    nombre: 'Visión Satelital',
    archivo: './vision_satelital.js',
  },
  // Eliminados módulos de gestión, trazabilidad, mercado, etc. Solo quedan los técnicos rurales directos
  { nombre: 'Ingesta Laboratorio', archivo: './ingesta_laboratorio.py' },
];

// Puente universal para activar cualquier submódulo por nombre
export async function activarSubmodulo(nombre) {
  const sub = SUBMODULOS.find((m) => m.nombre === nombre);
  if (!sub) return alert('Submódulo no encontrado: ' + nombre);
  if (sub.archivo.endsWith('.py')) {
    alert('Este submódulo requiere integración especial con Python.');
    return;
  }
  try {
    const mod = await import(sub.archivo);
    if (mod.mostrarPanel) mod.mostrarPanel();
    else alert('El submódulo no tiene mostrarPanel.');
  } catch (err) {
    alert('No se pudo cargar el submódulo: ' + sub.archivo + '\n' + err);
  }
}

// Exponer globalmente para acceso desde voz/foto/menu principal
window.activarSubmoduloRural = activarSubmodulo;

export function mostrarPanel() {
  const cont = document.getElementById('contenedor-principal') || document.body;
  cont.innerHTML = `
    <div class="panel-hub" style="max-width:700px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
      <h2 style='color:#276749;text-align:center;margin-bottom:24px;'>Asistente Técnico Rural</h2>
      <div style="display:flex;flex-wrap:wrap;gap:18px;justify-content:center;">
        ${SUBMODULOS.map(
          (m, i) => `
          <button class="btn-submodulo" style="min-width:220px;padding:16px 12px;margin:8px 0;background:#f4f4f4;border:none;border-radius:8px;color:#276749;font-weight:600;font-size:1.08em;box-shadow:0 2px 8px #0001;cursor:pointer;transition:background 0.2s;" data-archivo="${m.archivo}">
            ${m.nombre}
          </button>
        `
        ).join('')}
      </div>
      <div style="margin:32px 0 0 0;text-align:center;">
        <button id="btn-reportes-carbono" style="background:#1e88e5;color:#fff;padding:10px 28px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">📄 Consultar reportes de carbono/NDVI guardados</button>
      </div>
      <button onclick="window.volverAlMenuPrincipal()" style="margin-top:32px;background:#276749;color:#fff;padding:10px 28px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">Volver al menú principal</button>
    </div>
  `;
  // Asignar listeners a cada botón de submódulo
  cont.querySelectorAll('.btn-submodulo').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const archivo = btn.getAttribute('data-archivo');
      try {
        if (archivo.endsWith('.py')) {
          alert('Este submódulo requiere integración especial con Python.');
          return;
        }
        const mod = await import(archivo);
        if (mod.mostrarPanel) mod.mostrarPanel();
        else alert('El submódulo no tiene mostrarPanel.');
      } catch (err) {
        alert('No se pudo cargar el submódulo: ' + archivo + '\n' + err);
      }
    });
  });

  // Botón para consultar reportes de carbono/NDVI guardados (offline)
  const btnReportes = document.getElementById('btn-reportes-carbono');
  if (btnReportes) {
    btnReportes.addEventListener('click', async () => {
      // Importa dinámicamente el panel de reportes guardados
      const { mostrarPanelReportesGuardados } =
        await import('./reporte_carbono_qr.js');
      if (typeof mostrarPanelReportesGuardados === 'function') {
        mostrarPanelReportesGuardados();
      } else {
        alert('No se encontró el panel de reportes guardados.');
      }
    });
  }
}
