// Módulo: Negocios Rurales
// Funciones y lógica de tienda, bienes raíces, oportunidades, etc.

export function mostrarPanel() {
  const cont = document.getElementById('contenedor-principal') || document.body;
  cont.innerHTML = `
    <div class="panel-hub" style="max-width:700px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
      <h2 style='color:#8d6e63;text-align:center;margin-bottom:24px;'>Negocios Rurales</h2>
      <p style="color:#444;font-size:1.1em;text-align:center;">Aquí se mostrarán las oportunidades, bienes raíces, tienda rural y otros servicios de negocios rurales.</p>
      <button onclick="window.volverAlMenuPrincipal()" style="margin-top:32px;background:#8d6e63;color:#fff;padding:10px 28px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">Volver al menú principal</button>
    </div>
  `;
}

window.MelantiaNegociosRurales = {
  // Aquí se migrarán las funciones específicas del módulo
};
