// Módulo: Trazabilidad Digital del Plátano Barraganete
// Lógica y UI para la trazabilidad del plátano en MELANTIA

export function mostrarPanel() {
  return MelantiaTrazabilidadPlatano.mostrarPanel();
}

const MelantiaTrazabilidadPlatano = {
  mostrarPanel: function () {
    const panel = document.getElementById('panel-novedades') || document.body;
    panel.innerHTML = `
      <div class="panel-trazabilidad" style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
        <h2 style='color:#b59a3a;margin-bottom:8px;'>Trazabilidad Digital del Plátano Barraganete</h2>
        <div id="trazabilidad-platano-content"></div>
        <button onclick="window.volverAlMenuPrincipal()" style="margin-top:24px;background:#b59a3a;color:#fff;padding:10px 28px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">Volver al menú principal</button>
      </div>
    `;
    this.cargarDatosDemo();
  },
  cargarDatosDemo: function () {
    // Proceso adaptado a la lógica nacional y exportación
    const data = {
      titulo: 'Trazabilidad del Plátano Barraganete (Ecuador)',
      fases: [
        {
          paso: 1,
          titulo: 'Registro y Certificación de la Finca',
          estado: 'completado',
          detalles: [
            'Registro en el Sistema GUIA de Agrocalidad',
            'Certificación en Buenas Prácticas Agrícolas (BPA)',
            'Bitácora de campo: insumos, fertilización, riego, fitosanitarios',
          ],
        },
        {
          paso: 2,
          titulo: 'Cosecha y Agrupación por Lote',
          estado: 'completado',
          detalles: [
            'Identificación del lote y bloque de origen',
            'Registro de fecha, hora, cantidad y personal de cosecha',
            'Prohibido mezclar lotes/productores/fechas distintas',
          ],
        },
        {
          paso: 3,
          titulo: 'Recepción en Empacadora o Centro de Acopio',
          estado: 'completado',
          detalles: [
            'Asignación de código de trazabilidad único',
            'Control de calidad: lavado, desinfección, selección',
            'Vínculo entre productor, exportador y cliente final',
          ],
        },
        {
          paso: 4,
          titulo: 'Empaque, Etiquetado y Paletizado',
          estado: 'pendiente',
          detalles: [
            'Etiquetado de cajas: lote, código de barras, geolocalización',
            'Paletizado con madera certificada NIMF-15',
            'Condiciones de embalaje para evitar daños en el transporte',
          ],
        },
        {
          paso: 5,
          titulo: 'Transporte, Logística y Certificación Fitosanitaria',
          estado: 'bloqueado',
          detalles: [
            'Monitoreo de cadena de frío y humedad',
            'Emisión de Certificado Fitosanitario por Agrocalidad',
            'Validación digital de la trazabilidad antes de exportar',
          ],
        },
      ],
      nota: `El sistema de trazabilidad del plátano barraganete en Ecuador sigue la normativa de Agrocalidad y BPA, asegurando el rastreo completo desde la finca hasta el destino final. Cada lote recibe un código único y la información se mantiene íntegra en toda la cadena de custodia.`,
    };
    import('../assets/ui/renderer_trazabilidad.js').then((mod) => {
      (mod.UIRenderer || window.UIRenderer).dibujarTrazabilidad(
        'trazabilidad-platano-content',
        data
      );
    });
  },
};

export default MelantiaTrazabilidadPlatano;
