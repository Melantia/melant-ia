// Visión Artificial MELANTIA — Detección de objetos con coco-ssd (TensorFlow.js)
// Uso: Evidencia de campo (fotos de cultivos, animales, productos)

let modeloCoco = null;
const CLAVE_HISTORIAL_IA = 'melantia_historial_ia_cacao_v1';
const LIMITE_HISTORIAL = 20;

async function asegurarTensorFlow() {
  if (!window.tf) {
    await import('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.18.0/dist/tf.min.js');
  }
}

export async function cargarModeloCoco() {
  if (modeloCoco) return modeloCoco;
  await asegurarTensorFlow();
  if (!window.cocoSsd) {
    await import('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.2/dist/coco-ssd.min.js');
  }
  modeloCoco = await window.cocoSsd.load();
  return modeloCoco;
}

export async function procesarImagenParaIA(file, modelo, inputSize = 224) {
  if (!file) {
    throw new Error('No se recibio archivo de imagen.');
  }
  if (!modelo || typeof modelo.predict !== 'function') {
    throw new Error('Debes pasar un modelo con metodo predict().');
  }

  await asegurarTensorFlow();

  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = inputSize;
  canvas.height = inputSize;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, inputSize, inputSize);
  bitmap.close();

  const tensorEntrada = window.tf.tidy(() => {
    const pixels = window.tf.browser.fromPixels(canvas).toFloat();
    const normalizado = pixels.div(255.0);
    return normalizado.expandDims(0);
  });

  let salida;
  try {
    salida = modelo.predict(tensorEntrada);
    if (salida && typeof salida.data === 'function') {
      const valores = await salida.data();
      return Array.from(valores);
    }
    if (Array.isArray(salida)) {
      const valores = await Promise.all(
        salida.map(async (t) =>
          t && typeof t.data === 'function' ? Array.from(await t.data()) : t
        )
      );
      return valores;
    }
    return salida;
  } finally {
    tensorEntrada.dispose();
    if (salida && typeof salida.dispose === 'function') {
      salida.dispose();
    }
    if (Array.isArray(salida)) {
      salida.forEach((t) => {
        if (t && typeof t.dispose === 'function') t.dispose();
      });
    }
  }
}

export async function detectarObjetosEnImagen(imgElement, callback) {
  await cargarModeloCoco();
  if (!modeloCoco) return;
  const predicciones = await modeloCoco.detect(imgElement);
  if (typeof callback === 'function') callback(predicciones);
  return predicciones;
}

export async function mostrarPanel() {
  const contenedor = document.getElementById('contenedor-principal');
  if (!contenedor) return;

  contenedor.innerHTML = `
    <div class="modulo-activo" style="max-width:680px;margin:0 auto;padding:20px;">
      <h2>IA: Diagnóstico de Cacao</h2>
      <input type="file" id="subir-foto" accept="image/*">
      <div id="resultado-ia" style="margin-top:20px;font-weight:bold;"></div>
      <div id="detalle-ia" style="margin-top:14px;"></div>
      <div id="historial-ia" style="margin-top:14px;"></div>
    </div>
  `;

  const inputArchivo = document.getElementById('subir-foto');
  if (inputArchivo) {
    inputArchivo.addEventListener('change', clasificarImagen);
  }

  renderizarHistorial();
}

