// Panel avanzado de Ventas de Gestión Productiva
export function mostrarPanel(contenedorId = 'app-menu') {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  cont.innerHTML = `
    <h2>Ventas de Gestión Productiva</h2>
    <button id="btn-registrar-venta" class="btn-melantia">Registrar Venta</button>
    <button id="btn-ver-historial-ventas" class="btn-melantia">Ver Historial</button>
    <div id="panel-ventas"></div>
    <div id="panel-historial-ventas" style="display:none;"></div>
  `;
  let ventas = JSON.parse(
    localStorage.getItem('ventas_gestion_productiva') || '[]'
  );
  const panelVentas = document.getElementById('panel-ventas');
  document.getElementById('btn-registrar-venta').onclick = () => {
    panelVentas.innerHTML = `
      <h3>Registrar nueva venta</h3>
      <form id="form-registrar-venta">
        <input type="text" name="producto" placeholder="Producto" required><br>
        <input type="number" name="cantidad" placeholder="Cantidad" required><br>
        <input type="number" name="precio" placeholder="Precio unitario" required><br>
        <button type="submit">Registrar</button>
      </form>
    `;
    document.getElementById('form-registrar-venta').onsubmit = (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target).entries());
      data.fecha = new Date().toISOString();
      ventas.push(data);
      localStorage.setItem('ventas_gestion_productiva', JSON.stringify(ventas));
      panelVentas.innerHTML = `<b>Venta registrada:</b> ${data.producto} — ${data.cantidad} x $${data.precio}`;
    };
  };
  document.getElementById('btn-ver-historial-ventas').onclick = () => {
    const panelHistorial = document.getElementById('panel-historial-ventas');
    panelHistorial.style.display = 'block';
    if (ventas.length === 0) {
      panelHistorial.innerHTML = '<p>No hay ventas registradas.</p>';
      return;
    }
    let total = 0;
    panelHistorial.innerHTML = '<h3>Historial de Ventas</h3>';
    ventas.forEach((v) => {
      const subtotal = v.cantidad * v.precio;
      total += subtotal;
      panelHistorial.innerHTML += `<div><b>${v.producto}</b> — ${v.cantidad} x $${v.precio} = $${subtotal} <br><i>${v.fecha}</i></div><hr>`;
    });
    panelHistorial.innerHTML += `<b>Total vendido:</b> $${total}`;
  };
}
// ventas_gestion_productiva.js — Submódulo MELANTIA
// Aquí va la lógica y UI específica para Ventas de Gestión Productiva

export function mostrarPanel() {
  const contenedor =
    document.getElementById('contenedor-principal') || document.body;
  contenedor.innerHTML = `
    <div class="panel-especifico" style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
      <h2 style="color:#276749;">Ventas de Gestión Productiva</h2>
      <p style="color:#444;font-size:1.1em;">Aquí puedes registrar, consultar y analizar las ventas de tu gestión productiva.</p>
      <ul style="margin:24px 0 0 0;padding:0;list-style:none;">
        <li>• Registrar nueva venta</li>
        <li>• Ver historial de ventas</li>
        <li>• Analizar ingresos y tendencias</li>
      </ul>
      <button onclick="window.cargarDatosModulo(null, 'Negocios Rurales')" style="margin-top:30px;padding:10px 24px;background:#276749;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:1em;">← Volver a Negocios Rurales</button>
    </div>
  `;
}
