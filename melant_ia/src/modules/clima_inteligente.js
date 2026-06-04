const CLIMA_CACHE_KEY = 'melantia_clima_cache_v1';

function guardarCache(data) {
  localStorage.setItem(CLIMA_CACHE_KEY, JSON.stringify(data));
}

function leerCache() {
  try {
    const raw = localStorage.getItem(CLIMA_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function obtenerClima(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=3`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('No fue posible consultar pronostico.');
  return resp.json();
}

function sugerenciaTecnica(temp, lluvia, viento) {
  if (lluvia > 4)
    return 'Riesgo de lluvia: prioriza drenaje, evita fertilizacion foliar hoy.';
  if (temp >= 31)
    return 'Temperatura alta: programa riego temprano y monitorea estres hidrico.';
  if (viento >= 20)
    return 'Viento fuerte: evita aplicaciones foliares para reducir deriva.';
  return 'Condicion estable: ventana apta para labores de campo y monitoreo sanitario.';
}

function renderResultado(data, origen = 'en linea') {
  const actual = data?.current || {};
  const t = Number(actual.temperature_2m || 0);
  const h = Number(actual.relative_humidity_2m || 0);
  const p = Number(actual.precipitation || 0);
  const w = Number(actual.wind_speed_10m || 0);
  const sugerencia = sugerenciaTecnica(t, p, w);

  return `
    <div style="margin-top:14px;padding:14px;border-radius:10px;background:#111827;border:1px solid #334155;color:#f8fafc;">
      <div style="font-weight:700;color:#39ff14;">Estado actual (${origen})</div>
      <div style="margin-top:6px;">Temperatura: <b>${t.toFixed(1)}°C</b></div>
      <div>Humedad relativa: <b>${h.toFixed(0)}%</b></div>
      <div>Precipitacion: <b>${p.toFixed(1)} mm</b></div>
      <div>Viento: <b>${w.toFixed(1)} km/h</b></div>
      <div style="margin-top:8px;color:#bfdbfe;">${sugerencia}</div>
    </div>
  `;
}

export function mostrarPanel() {
  const contenedor =
    document.getElementById('vista-activa') ||
    document.getElementById('contenedor-principal') ||
    document.body;

  contenedor.innerHTML = `
    <div style="max-width:820px;margin:24px auto;padding:20px;border-radius:12px;border:1px solid #1f2937;background:#0b0b0b;box-shadow:0 2px 16px #0007;color:#f3f4f6;">
      <h2 style="margin-top:0;color:#39ff14;">Clima Inteligente</h2>
      <p style="color:#cbd5e1;line-height:1.5;">Consulta condiciones climaticas actuales y recomendaciones tecnicas para tu jornada.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        <input id="lat-clima" type="number" step="any" placeholder="Latitud" style="padding:8px;border-radius:8px;border:1px solid #334155;background:#0f172a;color:#f8fafc;" />
        <input id="lon-clima" type="number" step="any" placeholder="Longitud" style="padding:8px;border-radius:8px;border:1px solid #334155;background:#0f172a;color:#f8fafc;" />
        <button id="btn-geo-clima" style="padding:8px 12px;border-radius:8px;border:none;background:#0ea5e9;color:#fff;cursor:pointer;">Usar mi ubicacion</button>
        <button id="btn-consultar-clima" style="padding:8px 12px;border-radius:8px;border:none;background:#276749;color:#fff;cursor:pointer;">Consultar</button>
      </div>
      <div id="salida-clima"></div>
      <button onclick="window.volverAlMenu && window.volverAlMenu()" style="margin-top:12px;padding:8px 14px;border-radius:6px;border:none;background:#276749;color:#fff;cursor:pointer;">Volver al menu</button>
    </div>
  `;

  const salida = document.getElementById('salida-clima');
  const latInput = document.getElementById('lat-clima');
  const lonInput = document.getElementById('lon-clima');

  const cargar = async (lat, lon) => {
    if (!salida) return;
    salida.innerHTML =
      '<p style="color:#93c5fd;margin-top:12px;">Consultando clima...</p>';
    try {
      const data = await obtenerClima(lat, lon);
      guardarCache({ data, ts: new Date().toISOString(), lat, lon });
      salida.innerHTML = renderResultado(data, 'en linea');
    } catch {
      const cache = leerCache();
      if (cache?.data) {
        salida.innerHTML = renderResultado(cache.data, 'cache offline');
      } else {
        salida.innerHTML =
          '<p style="color:#fca5a5;margin-top:12px;">No fue posible obtener datos climaticos y no hay cache disponible.</p>';
      }
    }
  };

  document
    .getElementById('btn-consultar-clima')
    ?.addEventListener('click', () => {
      const lat = Number(latInput?.value || 0);
      const lon = Number(lonInput?.value || 0);
      if (!lat || !lon) {
        salida.innerHTML =
          '<p style="color:#fca5a5;margin-top:12px;">Ingresa latitud y longitud validas.</p>';
        return;
      }
      cargar(lat, lon);
    });

  document.getElementById('btn-geo-clima')?.addEventListener('click', () => {
    if (!navigator.geolocation) {
      salida.innerHTML =
        '<p style="color:#fca5a5;margin-top:12px;">Geolocalizacion no disponible.</p>';
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        latInput.value = String(lat.toFixed(6));
        lonInput.value = String(lon.toFixed(6));
        cargar(lat, lon);
      },
      () => {
        salida.innerHTML =
          '<p style="color:#fca5a5;margin-top:12px;">No se pudo obtener tu ubicacion.</p>';
      }
    );
  });
}

export default { mostrarPanel };
