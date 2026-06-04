// Panel avanzado de Oportunidades Públicas
export function mostrarPanel(contenedorId = 'vista-activa') {
  const cont =
    document.getElementById(contenedorId) ||
    document.getElementById('contenedor-principal') ||
    document.body;
  if (!cont) return;
  cont.innerHTML = `
    <h2>Oportunidades Públicas</h2>
    <input id="input-buscar-oportunidad" placeholder="Buscar licitación o palabra clave..." style="width:70%;margin-bottom:8px;">
    <button id="btn-buscar-oportunidad" class="btn-melantia">Buscar</button>
    <div id="panel-oportunidades"></div>
  `;
  let oportunidades = JSON.parse(
    localStorage.getItem('oportunidades_publicas') || '[]'
  );
  const panelOportunidades = document.getElementById('panel-oportunidades');
  document.getElementById('btn-buscar-oportunidad').onclick = () => {
    const q = document
      .getElementById('input-buscar-oportunidad')
      .value.toLowerCase();
    const filtradas = oportunidades.filter(
      (o) =>
        o.titulo.toLowerCase().includes(q) ||
        o.descripcion.toLowerCase().includes(q)
    );
    renderOportunidades(filtradas);
  };
  function renderOportunidades(lista) {
    if (!lista.length) {
      panelOportunidades.innerHTML = '<p>No hay oportunidades encontradas.</p>';
      return;
    }
    panelOportunidades.innerHTML = '';
    lista.forEach((o, i) => {
      panelOportunidades.innerHTML += `<div><b>${o.titulo}</b><br>${o.descripcion}<br><button onclick="agregarFavorito(${i})">Favorito</button></div><hr>`;
    });
  }
  window.agregarFavorito = (i) => {
    alert('Agregado a favoritos: ' + oportunidades[i].titulo);
  };
  // Mostrar todas al inicio
  renderOportunidades(oportunidades);
}
// Oportunidades Públicas — MELANTIA
// Consulta de licitaciones y compras estatales (OCDS)

export function mostrarOportunidadesPublicas(contenedorId = 'app-menu') {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  cont.innerHTML = '<h2>Oportunidades Públicas y Licitaciones</h2>';
  fetch('http://localhost:5000/ocds')
    .then((r) => r.json())
    .then((datos) => {
      if (!Array.isArray(datos) || datos.length === 0) {
        cont.innerHTML += '<p>No hay datos disponibles.</p>';
        return;
      }
      cont.innerHTML +=
        '<table class="tabla-ocds"><thead><tr><th>Año</th><th>Producto</th><th>Proveedor</th><th>Monto</th><th>Fecha</th></tr></thead><tbody>' +
        datos
          .map(
            (d) =>
              `<tr><td>${d.anio}</td><td>${d.producto}</td><td>${d.proveedor}</td><td>${d.monto}</td><td>${d.fecha}</td></tr>`
          )
          .join('') +
        '</tbody></table>';
    })
    .catch(() => {
      cont.innerHTML +=
        '<p>Error al cargar datos OCDS. Asegúrate de que el backend esté activo.</p>';
    });
}

// Puedes llamar mostrarOportunidadesPublicas() desde el panel de Negocios Rurales o desde el menú principal.
