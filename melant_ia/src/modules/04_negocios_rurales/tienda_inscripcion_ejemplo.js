// Ejemplo de inscripción de tienda MELANTIA

/**
 * Datos requeridos para inscripción de tienda:
 * - nombreNegocio: string
 * - tipoNegocio: string (almacén, ferretería, farmacia, etc.)
 * - propietario: string
 * - contacto: string (teléfono/correo)
 * - direccion: string
 * - ubicacionGPS: { latitud, longitud }
 * - fotoFachada: string (URL/base64)
 * - medioCobro: string (cuenta bancaria, billetera digital, etc.)
 * - contratoAceptado: boolean
 * - fechaRegistro: Date
 */

function inscribirTienda(datos) {
  if (
    !datos.nombreNegocio ||
    !datos.propietario ||
    !datos.contacto ||
    !datos.ubicacionGPS ||
    !datos.fotoFachada ||
    !datos.medioCobro ||
    !datos.contratoAceptado
  ) {
    throw new Error(
      'Faltan datos obligatorios para la inscripción de la tienda.'
    );
  }
  // Guardar datos en la base de datos (simulado)
  return {
    ...datos,
    estado: 'ACTIVA',
    fechaRegistro: new Date(),
    mesesGratisRestantes: 3,
    productos: [],
  };
}

// Ejemplo de contrato (resumido)
const CONTRATO_TIENDA = `
CONTRATO DE USO DE LA PLATAFORMA MELANTIA
El negocio acepta las condiciones de uso, el pago de la mensualidad de $25 tras 3 meses gratis, y declara que los datos proporcionados son verídicos. El medio de cobro registrado será usado para transferencias directas de ventas. La plataforma no cobra comisión por venta, solo la mensualidad fija. El incumplimiento de las normas puede causar la suspensión del servicio.`;

// Ejemplo de datos de inscripción
const ejemploTienda = inscribirTienda({
  nombreNegocio: 'Ferretería El Progreso',
  tipoNegocio: 'ferretería',
  propietario: 'Juan Pérez',
  contacto: '+593999888777',
  direccion: 'Av. Central y Calle 10',
  ubicacionGPS: { latitud: -1.23456, longitud: -78.98765 },
  fotoFachada: 'data:image/jpeg;base64,...',
  medioCobro: 'Cuenta Bancaria Banco Pichincha 1234567890',
  contratoAceptado: true,
});

// Vista simulada de la tienda y productos en la app
function renderTienda(tienda) {
  return `\n=== ${tienda.nombreNegocio} ===\nPropietario: ${tienda.propietario}\nContacto: ${tienda.contacto}\nDirección: ${tienda.direccion}\nProductos publicados: ${tienda.productos.length}\nMedio de cobro: ${tienda.medioCobro}\nEstado: ${tienda.estado}\n`;
}

function renderProducto(producto) {
  return `\nProducto: ${producto.nombre}\nPrecio: $${producto.precio}\nUnidad: ${producto.unidad}\nDescripción: ${producto.descripcion}\n`;
}

// Ejemplo de visualización
console.log(renderTienda(ejemploTienda));
// Para cada producto: console.log(renderProducto(producto));
