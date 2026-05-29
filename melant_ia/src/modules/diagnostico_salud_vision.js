// diagnostico_salud_vision.js
// Módulo independiente para diagnóstico de salud con modelo TFLite en imágenes
// Requiere: TensorFlow.js y tfjs-tflite incluidos en index.html

// Personaliza aquí los nombres de las clases según tu modelo:
const LABELS = [
  'Sano', // 0
  'Plaga', // 1
  'Virus', // 2
  // ...agrega más según tu modelo
];

let tfliteModel = null;

export async function cargarModeloTFLite(url = 'ia/melantia_model.tflite') {
  if (!window.tf || !window.tflite) {
    // Carga dinámica si no están presentes
    await import('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.18.0/dist/tf.min.js');
    await import('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1/dist/tf-tflite.min.js');
  }
  if (!tfliteModel) {
    tfliteModel = await window.tflite.loadTFLiteModel(url);
  }
  return tfliteModel;
}

export async function diagnosticoSaludImagen(imgElement) {
  await cargarModeloTFLite();
  // Preprocesar imagen (ajusta tamaño según tu modelo)
  const inputTensor = tf.browser
    .fromPixels(imgElement)
    .resizeNearestNeighbor([224, 224])
    .toFloat()
    .expandDims(0); // [1,224,224,3]
  const output = tfliteModel.predict(inputTensor);
  // Postprocesa output según tu modelo (ejemplo: argmax)
  if (output && output.dataSync) {
    const arr = output.dataSync();
    const idx = arr.indexOf(Math.max(...arr));
    const etiqueta = LABELS[idx] || `Clase ${idx}`;
    return `${etiqueta} (score: ${arr[idx].toFixed(2)})`;
  }
  return 'Diagnóstico no disponible';
}
