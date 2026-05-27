// planes_beneficios.js
// Definición centralizada de los planes y beneficios de MELANTIA

const PLANES = {
  basico: {
    id: 'basico',
    nombre: 'Básico',
    precio: 7,
    aporteAfiliado: 2,
    cupoPreventivo: 2,
    enfoque: 'Asesoria y Red',
    accesos: [
      'Asistente Rural y Vet',
      'Walkie-Talkie activo',
      'GPS de ubicación simple',
      'Asistente Guía de Salud que lleva la historia clínica (2 personas)',
      '1 reporte técnico al mes',
    ],
    valorAgregado: '',
    metaGratis: 30,
  },
  standard: {
    id: 'standard',
    nombre: 'Standard',
    precio: 14,
    aporteAfiliado: 4,
    cupoPreventivo: 6,
    enfoque: 'Producción Dual',
    accesos: [
      '2 módulos de cría',
      'Negocios rurales',
      'GPS con mapeo de 1 finca',
      'Asistente Guía de Salud que lleva la historia clínica (6 personas)',
    ],
    valorAgregado: '',
    metaGratis: 20,
  },
  premium: {
    id: 'premium',
    nombre: 'Premium',
    precio: 20,
    aporteAfiliado: 5,
    cupoPreventivo: 10,
    enfoque: 'Gestión Total',
    accesos: [
      'Todos los módulos de cría',
      'Escuela de Campo completa',
      'Gestión de hasta 4 fincas',
      'Asistente Guía de Salud que lleva la historia clínica (10 personas)',
    ],
    valorAgregado: '',
    metaGratis: 20,
  },
  profesional: {
    id: 'profesional',
    nombre: 'Empresarial',
    precio: 25,
    aporteAfiliado: 5,
    cupoPreventivo: Infinity,
    enfoque: 'Tecnología Pro',
    accesos: [
      'Agricultura Digital con sensores',
      'Asesoría legal avanzada',
      'Fincas ilimitadas + prioridad',
      'Asistente Guía de Salud que lleva la historia clínica (ilimitado)',
    ],
    valorAgregado: '',
    metaGratis: 20,
  },
  comunidad_basico: {
    id: 'comunidad_basico',
    nombre: 'Comunidad Básico',
    precio: 5,
    aporteAfiliado: 1,
    cupoPreventivo: 30,
    enfoque: 'Grupo técnico comunitario',
    accesos: [
      'Asistencia técnica básica',
      'Walkie-Talkie grupal',
      'GPS y registro productivo simplificado',
      'Servicio Comunitario, Asistente Guía de Salud que lleva la historia clínica (30 personas)',
    ],
    valorAgregado: '',
    metaGratis: 30,
  },
  comunidad_premium: {
    id: 'comunidad_premium',
    nombre: 'Comunidad Premium',
    precio: 10,
    aporteAfiliado: 1,
    cupoPreventivo: 30,
    enfoque: 'Organización elite',
    accesos: [
      'Asistente Guía de Salud ilimitado para toda la comunidad',
      'Escuela de Campo con certificaciones',
      'Legal Pro y ventas en bloque',
      'Walkie-Talkie grupal',
      'GPS y registro productivo',
      'Servicio Comunitario, Guía de Salud que lleva la historia clínica (30 personas)',
    ],
    valorAgregado: '',
    metaGratis: 20,
  },

// Planes de la Tienda Virtual MELANTIA
export const PLANES_TIENDA = {
  SEMILLA: { limite: 10, precio: 0, dias: 30, prioridad: 3, almacenamiento: '50 MB' },
  PRODUCTOR: { limite: 250, precio: 25, dias: 30, prioridad: 2, almacenamiento: '500 MB' },
  PROFESIONAL: { limite: 1000, precio: 50, dias: 30, prioridad: 1, almacenamiento: '2 GB' }
};

export default PLANES;
