// Ciudadano Rural — MELANTIA
// Panel para registro y consulta de participación ciudadana rural

export function mostrarPanel(contenedorId = 'app-menu') {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  cont.innerHTML = `
    <h2>Ciudadano Rural</h2>
    <button id="btn-registrar-participacion" class="btn-melantia">Registrar Participación</button>
    <button id="btn-ver-participaciones" class="btn-melantia">Ver Participaciones</button>
    <div id="panel-ciudadano-rural"></div>
  `;
  document.getElementById('btn-registrar-participacion').onclick = () =>
    renderForm();
  document.getElementById('btn-ver-participaciones').onclick = () =>
    renderParticipaciones();

  function renderForm() {
    const panel = document.getElementById('panel-ciudadano-rural');
    panel.innerHTML = `
      <h3>Registrar Participación</h3>
      <form id='form-participacion'>
        <input name='nombre' placeholder='Nombre' required><br>
        <input name='tema' placeholder='Tema o problema' required><br>
        <textarea name='comentario' placeholder='Comentario'></textarea><br>
        <button type='submit'>Guardar</button>
      </form>
      <div id='msg-participacion'></div>
    `;
    document.getElementById('form-participacion').onsubmit = function (e) {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target).entries());
      let participaciones = JSON.parse(
        localStorage.getItem('ciudadano_rural_participaciones') || '[]'
      );
      participaciones.push(data);
      localStorage.setItem(
        'ciudadano_rural_participaciones',
        JSON.stringify(participaciones)
      );
      document.getElementById('msg-participacion').innerText =
        'Participación registrada.';
      renderParticipaciones();
    };
  }

  function renderParticipaciones() {
    const participaciones = JSON.parse(
      localStorage.getItem('ciudadano_rural_participaciones') || '[]'
    );
    const panel = document.getElementById('panel-ciudadano-rural');
    if (!participaciones.length) {
      panel.innerHTML = '<p>No hay participaciones registradas.</p>';
      return;
    }
    panel.innerHTML =
      '<h3>Participaciones</h3>' +
      participaciones
        .map(
          (p) =>
            `<div class='card-participacion'><b>${p.nombre}</b> — ${p.tema}<br>${p.comentario}</div>`
        )
        .join('<hr>');
  }
}
