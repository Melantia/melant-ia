// ========================================================================
// MÓDULO: Visión Artificial Cacao - Integración MELANTIA
// ========================================================================
// Propósito: Integrar visión artificial offline en módulo principal
// Capacidades: Detección plagas, madurez, calidad fermentación

export function cargarVisionArtificialCacao() {
  const contenedor =
    document.getElementById('contenedor-principal') || document.body;

  contenedor.innerHTML = `
    <div style="max-width:1200px; margin:0 auto; text-align:center; padding:40px 20px;">
      <h2 style="color:#276749; margin-bottom:16px;">
        🎥 Visión Artificial para Cultivo de Cacao
      </h2>
      <p style="color:#666; margin-bottom:24px; font-size:1.05em;">
        Sistema offline de detección de enfermedades, madurez y calidad fermentación.
      </p>
      
      <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
        <button onclick="abrirVisionArtificial()" 
          style="padding:16px 32px; background:#276749; color:#fff; border:none; 
          border-radius:8px; font-size:1em; cursor:pointer; font-weight:600;">
          🎬 Abrir Sistema Visión Artificial
        </button>
        
        <button onclick="mostrarGuiaEntrenamiento()" 
          style="padding:16px 32px; background:#4caf50; color:#fff; border:none; 
          border-radius:8px; font-size:1em; cursor:pointer; font-weight:600;">
          📚 Guía de Entrenamiento
        </button>
        
        <button onclick="window.cargarDatosModulo(null, 'Asistente Técnico Rural')" 
          style="padding:16px 32px; background:#ccc; color:#333; border:none; 
          border-radius:8px; font-size:1em; cursor:pointer;">
          ← Volver
        </button>
      </div>
    </div>
  `;
}

export function abrirVisionArtificial() {
  // Abre la interfaz de visión artificial en iframe
  const contenedor =
    document.getElementById('contenedor-principal') || document.body;

  contenedor.innerHTML = `
    <iframe 
      src="./modules/03_vision_artificial_cacao/vision_artificial_cacao.html"
      style="width:100%; height:100vh; border:none; border-radius:8px;"
      allow="camera *"
    ></iframe>
  `;
}

