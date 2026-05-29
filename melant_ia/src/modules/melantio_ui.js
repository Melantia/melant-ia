// =========================
// ENRUTADOR DINÁMICO DE SUBMÓDULOS
// =========================
const rutasModulos = {
  'Ventas de Gestión Productiva': './modules/ventas_gestion_productiva.js',
  'Moneda Virtual Melantios': './modules/moneda_virtual_melantios.js',
  'Planes y Pagos': './modules/planes_pagos.js',
  'Asistente Técnico Rural': './modules/asistente_tecnico.js',
  'Trazabilidad Cultivos Especiales':
    './modules/trazabilidad_cultivos_especiales.js',
  'Trazabilidad de Granjas': './modules/trazabilidad_granjas.js',
  'Trazabilidad de Café': './modules/trazabilidad_cafe.js',
  'Trazabilidad de Cacao': './modules/trazabilidad_cacao.js',
  'Gestión de Fincas': './modules/gestion_fincas_trazabilidad.js',
  'Botiquín Casero Inteligente': './modules/modulo_salud.js',
  'Servicios Financieros Melantia': './modules/servicios_financieros.js',
  'Negocios Rurales': './modules/negocios_rurales.js',
  'Mi Comunidad Virtual': './modules/modulo_comunidad.js',
  Proyectos: './modules/proyectos.js',
  'Registro Evidencias y Documentos': './modules/evidencias_documentos.js',
  'Escuela de Campo': './modules/escuela_campo.js',
  Emprendedor: './modules/emprendimientos.js',
  Alertas: './modules/websocket_alertas.js',
  Registro: './modules/registro.js',
  // ...agrega aquí más submódulos según crees los archivos
};

