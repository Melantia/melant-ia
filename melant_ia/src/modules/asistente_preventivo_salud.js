// Asistente Preventivo de Salud — MELANTIA
// Panel para registro y consulta de acciones preventivas de salud

export function mostrarPanel(contenedorId = 'app-menu') {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  cont.innerHTML = `
    <h2>Asistente Preventivo de Salud</h2>
    <button id="btn-registrar-prevencion" class="btn-melantia">Registrar Acción</button>
    <button id="btn-ver-prevenciones" class="btn-melantia">Ver Acciones</button>
    <div id="panel-prevencion-salud"></div>
  `;
  document.getElementById('btn-registrar-prevencion').onclick = () =>
    renderForm();
  document.getElementById('btn-ver-prevenciones').onclick = () =>
    renderAcciones();

  function renderForm() {
    const panel = document.getElementById('panel-prevencion-salud');
    panel.innerHTML = `
      <h3>Registrar Acción Preventiva</h3>
      <form id='form-prevencion'>
        <input name='nombre' placeholder='Nombre' required><br>
        <input name='accion' placeholder='Acción preventiva' required><br>
        <textarea name='detalle' placeholder='Detalle'></textarea><br>
        <button type='submit'>Guardar</button>
      </form>
      <div id='msg-prevencion'></div>
    `;
    document.getElementById('form-prevencion').onsubmit = function (e) {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target).entries());
      let acciones = JSON.parse(
        localStorage.getItem('prevencion_salud_acciones') || '[]'
      );
      acciones.push(data);
      localStorage.setItem(
        'prevencion_salud_acciones',
        JSON.stringify(acciones)
      );
      document.getElementById('msg-prevencion').innerText =
        'Acción registrada.';
      renderAcciones();
    };
  }

  function renderAcciones() {
    const acciones = JSON.parse(
      localStorage.getItem('prevencion_salud_acciones') || '[]'
    );
    const panel = document.getElementById('panel-prevencion-salud');
    if (!acciones.length) {
      panel.innerHTML = '<p>No hay acciones registradas.</p>';
      return;
    }
    panel.innerHTML =
      '<h3>Acciones Preventivas</h3>' +
      acciones
        .map(
          (a) =>
            `<div class='card-prevencion'><b>${a.nombre}</b> — ${a.accion}<br>${a.detalle}</div>`
        )
        .join('<hr>');
  }
}
