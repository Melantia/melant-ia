// Módulo: Trazabilidad Digital del Aguacate
// Lógica y UI para la trazabilidad del aguacate en MELANTIA

export function mostrarPanel() {
  const panel = document.getElementById('panel-novedades') || document.body;
  panel.innerHTML = `
    <div class="panel-trazabilidad" style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
      <h2 style='color:#388e3c;margin-bottom:8px;'>Trazabilidad Digital del Aguacate</h2>
      <div id="trazabilidad-aguacate-content"></div>
      <button onclick="window.volverAlMenuPrincipal()" style="margin-top:24px;background:#388e3c;color:#fff;padding:10px 28px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">Volver al menú principal</button>
    </div>
  `;
  cargarDatosDemo();
}

function cargarDatosDemo() {
  // Proceso adaptado a la lógica nacional y exportación
  const data = {
    titulo: 'Trazabilidad del Aguacate (Ecuador)',
    fases: [
      {
        paso: 1,
        titulo: 'Registro del Operador y la Finca',
        estado: 'completado',
        detalles: [
          'Inscripción obligatoria en el Sistema GUIA de Agrocalidad',
          'Certificación en Buenas Prácticas Agrícolas (BPA)',
          'Bitácora de campo: insumos, semillas, fitosanitarios, riegos, agua',
        ],
      },
      {
        paso: 2,
        titulo: 'Cosecha y Asignación del Primer Código',
        estado: 'completado',
        detalles: [
          'Identificación del lote y agrupación por parcela',
          'Ficha de cosecha: fecha, hora, rendimiento, personal',
          'Prohibido mezclar lotes/productores/fechas distintas',
        ],
      },
        {
          paso: 3,
          titulo: 'Recepción en Centro de Acopio o Planta de Empaque',
          estado: 'completado',
          detalles: [
            'Generación del código de trazabilidad único',
            'Vínculo comercial entre productor y exportador',
            'Control de calidad: transporte, lavado, desinfección',
          ],
        },
        {
          paso: 4,
          titulo: 'Selección, Clasificación y Etiquetado en Línea',
          estado: 'pendiente',
          detalles: [
            'Colocación del sello/código en línea de empaque',
            'Etiquetado de cajas: lote, código de barras, geolocalización',
            'Embalaje regulado: palets certificados NIMF-15',
          ],
        },
        {
          paso: 5,
          titulo: 'Logística de Transporte y Despacho Fitosanitario',
          estado: 'bloqueado',
          detalles: [
            'Monitoreo de cadena de frío: temperatura y humedad',
            'Certificado Fitosanitario emitido por SENAE',
            'Validación de procedencia limpia antes de exportar',
          ],
        },
      ],
      nota: `El sistema de trazabilidad del aguacate en Ecuador sigue un estricto proceso normativo regulado por Agrocalidad mediante la Guía de Buenas Prácticas Agrícolas (BPA). La lógica se basa en el principio de "un paso hacia atrás y un paso hacia adelante" (1+1), con registro continuo y código único digital. El flujo es bidireccional (tracing/tracking), y cada lote recibe un ID digital sustentado en origen, producto y tiempo. La cadena de custodia es responsabilidad de todos los actores: productor, transportista, planta de empaque y distribuidor.`,
    };
    import('../assets/ui/renderer_trazabilidad.js').then((mod) => {
      (mod.UIRenderer || window.UIRenderer).dibujarTrazabilidad(
        'trazabilidad-aguacate-content',
        data
      );
    });
  },
};

export default MelantiaTrazabilidadAguacate;
