// mercado_platano_controller.js
// Lógica principal para el módulo Mercado de Plátano en MELANTIA
// Permite a MELANTIA fijar precio, publicar puntos de acopio y recibir ofertas de productores

// Ejemplo de publicación semanal de MELANTIA
export const publicacionSemanal = {
  semana: '2026-05-18',
  precio_compra_caja: 8.5, // USD
  puntos_acopio: [
    {
      id: 1,
      nombre: 'Centro Acopio El Carmen',
      direccion: 'Vía principal, El Carmen',
      fecha_recepcion: '2026-05-20',
      horario: '08:00-16:00',
    },
    {
      id: 2,
      nombre: 'Centro Acopio La Concordia',
      direccion: 'Km 5, La Concordia',
      fecha_recepcion: '2026-05-21',
      horario: '09:00-15:00',
    },
  ],
  condiciones:
    'Solo plátano barraganete de exportación. Pago inmediato tras pesaje.',
};

// Ejemplo de oferta del productor
export function crearOfertaProductor({
  productor_id,
  nombre,
  cajas,
  fotos,
  punto_acopio_id,
  fecha_entrega,
}) {
  return {
    productor_id,
    nombre,
    cajas,
    fotos, // Array de URLs o blobs
    punto_acopio_id,
    fecha_entrega,
    estado: 'pendiente', // pendiente, aceptada, rechazada, entregada
    evidencia_entrega: [], // Se llena tras el pesaje
    semana: publicacionSemanal.semana,
  };
}

// Función para registrar una oferta (simulado, aquí deberías guardar en backend/Supabase)
export function registrarOferta(oferta) {
  // Aquí iría la lógica para guardar la oferta en la base de datos
  // Por ahora solo simula éxito
  return { ok: true, oferta };
}

// Función para obtener el portafolio semanal consolidado (para ofertar a chiflerías/exportadoras)
export function obtenerPortafolioSemanal(ofertas) {
  // Agrupa todas las ofertas aceptadas para la semana
  return {
    semana: publicacionSemanal.semana,
    precio_compra_caja: publicacionSemanal.precio_compra_caja,
    puntos_acopio: publicacionSemanal.puntos_acopio,
    lotes: ofertas.filter(
      (o) => o.estado === 'aceptada' || o.estado === 'entregada'
    ),
  };
}

// Puedes agregar funciones para actualizar estado, subir evidencia, etc.
