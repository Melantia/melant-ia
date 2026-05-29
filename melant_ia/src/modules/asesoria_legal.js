// Asesoría Legal — MELANTIA
// Panel para registro de consultas legales y respuestas

export function mostrarPanel(contenedorId = 'app-menu') {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  cont.innerHTML = `
    <h2>Asesoría Legal</h2>
    <button id="btn-registrar-consulta" class="btn-melantia">Registrar Consulta</button>
    <button id="btn-ver-consultas" class="btn-melantia">Ver Consultas</button>
    <div id="panel-asesoria-legal"></div>
  `;
  document.getElementById('btn-registrar-consulta').onclick = () =>
    renderForm();
  document.getElementById('btn-ver-consultas').onclick = () =>
    renderConsultas();

  function renderForm() {
    const panel = document.getElementById('panel-asesoria-legal');
    panel.innerHTML = `
      <h3>Registrar Consulta Legal</h3>
      <form id='form-consulta'>
        <input name='nombre' placeholder='Nombre' required><br>
        <input name='tema' placeholder='Tema legal' required><br>
        <textarea name='pregunta' placeholder='Pregunta o caso'></textarea><br>
        <button type='submit'>Guardar</button>
      </form>
      <div id='msg-consulta'></div>
    `;
    document.getElementById('form-consulta').onsubmit = function (e) {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target).entries());
      let consultas = JSON.parse(
        localStorage.getItem('asesoria_legal_consultas') || '[]'
      );
      consultas.push(data);
      localStorage.setItem(
        'asesoria_legal_consultas',
        JSON.stringify(consultas)
      );
      document.getElementById('msg-consulta').innerText =
        'Consulta registrada.';
      renderConsultas();
    };
  }

  function renderConsultas() {
    const consultas = JSON.parse(
      localStorage.getItem('asesoria_legal_consultas') || '[]'
    );
    const panel = document.getElementById('panel-asesoria-legal');
    if (!consultas.length) {
      panel.innerHTML = '<p>No hay consultas registradas.</p>';
      return;
    }
    panel.innerHTML =
      '<h3>Consultas Legales</h3>' +
      consultas
        .map(
          (c) =>
            `<div class='card-consulta'><b>${c.nombre}</b> — ${c.tema}<br>${c.pregunta}</div>`
        )
        .join('<hr>');
  }
}
