// gestion_fincas_trazabilidad_hub.js — HUB de Gestión de Fincas y Trazabilidad MELANTIA
// Este archivo centraliza el acceso a los submódulos de gestión de fincas y trazabilidad

const SUBMODULOS = [
  { nombre: 'Gestión de Fincas', archivo: './gestion_fincas.js' },
  { nombre: 'Apicultura', archivo: './apicultura.js' },
  {
    nombre: 'Trazabilidad Cultivos Especiales',
    archivo: './trazabilidad_cultivos_especiales.js',
  },
  { nombre: 'Trazabilidad de Granjas', archivo: './trazabilidad_granjas.js' },
  { nombre: 'Gestión Empresarial', archivo: './gestion_empresarial.js' },
];

export function mostrarPanel() {
  const cont = document.getElementById('contenedor-principal') || document.body;
  cont.innerHTML = `
    <div class="panel-hub" style="max-width:700px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
      <h2 style='color:#276749;text-align:center;margin-bottom:24px;'>Gestión de Fincas y Trazabilidad</h2>
      <p style="text-align:center;color:#334155;margin:0 0 14px 0;">Submódulos del Módulo 3</p>
      <div style="display:flex;flex-wrap:wrap;gap:18px;justify-content:center;">
        ${SUBMODULOS.map(
          (m, i) => `
          <button class="btn-submodulo" style="min-width:220px;padding:16px 12px;margin:8px 0;background:#f4f4f4;border:none;border-radius:8px;color:#276749;font-weight:600;font-size:1.08em;box-shadow:0 2px 8px #0001;cursor:pointer;transition:background 0.2s;" data-archivo="${m.archivo}">
            ${m.nombre}
          </button>
        `
        ).join('')}
      </div>

      <div style="margin-top:24px;padding-top:18px;border-top:1px solid #e5e7eb;">
        <p style="text-align:center;color:#334155;margin:0 0 12px 0;">Conexión Comercial</p>
        <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;">
          <button class="btn-comercial" data-ruta="Monte su TIENDA VIRTUAL" style="min-width:260px;padding:12px 14px;background:#1d4ed8;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;">Conectar con Monte su TIENDA VIRTUAL</button>
          <button class="btn-comercial" data-ruta="Tienda MELANTIA" data-accion="publicar-oferta" style="min-width:260px;padding:12px 14px;background:#0f766e;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;">Publicar en Tienda Virtual MELANTIA</button>
        </div>
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

  cont.querySelectorAll('.btn-comercial').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const ruta = btn.getAttribute('data-ruta');
      const accion = btn.getAttribute('data-accion');
      if (ruta && typeof window.navegarA === 'function') {
        await window.navegarA(ruta);
        if (accion === 'publicar-oferta') {
          let intentos = 0;
          const maxIntentos = 25;
          const timer = setInterval(() => {
            intentos += 1;
            const botonPublicar = document.getElementById(
              'btn-publicar-oferta'
            );
            const handlerListo =
              botonPublicar &&
              (typeof botonPublicar.onclick === 'function' ||
                botonPublicar.getAttribute('onclick'));
            if (handlerListo) {
              botonPublicar.click();
              clearInterval(timer);
            } else if (intentos >= maxIntentos) {
              clearInterval(timer);
            }
          }, 120);
        }
      }
    });
  });
}
