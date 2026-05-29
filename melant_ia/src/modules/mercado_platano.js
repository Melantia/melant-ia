// Panel avanzado de Mercado de Plátano
export function mostrarPanel(contenedorId = 'app-menu') {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  cont.innerHTML = `
    <h2>Mercado de Plátano</h2>
    <button id="btn-publicar-oferta-platano" class="btn-melantia">Publicar Oferta</button>
    <input id="input-buscar-oferta-platano" placeholder="Buscar oferta o palabra clave..." style="width:60%;margin-bottom:8px;">
    <button id="btn-buscar-oferta-platano" class="btn-melantia">Buscar</button>
    <div id="panel-ofertas-platano"></div>
  `;
  let ofertas = JSON.parse(
    localStorage.getItem('ofertas_mercado_platano') || '[]'
  );
  const panelOfertas = document.getElementById('panel-ofertas-platano');
  document.getElementById('btn-publicar-oferta-platano').onclick = () => {
    panelOfertas.innerHTML = `
      <h3>Publicar nueva oferta de plátano</h3>
      <form id="form-publicar-oferta-platano">
        <input type="text" name="productor" placeholder="Nombre del productor" required><br>
        <input type="number" name="precio" placeholder="Precio por caja" required><br>
        <input type="number" name="cantidad" placeholder="Cantidad de cajas" required><br>
        <textarea name="descripcion" placeholder="Descripción" required></textarea><br>
        <button type="submit">Publicar</button>
      </form>
    `;
    document.getElementById('form-publicar-oferta-platano').onsubmit = (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target).entries());
      data.fecha = new Date().toISOString();
      ofertas.push(data);
      localStorage.setItem('ofertas_mercado_platano', JSON.stringify(ofertas));
      panelOfertas.innerHTML = `<b>Oferta publicada:</b> ${data.productor} — $${data.precio} (${data.cantidad} cajas)<br>${data.descripcion}`;
    };
  };
  document.getElementById('btn-buscar-oferta-platano').onclick = () => {
    const q = document
      .getElementById('input-buscar-oferta-platano')
      .value.toLowerCase();
    const filtradas = ofertas.filter(
      (o) =>
        o.productor.toLowerCase().includes(q) ||
        o.descripcion.toLowerCase().includes(q)
    );
    renderOfertas(filtradas);
  };
  function renderOfertas(lista) {
    if (!lista.length) {
      panelOfertas.innerHTML = '<p>No hay ofertas encontradas.</p>';
      return;
    }
    panelOfertas.innerHTML = '';
    lista.forEach((o) => {
      panelOfertas.innerHTML += `<div><b>${o.productor}</b> — $${o.precio} (${o.cantidad} cajas)<br>${o.descripcion}<br><i>${o.fecha}</i></div><hr>`;
    });
  }
  // Mostrar todas al inicio
  renderOfertas(ofertas);
}
// mercado_platano.js — Submódulo MELANTIA
export function mostrarPanel() {
  const contenedor =
    document.getElementById('contenedor-principal') || document.body;
  contenedor.innerHTML = `
    <div class="panel-especifico" style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
      <h2 style="color:#276749;">Mercado de Plátano</h2>
      <p style="color:#444;font-size:1.1em;">Aquí puedes consultar precios, publicar ofertas y buscar compradores de plátano.</p>
      <!-- Agrega aquí la lógica y UI específica -->
      <button onclick="window.cargarDatosModulo(null, 'Negocios Rurales')" style="margin-top:30px;padding:10px 24px;background:#276749;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:1em;">← Volver</button>
    </div>
  `;
}
