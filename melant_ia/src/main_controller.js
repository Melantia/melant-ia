  // Botón principal: Asistente Técnico Rural
  const btnAsistenteRural = Array.from(document.querySelectorAll('button')).find((b) =>
    b.textContent.trim().toLowerCase() === 'asistente técnico rural'
  );
  if (btnAsistenteRural) {
    btnAsistenteRural.addEventListener('click', async () => {
      const mod = await window.cargarModulo('AsistenteTecnicoRural');
      mod.mostrarPanel?.();
    });
  }
window.AsistenteTecnicoCultivos = undefined;
window.AsistenteTecnicoVeterinario = undefined;
window.AgriculturaPrecision = undefined;
window.GpsMedicionTerrenos = undefined;
    // --- Asistente Técnico Rural: Submódulos ---
    case 'AsistenteTecnicoCultivos':
      if (!window.AsistenteTecnicoCultivos) {
        const mod = await import('./modules/02_asistente_tecnico_rural/asistente_tecnico_cultivos.js');
        window.AsistenteTecnicoCultivos = mod;
      }
      return window.AsistenteTecnicoCultivos;
    case 'AsistenteTecnicoVeterinario':
      if (!window.AsistenteTecnicoVeterinario) {
        const mod = await import('./modules/02_asistente_tecnico_rural/asistente_tecnico_veterinario.js');
        window.AsistenteTecnicoVeterinario = mod;
      }
      return window.AsistenteTecnicoVeterinario;
    case 'AgriculturaPrecision':
      if (!window.AgriculturaPrecision) {
        const mod = await import('./modules/02_asistente_tecnico_rural/agricultura_precision.js');
        window.AgriculturaPrecision = mod;
      }
      return window.AgriculturaPrecision;
    case 'GpsMedicionTerrenos':
      if (!window.GpsMedicionTerrenos) {
        const mod = await import('./modules/02_asistente_tecnico_rural/gps_medicion_terrenos.js');
        window.GpsMedicionTerrenos = mod;
      }
      return window.GpsMedicionTerrenos;
// --- Finanzas Personales: Submódulos independientes ---
window.RegistroFinancieroInteligente = undefined;
window.ConsejosAlertas = undefined;
window.TermometroFinanciero = undefined;
window.GraficaIngresosGastos = undefined;
// Ocultar splash screen tras 3 segundos
window.addEventListener('load', () => {
  const splash = document.getElementById('splash-screen');
  if (splash) {
    setTimeout(() => {
      splash.classList.add('hidden');
    }, 3000);
  }
});
// main_controller.js
// Controlador principal de MELANTIA (exposición global)
// Toda la lógica de negocio, comunidad, salud, tienda, Melantios, Don Eloy, Angel, etc. ha sido migrada a módulos dedicados.
// Este archivo solo expone referencias globales y comentarios según la estructura definida en app_structure_melant_ia.json

// Carga dinámica solo de módulos realmente usados en la sesión
window.MelantiaAsistente = undefined;
window.SuscripcionesMelantia = undefined;
window.PlanesPagos = undefined;
window.MonedaVirtualMelantios = undefined;
window.AsistenteTecnicoRural = undefined;
window.FinanzasPersonales = undefined;
window.Emprendimientos = undefined;
window.VisionArtificial = undefined;
window.BienesRaicesRurales = undefined;
window.OportunidadesPublicas = undefined;
window.MercadoPlatano = undefined;
// Servicios Financieros Melantia
window.AperturaCuentaDigital = undefined;
window.OnboardingKYC = undefined;
window.GestionPagosBeneficios = undefined;
window.SimulacionPerfilFinanciero = undefined;
window.SolicitarMicrocredito = undefined;
window.TransferenciasMovimientos = undefined;
window.IntegracionBancosCooperativas = undefined;
window.HistorialEstadoCuenta = undefined;
// Registro Evidencias y Documentos
window.RegistroEvidenciaFotografica = undefined;
window.CarpetaDocumentos = undefined;
window.DescargarCompartirImprimir = undefined;
// Salud
window.AsistentePreventivoSalud = undefined;
window.GuiaPrimerosAuxilios = undefined;
window.BotiquinCasero = undefined;
window.FichaMedica = undefined;

