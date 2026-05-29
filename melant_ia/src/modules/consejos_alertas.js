// Consejos y Alertas Financieras MELANTIA
export function mostrarPanel() {
  const cont = document.getElementById('contenedor-principal') || document.body;
  if (!cont) return;
  cont.innerHTML = `
    <div class="panel-hub" style="max-width:700px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
      <h2 style='color:#b91c1c;text-align:center;margin-bottom:24px;'>Consejos y Alertas Financieras</h2>
      <ul style="font-size:1.1em;line-height:1.7;">
        <li>Evita gastar más de lo que ganas. Haz un presupuesto mensual.</li>
        <li>Reserva al menos el 10% de tus ingresos para emergencias.</li>
        <li>Si tienes deudas, prioriza las de mayor interés.</li>
        <li>Revisa tus gastos hormiga: pequeños gastos diarios suman mucho.</li>
        <li>Activa alertas en tu móvil para pagos y vencimientos.</li>
        <li>Si tu saldo baja mucho, reduce gastos no esenciales.</li>
        <li>Consulta regularmente tu historial financiero.</li>
      </ul>
      <div id="alertas-recientes"></div>
      <button onclick="window.volverAlMenuPrincipal()" style="margin-top:32px;background:#b91c1c;color:#fff;padding:10px 28px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">Volver al menú principal</button>
    </div>
  `;
  mostrarAlertasRecientes();
}

function mostrarAlertasRecientes() {
  const div = document.getElementById('alertas-recientes');
  if (!div) return;
  let registros = JSON.parse(
    localStorage.getItem('registrosFinancieros') || '[]'
  );
  const alertas = registros
    .filter((r) => r.tipo === 'Gasto' && r.monto > 100)
    .slice(0, 3);
  if (!alertas.length) {
    div.innerHTML = '<p>No hay alertas recientes.</p>';
    return;
  }
  div.innerHTML =
    '<h4>Alertas recientes:</h4>' +
    alertas
      .map(
        (a) =>
          `<div style='color:#b91c1c;font-weight:bold;'>Gasto alto: ${a.descripcion} — $${a.monto}</div>`
      )
      .join('');
}
