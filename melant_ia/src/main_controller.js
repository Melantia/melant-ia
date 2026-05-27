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
// Ejemplo: solo exponer globalmente si el usuario accede a la sección
window.MelantiaAsistente = undefined;
window.SuscripcionesMelantia = undefined;
window.AsistenteTecnicoRural = undefined;
window.FinanzasPersonales = undefined;
window.Emprendimientos = undefined;
window.VisionArtificial = undefined;
window.BienesRaicesRurales = undefined;
window.OportunidadesPublicas = undefined;
window.MercadoPlatano = undefined;

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
    case 'Finanzas Personales':
      return import('./modules/finanzas_personales.js').then(mod => {
        if (mod && mod.default && typeof mod.default.init === 'function') {
          mod.default.init();
        }
        // Renderizar UI básica (puedes personalizar)
        const cont = document.getElementById('app-menu');
        if (cont) {
          cont.innerHTML = `<h2>Finanzas Personales</h2><button onclick='window.location.reload()'>Volver</button>`;
        }
        return mod;
      });
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
    case 'Suscripciones':
      return import('./modules/01_suscripciones/afiliados_controller.js');
    case 'Asistente Técnico Rural':
      return import('./modules/02_asistente_tecnico_rural/asistencia_tecnica_rural.js');
    case 'Gestión de Fincas y Trazabilidad':
      return import('./modules/gestion_fincas_trazabilidad.js');
    case 'Negocios Rurales':
      return import('./modules/negocios_rurales.js');
    case 'Emprendedor y Finanzas Personales':
      return import('./modules/emprendedor_finanzas.js').then((mod) => {
        // Inicialización extra si es necesario
        if (
          mod &&
          mod.default &&
          typeof mod.default.mostrarMenu === 'function'
        ) {
          mod.default.mostrarMenu();
        } else if (
          window.EmprendedorFinanzas &&
          typeof window.EmprendedorFinanzas.mostrarMenu === 'function'
        ) {
          window.EmprendedorFinanzas.mostrarMenu();
        }
        return mod;
      });
    case 'Proyectos':
        return import('./modules/proyectos.js').then(mod => {
          if (window.MelantiaProyectos && typeof window.MelantiaProyectos.mostrarMenuProyectos === 'function') {
            window.MelantiaProyectos.mostrarMenuProyectos();
          }
          return mod;
        });
    case 'Escuela de Campo':
      return import('./modules/escuela_campo.js');
    case 'Mi Comunidad Virtual':
      return import('./modules/comunidad_virtual.js');
    case 'Asistente Preventivo de Salud':
      return import('./modules/asistente_salud.js');
    case 'Servicios Financieros Melantia':
      return import('./modules/servicios_financieros.js');
    case 'Registro Evidencias y Documentos':
      return import('./modules/evidencias_documentos.js');
    // Si existen módulos para Registro y Notificaciones, agrégalos aquí
    // case 'Registro':
    //   return import('./modules/registro.js');
    // case 'Notificaciones':
    //   return import('./modules/notificaciones.js');
    default:
      throw new Error('Módulo no reconocido: ' + nombre);
  }
};

// --- INTEGRACIÓN DE BOTONES EN LA UI PRINCIPAL ---
window.addEventListener('DOMContentLoaded', async () => {
  // Registro Evidencias y Documentos (id: 11)
  let btnEvidencia = Array.from(document.querySelectorAll('button')).find((b) =>
    b.textContent.trim().toLowerCase().includes('evidencia fotografica')
  );
  if (btnEvidencia) {
    btnEvidencia.addEventListener('click', async () => {
      const mod = await window.cargarModulo('VisionArtificial');
      mod.mostrarPanelVision?.();
    });
  }

  // Acceso rápido desde Asistente Técnico Rural (id: 2)
  let btnAsistente = Array.from(document.querySelectorAll('button')).find((b) =>
    b.textContent.trim().toLowerCase().includes('asistente técnico rural')
  );
  if (btnAsistente) {
    btnAsistente.addEventListener('click', async () => {
      // Carga el panel normal y agrega acceso a evidencia
      // ...existing code for Asistente Técnico Rural...
      // Agregar botón de acceso rápido a evidencia
      setTimeout(() => {
        const cont = document.getElementById('app-menu');
        if (cont && !document.getElementById('btn-evidencia-rapida')) {
          const btn = document.createElement('button');
          btn.id = 'btn-evidencia-rapida';
          btn.className = 'btn-melantia';
          btn.textContent = 'Registrar Evidencia Fotográfica';
          btn.onclick = async () => {
            const mod = await window.cargarModulo('VisionArtificial');
            mod.mostrarPanelVision?.();
          };
          cont.appendChild(btn);
        }
      }, 500);
    });
  }

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
