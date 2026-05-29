// tflite_salud_demo.js
// Ejemplo de integración de modelo .tflite en MELANTIA para el Asistente de Salud
// Requiere TensorFlow.js y el paquete tflite-web (https://www.npmjs.com/package/@tensorflow/tfjs-tflite)

// 1. Incluye en tu index.html:
// <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.18.0/dist/tf.min.js"></script>
// <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1/dist/tf-tflite.min.js"></script>

let tfliteModel = null;

export async function cargarModeloTFLite(url = 'ia/melantia_model.tflite') {
  if (tfliteModel) return tfliteModel;
  tfliteModel = await tflite.loadTFLiteModel(url);
  return tfliteModel;
}

// inputData debe ser un tensor o un array compatible con el modelo
export async function inferirSaludConTFLite(inputData) {
  if (!tfliteModel) throw new Error('Modelo TFLite no cargado');
  // Preprocesa inputData según lo que espera tu modelo
  // Por ejemplo, si es una imagen:
  // const input = tf.browser.fromPixels(imagen).resizeNearestNeighbor([224,224]).toFloat().expandDims(0);
  const input = inputData; // Ajusta según tu caso
  const output = tfliteModel.predict(input);
  // Postprocesa output según tu modelo (ej: argmax, labels, etc.)
  return output;
}

// Ejemplo de uso:
// await cargarModeloTFLite();
// const resultado = await inferirSaludConTFLite(input);
// console.log('Diagnóstico:', resultado);
