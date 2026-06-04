// Orquestador de red para Walkie Talkie MELANTIA.
// Define una sola política de transporte:
// - Etapa temprana: Bridgefy/BLE como canal principal.
// - Escala alta: mesh propietario BLE + Wi-Fi Direct a partir de 3000 usuarios.
// - Fallback local: simulación/control para navegador o preview sin SDK nativo.

const CONFIG_RED_WALKIE = {
  modoDespliegue: 'finca_pequena',
  alcanceObjetivoMetros: 50,
  tipoFinca: 'pequena',
  umbralUsuariosMesh: 3000,
  umbralGruposCercanosMesh: 2,
  umbralUsuariosBridgefy: 1,
  forzarModoEmergencia: false,
  habilitarMeshPropietario: false,
  preferirBridgefyMientrasEscala: true,
  permitirFallbackLocal: true,
  canalesBridgefy: ['ble_sdk_bridgefy'],
  canalesMesh: ['ble', 'wifi_direct'],
  rssiRealHabilitado: false,
  rssiMinimoAceptable: -88,
  rssiExcelente: -62,
};

const PERFILES_FINCA = {
  pequena: {
    nombre: 'Finca pequena',
    alcanceObjetivoMetros: 50,
    distanciaAlertaMetros: 42,
  },
  mediana: {
    nombre: 'Finca mediana',
    alcanceObjetivoMetros: 70,
    distanciaAlertaMetros: 58,
  },
  quebrada: {
    nombre: 'Finca con relieve',
    alcanceObjetivoMetros: 35,
    distanciaAlertaMetros: 28,
  },
};

const estadoRedWalkie = {
  activo: false,
  estrategiaDeseada: 'bridgefy',
  estrategiaActiva: 'reposo',
  sdkDisponible: false,
  meshListo: false,
  usuariosComunidad: 0,
  gruposCercanosActivos: 0,
  calidadEnlace: 'sin_estimacion',
  calidadPct: 0,
  alertaRangoActiva: false,
  distanciaEstimadaMetros: 0,
  tipoFinca: 'pequena',
  mensaje:
    'Modo finca pequena activo: Walkie Talkie sobre Bridgefy/BLE para distancias cercanas de hasta 50 m aproximados. Mesh propietario queda preparado para futuro.',
};

let singletonNetworkManager = null;

// Contrato esperado para bridge nativo Android (no visible en UI por ahora):
// window.MelantiaSignalBridge = {
//   getCurrentRSSI: () => number,               // requerido si rssiRealHabilitado=true
//   startSignalMonitor?: () => Promise<void>,   // opcional
//   stopSignalMonitor?: () => Promise<void>,    // opcional
//   onSignalChanged?: (cb) => void,             // opcional
// };
export const CONTRATO_SIGNAL_BRIDGE = {
  requerido: ['getCurrentRSSI'],
  opcional: ['startSignalMonitor', 'stopSignalMonitor', 'onSignalChanged'],
};

function detectarBridgefySdk() {
  if (typeof window === 'undefined') return null;
  return window.Bridgefy || window.bridgefy || null;
}

export function registrarMelantiaSignalBridge(adapter) {
  if (typeof window === 'undefined') {
    throw new Error(
      'MelantiaSignalBridge solo puede registrarse en entorno navegador.'
    );
  }
  if (!adapter || typeof adapter.getCurrentRSSI !== 'function') {
    throw new Error('Signal bridge invalido: falta getCurrentRSSI().');
  }
  window.MelantiaSignalBridge = adapter;
  return true;
}

export function obtenerEstadoSignalBridge() {
  if (typeof window === 'undefined') {
    return { disponible: false, valido: false };
  }
  const bridge = window.MelantiaSignalBridge;
  const valido = Boolean(bridge && typeof bridge.getCurrentRSSI === 'function');
  return {
    disponible: Boolean(bridge),
    valido,
    contrato: CONTRATO_SIGNAL_BRIDGE,
  };
}

function obtenerPerfilFinca(tipoFinca = CONFIG_RED_WALKIE.tipoFinca) {
  return PERFILES_FINCA[tipoFinca] || PERFILES_FINCA.pequena;
}

function normalizarTipoFinca(tipoFinca) {
  return PERFILES_FINCA[tipoFinca] ? tipoFinca : 'pequena';
}

function leerRssiReal() {
  if (!CONFIG_RED_WALKIE.rssiRealHabilitado || typeof window === 'undefined') {
    return null;
  }

  const provider = window.MelantiaSignalBridge;
  if (!provider || typeof provider.getCurrentRSSI !== 'function') {
    return null;
  }

  try {
    const valor = provider.getCurrentRSSI();
    return Number.isFinite(Number(valor)) ? Number(valor) : null;
  } catch {
    return null;
  }
}

