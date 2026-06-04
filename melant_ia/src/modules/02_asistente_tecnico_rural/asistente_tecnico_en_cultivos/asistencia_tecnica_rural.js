// =====================
// EJEMPLOS DE USO DE LOS NUEVOS SUBMÓDULOS JS
// =====================
// 1. Usar AsistenteCultivosIA (monitoreo de lotes y recomendaciones):
// import { AsistenteCultivosIA } from './asistente_cultivos.js';
// const cultivos = new AsistenteCultivosIA();
// const resultado = cultivos.iniciarMonitoreoLote('LOTE_NORTE', {lat: -1.2, lon: -78.5}, 'Cacao CCN-51');
// console.log(resultado);

// 2. Usar calcularFertilizacion (plan de fertilización):
// import { calcularFertilizacion } from './asistente_logic.js';
// // data_cultivos_json debe ser un objeto JS con la estructura de data_cultivos.json
// const plan = calcularFertilizacion('naranja', 10, data_cultivos_json);
// console.log(plan);
// =============== INTEGRACIÓN VISIÓN ARTIFICIAL (DETECCIÓN DE OBJETOS) ===============
// Requiere: ml5.js (puede usarse offline descargando el archivo y el modelo COCO-SSD)
// 1. Descarga ml5.min.js y colócalo en /assets/ui/ml5.min.js
// 2. Descarga el modelo COCO-SSD de https://github.com/ml5js/ml5-data-and-models/tree/main/models/coco-ssd y colócalo en /assets/ui/models/coco-ssd/
// 3. Incluye <script src="/assets/ui/ml5.min.js"></script> en tu index.html

// Carga el modelo COCO-SSD específicamente con la configuración 'lite' para mejor rendimiento en móviles
let detector = null;
window.addEventListener('DOMContentLoaded', () => {
  if (window.ml5 && !detector) {
    window.ml5.objectDetector(
      'cocossd',
      {
        base: 'lite_mobilenet_v2', // <--- ESTO ES LO QUE LO HACE LITE
        modelUrl: undefined, // ml5 se encarga de buscar la versión optimizada
      },
      (model) => {
        detector = model;
      }
    );
  }
});

// Crear input de imagen y canvas para mostrar la foto
function crearInputImagenAsistencia() {
  let input = document.getElementById('inputImagenAsistencia');
  if (!input) {
    input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.id = 'inputImagenAsistencia';
    input.style = 'margin-top:18px;';
    input.onchange = function (e) {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = function (ev) {
          mostrarImagenYAnalizar(ev.target.result);
        };
        reader.readAsDataURL(file);
      }
    };
    document.getElementById('view-asistencia_tecnica_rural').appendChild(input);
  }
  // Canvas para mostrar la imagen
  let canvas = document.getElementById('canvasImagenAsistencia');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'canvasImagenAsistencia';
    canvas.width = 320;
    canvas.height = 240;
    canvas.style =
      'display:block;margin-top:12px;border:1px solid #ccc;max-width:100%;';
    document
      .getElementById('view-asistencia_tecnica_rural')
      .appendChild(canvas);
  }
}

// Mostrar imagen en canvas y analizar
function mostrarImagenYAnalizar(dataUrl) {
  const canvas = document.getElementById('canvasImagenAsistencia');
  const ctx = canvas.getContext('2d');
  const img = new window.Image();
  img.onload = function () {
    // Ajustar tamaño
    canvas.width = img.width > 320 ? 320 : img.width;
    canvas.height = img.height > 240 ? 240 : img.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    analizarImagenCanvas(canvas);
  };
  img.src = dataUrl;
}

// Analizar imagen en canvas usando ml5.js
function analizarImagenCanvas(canvas) {
  if (!detector) {
    window._voz && window._voz('El modelo de detección aún no está listo.');
    return;
  }
  detector.detect(canvas, (err, results) => {
    if (err) {
      window._voz && window._voz('Error al analizar la imagen.');
      return;
    }
    const labels = results.map((r) => r.label.toLowerCase());
    if (labels.includes('cow') || labels.includes('vaca')) {
      window._voz &&
        window._voz('He detectado una vaca. ¿Qué necesita con la vaca?');
      delegarAsistencia('veterinaria');
    } else if (
      labels.includes('banana') ||
      labels.includes('plantain') ||
      labels.includes('plátano')
    ) {
      window._voz &&
        window._voz(
          'He detectado un cultivo de plátano. ¿Qué desea consultar?'
        );
      delegarAsistencia('tecnico', { cultivo: 'platano' });
    } else {
      window._voz && window._voz('No se detectó un objeto relevante.');
    }
  });
}
/**
 * Función centralizada para delegar la asistencia técnica según el contexto.
 * Cambia la voz automáticamente y llama al submódulo adecuado.
 * Uso: delegarAsistencia('veterinaria'), delegarAsistencia('tecnico', {cultivo: 'cacao'}), etc.
 */
