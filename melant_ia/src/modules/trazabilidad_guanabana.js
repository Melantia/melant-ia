// Módulo: Trazabilidad Digital de la Guanábana
// Lógica y UI para la trazabilidad de la guanábana en MELANTIA

export function mostrarPanel() {
  return MelantiaTrazabilidadGuanabana.mostrarPanel();
}

const MelantiaTrazabilidadGuanabana = {
  mostrarPanel: function () {
    const panel = document.getElementById('panel-novedades') || document.body;
    panel.innerHTML = `
      <div class="panel-trazabilidad" style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
        <h2 style='color:#2e7d32;margin-bottom:8px;'>Trazabilidad Digital de la Guanábana</h2>
        <div id="trazabilidad-guanabana-content"></div>
        <button onclick="window.volverAlMenuPrincipal()" style="margin-top:24px;background:#2e7d32;color:#fff;padding:10px 28px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">Volver al menú principal</button>
      </div>
    `;
    this.cargarDatosDemo();
  },
  cargarDatosDemo: function () {
    // Proceso adaptado a la lógica nacional y exportación
    const data = {
      titulo: 'Trazabilidad de la Guanábana (Ecuador)',
      fases: [
        {
          paso: 1,
          titulo: 'Alta del Huerto y Registro Tecnológico',
          estado: 'completado',
          detalles: [
            'Registro en el Sistema GUIA de Agrocalidad',
            'Georreferenciación parcelaria con GPS',
            'Historial de insumos y bitácora de campo (control fitosanitario y fertilización)',
          ],
        },
        {
          paso: 2,
          titulo: 'Cuidado del Fruto y Pre-cosecha',
          estado: 'completado',
          detalles: [
            'Registro de polinización manual',
            'Control de embolse y sub-código de lote',
            'Muestreo químico de hojas y suelo (bloque de origen)',
          ],
        },
        {
          paso: 3,
          titulo: 'Cosecha Técnica y Primer Sellado de Lote',
          estado: 'completado',
          detalles: [
            'Corte por lote según índice visual',
            'Ficha de campo inmediata (fecha, hora, cantidad, cuadrilla)',
            'Asignación de bines y etiquetado provisional',
          ],
        },
        {
          paso: 4,
          titulo: 'Centros de Acopio y Procesamiento',
          estado: 'pendiente',
          detalles: [
            'Validación de ingreso y no mezcla de variedades',
            'Conversión a código industrial (GTIN/lote industrial)',
            'Lavado, desinfección y selección con registro de desinfectantes',
          ],
        },
        {
          paso: 5,
          titulo: 'Etiquetado Definitivo y Empaque',
          estado: 'pendiente',
          detalles: [
            'Adhesión de código QR o barras con datos completos',
            'Embalaje estandarizado y consolidación de palets',
            'Condiciones de paletizado para evitar daños',
          ],
        },
        {
          paso: 6,
          titulo: 'Logística Fría y Certificación de Salida',
          estado: 'bloqueado',
          detalles: [
            'Bitácora de temperatura (12-15°C fruta fresca, congelación pulpa)',
            'Emisión de Certificado Fitosanitario por Agrocalidad',
            'Inspección digital y autorización de exportación',
          ],
        },
      ],
      nota: `El proceso de trazabilidad de la guanábana en Ecuador adopta la misma lógica operacional que el aguacate, adaptándose a las condiciones críticas de esta fruta exótica (como su extrema delicadeza poscosecha y su alta propensión a plagas como la avispa perforadora). El sistema es supervisado por Agrocalidad para respaldar la inocuidad tanto en fruta fresca como en pulpas de exportación.`,
    };
    import('../assets/ui/renderer_trazabilidad.js').then((mod) => {
      (mod.UIRenderer || window.UIRenderer).dibujarTrazabilidad(
        'trazabilidad-guanabana-content',
        data
      );
    });
  },
};

export default MelantiaTrazabilidadGuanabana;
