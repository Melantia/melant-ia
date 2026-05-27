// Helper visual para mostrar sello de socio confiable y reputación comercial en la tienda
export function renderizarSelloSocioConfiable(usuario) {
  // usuario: {nombre, reputacion, selloConfiable}
  const cont =
    document.getElementById('panel-sello-reputacion') ||
    document.getElementById('app-menu');
  if (!cont) return;
  let html = `<section style="display:grid;gap:10px;margin-bottom:18px">
    <article style="background:#f5fbf5;border:1px solid #d3e7d3;border-radius:14px;padding:12px;display:flex;align-items:center;gap:14px">
      <span style="font-size:2.2em;">${usuario.selloConfiable ? '✅' : '🟡'}</span>
      <div>
        <strong>Sello de Socio Confiable</strong><br>
        <span style="color:#276749">${usuario.selloConfiable ? 'Activo. Los demás socios verán tu nombre con el sello de aprobación de Don Eloy.' : 'Pendiente. Mantén buen trato, cumplimiento y colaboración para ganarlo.'}</span>
      </div>
    </article>
    <article style="background:#f5fbf5;border:1px solid #d3e7d3;border-radius:14px;padding:12px;display:flex;align-items:center;gap:14px">
      <span style="font-size:2em;">🌟</span>
      <div>
        <strong>Reputación Comercial</strong><br>
        <span style="color:#276749">${usuario.reputacion || 'Sin historial registrado.'}</span>
      </div>
    </article>
  </section>`;
  // Si existe panel dedicado, lo usa; si no, lo inserta arriba en app-menu
  if (cont.id === 'panel-sello-reputacion') {
    cont.innerHTML = html;
  } else {
    cont.insertAdjacentHTML('afterbegin', html);
  }
}
