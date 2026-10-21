// sistemaAfiliadosLogic.js

const storageKey = 'melantia_afiliados_estado';

function estadoBase() {
  return {
    usuario: {
      nombre: 'Padrino MELANTIA',
      plan_actual: 'profesional',
      pin_usuario: 'MEL-8829',
      correo: 'presidencia@melantia.ec',
    },
    acumulado_bruto: 0,
    umbral_pago: 60,
    lista_afiliados: [],
    historial_pagos: [],
  };
}

function obtenerEstado() {
  try {
    const guardado = JSON.parse(
      window.localStorage?.getItem(storageKey) || 'null'
    );
    if (!guardado) return estadoBase();
    return guardado;
  } catch {
    return estadoBase();
  }
}

function guardarEstado(estado) {
  window.localStorage?.setItem(storageKey, JSON.stringify(estado));
  return estado;
}

function resumenFinanciero(estado) {
  const bruto = Number(estado.acumulado_bruto || 0);
  const impuestos = bruto * 0.15;
  const neto = bruto - impuestos;
  return { bruto, impuestos, neto };
}

export { estadoBase, obtenerEstado, guardarEstado, resumenFinanciero };
