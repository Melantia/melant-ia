// --- Finanzas Personales: Registro Simple y Alertas Inteligentes ---
let perfilUsuario = '';
let registrosFinancieros = [];
const UNIDADES = ['Kilos', 'Libras', 'Litros', 'Unidades', 'Quintales'];

function mostrarRegistroFinanciero() {
  const cont = document.getElementById('app-menu');
  if (!cont) return;
  // Paso 0: Si no hay perfil, preguntar
  if (!perfilUsuario) {
    cont.innerHTML = `<h3>¿Qué tipo de usuario eres?</h3>
      <button onclick="window.EmprendedorFinanzas.seleccionarPerfil('Productor')">Productor (Campo/Manufactura)</button>
      <button onclick="window.EmprendedorFinanzas.seleccionarPerfil('Emprendedor')">Emprendedor (Comercio/Servicios)</button>`;
    return;
  }
  // Paso 1: Tipo de registro
  cont.innerHTML = `<h3>Registro Financiero</h3>
    <b>1. ¿Qué tipo de registro es hoy?</b><br>
    <button onclick="window.EmprendedorFinanzas.setTipoRegistro('Ingreso')">Venta / Ingreso</button>
    <button onclick="window.EmprendedorFinanzas.setTipoRegistro('Gasto')">Gasto / Inversión</button>
    <div id='fin-detalle-registro'></div>
    <br><button onclick="window.EmprendedorFinanzas.mostrarMenu()">Volver al menú</button>`;
}

let tipoRegistroActual = '';
function seleccionarPerfil(tipo) {
  perfilUsuario = tipo;
  localStorage.setItem('perfilFinanciero', perfilUsuario);
  mostrarRegistroFinanciero();
}
function setTipoRegistro(tipo) {
  tipoRegistroActual = tipo;
  mostrarDetalleRegistro();
}
function mostrarDetalleRegistro() {
  const div = document.getElementById('fin-detalle-registro');
  if (!div) return;
  div.innerHTML = `
    <b>2. Detalle de la Producción (Volumen)</b><br>
    <input id='fin-cant-vol' type='number' min='0' placeholder='Cantidad'>
    <select id='fin-unidad'>${UNIDADES.map((u) => `<option>${u}</option>`).join('')}</select><br>
    <b>3. Monto Financiero ($)</b><br>
    <input id='fin-monto' type='number' min='0' placeholder='$ Total de la transacción'><br>
    <button onclick="window.EmprendedorFinanzas.guardarRegistroFinanciero()">Guardar Registro</button>
  `;
}
function guardarRegistroFinanciero() {
  const volumen = parseFloat(document.getElementById('fin-cant-vol').value);
  const unidad = document.getElementById('fin-unidad').value;
  const monto = parseFloat(document.getElementById('fin-monto').value);
  if (isNaN(volumen) || volumen <= 0 || isNaN(monto) || monto < 0) {
    alert('Completa todos los campos correctamente.');
    return;
  }
  registrosFinancieros.push({
    fecha: new Date().toISOString(),
    tipo: tipoRegistroActual,
    volumen,
    unidad,
    monto,
  });
  localStorage.setItem(
    'registrosFinancieros',
    JSON.stringify(registrosFinancieros)
  );
  alert('Registro guardado.');
  mostrarRegistroFinanciero();
  evaluarAlertasFinancieras();
}
function cargarPerfilYRegistros() {
  perfilUsuario = localStorage.getItem('perfilFinanciero') || '';
  const data = localStorage.getItem('registrosFinancieros');
  registrosFinancieros = data ? JSON.parse(data) : [];
}

