// modules/melantio_ui.js
// Lógica UI para Melantio: botón de canje y utilidades
// NOTA: Melantio (la moneda virtual) solo interviene con voz para explicar la conversión "100 Melantios = $1" cuando el usuario consulta su saldo. Todas las demás explicaciones y mensajes de voz quedan a cargo de Don Eloy o Angel según corresponda.

// Función para crear el botón de canje Melantios
// Solo permite cubrir hasta el 25% del valor del producto con Melantios.
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
      <img src="/src/assets/ui/icons/melantio_gold.svg" alt="Melantio" class="melantio-icon" />
      <span>Usar Melantios (máx. 25%)</span>
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

  // Melantio solo interviene aquí: explicación de conversión al consultar saldo
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    const mensaje = `Recuerda: 100 Melantios equivalen a 1 dólar. Tu saldo es de ${cantidad} Melantios, es decir, $${usd} dólares.`;
    const utt = new window.SpeechSynthesisUtterance(mensaje);
    utt.lang = 'es-EC';
    utt.rate = 0.98;
    utt.pitch = 1.1;
    // Selección de voz Melantio (puedes personalizar el filtro si tienes una voz específica)
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

// Ejemplo de función de callback para el botón
function abrirPanelCanjemelantios() {
  alert('Panel de canje de Melantios (demo)');
}

// CONFIGURACIÓN DE LA MONEDA MELANTIA
// 100 Melantios = $1.00 USD. Límite de canje en tiendas: 25% del valor del producto.
const TASA_CAMBIO = 100; // 100 Melantios = $1.00 USD
const LIMITE_CANJE_GLOBAL = 0.25; // Solo puedes usar Melantios para el 25% del valor

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