window.cargarSubmodulo = async function (nombreModulo, moduloPadre) {
  const nombre = decodeURIComponent(nombreModulo);
  const moduloNombre = decodeURIComponent(moduloPadre);
  const contenedor =
    document.getElementById('contenedor-principal') || document.body;
  const ruta = rutasModulos[nombre];
  if (ruta) {
    try {
      const modulo = await import(ruta);
      if (modulo.mostrarPanel) {
        modulo.mostrarPanel();
        return;
      }
    } catch (e) {
      contenedor.innerHTML = `<div style='color:#b91c1c;text-align:center;margin:40px 0;'>Error cargando el submódulo: ${e.message}</div>`;
      return;
    }
  }
  // Si no existe, muestra el panel genérico
  contenedor.innerHTML = `
    <div style='text-align:center; margin:40px 0;'>
      <h2 style='color:#276749;'>${moduloNombre}</h2>
      <h3 style='color:#1E293B; margin:18px 0 10px;'>${nombre}</h3>
      <div style='font-size:2.5em; margin-bottom:18px;'>🔄</div>
      <p style='font-size:1.1em; color:#444;'>Aquí irá la funcionalidad específica de <b>${nombre}</b>.</p>
      <button onclick="window.cargarDatosModulo(null, '${moduloNombre.replace(/'/g, "'")}')" style='margin-top:30px;padding:10px 24px;background:#276749;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:1em;'>← Volver a ${moduloNombre}</button>
    </div>
  `;
};
// =============================================
// FUNCIÓN GLOBAL PARA CARGA DE MÓDULOS
// =============================================
window.cargarDatosModulo = function (id, titulo) {
  const contenedor =
    document.getElementById('contenedor-principal') || document.body;
  fetch('app_structure_melant_ia.json')
    .then((response) => response.json())
    .then((data) => {
      const modulos = data.menu_principal.modulos;
      const modulo = modulos.find((m) => m.id === id || m.titulo === titulo);
      if (!modulo) {
        contenedor.innerHTML = `<div style="text-align:center; margin:40px 0;"><h2 style="color:#b91c1c;">Módulo no encontrado</h2></div>`;
        return;
      }
      let html = `<div style='text-align:center; margin:40px 0;'>`;
      html += `<h2 style='color:#276749;'>${modulo.titulo}</h2>`;
      if (modulo.items && modulo.items.length > 0) {
        html += `<div style='display:flex; flex-direction:column; gap:16px; max-width:400px; margin:24px auto;'>`;
        modulo.items.forEach((item, idx) => {
          // Selección de icono por tema (puedes personalizar más adelante)
          let icon = '📦';
          const tema = item.toLowerCase();
          if (tema.includes('gps')) icon = '📐';
          else if (tema.includes('salud')) icon = '🩺';
          else if (tema.includes('financ')) icon = '💰';
          else if (tema.includes('tienda')) icon = '🛒';
          else if (tema.includes('suscrip')) icon = '📝';
          else if (tema.includes('trazabilidad')) icon = '🌱';
          else if (tema.includes('negocio')) icon = '🏪';
          else if (tema.includes('comunidad')) icon = '👥';
          else if (tema.includes('proyecto')) icon = '📊';
          else if (tema.includes('registro')) icon = '🗂️';
          else if (tema.includes('curso') || tema.includes('escuela'))
            icon = '🎓';
          else if (tema.includes('emprend')) icon = '🚀';
          else if (tema.includes('legal')) icon = '⚖️';
          else if (tema.includes('alerta')) icon = '⚠️';
          else if (tema.includes('documento')) icon = '📄';
          html += `
            <button 
              class="btn-submodulo" 
              style="display:flex;align-items:center;gap:14px;padding:14px 18px;background:#f4f4f4;border:none;border-radius:8px;color:#276749;font-weight:600;font-size:1.08em;box-shadow:0 2px 8px #0001;cursor:pointer;transition:background 0.2s;"
              onclick="window.cargarSubmodulo('${encodeURIComponent(item)}','${encodeURIComponent(modulo.titulo)}')"
              onmouseover="this.style.background='#e0f7ef'" onmouseout="this.style.background='#f4f4f4'"
            >
              <span style='font-size:1.6em;'>${icon}</span>
              <span>${item}</span>
            </button>
          `;
        });
        html += `</div>`;
      } else {
        html += `<p style='color:#888;'>Este módulo no tiene submódulos definidos.</p>`;
      }
      // =============================================
      // FUNCIÓN GLOBAL PARA CARGA DE SUBMÓDULOS
      // =============================================
      window.cargarSubmodulo = function (submodulo, modulo) {
        const nombre = decodeURIComponent(submodulo);
        const moduloNombre = decodeURIComponent(modulo);
        const contenedor =
          document.getElementById('contenedor-principal') || document.body;
        // Mapeo de submódulos a funciones reales (puedes ampliar este objeto)
        const funcionalidad = {
          'Trazabilidad Cultivos Especiales': () =>
            import('../modules/trazabilidad_cultivos_especiales.js').then((m) =>
              (
                m.default || window.MelantiaTrazabilidadCultivosEspeciales
              ).mostrarPanel()
            ),
          'Trazabilidad de Granjas': () =>
            import('../modules/trazabilidad_granjas.js').then((m) =>
              (
                m.default || window.MelantiaTrazabilidadGranjas
              )?.mostrarPanel?.()
            ),
          'Trazabilidad de Café': () =>
            import('../modules/trazabilidad_cafe.js').then((m) =>
              (m.default || window.MelantiaTrazabilidadCafe).mostrarPanel()
            ),
          'Trazabilidad de Cacao': () =>
            import('../modules/trazabilidad_cacao.js').then((m) =>
              (m.default || window.MelantiaTrazabilidadCacao).mostrarPanel()
            ),
          'Gestión de Fincas': () =>
            import('../modules/gestion_fincas_trazabilidad.js').then((m) =>
              (
                m.default || window.MelantiaGestionFincasTrazabilidad
              )?.mostrarPanel?.()
            ),
          'Botiquín Casero Inteligente': () =>
            import('../modules/modulo_salud.js').then((m) =>
              m.cargarBotiquin?.()
            ),
          'Servicios Financieros Melantia': () =>
            import('../modules/servicios_financieros.js').then((m) =>
              m.mostrarPanel?.()
            ),
          'Negocios Rurales': () =>
            import('../modules/negocios_rurales.js').then((m) =>
              (m.default || window.MelantiaNegociosRurales)?.mostrarPanel?.()
            ),
          'Mi Comunidad Virtual': () =>
            import('../modules/modulo_comunidad.js').then((m) =>
              (m.default || window.ReporteLunes)?.mostrarPanel?.()
            ),
          Proyectos: () =>
            import('../modules/proyectos.js').then((m) =>
              (m.default || window.MelantiaProyectos)?.mostrarMenuProyectos?.()
            ),
          'Registro Evidencias y Documentos': () =>
            import('../modules/evidencias_documentos.js').then((m) =>
              (
                m.default || window.MelantiaEvidenciasDocumentos
              )?.mostrarPanel?.()
            ),
          'Escuela de Campo': () =>
            import('../modules/escuela_campo.js').then((m) =>
              (
                m.default || window.MelantiaEscuelaCampo
              )?.mostrarMenuPrincipal?.()
            ),
          Emprendedor: () =>
            import('../modules/emprendimientos.js').then((m) =>
              m.mostrarPanelEmprendimientos?.()
            ),
          Alertas: () =>
            import('../modules/websocket_alertas.js').then((m) =>
              m.inicializarWebSocketAlertas?.()
            ),
          Registro: () =>
            import('../modules/registro.js').then((m) => m.mostrarPanel?.()),
        };
        // Buscar por nombre exacto o por inclusión parcial
        const key = Object.keys(funcionalidad).find(
          (k) => nombre.includes(k) || k.includes(nombre)
        );
        if (key && typeof funcionalidad[key] === 'function') {
          funcionalidad[key]();
          return;
        }
        // Si no hay funcionalidad específica, mostrar panel genérico
        contenedor.innerHTML = `
            <div style='text-align:center; margin:40px 0;'>
              <h2 style='color:#276749;'>${moduloNombre}</h2>
              <h3 style='color:#1E293B; margin:18px 0 10px;'>${nombre}</h3>
              <div style='font-size:2.5em; margin-bottom:18px;'>🔄</div>
              <p style='font-size:1.1em; color:#444;'>Aquí irá la funcionalidad específica de <b>${nombre}</b>.</p>
              <button onclick="window.cargarDatosModulo(null, '${moduloNombre.replace(/'/g, "'")}')" style='margin-top:30px;padding:10px 24px;background:#276749;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:1em;'>← Volver a ${moduloNombre}</button>
            </div>
          `;
      };
      html += `</div>`;
      contenedor.innerHTML = html;
    })
    .catch((err) => {
      contenedor.innerHTML = `<div style='text-align:center; margin:40px 0;'><h2 style='color:#b91c1c;'>Error cargando submódulos</h2><p>${err}</p></div>`;
    });
};
// modules/melantio_ui.js
// Lógica UI para Melantio: botón de canje, utilidades y renderizado de módulos
// NOTA: Melantio solo interviene con voz para explicar la conversión "100 Melantios = $1" al consultar saldo.

