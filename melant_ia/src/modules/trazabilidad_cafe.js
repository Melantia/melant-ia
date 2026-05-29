// Módulo: Trazabilidad Digital del Café
// Lógica y UI para la trazabilidad del café en MELANTIA

export function mostrarPanel() {
  return MelantiaTrazabilidadCafe.mostrarPanel();
}

const MelantiaTrazabilidadCafe = {
  mostrarPanel: function () {
    const panel = document.getElementById('panel-novedades') || document.body;
    panel.innerHTML = `
      <div class="panel-trazabilidad" style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <h2 style='color:#6F4E37;margin:0;'>Trazabilidad Digital del Café</h2>
          <button id="btn-walkie-cafe" title="Walkie Talkie" style="background:none;border:none;cursor:pointer;font-size:1.7em;line-height:1;outline:none;">
            <span role="img" aria-label="Walkie Talkie">📻</span>
          </button>
        </div>
        <div id="trazabilidad-cafe-content"></div>
        <button onclick="window.volverAlMenuPrincipal()" style="margin-top:24px;background:#6F4E37;color:#fff;padding:10px 28px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">Volver al menú principal</button>
      </div>
    `;
    setTimeout(() => {
      const btnWalkie = document.getElementById('btn-walkie-cafe');
      if (btnWalkie) {
        btnWalkie.onclick = () => {
          window.abrirWalkieTalkie('trazabilidad_cafe');
        };
      }
    }, 100);
    this.cargarDatosDemo();
  },
  cargarDatosDemo: function () {
    // Adaptado: fases y ejemplos reales de trazabilidad del café
    const data = {
      titulo: 'Trazabilidad del Café',
      fases: [
        {
          paso: 1,
          titulo: 'Registro y Siembra',
          estado: 'completado',
          detalles: [
            'Registro de variedad, finca y productor',
            'Capacitación en documentación digital',
            'Ejemplo: Asociación usa QR para registrar variedad y altitud',
          ],
        },
        {
          paso: 2,
          titulo: 'Cosecha y Beneficio',
          estado: 'completado',
          detalles: [
            'Registro de fecha de cosecha y responsable',
            'Control de beneficio y secado',
            'Ejemplo: Registro digital de lotes y control de humedad',
          ],
        },
        {
          paso: 3,
          titulo: 'Almacenamiento y Certificación',
          estado: 'pendiente',
          detalles: [
            'Certificados de calidad y sostenibilidad',
            'Respaldo automático en la nube',
            'Ejemplo: Generación de informes PDF con QR para auditoría',
          ],
        },
        {
          paso: 4,
          titulo: 'Exportación y Trazabilidad Final',
          estado: 'bloqueado',
          detalles: [
            'Trazabilidad documental para exportación',
            'Cumplimiento de normativas internacionales',
            'Ejemplo: Acceso a mercados premium con trazabilidad completa',
          ],
        },
      ],
    };
    import('../assets/ui/renderer_trazabilidad.js').then((mod) => {
      (mod.UIRenderer || window.UIRenderer).dibujarTrazabilidad(
        'trazabilidad-cafe-content',
        data
      );
    });
  },
};

export default MelantiaTrazabilidadCafe;
