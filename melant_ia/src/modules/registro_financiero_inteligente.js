// Registro Financiero Inteligente MELANTIA
export function mostrarPanel() {
  const cont = document.getElementById('contenedor-principal') || document.body;
  if (!cont) return;
  cont.innerHTML = `
    <div class="panel-hub" style="max-width:700px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
      <h2 style='color:#0a6c2e;text-align:center;margin-bottom:24px;'>Registro Financiero Inteligente</h2>
      <div id="panel-registro-financiero"></div>
      <button onclick="window.volverAlMenuPrincipal()" style="margin-top:32px;background:#0a6c2e;color:#fff;padding:10px 28px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">Volver al menú principal</button>
    </div>
  `;
  mostrarFormularioRegistro();
}

function mostrarFormularioRegistro() {
  const panel = document.getElementById('panel-registro-financiero');
  if (!panel) return;
  panel.innerHTML = `
    <form id="form-registro-financiero">
      <label>Descripción: <input name="descripcion" required></label><br>
      <label>Monto: <input name="monto" type="number" required></label><br>
      <label>Tipo:
        <select name="tipo">
          <option value="Ingreso">Ingreso</option>
          <option value="Gasto">Gasto</option>
        </select>
      </label><br>
      <label>Categoría: <input name="categoria"></label><br>
      <button type="submit">Registrar</button>
    </form>
    <div id="msg-registro-financiero"></div>
    <div id="registros-financieros-listado"></div>
  `;
  document.getElementById('form-registro-financiero').onsubmit = function (e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    data.monto = parseFloat(data.monto);
    let registros = JSON.parse(
      localStorage.getItem('registrosFinancieros') || '[]'
    );
    data.fecha = new Date().toISOString();
    registros.unshift(data);
    localStorage.setItem('registrosFinancieros', JSON.stringify(registros));
    mostrarMensaje('¡Registro guardado!', 'success');
    mostrarListadoRegistros();
    e.target.reset();
  };
  mostrarListadoRegistros();
}

function mostrarMensaje(msg, tipo) {
  const div = document.getElementById('msg-registro-financiero');
  if (!div) return;
  div.innerText = msg;
  div.style.color = tipo === 'success' ? '#155724' : '#721c24';
  div.style.background = tipo === 'success' ? '#d4edda' : '#f8d7da';
  div.style.padding = '6px';
  div.style.margin = '8px 0';
  div.style.borderRadius = '6px';
}

function mostrarListadoRegistros() {
  const div = document.getElementById('registros-financieros-listado');
  if (!div) return;
  let registros = JSON.parse(
    localStorage.getItem('registrosFinancieros') || '[]'
  );
  if (!registros.length) {
    div.innerHTML = '<p>No hay registros.</p>';
    return;
  }
  div.innerHTML =
    '<h3>Registros recientes</h3>' +
    registros
      .slice(0, 8)
      .map(
        (r) =>
          `<div class='card-registro'><b>${r.descripcion}</b> — $${r.monto} <span style='color:${r.tipo === 'Ingreso' ? '#0a6c2e' : '#b91c1c'};'>${r.tipo}</span> <br><span style='font-size:0.9em;color:#888;'>${new Date(r.fecha).toLocaleString()}</span></div>`
      )
      .join('<hr>');
}
