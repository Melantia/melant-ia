// Lógica de negocio centralizada para afiliados MELANTIA

export function registrarAfiliado(planes, estado, planContratado, datos = {}) {
  const plan = planes[planContratado];
  if (!plan) return false;
  const nuevoAfiliado = {
    nombre: datos.nombre || `Amigo ${estado.lista_afiliados.length + 1}`,
    plan: plan.id,
    estado: datos.estado || 'activo',
    aporte: plan.aporteAfiliado,
    desde: new Date().toISOString().slice(0, 10),
    offline: !navigator.onLine,
  };
  estado.lista_afiliados.unshift(nuevoAfiliado);
  estado.acumulado_bruto = estado.lista_afiliados
    .filter((item) => item.estado === 'activo')
    .reduce((suma, item) => suma + Number(item.aporte || 0), 0);
  estado.retiro_solicitado = false;
  return { ...estado };
}

export function cambiarEstadoAfiliado(estado, indice, nuevoEstado) {
  if (!estado.lista_afiliados[indice]) return false;
  estado.lista_afiliados[indice].estado = nuevoEstado;
  estado.acumulado_bruto = estado.lista_afiliados
    .filter((item) => item.estado === 'activo')
    .reduce((suma, item) => suma + Number(item.aporte || 0), 0);
  return { ...estado };
}

export function solicitarTransferencia(estado, resumen, cuenta) {
  if (resumen.bruto < estado.umbral_pago) return false;
  estado.retiro_solicitado = true;
  // Aquí se puede agregar lógica adicional de recibo, etc.
  return { ...estado };
}
