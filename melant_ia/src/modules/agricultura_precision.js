// agricultura_precision.js — Submódulo MELANTIA
export function mostrarPanel() {
  const contenedor =
    document.getElementById('contenedor-principal') || document.body;
  contenedor.innerHTML = `
    <div class="panel-especifico" style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
      <h2 style="color:#276749;">Agricultura de Precisión (Uso de Sensores)</h2>
      <p style="color:#444;font-size:1.1em;">Aquí puedes gestionar sensores y herramientas para agricultura de precisión.</p>
      <!-- Agrega aquí la lógica y UI específica -->
      <button onclick="window.cargarDatosModulo(null, 'Asistente Técnico Rural')" style="margin-top:30px;padding:10px 24px;background:#276749;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:1em;">← Volver</button>
    </div>
  `;
}
