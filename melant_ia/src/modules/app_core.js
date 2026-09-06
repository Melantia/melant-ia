// app_core.js — Núcleo de arranque MELANTIA

// ===================== Inicialización y Carga =====================

// Carga dinámica de módulos desde el JSON de configuración
function cargarEstructuraApp(callback) {
  // Buscar el JSON en la raíz de src, sin importar desde dónde se llame
  let ruta = '';
  if (
    window.location.pathname.endsWith('/index.html') ||
    window.location.pathname.endsWith('/')
  ) {
    ruta = 'app_structure_melant_ia.json';
  } else {
    ruta = '../app_structure_melant_ia.json';
  }
  fetch(ruta)
    .then((response) => {
      if (!response.ok)
        throw new Error('No se pudo leer app_structure_melant_ia.json');
      return response.json();
    })
    .then((data) => {
      if (data && data.menu_principal && data.menu_principal.modulos) {
        if (typeof callback === 'function')
          callback(data.menu_principal.modulos);
      }
    })
    .catch((error) => {
      console.error('[MELANTIA CORE] Error cargando los módulos:', error);
    });
}

// Renderiza el menú de módulos en el contenedor principal
function renderizarModulosPrincipales(modulos) {
  const contenedorMenu =
    document.getElementById('contenedor-modulos-menu') || document.body;
  if (!modulos || modulos.length === 0) {
    contenedorMenu.innerHTML = '<p>No se encontraron módulos para mostrar.</p>';
    return;
  }
  let htmlGrid = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;padding:20px;max-width:1200px;margin:0 auto;">`;
  modulos.forEach((modulo) => {
    htmlGrid += `
      <div onclick="abrirModuloEspecifico(${modulo.id}, '${modulo.titulo}')" style="background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:24px;cursor:pointer;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);transition:all 0.25s ease;">
        <h3 style="margin:0;font-size:16px;color:#1E293B;font-weight:700;">${modulo.titulo}</h3>
      </div>
    `;
  });
  htmlGrid += `</div>`;
  contenedorMenu.innerHTML = htmlGrid;
}

// ===================== Pantalla de Inscripción y Privacidad =====================

