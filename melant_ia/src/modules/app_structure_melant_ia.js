const appStructureMelantIA = {
  app_name: 'MELANTIA',
  logo: 'PRODUCTIVIDAD AGROPECUARIA INTELIGENTE OFFLINE',
  funcionalidad_clave: 'FUNCIONA SIN INTERNET',
  menu_principal: {
    inicio: ['Registro', 'Notificaciones'],
    modulos: [
      {
        id: 1,
        titulo: 'Suscripciones',
        items: [
          'Gestión de Suscripciones',
          'Planes y Pagos',
          'Moneda Virtual Melantios',
        ],
      },
      {
        id: 2,
        titulo: 'Asistente Técnico Rural',
        voz_principal: 'Angel',
        genero: 'Masculina',
        items: [
          'Asistente Técnico en Cultivos',
          'Asistente Técnico Veterinario',
          'Salud y Medicina Veterinaria',
          'Agricultura de Precisión (Uso de Sensores)',
          'Calculadora Agrícola',
          'Calendario Lunar',
          'Clima Inteligente',
          'Cronograma de Siembra',
          'Levantamiento de Lote',
          'Inventario de Biodiversidad',
          'GPS (Medición de Terrenos)',
          'Visión Artificial',
          'Visión Satelital',
          'Biblioteca Técnica Rural',
        ],
      },
      {
        id: 3,
        titulo: 'Gestión de Fincas y Trazabilidad',
        voz_principal: 'Angel',
        genero: 'Masculina',
        items: [
          'Gestión de Fincas',
          'Apicultura',
          'Trazabilidad Cultivos Especiales',
          'Trazabilidad de Granjas',
          'Gestión Empresarial',
        ],
      },
      {
        id: 4,
        titulo: 'Negocios Rurales',
        items: [
          'Tienda MELANTIA',
          'Ventas de Gestión Productiva',
          'Bienes Raíces Rurales',
          'Monte su TIENDA VIRTUAL',
          'Oportunidades Públicas',
          'Mercado de Plátano',
        ],
      },
      { id: 5, titulo: 'Emprendedor', items: ['Emprendimientos'] },
      {
        id: 6,
        titulo: 'Proyectos',
        items: [
          'Proyecto Captura de Carbono',
          'Proyecto Saberes Ancestrales y Folklore',
          'El Tesoro de los Abuelos (Memoria Viva)',
          'Herbario Memoria Cultural',
        ],
      },
      {
        id: 7,
        titulo: 'Escuela de Campo',
        voz_principal: 'Angel',
        items: ['Cursos', 'Prácticas Regenerativas'],
      },
      {
        id: 8,
        titulo: 'Mi Comunidad Virtual',
        items: ['Ciudadano Rural', 'Asesoría Legal', 'Walkie Talkie'],
      },
      {
        id: 9,
        titulo: 'Asistente Preventivo de Salud',
        items: [
          'Asistente Preventivo de Salud',
          'Guia de Primeros Auxilios y Respuesta Rapida',
          'Botiquín Casero Inteligente',
          'Ficha Médica / Historia Clínica',
        ],
      },
      {
        id: 10,
        titulo: 'Servicios Financieros Melantia',
        items: [
          'Apertura de Cuenta Digital',
          'Onboarding y Validación KYC',
          'Gestión de Pagos y Beneficios',
          'Simulación de Perfil Financiero',
          'Solicitar Microcrédito',
          'Transferencias y Movimientos',
          'Integración con Bancos y Cooperativas',
          'Historial y Estado de Cuenta',
        ],
      },
      {
        id: 11,
        titulo: 'Registro Evidencias y Documentos',
        items: [
          'Registro de Evidencia Fotografica',
          'Carpeta Documentos',
          'Descargar, Compartir e Imprimir',
        ],
      },
      {
        id: 12,
        titulo: 'Finanzas Personales',
        voz_principal: 'Angel',
        items: [
          'Registro Financiero Inteligente',
          'Consejos y Alertas',
          'Termómetro Financiero',
          'Gráfica de Ingresos y Gastos',
        ],
      },
    ],
  },
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = appStructureMelantIA;
}
