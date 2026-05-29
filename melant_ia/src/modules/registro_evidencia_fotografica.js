// Registro de Evidencia Fotográfica — MELANTIA
// Panel para registrar y visualizar evidencias fotográficas

export function mostrarPanel(contenedorId = 'app-menu') {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  cont.innerHTML = `
    <h2>Registro de Evidencia Fotográfica</h2>
    <input type='file' id='input-foto' accept='image/*' capture='environment'><br>
    <button id='btn-guardar-foto' class='btn-melantia'>Guardar Foto</button>
    <div id='msg-foto'></div>
    <button id='btn-ver-fotos' class='btn-melantia'>Ver Evidencias</button>
    <div id='panel-fotos'></div>
  `;
  let fotoData = null;
  document.getElementById('input-foto').onchange = function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (evt) {
      fotoData = evt.target.result;
    };
    reader.readAsDataURL(file);
  };
  document.getElementById('btn-guardar-foto').onclick = function () {
    if (!fotoData) {
      document.getElementById('msg-foto').innerText =
        'Selecciona una foto primero.';
      return;
    }
    let evidencias = JSON.parse(
      localStorage.getItem('evidencias_fotos') || '[]'
    );
    evidencias.push({ foto: fotoData, fecha: new Date().toLocaleString() });
    localStorage.setItem('evidencias_fotos', JSON.stringify(evidencias));
    document.getElementById('msg-foto').innerText = 'Foto guardada.';
    fotoData = null;
    document.getElementById('input-foto').value = '';
  };
  document.getElementById('btn-ver-fotos').onclick = function () {
    const evidencias = JSON.parse(
      localStorage.getItem('evidencias_fotos') || '[]'
    );
    const panel = document.getElementById('panel-fotos');
    if (!evidencias.length) {
      panel.innerHTML = '<p>No hay evidencias registradas.</p>';
      return;
    }
    panel.innerHTML =
      '<h3>Evidencias Fotográficas</h3>' +
      evidencias
        .map(
          (ev) =>
            `<div class='card-foto'><img src='${ev.foto}' style='max-width:200px;'><br><span>${ev.fecha}</span></div>`
        )
        .join('<hr>');
  };
}