export function mostrarGuiaEntrenamiento() {
  const contenedor =
    document.getElementById('contenedor-principal') || document.body;

  contenedor.innerHTML = `
    <div style="max-width:900px; margin:20px auto; background:#fff; border-radius:12px; 
      box-shadow:0 4px 24px rgba(0,0,0,0.1); padding:32px 24px;">
      
      <h2 style="color:#276749; margin-bottom:24px;">
        📚 Guía: Entrenamiento Visión Artificial Cacao
      </h2>

      <div style="background:#f0f7f4; border-left:4px solid #276749; padding:16px; 
        border-radius:4px; margin-bottom:24px;">
        <strong>Objetivo:</strong> Entrenar modelo de visión artificial offline para detectar 
        plagas, madurez y calidad fermentación en cacao, sin depender de internet.
      </div>

      <h3 style="color:#276749; margin-top:24px; margin-bottom:12px;">
        🎯 Fase 1: Recolección de Dataset
      </h3>
      <div style="background:#f5f5f5; padding:16px; border-radius:8px; margin-bottom:16px; line-height:1.8;">
        <p><strong>1. Fotografiar 200+ frutos de cacao:</strong></p>
        <ul style="margin-left:20px; margin-top:8px;">
          <li>50 frutos sanos (verde, maduro amarillo)</li>
          <li>50 frutos con Monilia (podredumbre negra)</li>
          <li>50 frutos con Frosporium (mancha foliar)</li>
          <li>50 frutos con Trips (estrías helicoidales)</li>
        </ul>
        <p style="margin-top:12px;"><strong>Requisitos captura:</strong></p>
        <ul style="margin-left:20px; margin-top:8px;">
          <li>Luz natural directo (10:00-14:00 horas idealmente)</li>
          <li>Fondo neutro (cartulina blanca/gris)</li>
          <li>Distancia 20-30 cm cámara a fruto</li>
          <li>Resolución mínimo 1280×720 píxeles</li>
        </ul>
      </div>

      <h3 style="color:#276749; margin-top:24px; margin-bottom:12px;">
        🏷️ Fase 2: Etiquetado (Labeling) de Imágenes
      </h3>
      <div style="background:#f5f5f5; padding:16px; border-radius:8px; margin-bottom:16px; line-height:1.8;">
        <p><strong>Herramientas gratuitas offline:</strong></p>
        <ul style="margin-left:20px; margin-top:8px;">
          <li><strong>LabelImg:</strong> https://github.com/heartexlabs/labelImg (descargar versión standalone)</li>
          <li><strong>CVAT:</strong> https://github.com/opencv/cvat (puede ejecutarse localmente)</li>
          <li><strong>Labelbox (Community):</strong> versión local posible</li>
        </ul>
        <p style="margin-top:12px;"><strong>Proceso etiquetado:</strong></p>
        <ol style="margin-left:20px; margin-top:8px;">
          <li>Crear clases: "sano", "monilia", "frosporium", "trips"</li>
          <li>Dibujar bounding boxes alrededor de síntomas</li>
          <li>Exportar en formato YOLO (.txt) o COCO (.json)</li>
          <li>Mínimo 500 anotaciones por clase (2,000 total)</li>
        </ol>
      </div>

      <h3 style="color:#276749; margin-top:24px; margin-bottom:12px;">
        🤖 Fase 3: Entrenamiento Modelo Offline
      </h3>
      <div style="background:#f5f5f5; padding:16px; border-radius:8px; margin-bottom:16px; line-height:1.8;">
        <p><strong>Opción A: Usar Roboflow (gratuito primeros 1,000 imágenes):</strong></p>
        <ol style="margin-left:20px; margin-top:8px;">
          <li>Subir dataset etiquetado a roboflow.com (free tier)</li>
          <li>Seleccionar modelo: YOLOv8 Nano (ligero offline)</li>
          <li>Entrenar (5-10 minutos nube)</li>
          <li>Descargar modelo TensorFlow Lite (.tflite) o ONNX</li>
        </ol>
        
        <p style="margin-top:16px;"><strong>Opción B: Entrenar localmente Python (avanzado):</strong></p>
        <pre style="background:#000; color:#0f0; padding:12px; border-radius:4px; 
          overflow-x:auto; font-size:0.85em; margin-top:8px;">
pip install ultralytics opencv-python
from ultralytics import YOLO

# Entrenar YOLOv8 Nano
model = YOLO('yolov8n.pt')
results = model.train(data='data.yaml', epochs=100, imgsz=320, device=0)

# Exportar a TensorFlow Lite
model.export(format='tflite')
        </pre>
        
        <p style="margin-top:12px; color:#666; font-size:0.9em;">
          ℹ️ YOLOv8 Nano: ~6 MB, 5-10 FPS smartphone, precisión 75-85%
        </p>
      </div>

      <h3 style="color:#276749; margin-top:24px; margin-bottom:12px;">
        💾 Fase 4: Integración Modelo en PWA Offline
      </h3>
      <div style="background:#f5f5f5; padding:16px; border-radius:8px; margin-bottom:16px; line-height:1.8;">
        <p><strong>Convertir modelo a TensorFlow.js:</strong></p>
        <pre style="background:#000; color:#0f0; padding:12px; border-radius:4px; 
          overflow-x:auto; font-size:0.85em; margin-top:8px;">
# Convertir YOLOv8 a ONNX
yolo detect export model=yolov8n.pt format=onnx

# Luego convertir ONNX a TFLite
python -m onnxruntime.tools.convert_onnx_models_to_ort onnx_model.onnx

# O usar tfjs-converter
npx tfjs-converter --input_format=tf_saved_model 
  --output_format=tfjs_graph_model model/ web_model/
        </pre>
        
        <p style="margin-top:12px;"><strong>Código JavaScript integración:</strong></p>
        <pre style="background:#000; color:#0f0; padding:12px; border-radius:4px; 
          overflow-x:auto; font-size:0.85em; margin-top:8px;">
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

// Cargar modelo offline
const model = await tf.loadGraphModel(
  'indexeddb://cacao-model-yolov8n'
);

// Hacer predicción en imagen capturada
const tensor = tf.browser.fromPixels(canvas);
const predictions = await model.executeAsync(tensor);

// Procesar resultados (bounding boxes + confianza)
console.log(predictions);
        </pre>
      </div>

      <h3 style="color:#276749; margin-top:24px; margin-bottom:12px;">
        ✅ Fase 5: Validación y Ajustes
      </h3>
      <div style="background:#f5f5f5; padding:16px; border-radius:8px; margin-bottom:16px; line-height:1.8;">
        <p><strong>Pruebas de precisión:</strong></p>
        <ul style="margin-left:20px; margin-top:8px;">
          <li>Validar con 50 imágenes de prueba (no en entrenamiento)</li>
          <li>Medir: Precisión (accuracy) ≥ 85%, Recall ≥ 80%</li>
          <li>Matriz confusión: evitar falsos positivos (cosecha fruto sano)</li>
        </ul>
        
        <p style="margin-top:12px;"><strong>Mejoras iterativas:</strong></p>
        <ul style="margin-left:20px; margin-top:8px;">
          <li>Si precisión baja: agregar 100+ más imágenes enfermedad</li>
          <li>Si falsos positivos: aumentar threshold confianza 0.7 → 0.85</li>
          <li>Si lento: optimizar modelo (quantization int8)</li>
        </ul>
      </div>

      <h3 style="color:#276749; margin-top:24px; margin-bottom:12px;">
        📊 Resultados Esperados
      </h3>
      <div style="background:#f0f7f4; border:1px solid #276749; padding:16px; border-radius:8px;">
        <table style="width:100%; border-collapse:collapse;">
          <tr style="background:#f5f5f5;">
            <th style="border:1px solid #ddd; padding:12px; text-align:left;">Métrica</th>
            <th style="border:1px solid #ddd; padding:12px; text-align:left;">Valor Esperado</th>
          </tr>
          <tr>
            <td style="border:1px solid #ddd; padding:12px;">Precisión Detección</td>
            <td style="border:1px solid #ddd; padding:12px;">85-92%</td>
          </tr>
          <tr>
            <td style="border:1px solid #ddd; padding:12px;">Tiempo análisis</td>
            <td style="border:1px solid #ddd; padding:12px;">0.5-1 segundo/imagen</td>
          </tr>
          <tr>
            <td style="border:1px solid #ddd; padding:12px;">Tamaño modelo</td>
            <td style="border:1px solid #ddd; padding:12px;">6-15 MB (cabe en PWA)</td>
          </tr>
          <tr>
            <td style="border:1px solid #ddd; padding:12px;">RAM requerida</td>
            <td style="border:1px solid #ddd; padding:12px;">50-100 MB smartphone</td>
          </tr>
        </table>
      </div>

      <div style="margin-top:32px; padding:16px; background:#e3f2fd; border-radius:8px; 
        border-left:4px solid #2196f3;">
        <strong>💡 Consejo:</strong> Comenzar con 100 imágenes (25 por clase) para validar pipeline. 
        Expandir a 2,000+ según resultados. Proceso iterativo típico = 2-4 semanas.
      </div>

      <div style="margin-top:24px; text-align:center;">
        <button onclick="location.reload()" 
          style="padding:12px 24px; background:#276749; color:#fff; border:none; 
          border-radius:6px; cursor:pointer; font-weight:600;">
          ← Volver
        </button>
      </div>
    </div>
  `;
}

