// config_pagos_melantia.js
// Configuración centralizada de comisiones y cargos para la tienda MELANTIA

export const PAGOS_MELANTIA = {
  IVA: 0.15, // 15% IVA
  COMISION_MELANTIA: 0.05, // 5% MELANTIA
  PAYPHONE: {
    ACTIVO: true,
    COMISION: 0.05, // 5% PayPhone
    IVA_COMISION: true, // Aplica IVA sobre la comisión PayPhone
  },
  DEUNA: {
    ACTIVO: true,
    COMISION: 0, // Deuna no cobra comisión
    IVA_COMISION: false,
  },
  PEIGO: {
    ACTIVO: true,
    COMISION: 0, // peiGo no cobra comisión
    IVA_COMISION: false,
  },
};

// Si necesitas cambiar valores, solo edita este archivo.
