// Módulo: Asistente Técnico Rural
// Funciones y lógica del Asistente Técnico Rural

window.MelantiaAsistenteTecnicoRural = {
  // Aquí se migrarán las funciones específicas del módulo
  mostrarPanel: function () {
    const panel = document.getElementById('panel-novedades') || document.body;
    panel.innerHTML = `
      <div class="panel-asistente-tecnico" style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <h2 style='color:#1e88e5;margin:0;'>Asistente Técnico Rural</h2>
          <button id="btn-walkie-asistente" title="Walkie Talkie" style="background:none;border:none;cursor:pointer;font-size:1.7em;line-height:1;outline:none;">
            <span role="img" aria-label="Walkie Talkie">📻</span>
          </button>
        </div>
        <div id="asistente-tecnico-content"></div>
        <button onclick="window.volverAlMenuPrincipal()" style="margin-top:24px;background:#1e88e5;color:#fff;padding:10px 28px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">Volver al menú principal</button>
      </div>
    `;
    setTimeout(() => {
      const btnWalkie = document.getElementById('btn-walkie-asistente');
      if (btnWalkie) {
        btnWalkie.onclick = () => {
          window.abrirWalkieTalkie('asistente_tecnico');
        };
      }
    }, 100);
  },
};
