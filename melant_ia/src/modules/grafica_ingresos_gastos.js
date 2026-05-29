// Gráfica de Ingresos y Gastos MELANTIA
export function mostrarPanel() {
  const cont = document.getElementById('contenedor-principal') || document.body;
  if (!cont) return;
  let registros = JSON.parse(
    localStorage.getItem('registrosFinancieros') || '[]'
  );
  const ingresos = registros.filter((r) => r.tipo === 'Ingreso');
  const gastos = registros.filter((r) => r.tipo === 'Gasto');
  const maxVal = Math.max(
    ...ingresos.map((i) => i.monto),
    ...gastos.map((g) => g.monto),
    1
  );
  function barra(val, col) {
    return `<div style='display:inline-block;width:${(val / maxVal) * 120}px;height:14px;background:${col};margin:2px;'></div>`;
  }
  cont.innerHTML = `
    <div class="panel-hub" style="max-width:700px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
      <h2 style='color:#0a6c2e;text-align:center;margin-bottom:24px;'>Gráfica de Ingresos y Gastos</h2>
      <div style="margin-bottom:18px;">
        <span style='font-size:1.1em;'>Ingresos recientes:</span><br>${ingresos
          .slice(0, 8)
          .map((i) => `${i.monto} ${barra(i.monto, '#0a6c2e')}`)
          .join('')}<br>
        <span style='font-size:1.1em;'>Gastos recientes:</span><br>${gastos
          .slice(0, 8)
          .map((g) => `${g.monto} ${barra(g.monto, '#b91c1c')}`)
          .join('')}
      </div>
      <button onclick="window.volverAlMenuPrincipal()" style="margin-top:32px;background:#0a6c2e;color:#fff;padding:10px 28px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">Volver al menú principal</button>
    </div>
  `;
}
