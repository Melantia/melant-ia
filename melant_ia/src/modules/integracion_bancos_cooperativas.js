// Integración con Bancos y Cooperativas — MELANTIA
// Panel para registrar y consultar integraciones bancarias

export function mostrarPanel(contenedorId = 'app-menu') {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  cont.innerHTML = `
    <h2>Integración con Bancos y Cooperativas</h2>
    <form id='form-integracion-banco'>
      <input name='banco' placeholder='Nombre del banco/cooperativa' required><br>
      <input name='cuenta' placeholder='Número de cuenta' required><br>
      <input name='titular' placeholder='Titular de la cuenta' required><br>
      <button type='submit'>Registrar Integración</button>
    </form>
    <div id='msg-integracion-banco'></div>
    <button id='btn-ver-integraciones' class='btn-melantia'>Ver Integraciones</button>
    <div id='panel-integraciones'></div>
  `;
  document.getElementById('form-integracion-banco').onsubmit = function (e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    let integraciones = JSON.parse(
      localStorage.getItem('integraciones_bancarias') || '[]'
    );
    integraciones.push(data);
    localStorage.setItem(
      'integraciones_bancarias',
      JSON.stringify(integraciones)
    );
    document.getElementById('msg-integracion-banco').innerText =
      'Integración registrada.';
  };
  document.getElementById('btn-ver-integraciones').onclick = function () {
    const integraciones = JSON.parse(
      localStorage.getItem('integraciones_bancarias') || '[]'
    );
    const panel = document.getElementById('panel-integraciones');
    if (!integraciones.length) {
      panel.innerHTML = '<p>No hay integraciones registradas.</p>';
      return;
    }
    panel.innerHTML =
      '<h3>Integraciones Bancarias</h3>' +
      integraciones
        .map(
          (i) =>
            `<div class='card-integracion'><b>${i.banco}</b> — Cuenta: ${i.cuenta} (Titular: ${i.titular})</div>`
        )
        .join('<hr>');
  };
}
