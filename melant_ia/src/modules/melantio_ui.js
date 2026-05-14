// modules/melantio_ui.js
// Lógica UI para Melantio: botón de canje y utilidades

// Función para crear el botón de canje Melantios
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
    >
      <img src="/src/assets/ui/icons/melantio_gold.svg" alt="Melantio" class="melantio-icon" />
      <span>Usar Melantios</span>
    </button>
  `;
}

// Función para crear el badge de saldo Melantios
function crearMelantioBadge(cantidad) {
  return `
    <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px; background: #FEF3C7; border-radius: 4px; border: 1px solid #FCD34D;">
      <img src="/src/assets/ui/icons/melantio_gold.svg" alt="Melantio" class="melantio-icon" />
      <span style="font-weight: bold; color: #78350F; font-size: 14px;">${cantidad}</span>
    </div>
  `;
}

// Función para renderizar el badge de Melantios con valor en USD
function crearMelantioBadgeConUSD(cantidad) {
  const usd = calcularValorPremios(cantidad).toFixed(2);
  const svgIcon = `<img 
    src="/src/assets/ui/icons/melantio_gold.svg" 
    alt="Melantio" 
    class="melantio-icon"
  />`;

  return `
    <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px; background: #FEF3C7; border-radius: 4px; border: 1px solid #FCD34D;">
      ${svgIcon}
      <span style="font-weight: bold; color: #78350F; font-size: 14px;">${cantidad}M</span>
      <span style="color: #92400E; font-size: 13px; margin-left: 6px;">($${usd} USD)</span>
    </div>
  `;
}

// Ejemplo de función de callback para el botón
function abrirPanelCanjemelantios() {
  alert('Panel de canje de Melantios (demo)');
}

// CONFIGURACIÓN DE LA MONEDA MELANTIA
const TASA_CAMBIO = 100; // 100 Melantios = $1.00 USD

/**
 * Convierte el valor de los premios acumulados a dólares
 * para que el socio sepa cuánto dinero real tiene en "premios".
 */
function calcularValorPremios(melantiosAcumulados) {
  return melantiosAcumulados / TASA_CAMBIO;
}

/**
 * Calcula el premio por suscripción (10% del valor del plan)
 * El resultado se entrega en Melantios.
 */
function calcularPremioPorSuscripcion(precioPlanUSD) {
  const beneficioUSD = precioPlanUSD * 0.1; // 10% de beneficio
  return beneficioUSD * TASA_CAMBIO; // Convertido a Melantios
}

// Insertar el botón en el contenedor de checkout-actions
window.addEventListener('DOMContentLoaded', function () {
  var checkout = document.getElementById('checkout-actions');
  if (checkout) {
    checkout.innerHTML = crearBotonCanjemelantios('abrirPanelCanjemelantios');
  }
});

// Insertar el badge de saldo en el contenedor correspondiente de forma dinámica
window.addEventListener('DOMContentLoaded', function () {
  var saldo = document.getElementById('saldo-melantios');
  if (saldo) {
    // Aquí puedes obtener el saldo real dinámicamente si lo tienes
    const saldoActual = 250; // Reemplazar por variable dinámica si existe
    saldo.innerHTML = crearMelantioBadgeConUSD(saldoActual);
  }
});