// --- Motor de Alertas Inteligentes ---
function evaluarAlertasFinancieras() {
  if (registrosFinancieros.length < 2) return;
  const ultimos = registrosFinancieros.slice(-2);
  // Alerta 1: Precio unitario cae
  if (ultimos[0].tipo === 'Ingreso' && ultimos[1].tipo === 'Ingreso') {
    const p0 = ultimos[0].monto / ultimos[0].volumen;
    const p1 = ultimos[1].monto / ultimos[1].volumen;
    if (p1 < p0) {
      const perc = Math.round(((p0 - p1) / p0) * 100);
      alert(
        `📉 Alerta de Mercado: Este mes estás vendiendo tu producto un ${perc}% más barato por unidad. Te sugerimos revisar si tus costos de producción subieron para evitar pérdidas.`
      );
    }
  }
  // Alerta 2: Productor, pico de volumen
  if (perfilUsuario === 'Productor') {
    const maxVol = Math.max(
      ...registrosFinancieros
        .filter((r) => r.tipo === 'Ingreso')
        .map((r) => r.volumen)
    );
    if (ultimos[1].volumen === maxVol && maxVol > 0) {
      alert(
        '🌾 Consejo de Cosecha: Detectamos un gran volumen de producción. No gastes todo el ingreso: guarda un 15% en un fondo de reserva para cubrir los meses donde la tierra o la demanda descansan.'
      );
    }
  }
  // Alerta 3: Emprendedor, punto de equilibrio
  if (perfilUsuario === 'Emprendedor') {
    const ingresos = registrosFinancieros
      .filter((r) => r.tipo === 'Ingreso')
      .reduce((a, b) => a + b.monto, 0);
    const gastos = registrosFinancieros
      .filter((r) => r.tipo === 'Gasto')
      .reduce((a, b) => a + b.monto, 0);
    if (gastos > 0 && ingresos < gastos) {
      const perc = Math.round((ingresos / gastos) * 100);
      alert(
        `📊 Meta Mensual: Llevas cubierto el ${perc}% de tus gastos fijos este mes. Te falta vender $${(gastos - ingresos).toFixed(2)} o producir más para empezar a generar ganancias netas.`
      );
    }
  }
  // Alerta 4: Eficiencia de producción
  if (ultimos[1].tipo === 'Ingreso' && ultimos[0].tipo === 'Gasto') {
    const volPrev = registrosFinancieros
      .slice(0, -1)
      .filter((r) => r.tipo === 'Ingreso')
      .reduce((a, b) => a + b.volumen, 0);
    const volNow = registrosFinancieros
      .filter((r) => r.tipo === 'Ingreso')
      .reduce((a, b) => a + b.volumen, 0);
    const gastosPrev = registrosFinancieros
      .slice(0, -1)
      .filter((r) => r.tipo === 'Gasto')
      .reduce((a, b) => a + b.monto, 0);
    const gastosNow = registrosFinancieros
      .filter((r) => r.tipo === 'Gasto')
      .reduce((a, b) => a + b.monto, 0);
    if (volNow > volPrev && gastosNow <= gastosPrev) {
      alert(
        '🏆 ¡Excelente eficiencia! Lograste producir más volumen gastando lo mismo en insumos. Tu costo por unidad bajó. Es el momento ideal para reinvertir un pequeño porcentaje en mejorar tu maquinaria o marketing.'
      );
    }
  }
}
// Agregar acceso desde el menú principal
window.EmprendedorFinanzas.mostrarRegistroFinanciero =
  mostrarRegistroFinanciero;
window.EmprendedorFinanzas.seleccionarPerfil = seleccionarPerfil;
window.EmprendedorFinanzas.setTipoRegistro = setTipoRegistro;
window.EmprendedorFinanzas.guardarRegistroFinanciero =
  guardarRegistroFinanciero;
// Módulo: Emprendedor y Finanzas Personales
// Funciones y lógica de emprendimientos y finanzas

// --- Configuración ---
const MAX_PRODUCTOS = 10; // Hasta 10 productos si crea su tienda personal
const MAX_FOTOS = 3;
let catalogo = [];
let agendaFerias = [];
let cuentaBancaria = '';
let slogan = '';
let pitch = '';

