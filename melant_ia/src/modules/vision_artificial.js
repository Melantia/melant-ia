// Visión Artificial MELANTIA — Detección de objetos con coco-ssd (TensorFlow.js)
// Uso: Evidencia de campo (fotos de cultivos, animales, productos)

let modeloCoco = null;

export async function cargarModeloCoco() {
  if (modeloCoco) return modeloCoco;
  if (!window.tf) {
    await import('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.18.0/dist/tf.min.js');
  }
  if (!window.cocoSsd) {
    await import('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.2/dist/coco-ssd.min.js');
  }
  modeloCoco = await window.cocoSsd.load();
  return modeloCoco;
}

export async function detectarObjetosEnImagen(imgElement, callback) {
  await cargarModeloCoco();
  if (!modeloCoco) return;
  const predicciones = await modeloCoco.detect(imgElement);
  if (typeof callback === 'function') callback(predicciones);
  return predicciones;
}

export function mostrarPanelVision(contenedorId = 'app-menu') {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  cont.innerHTML = `<h2>Visión Artificial — Evidencia de Campo</h2>
    <input type='file' id='vision-file' accept='image/*' capture='environment'><br><br>
    <canvas id='vision-canvas' style='max-width:100%;border:1px solid #ccc;'></canvas>
    <div id='vision-result'></div>
    <button onclick='window.volverVisionArtificial()'>Volver</button>
  `;
  const fileInput = document.getElementById('vision-file');
  const canvas = document.getElementById('vision-canvas');
  const ctx = canvas.getContext('2d');
  fileInput.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new window.Image();
    img.onload = async () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      document.getElementById('vision-result').innerHTML =
        'Detectando objetos...';
      const predicciones = await detectarObjetosEnImagen(img);
      predicciones.forEach((pred) => {
        ctx.strokeStyle = '#27ae60';
        ctx.lineWidth = 3;
        ctx.strokeRect(...pred.bbox);
        ctx.font = '18px Arial';
        ctx.fillStyle = '#27ae60';
        ctx.fillText(
          `${pred.class} (${(pred.score * 100).toFixed(1)}%)`,
          pred.bbox[0],
          pred.bbox[1] > 20 ? pred.bbox[1] - 8 : 12
        );
      });
      // Mapeo entre clases coco-ssd y cultivos MELANTIA
      const MAPEO_CULTIVOS = {
        banana: 'platano',
        plantain: 'platano',
        apple: 'manzano',
        orange: 'naranjo',
        carrot: 'zanahoria',
        broccoli: 'brocoli',
        'potted plant': 'cultivo_general',
      };
      const detectados = predicciones.map((p) => p.class.toLowerCase());
      let cultivoDetectado = null;
      for (const clase of detectados) {
        if (MAPEO_CULTIVOS[clase]) {
          cultivoDetectado = MAPEO_CULTIVOS[clase];
          break;
        }
      }
      let extra = '';
      if (cultivoDetectado) {
        extra = `<div style='margin-top:12px;padding:10px 16px;background:#f4f9f4;border-radius:8px;border:1px solid #b5e0b5;'>
           <b>¡Detectado cultivo de ${cultivoDetectado}!</b><br>
           ¿Qué necesitas saber de este cultivo?<br>
           <button onclick=\"window.preguntarCultivo('${cultivoDetectado}')\">Consultar información</button>
         </div>`;
      } else {
        // Si no se detecta cultivo, permitir selección manual
        extra = `<div style='margin-top:12px;padding:10px 16px;background:#fffbe6;border-radius:8px;border:1px solid #ffe58f;'>
           <b>No se detectó un cultivo específico.</b><br>
           Selecciona el cultivo para consultar información:<br>
           <select id='cultivo-manual'>
             <option value='platano'>Plátano</option>
             <option value='cacao'>Cacao</option>
             <option value='maiz'>Maíz</option>
             <option value='cafe'>Café</option>
             <option value='naranjo'>Naranjo</option>
             <option value='zanahoria'>Zanahoria</option>
             <option value='brocoli'>Brócoli</option>
             <option value='cultivo_general'>Otro</option>
           </select>
           <button onclick=\"window.preguntarCultivo(document.getElementById('cultivo-manual').value)\">Consultar información</button>
         </div>`;
      }
      document.getElementById('vision-result').innerHTML = predicciones.length
        ? `<b>Detectados:</b> ${predicciones.map((p) => `${p.class} (${(p.score * 100).toFixed(1)}%)`).join(', ')}${extra}`
        : 'No se detectaron objetos.';
      document.getElementById('vision-result').innerHTML = predicciones.length
        ? `<b>Detectados:</b> ${predicciones.map((p) => `${p.class} (${(p.score * 100).toFixed(1)}%)`).join(', ')}${extra}`
        : 'No se detectaron objetos.';
      // Interfaz interactiva para consulta de cultivos
      window.preguntarCultivo = function (cultivo) {
        const cont = document.getElementById('app-menu');
        if (!cont) return;
        cont.innerHTML = `<h2>Consulta sobre ${cultivo.charAt(0).toUpperCase() + cultivo.slice(1)}</h2>
        <p>¿Qué necesitas saber de este cultivo?</p>
        <button onclick="window.consultaCultivoInfo('${cultivo}','manejo')">Manejo y buenas prácticas</button>
        <button onclick="window.consultaCultivoInfo('${cultivo}','plagas')">Plagas y enfermedades</button>
        <button onclick="window.consultaCultivoInfo('${cultivo}','fertilizacion')">Fertilización</button>
        <button onclick="window.consultaCultivoInfo('${cultivo}','otros')">Otro</button>
        <button onclick="window.volverVisionArtificial()">Volver</button>`;
      };

      window.consultaCultivoInfo = function (cultivo, tema) {
        const cont = document.getElementById('app-menu');
        if (!cont) return;
        let info = '';
        if (cultivo === 'cacao') {
          if (tema === 'manejo')
            info =
              'El manejo del cacao incluye poda, control de sombra, y monitoreo de humedad. ¿Deseas una guía paso a paso?';
          if (tema === 'plagas')
            info =
              'Las principales plagas del cacao son monilia, escoba de bruja y mazorca negra. ¿Te gustaría ver métodos de control?';
          if (tema === 'fertilizacion')
            info =
              'El cacao requiere fertilización balanceada con NPK y micronutrientes. ¿Quieres recomendaciones específicas?';
          if (tema === 'otros')
            info =
              'Puedes consultar sobre cosecha, postcosecha, comercialización y más.';
        } else if (cultivo === 'banana' || cultivo === 'plantain') {
          if (tema === 'manejo')
            info =
              'El manejo del banano/plátano incluye deshoje, deshije, y control de riego. ¿Deseas una guía detallada?';
          if (tema === 'plagas')
            info =
              'Principales plagas: picudo negro, nematodos, sigatoka. ¿Te gustaría ver métodos de control?';
          if (tema === 'fertilizacion')
            info =
              'Fertilización: NPK, potasio y magnesio son clave. ¿Quieres ver un plan de fertilización?';
          if (tema === 'otros')
            info =
              'Puedes consultar sobre exportación, certificaciones, y más.';
        } else if (cultivo === 'maize' || cultivo === 'corn') {
          if (tema === 'manejo')
            info =
              'El manejo del maíz incluye rotación de cultivos, control de malezas y riego eficiente.';
          if (tema === 'plagas')
            info = 'Plagas comunes: gusano cogollero, pulgones, y trips.';
          if (tema === 'fertilizacion')
            info = 'Fertilización: NPK, fósforo y zinc son importantes.';
          if (tema === 'otros')
            info =
              'Puedes consultar sobre cosecha, almacenamiento, y comercialización.';
        } else if (cultivo === 'coffee') {
          if (tema === 'manejo')
            info =
              'El manejo del café incluye poda, control de sombra y manejo de malezas.';
          if (tema === 'plagas') info = 'Plagas: broca, roya, minador de hoja.';
          if (tema === 'fertilizacion')
            info = 'Fertilización: NPK, calcio y magnesio.';
          if (tema === 'otros')
            info = 'Puedes consultar sobre variedades, calidad y exportación.';
        } else {
          info = 'Consulta específica no disponible para este cultivo.';
        }
        cont.innerHTML = `<h2>Información sobre ${cultivo.charAt(0).toUpperCase() + cultivo.slice(1)}</h2><p>${info}</p><button onclick='window.volverVisionArtificial()'>Volver</button>`;
      };
    };
    img.src = URL.createObjectURL(file);
  };
}

window.volverVisionArtificial = function () {
  document.getElementById('app-menu').innerHTML = '';
};