// ========================================================================
// DATASET LOCAL - Patrones Entrenamiento Referencia
// ========================================================================
// Este objeto contiene datos de referencia para entrenar modelos locales
export const datasetEntrenamiento = {
  versión: '1.0',
  fecha_creación: '2026-06-01',
  clases: [
    {
      nombre: 'sano',
      descripción:
        'Fruto cacao sano, color verde o amarillo uniforme, sin síntomas',
      características: {
        color_predominante: ['verde', 'amarillo', 'naranja'],
        textura: 'suave, sin manchas',
        píxeles_oscuros: '< 10%',
        uniformidad_color: '> 90%',
      },
      frecuencia_entrenamiento: 25,
      ejemplos_referencia: [
        {
          id: 'sano_001',
          descripción: 'Fruto maduro amarillo, listo cosecha',
          valores_rgb: { r_promedio: 195, g_promedio: 150, b_promedio: 80 },
          confianza_referencia: 0.98,
        },
      ],
    },
    {
      nombre: 'monilia',
      descripción: 'Podredumbre negra causada por Moniliophthora roreri',
      síntomas: ['necrosis negra', 'putrefacción', 'micelio blanco'],
      características: {
        color_predominante: 'marrón oscuro a negro',
        textura: 'blanda, hundida, mohosa',
        píxeles_oscuros: '> 30%',
        uniformidad_color: '< 50%',
      },
      frecuencia_entrenamiento: 50,
      ejemplos_referencia: [
        {
          id: 'monilia_001',
          descripción: 'Monilia avanzada, 60% fruto afectado',
          valores_rgb: { r_promedio: 60, g_promedio: 40, b_promedio: 30 },
          confianza_referencia: 0.95,
        },
        {
          id: 'monilia_002',
          descripción: 'Monilia inicial, 20% fruto',
          valores_rgb: { r_promedio: 100, g_promedio: 70, b_promedio: 50 },
          confianza_referencia: 0.88,
        },
      ],
    },
    {
      nombre: 'frosporium',
      descripción: 'Mancha foliar causada por Frosporium cacao',
      síntomas: [
        'manchas irregulares',
        'amarillamiento halo',
        'necrosis central',
      ],
      características: {
        color_predominante: 'manchas amarillas/marrones',
        textura: 'punteada, irregular',
        píxeles_claros_exceso: '> 20%',
        distribución: 'aleatoria, no uniforme',
      },
      frecuencia_entrenamiento: 50,
      ejemplos_referencia: [
        {
          id: 'frosporium_001',
          descripción: 'Frosporium en hoja, amarillamiento claro',
          valores_rgb: { r_promedio: 180, g_promedio: 160, b_promedio: 70 },
          confianza_referencia: 0.92,
        },
      ],
    },
    {
      nombre: 'trips',
      descripción: 'Daño causado por insectos trips (Frankliniella sp.)',
      síntomas: [
        'estrías helicoidales',
        'cortes finos',
        'cicatrices plateadas',
      ],
      características: {
        color_predominante: 'marrón claro con rayas',
        textura: 'rugosa, cicatrizada',
        patrón: 'líneas helicoidales características',
        severidad: '10-40% superficie',
      },
      frecuencia_entrenamiento: 25,
      ejemplos_referencia: [
        {
          id: 'trips_001',
          descripción: 'Daño moderado trips',
          valores_rgb: { r_promedio: 140, g_promedio: 110, b_promedio: 80 },
          confianza_referencia: 0.85,
        },
      ],
    },
  ],

  patrones_color: {
    verde_sano: {
      r: { min: 100, max: 180 },
      g: { min: 130, max: 200 },
      b: { min: 60, max: 120 },
    },
    amarillo_maduro: {
      r: { min: 180, max: 230 },
      g: { min: 130, max: 180 },
      b: { min: 60, max: 100 },
    },
    negro_monilia: {
      r: { min: 20, max: 80 },
      g: { min: 20, max: 70 },
      b: { min: 10, max: 60 },
    },
    gris_frosporium: {
      r: { min: 140, max: 200 },
      g: { min: 140, max: 200 },
      b: { min: 100, max: 160 },
    },
  },

  recomendaciones_captura: {
    iluminacion:
      'Luz natural directa, evitar sombras. Hora ideal: 10:00-14:00 UTC-5',
    fondo: 'Blanco o gris neutro, 20-30 cm distancia fruto',
    resolución: 'Mínimo 1280×720, idealmente 1920×1080',
    ángulo: 'Perpendicular a fruto, capturar síntomas claramente',
    cantidad: 'Mínimo 200 imágenes (50 por clase), idealmente 2,000+',
  },

  metricas_validacion: {
    precision_minima: 0.85,
    recall_minima: 0.8,
    f1_score_minima: 0.82,
    confusion_matrix_aceptable: {
      sano_predicho_monilia: '< 5%',
      monilia_predicho_sano: '< 2%',
      frosporium_predicho_sano: '< 5%',
    },
  },
};

// Función para exportar dataset referencia
export function exportarDatasetReferencia() {
  const json = JSON.stringify(datasetEntrenamiento, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dataset_entrenamiento_cacao.json';
  a.click();
}
