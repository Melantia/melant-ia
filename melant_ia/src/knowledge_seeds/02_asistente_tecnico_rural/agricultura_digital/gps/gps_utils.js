// gps_utils.js
// Módulo principal para obtener ubicación GPS y zona UTM
// Listo para integración en MELANT IA

const GPSUtils = {
  // Última posición obtenida
  posicion: {
    lat: null,
    lng: null,
    precision: null,
    utm: null,
    zona_utm: null
  },

  // Solicita la ubicación GPS al navegador
  obtenerUbicacion(callback, fallbackManual) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const precision = pos.coords.accuracy;
          const utm = GPSUtils.latLngToUTM(lat, lng);
          GPSUtils.posicion = {
            lat, lng, precision,
            utm: utm ? { x: utm.x, y: utm.y } : null,
            zona_utm: utm ? utm.zona : null
          };
          if (callback) callback(GPSUtils.posicion);
        },
        err => {
          if (fallbackManual) fallbackManual();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      if (fallbackManual) fallbackManual();
    }
  },

  // Conversión simple Lat/Lng a UTM (solo zona 17S, Ecuador, para ejemplo)
  latLngToUTM(lat, lng) {
    // Solo para demostración, para uso real usar una librería UTM completa
    // Ecuaciones simplificadas para Ecuador (zona 17S)
    const zona = 17;
    const a = 6378137.0;
    const f = 1 / 298.257223563;
    const k0 = 0.9996;
    const e = Math.sqrt(f * (2 - f));
    const lambda0 = (-81) * Math.PI / 180; // Meridiano central zona 17S
    const phi = lat * Math.PI / 180;
    const lambda = lng * Math.PI / 180;
    const N = a / Math.sqrt(1 - Math.pow(e * Math.sin(phi), 2));
    const T = Math.pow(Math.tan(phi), 2);
    const C = Math.pow(e, 2) / (1 - Math.pow(e, 2)) * Math.pow(Math.cos(phi), 2);
    const A = (lambda - lambda0) * Math.cos(phi);
    const M = a * ((1 - Math.pow(e, 2) / 4 - 3 * Math.pow(e, 4) / 64 - 5 * Math.pow(e, 6) / 256) * phi
      - (3 * Math.pow(e, 2) / 8 + 3 * Math.pow(e, 4) / 32 + 45 * Math.pow(e, 6) / 1024) * Math.sin(2 * phi)
      + (15 * Math.pow(e, 4) / 256 + 45 * Math.pow(e, 6) / 1024) * Math.sin(4 * phi)
      - (35 * Math.pow(e, 6) / 3072) * Math.sin(6 * phi));
    const x = k0 * N * (A + (1 - T + C) * Math.pow(A, 3) / 6 + (5 - 18 * T + T * T + 72 * C - 58 * Math.pow(e, 2)) * Math.pow(A, 5) / 120) + 500000;
    const y = k0 * (M + N * Math.tan(phi) * (Math.pow(A, 2) / 2 + (5 - T + 9 * C + 4 * C * C) * Math.pow(A, 4) / 24 + (61 - 58 * T + T * T + 600 * C - 330 * Math.pow(e, 2)) * Math.pow(A, 6) / 720));
    return { x, y, zona: zona + 'S' };
  }
};

// Ejemplo de uso:
// GPSUtils.obtenerUbicacion(pos => console.log(pos), () => alert('No se pudo obtener GPS. Ingrese manualmente.'));