function renderMenu() {
  const cont = document.getElementById('app-menu');
  if (!cont) return;
  cont.innerHTML = `
    <h2>Módulo Emprendedor MELANTIA</h2>
    <div style='margin-bottom:10px;color:#0a6c2e;font-weight:bold;'>¡Publica hasta 10 productos creando tu tienda personal en MELANTIA!</div>
    <button onclick="window.EmprendedorFinanzas.mostrarCatalogo()">Catálogo de Productos</button>
    <button onclick="window.EmprendedorFinanzas.mostrarTiendaPersonal()">Monte su Tienda Personal</button>
    <button onclick="window.EmprendedorFinanzas.mostrarAgendaFerias()">Agenda de Ferias y Tiendas</button>
    <button onclick="window.EmprendedorFinanzas.mostrarRegistroFinanciero()">Registro Financiero Inteligente</button>
    <button onclick="window.EmprendedorFinanzas.mostrarFinanzasPersonales()">Finanzas Personales</button>
    <button onclick="window.EmprendedorFinanzas.mostrarPagos()">Recibir Pagos y Transferencias</button>
    <button onclick="window.EmprendedorFinanzas.mostrarCuentaBancaria()">Mi Cuenta Bancaria</button>
    <button onclick="window.EmprendedorFinanzas.mostrarSloganPitch()">Mi Slogan y Pitch de Venta</button>
    <button onclick="window.EmprendedorFinanzas.mostrarSimuladorPrecio()">Simulador de Precio Real</button>
    <button onclick="window.EmprendedorFinanzas.mostrarNegociacion()">Asistente de Negociación</button>
    <button onclick="window.EmprendedorFinanzas.mostrarAsesoriaLegal()">Asesoría Legal</button>
  `;
  // --- Finanzas Personales ---
  let finanzas = {
    ingresos: [],
    gastos: [],
    consejos: [
      'Ahorra al menos el 10% de tus ingresos cada mes.',
      'Lleva un registro de todos tus gastos, por pequeños que sean.',
      'Invierte en mejorar la calidad de tus productos para obtener mejores precios.',
      'Compara precios antes de comprar insumos o herramientas.',
      'No vendas por debajo de tus costos: calcula siempre tus gastos e inversiones.',
    ],
  };

  function mostrarFinanzasPersonales() {
    const cont = document.getElementById('app-menu');
    if (!cont) return;
    cont.innerHTML = `<h3>Finanzas Personales</h3>
      <div>Consejos para ahorrar y mejorar tus finanzas:</div>
      <ul>${finanzas.consejos.map((c) => `<li>${c}</li>`).join('')}</ul>
      <hr>
      <b>Registrar Ingreso</b><br>
      <input id='fin-ingreso-desc' placeholder='Descripción'> <input id='fin-ingreso-monto' type='number' placeholder='Monto'>
      <button onclick="window.EmprendedorFinanzas.agregarIngreso()">Agregar</button>
      <ul>${finanzas.ingresos.map((i) => `<li>${i.desc}: $${i.monto}</li>`).join('')}</ul>
      <hr>
      <b>Registrar Gasto/Inversión</b><br>
      <input id='fin-gasto-desc' placeholder='Descripción'> <input id='fin-gasto-monto' type='number' placeholder='Monto'>
      <button onclick="window.EmprendedorFinanzas.agregarGasto()">Agregar</button>
      <ul>${finanzas.gastos.map((g) => `<li>${g.desc}: $${g.monto}</li>`).join('')}</ul>
      <hr>
      <b>Resumen</b><br>
      <div>Ingresos: $${sumaIngresos()}</div>
      <div>Gastos/Inversiones: $${sumaGastos()}</div>
      <div style='color:${sumaIngresos() - sumaGastos() >= 0 ? 'green' : 'red'}'>Saldo: $${sumaIngresos() - sumaGastos()}</div>
      <hr>
      <b>¿Cómo poner precio a tu producto?</b><br>
      <div>Precio mínimo recomendado: <b>$${calcularPrecioMinimo()}</b> (suma de gastos/inversiones dividido entre productos a vender)</div>
      <input id='fin-cant-prod' type='number' placeholder='Cantidad de productos a vender' min='1' style='width:60px;'>
      <button onclick="window.EmprendedorFinanzas.mostrarPrecioMinimo()">Calcular</button>
      <div id='fin-resultado-precio'></div>
      <br><button onclick="window.EmprendedorFinanzas.mostrarMenu()">Volver al menú</button>`;
  }

  function agregarIngreso() {
    const desc = document.getElementById('fin-ingreso-desc').value.trim();
    const monto = parseFloat(
      document.getElementById('fin-ingreso-monto').value
    );
    if (!desc || isNaN(monto) || monto <= 0) {
      alert('Completa los datos');
      return;
    }
    finanzas.ingresos.push({ desc, monto });
    guardarFinanzas();
    mostrarFinanzasPersonales();
  }
  function agregarGasto() {
    const desc = document.getElementById('fin-gasto-desc').value.trim();
    const monto = parseFloat(document.getElementById('fin-gasto-monto').value);
    if (!desc || isNaN(monto) || monto <= 0) {
      alert('Completa los datos');
      return;
    }
    finanzas.gastos.push({ desc, monto });
    guardarFinanzas();
    mostrarFinanzasPersonales();
  }
  function sumaIngresos() {
    return finanzas.ingresos.reduce((a, b) => a + b.monto, 0);
  }
  function sumaGastos() {
    return finanzas.gastos.reduce((a, b) => a + b.monto, 0);
  }
  function calcularPrecioMinimo() {
    const cant = parseInt(
      document.getElementById('fin-cant-prod')?.value || '1',
      10
    );
    const gastos = sumaGastos();
    return cant > 0 ? (gastos / cant).toFixed(2) : '0.00';
  }
  function mostrarPrecioMinimo() {
    const precio = calcularPrecioMinimo();
    document.getElementById('fin-resultado-precio').innerHTML =
      `<b>Precio mínimo sugerido: $${precio}</b>`;
  }
  function guardarFinanzas() {
    localStorage.setItem('finanzasPersonales', JSON.stringify(finanzas));
  }
  function cargarFinanzas() {
    const data = localStorage.getItem('finanzasPersonales');
    finanzas = data ? JSON.parse(data) : finanzas;
  }
  // --- Tienda Personal ---
  function mostrarTiendaPersonal() {
    const cont = document.getElementById('app-menu');
    if (!cont) return;
    cont.innerHTML = `<h3>Tu Tienda Personal MELANTIA</h3>
    <div>Puedes publicar hasta <b>10 productos</b> y compartir tu catálogo personalizado.</div>
    <button onclick="window.EmprendedorFinanzas.mostrarCatalogo()">Gestionar Catálogo</button>
    <button onclick="window.EmprendedorFinanzas.mostrarMenu()">Volver al menú</button>
    <hr>
    <div style='color:#0a6c2e;font-weight:bold;'>¿Por qué crear tu tienda personal?</div>
    <ul><li>Mayor visibilidad y confianza</li><li>Recibe pagos directos</li><li>Comparte tu tienda por WhatsApp</li></ul>
    <div style='margin-top:10px;'>Próximamente: personalización de portada, estadísticas y más.</div>
  `;
  }
  // --- Agenda de Ferias y Tiendas ---
  function mostrarAgendaFerias() {
    const cont = document.getElementById('app-menu');
    if (!cont) return;
    cont.innerHTML = `<h3>Agenda de Ferias y Tiendas</h3>
    <div>Registra ferias, mercados y tiendas donde vendes o quieres vender.</div>
    <button onclick="window.EmprendedorFinanzas.agregarFeria()">Agregar Feria/Tienda</button>
    <ul>${agendaFerias.map((f) => `<li>${f.nombre} - ${f.fecha || ''}</li>`).join('')}</ul>
    <button onclick="window.EmprendedorFinanzas.mostrarMenu()">Volver al menú</button>
  `;
  }

  function agregarFeria() {
    const nombre = prompt('Nombre de la feria o tienda:');
    if (nombre) {
      const fecha = prompt('Fecha (opcional):');
      agendaFerias.push({ nombre, fecha });
      guardarAgendaFerias();
      mostrarAgendaFerias();
    }
  }

  function guardarAgendaFerias() {
    localStorage.setItem('agendaFerias', JSON.stringify(agendaFerias));
  }
  function cargarAgendaFerias() {
    const data = localStorage.getItem('agendaFerias');
    agendaFerias = data ? JSON.parse(data) : [];
  }
  // --- Pagos y Transferencias ---
  function mostrarPagos() {
    const cont = document.getElementById('app-menu');
    if (!cont) return;
    cont.innerHTML = `<h3>Recibir Pagos y Transferencias</h3>
    <div>Próximamente: integración con pasarelas de pago (PayPhone, Deuna, peiGo, etc.).</div>
    <div>Podrás recibir pagos directos y transferencias a tu cuenta bancaria.</div>
    <button onclick="window.EmprendedorFinanzas.mostrarMenu()">Volver al menú</button>`;
  }
  // --- Cuenta Bancaria ---
  function mostrarCuentaBancaria() {
    const cont = document.getElementById('app-menu');
    if (!cont) return;
    cont.innerHTML = `<h3>Mi Cuenta Bancaria</h3>
    <div>Ingresa tu número de cuenta para recibir transferencias:</div>
    <input id='input-cuenta' value='${cuentaBancaria || ''}' placeholder='Número de cuenta'><br>
    <button onclick="window.EmprendedorFinanzas.guardarCuentaBancaria()">Guardar</button>
    <button onclick="window.EmprendedorFinanzas.mostrarMenu()">Volver al menú</button>`;
  }

  function guardarCuentaBancaria() {
    const val = document.getElementById('input-cuenta').value.trim();
    cuentaBancaria = val;
    localStorage.setItem('cuentaBancaria', cuentaBancaria);
    alert('Cuenta guardada');
  }
  function cargarCuentaBancaria() {
    cuentaBancaria = localStorage.getItem('cuentaBancaria') || '';
  }
  // --- Slogan y Pitch de Venta ---
  function mostrarSloganPitch() {
    const cont = document.getElementById('app-menu');
    if (!cont) return;
    cont.innerHTML = `<h3>Mi Slogan y Pitch de Venta</h3>
    <div>Personaliza tu mensaje para atraer clientes:</div>
    <input id='input-slogan' value='${slogan || ''}' placeholder='Slogan (máx. 80 caracteres)' maxlength='80'><br>
    <textarea id='input-pitch' placeholder='Pitch de venta (máx. 300 caracteres)' maxlength='300' style='width:90%;height:60px;'>${pitch || ''}</textarea><br>
    <button onclick="window.EmprendedorFinanzas.guardarSloganPitch()">Guardar</button>
    <button onclick="window.EmprendedorFinanzas.mostrarMenu()">Volver al menú</button>`;
  }

  function guardarSloganPitch() {
    slogan = document.getElementById('input-slogan').value.trim();
    pitch = document.getElementById('input-pitch').value.trim();
    localStorage.setItem('sloganEmprendedor', slogan);
    localStorage.setItem('pitchEmprendedor', pitch);
    alert('Slogan y pitch guardados');
  }
  function cargarSloganPitch() {
    slogan = localStorage.getItem('sloganEmprendedor') || '';
    pitch = localStorage.getItem('pitchEmprendedor') || '';
  }
}