function soportaMeshNativo() {
  if (typeof navigator === 'undefined') return false;
  return Boolean(navigator.bluetooth || navigator.wifi || navigator.connection);
}

class TransporteBase {
  constructor(nombre) {
    this.nombre = nombre;
    this.activo = false;
    this.onPayload = null;
  }

  setReceiver(callback) {
    this.onPayload = callback;
  }

  async activar() {
    this.activo = true;
    return true;
  }

  async desactivar() {
    this.activo = false;
    return true;
  }

  async enviar() {
    return false;
  }
}

class TransporteLocalFallback extends TransporteBase {
  constructor() {
    super('local_fallback');
  }

  async enviar(payload) {
    if (!this.activo) {
      await this.activar();
    }
    setTimeout(() => {
      if (this.onPayload) {
        this.onPayload({ ...payload, via: this.nombre });
      }
    }, 150);
    return true;
  }
}

class TransporteBridgefy extends TransporteBase {
  constructor() {
    super('bridgefy_ble');
    this.sdk = detectarBridgefySdk();
  }

  async activar(contexto = {}) {
    this.sdk = detectarBridgefySdk();
    if (!this.sdk) {
      this.activo = false;
      return false;
    }

    if (typeof this.sdk.start === 'function') {
      await this.sdk.start(contexto);
    }

    if (typeof this.sdk.onMessage === 'function') {
      this.sdk.onMessage((payload) => {
        if (this.onPayload) {
          this.onPayload({ ...payload, via: this.nombre });
        }
      });
    }

    this.activo = true;
    return true;
  }

  async enviar(payload) {
    if (!this.sdk) {
      return false;
    }
    if (typeof this.sdk.sendMessage === 'function') {
      await this.sdk.sendMessage(payload);
      return true;
    }
    if (typeof this.sdk.send === 'function') {
      await this.sdk.send(payload);
      return true;
    }
    return false;
  }
}

class TransporteMeshPropietario extends TransporteBase {
  constructor() {
    super('mesh_propietario');
    this.colaPendiente = [];
  }

  async activar(contexto = {}) {
    const disponible = soportaMeshNativo();
    this.activo = disponible;
    if (!disponible) {
      return false;
    }

    // Punto de extensión: aquí se conectará el bridge nativo Android
    // que use BLE + Wi-Fi Direct y realice saltos multi-hop entre equipos.
    this.contexto = contexto;
    return true;
  }

  async enviar(payload) {
    if (!this.activo) {
      return false;
    }

    // Preparado para bridge nativo futuro. En preview web solo conserva cola.
    this.colaPendiente.push({
      ...payload,
      via: this.nombre,
      timestamp: Date.now(),
    });

    if (this.onPayload && payload.__modoDemoLocal) {
      this.onPayload({ ...payload, via: this.nombre });
    }
    return true;
  }
}

function construirMensajeEstado() {
  if (estadoRedWalkie.estrategiaActiva === 'mesh_propietario') {
    return 'Mesh propietario seleccionado: preparado para BLE + Wi-Fi Direct entre grupos cercanos.';
  }
  if (estadoRedWalkie.estrategiaActiva === 'bridgefy_ble') {
    return `Bridgefy/BLE seleccionado como canal principal para fincas pequenas. Alcance objetivo: ${CONFIG_RED_WALKIE.alcanceObjetivoMetros} m aproximados en campo abierto.`;
  }
  if (estadoRedWalkie.estrategiaActiva === 'local_fallback') {
    return 'Sin SDK nativo disponible: usando fallback local de desarrollo sin duplicar la lógica de transporte.';
  }
  return 'Red en espera de contexto operativo.';
}