// Comunidad Virtual
window.CiudadanoRural = undefined;
window.AsesoriaLegal = undefined;
window.WalkieTalkie = undefined;

window.cargarModulo = async function (nombre) {
  switch (nombre) {
    // --- Finanzas Personales: Submódulos ---
    case 'RegistroFinancieroInteligente':
      if (!window.RegistroFinancieroInteligente) {
        const mod =
          await import('./modules/registro_financiero_inteligente.js');
        window.RegistroFinancieroInteligente = mod;
      }
      return window.RegistroFinancieroInteligente;
    case 'ConsejosAlertas':
      if (!window.ConsejosAlertas) {
        const mod = await import('./modules/consejos_alertas.js');
        window.ConsejosAlertas = mod;
      }
      return window.ConsejosAlertas;
    case 'TermometroFinanciero':
      if (!window.TermometroFinanciero) {
        const mod = await import('./modules/termometro_financiero.js');
        window.TermometroFinanciero = mod;
      }
      return window.TermometroFinanciero;
    case 'GraficaIngresosGastos':
      if (!window.GraficaIngresosGastos) {
        const mod = await import('./modules/grafica_ingresos_gastos.js');
        window.GraficaIngresosGastos = mod;
      }
      return window.GraficaIngresosGastos;
    case 'MelantiaAsistente':
      if (!window.MelantiaAsistente) {
        const mod = await import('./modules/app_core.js');
        window.MelantiaAsistente = mod.default || mod.MelantiaAsistente;
      }
      return window.MelantiaAsistente;

    // --- Suscripciones: Submódulos ---
    case 'SuscripcionesMelantia':
      if (!window.SuscripcionesMelantia) {
        const mod =
          await import('./modules/01_suscripciones/afiliados_controller.js');
        window.SuscripcionesMelantia = mod.default || mod;
      }
      return window.SuscripcionesMelantia;
    case 'PlanesPagos':
      if (!window.PlanesPagos) {
        const mod = await import('./modules/01_suscripciones/planes_pagos.js');
        window.PlanesPagos = mod;
      }
      return window.PlanesPagos;
    case 'MonedaVirtualMelantios':
      if (!window.MonedaVirtualMelantios) {
        const mod =
          await import('./modules/01_suscripciones/moneda_virtual_melantios.js');
        window.MonedaVirtualMelantios = mod;
      }
      return window.MonedaVirtualMelantios;
    case 'AsistenteTecnicoRural':
      if (!window.AsistenteTecnicoRural) {
        const mod =
          await import('./modules/02_asistente_tecnico_rural/index.js');
        window.AsistenteTecnicoRural = mod.default || mod;
      }
      return window.AsistenteTecnicoRural;
    case 'FinanzasPersonales':
      if (!window.FinanzasPersonales) {
        const mod = await import('./modules/finanzas_personales.js');
        window.FinanzasPersonales = mod;
      }
      return window.FinanzasPersonales;
    case 'Emprendimientos':
      if (!window.Emprendimientos) {
        const mod = await import('./modules/emprendimientos.js');
        window.Emprendimientos = mod;
      }
      return window.Emprendimientos;
    case 'VisionArtificial':
      if (!window.VisionArtificial) {
        const mod = await import('./modules/vision_artificial.js');
        window.VisionArtificial = mod;
      }
      return window.VisionArtificial;
    case 'BienesRaicesRurales':
      if (!window.BienesRaicesRurales) {
        const mod = await import('./modules/bienes_raices_rurales.js');
        window.BienesRaicesRurales = mod;
      }
      return window.BienesRaicesRurales;
    case 'OportunidadesPublicas':
      if (!window.OportunidadesPublicas) {
        const mod = await import('./modules/oportunidades_publicas.js');
        window.OportunidadesPublicas = mod;
      }
      return window.OportunidadesPublicas;
    case 'MercadoPlatano':
      if (!window.MercadoPlatano) {
        const mod = await import('./modules/mercado_platano_controller.js');
        window.MercadoPlatano = mod;
      }
      return window.MercadoPlatano;

    // --- Servicios Financieros Melantia ---
    case 'AperturaCuentaDigital':
      if (!window.AperturaCuentaDigital) {
        const mod = await import('./modules/apertura_cuenta_digital.js');
        window.AperturaCuentaDigital = mod;
      }
      return window.AperturaCuentaDigital;
    case 'OnboardingKYC':
      if (!window.OnboardingKYC) {
        const mod = await import('./modules/onboarding_kyc.js');
        window.OnboardingKYC = mod;
      }
      return window.OnboardingKYC;
    case 'GestionPagosBeneficios':
      if (!window.GestionPagosBeneficios) {
        const mod = await import('./modules/gestion_pagos_beneficios.js');
        window.GestionPagosBeneficios = mod;
      }
      return window.GestionPagosBeneficios;
    case 'SimulacionPerfilFinanciero':
      if (!window.SimulacionPerfilFinanciero) {
        const mod = await import('./modules/simulacion_perfil_financiero.js');
        window.SimulacionPerfilFinanciero = mod;
      }
      return window.SimulacionPerfilFinanciero;
    case 'SolicitarMicrocredito':
      if (!window.SolicitarMicrocredito) {
        const mod = await import('./modules/solicitar_microcredito.js');
        window.SolicitarMicrocredito = mod;
      }
      return window.SolicitarMicrocredito;
    case 'TransferenciasMovimientos':
      if (!window.TransferenciasMovimientos) {
        const mod = await import('./modules/transferencias_movimientos.js');
        window.TransferenciasMovimientos = mod;
      }
      return window.TransferenciasMovimientos;
    case 'IntegracionBancosCooperativas':
      if (!window.IntegracionBancosCooperativas) {
        const mod =
          await import('./modules/integracion_bancos_cooperativas.js');
        window.IntegracionBancosCooperativas = mod;
      }
      return window.IntegracionBancosCooperativas;
    case 'HistorialEstadoCuenta':
      if (!window.HistorialEstadoCuenta) {
        const mod = await import('./modules/historial_estado_cuenta.js');
        window.HistorialEstadoCuenta = mod;
      }
      return window.HistorialEstadoCuenta;

    // --- Registro Evidencias y Documentos ---
    case 'RegistroEvidenciaFotografica':
      if (!window.RegistroEvidenciaFotografica) {
        const mod = await import('./modules/registro_evidencia_fotografica.js');
        window.RegistroEvidenciaFotografica = mod;
      }
      return window.RegistroEvidenciaFotografica;
    case 'CarpetaDocumentos':
      if (!window.CarpetaDocumentos) {
        const mod = await import('./modules/carpeta_documentos.js');
        window.CarpetaDocumentos = mod;
      }
      return window.CarpetaDocumentos;
    case 'DescargarCompartirImprimir':
      if (!window.DescargarCompartirImprimir) {
        const mod = await import('./modules/descargar_compartir_imprimir.js');
        window.DescargarCompartirImprimir = mod;
      }
      return window.DescargarCompartirImprimir;

    // --- Salud ---
    case 'AsistentePreventivoSalud':
      if (!window.AsistentePreventivoSalud) {
        const mod = await import('./modules/asistente_preventivo_salud.js');
        window.AsistentePreventivoSalud = mod;
      }
      return window.AsistentePreventivoSalud;
    case 'GuiaPrimerosAuxilios':
      if (!window.GuiaPrimerosAuxilios) {
        const mod = await import('./modules/guia_primeros_auxilios.js');
        window.GuiaPrimerosAuxilios = mod;
      }
      return window.GuiaPrimerosAuxilios;
    case 'BotiquinCasero':
      if (!window.BotiquinCasero) {
        const mod = await import('./modules/botiquin_casero.js');
        window.BotiquinCasero = mod;
      }
      return window.BotiquinCasero;
    case 'FichaMedica':
      if (!window.FichaMedica) {
        const mod = await import('./modules/ficha_medica.js');
        window.FichaMedica = mod;
      }
      return window.FichaMedica;

    // --- Comunidad Virtual ---
    case 'CiudadanoRural':
      if (!window.CiudadanoRural) {
        const mod = await import('./modules/ciudadano_rural.js');
        window.CiudadanoRural = mod;
      }
      return window.CiudadanoRural;
    case 'AsesoriaLegal':
      if (!window.AsesoriaLegal) {
        const mod = await import('./modules/asesoria_legal.js');
        window.AsesoriaLegal = mod;
      }
      return window.AsesoriaLegal;
    case 'WalkieTalkie':
      if (!window.WalkieTalkie) {
        const mod = await import('./modules/walkie_talkie.js');
        window.WalkieTalkie = mod;
      }
      return window.WalkieTalkie;
    default:
      throw new Error('Módulo no reconocido: ' + nombre);
  }
};

