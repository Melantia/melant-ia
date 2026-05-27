// Módulo: Trazabilidad Digital del Cacao
// Lógica y UI para la trazabilidad del cacao en MELANTIA

const MelantiaTrazabilidadCacao = {
  mostrarPanel: function () {
    const panel = document.getElementById('panel-novedades') || document.body;
    panel.innerHTML = `
      <div class="panel-trazabilidad" style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
        <h2 style='color:#7B3F00;margin-bottom:8px;'>Trazabilidad Digital del Cacao</h2>
        <div id="trazabilidad-cacao-content"></div>
        <button onclick="window.volverAlMenuPrincipal()" style="margin-top:24px;background:#7B3F00;color:#fff;padding:10px 28px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">Volver al menú principal</button>
      </div>
    `;
    this.cargarDatosDemo();
  },
  cargarDatosDemo: function () {
    // Adaptado: fases y ejemplos reales de trazabilidad del cacao
    const data = {
      titulo: 'Trazabilidad del Cacao',
      fases: [
        {
          paso: 1,
          titulo: 'Registro y Siembra',
          estado: 'completado',
          detalles: [
            'Registro de variedad y ubicación de la finca',
            'Capacitación en documentación y digitalización',
            'Ejemplo: Cooperativa usa QR para registrar finca y productor',
          ],
        },
        {
          paso: 2,
          titulo: 'Cosecha y Fermentación',
          estado: 'completado',
          detalles: [
            'Registro de fecha de cosecha y responsable',
            'Control de fermentación y secado',
            'Ejemplo: Registro digital de lotes y control de temperatura',
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
        'trazabilidad-cacao-content',
        data
      );
    });
  },
};

export default MelantiaTrazabilidadCacao;
