// Entrada compatible con loader clasico (script src) para Comunidad Virtual.
// Carga el modulo canónico de Walkie (ESM) y renderiza en la vista activa.

(function cargarComunidadVirtual() {
  const contenedor =
    document.getElementById('vista-activa') ||
    document.getElementById('contenedor-principal') ||
    document.body;

  import('./walkie_talkie.js')
    .then((mod) => {
      if (typeof mod.mostrarPanel === 'function') {
        mod.mostrarPanel(contenedor.id || 'contenedor-principal');
      } else {
        contenedor.innerHTML =
          '<div style="color:#b91c1c;text-align:center;margin:40px 0;">Comunidad Virtual no disponible: falta mostrarPanel().</div>';
      }
    })
    .catch((err) => {
      contenedor.innerHTML = `<div style="color:#b91c1c;text-align:center;margin:40px 0;">Error cargando Comunidad Virtual: ${err.message}</div>`;
    });
})();
