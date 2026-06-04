export function mostrarPanel() {
  return MelantiaGestionEmpresarial.mostrarPanel();
}
// Módulo: Gestión Empresarial
// Lógica y UI para la gestión empresarial en MELANTIA

const MelantiaGestionEmpresarial = {
  async mostrarPanel() {
    const panel = document.getElementById('panel-novedades') || document.body;
    panel.innerHTML = `<div class="panel-empresarial" style="max-width:900px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
      <h2 style='color:#276749;margin-bottom:8px;'>Gestión Empresarial</h2>
      <div id="empresarial-indicadores" style="margin-bottom:24px;"></div>
      <div id="empresarial-graficos" style="margin-bottom:24px;"></div>
      <div id="empresarial-tabla"></div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:24px;">
        <button id="btn-tienda-melantia" style="background:#1e88e5;color:#fff;padding:10px 24px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">Administrar Tienda Virtual MELANTIA</button>
        <button id="btn-montar-tienda" style="background:#43a047;color:#fff;padding:10px 24px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">Crear/Promocionar mi Tienda Virtual</button>
        <button id="btn-exportar-pdf" style="background:#276749;color:#fff;padding:10px 24px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">Exportar PDF</button>
        <button id="btn-exportar-excel" style="background:#fbc02d;color:#222;padding:10px 24px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">Descargar Excel</button>
        <button id="btn-compartir-wa" style="background:#25d366;color:#fff;padding:10px 24px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">Compartir WhatsApp</button>
        <button onclick="window.volverAlMenuPrincipal()" style="background:#276749;color:#fff;padding:10px 24px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">Volver al menú principal</button>
      </div>
      <div id="info-tienda-melantia" style="margin-top:18px;text-align:center;color:#1976d2;font-size:1.1em;"></div>
      <div style="margin-top:18px;text-align:center;color:#555;font-size:1em;max-width:700px;margin-left:auto;margin-right:auto;">
        <b>¿Cómo funciona?</b><br>
        <ul style='text-align:left;max-width:600px;margin:12px auto 0 auto;'>
          <li><b>Tienda Virtual MELANTIA</b> es la administración general de la app: catálogo global, pagos y validación de cobertura.</li>
          <li><b>Monte su Tienda</b> permite a cada usuario crear/promocionar su propia tienda, obtener un link único y vender sus productos directamente.</li>
          <li><b>Gestión Empresarial</b> puede usar la tienda del usuario para registrar ventas virtuales y consultar indicadores en tiempo real.</li>
        </ul>
        <span style='color:#1976d2;'>Desde aquí puedes administrar la tienda global o crear/promocionar la tuya propia para generar ventas directas y compartir tu link personalizado.</span>
      </div>
    </div>`;
    await this.renderizarIndicadores();
    await this.renderizarTabla();
    // Eventos de exportación y compartir
    document.getElementById('btn-exportar-pdf').onclick = () =>
      this.exportarPDF();
    document.getElementById('btn-exportar-excel').onclick = () =>
      this.exportarExcel();
    document.getElementById('btn-compartir-wa').onclick = () =>
      this.compartirWhatsApp();
    // Botón Tienda MELANTIA
    document.getElementById('btn-tienda-melantia').onclick = () => {
      // Redirigir a la administración general de la tienda virtual MELANTIA
      window.location.href = '#/negocios_rurales/tienda_melantia';
    };
    document.getElementById('btn-montar-tienda').onclick = () => {
      const info = document.getElementById('info-tienda-melantia');
      info.innerHTML = `
        <div style='background:#e3f2fd;padding:18px;border-radius:12px;max-width:600px;margin:18px auto;'>
          <strong>¡Crea y promociona tu propia tienda virtual!</strong><br>
          <span style='color:#1976d2;'>Obtén tu link personalizado, comparte tu catálogo y recibe pedidos directos.<br>
          <b>Ve a Negocios Rurales &gt; Monte su Tienda</b> para configurar tu tienda y empezar a vender.<br>
          <br>¿Ya tienes tu tienda? ¡Comparte tu link y genera tus propias ventas!</span>
        </div>
      `;
    };
  },

  async renderizarIndicadores() {
    // Conexión a datos reales de ventas y movimientos
    const cont = document.getElementById('empresarial-indicadores');
    let ventas = [];
    let movimientos = [];
    try {
      const modNegocios = await import('./modulo_negocios.js');
      ventas = modNegocios.default?.obtenerVentas
        ? modNegocios.default.obtenerVentas()
        : window.AngelNegocios?.obtenerVentas?.() || [];
      movimientos = window.AngelFinanzas?.obtenerMovimientos?.() || [];
    } catch (e) {
      // fallback
      ventas = window.AngelNegocios?.obtenerVentas?.() || [];
      movimientos = window.AngelFinanzas?.obtenerMovimientos?.() || [];
    }
    // Cálculos
    const produccion = ventas.reduce(
      (acc, v) => acc + (parseFloat(v.cantidad) || 0),
      0
    );
    const ingresos = ventas.reduce(
      (acc, v) => acc + (parseFloat(v.monto) || 0),
      0
    );
    const costos = movimientos
      .filter((m) => m.tipo_movimiento === 'Egreso')
      .reduce((acc, m) => acc + (parseFloat(m.monto) || 0), 0);
    const rentabilidad = ingresos - costos;
    // Alertas simuladas: auditoría pendiente si hay ventas pendientes
    const alertas = ventas.filter(
      (v) => (v.estado || '').toUpperCase() !== 'ENTREGADA'
    ).length;
    // Consejo IA simple
    let consejo = '¡Sigue así!';
    if (rentabilidad < 0)
      consejo = 'Atención: tus costos superan los ingresos este mes.';
    else if (rentabilidad > 0 && costos > 0)
      consejo = '¡Rentabilidad positiva! Considera reinvertir en mejoras.';
    cont.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:18px;">
        <div style="background:#e8f5e9;padding:18px;border-radius:12px;text-align:center;">
          <div style="font-size:2em;font-weight:bold;">${produccion.toLocaleString()} kg</div>
          <div style="color:#276749;">Producción mensual</div>
        </div>
        <div style="background:#fffde7;padding:18px;border-radius:12px;text-align:center;">
          <div style="font-size:2em;font-weight:bold;">$${costos.toLocaleString()}</div>
          <div style="color:#fbc02d;">Costos operativos</div>
        </div>
        <div style="background:#e3f2fd;padding:18px;border-radius:12px;text-align:center;">
          <div style="font-size:2em;font-weight:bold;">$${rentabilidad.toLocaleString()}</div>
          <div style="color:#1976d2;">Rentabilidad</div>
        </div>
        <div style="background:#ffebee;padding:18px;border-radius:12px;text-align:center;">
          <div style="font-size:2em;font-weight:bold;">${alertas}</div>
          <div style="color:#e53935;">Alertas activas</div>
        </div>
      </div>
      <div style="margin-top:18px;text-align:center;font-size:1.1em;color:#388e3c;">
        Consejo IA: ${consejo}
        ${alertas > 0 ? `<br><span style=\"color:#e53935;\">Atención:</span> Hay ${alertas} venta(s) pendiente(s) de entrega.` : ''}
      </div>
    `;
  },

  async renderizarTabla() {
    // Cargar ventas reales
    const cont = document.getElementById('empresarial-tabla');
    let ventas = [];
    try {
      const modNegocios = await import('./modulo_negocios.js');
      ventas = modNegocios.default?.obtenerVentas
        ? modNegocios.default.obtenerVentas()
        : window.AngelNegocios?.obtenerVentas?.() || [];
    } catch (e) {
      ventas = window.AngelNegocios?.obtenerVentas?.() || [];
    }
    // Top productos y clientes
    const productos = {};
    const clientes = {};
    ventas.forEach((v) => {
      if (v.producto)
        productos[v.producto] =
          (productos[v.producto] || 0) + (parseFloat(v.cantidad) || 1);
      if (v.cliente) clientes[v.cliente] = (clientes[v.cliente] || 0) + 1;
    });
    const topProductos =
      Object.entries(productos)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([p]) => p)
        .join(', ') || '-';
    const topClientes =
      Object.entries(clientes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([c]) => c)
        .join(', ') || '-';
    cont.innerHTML = `
      <h3 style="color:#276749;margin-top:24px;">Movimientos y Ventas</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">
        <thead>
          <tr style="background:#f4f8f5;color:#276749;">
            <th>Fecha</th><th>Lote</th><th>Producto</th><th>Cantidad</th><th>Monto</th><th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${
            ventas.length === 0
              ? '<tr><td colspan="6" style="color:#888;text-align:center;">No hay ventas registradas.</td></tr>'
              : ventas
                  .map(
                    (v) => `
            <tr>
              <td>${v.fecha || '-'}</td>
              <td>${v.lote || '-'}</td>
              <td>${v.producto || '-'}</td>
              <td>${v.cantidad || '-'}</td>
              <td>$${v.monto ? parseFloat(v.monto).toLocaleString() : '-'}</td>
              <td>${v.estado || '-'}</td>
            </tr>`
                  )
                  .join('')
          }
        </tbody>
      </table>
      <div style="margin-bottom:18px;">
        <strong>Top productos:</strong> ${topProductos}<br>
        <strong>Clientes recurrentes:</strong> ${topClientes}
      </div>
    `;
  },

  exportarPDF() {
    window.print();
  },

  exportarExcel() {
    // Simulación: exporta la tabla como CSV
    const csv = [
      ['Fecha', 'Lote', 'Producto', 'Cantidad', 'Monto', 'Estado'],
      ['2026-05-01', 'San Pedro', 'Cacao', '500', '1200', 'ENTREGADA'],
      ['2026-05-03', 'La Esperanza', 'Café', '300', '900', 'PENDIENTE'],
      ['2026-05-10', 'San Pedro', 'Plátano', '400', '1000', 'ENTREGADA'],
    ]
      .map((row) => row.join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'reporte_empresarial_melantia.csv';
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
  },

  compartirWhatsApp() {
    const resumen =
      'Resumen empresarial MELANTIA:\nProducción: 1,200kg\nRentabilidad: $2,100\nCostos: $3,500\nTop productos: Cacao, Café, Plátano.';
    const whatsappURL = `https://wa.me/?text=${encodeURIComponent(resumen)}`;
    window.open(whatsappURL, '_blank', 'noopener');
  },
};

export default MelantiaGestionEmpresarial;
