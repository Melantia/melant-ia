// --- LÓGICA DE NEGOCIOS RURALES MELANTIA ---
/**
 * Tienda MELANTIA:
 * - Dirigida a almacenes, ferreterías, farmacias y comercios que deseen vender desde la app.
 * - Permite publicar productos, ofertas, gestionar inventario, mostrar catálogo virtual y vender desde la aplicación.
 * - Las tiendas tienen 3 meses gratis; luego pagan $25 mensuales.
 * - NO pagan comisiones por venta (ni 3% ni 5%), solo la mensualidad fija.
 *
 * Bienes Raíces Rurales:
 * - Intermediación de propiedades con depósito en garantía.
 * - Evidencia fotográfica/GPS y notarial.
 * - Contratos automáticos y doble conformidad (comprador/vendedor).
 * - Liberación de fondos solo tras verificación legal.
 * - Reportes mensuales.
 * - Comisiones: 3-5% por venta, pagos directos y custodia de dinero hasta entrega confirmada por QR.
 *
 * Emprendedores:
 * - Pueden publicar productos y servicios solo si tienen la suscripción del Plan Standard.
 *
 * Profesionales:
 * - Pueden publicar sus servicios solo si tienen contratado el Plan Standard.
 *
 * Integración de personajes (Bienes Raíces):
 * - Don Eloy: comercio y mediación.
 * - Angel: finanzas y custodia.
 * - Dr. Pablo: asesoría legal.
 */

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

// --- ANEXO: Condiciones para microcrédito, canje y retiro de Melantios (actualizado 2026) ---
/**
 * Reglas para acceso a microcrédito, canje y retiro:
 * - Debes acumular al menos 7,000 Melantios y tener mínimo 3 meses de antigüedad para poder realizar retiros o pagos especiales.
 * - El parámetro limite_canje_global: 0.25 significa que, al gastar Melantios en tiendas, solo puedes cubrir hasta el 25% del valor de un producto con Melantios (el 75% restante debe ser en dinero real).
 * - Para retiros en efectivo, solo puedes retirar cada 3 meses, aplicando un 15% de IVA y 15% de retención.
 * - Si mantienes el ahorro durante 12 meses, puedes solicitar un crédito por el 80% del monto acumulado y acceder a un 15% adicional del saldo retenido.
 * - También puedes retirar el total ahorrado de Melantios en dólares, menos impuestos de ley y de la app.
 * - Todas estas reglas buscan fomentar el ahorro, la fidelidad y la sostenibilidad financiera del sistema MELANTIA.
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

// --- TARIFAS Y VALIDACIONES DE TIENDAS MELANTIA ---
/**
 * Las tiendas solo pagan una mensualidad fija de $25 USD después de 3 meses gratis.
 * No se aplica comisión por venta (0%).
 */
const TARIFA_MENSUAL_TIENDA = 25; // USD
const MESES_GRATIS_TIENDA = 3;

function calcularCostoTienda(mesActual) {
  // Retorna 0 si está en meses gratis, si no retorna la tarifa mensual
  return mesActual <= MESES_GRATIS_TIENDA ? 0 : TARIFA_MENSUAL_TIENDA;
}

function calcularComisionTienda(tipoNegocio) {
  // Si es tienda MELANTIA, la comisión es 0
  if (tipoNegocio === 'tienda') return 0;
  // Para bienes raíces, comisión estándar 3% a 5%
  if (tipoNegocio === 'bienes_raices') return 0.04; // 4% ejemplo
  // Otros tipos pueden tener lógica adicional
  return null;
}

function puedePublicarProducto(usuario) {
  // Tiendas: siempre pueden publicar si están al día en la mensualidad
  if (usuario.tipo === 'tienda') {
    return usuario.mesPagado >= usuario.mesActual;
  }
  // Emprendedores y profesionales: solo si tienen Plan Standard activo
  if (
    (usuario.tipo === 'emprendedor' || usuario.tipo === 'profesional') &&
    usuario.planStandardActivo
  ) {
    return true;
  }
  return false;
}

// --- API pública consumida por Suscripciones (afiliados_controller) ---
function cargarConfigMelantios() {
  return {
    recompensas: RECOMPENSAS_MELANTIOS,
    tasaCambio: TASA_CAMBIO,
    reglas: REGLAS_MICROCREDITO_RETIRO,
  };
}

function convertToUSD(melantios = 0) {
  return Number(melantios || 0) / TASA_CAMBIO;
}

function convertFromUSD(usd = 0) {
  return Math.floor(Number(usd || 0) * TASA_CAMBIO);
}

function ganarMelantioCascada(tipo = 'palabra', rol = 'socio') {
  return calcularRecompensa(tipo, rol);
}

function validarVencimientoMelantios(items = [], diasMax = 90) {
  const ahora = Date.now();
  const msMax = Number(diasMax || 0) * 24 * 60 * 60 * 1000;
  return (Array.isArray(items) ? items : []).filter((item) => {
    const fecha = new Date(item?.fecha || item?.created_at || 0).getTime();
    if (!fecha || Number.isNaN(fecha)) return false;
    return ahora - fecha > msMax;
  });
}

function validarCanjeAl50(totalProductoUSD = 0, canjeUSD = 0) {
  const total = Number(totalProductoUSD || 0);
  const canje = Number(canjeUSD || 0);
  if (total <= 0) return false;
  return canje <= total * RECOMPENSAS_MELANTIOS.limite_canje_global;
}

function liberarMelantiosPorValidacionPadrino(
  estado = 'PENDIENTE_VALIDACION_PADRINO'
) {
  return estado === RECOMPENSAS_MELANTIOS.estado_inicial;
}

export {
  cargarConfigMelantios,
  convertToUSD,
  convertFromUSD,
  ganarMelantioCascada,
  validarVencimientoMelantios,
  validarCanjeAl50,
  liberarMelantiosPorValidacionPadrino,
  calcularCostoTienda,
  calcularComisionTienda,
  puedePublicarProducto,
};
