// Función para integrar coordenadas GPS en un documento legal
// Reemplaza la etiqueta [UBICACION_GPS] por un bloque con los datos certificados
function integrarUbicacionGps(
  documento,
  coordenadas,
  selloGps,
  etiquetaReemplazo = '[UBICACION_GPS]'
) {
  if (!documento || typeof documento !== 'string') return documento;
  if (!coordenadas || !selloGps) return documento;

  // Construir el bloque de sello GPS
  const bloque =
    `\n${selloGps.titulo}\n` +
    `${selloGps.campos[0]}: ${coordenadas.lat}\n` +
    `${selloGps.campos[1]}: ${coordenadas.lon}\n` +
    `${selloGps.campos[2]}: ${coordenadas.parroquia}\n` +
    `${selloGps.campos[3]}: ${coordenadas.precision}\n`;

  // Reemplazar la etiqueta en el documento
  return documento.replace(etiquetaReemplazo, bloque);
}

// Ejemplo de uso:
/*
const documento = "Certifico que... [UBICACION_GPS] ...fin del documento.";
const coordenadas = {
  lat: "-0.1806",
  lon: "-78.4678",
  parroquia: "Sector Rural - Zona Norte",
  precision: "Alta (3 metros);"
};
const selloGps = {
  titulo: "DATOS DE UBICACIÓN CERTIFICADOS",
  campos: ["Latitud", "Longitud", "Referencia", "Precisión del sensor"]
};
const resultado = integrarUbicacionGps(documento, coordenadas, selloGps);
console.log(resultado);
*/