// --- INTEGRACIÓN DE BOTONES EN LA UI PRINCIPAL ---
window.addEventListener('DOMContentLoaded', async () => {
  // ...existing code for otros módulos y botones...

  // --- Finanzas Personales: Submódulos ---
  let btnRegistroFinanciero = Array.from(
    document.querySelectorAll('button')
  ).find((b) =>
    b.textContent
      .trim()
      .toLowerCase()
      .includes('registro financiero inteligente')
  );
  if (btnRegistroFinanciero) {
    btnRegistroFinanciero.addEventListener('click', async () => {
      const mod = await window.cargarModulo('RegistroFinancieroInteligente');
      mod.mostrarPanel?.();
    });
  }

  let btnConsejosAlertas = Array.from(document.querySelectorAll('button')).find(
    (b) => b.textContent.trim().toLowerCase().includes('consejos y alertas')
  );
  if (btnConsejosAlertas) {
    btnConsejosAlertas.addEventListener('click', async () => {
      const mod = await window.cargarModulo('ConsejosAlertas');
      mod.mostrarPanel?.();
    });
  }

  let btnTermometro = Array.from(document.querySelectorAll('button')).find(
    (b) => b.textContent.trim().toLowerCase().includes('termómetro financiero')
  );
  if (btnTermometro) {
    btnTermometro.addEventListener('click', async () => {
      const mod = await window.cargarModulo('TermometroFinanciero');
      mod.mostrarPanel?.();
    });
  }

  let btnGrafica = Array.from(document.querySelectorAll('button')).find((b) =>
    b.textContent.trim().toLowerCase().includes('gráfica de ingresos y gastos')
  );
  if (btnGrafica) {
    btnGrafica.addEventListener('click', async () => {
      const mod = await window.cargarModulo('GraficaIngresosGastos');
      mod.mostrarPanel?.();
    });
  }

  // --- SALUD: Botiquín Casero Inteligente y Ficha Médica / Historia Clínica ---
  // Detecta los botones por texto y vincula a interfaz_salud.html
  const abrirInterfazSalud = () => {
    window.open('interfaz_salud.html', '_blank');
  };
  // Buscar ambos botones por texto
  const textosSalud = [
    'botiquín casero inteligente',
    'ficha médica',
    'historia clínica',
  ];
  Array.from(document.querySelectorAll('button')).forEach((btn) => {
    const txt = btn.textContent.trim().toLowerCase();
    if (textosSalud.some((t) => txt.includes(t))) {
      btn.addEventListener('click', abrirInterfazSalud);
    }
  });

  // Finanzas Personales
  let btnFinanzas = Array.from(document.querySelectorAll('button')).find((b) =>
    b.textContent.trim().toLowerCase().includes('finanzas personales')
  );
  if (btnFinanzas) {
    btnFinanzas.addEventListener('click', async () => {
      const mod = await window.cargarModulo('FinanzasPersonales');
      mod.mostrarPanelFinanzas?.();
    });
  }

  // Emprendimientos
  let btnEmpr = Array.from(document.querySelectorAll('button')).find((b) =>
    b.textContent.trim().toLowerCase().includes('emprendimiento')
  );
  if (btnEmpr) {
    btnEmpr.addEventListener('click', async () => {
      const mod = await window.cargarModulo('Emprendimientos');
      mod.mostrarPanelEmprendimientos?.();
    });
  }

  // Suscripciones: Integración de submódulos
  const botonesSuscripciones = [
    {
      texto: 'gestión de suscripciones',
      modulo: 'SuscripcionesMelantia',
      mostrar: async (mod) => {
        if (
          mod &&
          mod.SistemaAfiliados &&
          typeof mod.SistemaAfiliados.abrirPanel === 'function'
        ) {
          mod.SistemaAfiliados.init?.();
          mod.SistemaAfiliados.abrirPanel();
        } else if (
          window.SistemaAfiliados &&
          typeof window.SistemaAfiliados.abrirPanel === 'function'
        ) {
          window.SistemaAfiliados.init?.();
          window.SistemaAfiliados.abrirPanel();
        } else if (typeof mod.abrirPanel === 'function') {
          mod.init?.();
          mod.abrirPanel();
        } else if (typeof mod.mostrarPanel === 'function') {
          mod.mostrarPanel();
        }
      },
    },
    {
      texto: 'planes y pagos',
      modulo: 'PlanesPagos',
      mostrar: (mod) => mod.mostrarPanel?.(),
    },
    {
      texto: 'moneda virtual melantios',
      modulo: 'MonedaVirtualMelantios',
      mostrar: (mod) => mod.mostrarPanel?.(),
    },
  ];
  botonesSuscripciones.forEach(({ texto, modulo, mostrar }) => {
    const btn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent.trim().toLowerCase() === texto
    );
    if (btn) {
      btn.addEventListener('click', async () => {
        const mod = await window.cargarModulo(modulo);
        mostrar(mod);
      });
    }
  });

  // Bienes Raíces Rurales
  let btnBienes = Array.from(document.querySelectorAll('button')).find((b) =>
    b.textContent.trim().toLowerCase().includes('bienes raíces')
  );
  if (btnBienes) {
    btnBienes.addEventListener('click', async () => {
      const mod = await window.cargarModulo('BienesRaicesRurales');
      mod.mostrarCatalogoPropiedades?.();
    });
  }

  // Oportunidades Públicas
  let btnOportunidades = Array.from(document.querySelectorAll('button')).find(
    (b) => b.textContent.trim().toLowerCase().includes('oportunidades públicas')
  );
  if (btnOportunidades) {
    btnOportunidades.addEventListener('click', async () => {
      const mod = await window.cargarModulo('OportunidadesPublicas');
      mod.mostrarOportunidadesPublicas?.();
    });
  }

  // Mercado de Plátano
  let btnPlatano = Array.from(document.querySelectorAll('button')).find((b) =>
    b.textContent.trim().toLowerCase().includes('mercado de plátano')
  );
  if (btnPlatano) {
    btnPlatano.addEventListener('click', async () => {
      const mod = await window.cargarModulo('MercadoPlatano');
      mod.mostrarPanelMercado?.();
    });
  }

  // --- Mi Comunidad Virtual ---
  // Ciudadano Rural
  let btnCiudadano = Array.from(document.querySelectorAll('button')).find((b) =>
    b.textContent.trim().toLowerCase().includes('ciudadano rural')
  );
  if (btnCiudadano) {
    btnCiudadano.addEventListener('click', async () => {
      const mod = await window.cargarModulo('CiudadanoRural');
      mod.mostrarPanel?.();
    });
  }

  // Asesoría Legal
  let btnLegal = Array.from(document.querySelectorAll('button')).find((b) =>
    b.textContent.trim().toLowerCase().includes('asesoría legal')
  );
  if (btnLegal) {
    btnLegal.addEventListener('click', async () => {
      const mod = await window.cargarModulo('AsesoriaLegal');
      mod.mostrarPanel?.();
    });
  }

  // Walkie Talkie
  let btnWalkie = Array.from(document.querySelectorAll('button')).find((b) =>
    b.textContent.trim().toLowerCase().includes('walkie talkie')
  );
  if (btnWalkie) {
    btnWalkie.addEventListener('click', async () => {
      const mod = await window.cargarModulo('WalkieTalkie');
      mod.mostrarPanel?.();
    });
  }

  // --- Salud ---
  // Asistente Preventivo de Salud
  let btnSalud = Array.from(document.querySelectorAll('button')).find((b) =>
    b.textContent.trim().toLowerCase().includes('asistente preventivo de salud')
  );
  if (btnSalud) {
    btnSalud.addEventListener('click', async () => {
      const mod = await window.cargarModulo('AsistentePreventivoSalud');
      mod.mostrarPanel?.();
    });
  }

  // Guía de Primeros Auxilios y Respuesta Rápida
  let btnGuia = Array.from(document.querySelectorAll('button')).find((b) =>
    b.textContent.trim().toLowerCase().includes('guia de primeros auxilios')
  );
  if (btnGuia) {
    btnGuia.addEventListener('click', async () => {
      const mod = await window.cargarModulo('GuiaPrimerosAuxilios');
      mod.mostrarPanel?.();
    });
  }

  // Botiquín Casero Inteligente
  let btnBotiquin = Array.from(document.querySelectorAll('button')).find((b) =>
    b.textContent.trim().toLowerCase().includes('botiquín casero inteligente')
  );
  if (btnBotiquin) {
    btnBotiquin.addEventListener('click', async () => {
      const mod = await window.cargarModulo('BotiquinCasero');
      mod.mostrarPanel?.();
    });
  }

  // Ficha Médica / Historia Clínica
  let btnFicha = Array.from(document.querySelectorAll('button')).find((b) =>
    b.textContent.trim().toLowerCase().includes('ficha médica')
  );
  if (btnFicha) {
    btnFicha.addEventListener('click', async () => {
      const mod = await window.cargarModulo('FichaMedica');
      mod.mostrarPanel?.();
    });
  }

  // --- Servicios Financieros Melantia ---
  let btnCuenta = Array.from(document.querySelectorAll('button')).find((b) =>
    b.textContent.trim().toLowerCase().includes('apertura de cuenta digital')
  );
  if (btnCuenta) {
    btnCuenta.addEventListener('click', async () => {
      const mod = await window.cargarModulo('AperturaCuentaDigital');
      mod.mostrarPanel?.();
    });
  }

  let btnKYC = Array.from(document.querySelectorAll('button')).find((b) =>
    b.textContent.trim().toLowerCase().includes('onboarding y validación kyc')
  );
  if (btnKYC) {
    btnKYC.addEventListener('click', async () => {
      const mod = await window.cargarModulo('OnboardingKYC');
      mod.mostrarPanel?.();
    });
  }

  let btnPagos = Array.from(document.querySelectorAll('button')).find((b) =>
    b.textContent.trim().toLowerCase().includes('gestión de pagos y beneficios')
  );
  if (btnPagos) {
    btnPagos.addEventListener('click', async () => {
      const mod = await window.cargarModulo('GestionPagosBeneficios');
      mod.mostrarPanel?.();
    });
  }

  let btnSimulacion = Array.from(document.querySelectorAll('button')).find(
    (b) =>
      b.textContent
        .trim()
        .toLowerCase()
        .includes('simulación de perfil financiero')
  );
  if (btnSimulacion) {
    btnSimulacion.addEventListener('click', async () => {
      const mod = await window.cargarModulo('SimulacionPerfilFinanciero');
      mod.mostrarPanel?.();
    });
  }

  let btnMicrocredito = Array.from(document.querySelectorAll('button')).find(
    (b) => b.textContent.trim().toLowerCase().includes('solicitar microcrédito')
  );
  if (btnMicrocredito) {
    btnMicrocredito.addEventListener('click', async () => {
      const mod = await window.cargarModulo('SolicitarMicrocredito');
      mod.mostrarPanel?.();
    });
  }

  let btnTransferencias = Array.from(document.querySelectorAll('button')).find(
    (b) =>
      b.textContent
        .trim()
        .toLowerCase()
        .includes('transferencias y movimientos')
  );
  if (btnTransferencias) {
    btnTransferencias.addEventListener('click', async () => {
      const mod = await window.cargarModulo('TransferenciasMovimientos');
      mod.mostrarPanel?.();
    });
  }

  let btnIntegracion = Array.from(document.querySelectorAll('button')).find(
    (b) =>
      b.textContent
        .trim()
        .toLowerCase()
        .includes('integración con bancos y cooperativas')
  );
  if (btnIntegracion) {
    btnIntegracion.addEventListener('click', async () => {
      const mod = await window.cargarModulo('IntegracionBancosCooperativas');
      mod.mostrarPanel?.();
    });
  }

  let btnHistorial = Array.from(document.querySelectorAll('button')).find((b) =>
    b.textContent.trim().toLowerCase().includes('historial y estado de cuenta')
  );
  if (btnHistorial) {
    btnHistorial.addEventListener('click', async () => {
      const mod = await window.cargarModulo('HistorialEstadoCuenta');
      mod.mostrarPanel?.();
    });
  }

  // --- Registro Evidencias y Documentos ---
  let btnEvidencia = Array.from(document.querySelectorAll('button')).find((b) =>
    b.textContent
      .trim()
      .toLowerCase()
      .includes('registro de evidencia fotografica')
  );
  if (btnEvidencia) {
    btnEvidencia.addEventListener('click', async () => {
      const mod = await window.cargarModulo('RegistroEvidenciaFotografica');
      mod.mostrarPanel?.();
    });
  }

  let btnCarpeta = Array.from(document.querySelectorAll('button')).find((b) =>
    b.textContent.trim().toLowerCase().includes('carpeta documentos')
  );
  if (btnCarpeta) {
    btnCarpeta.addEventListener('click', async () => {
      const mod = await window.cargarModulo('CarpetaDocumentos');
      mod.mostrarPanel?.();
    });
  }

  let btnDescargar = Array.from(document.querySelectorAll('button')).find((b) =>
    b.textContent
      .trim()
      .toLowerCase()
      .includes('descargar, compartir e imprimir')
  );
  if (btnDescargar) {
    btnDescargar.addEventListener('click', async () => {
      const mod = await window.cargarModulo('DescargarCompartirImprimir');
      mod.mostrarPanel?.();
    });
  }
});
// main_controller.js
// Controlador principal de MELANTIA (exposición global)
// Toda la lógica de negocio, comunidad, salud, tienda, Melantios, Don Eloy, Angel, etc. ha sido migrada a módulos dedicados.
// Este archivo solo expone referencias globales y comentarios según la estructura definida en app_structure_melant_ia.json