function renderCatalogo() {
  const cont = document.getElementById('app-menu');
  if (!cont) return;
  cont.innerHTML = `<h3>Catálogo de Productos (máx. ${MAX_PRODUCTOS})</h3>`;
  cont.innerHTML += catalogo
    .map(
      (prod, idx) => `
    <div class="producto-card">
      <b>${prod.nombre}</b><br>
      ${prod.fotos.map((f) => `<img src="${f}" style="max-width:80px;max-height:80px;margin:2px;">`).join('')}
      <br>
      <button onclick="window.EmprendedorFinanzas.compartirProducto(${idx})">Compartir por WhatsApp</button>
      <button onclick="window.EmprendedorFinanzas.publicarEnTienda(${idx})">Publicar en Tienda MELANTIA</button>
      <button onclick="window.EmprendedorFinanzas.eliminarProducto(${idx})">Eliminar</button>
    </div>
  `
    )
    .join('');
  if (catalogo.length < MAX_PRODUCTOS) {
    cont.innerHTML += `
      <hr>
      <h4>Agregar nuevo producto</h4>
      <input id="nuevo-nombre" placeholder="Nombre del producto"><br>
      <input id="nuevo-fotos" type="file" accept="image/*" multiple><br>
      <button onclick="window.EmprendedorFinanzas.agregarProducto()">Agregar</button>
    `;
  }
  cont.innerHTML += `<br><button onclick="window.EmprendedorFinanzas.mostrarMenu()">Volver al menú</button>`;
}

