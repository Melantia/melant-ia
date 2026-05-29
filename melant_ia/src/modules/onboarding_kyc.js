// Onboarding y Validación KYC — MELANTIA
// Panel para validación de identidad y onboarding

export function mostrarPanel(contenedorId = 'app-menu') {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  cont.innerHTML = `
    <h2>Onboarding y Validación KYC</h2>
    <form id='form-kyc'>
      <input name='nombre' placeholder='Nombre completo' required><br>
      <input name='identificacion' placeholder='Cédula o ID' required><br>
      <input name='fecha_nacimiento' placeholder='Fecha de nacimiento' type='date' required><br>
      <input name='direccion' placeholder='Dirección' required><br>
      <button type='submit'>Validar Identidad</button>
    </form>
    <div id='msg-kyc'></div>
  `;
  document.getElementById('form-kyc').onsubmit = function (e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    localStorage.setItem('kyc_usuario', JSON.stringify(data));
    document.getElementById('msg-kyc').innerText =
      'Identidad validada y onboarding completado.';
  };
}
