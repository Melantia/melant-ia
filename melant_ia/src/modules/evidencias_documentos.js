// Módulo: Registro Evidencias y Documentos
// Funciones y lógica de evidencias, documentos, descargas

export function mostrarPanel() {
  const cont = document.getElementById('contenedor-principal') || document.body;
  cont.innerHTML = `
    <div class="panel-evidencias" style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
      <h2 style='color:#276749;margin-bottom:8px;'>Registro de Evidencias y Documentos</h2>
      <p style='color:#444;font-size:1.1em;'>Aquí puedes registrar, consultar y descargar evidencias y documentos relevantes para tu gestión.</p>
      <div id="evidencias-content"></div>
      <button onclick="window.volverAlMenuPrincipal()" style="margin-top:24px;background:#276749;color:#fff;padding:10px 28px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">Volver al menú principal</button>
    </div>
  `;
  // Aquí puedes inicializar la lógica de evidencias, cargar datos, etc.
}