// =========================================================================
// 1. Lógica y UI de Melantios centralizada en modules/moneda_virtual_melantios.js
// =========================================================================

function renderizarModulosPrincipales(modulos) {
  // Buscamos un contenedor válido en la interfaz de inicio
  const contenedorMenu =
    document.getElementById('contenedor-modulos-menu') ||
    document.querySelector('.grid-container') ||
    document.body;

  if (!modulos || modulos.length === 0) {
    console.warn('[MELANTIA UI] No se encontraron módulos para renderizar.');
    return;
  }

  let htmlGrid = `
    <div style="
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    ">
  `;

  // Renderiza los 11 módulos mostrando ÚNICAMENTE el título limpio
  modulos.forEach((modulo) => {
    htmlGrid += `
      <div 
        onclick="abrirModuloEspecifico(${modulo.id}, '${modulo.titulo}')"
        style="
          background: #ffffff;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 24px;
          cursor: pointer;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          transition: all 0.25s ease;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        "
        onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 10px 15px -3px rgba(0, 0, 0, 0.1)'; this.style.borderColor='#F59E0B';"
        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px -1px rgba(0, 0, 0, 0.05)'; this.style.borderColor='#E2E8F0';"
      >
        <div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: #F59E0B;"></div>
        
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
          <span style="
            background: #FEF3C7; 
            color: #B45309; 
            font-weight: bold; 
            border-radius: 50%; 
            width: 28px; 
            height: 28px; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            font-size: 13px;
          ">${modulo.id}</span>
          <h3 style="margin: 0; font-size: 16px; color: #1E293B; font-weight: 700; font-family: sans-serif;">
            ${modulo.titulo}
          </h3>
        </div>
        
        <div style="text-align: right; margin-top: 12px;">
          <span style="color: #64748B; font-size: 12px; font-weight: 500;">Ingresar →</span>
        </div>
      </div>
    `;
  });

  htmlGrid += `</div>`;

  if (contenedorMenu === document.body) {
    const seccionMenu = document.createElement('section');
    seccionMenu.id = 'seccion-dinamica-modulos';
    seccionMenu.innerHTML =
      `<h2 style="text-align:center; color:#1E293B; font-family:sans-serif; margin-top:30px;">Módulos del Sistema</h2>` +
      htmlGrid;
    document.body.appendChild(seccionMenu);
  } else {
    contenedorMenu.innerHTML = htmlGrid;
  }
}

