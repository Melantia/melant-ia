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
