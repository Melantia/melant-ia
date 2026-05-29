// Panel avanzado de Monte su TIENDA VIRTUAL
export function mostrarPanel(contenedorId = 'app-menu') {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  cont.innerHTML = `
    <h2>Monte su TIENDA VIRTUAL</h2>
    <button id="btn-crear-tienda" class="btn-melantia">Crear Tienda</button>
    <button id="btn-ver-tiendas" class="btn-melantia">Ver Mis Tiendas</button>
    <div id="panel-tienda-virtual"></div>
    <div id="panel-lista-tiendas" style="display:none;"></div>
  `;
  let tiendas = JSON.parse(localStorage.getItem('tiendas_virtuales') || '[]');
  const panelTienda = document.getElementById('panel-tienda-virtual');
  document.getElementById('btn-crear-tienda').onclick = () => {
    panelTienda.innerHTML = `
      <h3>Crear nueva tienda</h3>
      <form id="form-crear-tienda">
        <input type="text" name="nombre" placeholder="Nombre de la tienda" required><br>
        <input type="text" name="link" placeholder="Link personalizado" required><br>
        <textarea name="descripcion" placeholder="Descripción" required></textarea><br>
        <button type="submit">Crear</button>
      </form>
    `;
    document.getElementById('form-crear-tienda').onsubmit = (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target).entries());
      data.fecha = new Date().toISOString();
      tiendas.push(data);
      localStorage.setItem('tiendas_virtuales', JSON.stringify(tiendas));
      panelTienda.innerHTML = `<b>Tienda creada:</b> ${data.nombre} — ${data.link}<br>${data.descripcion}`;
    };
  };
  document.getElementById('btn-ver-tiendas').onclick = () => {
    const panelLista = document.getElementById('panel-lista-tiendas');
    panelLista.style.display = 'block';
    if (tiendas.length === 0) {
      panelLista.innerHTML = '<p>No tienes tiendas creadas.</p>';
      return;
    }
    panelLista.innerHTML = '<h3>Mis Tiendas Virtuales</h3>';
    tiendas.forEach((t) => {
      panelLista.innerHTML += `<div><b>${t.nombre}</b> — <a href="${t.link}" target="_blank">${t.link}</a><br>${t.descripcion}<br><i>${t.fecha}</i></div><hr>`;
    });
  };
}
// monte_tienda_virtual.js — Submódulo MELANTIA
export function mostrarPanel() {
  const contenedor =
    document.getElementById('contenedor-principal') || document.body;
  contenedor.innerHTML = `
    <div class="panel-especifico" style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
      <h2 style="color:#276749;">Monte su TIENDA VIRTUAL</h2>
      <p style="color:#444;font-size:1.1em;">Aquí puedes crear tu propia tienda virtual, gestionar productos y ventas online.</p>
      <!-- Agrega aquí la lógica y UI específica -->
      <button onclick="window.cargarDatosModulo(null, 'Negocios Rurales')" style="margin-top:30px;padding:10px 24px;background:#276749;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:1em;">← Volver</button>
    </div>
  `;
}