async function abrirModuloEspecifico(id, titulo) {
  console.log(`[MELANTIA UI] Abriendo módulo ID ${id}: ${titulo}`);
  try {
    // Mostrar estado de carga en la UI
    const contenedor =
      document.getElementById('contenedor-principal') || document.body;
    if (contenedor)
      contenedor.innerHTML = `<p style='text-align:center;font-size:1.2em;margin:40px 0;'>Cargando <b>${titulo}</b>...</p>`;

    // Lógica de carga real del módulo (debes implementar cargarDatosModulo según tu estructura)
    if (typeof cargarDatosModulo === 'function') {
      await cargarDatosModulo(id, titulo);
    } else {
      // Si no existe, solo muestra el panel de carga
      contenedor.innerHTML += `<p style='color:#b91c1c;text-align:center;'>No se encontró la función de carga para este módulo.</p>`;
    }
    console.log(`[MELANTIA UI] Módulo ${id} cargado exitosamente.`);
  } catch (error) {
    console.error(
      `[MELANTIA UI] Error crítico al cargar el módulo ${id}:`,
      error
    );
    alert('No se pudo cargar el entorno. Verifica tu conexión local.');
  }
}

// =========================================================================
// 3. LISTENERS DE CARGA (PROCESAMIENTO AL INICIAR)
// =========================================================================

window.addEventListener('DOMContentLoaded', function () {
  // 1. Render de utilidades de saldo
  var checkout = document.getElementById('checkout-actions');
  if (checkout) {
    checkout.innerHTML = crearBotonCanjemelantios('abrirPanelCanjemelantios');
  }

  var saldo = document.getElementById('saldo-melantios');
  if (saldo) {
    const saldoActual = 250;
    saldo.innerHTML = crearMelantioBadgeConUSD(saldoActual);
  }

  // 2. Carga dinámica del JSON correcto de MELANTIA
  fetch('/app_structure_melant_ia.json')
    .then((response) => {
      if (!response.ok) {
        throw new Error('No se pudo leer app_structure_melant_ia.json');
      }
      return response.json();
    })
    .then((data) => {
      if (data && data.modulos) {
        renderizarModulosPrincipales(data.modulos);
      }
    })
    .catch((error) => {
      console.error('[MELANTIA UI] Error cargando los módulos:', error);
    });
});