function delegarAsistencia(contexto, extra = {}) {
  switch (contexto) {
    case 'veterinaria':
      import('./asistente_tecnico_veterinario/salud_veterinaria.js').then(
        (mod) => {
          mod.Salud.init && mod.Salud.init();
          window.cargarVoz && window.cargarVoz('Fabrizzio');
          window._voz &&
            window._voz('Bienvenido al módulo de Salud Veterinaria.');
        }
      );
      break;
    case 'tecnico':
      import('./asistente_tecnico.js').then((mod) => {
        const cultivo = extra.cultivo || 'cacao';
        mod.AsistenteTecnico.cargarDatosTrazabilidad &&
          mod.AsistenteTecnico.cargarDatosTrazabilidad(cultivo).then(
            (datos) => {
              console.log('Datos de trazabilidad:', datos);
            }
          );
        window.cargarVoz && window.cargarVoz('Fabrizzio');
        window._voz &&
          window._voz('Asistencia técnica para cultivos activada.');
      });
      break;
    case 'precision':
      import('./agricultura_digital/precision.js').then((mod) => {
        mod.Precision.sincronizar && mod.Precision.sincronizar();
        window.cargarVoz && window.cargarVoz('Valentina');
        window._voz && window._voz('Entrando a Agricultura de Precisión.');
      });
      break;
    case 'gps':
      import('./agricultura_digital/gps_utils.js').then((mod) => {
        mod.GPSUtils.obtenerUbicacion &&
          mod.GPSUtils.obtenerUbicacion((pos) => {
            console.log('Ubicación GPS:', pos);
            window.cargarVoz && window.cargarVoz('Melantia');
            window._voz && window._voz('Ubicación registrada correctamente.');
          });
      });
      break;
    default:
      window.cargarVoz && window.cargarVoz('Melantia');
      window._voz && window._voz('¿En qué área necesitas asistencia?');
  }
}
// =====================
// EJEMPLOS DE USO DESDE ASISTENCIA TECNICA RURAL
// =====================
// 1. Llamar a Salud Veterinaria (submódulo):
// import('./asistente_tecnico_veterinario/salud_veterinaria.js').then(mod => {
//   mod.Salud.init();
//   window.cargarVoz && window.cargarVoz('Fabrizzio'); // Cambia la voz según contexto
// });

// 2. Llamar a Asistente Técnico Veterinario:
// import('./asistente_tecnico.js').then(mod => {
//   mod.AsistenteTecnico.cargarDatosTrazabilidad('cacao').then(datos => {
//     console.log('Datos de trazabilidad:', datos);
//   });
//   window.cargarVoz && window.cargarVoz('Fabrizzio');
// });

// 3. Llamar a Agricultura de Precisión:
// import('./agricultura_digital/precision.js').then(mod => {
//   mod.Precision.sincronizar();
//   window.cargarVoz && window.cargarVoz('Valentina'); // O la voz definida en voces_melantia.json
// });

// 4. Llamar al GPS desde Asistente Técnico Rural (cuando sea necesario):
// import('./agricultura_digital/gps_utils.js').then(mod => {
//   mod.GPSUtils.obtenerUbicacion(pos => {
//     console.log('Ubicación GPS:', pos);
//     // Puedes usar la voz para confirmar al usuario
//     window.cargarVoz && window.cargarVoz('Melantia');
//     window._voz && window._voz('Ubicación registrada correctamente.');
//   });
// });

// 5. Cambiar la voz según el contexto (ganadería, veterinaria, cultivos, agricultura de precisión, GPS):
// window.cargarVoz('Fabrizzio'); // Veterinaria
// window.cargarVoz('Valentina'); // Agricultura de precisión
// window.cargarVoz('Melantia');  // General o GPS

