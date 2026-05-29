// Escuela de Campo — Cursos y Prácticas Regenerativas MELANTIA
// Panel JS para mostrar cursos y prácticas, con distinción de acceso según suscripción

// Catálogo extendido de cursos/prácticas (solo nombres y metadatos básicos, carga bajo demanda)
const catalogoCursos = [
  {
    nombre: 'Agricultura Regenerativa: Fundamentos',
    descripcion:
      'Principios y prácticas para restaurar la salud del suelo y la biodiversidad.',
    acceso: 'libre',
  },
  {
    nombre: 'Transición del Cultivo de Maíz a Regenerativo',
    descripcion:
      'Guía paso a paso para transformar un sistema convencional de maíz en uno regenerativo.',
    acceso: 'libre',
  },
  {
    nombre: 'Fertilización Orgánica y Bioinsumos',
    descripcion:
      'Elaboración y aplicación de fertilizantes naturales y bioinsumos.',
    acceso: 'premium',
  },
  {
    nombre: 'Control Biológico de Plagas y Enfermedades',
    descripcion:
      'Estrategias ecológicas para el manejo de plagas y enfermedades.',
    acceso: 'premium',
  },
  {
    nombre: 'Manejo Regenerativo de Suelos',
    descripcion: 'Técnicas para mejorar la estructura y fertilidad del suelo.',
    acceso: 'profesional',
  },
  {
    nombre: 'Agroforestería Dinámica',
    descripcion: 'Diseño y manejo de sistemas agroforestales regenerativos.',
    acceso: 'premium',
  },
  {
    nombre: 'Microorganismos Eficientes',
    descripcion:
      'Uso de microorganismos para mejorar la fertilidad y sanidad del suelo.',
    acceso: 'profesional',
  },
  {
    nombre: 'Gestión Regenerativa del Agua',
    descripcion: 'Captación, infiltración y conservación de agua en la finca.',
    acceso: 'profesional',
  },
  {
    nombre: 'Producción de Semillas Nativas',
    descripcion:
      'Multiplicación y conservación de semillas adaptadas localmente.',
    acceso: 'premium',
  },
  {
    nombre: 'Manejo Integrado de Malezas',
    descripcion: 'Control ecológico y regenerativo de malezas.',
    acceso: 'libre',
  },
];

const catalogoPracticas = [
  {
    nombre: 'Cobertura Vegetal y Mulching',
    descripcion:
      'Uso de coberturas vivas y mulching para proteger y enriquecer el suelo.',
    acceso: 'libre',
  },
  {
    nombre: 'Rotación y Diversificación de Cultivos',
    descripcion:
      'Cómo planificar rotaciones y asociaciones para maximizar la resiliencia.',
    acceso: 'libre',
  },
  {
    nombre: 'Compostaje y Biofertilizantes',
    descripcion: 'Producción y uso de compost y biofertilizantes líquidos.',
    acceso: 'premium',
  },
  {
    nombre: 'Manejo Regenerativo del Agua',
    descripcion:
      'Prácticas para captar, infiltrar y conservar agua en la finca.',
    acceso: 'profesional',
  },
  {
    nombre: 'Siembra Directa y Labranza Cero',
    descripcion:
      'Reducción de laboreo para mejorar estructura y vida del suelo.',
    acceso: 'premium',
  },
  {
    nombre: 'Biochar y Carbón Vegetal',
    descripcion: 'Producción y uso de biochar para suelos regenerativos.',
    acceso: 'profesional',
  },
  {
    nombre: 'Bancos de Proteína y Forrajes',
    descripcion:
      'Establecimiento de bancos forrajeros para sistemas integrados.',
    acceso: 'premium',
  },
  {
    nombre: 'Manejo Regenerativo de Pasturas',
    descripcion: 'Rotación y pastoreo racional para suelos y animales sanos.',
    acceso: 'profesional',
  },
];

// Panel con carga bajo demanda: solo renderiza los primeros 3, el resto bajo demanda
export function mostrarPanel(contenedorId = 'app-menu', tipo = 'cursos') {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  cont.innerHTML = `
    <h2>${tipo === 'practicas' ? 'Prácticas Regenerativas' : 'Cursos de Agricultura Regenerativa'}</h2>
    <div id="panel-cursos-practicas"></div>
    <button id="btn-cargar-mas" class="btn-melantia">Cargar más</button>
    <div style="margin-top:18px;font-size:0.95em;color:#555;">
      <b>Acceso libre:</b> Disponible para todos los usuarios.<br>
      <b>Premium:</b> Solo con suscripción Premium.<br>
      <b>Profesional/Empresarial:</b> Solo con suscripción Profesional o Empresarial.
    </div>
  `;
  const lista = tipo === 'practicas' ? catalogoPracticas : catalogoCursos;
  let mostrados = 3;
  renderLista();
  document.getElementById('btn-cargar-mas').onclick = () => {
    mostrados = Math.min(mostrados + 3, lista.length);
    renderLista();
  };
  function renderLista() {
    const panel = document.getElementById('panel-cursos-practicas');
    panel.innerHTML = lista
      .slice(0, mostrados)
      .map(
        (c) => `
      <div class='card-curso' style='border:1px solid #ccc;border-radius:8px;padding:12px;margin-bottom:12px;background:#fafafa;'>
        <b>${c.nombre}</b><br>
        <span>${c.descripcion}</span><br>
        <span style='color:#00796b;font-weight:bold;'>${c.acceso === 'libre' ? 'Acceso libre' : c.acceso.charAt(0).toUpperCase() + c.acceso.slice(1)}</span>
        <button class='btn-melantia' style='float:right;margin-top:-28px;' onclick="window.verDetalleCurso('${c.nombre.replace(/'/g, "\\'")}')">Ver Detalle</button>
      </div>
    `
      )
      .join('');
    document.getElementById('btn-cargar-mas').style.display =
      mostrados < lista.length ? 'block' : 'none';
  }
}

window.verDetalleCurso = function (nombre) {
  alert(
    'Detalle del curso/práctica: ' +
      nombre +
      '\n(Contenido disponible según tu suscripción)'
  );
};
