// asistente_salud_hub.js — HUB de Asistente Preventivo de Salud MELANTIA
// Este archivo centraliza el acceso a los submódulos de salud preventiva

const SUBMODULOS = [
  {
    nombre: 'Asistente Preventivo de Salud',
    archivo: './asistente_preventivo_salud.js',
  },
  {
    nombre: 'Guia de Primeros Auxilios y Respuesta Rapida',
    archivo: './guia_primeros_auxilios.js',
  },
  { nombre: 'Botiquín Casero Inteligente', archivo: './botiquin_casero.js' },
  { nombre: 'Ficha Médica / Historia Clínica', archivo: './ficha_medica.js' },
];

export function mostrarPanel() {
  const cont = document.getElementById('contenedor-principal') || document.body;
  cont.innerHTML = `
    <div class="panel-hub" style="max-width:700px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
      <h2 style='color:#276749;text-align:center;margin-bottom:24px;'>Asistente Preventivo de Salud</h2>
      <div style="display:flex;flex-wrap:wrap;gap:18px;justify-content:center;">
        ${SUBMODULOS.map(
          (m, i) => `
          <button class="btn-submodulo" style="min-width:220px;padding:16px 12px;margin:8px 0;background:#f4f4f4;border:none;border-radius:8px;color:#276749;font-weight:600;font-size:1.08em;box-shadow:0 2px 8px #0001;cursor:pointer;transition:background 0.2s;" data-archivo="${m.archivo}">
            ${m.nombre}
          </button>
        `
        ).join('')}
      </div>
      <button onclick="window.volverAlMenuPrincipal()" style="margin-top:32px;background:#276749;color:#fff;padding:10px 28px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">Volver al menú principal</button>
    </div>
  `;
  // Asignar listeners a cada botón
  cont.querySelectorAll('.btn-submodulo').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const archivo = btn.getAttribute('data-archivo');
      try {
        const mod = await import(archivo);
        if (mod.mostrarPanel) mod.mostrarPanel();
        else alert('El submódulo no tiene mostrarPanel.');
      } catch (err) {
        alert('No se pudo cargar el submódulo: ' + archivo + '\n' + err);
      }
    });
  });
}
