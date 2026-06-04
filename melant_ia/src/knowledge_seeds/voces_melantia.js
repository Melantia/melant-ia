// Espejo JS de voces_melantia.json para entornos donde fetch a JSON falle.

export const VOCES_MELANTIA_CONFIG = {
  configuracion_general: {
    app_name: 'MELANTIA',
    modo: 'Offline',
    formato_audio: 'mp3',
  },
  interfaz_inicio: {
    registro: {
      voz: 'Melantia',
      genero: 'Femenina',
    },
    notificaciones: {
      voz: 'Melantia',
      genero: 'Femenina',
    },
  },
  modulos: [
    {
      nombre_global: 'MelantiaAsistente',
      voz_principal: 'Melantia',
      genero: 'Femenina',
    },
    {
      nombre_global: 'MelantiaComandosVoz',
      voz_principal: 'Melantia',
      genero: 'Femenina',
    },
    {
      nombre_global: 'GestorGranjasMelantia',
      voz_principal: 'Angel',
      genero: 'Masculina',
    },
    {
      nombre_global: 'SuscripcionesMelantia',
      voz_principal: 'Melantio',
      genero: 'Masculina',
    },
    {
      nombre_global: 'AsistenteTecnicoRural',
      voz_principal: 'Fabrizzio',
      genero: 'Masculina',
    },
    {
      nombre_global: 'TrazabilidadMelantia',
      voz_principal: 'Angel',
      genero: 'Masculina',
    },
    {
      nombre_global: 'NegociosRuralesMelantia',
      voz_principal: 'Don Eloy',
      genero: 'Masculina',
    },
    {
      nombre_global: 'FinanzasPersonalesMelantia',
      voz_principal: 'Angel',
      genero: 'Masculina',
    },
    {
      nombre_global: 'ProyectosMelantia',
      voz_principal: 'Don Eloy',
      genero: 'Masculina',
    },
    {
      nombre_global: 'EscuelaCampoMelantia',
      voz_principal: 'Fabrizzio',
      genero: 'Masculina',
    },
    {
      nombre_global: 'ComunidadVirtualMelantia',
      voz_principal: 'Don Eloy',
      genero: 'Masculina',
    },
    {
      nombre_global: 'SaludPreventivaMelantia',
      voz_principal: 'Paulette',
      genero: 'Femenina',
    },
    {
      nombre_global: 'ServiciosFinancierosMelantia',
      voz_principal: 'Paulette',
      genero: 'Femenina',
    },
    {
      nombre_global: 'RegistroEvidenciasMelantia',
      voz_principal: 'Melantia',
      genero: 'Femenina',
    },
    {
      id: 1,
      titulo: 'Sistema de Suscripciones',
      voz_principal: 'Melantio',
      genero: 'Masculina',
      funciones: {
        sistema_recompensas: { voz: 'Melantio', genero: 'Masculina' },
      },
    },
    {
      id: 2,
      titulo: 'Asistente Técnico Rural',
      voz_principal: 'Fabrizzio',
      genero: 'Masculina',
      funciones: {
        agricultura_precision: { voz: 'Fabrizzio', genero: 'Masculina' },
        medicina_salud_veterinaria: { voz: 'Valentina', genero: 'Femenina' },
        asistente_tecnico_veterinario: { voz: 'Jorge', genero: 'Masculina' },
        gps_medicion_terrenos: { voz: 'Valentina', genero: 'Femenina' },
      },
    },
    {
      id: 3,
      titulo: 'Gestión de Fincas y Trazabilidad',
      voz_principal: 'Angel',
      genero: 'Masculina',
      funciones: {
        gestion_granjas: { voz: 'Angel', genero: 'Masculina' },
        gestion_fincas: { voz: 'Angel', genero: 'Masculina' },
        gestion_empresarial: { voz: 'Angel', genero: 'Masculina' },
      },
    },
    {
      id: 4,
      titulo: 'Negocios Rurales',
      voz_principal: 'Don Eloy',
      genero: 'Masculina',
      funciones: {
        tienda_melantia: { voz: 'Don Eloy', genero: 'Masculina' },
        ventas_gestion_productiva: { voz: 'Angel', genero: 'Masculina' },
        bienes_raices_rurales: { voz: 'Don Eloy', genero: 'Masculina' },
      },
    },
    {
      id: 5,
      titulo: 'Emprendedor y Finanzas Personales',
      voz_principal: 'Angel',
      genero: 'Masculina',
      funciones: {
        emprendimientos: { voz: 'Angel', genero: 'Masculina' },
        finanzas_personales: { voz: 'Angel', genero: 'Masculina' },
      },
    },
    {
      id: 6,
      titulo: 'Proyectos',
      voz_principal: 'Don Eloy',
      genero: 'Masculina',
      funciones: {
        proyecto_captura_carbono: { voz: 'Paulette', genero: 'Femenina' },
        proyecto_saberes_ancestrales_folklore: {
          voz: 'Don Eloy',
          genero: 'Masculina',
        },
        el_tesoro_de_los_abuelos_memoria_viva: {
          voz: 'Don Eloy',
          genero: 'Masculina',
        },
        herbario_memoria_cultural: { voz: 'Don Eloy', genero: 'Masculina' },
      },
    },
    {
      id: 7,
      titulo: 'Escuela de Campo',
      voz_principal: 'Fabrizzio',
      genero: 'Masculina',
      funciones: {
        cursos: { voz: 'Fabrizzio', genero: 'Masculina' },
        practicas_regenerativas: { voz: 'Fabrizzio', genero: 'Masculina' },
      },
    },
    {
      id: 8,
      titulo: 'Mi Comunidad Virtual',
      voz_principal: 'Don Eloy',
      genero: 'Masculina',
      funciones: {
        ciudadano_rural: { voz: 'Don Eloy', genero: 'Masculina' },
        asesoria_legal: { voz: 'Dr. Pablo', genero: 'Masculina' },
        walkie_talkie: { voz: 'Don Eloy', genero: 'Masculina' },
      },
    },
    {
      id: 9,
      titulo: 'Asistente Preventivo de Salud Rural',
      voz_principal: 'Paulette',
      genero: 'Femenina',
      funciones: {
        prevencion_salud: { voz: 'Paulette', genero: 'Femenina' },
      },
    },
    {
      id: 10,
      titulo: 'Servicios Financieros Melantia',
      voz_principal: 'Paulette',
      genero: 'Femenina',
      funciones: {
        creditos_y_ahorros: { voz: 'Paulette', genero: 'Femenina' },
      },
    },
    {
      id: 11,
      titulo: 'Registro Evidencias y Documentos',
      voz_principal: 'Melantia',
      genero: 'Femenina',
      funciones: {
        almacenamiento_evidencias: { voz: 'Melantia', genero: 'Femenina' },
      },
    },
  ],
};

if (typeof window !== 'undefined') {
  window.VOCES_MELANTIA_CONFIG = VOCES_MELANTIA_CONFIG;
}

export default VOCES_MELANTIA_CONFIG;
