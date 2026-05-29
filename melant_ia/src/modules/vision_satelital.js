// Panel mínimo para integración con el enrutador dinámico MELANTIA
export function mostrarPanel() {
  const cont = document.getElementById('contenedor-principal') || document.body;
  cont.innerHTML = `
    <div class="panel-especifico" style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
      <h2 style="color:#276749;">Visión Satelital</h2>
      <p style="color:#444;font-size:1.1em;">Aquí puedes consultar imágenes NDVI y reportes satelitales.</p>
      <button onclick="window.cargarDatosModulo(null, 'Asistente Técnico Rural')" style="margin-top:30px;padding:10px 24px;background:#276749;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:1em;">← Volver</button>
    </div>
  `;
}
import { supabase } from './supabase_config.js';
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
    if (!modal) return;
    document.getElementById('vision-satelital-contexto').innerHTML =
      `<b>Contexto:</b> ${contexto ? contexto.replace('_', ' ').toUpperCase() : 'General'}`;
    document.getElementById('vision-satelital-mensaje').textContent =
      obtenerMensajeVision(contexto);

    // Loader mientras se consulta la API
    document.getElementById('vision-satelital-imagenes').innerHTML =
      '<div class="loader">Cargando imagen satelital...</div>';

    // --- Consulta real a Supabase: obtener la última imagen NDVI de la finca ---
    let urlImagen = null;
    let diagnostico = '';
    let tipoCultivo = 'default';
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
        const ndvi = data[0].ndvi_promedio;
        if (typeof ndvi === 'number') {
          if (ndvi > 0.6) {
            diagnostico = 'excelente';
          } else if (ndvi > 0.4) {
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
            ndvi: typeof ndvi !== 'undefined' ? ndvi : '-',
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

    modal.style.display = 'block';
  } catch (e) {
    alert('No se pudo cargar la visión satelital. Intente más tarde.');
  }
}
