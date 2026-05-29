// Apertura de Cuenta Digital — MELANTIA
// Panel para registro de nueva cuenta digital

export function mostrarPanel(contenedorId = 'app-menu') {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  cont.innerHTML = `
    <h2>Apertura de Cuenta Digital</h2>
    <form id='form-cuenta-digital'>
      <input name='nombre' placeholder='Nombre completo' required><br>
      <input name='email' placeholder='Correo electrónico' type='email' required><br>
      <input name='telefono' placeholder='Teléfono' required><br>
      <input name='identificacion' placeholder='Cédula o ID' required><br>
      <button type='submit'>Crear Cuenta</button>
    </form>
    <div id='msg-cuenta-digital'></div>
  `;
  document.getElementById('form-cuenta-digital').onsubmit = function (e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    localStorage.setItem('cuenta_digital', JSON.stringify(data));
    document.getElementById('msg-cuenta-digital').innerText =
      'Cuenta creada exitosamente.';
  };
}
