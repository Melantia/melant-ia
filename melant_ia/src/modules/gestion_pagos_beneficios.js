// Gestión de Pagos y Beneficios — MELANTIA
// Panel para registrar pagos y beneficios recibidos

export function mostrarPanel(contenedorId = 'app-menu') {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  cont.innerHTML = `
    <h2>Gestión de Pagos y Beneficios</h2>
    <form id='form-pago-beneficio'>
      <input name='concepto' placeholder='Concepto o motivo' required><br>
      <input name='monto' placeholder='Monto' type='number' min='0' required><br>
      <input name='fecha' placeholder='Fecha' type='date' required><br>
      <button type='submit'>Registrar</button>
    </form>
    <div id='msg-pago-beneficio'></div>
    <button id='btn-ver-pagos' class='btn-melantia'>Ver Pagos y Beneficios</button>
    <div id='panel-pagos-beneficios'></div>
  `;
  document.getElementById('form-pago-beneficio').onsubmit = function (e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    let pagos = JSON.parse(localStorage.getItem('pagos_beneficios') || '[]');
    pagos.push(data);
    localStorage.setItem('pagos_beneficios', JSON.stringify(pagos));
    document.getElementById('msg-pago-beneficio').innerText =
      'Pago/beneficio registrado.';
  };
  document.getElementById('btn-ver-pagos').onclick = function () {
    const pagos = JSON.parse(localStorage.getItem('pagos_beneficios') || '[]');
    const panel = document.getElementById('panel-pagos-beneficios');
    if (!pagos.length) {
      panel.innerHTML = '<p>No hay pagos ni beneficios registrados.</p>';
      return;
    }
    panel.innerHTML =
      '<h3>Pagos y Beneficios</h3>' +
      pagos
        .map(
          (p) =>
            `<div class='card-pago'><b>${p.concepto}</b> — $${p.monto} el ${p.fecha}</div>`
        )
        .join('<hr>');
  };
}