function agregarProducto() {
  const nombre = document.getElementById('nuevo-nombre').value.trim();
  const fotosInput = document.getElementById('nuevo-fotos');
  if (!nombre) {
    alert('El nombre es obligatorio');
    return;
  }
  const files = Array.from(fotosInput.files || []);
  if (files.length === 0 || files.length > MAX_FOTOS) {
    alert('Debes seleccionar entre 1 y 3 fotos');
    return;
  }
  const readerPromises = files.map(
    (f) =>
      new Promise((res) => {
        const r = new FileReader();
        r.onload = (e) => res(e.target.result);
        r.readAsDataURL(f);
      })
  );
  Promise.all(readerPromises).then((fotos) => {
    catalogo.push({ nombre, fotos });
    guardarCatalogo();
    renderCatalogo();
  });
}

function eliminarProducto(idx) {
  catalogo.splice(idx, 1);
  guardarCatalogo();
  renderCatalogo();
}

function compartirProducto(idx) {
  const prod = catalogo[idx];
  const url = encodeURIComponent(window.location.href);
  const texto = encodeURIComponent(
    `Mira mi producto: ${prod.nombre} en MELANTIA`
  );
  window.open(`https://wa.me/?text=${texto}%20${url}`);
}

function publicarEnTienda(idx) {
  alert('Funcionalidad de publicación en la Tienda MELANTIA próximamente.');
}

