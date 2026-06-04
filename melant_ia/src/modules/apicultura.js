// Wrapper estable para el submodulo de apicultura.
// Redirige a la implementacion real en manejo_apicultura.js

export async function mostrarPanel() {
  const mod = await import('./manejo_apicultura.js');
  if (mod?.default && typeof mod.default.mostrarPanel === 'function') {
    return mod.default.mostrarPanel();
  }
  if (typeof mod?.mostrarPanel === 'function') {
    return mod.mostrarPanel();
  }
  throw new Error('No se encontro mostrarPanel en manejo_apicultura.js');
}

export default { mostrarPanel };
