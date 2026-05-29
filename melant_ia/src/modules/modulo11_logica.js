// modulo11_logica.js

import { supabase } from './supabase_config.js'; // Configuración Supabase
import imageCompression from 'browser-image-compression';

// Compresión eficiente para fotos de evidencia
async function comprimirImagen(archivoBlob) {
  const opciones = {
    maxSizeMB: 0.5, // Máximo 500KB
    maxWidthOrHeight: 1280, // Resolución suficiente para ver detalles
    useWebWorker: true, // No congela la pantalla
    initialQuality: 0.8, // Calidad inicial del 80%
  };
  try {
    const imagenComprimida = await imageCompression(archivoBlob, opciones);
    console.log(`Peso original: ${archivoBlob.size / 1024 / 1024} MB`);
    console.log(`Peso final: ${imagenComprimida.size / 1024 / 1024} MB`);
    return imagenComprimida;
  } catch (error) {
    console.error(
      'Don Eloy dice: Fallamos al limpiar la foto, compadre.',
      error
    );
    return archivoBlob; // Si falla, retorna el original aunque sea pesado
  }
}

async function subirEvidencia(fotoBlob, datosEvidencia) {
  try {
    // 1. Comprimir la imagen antes de subir
    const fotoComprimida = await comprimirImagen(fotoBlob);
    const nombreArchivo = `evidencias/${Date.now()}_${datosEvidencia.finca_id}.jpg`;

    // 2. Subir el archivo al Storage de Supabase
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('evidencias')
      .upload(nombreArchivo, fotoComprimida);

    if (uploadError) throw uploadError;

    // 3. Insertar el registro en la tabla 'evidencias'
    const { error: dbError } = await supabase.from('evidencias').insert({
      finca_id: datosEvidencia.finca_id,
      foto_url: nombreArchivo,
      etiqueta: datosEvidencia.etiqueta,
      estado: 'pendiente_validacion',
      gps_lat: datosEvidencia.lat,
      gps_long: datosEvidencia.long,
    });

    if (dbError) throw dbError;

    DonEloy.hablar(
      '¡Listo, compadre! La evidencia ya está viajando segura hacia la bodega digital. Quedará pendiente de mi revisión.'
    );
    return true;
  } catch (error) {
    console.error('Don Eloy dice: Hubo un tropiezo al subir la info.', error);
    return false;
  }
}

// Recuerda implementar comprimirImagen o importar una librería como browser-image-compression
// export { subirEvidencia };
