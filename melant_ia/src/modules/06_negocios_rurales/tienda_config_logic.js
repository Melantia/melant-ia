// Carga y validación de configuración avanzada para Tienda MELANTIA
// Integra reglas de identidad, comercial, emprendedor y gestión empresarial desde tienda_config.json

const fs = require('fs');
const path = require('path');

const tiendaConfigPath = path.join(
  __dirname,
  '../config_structure_melant_ia/tienda_config.json'
);
let tiendaConfig = {};
try {
  tiendaConfig = JSON.parse(fs.readFileSync(tiendaConfigPath, 'utf8'));
} catch (e) {
  console.error('No se pudo cargar tienda_config.json:', e);
}

// --- Validación de Emprendedor ---
function validarEmprendedor(usuario, productosActuales) {
  const reglas = tiendaConfig.emprendedor;
  if (!usuario.plan || usuario.plan !== reglas.plan_requerido) {
    throw new Error(
      'Debe tener el plan BÁSICO activo para publicar productos y usar la tienda.'
    );
  }
  if (!usuario.alDia) {
    throw new Error(
      'Debe estar al día en su suscripción para usar la app y sus beneficios.'
    );
  }
  if (productosActuales >= reglas.max_productos) {
    throw new Error(
      `Solo puede publicar hasta ${reglas.max_productos} productos en la tienda MELANTIA.`
    );
  }
  return true;
}

// --- Generador de etiqueta digital ---
function generarEtiqueta(nombre) {
  const estilo =
    tiendaConfig.identidad.estilo_etiqueta_por_defecto || 'Minimalista';
  // Aquí se podría integrar una librería de generación de imágenes
  return {
    nombre,
    icono: '🌱',
    estilo,
    descripcion: tiendaConfig.identidad.sugerencia_etiqueta,
  };
}

// --- Compartir vitrina por WhatsApp ---
function obtenerMensajeCompartir(nombre, link) {
  const plantilla =
    tiendaConfig.comercial.boton_compartir_vitrina.mensaje_whatsapp;
  return plantilla.replace('[Nombre]', nombre).replace('[Link]', link);
}

// --- Semáforo de gastos ---
function calcularSemaforoGastos(ventas, gastos) {
  if (ventas > gastos) return 'verde';
  if (ventas < gastos) return 'rojo';
  return 'amarillo';
}

// --- Asistente de precios ---
function sugerirPrecioMinimo(gastos, unidades) {
  if (!unidades || unidades <= 0) return 0;
  return Math.ceil(gastos / unidades);
}

module.exports = {
  tiendaConfig,
  validarEmprendedor,
  generarEtiqueta,
  obtenerMensajeCompartir,
  calcularSemaforoGastos,
  sugerirPrecioMinimo,
};
