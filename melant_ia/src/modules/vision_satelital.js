// Panel mínimo para integración con el enrutador dinámico MELANTIA
export function mostrarPanel() {
  const cont =
    document.getElementById('contenedor-principal') ||
    document.getElementById('vista-activa') ||
    document.body;
  cont.innerHTML = `
    <div class="panel-especifico" style="max-width:760px;margin:24px auto;background:#0b0b0b;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.35);padding:24px;border:1px solid #1f2937;color:#f3f4f6;">
      <h2 style="color:#39ff14;">Visión Satelital</h2>
      <p style="color:#cbd5e1;font-size:1.02em;">Consulta NDVI por finca y genera recomendación técnica con lógica satelital.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0 12px;">
        <input id="vision-finca-id" type="number" min="1" placeholder="ID finca" style="padding:8px;border-radius:8px;border:1px solid #334155;background:#0f172a;color:#f8fafc;" />
        <button id="vision-consultar-btn" style="padding:8px 12px;border-radius:8px;border:none;background:#0ea5e9;color:#fff;cursor:pointer;">Consultar NDVI</button>
      </div>
      <div id="vision-satelital-contexto" style="margin-top:8px;color:#a5f3fc;"></div>
      <div id="vision-satelital-mensaje" style="margin-top:6px;color:#d1d5db;"></div>
      <div id="vision-satelital-imagenes" style="margin-top:14px;"></div>
      <button onclick="window.volverAlMenu && window.volverAlMenu()" style="margin-top:18px;padding:10px 16px;background:#276749;color:#fff;border:none;border-radius:8px;cursor:pointer;">← Volver</button>
    </div>
  `;

  document
    .getElementById('vision-consultar-btn')
    ?.addEventListener('click', () => {
      const fincaId = Number(
        document.getElementById('vision-finca-id')?.value || 0
      );
      abrirVisionSatelital('asistente_tecnico_rural', fincaId || null);
    });

  abrirVisionSatelital('asistente_tecnico_rural', null);
}

import { supabase, tieneConfigValida } from './supabase_config.js';
let recomendacionesFarizzio = null;
async function cargarRecomendacionesFarizzio() {
  if (recomendacionesFarizzio) return recomendacionesFarizzio;
  const resp = await fetch('./recomendaciones_farizzio.json');
  recomendacionesFarizzio = await resp.json();
  return recomendacionesFarizzio;
}
// vision_satelital.js
// Módulo dedicado para la lógica de visión satelital MELANTIA

function obtenerMensajeVision(contexto) {
  if (!contexto)
    return 'Consulta imágenes Sentinel-1 (radar) y Sentinel-2 (color/NDVI) para monitoreo agrícola y ganadero.';
  const ctx = contexto.toLowerCase();
  if (ctx.includes('bovino'))
    return 'En bovinos, la imagen satelital ayuda a monitorear pastizales, humedad y calidad de forraje.';
  if (ctx.includes('cafe'))
    return 'En café, puedes analizar vigor, estrés hídrico y sanidad de los lotes.';
  if (ctx.includes('finca'))
    return 'Consulta el estado general de tus cultivos, humedad y alertas de anomalía.';
  if (ctx.includes('asistente'))
    return 'El Asistente Técnico puede usar visión satelital para diagnóstico remoto y recomendaciones.';
  return 'Consulta imágenes Sentinel-1 (radar) y Sentinel-2 (color/NDVI) para monitoreo agrícola y ganadero.';
}