// Carga dinámica solo de módulos realmente usados en la sesión
// Ejemplo: solo exponer globalmente si el usuario accede a la sección
window.MelantiaAsistente = undefined;
window.SuscripcionesMelantia = undefined;
window.AsistenteTecnicoRural = undefined;

window.cargarModulo = async function (nombre) {
  switch (nombre) {
    case 'MelantiaAsistente':
      if (!window.MelantiaAsistente) {
        const mod = await import('./modules/app_core.js');
        window.MelantiaAsistente = mod.default || mod.MelantiaAsistente;
      }
      return window.MelantiaAsistente;
    case 'SuscripcionesMelantia':
      if (!window.SuscripcionesMelantia) {
        const mod =
          await import('./modules/01_suscripciones/afiliados_controller.js');
        window.SuscripcionesMelantia = mod.default || mod;
      }
      return window.SuscripcionesMelantia;
    case 'AsistenteTecnicoRural':
      if (!window.AsistenteTecnicoRural) {
        const mod =
          await import('./modules/02_asistente_tecnico_rural/index.js');
        window.AsistenteTecnicoRural = mod.default || mod;
      }
      return window.AsistenteTecnicoRural;
    case 'BienesRaicesRurales':
      if (!window.BienesRaicesRurales) {
        const mod = await import('./modules/bienes_raices_rurales.js');
        window.BienesRaicesRurales = mod;
      }
      return window.BienesRaicesRurales;
    case 'OportunidadesPublicas':
      if (!window.OportunidadesPublicas) {
        const mod = await import('./modules/oportunidades_publicas.js');
        window.OportunidadesPublicas = mod;
      }
      return window.OportunidadesPublicas;
    case 'MercadoPlatano':
      if (!window.MercadoPlatano) {
        const mod = await import('./modules/mercado_platano_controller.js');
        window.MercadoPlatano = mod;
      }
      return window.MercadoPlatano;
    default:
      throw new Error('Módulo no reconocido: ' + nombre);
  }
};

