// Carpeta Documentos — MELANTIA
// Panel para registrar y visualizar documentos adjuntos

export function mostrarPanel(contenedorId = 'app-menu') {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  cont.innerHTML = `
    <h2>Carpeta Documentos</h2>
    <input type='file' id='input-doc' multiple><br>
    <button id='btn-guardar-doc' class='btn-melantia'>Guardar Documentos</button>
    <div id='msg-doc'></div>
    <button id='btn-ver-docs' class='btn-melantia'>Ver Documentos</button>
    <div id='panel-docs'></div>
  `;
  let docsData = [];
  document.getElementById('input-doc').onchange = function (e) {
    docsData = [];
    Array.from(e.target.files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = function (evt) {
        docsData.push({ nombre: file.name, data: evt.target.result });
      };
      reader.readAsDataURL(file);
    });
  };
  document.getElementById('btn-guardar-doc').onclick = function () {
    if (!docsData.length) {
      document.getElementById('msg-doc').innerText =
        'Selecciona documentos primero.';
      return;
    }
    let docs = JSON.parse(localStorage.getItem('carpeta_documentos') || '[]');
    docsData.forEach((d) =>
      docs.push({ ...d, fecha: new Date().toLocaleString() })
    );
    localStorage.setItem('carpeta_documentos', JSON.stringify(docs));
    document.getElementById('msg-doc').innerText = 'Documentos guardados.';
    docsData = [];
    document.getElementById('input-doc').value = '';
  };
  document.getElementById('btn-ver-docs').onclick = function () {
    const docs = JSON.parse(localStorage.getItem('carpeta_documentos') || '[]');
    const panel = document.getElementById('panel-docs');
    if (!docs.length) {
      panel.innerHTML = '<p>No hay documentos registrados.</p>';
      return;
    }
    panel.innerHTML =
      '<h3>Documentos Adjuntos</h3>' +
      docs
        .map(
          (d) =>
            `<div class='card-doc'><a href='${d.data}' download='${d.nombre}'>${d.nombre}</a> <span>(${d.fecha})</span></div>`
        )
        .join('<hr>');
  };
}
