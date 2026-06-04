// diagnostico_salud_vision.js
// Módulo independiente para diagnóstico de salud con modelo TFLite en imágenes
// Requiere: TensorFlow.js y tfjs-tflite incluidos en index.html

// Personaliza aquí los nombres de las clases según tu modelo:
const LABELS = [
  'Fruto sano', // 0
  'Podredumbre negra', // 1
  'Barrenador del fruto', // 2
  // ...agrega más según tu modelo
];

let tfliteModel = null;

async function inferirProbabilidades(imgElement) {
  await cargarModeloTFLite();

  const inputTensor = window.tf.tidy(() =>
    window.tf.browser
      .fromPixels(imgElement)
      .resizeBilinear([224, 224])
      .toFloat()
      .div(255.0)
      .expandDims(0)
  );

  let output;
  try {
    output = tfliteModel.predict(inputTensor);
    const tensorSalida = Array.isArray(output) ? output[0] : output;

    if (!tensorSalida || typeof tensorSalida.data !== 'function') {
      return [];
    }

    const arr = Array.from(await tensorSalida.data());
    return arr;
  } finally {
    inputTensor.dispose();
    if (output && typeof output.dispose === 'function') {
      output.dispose();
    }
    if (Array.isArray(output)) {
      output.forEach((t) => {
        if (t && typeof t.dispose === 'function') t.dispose();
      });
    }
  }
}

export async function cargarModeloTFLite(url = 'ia/melantia_model.tflite') {
  if (!window.tf || !window.tflite) {
    // Carga dinámica si no están presentes
    await import('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.18.0/dist/tf.min.js');
    await import('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1/dist/tf-tflite.min.js');
  }
  if (!tfliteModel) {
    const rutas = [
      url,
      './ia/melantia_model.tflite',
      '../ia/melantia_model.tflite',
      '/ia/melantia_model.tflite',
    ];

    let ultimoError = null;
    for (const ruta of rutas) {
      try {
        tfliteModel = await window.tflite.loadTFLiteModel(ruta);
        break;
      } catch (error) {
        ultimoError = error;
      }
    }

    if (!tfliteModel && ultimoError) {
      throw ultimoError;
    }
  }
  return tfliteModel;
}

export async function diagnosticoSaludImagen(imgElement) {
  const arr = await inferirProbabilidades(imgElement);
  if (!arr.length) {
    return 'Diagnóstico no disponible';
  }

  const valorMax = Math.max(...arr);
  const idx = arr.indexOf(valorMax);
  const etiqueta = LABELS[idx] || `Clase ${idx}`;
  const confianza = (valorMax * 100).toFixed(1);
  return `${etiqueta} (confianza: ${confianza}%)`;
}

export async function diagnosticoSaludImagenDetallado(imgElement, topN = 3) {
  const arr = await inferirProbabilidades(imgElement);
  if (!arr.length) {
    return null;
  }

  const ranking = arr
    .map((valor, indice) => ({
      indice,
      etiqueta: LABELS[indice] || `Clase ${indice}`,
      score: valor,
      confianzaPct: Number((valor * 100).toFixed(1)),
    }))
    .sort((a, b) => b.score - a.score);

  return {
    mejorClase: ranking[0],
    top: ranking.slice(0, topN),
    clases: ranking,
  };
}