// 6. Ejemplo de función centralizada para delegar según contexto:
// function delegarAsistencia(contexto) {
//   switch(contexto) {
//     case 'veterinaria':
//       import('./asistente_tecnico_veterinario/salud_veterinaria.js').then(mod => mod.Salud.init());
//       window.cargarVoz && window.cargarVoz('Fabrizzio');
//       break;
//     case 'tecnico':
//       import('./asistente_tecnico.js').then(mod => mod.AsistenteTecnico.cargarDatosTrazabilidad('cacao'));
//       window.cargarVoz && window.cargarVoz('Fabrizzio');
//       break;
//     case 'precision':
//       import('./agricultura_digital/precision.js').then(mod => mod.Precision.sincronizar());
//       window.cargarVoz && window.cargarVoz('Valentina');
//       break;
//     case 'gps':
//       import('./agricultura_digital/gps_utils.js').then(mod => mod.GPSUtils.obtenerUbicacion(pos => console.log(pos)));
//       window.cargarVoz && window.cargarVoz('Melantia');
//       break;
//     default:
//       window.cargarVoz && window.cargarVoz('Melantia');
//   }
// }
/**
 * ASISTENCIA TÉCNICA RURAL MELANTIA — ARQUITECTURA Y USO DE SUBMÓDULOS
 *
 * Este archivo es el núcleo de la asistencia técnica de la app MELANTIA.
 * Desde aquí se coordina toda la lógica de asistencia para:
 *   - Salud Veterinaria
 *   - Asistente Técnico Veterinario
 *   - Asistencia general en cultivos
 *   - Agricultura de Precisión
 *
 * El módulo GPS (ubicación y medición de terrenos) puede funcionar de forma independiente.
 *
 * INTEGRACIÓN DE SUBMÓDULOS:
 *
 * 1. Importación (vía dynamic import o window):
 *    - Salud Veterinaria: './asistente_tecnico_veterinario/salud_veterinaria.js'
 *    - Asistente Técnico Veterinario: './asistente_tecnico.js'
 *    - Agricultura de Precisión: './agricultura_digital/precision.js'
 *    - GPS: './agricultura_digital/gps_utils.js'
 *
 * 2. Ejemplo de uso desde este archivo:
 *    // Para diagnóstico veterinario:
 *    import('./asistente_tecnico_veterinario/salud_veterinaria.js').then(mod => mod.Salud.init());
 *    // Para asistencia técnica agrícola:
 *    import('./asistente_tecnico.js').then(mod => mod.AsistenteTecnico.cargarDatosTrazabilidad('cacao'));
 *    // Para funciones de agricultura de precisión:
 *    import('./agricultura_digital/precision.js').then(mod => mod.Precision.sincronizar());
 *    // Para GPS:
 *    import('./agricultura_digital/gps_utils.js').then(mod => mod.GPSUtils.obtenerUbicacion(...));
 *
 * 3. Coordinación de voces/contextos:
 *    - La voz y el personaje que responde dependen del contexto (ganadería, veterinaria, cultivos, agricultura de precisión, GPS).
 *    - La configuración de voces está en 'knowledge_seeds/voces_melantia.json'.
 *    - Ejemplo: Si el usuario está en veterinaria, usar voz Fabrizzio o la definida para ese contexto.
 *    - Para cambiar la voz: window.cargarVoz('Fabrizzio');
 *
 * 4. El Asistente Técnico Rural es el único punto de entrada para la asistencia técnica integral.
 *    - Todos los submódulos deben ser llamados/coordinados desde aquí, excepto GPS que puede ser usado aparte.
 *
 * 5. Referencias útiles:
 *    - knowledge_seeds/voces_melantia.json: configuración de voces y personajes.
 *    - modules/modulo_tecnico.js: utilidades globales y helpers técnicos.
 *
 * Mantener esta arquitectura asegura modularidad, control centralizado y experiencia de usuario coherente.
 */

// Asistencia Técnica Rural MELANT IA — Especialista en Agricultura
// Carga recomendaciones agrícolas, sensores y recursos científicos

