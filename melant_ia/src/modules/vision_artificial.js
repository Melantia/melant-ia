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

export function mostrarPanel() {
  return mostrarPanelVision('app-menu');
}

window.volverVisionArtificial = function () {
  document.getElementById('app-menu').innerHTML = '';
};

// Diagnóstico offline con TFLite (modular, no altera lógica principal)
import('./diagnostico_salud_vision.js').then(async (mod) => {
  if (mod.diagnosticoSaludImagen) {
    document.getElementById('vision-result').innerHTML +=
      '<br>Ejecutando diagnóstico offline...';
    const resultado = await mod.diagnosticoSaludImagen(img);
    document.getElementById('vision-result').innerHTML +=
      `<br><b>Diagnóstico IA offline:</b> ${resultado}`;
  }
});
