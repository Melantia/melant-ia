const appStructureMelantIA = {
  app_name: "MELANTIA",
  logo: "PRODUCTIVIDAD AGROPECUARIA INTELIGENTE OFFLINE",
  funcionalidad_clave: "FUNCIONA SIN INTERNET",

  menu_principal: {
    inicio: ["Registro", "Notificaciones"],

    modulos: [
      // =====================================================
      // MÓDULO 1
      // =====================================================
      {
        id: 1,
        titulo: "Suscripciones",
        items: [
          "Gestión de Suscripciones",
          "Planes y Pagos",
          "Moneda Virtual Melantios",
        ],
      },

      // =====================================================
      // MÓDULO 2
      // =====================================================
      {
        id: 2,
        titulo: "Asistente Técnico Rural",
        voz_principal: "Angel",
        genero: "Masculino",
        items: [
          "Asistente en Cultivos",
          "Calculadora Agrícola",
          "Calendario Lunar",
          "Cronograma de Siembra",
          "Biblioteca Técnico Rural",
          "Asistente Veterinario",
          "Salud y Medicina Veterinaria",
          "Animales Menores y Mascotas",
          "Inventario Biológico",
          "Apicultura",
          "Agricultura de Precisión (Sensores)",
          "Clima Inteligente",
          "Levantamiento de Lote",
          "GPS (Medición de Terrenos)",
          "Visión Artificial (Modelos IA)",
          "Visión Satelital",
        ],
      },

      // =====================================================
      // MÓDULO 3
      // =====================================================
      {
        id: 3,
        titulo: "Gestión de Fincas y Trazabilidad",
        voz_principal: "Angel",
        genero: "Masculino",
        items: [
          "Gestión de Fincas",
          "Trazabilidad Cultivos",
          "Trazabilidad de Granjas (Cerdos, Bovinos, Caballos, Aves, Cabras)",
          "Gestión PYMES (Multi-lote y Hatos de Crianza)",
        ],
      },

      // =====================================================
      // MÓDULO 4
      // =====================================================
      {
        id: 4,
        titulo: "Negocios Rurales",
        items: [
          "Tienda MELANTIA",
          "Ventas de Gestión Productiva",
          "Bienes Raíces Rurales",
          "Monte su TIENDA VIRTUAL",
          "Oportunidades Públicas",
          "Mercado de Plátano",
        ],
      },

      // =====================================================
      // MÓDULO 5
      // =====================================================
      {
        id: 5,
        titulo: "Emprendedor",
        items: ["Emprendimientos"],
      },

      // =====================================================
      // MÓDULO 6
      // =====================================================
      {
        id: 6,
        titulo: "Proyectos",

        categorias: [
          {
            codigo: "impacto_rural",
            titulo: "Proyectos de Impacto Rural",

            proyectos: [
              "Proyecto Captura de Carbono",
              "Proyecto Saberes Ancestrales y Folklore",
              "El Tesoro de los Abuelos (Memoria Viva)",
              "Herbario Memoria Cultural",
            ],
          },

          {
            codigo: "innovacion_tecnologica",
            titulo: "Proyectos de Innovación Tecnológica",

            proyectos: [
              {
                codigo: "robotica_drones",
                titulo: "Robótica y Drones",
                subproyectos: [
                  "Micro-SaaS de Diagnóstico Temprano",
                  "Servicios de Aplicación Aérea de Ultra-precisión",
                ],
              },

              {
                codigo: "biotecnologia",
                titulo: "Biotecnología Aplicada",
                subproyectos: [
                  "Bio-fábricas de Insumos Personalizados",
                  "Sistemas Automáticos de Cultivos Celulares",
                ],
              },

              {
                codigo: "iot_conectividad",
                titulo: "Conectividad e Inteligencia de Datos",
                subproyectos: [
                  "Gemelos Digitales de Campos de Cultivo",
                  "Estaciones de Conectividad Satelital y Redes Mesh",
                ],
              },
            ],
          },
        ],
      },

      // =====================================================
      // MÓDULO 7
      // =====================================================
      {
        id: 7,
        titulo: "Escuela de Campo",
        voz_principal: "Angel",
        items: ["Cursos", "Prácticas Regenerativas"],
      },

      // =====================================================
      // MÓDULO 8
      // =====================================================
      {
        id: 8,
        titulo: "Red Social Mi Comunidad Virtual",
        items: ["Ciudadano Rural", "Asesoría Legal", "Walkie Talkie"],
      },

      // =====================================================
      // MÓDULO 9
      // =====================================================
      {
        id: 9,
        titulo: "Asistente Preventivo de Salud",
        items: [
          "Asistente Preventivo de Salud",
          "Guía de Primeros Auxilios y Respuesta Rápida",
          "Botiquín Casero Inteligente",
          "Ficha Médica / Historia Clínica",
        ],
      },

      // =====================================================
      // MÓDULO 10
      // =====================================================
      {
        id: 10,
        titulo: "Servicios Financieros MELANTIA",
        items: [
          "Apertura de Cuenta Digital",
          "Onboarding y Validación KYC",
          "Gestión de Pagos y Beneficios",
          "Simulación de Perfil Financiero",
          "Solicitar Microcrédito",
          "Transferencias y Movimientos",
          "Integración con Bancos y Cooperativas",
          "Historial y Estado de Cuenta",
        ],
      },

      // =====================================================
      // MÓDULO 11
      // =====================================================
      {
        id: 11,
        titulo: "Registro de Evidencias y Documentos",
        items: [
          "Registro de Evidencia Fotográfica",
          "Carpeta Documentos",
          "Descargar, Compartir e Imprimir",
        ],
      },

      // =====================================================
      // MÓDULO 12
      // =====================================================
      {
        id: 12,
        titulo: "Finanzas Personales",
        voz_principal: "Angel",
        items: [
          "Registro Financiero Inteligente",
          "Consejos y Alertas",
          "Termómetro Financiero",
          "Gráfica de Ingresos y Gastos",
        ],
      },
    ],
  },
};

// Compatibilidad con Node.js / CommonJS
if (typeof module !== "undefined" && module.exports) {
  module.exports = appStructureMelantIA;
}