const AsistenciaTecnica = {
  // Registrar y descargar coordenada GPS actual como archivo JSON
  registrarUbicacionGPS(nombreArchivo = 'plano_gps.json') {
    if (!window.GPSUtils) {
      alert('Módulo GPSUtils no disponible');
      return;
    }
    window.GPSUtils.obtenerUbicacion(
      (pos) => {
        const datos = {
          latitud: pos.lat,
          longitud: pos.lng,
          precision: pos.precision,
          utm_x: pos.utm?.x,
          utm_y: pos.utm?.y,
          zona_utm: pos.zona_utm,
          timestamp: new Date().toISOString(),
        };
        const blob = new Blob([JSON.stringify(datos, null, 2)], {
          type: 'application/json',
        });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = nombreArchivo;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        alert('Coordenadas descargadas como ' + nombreArchivo);
      },
      () => {
        alert('No se pudo obtener la ubicación GPS.');
      }
    );
  },
  cursos: [],
  sensores: [],
  catalogo: [],

  async cargarDatos() {
    try {
      const [cursos, sensores, catalogo] = await Promise.all([
        fetch('cursos_agricultura_precision.json').then((r) => r.json()),
        fetch('sensores_agricultura_precision.json').then((r) => r.json()),
        fetch('catalogo_sensores.json').then((r) => r.json()),
      ]);
      this.cursos = cursos;
      this.sensores = sensores;
      this.catalogo = catalogo;
    } catch (e) {
      console.warn('No se pudieron cargar los datos técnicos:', e);
    }
  },

  mostrarRecomendaciones(containerId = 'asistenciaRecomendaciones') {
    const cont = document.getElementById(containerId);
    if (!cont) return;
    let html = '';
    html += '<h2>Recomendaciones Agrícolas Inteligentes</h2>';
    html += '<ul style="margin-bottom:18px;">';
    this.cursos.forEach((curso) => {
      html += `<li><b>${curso.titulo}</b>: ${curso.descripcion}<br>`;
      html += '<span style="font-size:12px;color:#7B8F7D;">Bibliotecas: ';
      html += curso.recursos
        .map((r) => `<a href="${r.url}" target="_blank">${r.nombre}</a>`)
        .join(', ');
      html += '</span></li>';
    });
    html += '</ul>';

    html += '<h3>Sensores recomendados</h3>';
    html += '<ul>';
    this.sensores.forEach((s) => {
      html += `<li><b>${s.nombre}</b> (${s.tecnologia}): ${s.descripcion}<br>`;
      html += `<span style="font-size:12px;color:#7B8F7D;">Aplicaciones: ${s.aplicaciones.join(', ')}</span></li>`;
    });
    html += '</ul>';

    html += '<h3>Catálogo de sensores</h3>';
    html += '<ul>';
    this.catalogo.forEach((c) => {
      html += `<li><b>${c.nombre}</b> (${c.tipo}): ${c.descripcion}<br>`;
      html += `<span style="font-size:12px;color:#7B8F7D;">Modelo: ${c.modelo}, Precisión: ${c.especificaciones.precision}</span></li>`;
    });
    html += '</ul>';

    cont.innerHTML = html;
  },

  async init() {
    await this.cargarDatos();
    this.mostrarRecomendaciones();
  },
};

// Inicializar cuando se muestre la vista
document.addEventListener('DOMContentLoaded', () => {
  const view = document.getElementById('view-asistencia_tecnica_rural');
  if (view) {
    // Crear contenedor para recomendaciones
    let cont = document.getElementById('asistenciaRecomendaciones');
    if (!cont) {
      cont = document.createElement('div');
      cont.id = 'asistenciaRecomendaciones';
      view.appendChild(cont);
    }
    AsistenciaTecnica.init();

    // Crear input de imagen y canvas para análisis automático
    crearInputImagenAsistencia();

    // Crear botones de delegación contextual (personalizados)
    let btns = document.getElementById('asistenciaDelegarBtns');
    if (!btns) {
      btns = document.createElement('div');
      btns.id = 'asistenciaDelegarBtns';
      btns.style = 'margin-top:24px;display:flex;gap:12px;flex-wrap:wrap;';
      btns.innerHTML = `
        <button style="background:#276749;color:#fff;padding:12px 22px;border:none;border-radius:8px;font-size:1em;display:flex;align-items:center;gap:8px;" onclick="mostrarMensajeYDelegar('Salud Veterinaria','veterinaria')">🐮 Salud Veterinaria</button>
        <button style="background:#3B82F6;color:#fff;padding:12px 22px;border:none;border-radius:8px;font-size:1em;display:flex;align-items:center;gap:8px;" onclick="mostrarMensajeYDelegar('Asistencia en Cultivos','tecnico', {cultivo:'cacao'})">🌱 Asistencia Cultivos</button>
        <button style="background:#F59E42;color:#fff;padding:12px 22px;border:none;border-radius:8px;font-size:1em;display:flex;align-items:center;gap:8px;" onclick="mostrarMensajeYDelegar('Agricultura de Precisión','precision')">🛰️ Agricultura de Precisión</button>
        <button style="background:#6366F1;color:#fff;padding:12px 22px;border:none;border-radius:8px;font-size:1em;display:flex;align-items:center;gap:8px;" onclick="mostrarMensajeYDelegar('GPS y Medición de Terrenos','gps')">📍 GPS / Terrenos</button>
      `;
      view.appendChild(btns);
    }
    // Función para mostrar mensaje personalizado y delegar
    window.mostrarMensajeYDelegar = function (texto, contexto, extra) {
      if (window._voz) window._voz('Has seleccionado: ' + texto);
      delegarAsistencia(contexto, extra);
    };
  }
  // Exponer función de registro GPS en window
  window.registrarUbicacionGPS_Asistencia =
    AsistenciaTecnica.registrarUbicacionGPS.bind(AsistenciaTecnica);
});

// Permitir que el módulo sea cargado dinámicamente por import()
export default function () {
  // Inicialización automática si se importa como módulo
  if (typeof AsistenciaTecnica?.init === 'function') {
    AsistenciaTecnica.init();
  }
}
