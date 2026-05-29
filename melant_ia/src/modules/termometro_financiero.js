// Termómetro Financiero MELANTIA
export function mostrarPanel() {
  const cont = document.getElementById('contenedor-principal') || document.body;
  if (!cont) return;
  const saldo = calcularSaldo();
  const color = saldo > 200 ? 'green' : saldo > 0 ? 'orange' : 'red';
  const texto =
    color === 'green'
      ? 'Saludable'
      : color === 'orange'
        ? 'Atento'
        : '¡Cuidado!';
  cont.innerHTML = `
    <div class="panel-hub" style="max-width:700px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
      <h2 style='color:#0a6c2e;text-align:center;margin-bottom:24px;'>Termómetro Financiero</h2>
      <div style="margin:24px 0;text-align:center;">
        <span style="display:inline-block;width:60px;height:60px;background:#eee;border-radius:50%;vertical-align:middle;">
          <span style="display:inline-block;width:100%;height:100%;background:${color};border-radius:50%;opacity:0.7;"></span>
        </span>
        <div style="font-size:1.3em;margin-top:8px;color:${color};font-weight:bold;">${texto}</div>
        <div style="margin-top:8px;">Saldo actual: <b style="color:${color};">$${saldo.toFixed(2)}</b></div>
      </div>
      <button onclick="window.volverAlMenuPrincipal()" style="margin-top:32px;background:#0a6c2e;color:#fff;padding:10px 28px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">Volver al menú principal</button>
    </div>
  `;
}

function calcularSaldo() {
  let registros = JSON.parse(
    localStorage.getItem('registrosFinancieros') || '[]'
  );
  let saldo = 0;
  for (const r of registros) {
    if (r.tipo === 'Ingreso') saldo += Number(r.monto);
    if (r.tipo === 'Gasto') saldo -= Number(r.monto);
  }
  return saldo;
}
