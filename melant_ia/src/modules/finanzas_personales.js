// Interfaz inicial completa para Finanzas Personales
function mostrarInicioFinanzas() {
  const cont = document.getElementById('app-menu');
  if (!cont) return;
  const saldo = FinanzasPersonales.saldo();
  const color = FinanzasPersonales.termometro();
  const textoTerm =
    color === 'green'
      ? 'Saludable'
      : color === 'orange'
        ? 'Atento'
        : '¡Cuidado!';
  // Gráfica simple de últimos ingresos/gastos
  const ultIngresos = FinanzasPersonales.registros
    .filter((r) => r.tipo === 'Ingreso')
    .slice(-6);
  const ultGastos = FinanzasPersonales.registros
    .filter((r) => r.tipo === 'Gasto')
    .slice(-6);
  const maxVal = Math.max(
    ...ultIngresos.map((i) => i.monto),
    ...ultGastos.map((g) => g.monto),
    1
  );
  function barra(val, col) {
    return `<div style='display:inline-block;width:${(val / maxVal) * 80}px;height:12px;background:${col};margin:2px;'></div>`;
  }
  cont.innerHTML = `
    <h2>Finanzas Personales MELANTIA</h2>
    <div style="margin-bottom:12px;">
      <b>Saldo actual:</b> <span style="color:${color};">$${saldo.toFixed(2)}</span>
      <span style="margin-left:16px;">
        <b>Termómetro:</b>
        <span style="display:inline-block;width:60px;height:16px;background:#eee;border-radius:8px;vertical-align:middle;">
          <span style="display:inline-block;width:${Math.min(Math.abs(saldo / FinanzasPersonales.sumaGastos()), 1) * 100}%;height:100%;background:${color};"></span>
        </span>
        <span style="color:${color};font-weight:bold;">${textoTerm}</span>
      </span>
    </div>
    <div>
      <b>Gráfica últimos ingresos/gastos:</b><br>
      <span style='font-size:0.95em;'>Ingresos:</span><br>${ultIngresos.map((i) => `${i.monto} ${barra(i.monto, '#0a6c2e')}`).join('')}<br>
      <span style='font-size:0.95em;'>Gastos:</span><br>${ultGastos.map((g) => `${g.monto} ${barra(g.monto, '#b91c1c')}`).join('')}
    </div>
    <div style="margin:12px 0;">
      <button onclick="FinanzasPersonales.mostrarRegistro()">Registrar Movimiento</button>
      <button onclick="FinanzasPersonales.verHistorial()">Ver Historial</button>
      <button onclick="FinanzasPersonales.verConsejos()">Consejos Personalizados</button>
      <button onclick="FinanzasPersonales.verAlertas()">Alertas Recientes</button>
      <button id="btn-voz-angel" style="margin-left:12px;background:#0a6c2e;color:#fff;">Escuchar consejo de Angel</button>
    </div>
    <div style="margin-top:10px;font-style:italic;">
      “Recuerda: una buena gestión financiera es la base de tu tranquilidad y crecimiento.”
    </div>
  `;

  // Botón de voz Angel
  setTimeout(() => {
    const btnVoz = document.getElementById('btn-voz-angel');
    if (btnVoz) {
      btnVoz.onclick = async () => {
        const { hablarMelantia } = await import('./voz_melantia.js');
        await hablarMelantia(
          'Recuerda: una buena gestión financiera es la base de tu tranquilidad y crecimiento.',
          12 // id del módulo Finanzas Personales
        );
      };
    }
  }, 100);
}

FinanzasPersonales.mostrarInicio = mostrarInicioFinanzas;
// Finanzas Personales — MELANTIA
// Gestión de presupuestos, movimientos y alcancía navideña

const presupuestos = [];
const movimientos = [];

export function registrarPresupuesto({ nombre, monto, categoria }) {
  const p = {
    id: 'presupuesto-' + Date.now(),
    nombre,
    monto,
    categoria,
    fecha: new Date().toISOString(),
  };
  presupuestos.push(p);
  return p;
}

export function registrarMovimiento({ tipo, descripcion, monto, categoria }) {
  const m = {
    id: 'mov-' + Date.now(),
    tipo, // ingreso o egreso
    descripcion,
    monto,
    categoria,
    fecha: new Date().toISOString(),
  };
  movimientos.push(m);
  return m;
}

export function obtenerPresupuestos() {
  return presupuestos;
}

export function obtenerMovimientos() {
  return movimientos;
}

