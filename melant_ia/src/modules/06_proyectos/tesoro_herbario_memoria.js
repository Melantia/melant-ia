// Tesoro de los Abuelos y Herbario Memoria Cultural — MELANTIA
// Panel JS para registro y consulta de historias y remedios ancestrales
// Almacena datos en localStorage para uso offline y exportación posterior

export function mostrarPanel(contenedorId = 'app-menu') {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  cont.innerHTML = `
    <h2>Tesoro de los Abuelos y Herbario Cultural</h2>
    <button id="btn-ver-historias" class="btn-melantia">Ver Historias de los Abuelos</button>
    <button id="btn-ver-herbario" class="btn-melantia">Ver Herbario Cultural</button>
    <button id="btn-registrar-historia" class="btn-melantia">Registrar Historia</button>
    <button id="btn-registrar-remedio" class="btn-melantia">Registrar Remedio Herbario</button>
    <div id="panel-tesoro-herbario"></div>
  `;
  document.getElementById('btn-ver-historias').onclick = () =>
    renderHistorias();
  document.getElementById('btn-ver-herbario').onclick = () => renderHerbario();
  document.getElementById('btn-registrar-historia').onclick = () =>
    renderFormHistoria();
  document.getElementById('btn-registrar-remedio').onclick = () =>
    renderFormRemedio();

  function renderHistorias() {
    const historias = JSON.parse(
      localStorage.getItem('tesoro_abuelos_historias') || '[]'
    );
    const panel = document.getElementById('panel-tesoro-herbario');
    if (!historias.length) {
      panel.innerHTML = '<p>No hay historias registradas.</p>';
      return;
    }
    panel.innerHTML =
      '<h3>Historias de los Abuelos</h3>' +
      historias
        .map(
          (h) =>
            `<div class='card-tesoro'><b>${h.titulo}</b><br>${h.relato}<br><i>Por: ${h.narrador} (${h.lugar})</i></div>`
        )
        .join('<hr>');
  }

  function renderHerbario() {
    const remedios = JSON.parse(
      localStorage.getItem('herbario_memoria_remedios') || '[]'
    );
    const panel = document.getElementById('panel-tesoro-herbario');
    if (!remedios.length) {
      panel.innerHTML = '<p>No hay remedios herbales registrados.</p>';
      return;
    }
    panel.innerHTML =
      '<h3>Herbario Cultural</h3>' +
      remedios
        .map(
          (r) =>
            `<div class='card-herbario'><b>${r.planta}</b> — ${r.uso_medicinal}<br>${r.preparacion}<br><i>Por: ${r.narrador} (${r.lugar})</i></div>`
        )
        .join('<hr>');
  }

  function renderFormHistoria() {
    const panel = document.getElementById('panel-tesoro-herbario');
    panel.innerHTML = `
      <h3>Registrar Historia de los Abuelos</h3>
      <form id='form-historia'>
        <input name='titulo' placeholder='Título' required><br>
        <textarea name='relato' placeholder='Relato' required></textarea><br>
        <input name='narrador' placeholder='Narrador' required><br>
        <input name='lugar' placeholder='Lugar'><br>
        <button type='submit'>Guardar</button>
      </form>
      <div id='msg-historia'></div>
    `;
    document.getElementById('form-historia').onsubmit = function (e) {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target).entries());
      let historias = JSON.parse(
        localStorage.getItem('tesoro_abuelos_historias') || '[]'
      );
      historias.push(data);
      localStorage.setItem(
        'tesoro_abuelos_historias',
        JSON.stringify(historias)
      );
      document.getElementById('msg-historia').innerText = 'Historia guardada.';
      renderHistorias();
    };
  }

  function renderFormRemedio() {
    const panel = document.getElementById('panel-tesoro-herbario');
    panel.innerHTML = `
      <h3>Registrar Remedio Herbario</h3>
      <form id='form-remedio'>
        <input name='planta' placeholder='Planta' required><br>
        <input name='uso_medicinal' placeholder='Uso medicinal' required><br>
        <textarea name='preparacion' placeholder='Preparación'></textarea><br>
        <input name='narrador' placeholder='Narrador'><br>
        <input name='lugar' placeholder='Lugar'><br>
        <button type='submit'>Guardar</button>
      </form>
      <div id='msg-remedio'></div>
    `;
    document.getElementById('form-remedio').onsubmit = function (e) {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target).entries());
      let remedios = JSON.parse(
        localStorage.getItem('herbario_memoria_remedios') || '[]'
      );
      remedios.push(data);
      localStorage.setItem(
        'herbario_memoria_remedios',
        JSON.stringify(remedios)
      );
      document.getElementById('msg-remedio').innerText = 'Remedio guardado.';
      renderHerbario();
    };
  }
}
