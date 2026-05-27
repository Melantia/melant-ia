// Helpers para normalización y restauración de estado en MELANTIA

export function normalizarEstado(estadoBase, guardado) {
  return {
    ...estadoBase(),
    ...guardado,
    usuario: {
      ...estadoBase().usuario,
      ...(guardado.usuario || {}),
    },
    lista_afiliados: Array.isArray(guardado.lista_afiliados)
      ? guardado.lista_afiliados
      : [],
    historial_pagos: Array.isArray(guardado.historial_pagos)
      ? guardado.historial_pagos
      : [],
  };
}