export function mostrarPanelFinanzas(contenedorId = 'app-menu') {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  cont.innerHTML = `<h2>Finanzas Personales</h2>`;
  cont.innerHTML += `
    <div style='margin-bottom:18px;'>
      <button onclick="window.mostrarFormularioPresupuesto()">Registrar Presupuesto</button>
      <button onclick="window.mostrarFormularioMovimiento()">Registrar Movimiento</button>
    </div>
    <div id='finanzas-listado'></div>
  `;
  mostrarListado();
  function mostrarListado() {
    const div = document.getElementById('finanzas-listado');
    if (!div) return;
    div.innerHTML =
      `<h3>Presupuestos</h3>` +
      (presupuestos.length === 0
        ? '<p>No hay presupuestos registrados.</p>'
        : '<ul>' +
          presupuestos
            .map(
              (p) =>
                `<li><b>${p.nombre}</b> — $${p.monto} (${p.categoria})</li>`
            )
            .join('') +
          '</ul>');
    div.innerHTML +=
      `<h3>Movimientos</h3>` +
      (movimientos.length === 0
        ? '<p>No hay movimientos registrados.</p>'
        : '<ul>' +
          movimientos
            .map(
              (m) =>
                `<li><b>${m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}</b>: ${m.descripcion} — $${m.monto} (${m.categoria})</li>`
            )
            .join('') +
          '</ul>');
  }
}

window.mostrarFormularioPresupuesto = function () {
  const cont = document.getElementById('app-menu');
  if (!cont) return;
  cont.innerHTML = `<h2>Registrar Presupuesto</h2>
    <form id='form-presupuesto'>
      <label>Nombre: <input name='nombre' required></label><br>
      <label>Monto: <input name='monto' type='number' required></label><br>
      <label>Categoría: <input name='categoria'></label><br>
      <button type='submit'>Guardar</button>
      <button type='button' onclick='window.volverFinanzas()'>Cancelar</button>
    </form>
    <div id='finanzas-msg'></div>
  `;
  document.getElementById('form-presupuesto').onsubmit = function (e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    data.monto = parseFloat(data.monto);
    registrarPresupuesto(data);
    window.mostrarPanelFinanzas();
  };
};

window.mostrarFormularioMovimiento = function () {
  const cont = document.getElementById('app-menu');
  if (!cont) return;
  cont.innerHTML = `<h2>Registrar Movimiento</h2>
    <form id='form-movimiento'>
      <label>Tipo:
        <select name='tipo'>
          <option value='ingreso'>Ingreso</option>
          <option value='egreso'>Egreso</option>
        </select>
      </label><br>
      <label>Descripción: <input name='descripcion' required></label><br>
      <label>Monto: <input name='monto' type='number' required></label><br>
      <label>Categoría: <input name='categoria'></label><br>
      <button type='submit'>Guardar</button>
      <button type='button' onclick='window.volverFinanzas()'>Cancelar</button>
    </form>
    <div id='finanzas-msg'></div>
  `;
  document.getElementById('form-movimiento').onsubmit = function (e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    data.monto = parseFloat(data.monto);
    registrarMovimiento(data);
    window.mostrarPanelFinanzas();
  };
};

window.volverFinanzas = function () {
  window.mostrarPanelFinanzas();
};

// ====================
// Sección educativa mejorada MELANTIA
// ====================

