// Guía de Primeros Auxilios y Respuesta Rápida — MELANTIA
// Panel para consulta y registro de primeros auxilios

export function mostrarPanel(contenedorId = 'app-menu') {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  cont.innerHTML = `
    <h2>Guía de Primeros Auxilios y Respuesta Rápida</h2>
    <button id="btn-ver-guia" class="btn-melantia">Ver Guía</button>
    <button id="btn-registrar-caso" class="btn-melantia">Registrar Caso</button>
    <div id="panel-primeros-auxilios"></div>
  `;
  document.getElementById('btn-ver-guia').onclick = () => renderGuia();
  document.getElementById('btn-registrar-caso').onclick = () => renderForm();

  function renderGuia() {
    const panel = document.getElementById('panel-primeros-auxilios');
    panel.innerHTML = `
      <h3>Guía de Primeros Auxilios</h3>
      <ul>
        <li><b>Hemorragias:</b> Presionar y elevar la zona afectada.</li>
        <li><b>Quemaduras:</b> Enfriar con agua, cubrir con gasa estéril.</li>
        <li><b>Fracturas:</b> Inmovilizar y buscar ayuda médica.</li>
        <li><b>Reanimación:</b> Llamar al 911, iniciar RCP si es necesario.</li>
      </ul>
    `;
  }

  function renderForm() {
    const panel = document.getElementById('panel-primeros-auxilios');
    panel.innerHTML = `
      <h3>Registrar Caso de Primeros Auxilios</h3>
      <form id='form-caso-auxilio'>
        <input name='nombre' placeholder='Nombre' required><br>
        <input name='tipo' placeholder='Tipo de emergencia' required><br>
        <textarea name='detalle' placeholder='Detalle del caso'></textarea><br>
        <button type='submit'>Guardar</button>
      </form>
      <div id='msg-caso-auxilio'></div>
    `;
    document.getElementById('form-caso-auxilio').onsubmit = function (e) {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target).entries());
      let casos = JSON.parse(
        localStorage.getItem('primeros_auxilios_casos') || '[]'
      );
      casos.push(data);
      localStorage.setItem('primeros_auxilios_casos', JSON.stringify(casos));
      document.getElementById('msg-caso-auxilio').innerText =
        'Caso registrado.';
      renderCasos();
    };
  }

  function renderCasos() {
    const casos = JSON.parse(
      localStorage.getItem('primeros_auxilios_casos') || '[]'
    );
    const panel = document.getElementById('panel-primeros-auxilios');
    if (!casos.length) {
      panel.innerHTML = '<p>No hay casos registrados.</p>';
      return;
    }
    panel.innerHTML =
      '<h3>Casos Registrados</h3>' +
      casos
        .map(
          (c) =>
            `<div class='card-caso'><b>${c.nombre}</b> — ${c.tipo}<br>${c.detalle}</div>`
        )
        .join('<hr>');
  }
}