function cargarHistorial() {
  try {
    const raw = localStorage.getItem(CLAVE_HISTORIAL_IA);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function guardarEnHistorial(registro) {
  const historial = cargarHistorial();
  historial.unshift(registro);
  const limitado = historial.slice(0, LIMITE_HISTORIAL);
  localStorage.setItem(CLAVE_HISTORIAL_IA, JSON.stringify(limitado));
}

function limpiarHistorial() {
  localStorage.removeItem(CLAVE_HISTORIAL_IA);
  renderizarHistorial();
}

function exportarHistorialJSON() {
  const historial = cargarHistorial();
  if (!historial.length) return;

  const payload = {
    modulo: 'vision_artificial_cacao',
    generado_en: new Date().toISOString(),
    total_registros: historial.length,
    registros: historial,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });

  const fecha = new Date().toISOString().slice(0, 10);
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(blob);
  enlace.download = `melantia_historial_ia_cacao_${fecha}.json`;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(enlace.href);
}

function renderizarHistorial() {
  const historialDiv = document.getElementById('historial-ia');
  if (!historialDiv) return;

  const historial = cargarHistorial();
  if (!historial.length) {
    historialDiv.innerHTML = `
      <div style="border:1px dashed #d1d9d2;border-radius:10px;padding:12px;background:#fafcfb;color:#456;">
        <div style="font-weight:700;color:#2f4f3e;margin-bottom:6px;">Historial offline</div>
        <div style="font-size:13px;">Sin diagnósticos guardados todavía.</div>
      </div>
    `;
    return;
  }

  historialDiv.innerHTML = `
    <div style="border:1px solid #d7e3d9;border-radius:10px;padding:12px;background:#ffffff;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;gap:8px;">
        <div style="font-weight:700;color:#1f4d32;">Historial offline (${historial.length})</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;">
          <button id="btn-exportar-historial-ia" style="border:1px solid #9ec5a6;background:#edf7ef;color:#1f4d32;border-radius:8px;padding:6px 10px;cursor:pointer;font-size:12px;">Exportar JSON</button>
          <button id="btn-limpiar-historial-ia" style="border:1px solid #c6d5c8;background:#f5faf6;color:#1f4d32;border-radius:8px;padding:6px 10px;cursor:pointer;font-size:12px;">Limpiar</button>
        </div>
      </div>
      ${historial
        .map(
          (item) => `
            <div style="border-top:1px solid #eef3ef;padding:8px 0;">
              <div style="font-size:13px;color:#1f3b2a;font-weight:600;">${item.etiqueta} (${item.confianzaPct}%)</div>
              <div style="font-size:12px;color:#586a5a;">Severidad: ${item.severidad}</div>
              <div style="font-size:12px;color:#667;">${item.fecha}</div>
            </div>
          `
        )
        .join('')}
    </div>
  `;

  const btnLimpiar = document.getElementById('btn-limpiar-historial-ia');
  const btnExportar = document.getElementById('btn-exportar-historial-ia');

  if (btnExportar) {
    btnExportar.addEventListener('click', exportarHistorialJSON);
  }

  if (btnLimpiar) {
    btnLimpiar.addEventListener('click', limpiarHistorial);
  }
}

function obtenerReglaDiagnostico(etiqueta) {
  const base = String(etiqueta || '').toLowerCase();

  if (base.includes('sano')) {
    return {
      nivel: 'BAJO',
      colorFondo: '#e8f5e9',
      colorBorde: '#2e7d32',
      colorTexto: '#1b5e20',
      recomendacion: 'Fruto apto para cosecha. Mantener monitoreo semanal.',
      accion: 'Continuar manejo preventivo y registro fotográfico.',
    };
  }

  if (base.includes('barrenador')) {
    return {
      nivel: 'MEDIO',
      colorFondo: '#fff3e0',
      colorBorde: '#ef6c00',
      colorTexto: '#bf360c',
      recomendacion:
        'Aislar frutos afectados y reforzar control focalizado de plaga.',
      accion: 'Inspeccionar lote cada 3-5 días y retirar daño avanzado.',
    };
  }

  if (base.includes('podredumbre')) {
    return {
      nivel: 'ALTO',
      colorFondo: '#ffebee',
      colorBorde: '#c62828',
      colorTexto: '#b71c1c',
      recomendacion:
        'Retirar y descartar fruto enfermo de inmediato para cortar diseminación.',
      accion: 'Aplicar protocolo sanitario y seguimiento diario del foco.',
    };
  }

  return {
    nivel: 'OBSERVACION',
    colorFondo: '#eceff1',
    colorBorde: '#546e7a',
    colorTexto: '#37474f',
    recomendacion: 'Resultado no categorizado. Validar con revisión técnica.',
    accion: 'Tomar nuevas imágenes con mejor luz para confirmar diagnóstico.',
  };
}

async function clasificarImagen(event) {
  const file = event?.target?.files?.[0];
  const resultadoDiv = document.getElementById('resultado-ia');
  const detalleDiv = document.getElementById('detalle-ia');
  if (!file || !resultadoDiv || !detalleDiv) return;

  // 1. Cargar imagen local
  const imgElement = document.createElement('img');
  const imageUrl = URL.createObjectURL(file);
  imgElement.src = imageUrl;

  try {
    await imgElement.decode();

    resultadoDiv.innerText = 'Analizando imagen con modelo real...';
    detalleDiv.innerHTML = '';

    const diagnosticoMod = await import('./diagnostico_salud_vision.js');
    const detalle = await diagnosticoMod.diagnosticoSaludImagenDetallado(
      imgElement,
      3
    );

    if (!detalle || !detalle.mejorClase) {
      resultadoDiv.innerText = 'Diagnóstico no disponible.';
      return;
    }

    const regla = obtenerReglaDiagnostico(detalle.mejorClase.etiqueta);
    resultadoDiv.innerHTML = `
      <div style="border-left:6px solid ${regla.colorBorde};background:${regla.colorFondo};color:${regla.colorTexto};padding:12px 14px;border-radius:10px;">
        <div style="font-size:16px;font-weight:700;">Resultado IA: ${detalle.mejorClase.etiqueta}</div>
        <div style="font-size:14px;margin-top:4px;">Confianza: ${detalle.mejorClase.confianzaPct}% | Severidad: ${regla.nivel}</div>
        <div style="font-size:14px;margin-top:8px;"><b>Recomendación:</b> ${regla.recomendacion}</div>
        <div style="font-size:13px;margin-top:4px;"><b>Acción sugerida:</b> ${regla.accion}</div>
      </div>
    `;

    // Tensor de verificación para mantener trazabilidad del preprocesado en este módulo
    const tensor = tf.tidy(() =>
      tf.browser
        .fromPixels(imgElement)
        .resizeNearestNeighbor([224, 224])
        .toFloat()
        .div(255.0)
        .expandDims(0)
    );
    console.log('Tensor de entrada generado:', tensor.shape);
    tensor.dispose();

    detalleDiv.innerHTML = `
      <div style="border:1px solid #d7e3d9;border-radius:10px;padding:12px;background:#f7fbf8;">
        <div style="font-weight:700;color:#1f4d32;margin-bottom:10px;">Top 3 clases</div>
        ${detalle.top
          .map(
            (item) => `
              <div style="margin-bottom:10px;">
                <div style="display:flex;justify-content:space-between;font-size:14px;color:#234;">
                  <span>${item.etiqueta}</span>
                  <span>${item.confianzaPct}%</span>
                </div>
                <div style="height:9px;background:#e6ece7;border-radius:999px;overflow:hidden;">
                  <div style="height:100%;width:${item.confianzaPct}%;background:linear-gradient(90deg,#2e7d32,#66bb6a);"></div>
                </div>
              </div>
            `
          )
          .join('')}
      </div>
    `;

    guardarEnHistorial({
      etiqueta: detalle.mejorClase.etiqueta,
      confianzaPct: detalle.mejorClase.confianzaPct,
      severidad: regla.nivel,
      fecha: new Date().toLocaleString('es-EC'),
    });
    renderizarHistorial();
  } catch (error) {
    resultadoDiv.innerText =
      'No se pudo ejecutar el modelo. Verifica ia/melantia_model.tflite y dependencias tfjs-tflite.';
    detalleDiv.innerHTML = '';
    console.error('Error en clasificarImagen:', error);
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

window.volverVisionArtificial = function () {
  document.getElementById('app-menu').innerHTML = '';
};

// La inferencia real se ejecuta al subir imagen en clasificarImagen().
