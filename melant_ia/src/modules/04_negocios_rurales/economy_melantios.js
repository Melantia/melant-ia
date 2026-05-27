// --- LÓGICA DE ECONOMÍA MELANTIOS CENTRALIZADA ---
// Todas las funciones y reglas de Melantios extraídas de afiliados_controller.js

import melantiosConfig from '../../database/melantios_economy_v1.json';

export function cargarConfigMelantios() {
  try {
    return melantiosConfig.business_rules.reward_points;
  } catch {
    return {
      loyalty_6_months: {
        cascada: { socio: 100, padrino: 20, presidente: 10 },
        total_cost_usd: 1.3,
      },
      folklore_story: {
        cascada: { socio: 25, padrino: 10, presidente: 5 },
        total_cost_usd: 0.4,
      },
      new_word: {
        cascada: { socio: 5, padrino: 2, presidente: 1 },
        total_cost_usd: 0.08,
      },
      health_record: {
        cascada: { socio: 10, padrino: 5, presidente: 2 },
        total_cost_usd: 0.17,
      },
    };
  }
}

export function convertToUSD(melantios) {
  return (melantios * 0.01).toFixed(2);
}

export function convertFromUSD(dolares) {
  return Math.round(dolares * 100);
}

export function ganarMelantioCascada(
  tipoRecompensa,
  idSocio,
  idPadrino,
  idPresidente
) {
  const config = cargarConfigMelantios();
  const recompensa = config[tipoRecompensa];
  if (!recompensa) {
    console.warn(`Tipo de recompensa desconocida: ${tipoRecompensa}`);
    return null;
  }
  const { cascada, total_cost_usd } = recompensa;
  const timestamp = new Date().toISOString();
  return {
    tipoRecompensa,
    timestamp,
    estado: 'PENDIENTE_VALIDACION_PADRINO',
    distribucion: {
      socio: {
        idSocio,
        melantios: cascada.socio,
        usd: convertToUSD(cascada.socio),
      },
      padrino: {
        idPadrino,
        melantios: cascada.padrino,
        usd: convertToUSD(cascada.padrino),
      },
      presidente: {
        idPresidente,
        melantios: cascada.presidente,
        usd: convertToUSD(cascada.presidente),
      },
    },
    costoTotal: {
      melantios: cascada.socio + cascada.padrino + cascada.presidente,
      usd: total_cost_usd,
    },
    vencimiento: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

export function validarVencimientoMelantios(fechaVencimiento) {
  const ahora = new Date();
  const vencimiento = new Date(fechaVencimiento);
  const diasRestantes = Math.floor(
    (vencimiento - ahora) / (1000 * 60 * 60 * 24)
  );
  return {
    expirado: diasRestantes < 0,
    proximoVencer: diasRestantes < 30 && diasRestantes >= 0,
    diasRestantes: Math.max(diasRestantes, 0),
    estado:
      diasRestantes < 0
        ? 'EXPIRADO'
        : diasRestantes < 30
          ? 'PROXIMOAVENCER'
          : 'VIGENTE',
  };
}

export function validarCanjeAl50(melantiosUsados, precioProducto) {
  const usdEquivalente = convertToUSD(melantiosUsados);
  const montoEnEfectivo = (precioProducto - parseFloat(usdEquivalente)).toFixed(
    2
  );
  return {
    permitido: parseFloat(usdEquivalente) <= precioProducto * 0.5,
    melantiosUsados,
    equivalenciaUSD: usdEquivalente,
    precioProducto: precioProducto.toFixed(2),
    efectivoRequerido: montoEnEfectivo,
    porcentajeMelantios: ((usdEquivalente / precioProducto) * 100).toFixed(1),
  };
}

export function liberarMelantiosPorValidacionPadrino(idRecompensa, estado) {
  const recompensa = estado.lista_afiliados.find((a) => a.id === idRecompensa);
  if (
    !recompensa ||
    recompensa.recompensa.estado !== 'PENDIENTE_VALIDACION_PADRINO'
  ) {
    return { error: 'Recompensa no encontrada o ya validada' };
  }
  recompensa.recompensa.estado = 'LIBERADO';
  recompensa.recompensa.fechaLiberacion = new Date().toISOString();
  window.localStorage?.setItem(
    'melantia_afiliados_estado',
    JSON.stringify(estado)
  );
  return estado;
}