function guardarCatalogo() {
  localStorage.setItem('catalogoEmprendedor', JSON.stringify(catalogo));
}

function cargarCatalogo() {
  const data = localStorage.getItem('catalogoEmprendedor');
  catalogo = data ? JSON.parse(data) : [];
}

// Placeholders para otros submódulos
// Placeholders para otros submódulos
function mostrarSimuladorPrecio() {
  alert('Simulador de Precio Real: próximamente.');
}
function mostrarNegociacion() {
  alert('Asistente de Negociación: próximamente.');
}
function mostrarAsesoriaLegal() {
  alert('Asesoría Legal: próximamente.');
}

// Exponer API global

window.EmprendedorFinanzas = {
  mostrarMenu: renderMenu,
  mostrarCatalogo: renderCatalogo,
  agregarProducto,
  eliminarProducto,
  compartirProducto,
  publicarEnTienda,
  mostrarTiendaPersonal,
  mostrarAgendaFerias,
  agregarFeria,
  mostrarFinanzasPersonales,
  agregarIngreso,
  agregarGasto,
  mostrarPrecioMinimo,
  mostrarPagos,
  mostrarCuentaBancaria,
  guardarCuentaBancaria,
  mostrarSloganPitch,
  guardarSloganPitch,
  mostrarSimuladorPrecio,
  mostrarNegociacion,
  mostrarAsesoriaLegal,
};

// Inicialización automática
cargarCatalogo();
cargarAgendaFerias();
cargarCuentaBancaria();
cargarSloganPitch();
cargarFinanzas();
cargarPerfilYRegistros();

export default window.EmprendedorFinanzas;
