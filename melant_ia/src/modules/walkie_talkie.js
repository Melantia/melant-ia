// Walkie Talkie — MELANTIA
// Panel para chat de mensajes cortos tipo walkie talkie (offline/local)

export function mostrarPanel(contenedorId = 'app-menu') {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  cont.innerHTML = `
    <h2>Walkie Talkie Rural</h2>
    <button id="btn-enviar-mensaje" class="btn-melantia">Enviar Mensaje</button>
    <button id="btn-ver-mensajes" class="btn-melantia">Ver Mensajes</button>
    <div id="panel-walkie-talkie"></div>
  `;
  document.getElementById('btn-enviar-mensaje').onclick = () => renderForm();
  document.getElementById('btn-ver-mensajes').onclick = () => renderMensajes();

  function renderForm() {
    const panel = document.getElementById('panel-walkie-talkie');
    panel.innerHTML = `
      <h3>Enviar Mensaje</h3>
      <form id='form-mensaje'>
        <input name='remitente' placeholder='Tu nombre o alias' required><br>
        <textarea name='mensaje' placeholder='Mensaje corto' maxlength='120' required></textarea><br>
        <button type='submit'>Enviar</button>
      </form>
      <div id='msg-walkie'></div>
    `;
    document.getElementById('form-mensaje').onsubmit = function (e) {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target).entries());
      data.fecha = new Date().toLocaleString();
      let mensajes = JSON.parse(
        localStorage.getItem('walkie_talkie_mensajes') || '[]'
      );
      mensajes.push(data);
      localStorage.setItem('walkie_talkie_mensajes', JSON.stringify(mensajes));
      document.getElementById('msg-walkie').innerText = 'Mensaje enviado.';
      renderMensajes();
    };
  }

  function renderMensajes() {
    const mensajes = JSON.parse(
      localStorage.getItem('walkie_talkie_mensajes') || '[]'
    );
    const panel = document.getElementById('panel-walkie-talkie');
    if (!mensajes.length) {
      panel.innerHTML = '<p>No hay mensajes enviados.</p>';
      return;
    }
    panel.innerHTML =
      '<h3>Mensajes Recientes</h3>' +
      mensajes
        .slice(-10)
        .reverse()
        .map(
          (m) =>
            `<div class='card-mensaje'><b>${m.remitente}</b> <span style='color:#888;font-size:0.9em;'>${m.fecha}</span><br>${m.mensaje}</div>`
        )
        .join('<hr>');
  }
}