function mostrarPantallaInscripcion() {
  const modal = document.createElement('div');
  modal.id = 'modal-inscripcion';
  modal.style =
    'position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(30,41,59,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;';
  modal.innerHTML = `
    <div style="background:#fff;padding:32px 24px;border-radius:16px;max-width:400px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,0.18);text-align:center;">
      <h2 style="color:#276749;">Bienvenido a MELANTIA</h2>
      <p>Para continuar, por favor ingresa tus datos y acepta la <a href="POLITICA_DE_PRIVACIDAD_MELANT_IA.md" target="_blank">Política de Privacidad</a>.</p>
      <input id="nombre-usuario" placeholder="Nombre completo" style="width:90%;margin:10px 0;padding:8px;border-radius:6px;border:1px solid #ccc;" /><br>
      <input id="email-usuario" placeholder="Correo electrónico" style="width:90%;margin:10px 0;padding:8px;border-radius:6px;border:1px solid #ccc;" /><br>
      <label style="font-size:13px;">
        <input type="checkbox" id="acepto-privacidad" /> Acepto la política de privacidad
      </label>
      <br>
      <button id="btn-inscribirse" style="margin-top:16px;background:#276749;color:#fff;padding:10px 28px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">Inscribirse</button>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('btn-inscribirse').onclick = function () {
    const nombre = document.getElementById('nombre-usuario').value.trim();
    const email = document.getElementById('email-usuario').value.trim();
    const acepto = document.getElementById('acepto-privacidad').checked;
    if (!nombre || !email || !acepto) {
      alert(
        'Por favor, completa todos los campos y acepta la política de privacidad.'
      );
      return;
    }
    localStorage.setItem('usuario_melantia', JSON.stringify({ nombre, email }));
    document.body.removeChild(modal);
    // Después de inscribir, cargar módulos
    cargarEstructuraApp(renderizarModulosPrincipales);
  };
}

// ===================== Inicialización Automática =====================

window.addEventListener('DOMContentLoaded', function () {
  // Si el usuario no está registrado, mostrar pantalla de inscripción
  const usuario = localStorage.getItem('usuario_melantia');
  if (!usuario) {
    mostrarPantallaInscripcion();
  } else {
    cargarEstructuraApp(renderizarModulosPrincipales);
  }
});

// ===================== Exportar función global para la UI =====================
// Panel de detalle de módulo
window.abrirModuloEspecifico = function (id, titulo) {
  // Buscar el JSON en la raíz de src, igual que en cargarEstructuraApp
  let ruta = '';
  if (
    window.location.pathname.endsWith('/index.html') ||
    window.location.pathname.endsWith('/')
  ) {
    ruta = 'app_structure_melant_ia.json';
  } else {
    ruta = '../app_structure_melant_ia.json';
  }
  fetch(ruta)
    .then((response) => response.json())
    .then((data) => {
      const modulos = data.menu_principal.modulos;
      const modulo = modulos.find((m) => m.id === id);
      if (!modulo) return;

      // Ocultar el menú principal
      const contenedorMenu =
        document.getElementById('contenedor-modulos-menu') || document.body;
      contenedorMenu.innerHTML = '';

      // Mostrar/ocultar botón de cobertura según el módulo
      const btnCobertura = document.getElementById('btn-cobertura-tienda-wrap');
      if (
        modulo.titulo === 'Tienda MELANTIA' ||
        modulo.titulo === 'Monte su TIENDA VIRTUAL' ||
        (modulo.items &&
          modulo.items.some((i) => i.toLowerCase().includes('tienda')))
      ) {
        btnCobertura && (btnCobertura.style.display = 'block');
      } else {
        btnCobertura && (btnCobertura.style.display = 'none');
      }

      // Panel de detalle
      let html = `<div style=\"max-width:600px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;\">
        <h2 style='color:#276749;margin-bottom:8px;'>${modulo.titulo}</h2>
        <p style='color:#444;font-size:1.1em;margin-bottom:18px;'>${modulo.descripcion || 'Sin descripción disponible.'}</p>`;
      if (modulo.items && modulo.items.length > 0) {
        html += `<h4 style='margin-bottom:8px;'>Opciones disponibles:</h4><div style='display:flex;flex-direction:column;gap:8px;'>`;
        modulo.items.forEach((item) => {
          html += `<button type="button" data-submodulo="${item}" style="text-align:left;background:#F8FAFC;border:1px solid #D1D5DB;border-radius:10px;padding:10px 12px;cursor:pointer;font-size:0.98em;color:#1F2937;">${item}</button>`;
        });
        html += `</div>`;
      }
      html += `<button onclick=\"window.volverAlMenuPrincipal()\" style=\"margin-top:24px;background:#276749;color:#fff;padding:10px 28px;border:none;border-radius:8px;font-size:1em;cursor:pointer;\">Volver al menú principal</button></div>`;

      contenedorMenu.innerHTML = html;

      contenedorMenu.querySelectorAll('[data-submodulo]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const item = btn.getAttribute('data-submodulo');
          if (!item) return;
          if (typeof window.navegarA === 'function') {
            window.navegarA(item);
          }
        });
      });

      // === CARGA DINÁMICA DE FUNCIONALIDAD DEL MÓDULO ===
      // Mapear títulos a archivos JS (ajusta según tus módulos reales)
      const moduloMap = {
        'Tienda MELANTIA': './04_negocios_rurales/tienda_melantia.js',
        'Monte su TIENDA VIRTUAL': './04_negocios_rurales/tienda_melantia.js',
        'Negocios Rurales': './04_negocios_rurales/negocios_rurales.js',
        Suscripciones: './01_suscripciones/afiliados_controller.js',
        'Asistente Técnico Rural': './02_asistente_tecnico_rural/index.js',
        'Gestión de Fincas y Trazabilidad':
          './gestion_fincas_trazabilidad_hub.js',
        Proyectos: './modulo_proyectos.js',
        'Escuela de Campo': './modulo_escuela.js',
        'Mi Comunidad Virtual': './modulo_comunidad.js',
        'Asistente Preventivo de Salud': './modulo_salud.js',
        'Servicios Financieros Melantia': './servicios_financieros.js',
        'Registro Evidencias y Documentos': './modulo_evidencias.js',
        // Agrega aquí más módulos según tu estructura
      };
      const jsPath = moduloMap[modulo.titulo];
      if (jsPath) {
        import(jsPath)
          .then((mod) => {
            // Si el módulo exporta una función principal, ejecútala pasando el objeto módulo
            if (typeof mod.default === 'function') {
              mod.default(modulo);
            } else if (
              (modulo.titulo === 'Gestión de Fincas y Trazabilidad' ||
                modulo.titulo === 'Asistente Técnico Rural') &&
              typeof mod.mostrarPanel === 'function'
            ) {
              mod.mostrarPanel();
            } else if (
              modulo.titulo === 'Suscripciones' &&
              window.SistemaAfiliados &&
              typeof window.SistemaAfiliados.abrirPanel === 'function'
            ) {
              window.SistemaAfiliados.init?.();
              window.SistemaAfiliados.abrirPanel();
            } else if (typeof window.cargarDatosModulo === 'function') {
              window.cargarDatosModulo(id, modulo.titulo);
            }
          })
          .catch((err) => {
            console.error('[MELANTIA] Error al cargar el módulo JS:', err);
          });
      }
    });
};

// Función para navegar a un sub-módulo específico
window.navegarA = function (item) {
  console.log(`[MELANTIA] Navegando al sub-módulo: ${item}`);

  // Mapeo de ítems a sus archivos JS correspondientes
  const subModuloMap = {
    'Tienda MELANTIA': './04_negocios_rurales/tienda_melantia.js',
    'Ventas de Gestión Productiva':
      './04_negocios_rurales/economia_melantia.js',
    'Bienes Raíces Rurales': './modules/bienes_raices_rurales_real.js',
    'Monte su TIENDA VIRTUAL': './04_negocios_rurales/tienda_config_logic.js',
    'Oportunidades Públicas': './04_negocios_rurales/tienda_virtual_links.py', // Nota: archivos .py requieren bridge o conversión
    'Mercado de Plátano': './mercado_platano_controller.js',
  };

  const jsPath = subModuloMap[item];
  if (jsPath && jsPath.endsWith('.js')) {
    import(jsPath)
      .then((mod) => {
        if (typeof mod.default === 'function') {
          mod.default(item);
        } else if (typeof mod.mostrarPanel === 'function') {
          mod.mostrarPanel();
        }
      })
      .catch((err) => {
        console.error(`[MELANTIA] Error cargando sub-módulo ${item}:`, err);
        alert(`No se pudo cargar el sub-módulo ${item}.`);
      });
  } else {
    console.warn(`[MELANTIA] No se encontró ruta JS para el ítem: ${item}`);
    alert(
      `La funcionalidad para ${item} está en desarrollo o requiere un formato compatible.`
    );
  }
};

// Función para volver al menú principal
window.volverAlMenuPrincipal = function () {
  // Ocultar el botón de cobertura
  const btnCobertura = document.getElementById('btn-cobertura-tienda-wrap');
  if (btnCobertura) btnCobertura.style.display = 'none';
  cargarEstructuraApp(renderizarModulosPrincipales);
};