// Para cambios en la lógica, modificar únicamente los módulos dedicados en /modules, /controllers, etc.
// Este archivo debe permanecer ultra-ligero y sin lógica interna.

// --- INTEGRACIÓN DEL BOTÓN SUSCRIPCIONES EN LA UI PRINCIPAL ---
window.addEventListener('DOMContentLoaded', async () => {
  // Suscripciones
  let btn = document.getElementById('btn-suscripciones');
  if (!btn) {
    btn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent.trim().toLowerCase().includes('suscrip')
    );
  }
  if (btn) {
    btn.addEventListener('click', async () => {
      const mod = await window.cargarModulo('SuscripcionesMelantia');
      if (
        mod &&
        mod.SistemaAfiliados &&
        typeof mod.SistemaAfiliados.abrirPanel === 'function'
      ) {
        mod.SistemaAfiliados.init?.();
        mod.SistemaAfiliados.abrirPanel();
      } else if (
        window.SistemaAfiliados &&
        typeof window.SistemaAfiliados.abrirPanel === 'function'
      ) {
        window.SistemaAfiliados.init?.();
        window.SistemaAfiliados.abrirPanel();
      } else if (typeof mod.abrirPanel === 'function') {
        mod.init?.();
        mod.abrirPanel();
      }
    });
  }

  // Bienes Raíces Rurales
  let btnBienes = Array.from(document.querySelectorAll('button')).find((b) =>
    b.textContent.trim().toLowerCase().includes('bienes raíces')
  );
  if (btnBienes) {
    btnBienes.addEventListener('click', async () => {
      const mod = await window.cargarModulo('BienesRaicesRurales');
      mod.mostrarCatalogoPropiedades?.();
    });
  }

  // Oportunidades Públicas
  let btnOportunidades = Array.from(document.querySelectorAll('button')).find(
    (b) => b.textContent.trim().toLowerCase().includes('oportunidades públicas')
  );
  if (btnOportunidades) {
    btnOportunidades.addEventListener('click', async () => {
      const mod = await window.cargarModulo('OportunidadesPublicas');
      mod.mostrarOportunidadesPublicas?.();
    });
  }

  // Mercado de Plátano
  let btnPlatano = Array.from(document.querySelectorAll('button')).find((b) =>
    b.textContent.trim().toLowerCase().includes('mercado de plátano')
  );
  if (btnPlatano) {
    btnPlatano.addEventListener('click', async () => {
      const mod = await window.cargarModulo('MercadoPlatano');
      mod.mostrarPanelMercado?.();
    });
  }
});
