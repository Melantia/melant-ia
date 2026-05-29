// Solicitar Microcrédito — MELANTIA
// Panel para solicitud de microcréditos

export function mostrarPanel(contenedorId = 'app-menu') {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  cont.innerHTML = `
    <h2>Solicitar Microcrédito</h2>
    <form id='form-microcredito'>
      <input name='nombre' placeholder='Nombre completo' required><br>
      <input name='monto' placeholder='Monto solicitado' type='number' min='1' required><br>
      <input name='plazo' placeholder='Plazo (meses)' type='number' min='1' required><br>
      <button type='submit'>Solicitar</button>
    </form>
    <div id='msg-microcredito'></div>
  `;
  document.getElementById('form-microcredito').onsubmit = function (e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    let solicitudes = JSON.parse(
      localStorage.getItem('solicitudes_microcredito') || '[]'
    );
    solicitudes.push(data);
    localStorage.setItem(
      'solicitudes_microcredito',
      JSON.stringify(solicitudes)
    );
    document.getElementById('msg-microcredito').innerText =
      'Solicitud enviada correctamente.';
  };
}
