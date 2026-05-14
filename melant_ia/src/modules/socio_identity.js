// Procesamiento y compresión de evidencia (foto de cédula)
export async function processEvidence(imageFile) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const reader = new FileReader();
    reader.onload = function (e) {
      img.onload = function () {
        // Redimensionar a 1000px de ancho máximo
        const scale = 1000 / img.width;
        const w = Math.min(1000, img.width);
        const h = img.height * scale;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size <= 200 * 1024) {
              resolve(blob);
            } else if (blob) {
              // Si aún supera 200KB, baja la calidad y reintenta
              canvas.toBlob((blob2) => resolve(blob2), 'image/jpeg', 0.5);
            } else {
              reject(new Error('No se pudo comprimir la imagen.'));
            }
          },
          'image/jpeg',
          0.7
        );
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });
}
// Cambia todas las etiquetas de 'Plan de Afiliados' a 'Plan de Suscripción' en este módulo si existieran

// Procesamiento y compresión de evidencia (foto de cédula)
export async function processEvidence(imageFile) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const reader = new FileReader();
    reader.onload = function (e) {
      img.onload = function () {
        // Redimensionar a 1000px de ancho máximo
        const scale = 1000 / img.width;
        const w = Math.min(1000, img.width);
        const h = img.height * scale;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size <= 200 * 1024) {
              resolve(blob);
            } else if (blob) {
              // Si aún supera 200KB, baja la calidad y reintenta
              canvas.toBlob((blob2) => resolve(blob2), 'image/jpeg', 0.5);
            } else {
              reject(new Error('No se pudo comprimir la imagen.'));
            }
          },
          'image/jpeg',
          0.7
        );
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });
}
// socio_identity.js
// Registro, validación de cédula y video-seguridad
export function init(State) {
  // Inicialización si es necesario
}

export async function registrarSocio(datos) {
  try {
    // Validar cédula, video, etc.
    // ...
    return { exito: true };
  } catch (err) {
    console.error('Registro socio error:', err);
    return { exito: false, error: err };
  }
}

export async function validarCedula(cedula) {
  try {
    // Lógica de validación
    return true;
  } catch (err) {
    console.error('Validación cédula error:', err);
    return false;
  }
}