export async function abrirVisionSatelital(contexto, finca_id = null) {
  try {
    const modal = document.getElementById('modal-vision-satelital');
    document.getElementById('vision-satelital-contexto').innerHTML =
      `<b>Contexto:</b> ${contexto ? contexto.replace('_', ' ').toUpperCase() : 'General'}`;
    document.getElementById('vision-satelital-mensaje').textContent =
      obtenerMensajeVision(contexto);

    // Loader mientras se consulta la API
    document.getElementById('vision-satelital-imagenes').innerHTML =
      '<div class="loader">Cargando imagen satelital...</div>';

    if (!tieneConfigValida || !supabase) {
      document.getElementById('vision-satelital-imagenes').innerHTML =
        '<div style="color:#fcd34d;">Configura SUPABASE_URL y SUPABASE_ANON_KEY reales para activar consulta NDVI en tiempo real. La navegacion del modulo queda activa.</div>';
      return;
    }

    // --- Consulta real a Supabase: obtener la última imagen NDVI de la finca ---
    let urlImagen = null;
    let diagnostico = '';
    let tipoCultivo = 'default';
    let ndviPromedio = null;
    if (finca_id) {
      // Obtener tipo de cultivo desde la tabla fincas
      const fincaRes = await supabase
        .from('fincas')
        .select('tipo_cultivo')
        .eq('id', finca_id)
        .single();
      if (fincaRes && fincaRes.data && fincaRes.data.tipo_cultivo) {
        tipoCultivo = fincaRes.data.tipo_cultivo.toLowerCase();
      }
      const { data, error } = await supabase
        .from('mapas_satelitales')
        .select('url_mapa, tipo_mapa, fecha_generacion, ndvi_promedio')
        .eq('finca_id', finca_id)
        .eq('tipo_mapa', 'NDVI')
        .order('fecha_generacion', { ascending: false })
        .limit(1);
      if (!error && data && data.length > 0) {
        // Diagnóstico básico NDVI
        ndviPromedio = data[0].ndvi_promedio;
        if (typeof ndviPromedio === 'number') {
          if (ndviPromedio > 0.6) {
            diagnostico = 'excelente';
          } else if (ndviPromedio > 0.4) {
            diagnostico = 'observacion';
          } else {
            diagnostico = 'alerta';
          }
        } else {
          diagnostico = 'sin_diagnostico';
        }
        // Obtener URL firmada de Supabase Storage
        const { data: urlData, error: urlError } = await supabase.storage
          .from('mapas_satelitales')
          .createSignedUrl(data[0].url_mapa, 60 * 10); // 10 minutos
        if (!urlError && urlData && urlData.signedUrl) {
          urlImagen = urlData.signedUrl;
        }
      }
    }

    if (urlImagen) {
      // Recomendaciones automáticas de Farizzio según diagnóstico, cultivo y JSON
      const recFarizzio = await cargarRecomendacionesFarizzio();
      let recomendaciones = '';
      let lista =
        recFarizzio[tipoCultivo] && recFarizzio[tipoCultivo][diagnostico]
          ? recFarizzio[tipoCultivo][diagnostico]
          : recFarizzio['default'][diagnostico] || [];
      if (lista.length > 0) {
        recomendaciones = `<ul style='margin:6px 0 0 18px;'>${lista.map((r) => `<li>${r}</li>`).join('')}</ul>`;
      } else {
        recomendaciones =
          'Consulta con tu asesor técnico para recomendaciones personalizadas.';
      }
      let diagnosticoTexto = '';
      if (diagnostico === 'excelente')
        diagnosticoTexto = '🌱 Cultivo saludable: excelente vigor y cobertura.';
      else if (diagnostico === 'observacion')
        diagnosticoTexto =
          '🟡 Cultivo en observación: posible estrés hídrico o nutricional.';
      else if (diagnostico === 'alerta')
        diagnosticoTexto =
          '🔴 Alerta: baja salud vegetal, revisar plagas, riego o fertilización.';
      else diagnosticoTexto = 'No se pudo calcular el diagnóstico NDVI.';
      document.getElementById('vision-satelital-imagenes').innerHTML =
        `<img src="${urlImagen}" style="max-width:100%;border-radius:8px;" alt="Imagen Satelital NDVI" />
         <div style="margin-top:10px;font-size:1.1em;font-weight:bold;">Diagnóstico automático:</div>
         <div style="margin-top:4px;font-size:1em;">${diagnosticoTexto}</div>
         <div style="margin-top:10px;font-size:1em;color:#1e88e5;"><b>Recomendación de Farizzio:</b>${recomendaciones}</div>`;

      // === Mostrar panel de reporte y QR automáticamente ===
      import('./reporte_carbono_qr.js').then(
        ({ mostrarPanelReporteCarbonoQR }) => {
          // Datos para el reporte (ajusta según tus campos reales)
          const datosReporte = {
            potrero: tipoCultivo,
            ndvi: typeof ndviPromedio === 'number' ? ndviPromedio : '-',
            co2: '-', // Puedes calcularlo aquí si tienes área y factor
            fecha: new Date().toISOString().slice(0, 10),
            cultivoId: null, // Si tienes el id del cultivo asociado
            biomasa: '-',
            metodo: 'NDVI-Correlación',
          };
          mostrarPanelReporteCarbonoQR(datosReporte);
        }
      );
    } else {
      document.getElementById('vision-satelital-imagenes').innerHTML =
        '<div style="color:#b91c1c;">No hay imágenes válidas disponibles para esta finca.</div>';
    }

    if (modal) modal.style.display = 'block';
  } catch (e) {
    const salida = document.getElementById('vision-satelital-imagenes');
    if (salida) {
      salida.innerHTML =
        '<div style="color:#fca5a5;">No se pudo cargar la visión satelital en este momento.</div>';
    }
  }
}
