// --- ANEXO: Configuración y lógica de recompensas Melantios en cascada para sistema de afiliados ---
const RECOMPENSAS_MELANTIOS = {
  distribucion_cascada: {
    historia: { socio: 25, padrino: 10, presidente: 5 },
    palabra: { socio: 5, padrino: 2, presidente: 1 },
    fidelidad: { socio: 100, padrino: 20, presidente: 10 },
  },
  limite_canje_global: 0.5, // 50% del valor del producto
  estado_inicial: 'PENDIENTE_VALIDACION_PADRINO',
};

function calcularRecompensa(tipo, rol) {
  const dist = RECOMPENSAS_MELANTIOS.distribucion_cascada[tipo];
  if (!dist || !dist[rol]) return 0;
  return dist[rol];
}
// Ejemplo: calcularRecompensa('historia', 'padrino');

// --- ANEXO: Utilidades de conversión Melantios <-> USD ---
const TASA_CAMBIO = 100; // 100 Melantios = $1.00 USD
function calcularValorPremios(melantiosAcumulados) {
  return melantiosAcumulados / TASA_CAMBIO;
}
function calcularPremioPorSuscripcion(precioPlanUSD) {
  const beneficioUSD = precioPlanUSD * 0.1;
  return beneficioUSD * TASA_CAMBIO;
}
// Ejemplo: calcularPremioPorSuscripcion(20); // 200 Melantios

// --- ANEXO: Condiciones para microcrédito y retiro de Melantios ---
/**
 * Reglas para acceso a microcrédito y retiro:
 * - Microcrédito: mínimo 15,000 Melantios ahorrados y 12 meses de suscripción consecutiva.
 *   Acceso a $130 USD con 2% de interés mensual.
 * - Retiro mínimo: 6,000 Melantios acumulados para retirar $40 USD.
 *   El monto puede ser acumulable y retirado a los 12 meses, o solicitar microcrédito y seguir ahorrando.
 */
const REGLAS_MICROCREDITO_RETIRO = {
  microcredito: {
    melantios_min: 15000,
    meses_suscripcion: 12,
    monto_usd: 130,
    interes_mensual: 0.02,
  },
  retiro: {
    melantios_min: 6000,
    monto_usd: 40,
    periodo_meses: 12, // acumulable
  },
};

function puedeSolicitarMicrocredito(saldoMelantios, mesesSuscripcion) {
  return (
    saldoMelantios >= REGLAS_MICROCREDITO_RETIRO.microcredito.melantios_min &&
    mesesSuscripcion >=
      REGLAS_MICROCREDITO_RETIRO.microcredito.meses_suscripcion
  );
}

function puedeSolicitarRetiro(saldoMelantios) {
  return saldoMelantios >= REGLAS_MICROCREDITO_RETIRO.retiro.melantios_min;
}
// Ejemplo de uso:
// puedeSolicitarMicrocredito(16000, 12) // true
// puedeSolicitarRetiro(7000) // true
