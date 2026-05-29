// Ficha Médica / Historia Clínica — MELANTIA
// Panel para registro y consulta de datos médicos personales

export function mostrarPanel(contenedorId = 'app-menu') {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  cont.innerHTML = `
    <h2>Ficha Médica / Historia Clínica</h2>
    <button id="btn-registrar-ficha" class="btn-melantia">Registrar Ficha</button>
    <button id="btn-ver-fichas" class="btn-melantia">Ver Fichas</button>
    <div id="panel-ficha-medica"></div>
  `;
  document.getElementById('btn-registrar-ficha').onclick = () => renderForm();
  document.getElementById('btn-ver-fichas').onclick = () => renderFichas();

  function renderForm() {
    const panel = document.getElementById('panel-ficha-medica');
    panel.innerHTML = `
      <h3>Registrar Ficha Médica</h3>
      <form id='form-ficha-medica'>
        <input name='nombre' placeholder='Nombre' required><br>
        <input name='edad' placeholder='Edad' type='number' min='0'><br>
        <input name='alergias' placeholder='Alergias'><br>
        <textarea name='antecedentes' placeholder='Antecedentes médicos'></textarea><br>
        <button type='submit'>Guardar</button>
      </form>
      <div id='msg-ficha-medica'></div>
    `;
    document.getElementById('form-ficha-medica').onsubmit = function (e) {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target).entries());
      let fichas = JSON.parse(localStorage.getItem('fichas_medicas') || '[]');
      fichas.push(data);
      localStorage.setItem('fichas_medicas', JSON.stringify(fichas));
      document.getElementById('msg-ficha-medica').innerText =
        'Ficha registrada.';
      renderFichas();
    };
  }

  function renderFichas() {
    const fichas = JSON.parse(localStorage.getItem('fichas_medicas') || '[]');
    const panel = document.getElementById('panel-ficha-medica');
    if (!fichas.length) {
      panel.innerHTML = '<p>No hay fichas registradas.</p>';
      return;
    }
    panel.innerHTML =
      '<h3>Fichas Médicas</h3>' +
      fichas
        .map(
          (f) =>
            `<div class='card-ficha'><b>${f.nombre}</b> — Edad: ${f.edad || 'N/A'}<br>Alergias: ${f.alergias || 'N/A'}<br>Antecedentes: ${f.antecedentes}</div>`
        )
        .join('<hr>');
  }
}
