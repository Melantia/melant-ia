// Módulo: Trazabilidad de Cultivos Especiales
// Panel integrado para trazabilidad de Cacao, Café, Aguacate, Guanábana, Plátano Barraganete y Piña

const MelantiaTrazabilidadCultivosEspeciales = {
  mostrarPanel: function () {
    const panel = document.getElementById('panel-novedades') || document.body;
    panel.innerHTML = `
      <div class="panel-trazabilidad" style="max-width:700px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
        <h2 style='color:#1e88e5;margin-bottom:8px;'>Trazabilidad de Cultivos Especiales</h2>
        <div style="display:flex;flex-wrap:wrap;gap:16px;margin-bottom:24px;">
          <button class="btn-melantia" onclick="MelantiaTrazabilidadCultivosEspeciales.abrir('cacao')">
            <svg class="icon" style="width:24px;height:24px;vertical-align:middle;margin-right:6px;fill:currentColor;"><use xlink:href="assets/sprite.svg#icon-cacao"></use></svg>Cacao
          </button>
          <button class="btn-melantia" onclick="MelantiaTrazabilidadCultivosEspeciales.abrir('cafe')">
            <svg class="icon" style="width:24px;height:24px;vertical-align:middle;margin-right:6px;fill:currentColor;"><use xlink:href="assets/sprite.svg#icon-cafe"></use></svg>Café
          </button>
          <button class="btn-melantia" onclick="MelantiaTrazabilidadCultivosEspeciales.abrir('aguacate')">
            <svg class="icon" style="width:24px;height:24px;vertical-align:middle;margin-right:6px;fill:currentColor;"><use xlink:href="assets/sprite.svg#icon-aguacate"></use></svg>Aguacate
          </button>
          <button class="btn-melantia" onclick="MelantiaTrazabilidadCultivosEspeciales.abrir('guanabana')">
            <svg class="icon" style="width:24px;height:24px;vertical-align:middle;margin-right:6px;fill:currentColor;"><use xlink:href="assets/sprite.svg#icon-guanabana"></use></svg>Guanábana
          </button>
          <button class="btn-melantia" onclick="MelantiaTrazabilidadCultivosEspeciales.abrir('platano')">
            <svg class="icon" style="width:24px;height:24px;vertical-align:middle;margin-right:6px;fill:currentColor;"><use xlink:href="assets/sprite.svg#icon-platano"></use></svg>Plátano Barraganete
          </button>
          <button class="btn-melantia" onclick="MelantiaTrazabilidadCultivosEspeciales.abrir('pina')">
            <svg class="icon" style="width:24px;height:24px;vertical-align:middle;margin-right:6px;fill:currentColor;"><use xlink:href="assets/sprite.svg#icon-pina"></use></svg>Piña
          </button>
        </div>
        <div id="cultivo-especial-content"></div>
        <button onclick="window.volverAlMenuPrincipal()" style="margin-top:24px;background:#1e88e5;color:#fff;padding:10px 28px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">Volver al menú principal</button>
      </div>
    `;
  },
  abrir: function (cultivo) {
    const map = {
      cacao: () =>
        import('./trazabilidad_cacao.js').then((mod) =>
          (mod.default || window.MelantiaTrazabilidadCacao).mostrarPanel()
        ),
      cafe: () =>
        import('./trazabilidad_cafe.js').then((mod) =>
          (mod.default || window.MelantiaTrazabilidadCafe).mostrarPanel()
        ),
      aguacate: () =>
        import('./trazabilidad_aguacate.js').then((mod) =>
          (mod.default || window.MelantiaTrazabilidadAguacate).mostrarPanel()
        ),
      guanabana: () =>
        import('./trazabilidad_guanabana.js').then((mod) =>
          (mod.default || window.MelantiaTrazabilidadGuanabana).mostrarPanel()
        ),
      platano: () =>
        import('./trazabilidad_platano.js').then((mod) =>
          (mod.default || window.MelantiaTrazabilidadPlatano).mostrarPanel()
        ),
      pina: () => MelantiaTrazabilidadCultivosEspeciales.mostrarPanelPina(),
    };
    if (map[cultivo]) map[cultivo]();
  },
  mostrarPanelPina: function () {
    // Demo de fases para piña (puedes adaptar según normativa local)
    const data = {
      titulo: 'Trazabilidad de la Piña (Ecuador)',
      fases: [
        {
          paso: 1,
          titulo: 'Registro y Certificación de la Finca',
          estado: 'completado',
          detalles: [
            'Registro en Agrocalidad y certificación BPA',
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
      nota: `El sistema de trazabilidad de la piña en Ecuador sigue la normativa de Agrocalidad y BPA, asegurando el rastreo completo desde la finca hasta el destino final. Cada lote recibe un código único y la información se mantiene íntegra en toda la cadena de custodia.`,
    };
    import('../assets/ui/renderer_trazabilidad.js').then((mod) => {
      (mod.UIRenderer || window.UIRenderer).dibujarTrazabilidad(
        'cultivo-especial-content',
        data
      );
    });
  },
};

export default MelantiaTrazabilidadCultivosEspeciales;
