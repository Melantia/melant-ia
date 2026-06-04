// Wrapper de compatibilidad para rutas antiguas.
// Redirige al hub real de Gestion de Fincas y Trazabilidad.

export async function mostrarPanel() {
  const mod = await import('./gestion_fincas_trazabilidad_hub.js');
  if (typeof mod?.mostrarPanel === 'function') {
    return mod.mostrarPanel();
  }
  if (mod?.default && typeof mod.default.mostrarPanel === 'function') {
    return mod.default.mostrarPanel();
  }
  throw new Error(
    'No se encontro mostrarPanel en gestion_fincas_trazabilidad_hub.js'
  );
}

export default { mostrarPanel };
