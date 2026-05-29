// Simulación de Perfil Financiero — MELANTIA
// Panel para simular y visualizar perfil financiero

export function mostrarPanel(contenedorId = 'app-menu') {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  cont.innerHTML = `
    <h2>Simulación de Perfil Financiero</h2>
    <form id='form-simulacion-perfil'>
      <input name='ingresos' placeholder='Ingresos mensuales' type='number' min='0' required><br>
      <input name='gastos' placeholder='Gastos mensuales' type='number' min='0' required><br>
      <button type='submit'>Simular</button>
    </form>
    <div id='resultado-simulacion'></div>
  `;
  document.getElementById('form-simulacion-perfil').onsubmit = function (e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    const ingresos = parseFloat(data.ingresos);
    const gastos = parseFloat(data.gastos);
    const ahorro = ingresos - gastos;
    let resultado = '';
    if (ahorro > 0) {
      resultado = `<span style='color:green'>¡Buen perfil! Puedes ahorrar $${ahorro} al mes.</span>`;
    } else if (ahorro === 0) {
      resultado = `<span style='color:orange'>Tu presupuesto está equilibrado.</span>`;
    } else {
      resultado = `<span style='color:red'>¡Atención! Gastas más de lo que ingresas.</span>`;
    }
    document.getElementById('resultado-simulacion').innerHTML = resultado;
  };
}
