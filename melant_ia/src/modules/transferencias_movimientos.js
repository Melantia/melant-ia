// Transferencias y Movimientos — MELANTIA
// Panel para registrar y consultar transferencias y movimientos

export function mostrarPanel(contenedorId = 'app-menu') {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  cont.innerHTML = `
    <h2>Transferencias y Movimientos</h2>
    <form id='form-transferencia'>
      <input name='origen' placeholder='Cuenta origen' required><br>
      <input name='destino' placeholder='Cuenta destino' required><br>
      <input name='monto' placeholder='Monto' type='number' min='1' required><br>
      <input name='fecha' placeholder='Fecha' type='date' required><br>
      <button type='submit'>Registrar</button>
    </form>
    <div id='msg-transferencia'></div>
    <button id='btn-ver-transferencias' class='btn-melantia'>Ver Transferencias</button>
    <div id='panel-transferencias'></div>
  `;
  document.getElementById('form-transferencia').onsubmit = function (e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    let transferencias = JSON.parse(
      localStorage.getItem('transferencias') || '[]'
    );
    transferencias.push(data);
    localStorage.setItem('transferencias', JSON.stringify(transferencias));
    document.getElementById('msg-transferencia').innerText =
      'Transferencia registrada.';
  };
  document.getElementById('btn-ver-transferencias').onclick = function () {
    const transferencias = JSON.parse(
      localStorage.getItem('transferencias') || '[]'
    );
    const panel = document.getElementById('panel-transferencias');
    if (!transferencias.length) {
      panel.innerHTML = '<p>No hay transferencias registradas.</p>';
      return;
    }
    panel.innerHTML =
      '<h3>Transferencias</h3>' +
      transferencias
        .map(
          (t) =>
            `<div class='card-transferencia'><b>${t.origen}</b> → <b>${t.destino}</b> — $${t.monto} el ${t.fecha}</div>`
        )
        .join('<hr>');
  };
}