export function mostrarEducacionFinanciera() {
  const cont = document.getElementById('app-menu');
  if (!cont) return;
  cont.innerHTML = `
    <h2>Educación Financiera Integral</h2>
    <h3>Objetivos</h3>
    <ul>
      <li><b>Comprender la importancia de la gestión financiera personal:</b> Una buena gestión permite tomar decisiones informadas, evitar el sobreendeudamiento y alcanzar metas personales y familiares.</li>
      <li><b>Elaborar, controlar y ajustar un presupuesto:</b> El presupuesto es la herramienta fundamental para organizar ingresos y gastos, anticipar necesidades y evitar sorpresas.</li>
      <li><b>Adoptar hábitos financieros saludables:</b> El ahorro constante, el registro de gastos y la comparación de precios generan estabilidad y crecimiento económico.</li>
      <li><b>Diferenciar entre ahorro e inversión y conocer sus riesgos:</b> Entender la diferencia permite elegir la mejor estrategia y minimizar riesgos.</li>
      <li><b>Enfrentar deudas y volver a la rentabilidad:</b> Saber manejar y reducir deudas es clave para recuperar la tranquilidad financiera y volver a crecer.</li>
    </ul>
    <h3>Temas y Ejemplos</h3>
    <ul>
      <li><b>¿Qué son las finanzas personales?</b><br>Teoría: Decisiones y acciones para administrar dinero, ingresos, gastos, ahorros e inversiones.<br>Ejemplo: Decidir si compras un celular nuevo o ahorras ese dinero para una emergencia.</li>
      <li><b>Elaboración de presupuestos</b><br>Teoría: Herramienta para planificar y controlar recursos económicos.<br>Ejemplo: Hacer una lista mensual de ingresos y gastos, y ajustar si gastas más de lo que ganas.</li>
      <li><b>Ahorro personal</b><br>Teoría: Parte del ingreso que no se gasta y se reserva para el futuro.<br>Ejemplo: Guardar una parte de tu sueldo cada mes en una cuenta separada.</li>
      <li><b>Ahorro e inversión y sus riesgos</b><br>Teoría: Ahorrar es guardar dinero, invertir es ponerlo a trabajar para generar más. Toda inversión tiene riesgos, pero se pueden minimizar informándose y diversificando.<br>Ejemplo: Ahorrar en una cuenta bancaria es seguro, invertir en un negocio puede dar más ganancias pero también puedes perder.</li>
      <li><b>Tipos de ahorro</b><br>Teoría: Líquidos (dinero disponible) y a plazo (más intereses, menos disponibilidad).<br>Ejemplo: Cuenta de ahorros vs. depósito a plazo fijo.</li>
      <li><b>Introducción a la inversión</b><br>Teoría: Destinar dinero a negocios, bienes raíces o fondos, esperando obtener una ganancia.<br>Ejemplo: Comprar acciones de una empresa, invertir en un pequeño negocio familiar.</li>
      <li><b>Control de gastos y su importancia</b><br>Teoría: Permite evitar el desperdicio de dinero y priorizar lo importante.<br>Ejemplo: Registrar todos tus gastos diarios y eliminar los innecesarios.</li>
      <li><b>Gastos innecesarios</b><br>Teoría: Compras que no aportan valor real y pueden evitarse.<br>Ejemplo: Compras impulsivas, comidas fuera de casa frecuentes.</li>
      <li><b>Manejo responsable de deudas y cómo enfrentarlas</b><br>Teoría: Prioriza las más costosas, negocia plazos y evita nuevas deudas.<br>Ejemplo: Consolidar deudas en un solo préstamo con menor interés.</li>
      <li><b>Cómo volver a ser rentables y productivos en nuestros negocios</b><br>Teoría: Rentabilidad es que los ingresos superen los gastos. Controla costos, mejora procesos y busca nuevas oportunidades.<br>Ejemplo: Analizar ventas y gastos, eliminar productos poco rentables, buscar nuevos clientes.</li>
    </ul>
    <h3>Beneficios de aprender Finanzas Personales</h3>
    <ul>
      <li><b>Mejor toma de decisiones económicas:</b> Puedes decidir con mayor seguridad en qué gastar, ahorrar o invertir, evitando errores costosos.</li>
      <li><b>Reducción del estrés financiero:</b> Tener control sobre tu dinero disminuye la ansiedad y te permite enfrentar imprevistos con mayor tranquilidad.</li>
      <li><b>Capacidad de ahorro y planificación a futuro:</b> Aprender a ahorrar te ayuda a cumplir metas como estudios, viajes o la compra de una casa.</li>
      <li><b>Mayor rentabilidad y productividad en tu negocio:</b> Aplicar principios financieros mejora la eficiencia y los resultados de tu emprendimiento.</li>
      <li><b>Resiliencia ante crisis:</b> Saber manejar deudas y ahorrar te permite recuperarte más rápido ante emergencias o pérdidas.</li>
    </ul>
    <h3>Preguntas para Reflexión</h3>
    <ul>
      <li>¿Por qué es importante llevar un registro de tus gastos?</li>
      <li>¿Qué ventajas tiene elaborar un presupuesto mensual?</li>
      <li>¿Cómo puedes empezar a ahorrar si tienes ingresos limitados?</li>
      <li>¿Qué riesgos implica no controlar tus deudas?</li>
      <li>¿Cuál es la diferencia entre ahorrar e invertir?</li>
      <li>¿Por qué es importante diversificar tus inversiones?</li>
      <li>¿Qué gastos puedes eliminar para mejorar tu economía?</li>
      <li>¿Cómo puedes enfrentar una deuda que te supera?</li>
      <li>¿Qué acciones puedes tomar para que tu negocio sea más rentable y productivo?</li>
    </ul>
    <button onclick="window.volverFinanzas()">Volver</button>
  `;
}

// Opción para menú principal (ejemplo de integración)
window.mostrarEducacionFinanciera = mostrarEducacionFinanciera;
