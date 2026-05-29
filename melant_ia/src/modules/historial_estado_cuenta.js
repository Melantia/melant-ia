// Historial y Estado de Cuenta — MELANTIA
// Panel para consultar historial y estado de cuenta

export function mostrarPanel(contenedorId = 'app-menu') {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  cont.innerHTML = `
    <h2>Historial y Estado de Cuenta</h2>
    <button id='btn-ver-historial' class='btn-melantia'>Ver Historial</button>
    <div id='panel-historial-cuenta'></div>
  `;
  document.getElementById('btn-ver-historial').onclick = function () {
    const transferencias = JSON.parse(
      localStorage.getItem('transferencias') || '[]'
    );
    const pagos = JSON.parse(localStorage.getItem('pagos_beneficios') || '[]');
    const panel = document.getElementById('panel-historial-cuenta');
    let html = '<h3>Transferencias</h3>';
    if (!transferencias.length) {
      html += '<p>No hay transferencias registradas.</p>';
    } else {
      html += transferencias
        .map(
          (t) =>
            `<div class='card-transferencia'><b>${t.origen}</b> → <b>${t.destino}</b> — $${t.monto} el ${t.fecha}</div>`
        )
        .join('<hr>');
    }
    html += '<h3>Pagos y Beneficios</h3>';
    if (!pagos.length) {
      html += '<p>No hay pagos ni beneficios registrados.</p>';
    } else {
      html += pagos
        .map(
          (p) =>
            `<div class='card-pago'><b>${p.concepto}</b> — $${p.monto} el ${p.fecha}</div>`
        )
        .join('<hr>');
    }
    panel.innerHTML = html;
  };
}
