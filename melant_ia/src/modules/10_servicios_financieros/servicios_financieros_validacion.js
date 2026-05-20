// Validación de datos y lógica KYC local
export function validarFormularioFinanciero(datos) {
  if (!datos.nombres || !datos.cedula || !datos.celular) {
    return { ok: false, error: 'Faltan datos obligatorios.' };
  }
  // Validaciones adicionales (formato, unicidad, etc.)
  // ...
  return { ok: true };
}
