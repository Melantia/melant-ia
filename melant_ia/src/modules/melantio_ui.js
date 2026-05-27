// modules/melantio_ui.js
// Lógica UI para Melantio: botón de canje, utilidades y renderizado de módulos
// NOTA: Melantio solo interviene con voz para explicar la conversión "100 Melantios = $1" al consultar saldo.

// =========================================================================
// 1. FUNCIONES ORIGINALES DE LA MONEDA VIRTUAL (MELANTIOS)
// =========================================================================

function crearBotonCanjemelantios(callbackFuncion) {
  return `
    <button 
      onclick="typeof ${callbackFuncion} === 'function' ? ${callbackFuncion}() : alert('Usar Melantios')"
      style="
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        background: linear-gradient(135deg, #F59E0B, #B45309);
        color: white;
        border: 1px solid #92400E;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        font-size: 14px;
        transition: all 0.3s ease;
      "
      onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 12px rgba(245, 158, 11, 0.4)';"
      onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';"
      title="Solo puedes cubrir hasta el 25% del valor del producto con Melantios. El resto debe ser en dinero real."
    >
      <img src="assets/ui/icons/melantio_gold.svg" alt="Melantio" class="melantio-icon" />
      <span>Usar Melantios (máx. 25%)</span>
    </button>
  `;
}

function crearMelantioBadge(cantidad) {
  return `
    <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px; background: #FEF3C7; border-radius: 4px; border: 1px solid #FCD34D;">
      <img src="/src/assets/ui/icons/melantio_gold.svg" alt="Melantio" class="melantio-icon" />
      <span style="font-weight: bold; color: #78350F; font-size: 14px;">${cantidad}</span>
    </div>
  `;
}

function crearMelantioBadgeConUSD(cantidad) {
  const usd = calcularValorPremios(cantidad).toFixed(2);
  const svgIcon = `<img src="assets/ui/icons/melantio_gold.svg" alt="Melantio" class="melantio-icon" />`;

  if (typeof window !== 'undefined' && window.speechSynthesis) {
    const mensaje = `Recuerda: 100 Melantios equivalen a 1 dólar. Tu saldo es de ${cantidad} Melantios, es decir, $${usd} dólares.`;
    const utt = new window.SpeechSynthesisUtterance(mensaje);
    utt.lang = 'es-EC';
    utt.rate = 0.98;
    utt.pitch = 1.1;
    const voces = window.speechSynthesis.getVoices();
    utt.voice =
      voces.find(
        (v) =>
          v.lang.startsWith('es') && v.name.toLowerCase().includes('melantio')
      ) ||
      voces.find((v) => v.lang.startsWith('es')) ||
      voces[0];
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utt);
  }

  return `
    <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px; background: #FEF3C7; border-radius: 4px; border: 1px solid #FCD34D;">
      ${svgIcon}
      <span style="font-weight: bold; color: #78350F; font-size: 14px;">${cantidad}M</span>
      <span style="color: #92400E; font-size: 13px; margin-left: 6px;">($${usd} USD)</span>
    </div>
  `;
}

function abrirPanelCanjemelantios() {
  alert('Panel de canje de Melantios (demo)');
}

const TASA_CAMBIO = 100;
const LIMITE_CANJE_GLOBAL = 0.25;

function calcularValorPremios(melantiosAcumulados) {
  return melantiosAcumulados / TASA_CAMBIO;
}

function calcularPremioPorSuscripcion(precioPlanUSD) {
  const beneficioUSD = precioPlanUSD * 0.1;
  return beneficioUSD * TASA_CAMBIO;
}

// =========================================================================
// 2. MOTOR DE RENDERIZADO DINÁMICO (TÍTULOS LIMPIOS SIN VOCES)
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
