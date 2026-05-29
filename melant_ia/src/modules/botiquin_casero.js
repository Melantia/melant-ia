// Botiquín Casero Inteligente — MELANTIA
// Panel para registro y consulta de medicamentos y elementos del botiquín

export function mostrarPanel(contenedorId = 'app-menu') {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  cont.innerHTML = `
    <h2>Botiquín Casero Inteligente</h2>
    <button id="btn-registrar-medicamento" class="btn-melantia">Registrar Medicamento</button>
    <button id="btn-ver-botiquin" class="btn-melantia">Ver Botiquín</button>
    <div id="panel-botiquin"></div>
  `;
  document.getElementById('btn-registrar-medicamento').onclick = () =>
    renderForm();
  document.getElementById('btn-ver-botiquin').onclick = () => renderBotiquin();

  function renderForm() {
    const panel = document.getElementById('panel-botiquin');
    panel.innerHTML = `
      <h3>Registrar Medicamento</h3>
      <form id='form-medicamento'>
        <input name='nombre' placeholder='Nombre del medicamento' required><br>
        <input name='cantidad' placeholder='Cantidad' required type='number' min='1'><br>
        <input name='vencimiento' placeholder='Fecha de vencimiento' type='date'><br>
        <button type='submit'>Guardar</button>
      </form>
      <div id='msg-medicamento'></div>
    `;
    document.getElementById('form-medicamento').onsubmit = function (e) {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target).entries());
      let botiquin = JSON.parse(
        localStorage.getItem('botiquin_medicamentos') || '[]'
      );
      botiquin.push(data);
      localStorage.setItem('botiquin_medicamentos', JSON.stringify(botiquin));
      document.getElementById('msg-medicamento').innerText =
        'Medicamento registrado.';
      renderBotiquin();
    };
  }

  function renderBotiquin() {
    const botiquin = JSON.parse(
      localStorage.getItem('botiquin_medicamentos') || '[]'
    );
    const panel = document.getElementById('panel-botiquin');
    if (!botiquin.length) {
      panel.innerHTML = '<p>No hay medicamentos registrados.</p>';
      return;
    }
    panel.innerHTML =
      '<h3>Botiquín</h3>' +
      botiquin
        .map(
          (m) =>
            `<div class='card-medicamento'><b>${m.nombre}</b> — ${m.cantidad} und. Vence: ${m.vencimiento || 'N/A'}</div>`
        )
        .join('<hr>');
  }
}