function estimarCalidadEnlace(contexto = {}, estrategiaActiva = 'reposo') {
  const perfilFinca = obtenerPerfilFinca(contexto.tipoFinca);
  const distanciaMetros = Number(
    contexto.distanciaEstimadaMetros || perfilFinca.alcanceObjetivoMetros
  );
  const conectividad = contexto.conectividad || 'online';
  const gruposCercanosActivos = Number(contexto.gruposCercanosActivos || 0);
  const rssiReal = leerRssiReal();

  let calidadPct = 0;
  if (rssiReal !== null) {
    const rango =
      CONFIG_RED_WALKIE.rssiExcelente - CONFIG_RED_WALKIE.rssiMinimoAceptable;
    const normalizado =
      (rssiReal - CONFIG_RED_WALKIE.rssiMinimoAceptable) / Math.max(rango, 1);
    calidadPct = Math.max(5, Math.min(100, Math.round(normalizado * 100)));
  } else if (estrategiaActiva === 'bridgefy_ble') {
    const ratio = Math.max(
      0,
      1 - distanciaMetros / Math.max(perfilFinca.alcanceObjetivoMetros, 1)
    );
    calidadPct = Math.round(45 + ratio * 45);
  } else if (estrategiaActiva === 'mesh_propietario') {
    calidadPct = gruposCercanosActivos >= 2 ? 82 : 68;
  } else if (estrategiaActiva === 'local_fallback') {
    calidadPct = 35;
  }

  if (conectividad === 'offline' && estrategiaActiva === 'bridgefy_ble') {
    calidadPct = Math.max(40, calidadPct - 5);
  }

  let calidadEnlace = 'sin_estimacion';
  if (calidadPct >= 80) {
    calidadEnlace = 'alta';
  } else if (calidadPct >= 60) {
    calidadEnlace = 'media';
  } else if (calidadPct > 0) {
    calidadEnlace = 'baja';
  }

  const alertaRangoActiva =
    estrategiaActiva === 'bridgefy_ble' &&
    (distanciaMetros >= perfilFinca.distanciaAlertaMetros ||
      calidadEnlace === 'baja');

  return {
    calidadEnlace,
    calidadPct,
    alertaRangoActiva,
    distanciaEstimadaMetros: distanciaMetros,
  };
}

function calcularEstrategiaDeseada(contexto = {}) {
  const usuariosComunidad = Number(contexto.usuariosComunidad || 0);
  const gruposCercanosActivos = Number(contexto.gruposCercanosActivos || 0);
  const modoEmergencia = Boolean(contexto.modoEmergencia);

  if (!CONFIG_RED_WALKIE.habilitarMeshPropietario) {
    return 'bridgefy_ble';
  }

  if (
    CONFIG_RED_WALKIE.forzarModoEmergencia ||
    (modoEmergencia &&
      usuariosComunidad >= CONFIG_RED_WALKIE.umbralUsuariosMesh)
  ) {
    return 'mesh_propietario';
  }

  if (
    usuariosComunidad >= CONFIG_RED_WALKIE.umbralUsuariosMesh &&
    gruposCercanosActivos >= CONFIG_RED_WALKIE.umbralGruposCercanosMesh
  ) {
    return 'mesh_propietario';
  }

  return 'bridgefy_ble';
}

class WalkieNetworkManager {
  constructor({ onPayload } = {}) {
    this.contexto = {
      usuariosComunidad: 0,
      gruposCercanosActivos: 0,
      conectividad: 'online',
      modoEmergencia: false,
    };
    this.transportes = {
      bridgefy_ble: new TransporteBridgefy(),
      mesh_propietario: new TransporteMeshPropietario(),
      local_fallback: new TransporteLocalFallback(),
    };
    Object.values(this.transportes).forEach((transporte) => {
      transporte.setReceiver(onPayload);
    });
  }

  setReceiver(callback) {
    Object.values(this.transportes).forEach((transporte) => {
      transporte.setReceiver(callback);
    });
  }

  async actualizarContexto(contexto = {}) {
    this.contexto = { ...this.contexto, ...contexto };
    const tipoFinca = normalizarTipoFinca(
      this.contexto.tipoFinca || CONFIG_RED_WALKIE.tipoFinca
    );
    const perfilFinca = obtenerPerfilFinca(tipoFinca);
    CONFIG_RED_WALKIE.tipoFinca = tipoFinca;
    CONFIG_RED_WALKIE.alcanceObjetivoMetros = perfilFinca.alcanceObjetivoMetros;
    estadoRedWalkie.usuariosComunidad = Number(
      this.contexto.usuariosComunidad || 0
    );
    estadoRedWalkie.gruposCercanosActivos = Number(
      this.contexto.gruposCercanosActivos || 0
    );
    estadoRedWalkie.tipoFinca = tipoFinca;
    estadoRedWalkie.sdkDisponible = Boolean(detectarBridgefySdk());
    estadoRedWalkie.meshListo = soportaMeshNativo();
    estadoRedWalkie.estrategiaDeseada = calcularEstrategiaDeseada(
      this.contexto
    );
    await this.seleccionarTransporte();
    const calidad = estimarCalidadEnlace(
      this.contexto,
      estadoRedWalkie.estrategiaActiva
    );
    estadoRedWalkie.calidadEnlace = calidad.calidadEnlace;
    estadoRedWalkie.calidadPct = calidad.calidadPct;
    estadoRedWalkie.alertaRangoActiva = calidad.alertaRangoActiva;
    estadoRedWalkie.distanciaEstimadaMetros = calidad.distanciaEstimadaMetros;
    return this.obtenerEstado();
  }

