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

// --- ANEXO: Condiciones para microcrédito y retiro de Melantios (actualizado 2026) ---
/**
 * Reglas para acceso a microcrédito y retiro:
 * - Retiro: mínimo 7,000 Melantios acumulados para retirar $49 USD libres de impuestos, cada 3 meses.
 * - Si ahorra durante 12 meses, puede solicitar un crédito por el 80% del monto acumulado y seguir aumentando su cupo de crédito.
 * - Los Melantios se canjean a dólares cada 3 meses, menos 15% de IVA y 15% de retención. El 15% adicional solo se puede retirar a los 12 meses junto al monto acumulado.
 * - La suscripción solo se paga en dólares.
 */
const REGLAS_MICROCREDITO_RETIRO = {
  microcredito: {
    melantios_min: 7000,
    meses_suscripcion: 12,
    porcentaje_credito: 0.8, // 80% del monto acumulado
    interes_mensual: 0.02,
  },
  retiro: {
    melantios_min: 7000,
    monto_usd: 49,
    periodo_meses: 3, // retiro cada 3 meses
    iva: 0.15,
    retencion: 0.15,
    porcentaje_retiro_12m: 0.15, // 15% adicional solo a los 12 meses
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

function calcularRetiroNeto(melantios, mesesAhorro) {
  // Solo cada 3 meses
  if (melantios < REGLAS_MICROCREDITO_RETIRO.retiro.melantios_min) return 0;
  let usd = melantios / TASA_CAMBIO;
  let neto =
    usd *
    (1 -
      REGLAS_MICROCREDITO_RETIRO.retiro.iva -
      REGLAS_MICROCREDITO_RETIRO.retiro.retencion);
  if (mesesAhorro >= 12) {
    neto += usd * REGLAS_MICROCREDITO_RETIRO.retiro.porcentaje_retiro_12m;
  }
  return neto;
}

function calcularCreditoDisponible(melantios, mesesAhorro) {
  if (mesesAhorro < 12) return 0;
  let usd = melantios / TASA_CAMBIO;
  return usd * REGLAS_MICROCREDITO_RETIRO.microcredito.porcentaje_credito;
}
// Ejemplo de uso:
// calcularRetiroNeto(7000, 3) // Retiro neto tras 3 meses
// calcularCreditoDisponible(14000, 12) // Crédito tras 12 meses
