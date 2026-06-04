// Panel avanzado de Ventas de Gestión Productiva
export function mostrarPanel(contenedorId = 'vista-activa') {
  const cont =
    document.getElementById(contenedorId) ||
    document.getElementById('contenedor-principal') ||
    document.body;
  if (!cont) return;
  cont.innerHTML = `
    <div style="max-width:760px;margin:30px auto;background:#fff;border-radius:14px;box-shadow:0 4px 20px rgba(0,0,0,0.1);padding:22px;">
      <h2>Ventas de Gestión Productiva</h2>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
        <button id="btn-registrar-venta" class="btn-melantia">Registrar Venta</button>
        <button id="btn-ver-historial-ventas" class="btn-melantia">Ver Historial</button>
      </div>
      <div id="panel-ventas"></div>
      <div id="panel-historial-ventas" style="display:none;"></div>
      <button id="btn-volver-ventas" style="margin-top:20px;background:#276749;color:#fff;padding:10px 20px;border:none;border-radius:8px;cursor:pointer;">Volver al menú principal</button>
    </div>
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
  document.getElementById('btn-volver-ventas').onclick = () => {
    if (typeof window.volverAlMenuPrincipal === 'function') {
      window.volverAlMenuPrincipal();
    }
  };
}

export default { mostrarPanel };
