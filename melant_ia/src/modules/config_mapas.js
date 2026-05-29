// config_mapas.js - Configuración centralizada para mapas satelitales MELANTIA
const CONFIGURACION_MAPAS = {
  // Cambia esta URL para apuntar a tu servidor, CDN, o entorno de pruebas
  BASE_URL: 'https://mapas.melantia.com/tiles',
  // Configuración del visor
  DEFAULT_ZOOM: 16,
  MAX_ZOOM: 18,
  MIN_ZOOM: 12,
};

// Función utilitaria para obtener la URL de un tile
function obtenerUrlTile(coords) {
  return `${CONFIGURACION_MAPAS.BASE_URL}/${coords.z}/${coords.x}/${coords.y}.png`;
}

// Exportación para uso en otros módulos (si usas ES Modules)
// export { CONFIGURACION_MAPAS, obtenerUrlTile };
