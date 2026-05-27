// Emprendimientos — MELANTIA
// Registro y gestión de emprendimientos, integración con ventas y tienda

const emprendimientos = [];

export function registrarEmprendimiento({ nombre, descripcion, categoria }) {
  const emp = {
    id: 'emp-' + Date.now(),
    nombre,
    descripcion,
    categoria,
    fecha: new Date().toISOString(),
    ventas: [],
    gastos: [],
  };
  emprendimientos.push(emp);
  return emp;
}

export function listarEmprendimientos() {
  return emprendimientos;
}

export function registrarVentaEmprendimiento(empId, venta) {
  const emp = emprendimientos.find((e) => e.id === empId);
  if (!emp) return null;
  emp.ventas.push({ ...venta, fecha: new Date().toISOString() });
  return emp;
}

export function registrarGastoEmprendimiento(empId, gasto) {
  const emp = emprendimientos.find((e) => e.id === empId);
  if (!emp) return null;
  emp.gastos.push({ ...gasto, fecha: new Date().toISOString() });
  return emp;
}

export function mostrarPanelEmprendimientos(contenedorId = 'app-menu') {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  cont.innerHTML = `<h2>Emprendimientos</h2>`;
  cont.innerHTML += `<button onclick='window.mostrarFormularioEmprendimiento()'>Registrar Emprendimiento</button><div id='empr-listado'></div>`;
  mostrarListado();
  function mostrarListado() {
    const div = document.getElementById('empr-listado');
    if (!div) return;
    if (emprendimientos.length === 0) {
      div.innerHTML = '<p>No hay emprendimientos registrados.</p>';
      return;
    }
    div.innerHTML =
      '<ul>' +
      emprendimientos
        .map(
          (e) =>
            `<li><b>${e.nombre}</b> — ${e.categoria}<br>${e.descripcion}<br>Ventas: ${e.ventas.length} | Gastos: ${e.gastos.length}<br><button onclick="window.verDetalleEmprendimiento('${e.id}')">Ver Detalle</button></li>`
        )
        .join('') +
      '</ul>';
  }
}

window.mostrarFormularioEmprendimiento = function () {
  const cont = document.getElementById('app-menu');
  if (!cont) return;
  cont.innerHTML = `<h2>Registrar Emprendimiento</h2>
    <form id='form-empr'>
      <label>Nombre: <input name='nombre' required></label><br>
      <label>Descripción: <input name='descripcion'></label><br>
      <label>Categoría: <input name='categoria'></label><br>
      <button type='submit'>Guardar</button>
      <button type='button' onclick='window.volverEmprendimientos()'>Cancelar</button>
    </form>
    <div id='empr-msg'></div>
  `;
  document.getElementById('form-empr').onsubmit = function (e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    registrarEmprendimiento(data);
    window.mostrarPanelEmprendimientos();
  };
};

window.verDetalleEmprendimiento = function (empId) {
  const emp = emprendimientos.find((e) => e.id === empId);
  const cont = document.getElementById('app-menu');
  if (!emp || !cont) return;
  cont.innerHTML = `<h2>${emp.nombre}</h2>
    <p>${emp.descripcion}</p>
    <p>Categoría: ${emp.categoria}</p>
    <h3>Ventas</h3>
    <button onclick="window.mostrarFormularioVentaEmpr('${emp.id}')">Registrar Venta</button>
    <ul>${emp.ventas.map((v) => `<li>$${v.monto} — ${v.descripcion} (${v.fecha})</li>`).join('')}</ul>
    <h3>Gastos</h3>
    <button onclick="window.mostrarFormularioGastoEmpr('${emp.id}')">Registrar Gasto</button>
    <ul>${emp.gastos.map((g) => `<li>$${g.monto} — ${g.descripcion} (${g.fecha})</li>`).join('')}</ul>
    <button onclick='window.mostrarPanelEmprendimientos()'>Volver</button>`;
};

window.mostrarFormularioVentaEmpr = function (empId) {
  const cont = document.getElementById('app-menu');
  if (!cont) return;
  cont.innerHTML = `<h2>Registrar Venta</h2>
    <form id='form-venta'>
      <label>Monto: <input name='monto' type='number' required></label><br>
      <label>Descripción: <input name='descripcion'></label><br>
      <button type='submit'>Guardar</button>
      <button type='button' onclick='window.verDetalleEmprendimiento("${empId}")'>Cancelar</button>
    </form>
    <div id='venta-msg'></div>
  `;
  document.getElementById('form-venta').onsubmit = function (e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    data.monto = parseFloat(data.monto);
    registrarVentaEmprendimiento(empId, data);
    window.verDetalleEmprendimiento(empId);
  };
};

window.mostrarFormularioGastoEmpr = function (empId) {
  const cont = document.getElementById('app-menu');
  if (!cont) return;
  cont.innerHTML = `<h2>Registrar Gasto</h2>
    <form id='form-gasto'>
      <label>Monto: <input name='monto' type='number' required></label><br>
      <label>Descripción: <input name='descripcion'></label><br>
      <button type='submit'>Guardar</button>
      <button type='button' onclick='window.verDetalleEmprendimiento("${empId}")'>Cancelar</button>
    </form>
    <div id='gasto-msg'></div>
  `;
  document.getElementById('form-gasto').onsubmit = function (e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    data.monto = parseFloat(data.monto);
    registrarGastoEmprendimiento(empId, data);
    window.verDetalleEmprendimiento(empId);
  };
};

window.volverEmprendimientos = function () {
  window.mostrarPanelEmprendimientos();
};