  async seleccionarTransporte() {
    const deseada = estadoRedWalkie.estrategiaDeseada;
    let activa = 'reposo';

    if (deseada === 'mesh_propietario') {
      const okMesh = await this.transportes.mesh_propietario.activar(
        this.contexto
      );
      if (okMesh) {
        activa = 'mesh_propietario';
      } else {
        const okBridgefy = await this.transportes.bridgefy_ble.activar(
          this.contexto
        );
        activa = okBridgefy
          ? 'bridgefy_ble'
          : CONFIG_RED_WALKIE.permitirFallbackLocal
            ? 'local_fallback'
            : 'reposo';
      }
    } else {
      const okBridgefy = await this.transportes.bridgefy_ble.activar(
        this.contexto
      );
      activa = okBridgefy
        ? 'bridgefy_ble'
        : CONFIG_RED_WALKIE.permitirFallbackLocal
          ? 'local_fallback'
          : 'reposo';
    }

    if (activa === 'local_fallback') {
      await this.transportes.local_fallback.activar(this.contexto);
    }

    estadoRedWalkie.activo = activa !== 'reposo';
    estadoRedWalkie.estrategiaActiva = activa;
    estadoRedWalkie.mensaje = construirMensajeEstado();
    return estadoRedWalkie;
  }

  async enviar(payload) {
    const activa = estadoRedWalkie.estrategiaActiva;
    if (!activa || activa === 'reposo') {
      await this.seleccionarTransporte();
    }

    const transporteActivo = this.transportes[estadoRedWalkie.estrategiaActiva];
    if (transporteActivo && (await transporteActivo.enviar(payload))) {
      return true;
    }

    if (CONFIG_RED_WALKIE.permitirFallbackLocal) {
      await this.transportes.local_fallback.activar(this.contexto);
      estadoRedWalkie.estrategiaActiva = 'local_fallback';
      estadoRedWalkie.activo = true;
      estadoRedWalkie.mensaje = construirMensajeEstado();
      return this.transportes.local_fallback.enviar(payload);
    }

    return false;
  }

  obtenerEstado() {
    return {
      ...estadoRedWalkie,
      config: { ...CONFIG_RED_WALKIE },
    };
  }
}

export function createWalkieNetworkManager(options = {}) {
  if (!singletonNetworkManager) {
    singletonNetworkManager = new WalkieNetworkManager(options);
  } else if (options.onPayload) {
    singletonNetworkManager.setReceiver(options.onPayload);
  }
  return singletonNetworkManager;
}

export function obtenerEstadoRedWalkie() {
  return {
    ...estadoRedWalkie,
    config: { ...CONFIG_RED_WALKIE },
  };
}

export function actualizarConfigRedWalkie(parcial = {}) {
  Object.assign(CONFIG_RED_WALKIE, parcial);
  return obtenerEstadoRedWalkie();
}

// Compatibilidad con llamadas previas.
export function evaluarActivacionMesh(contexto = {}) {
  const estrategia = calcularEstrategiaDeseada(contexto);
  return {
    activo: estrategia === 'mesh_propietario',
    motivo:
      estrategia === 'mesh_propietario'
        ? 'escala_comunitaria'
        : 'bridgefy_finca_pequena',
    usuariosActivos: Number(contexto.usuariosComunidad || 0),
    gruposCercanosActivos: Number(contexto.gruposCercanosActivos || 0),
  };
}

export function iniciarModoEscuchaPasivo(evaluacion = {}) {
  estadoRedWalkie.activo = true;
  estadoRedWalkie.estrategiaDeseada = 'mesh_propietario';
  estadoRedWalkie.estrategiaActiva = 'mesh_propietario';
  estadoRedWalkie.mensaje =
    evaluacion.motivo === 'escala_comunitaria'
      ? 'Mesh propietario preparado para operar con grupos cercanos sobre BLE y Wi-Fi Direct.'
      : 'Mesh propietario activado manualmente.';
  return obtenerEstadoRedWalkie();
}

export function detenerModoEscucha() {
  estadoRedWalkie.activo = false;
  estadoRedWalkie.estrategiaActiva = 'reposo';
  estadoRedWalkie.mensaje =
    'Modo finca pequena activo: Walkie Talkie sobre Bridgefy/BLE para distancias cercanas. Mesh propietario queda preparado para cuando se habilite. ';
  return obtenerEstadoRedWalkie();
}

export function obtenerEstadoMesh() {
  return obtenerEstadoRedWalkie();
}

export function actualizarConfigMesh(parcial = {}) {
  return actualizarConfigRedWalkie(parcial);
}
