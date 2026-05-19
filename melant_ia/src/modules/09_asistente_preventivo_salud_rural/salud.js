// Modulo Salud y Bienestar Rural - Paulette
const Salud = {
  _metricasKey: 'melantia_salud_comandos',
  _perfilKey: 'melantia_salud_perfil',
  _perfilCifradoKey: 'melantia_salud_perfil_cifrado',
  _cryptoSeedKey: 'melantia_salud_crypto_seed',
  _inventarioKey: 'melantia_salud_botiquin',
  _estadoPanico: {
    activo: false,
    tipo: null,
    paso: 0,
  },
  _reporteActual: null,
  _perfilCache: null,
  _estilosInyectados: false,

  _medicinasCatalogo: {
    paracetamol: {
      categoria: 'Basicos',
      nombre: 'Paracetamol',
      uso: 'dolor leve y fiebre',
      advertencia:
        'Es seguro para la fiebre, pero si tienes manchas rojas en la piel, consulta primero a la enfermera. No tomes mas de lo indicado en el empaque.',
    },
    antigripal: {
      categoria: 'Respiratorios',
      nombre: 'Antigripales comunes',
      uso: 'alivio de congestion y malestar general',
      advertencia:
        'Si te causan mucho sueno, no operes maquinaria pesada ni el tractor hoy.',
    },
    suero_oral: {
      categoria: 'Digestivos',
      nombre: 'Suero Oral',
      uso: 'deshidratacion por calor, diarrea o vomito',
      advertencia:
        'Es tu mejor aliado. Disuelvelo en un litro de agua hervida o embotellada y bebe sorbos pequenos.',
    },
    yodo_alcohol_jabon: {
      categoria: 'Heridas',
      nombre: 'Yodo / Alcohol / Jabon',
      uso: 'limpieza de cortes superficiales y desinfeccion',
      advertencia:
        'No laves heridas muy profundas; solo cubrelas y presiona. Usa estos insumos solo en heridas superficiales.',
    },
    gasas_vendas: {
      categoria: 'Material',
      nombre: 'Gazas, Vendas y Esparadrapo',
      uso: 'control de hemorragias e inmovilizacion',
      advertencia:
        'Mantenerlas limpias y secas sube mucho la efectividad del manual de emergencias.',
    },
    protector_repelente: {
      categoria: 'Proteccion',
      nombre: 'Protector Solar / Repelente',
      uso: 'prevencion diaria de quemaduras y picaduras',
      advertencia:
        'Su uso diario evita que una jornada normal termine en golpe de calor o en multiples picaduras.',
    },
  },

  _fichas: {
    tropicales: {
      titulo: 'Prevencion de enfermedades tropicales',
      mensaje:
        'Usa ropa de manga larga en el amanecer y atardecer. Revisa que no haya agua estancada en envases viejos tras la lluvia.',
      pasos: [
        'Vacia y tapa recipientes donde se acumule agua.',
        'Usa repelente al amanecer y al atardecer.',
        'Consulta rapido si aparece fiebre con escalofrios o dolor fuerte de cabeza.',
      ],
    },
    picaduras: {
      titulo: 'Primeros auxilios: picaduras y mordeduras',
      mensaje:
        'Si es serpiente: manten la calma, no hagas torniquetes, lava con agua y jabon, y ve al centro medico mas cercano. Toma foto a la serpiente si es seguro.',
      pasos: [
        'No cortes la piel ni succiones la herida.',
        'Inmoviliza la zona y retira anillos o pulseras.',
        'Activa traslado al centro medico si hay dolor intenso, hinchazon o dificultad para respirar.',
      ],
    },
    quimicos: {
      titulo: 'Higiene post-aplicacion quimica',
      mensaje:
        'Si terminaste de fumigar, quitate la ropa de trabajo lejos de la casa y banate con abundante agua. No comas sin lavarte las manos.',
      pasos: [
        'Guarda la ropa contaminada separada de la ropa familiar.',
        'Lava botas, guantes y herramientas antes de volver a usarlas.',
        'Si hay ardor en ojos, mareo o nausea, busca atencion medica.',
      ],
    },
    sol: {
      titulo: 'Hidratacion y cuidados del sol',
      mensaje:
        'Bebe agua cada 20 minutos aunque no tengas sed. Si sientes mareo o dolor de cabeza, busca la sombra de inmediato.',
      pasos: [
        'Trabaja bajo sombra parcial cuando el sol este mas fuerte.',
        'Usa sombrero, manga larga ligera y descansos cortos.',
        'Si hay confusion, piel muy caliente o desmayo, actua como emergencia.',
      ],
    },
    espalda: {
      titulo: 'Cuidado de la espalda y pausa activa',
      mensaje:
        'Al levantar sacos, dobla las rodillas, no la espalda. Manten la carga pegada al cuerpo.',
      pasos: [
        'Haz tres respiraciones profundas y gira hombros hacia atras.',
        'Estira cuello y espalda durante 20 segundos sin rebotes.',
        'Alterna hombros, herramienta o postura cada cierto tiempo.',
      ],
    },
    urgencias: {
      titulo: 'Guia rapida de emergencia rural',
      mensaje:
        'Iniciando protocolo de emergencia. Evalua respiracion, sangrado, conciencia y prepara llamada al centro medico.',
      pasos: [
        'Lleva a la persona a un sitio seguro y con sombra.',
        'Si no responde o no respira, pide ayuda inmediata y activa llamada.',
        'Si respira, controla sangrado, evita moverla de forma brusca y espera traslado.',
      ],
    },
  },

  _triaje: {
    fiebre: {
      titulo: 'Triaje: fiebre y escalofrios',
      mensaje:
        'Si hay fiebre con escalofrios, dolor intenso o decaimiento fuerte, consulta hoy mismo. En zonas tropicales esto puede requerir atencion rapida.',
    },
    cabeza: {
      titulo: 'Triaje: dolor de cabeza o mareo',
      mensaje:
        'Dolor de cabeza con calor suele indicar deshidratacion o exposicion al sol. Suspende labores, busca sombra y bebe agua o suero oral.',
    },
    espalda: {
      titulo: 'Triaje: dolor de espalda',
      mensaje:
        'Si el dolor aparecio al cargar peso, deten esfuerzo, aplica pausa activa y evita seguir cargando hasta que baje la molestia.',
    },
    picadura: {
      titulo: 'Triaje: picadura o mordedura',
      mensaje:
        'Si hay hinchazon rapida, ronchas generalizadas o dificultad para respirar, trata el caso como emergencia inmediata.',
    },
    quimicos: {
      titulo: 'Triaje: exposicion quimica',
      mensaje:
        'Si hubo contacto con agroquimicos y aparecen ardor, mareo, vomito o vision borrosa, retira la ropa contaminada y busca asistencia medica.',
    },
    hemorragia: {
      titulo: 'Triaje: corte profundo o hemorragia',
      mensaje:
        'Si la sangre no cede con presion directa o sale a chorros, activa traslado urgente y manten presion sin levantar la tela.',
    },
    fractura: {
      titulo: 'Triaje: fractura o atrapamiento',
      mensaje:
        'Si el hueso se ve torcido o hubo atrapamiento fuerte, no intentes recolocar. Inmoviliza y busca traslado medico.',
    },
    abdominal: {
      titulo: 'Triaje: dolor abdominal agudo',
      mensaje:
        'Dolor que empeora, vientre duro, vomito constante o fiebre alta ameritan examen fisico inmediato.',
    },
  },

  _emergencias: {
    picaduras: {
      titulo: 'Picaduras y mordeduras',
      icono: `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M12 38c10-14 28-22 40-18-5 2-8 6-8 10 0 5 5 8 10 8-4 8-13 14-23 14-6 0-11-2-15-6l-4 6H6l6-14z" fill="currentColor"/><circle cx="46" cy="28" r="2.5" fill="#fff"/></svg>`,
      audio_urgente:
        'Manten la calma. Inmoviliza la extremidad, quita anillos o botas, lava con agua y jabon, y no hagas cortes ni torniquetes.',
      resumenSintoma:
        'Picadura o mordedura con riesgo de hinchazon, dolor y posible envenenamiento.',
      pasos: [
        {
          orden: 'INMOVIL',
          detalle:
            'No muevas el brazo o pierna afectada. Mantenla por debajo del nivel del corazon.',
        },
        {
          orden: 'QUITA TODO',
          detalle:
            'Retira anillos, relojes o botas. La zona puede hincharse muy rapido.',
        },
        {
          orden: 'LAVA',
          detalle:
            'Usa solo agua y jabon si tienes a mano. No apliques remedios caseros.',
        },
        {
          orden: 'REPORTE',
          detalle:
            'Si es seguro, toma una foto al animal para orientar al personal de salud.',
        },
      ],
      prohibido:
        'No hagas cortes. No succiones el veneno. No uses torniquetes.',
      ordenFinal:
        'Ve al centro medico. La prioridad es ganar tiempo sin empeorar la lesion.',
    },
    abdominal: {
      titulo: 'Dolor abdominal agudo',
      icono: `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M24 10c2 6 2 12 0 18-2 6-2 14 2 22 2 4 6 8 12 8 8 0 14-8 14-18 0-16-8-26-18-30-3-1-6-1-10 0z" fill="currentColor"/><path d="M32 18v18M23 27h18" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>`,
      audio_urgente:
        'Si el dolor empezo en el ombligo y bajo a la derecha, o si aprieta arriba y corre a la espalda con vomito, esto necesita examen fisico inmediato.',
      resumenSintoma:
        'Dolor abdominal agudo con sospecha de apendicitis o pancreatitis.',
      pasos: [
        {
          orden: 'TEST PAULETTE',
          detalle:
            'Apendicitis: empezo en el ombligo y se movio a la derecha abajo. Duele mas al caminar o saltar.',
        },
        {
          orden: 'TEST PAULETTE',
          detalle:
            'Pancreatitis: dolor arriba, como cinturon hacia la espalda, con vomito constante.',
        },
        {
          orden: 'ALARMA',
          detalle:
            'Vientre duro como tabla, fiebre alta o dolor que empeora son senales de cirugia urgente.',
        },
        {
          orden: 'AYUNO',
          detalle:
            'No comas ni bebas alcohol. Preparate para traslado medico rapido.',
        },
      ],
      prohibido:
        'No tomes laxantes. No uses analgesicos fuertes antes de que te vea el medico. No comas.',
      ordenFinal:
        'Ve al centro medico. Este dolor necesita un examen fisico inmediato.',
    },
    agroquimicos: {
      titulo: 'Intoxicacion por agroquimicos',
      icono: `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M24 10h16v8l8 10v22a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4V28l8-10v-8z" fill="currentColor"/><path d="M32 22v18" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="32" cy="46" r="3" fill="#fff"/></svg>`,
      audio_urgente:
        'Sal de la zona, quita toda la ropa contaminada, lava el cuerpo con agua y jabon, y lleva la etiqueta del producto al medico.',
      resumenSintoma:
        'Exposicion a agroquimicos con riesgo de intoxicacion cutanea, respiratoria o digestiva.',
      pasos: [
        {
          orden: 'AIRE',
          detalle:
            'Sal de la zona de fumigacion de inmediato y busca ventilacion.',
        },
        {
          orden: 'DESNUDO',
          detalle:
            'Quita toda la ropa de trabajo: guantes, botas, camisa y cualquier prenda contaminada.',
        },
        {
          orden: 'DUCHA',
          detalle:
            'Lava el cuerpo con abundante agua y jabon por quince minutos.',
        },
        {
          orden: 'ETIQUETA',
          detalle:
            'Busca el envase o la etiqueta del quimico para llevarselo al medico.',
        },
      ],
      prohibido:
        'No induzcas el vomito a menos que la etiqueta lo diga explicitamente.',
      ordenFinal:
        'Busca atencion medica y lleva la etiqueta del producto para orientar el tratamiento.',
    },
    hemorragia: {
      titulo: 'Cortes profundos y hemorragias',
      icono: `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M32 8c10 12 18 24 18 34a18 18 0 1 1-36 0C14 32 22 20 32 8z" fill="currentColor"/><path d="M23 35c2 1 4 2 9 2 5 0 7-1 9-2" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>`,
      audio_urgente:
        'Haz presion directa ahora mismo. No levantes la tela para mirar si ya paro. Si la sangre sale a chorros y no cede, prepara torniquete y anota la hora.',
      resumenSintoma:
        'Corte profundo con sangrado activo y riesgo de hemorragia.',
      pasos: [
        {
          orden: 'PRESION DIRECTA',
          detalle:
            'Usa la tela mas limpia que tengas y aprieta con fuerza sobre la herida. Si se empapa, pon otra encima sin quitar la primera.',
        },
        {
          orden: 'ELEVACION',
          detalle:
            'Si la herida es en un brazo o pierna, levantala por encima del nivel del corazon mientras mantienes la presion.',
        },
        {
          orden: 'TORNIQUETE',
          detalle:
            'Solo si la sangre sale a chorros y no para con presion. Usa banda ancha por encima de la herida, aprieta fuerte y anota la hora exacta.',
        },
      ],
      prohibido:
        'No uses cafe, telaranas ni tierra. No laves heridas muy profundas. No levantes la tela para mirar.',
      ordenFinal:
        'Manten la presion constante. Si te sientes mareado, acuestate y eleva las piernas.',
    },
    fractura: {
      titulo: 'Fracturas y atrapamientos',
      icono: `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M18 12 30 24l-6 6 10 10-6 6 12 12" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M40 10 50 20l-6 6 10 10-6 6" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
      audio_urgente:
        'No intentes enderezar el hueso. Inmoviliza con tablas o carton duro, aplica frio con un trapo y prepara traslado.',
      resumenSintoma:
        'Fractura o atrapamiento con riesgo de dano en nervios o arterias.',
      pasos: [
        {
          orden: 'NO RECOLOQUES',
          detalle:
            'Si el hueso se ve torcido o fuera de lugar, no intentes enderezarlo. Podrias cortar un vaso sanguineo.',
        },
        {
          orden: 'INMOVILIZA',
          detalle:
            'Usa tablas, ramas rectas o carton duro. Sujetalos con vendas o tiras de tela sin apretar demasiado. Debe caber un dedo.',
        },
        {
          orden: 'FRIO',
          detalle:
            'Aplica frio sobre la zona hinchada con un trapo entre la piel y el hielo.',
        },
        {
          orden: 'AMPUTACION',
          detalle:
            'Si se pierde un dedo, envuelvelo en gasa humeda, ponlo en una bolsa sellada y esa bolsa sobre hielo sin contacto directo.',
        },
      ],
      prohibido:
        'No fuerces la zona. No camines sobre una pierna fracturada. No pongas el tejido amputado sobre hielo directo.',
      ordenFinal:
        'Quedate quieto. El dolor es una senal para no mover la zona. Estamos preparando el reporte para el hospital.',
    },
  },

  init() {
    this._asegurarEstilos();
    this._cargarPerfilSaludCifrado();
    this.verificarCaducidadBotiquin();
    this.render();
  },

  _normalizar(texto) {
    return String(texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  },

  _activarPaulette() {
    if (window.STAFF_MELANTIA?.activarAsistente) {
      window.STAFF_MELANTIA.activarAsistente('paulette');
      return;
    }
    if (window.StaffController?.activarPersonaje) {
      window.StaffController.activarPersonaje('paulette');
    }
  },

  _hablar(mensaje) {
    if (window.MelantiaVoz?.hablar) {
      window.MelantiaVoz.hablar(mensaje, 'paulette');
      return true;
    }
    return false;
  },

  _numeroEmergencia() {
    const numeroGuardado =
      window.localStorage?.getItem('melantia_centro_medico') ||
      window.localStorage?.getItem('melantia_emergencia_salud');
    return String(numeroGuardado || '911').trim();
  },

  _perfilBase() {
    const sesion = window._melantia_session || {};
    return {
      nombre: sesion.nombre || sesion.productor || 'Paciente MELANTIA',
      alergias: [],
      condiciones: [],
      medicacion: [],
      tipoSangre: '',
      contactoEmergenciaNombre: '',
      contactoEmergenciaNumero: '',
    };
  },

  _normalizarLista(valor) {
    if (Array.isArray(valor)) {
      return valor.map((item) => String(item || '').trim()).filter(Boolean);
    }
    return String(valor || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  },

  _toBase64(bytes) {
    let binario = '';
    bytes.forEach((byte) => {
      binario += String.fromCharCode(byte);
    });
    return window.btoa(binario);
  },

  _fromBase64(texto) {
    const binario = window.atob(texto);
    const bytes = new Uint8Array(binario.length);
    for (let i = 0; i < binario.length; i += 1) {
      bytes[i] = binario.charCodeAt(i);
    }
    return bytes;
  },

  async _obtenerClaveCifrado() {
    if (!window.crypto?.subtle) return null;
    let seed = window.localStorage?.getItem(this._cryptoSeedKey);
    if (!seed) {
      const bytes = new Uint8Array(32);
      window.crypto.getRandomValues(bytes);
      seed = this._toBase64(bytes);
      window.localStorage?.setItem(this._cryptoSeedKey, seed);
    }
    return window.crypto.subtle.importKey(
      'raw',
      this._fromBase64(seed),
      'AES-GCM',
      false,
      ['encrypt', 'decrypt']
    );
  },

  async _cifrarObjeto(objeto) {
    const texto = JSON.stringify(objeto || {});
    if (!window.crypto?.subtle) {
      return JSON.stringify({ modo: 'base64', data: window.btoa(texto) });
    }
    const clave = await this._obtenerClaveCifrado();
    const iv = new Uint8Array(12);
    window.crypto.getRandomValues(iv);
    const cifrado = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      clave,
      new TextEncoder().encode(texto)
    );
    return JSON.stringify({
      modo: 'aes-gcm',
      iv: this._toBase64(iv),
      data: this._toBase64(new Uint8Array(cifrado)),
    });
  },

  async _descifrarObjeto(textoCifrado) {
    if (!textoCifrado) return this._perfilBase();
    try {
      const payload = JSON.parse(textoCifrado);
      if (payload.modo === 'base64') {
        return JSON.parse(window.atob(payload.data));
      }
      const clave = await this._obtenerClaveCifrado();
      const decodificado = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: this._fromBase64(payload.iv) },
        clave,
        this._fromBase64(payload.data)
      );
      return JSON.parse(new TextDecoder().decode(decodificado));
    } catch (error) {
      console.warn('[Paulette] No pude descifrar el perfil de salud:', error);
      return this._perfilBase();
    }
  },

  async _persistirPerfilSalud() {
    const cifrado = await this._cifrarObjeto(
      this._perfilCache || this._perfilBase()
    );
    window.localStorage?.setItem(this._perfilCifradoKey, cifrado);
    return true;
  },

  async _cargarPerfilSaludCifrado() {
    const cifrado = window.localStorage?.getItem(this._perfilCifradoKey);
    const perfil = await this._descifrarObjeto(cifrado);
    this._perfilCache = {
      ...this._perfilBase(),
      ...perfil,
      alergias: this._normalizarLista(perfil?.alergias),
      condiciones: this._normalizarLista(perfil?.condiciones),
      medicacion: this._normalizarLista(perfil?.medicacion),
    };
    window.localStorage?.setItem(
      this._perfilKey,
      JSON.stringify(this._perfilCache)
    );
    return this._perfilCache;
  },

  _leerPerfilSalud() {
    if (this._perfilCache) return this._perfilCache;
    try {
      const base = JSON.parse(
        window.localStorage?.getItem(this._perfilKey) || '{}'
      );
      this._perfilCache = {
        ...this._perfilBase(),
        ...base,
        alergias: this._normalizarLista(base.alergias),
        condiciones: this._normalizarLista(base.condiciones),
        medicacion: this._normalizarLista(base.medicacion),
      };
    } catch {
      this._perfilCache = this._perfilBase();
    }
    return this._perfilCache;
  },

  _guardarPerfilSalud(parcial = {}) {
    const actual = this._leerPerfilSalud();
    const perfil = {
      ...actual,
      ...parcial,
      alergias: this._normalizarLista(parcial.alergias ?? actual.alergias),
      condiciones: this._normalizarLista(
        parcial.condiciones ?? actual.condiciones
      ),
      medicacion: this._normalizarLista(
        parcial.medicacion ?? actual.medicacion
      ),
    };
    this._perfilCache = perfil;
    window.localStorage?.setItem(this._perfilKey, JSON.stringify(perfil));
    this._persistirPerfilSalud();
    return perfil;
  },

  _inventarioBase() {
    return Object.entries(this._medicinasCatalogo).map(([id, item]) => ({
      id,
      nombre: item.nombre,
      categoria: item.categoria,
      uso: item.uso,
      tiene: false,
      fechaVencimiento: '',
    }));
  },

  _leerInventarioBotiquin() {
    try {
      const guardado = JSON.parse(
        window.localStorage?.getItem(this._inventarioKey) || '[]'
      );
      if (Array.isArray(guardado) && guardado.length) return guardado;
    } catch {}
    return this._inventarioBase();
  },

  _guardarInventarioBotiquin(inventario) {
    window.localStorage?.setItem(
      this._inventarioKey,
      JSON.stringify(inventario)
    );
    return inventario;
  },

  _registrarUsoComando(clave) {
    try {
      const metricas = JSON.parse(
        window.localStorage?.getItem(this._metricasKey) || '{}'
      );
      const actual = metricas[clave] || { total: 0, ultimaVez: null };
      metricas[clave] = {
        total: Number(actual.total || 0) + 1,
        ultimaVez: new Date().toISOString(),
      };
      window.localStorage?.setItem(this._metricasKey, JSON.stringify(metricas));
    } catch {}
  },

  obtenerMetricasComandos() {
    try {
      return JSON.parse(
        window.localStorage?.getItem(this._metricasKey) || '{}'
      );
    } catch {
      return {};
    }
  },

  _iconoEmergencia(tipo) {
    return this._emergencias[tipo]?.icono || '';
  },

  _resumenEmergencia(tipo) {
    const manual = this._emergencias[tipo];
    return manual?.resumenSintoma || 'Emergencia de salud rural.';
  },

  _resumenRescateHtml() {
    const perfil = this._leerPerfilSalud();
    const alergias = perfil.alergias.length
      ? perfil.alergias.join(', ')
      : 'sin alergias registradas';
    const condiciones = perfil.condiciones.length
      ? perfil.condiciones.join(', ')
      : 'sin condiciones cronicas registradas';
    const medicacion = perfil.medicacion.length
      ? perfil.medicacion.join(', ')
      : 'sin medicacion diaria registrada';
    const contactoNombre = String(
      perfil.contactoEmergenciaNombre || 'No registrado'
    ).replace(/</g, '&lt;');
    const contactoNumero = String(
      perfil.contactoEmergenciaNumero || ''
    ).replace(/</g, '&lt;');
    return `Paciente: <strong>${String(perfil.nombre || 'Paciente MELANTIA').replace(/</g, '&lt;')}</strong>. Tipo de sangre: <strong>${String(perfil.tipoSangre || 'No registrado').replace(/</g, '&lt;')}</strong>. Alergias: <strong>${alergias.replace(/</g, '&lt;')}</strong>. Condiciones cronicas: <strong>${condiciones.replace(/</g, '&lt;')}</strong>. Medicacion diaria: <strong>${medicacion.replace(/</g, '&lt;')}</strong>. Contacto: <strong>${contactoNombre}</strong>${contactoNumero ? ` al ${contactoNumero}` : ''}.`;
  },

  _resumenRescateVoz() {
    const perfil = this._leerPerfilSalud();
    const alergias = perfil.alergias.length
      ? perfil.alergias.join(', ')
      : 'sin alergias registradas';
    const condiciones = perfil.condiciones.length
      ? perfil.condiciones.join(', ')
      : 'sin enfermedades cronicas registradas';
    const medicacion = perfil.medicacion.length
      ? perfil.medicacion.join(', ')
      : 'sin medicacion diaria registrada';
    const contacto = perfil.contactoEmergenciaNombre
      ? `${perfil.contactoEmergenciaNombre} al numero ${perfil.contactoEmergenciaNumero || 'sin numero registrado'}`
      : 'sin contacto de emergencia registrado';
    return `El dueno de este equipo es ${condiciones} y alergico a ${alergias}. Usa a diario ${medicacion}. Su tipo de sangre es ${perfil.tipoSangre || 'no registrado'}. Su contacto de emergencia es ${contacto}. Ya he generado el reporte medico.`;
  },

  _reporteTexto(reporte = this._reporteActual) {
    if (!reporte) return '';
    const meds = Array.isArray(reporte.medicamentosAdministrados)
      ? reporte.medicamentosAdministrados
          .map(
            (item) =>
              `${item.nombre} (${item.dosis || 'sin dosis'}) - ${item.hora || 'sin hora'}`
          )
          .join('; ')
      : '';
    return `El paciente presenta ${reporte.sintoma || 'una emergencia de salud'} desde ${reporte.horaEvento || 'hora no registrada'}. Antecedentes: ${reporte.antecedentes || 'sin antecedentes cargados'}. Alergias: ${Array.isArray(reporte.alergias) ? reporte.alergias.join(', ') : reporte.alergias || 'no registradas'}. ${reporte.observaciones || 'Sin observaciones adicionales.'}${meds ? ` Medicinas administradas antes de llegar: ${meds}.` : ''}`;
  },

  _asegurarOverlayPanico() {
    let overlay = document.getElementById('paulette-panico');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'paulette-panico';
    overlay.style.display = 'none';
    document.body.appendChild(overlay);
    return overlay;
  },

  _asegurarEstilos() {
    if (
      this._estilosInyectados ||
      document.getElementById('paulette-salud-css')
    ) {
      this._estilosInyectados = true;
      return;
    }

    const style = document.createElement('style');
    style.id = 'paulette-salud-css';
    style.textContent = `
      .salud-shell{display:grid;gap:14px}
      .salud-container{display:grid;gap:14px;background:linear-gradient(180deg,#fff9fb 0%,#fff 100%);border:1px solid #f3d7e3;border-radius:20px;padding:18px}
      .paulette-header{display:grid;gap:6px;padding:16px;border-radius:18px;background:linear-gradient(135deg,#fff1f6 0%,#ffe4ec 100%);border:1px solid #f6cadb}
      .paulette-header h2{margin:0;font-size:23px;color:#8d3b5a}
      .paulette-header p{margin:0;color:#6c4b59;line-height:1.5}
      .salud-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px}
      .salud-card{display:grid;gap:8px;align-content:start;background:#fff;border-radius:14px;padding:14px;text-align:left;border:1px solid #f2d8e2;border-bottom:4px solid var(--color-asistente,#f48fb1);box-shadow:0 6px 18px rgba(141,59,90,.08);cursor:pointer;transition:transform .15s ease,border-color .15s ease,box-shadow .15s ease}
      .salud-card:hover,.salud-card:focus-visible{transform:translateY(-2px);border-color:#e9b8cb;box-shadow:0 10px 24px rgba(141,59,90,.12)}
      .salud-card .icon{font-size:22px}
      .salud-card h3{margin:0;font-size:15px;color:#7d3050}
      .salud-card p{margin:0;font-size:13px;color:#65505a;line-height:1.45}
      .salud-barra{display:flex;gap:8px;flex-wrap:wrap}
      .salud-chip{background:#fff1f6;color:#8d3b5a;border:1px solid #f6cadb;border-radius:999px;padding:7px 12px;font-size:12px;font-weight:700}
      .salud-detalle{display:grid;gap:10px;background:#fff;border:1px solid #f1d6e1;border-radius:16px;padding:16px;min-height:180px}
      .salud-detalle h3{margin:0;color:#7d3050}
      .salud-detalle p{margin:0;color:#52444b;line-height:1.6}
      .salud-pasos{display:grid;gap:8px;margin:0;padding-left:18px;color:#5f4d55}
      .salud-pasos li{line-height:1.5}
      .salud-acciones{display:flex;gap:8px;flex-wrap:wrap}
      .salud-acciones button,.btn-emergencia,.salud-mini-btn{border:none;border-radius:999px;padding:11px 14px;font-weight:700;cursor:pointer}
      .salud-acciones button,.salud-mini-btn{background:var(--color-asistente,#f48fb1);color:#fff}
      .salud-mini-btn.secundario{background:#fff1f6;color:#8d3b5a;border:1px solid #f6cadb}
      .btn-emergencia{background:#c0392b;color:#fff;width:100%;padding:15px 18px;box-shadow:0 8px 16px rgba(192,57,43,.18)}
      .salud-triaje-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px}
      .salud-alerta{background:#fff5f2;border:1px solid #f5cbc4;border-radius:14px;padding:12px;color:#8a2c1e}
      .salud-resumen-perfil{display:grid;gap:8px;background:#fff4f7;border:1px solid #f3d3de;border-radius:14px;padding:12px;color:#6b4656}
      .salud-form-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}
      .salud-form-grid label{display:grid;gap:6px;font-size:13px;color:#5d4450}
      .salud-form-grid input,.salud-form-grid textarea{width:100%;padding:10px 12px;border:1px solid #d9c2cc;border-radius:12px;font:inherit;box-sizing:border-box}
      .botiquin-lista{display:grid;gap:10px}
      .botiquin-item{display:grid;gap:10px;background:#fff;border:1px solid #ecd6db;border-radius:14px;padding:12px}
      .botiquin-item-header{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center}
      .botiquin-item small{color:#6b5a62;line-height:1.4}
      .salud-tag{display:inline-flex;align-items:center;padding:4px 8px;border-radius:999px;background:#fff1f6;color:#8d3b5a;font-size:12px;font-weight:700}
      body.paulette-panico-activo{overflow:hidden}
      #paulette-panico{position:fixed;inset:0;background:#050505;color:#fff;z-index:12000;padding:14px;display:none}
      #paulette-panico.activo{display:grid;grid-template-rows:auto 1fr auto;gap:12px}
      .panico-cabecera{display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;background:#fff;border:2px solid #111;border-radius:18px;padding:12px 14px;color:#111}
      .panico-cabecera strong{font-size:18px;letter-spacing:.5px}
      .panico-chip{display:inline-flex;align-items:center;gap:8px;background:#111;color:#fff;border-radius:999px;padding:8px 12px;font-size:12px;font-weight:700}
      .panico-menu{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
      .panico-boton{min-height:30vh;border:2px solid #fff;border-radius:22px;background:#111;color:#fff;display:grid;gap:14px;align-content:center;justify-items:center;padding:18px;text-align:center;font-weight:800;font-size:24px;cursor:pointer}
      .panico-boton svg{width:56px;height:56px;color:#ff4d6d}
      .panico-boton span{font-size:14px;line-height:1.4;font-weight:600;color:#ffdbe3}
      .panico-manual{display:grid;grid-template-columns:minmax(0,1fr);gap:12px}
      .panico-paso{display:grid;gap:12px;background:#fff;color:#111;border:3px solid #111;border-radius:24px;padding:18px;min-height:48vh}
      .panico-paso svg{width:56px;height:56px;color:#d90429}
      .panico-paso-header{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap}
      .panico-orden{font-size:28px;font-weight:900;letter-spacing:1px}
      .panico-detalle{font-size:20px;line-height:1.35;font-weight:700}
      .panico-bloque{background:#111;color:#fff;border-radius:18px;padding:14px}
      .panico-bloque.alerta{background:#d90429}
      .panico-bloque strong{display:block;margin-bottom:6px;font-size:15px;letter-spacing:.5px}
      .panico-acciones{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      .panico-acciones button,.panico-pie button{min-height:18vh;border:none;border-radius:20px;font-size:19px;font-weight:900;cursor:pointer;padding:12px}
      .panico-acciones .principal,.panico-pie .principal{background:#fff;color:#111}
      .panico-acciones .alerta,.panico-pie .alerta{background:#d90429;color:#fff}
      .panico-acciones .secundario,.panico-pie .secundario{background:#2b2b2b;color:#fff}
      .panico-pie{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
      .salud-reporte-form{display:grid;gap:10px;background:#fff;border:1px solid #f1d6e1;border-radius:16px;padding:16px}
      .salud-reporte-form label{display:grid;gap:6px;font-size:13px;color:#5d4450}
      .salud-reporte-form input,.salud-reporte-form textarea{width:100%;padding:10px 12px;border:1px solid #d9c2cc;border-radius:12px;font:inherit;box-sizing:border-box}
      .salud-reporte-previo{background:#fff5f7;border:1px solid #f4ccd8;border-radius:14px;padding:12px;color:#6a3a4d;line-height:1.5}
      body.modo-campo .salud-card{box-shadow:none}
      @media (max-width:640px){.panico-boton{min-height:24vh;font-size:19px}.panico-detalle{font-size:17px}.panico-acciones button,.panico-pie button{min-height:14vh;font-size:16px}.panico-pie{grid-template-columns:1fr}.panico-acciones{grid-template-columns:1fr 1fr}}
    `;
    document.head.appendChild(style);
    this._estilosInyectados = true;
  },

  _contenidoPrincipal() {
    return `
      <div class="salud-shell">
        <div class="paulette-header">
          <h2>Bienestar Rural con Paulette</h2>
          <p>Cuido a tu familia y a los trabajadores con fichas rapidas, triaje offline, botiquin inteligente y apoyo inmediato para el campo.</p>
          <div class="salud-barra">
            <span class="salud-chip">Offline</span>
            <span class="salud-chip">Voz guiada</span>
            <span class="salud-chip">Botiquin</span>
            <span class="salud-chip">Ficha de vida</span>
          </div>
        </div>
        <div class="salud-grid">
          <button type="button" class="salud-card" data-salud-accion="ficha" data-salud-tipo="tropicales"><span class="icon">🛡️</span><h3>Prevencion tropical</h3><p>Dengue, malaria y eliminacion de criaderos.</p></button>
          <button type="button" class="salud-card" data-salud-accion="triaje"><span class="icon">🌡️</span><h3>Detector de sintomas</h3><p>Guia rapida para dolor, fiebre, mareo y urgencias.</p></button>
          <button type="button" class="salud-card" data-salud-accion="ficha" data-salud-tipo="sol"><span class="icon">☀️</span><h3>Cuidados del sol</h3><p>Prevencion de golpe de calor e hidratacion.</p></button>
          <button type="button" class="salud-card" data-salud-accion="ficha" data-salud-tipo="espalda"><span class="icon">💪</span><h3>Pausa activa</h3><p>Estiramientos y cuidado de la espalda en cosecha.</p></button>
          <button type="button" class="salud-card" data-salud-accion="ficha" data-salud-tipo="quimicos"><span class="icon">🧴</span><h3>Despues de fumigar</h3><p>Higiene segura tras aplicar quimicos.</p></button>
          <button type="button" class="salud-card" data-salud-accion="ficha" data-salud-tipo="picaduras"><span class="icon">🐍</span><h3>Picaduras</h3><p>Primeros auxilios para insectos y mordeduras.</p></button>
          <button type="button" class="salud-card" data-salud-accion="panico"><span class="icon">🚨</span><h3>Modo panico</h3><p>Manual de emergencia de alto contraste y botones gigantes.</p></button>
          <button type="button" class="salud-card" data-salud-accion="perfil"><span class="icon">📋</span><h3>Ficha de Vida</h3><p>Antecedentes criticos, tipo de sangre y contacto de emergencia.</p></button>
          <button type="button" class="salud-card" data-salud-accion="botiquin"><span class="icon">📦</span><h3>Botiquin Inteligente</h3><p>Inventario, caducidad, uso seguro y medicinas administradas.</p></button>
        </div>
        <div class="salud-detalle" data-salud-detalle></div>
        <button type="button" class="btn-emergencia" data-salud-accion="emergencia">CONTACTAR CENTRO MEDICO</button>
      </div>`;
  },

  _obtenerDetalle() {
    const panel = document.getElementById('panel-novedades');
    const enPanel = panel?.querySelector('[data-salud-detalle]');
    if (enPanel) return enPanel;
    const view = document.getElementById('view-salud');
    return view?.querySelector('[data-salud-detalle]') || null;
  },

  _bind(scope = document) {
    scope.querySelectorAll('[data-salud-accion="ficha"]').forEach((boton) => {
      boton.addEventListener('click', () => {
        this.mostrarFicha(boton.dataset.saludTipo);
      });
    });
    scope.querySelectorAll('[data-salud-accion="triaje"]').forEach((boton) => {
      boton.addEventListener('click', () => {
        this.iniciarTriaje();
      });
    });
    scope
      .querySelectorAll('[data-salud-accion="emergencia"]')
      .forEach((boton) => {
        boton.addEventListener('click', () => {
          this.abrirModoPanico();
        });
      });
    scope.querySelectorAll('[data-salud-accion="panico"]').forEach((boton) => {
      boton.addEventListener('click', () => {
        this.abrirModoPanico();
      });
    });
    scope.querySelectorAll('[data-salud-accion="perfil"]').forEach((boton) => {
      boton.addEventListener('click', () => {
        this.abrirFichaVida();
      });
    });
    scope
      .querySelectorAll('[data-salud-accion="botiquin"]')
      .forEach((boton) => {
        boton.addEventListener('click', () => {
          this.abrirBotiquin();
        });
      });
  },

  render() {
    this._asegurarEstilos();
    this._activarPaulette();
    const view = document.getElementById('view-salud');
    if (!view) return false;
    view.innerHTML = `<div class="salud-container">${this._contenidoPrincipal()}</div>`;
    this._bind(view);
    this.mostrarFicha('tropicales', { hablar: false });
    this._hablar(
      'Hola, soy Paulette. Estoy aqui para cuidar de ti y de los tuyos.'
    );
    return true;
  },

  abrirPanel() {
    this._asegurarEstilos();
    this._activarPaulette();
    const panel = document.getElementById('panel-novedades');
    if (!panel) return false;
    panel.style.maxWidth = '860px';
    panel.innerHTML = `
      <div class="novedad-card" data-experto="Paulette" style="display:grid;gap:12px;max-height:84vh;overflow:auto">
        ${this._contenidoPrincipal()}
        <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px">
          <button type="button" onclick="Salud.iniciarTriaje()">Abrir triaje</button>
          <button type="button" onclick="Salud.abrirFichaVida()">Ficha de vida</button>
          <button type="button" onclick="Salud.abrirBotiquin()">Botiquin</button>
          <button type="button" onclick="Salud.llamarCentroMedico()">Llamar ahora</button>
          <button type="button" onclick="document.getElementById('panel-novedades').style.display='none'">Cerrar</button>
        </div>
      </div>`;
    panel.style.display = 'block';
    this._bind(panel);
    this.mostrarFicha('tropicales', { hablar: false });
    this._hablar(
      'Hola, soy Paulette. Estoy aqui para cuidar de ti y de los tuyos.'
    );
    return true;
  },

  mostrarFicha(tipo, opciones = {}) {
    const ficha = this._fichas[tipo] || this._fichas.tropicales;
    const detalle = this._obtenerDetalle();
    if (!detalle) {
      this.abrirPanel();
      return this.mostrarFicha(tipo, opciones);
    }
    this._activarPaulette();
    detalle.innerHTML = `
      <h3>${ficha.titulo}</h3>
      <p>${ficha.mensaje}</p>
      <ul class="salud-pasos">${ficha.pasos.map((paso) => `<li>${paso}</li>`).join('')}</ul>
      <div class="salud-acciones">
        <button type="button" onclick="Salud.repetirMensaje(${JSON.stringify(ficha.mensaje)})">Escuchar</button>
        <button type="button" class="salud-mini-btn secundario" onclick="Salud.iniciarTriaje()">Ir al triaje</button>
        <button type="button" class="salud-mini-btn secundario" onclick="Salud.abrirBotiquin()">Botiquin</button>
        ${tipo === 'urgencias' || tipo === 'picaduras' ? '<button type="button" class="salud-mini-btn secundario" onclick="Salud.llamarCentroMedico()">Llamar</button>' : ''}
      </div>`;
    if (opciones.hablar !== false) {
      this._hablar(ficha.mensaje);
    }
    return true;
  },

  repetirMensaje(mensaje) {
    this._activarPaulette();
    this._hablar(mensaje);
  },

  abrirFichaVida() {
    const detalle = this._obtenerDetalle();
    if (!detalle) {
      this.abrirPanel();
      return this.abrirFichaVida();
    }
    const perfil = this._leerPerfilSalud();
    detalle.innerHTML = `
      <h3>Ficha de Salud y Vida</h3>
      <p>Esta ficha se guarda offline y se cifra localmente para que Paulette pueda hablar por el paciente durante una emergencia.</p>
      <div class="salud-form-grid">
        <label><span>Nombre</span><input id="salud-perfil-nombre" type="text" value="${String(perfil.nombre || '').replace(/"/g, '&quot;')}" placeholder="Nombre completo"></label>
        <label><span>Grupo sanguineo</span><input id="salud-perfil-sangre" type="text" value="${String(perfil.tipoSangre || '').replace(/"/g, '&quot;')}" placeholder="Ej. O+"></label>
        <label><span>Alergias</span><input id="salud-perfil-alergias" type="text" value="${perfil.alergias.join(', ').replace(/"/g, '&quot;')}" placeholder="Ej. Penicilina, Aspirina"></label>
        <label><span>Enfermedades cronicas</span><input id="salud-perfil-condiciones" type="text" value="${perfil.condiciones.join(', ').replace(/"/g, '&quot;')}" placeholder="Ej. Diabetes, Hipertension"></label>
        <label><span>Medicacion diaria</span><input id="salud-perfil-medicacion" type="text" value="${perfil.medicacion.join(', ').replace(/"/g, '&quot;')}" placeholder="Ej. Enalapril 10mg"></label>
        <label><span>Contacto de emergencia</span><input id="salud-perfil-contacto-nombre" type="text" value="${String(perfil.contactoEmergenciaNombre || '').replace(/"/g, '&quot;')}" placeholder="Nombre del contacto"></label>
        <label><span>Numero de emergencia</span><input id="salud-perfil-contacto-numero" type="tel" value="${String(perfil.contactoEmergenciaNumero || '').replace(/"/g, '&quot;')}" placeholder="Ej. 0999999999"></label>
      </div>
      <div class="salud-resumen-perfil">
        <strong>Resumen de rescate:</strong>
        <div>${this._resumenRescateHtml()}</div>
      </div>
      <div class="salud-acciones">
        <button type="button" onclick="Salud.guardarFichaVidaDesdeUI()">Guardar ficha</button>
        <button type="button" class="salud-mini-btn secundario" onclick="Salud.responderRescate()">Comando de rescate</button>
        <button type="button" class="salud-mini-btn secundario" onclick="Salud.armarReporteMedico()">Armar reporte</button>
      </div>`;
    return true;
  },

  guardarFichaVidaDesdeUI() {
    const perfil = this._guardarPerfilSalud({
      nombre: document.getElementById('salud-perfil-nombre')?.value || '',
      tipoSangre: document.getElementById('salud-perfil-sangre')?.value || '',
      alergias: document.getElementById('salud-perfil-alergias')?.value || '',
      condiciones:
        document.getElementById('salud-perfil-condiciones')?.value || '',
      medicacion:
        document.getElementById('salud-perfil-medicacion')?.value || '',
      contactoEmergenciaNombre:
        document.getElementById('salud-perfil-contacto-nombre')?.value || '',
      contactoEmergenciaNumero:
        document.getElementById('salud-perfil-contacto-numero')?.value || '',
    });
    this._hablar('Ficha de vida guardada offline y cifrada en este equipo.');
    this.abrirFichaVida();
    return perfil;
  },

  abrirBotiquin() {
    const detalle = this._obtenerDetalle();
    if (!detalle) {
      this.abrirPanel();
      return this.abrirBotiquin();
    }
    const inventario = this._leerInventarioBotiquin();
    detalle.innerHTML = `
      <h3>Botiquin de Campo Inteligente</h3>
      <p>Marca lo que ya tienes, revisa la caducidad y registra que medicina o insumo se uso antes de llegar al medico.</p>
      <div class="botiquin-lista">
        ${inventario
          .map((item) => {
            const meta = this._medicinasCatalogo[item.id] || {};
            return `
              <article class="botiquin-item">
                <div class="botiquin-item-header">
                  <div>
                    <strong>${item.nombre}</strong>
                    <div><span class="salud-tag">${item.categoria}</span></div>
                  </div>
                  <label style="display:flex;align-items:center;gap:8px"><input type="checkbox" data-botiquin-tiene="${item.id}" ${item.tiene ? 'checked' : ''}> Tengo este insumo</label>
                </div>
                <small>Uso segun Paulette: ${meta.uso || item.uso || 'sin dato'}.</small>
                <label style="display:grid;gap:6px"><span>Fecha de vencimiento</span><input type="date" data-botiquin-vence="${item.id}" value="${item.fechaVencimiento || ''}"></label>
                <div class="salud-acciones">
                  <button type="button" onclick="Salud.consultarUsoBotiquin('${item.id}')">Consultar uso</button>
                  <button type="button" class="salud-mini-btn secundario" onclick="Salud.registrarMedicacionDesdeBotiquin('${item.id}')">Registrar en reporte</button>
                </div>
              </article>`;
          })
          .join('')}
      </div>
      <div class="salud-acciones">
        <button type="button" onclick="Salud.guardarBotiquinDesdeUI()">Guardar botiquin</button>
        <button type="button" class="salud-mini-btn secundario" onclick="Salud.verificarCaducidadBotiquin()">Verificar caducidad</button>
        <button type="button" class="salud-mini-btn secundario" onclick="Salud.armarReporteMedico()">Abrir reporte medico</button>
      </div>`;
    return true;
  },

  guardarBotiquinDesdeUI() {
    const inventario = this._leerInventarioBotiquin().map((item) => ({
      ...item,
      tiene: Boolean(
        document.querySelector(`[data-botiquin-tiene="${item.id}"]`)?.checked
      ),
      fechaVencimiento:
        document.querySelector(`[data-botiquin-vence="${item.id}"]`)?.value ||
        '',
    }));
    this._guardarInventarioBotiquin(inventario);
    this._hablar('Botiquin guardado. Ya puedo revisar caducidad y uso seguro.');
    return inventario;
  },

  verificarCaducidadBotiquin(inventario = this._leerInventarioBotiquin()) {
    const hoy = new Date().toISOString().slice(0, 10);
    const vencidos = inventario.filter(
      (item) =>
        item.tiene && item.fechaVencimiento && item.fechaVencimiento < hoy
    );
    if (vencidos.length) {
      this._hablar(
        vencidos
          .map(
            (med) =>
              `Paulette advierte: Tu ${med.nombre} ha caducado. Por favor, desecha ese insumo y consigue uno nuevo.`
          )
          .join(' ')
      );
      return vencidos;
    }
    return [];
  },

  consultarUsoBotiquin(medicinaId) {
    const medicina = this._medicinasCatalogo[medicinaId];
    if (!medicina) return false;
    if (!window.PerfilSalud.validarCompatibilidad(medicina.nombre)) {
      return false;
    }
    this._hablar(
      `Paulette informa: ${medicina.nombre} se usa para ${medicina.uso}. ${medicina.advertencia} Recuerda decirle al medico si ya tomaste una dosis.`
    );
    return true;
  },

  registrarMedicacionDesdeBotiquin(medicinaId) {
    const medicina = this._medicinasCatalogo[medicinaId];
    if (!medicina) return false;
    const hora = new Date().toLocaleTimeString('es-EC', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const dosis = window.prompt(
      `Dosis o detalle para ${medicina.nombre}`,
      medicinaId === 'paracetamol' ? '500mg' : 'Uso de apoyo'
    );
    if (dosis === null) return false;
    if (!this._reporteActual) {
      this.armarReporteMedico();
    }
    this._reporteActual = {
      ...(this._reporteActual || {}),
      medicamentosAdministrados: [
        ...((this._reporteActual &&
          this._reporteActual.medicamentosAdministrados) ||
          []),
        {
          nombre: medicina.nombre,
          dosis: String(dosis || '').trim() || 'Sin especificar',
          hora,
        },
      ],
    };
    this._hablar(
      `${medicina.nombre} registrado en el reporte medico a las ${hora}.`
    );
    return true;
  },

  abrirModoPanico(tipo = null) {
    this._asegurarEstilos();
    this._activarPaulette();
    const overlay = this._asegurarOverlayPanico();
    if (!overlay) return false;
    document.body.classList.add('paulette-panico-activo');
    overlay.className = 'activo';
    this._estadoPanico.activo = true;
    if (!tipo || !this._emergencias[tipo]) {
      this._estadoPanico.tipo = null;
      this._estadoPanico.paso = 0;
      overlay.innerHTML = `
        <div class="panico-cabecera">
          <div>
            <strong>Modo Panico · Paulette</strong>
            <div>Elige la emergencia. Sigue solo ordenes directas.</div>
          </div>
          <span class="panico-chip">ALTO CONTRASTE</span>
        </div>
        <div class="panico-menu">
          <button type="button" class="panico-boton" onclick="Salud.abrirModoPanico('picaduras')">${this._iconoEmergencia('picaduras')}<div>Picaduras y mordeduras</div><span>No cortes. No torniquete.</span></button>
          <button type="button" class="panico-boton" onclick="Salud.abrirModoPanico('abdominal')">${this._iconoEmergencia('abdominal')}<div>Dolor abdominal agudo</div><span>Evalua alarma y traslado.</span></button>
          <button type="button" class="panico-boton" onclick="Salud.abrirModoPanico('agroquimicos')">${this._iconoEmergencia('agroquimicos')}<div>Intoxicacion quimica</div><span>Sal, quita ropa, lava.</span></button>
          <button type="button" class="panico-boton" onclick="Salud.abrirModoPanico('hemorragia')">${this._iconoEmergencia('hemorragia')}<div>Hemorragia</div><span>Presion directa y elevacion.</span></button>
          <button type="button" class="panico-boton" onclick="Salud.abrirModoPanico('fractura')">${this._iconoEmergencia('fractura')}<div>Fractura o atrapamiento</div><span>Inmoviliza, no recolocar.</span></button>
        </div>
        <div class="panico-pie">
          <button type="button" class="alerta" onclick="Salud.llamarCentroMedico()">Llamar</button>
          <button type="button" class="principal" onclick="Salud.armarReporteMedico()">Arma el reporte</button>
          <button type="button" class="secundario" onclick="Salud.cerrarModoPanico()">Cerrar</button>
        </div>`;
      this._hablar(
        'Modo panico activado. Elige picaduras, dolor abdominal, intoxicacion, hemorragia o fractura.'
      );
      return true;
    }
    this._estadoPanico.tipo = tipo;
    this._estadoPanico.paso = 0;
    return this._renderManualPanico();
  },

  _renderManualPanico() {
    const overlay = this._asegurarOverlayPanico();
    const manual = this._emergencias[this._estadoPanico.tipo];
    if (!overlay || !manual) return false;
    const paso = manual.pasos[this._estadoPanico.paso] || manual.pasos[0];
    const pasoActual = this._estadoPanico.paso + 1;
    overlay.innerHTML = `
      <div class="panico-cabecera">
        <div>
          <strong>${manual.titulo}</strong>
          <div>Paso ${pasoActual} de ${manual.pasos.length}. Sigue la orden y evita improvisar.</div>
        </div>
        <span class="panico-chip">PAULETTE AL MANDO</span>
      </div>
      <div class="panico-manual">
        <article class="panico-paso">
          <div class="panico-paso-header">
            ${manual.icono}
            <div style="margin-left:auto;text-align:right;font-weight:800">${pasoActual}/${manual.pasos.length}</div>
          </div>
          <div class="panico-orden">${paso.orden}</div>
          <div class="panico-detalle">${paso.detalle}</div>
          <div class="panico-bloque alerta"><strong>PROHIBIDO</strong>${manual.prohibido}</div>
          <div class="panico-bloque"><strong>ORDEN DE PAULETTE</strong>${manual.ordenFinal}</div>
          <div class="panico-acciones">
            <button type="button" class="principal" onclick="Salud.repetirManualPanico()">Repetir por voz</button>
            <button type="button" class="alerta" onclick="Salud.llamarCentroMedico()">Llamar</button>
            <button type="button" class="secundario" onclick="Salud.armarReporteMedico()">Arma el reporte</button>
            <button type="button" class="secundario" onclick="Salud.leerParaDoctor()">Lee para el doctor</button>
          </div>
        </article>
      </div>
      <div class="panico-pie">
        <button type="button" class="secundario" onclick="Salud.pasoAnteriorPanico()">Anterior</button>
        <button type="button" class="principal" onclick="Salud.siguientePasoPanico()">Siguiente</button>
        <button type="button" class="alerta" onclick="Salud.cerrarModoPanico()">Salir</button>
      </div>`;
    this._hablar(`${manual.audio_urgente} ${paso.orden}. ${paso.detalle}`);
    return true;
  },

  siguientePasoPanico() {
    const manual = this._emergencias[this._estadoPanico.tipo];
    if (!manual) return this.abrirModoPanico();
    this._estadoPanico.paso = Math.min(
      this._estadoPanico.paso + 1,
      manual.pasos.length - 1
    );
    return this._renderManualPanico();
  },

  pasoAnteriorPanico() {
    const manual = this._emergencias[this._estadoPanico.tipo];
    if (!manual) return this.abrirModoPanico();
    this._estadoPanico.paso = Math.max(this._estadoPanico.paso - 1, 0);
    return this._renderManualPanico();
  },

  repetirManualPanico() {
    const manual = this._emergencias[this._estadoPanico.tipo];
    const paso = manual?.pasos?.[this._estadoPanico.paso];
    if (!manual || !paso) return false;
    this._hablar(`${paso.orden}. ${paso.detalle}. ${manual.prohibido}`);
    return true;
  },

  cerrarModoPanico() {
    const overlay = document.getElementById('paulette-panico');
    if (overlay) {
      overlay.className = '';
      overlay.style.display = 'none';
      overlay.innerHTML = '';
    }
    document.body.classList.remove('paulette-panico-activo');
    this._estadoPanico = { activo: false, tipo: null, paso: 0 };
    return true;
  },

  armarReporteMedico(datos = {}) {
    const perfil = this._leerPerfilSalud();
    const manual = this._emergencias[this._estadoPanico.tipo] || null;
    const sintomaBase =
      datos.sintoma ||
      manual?.resumenSintoma ||
      this._resumenEmergencia('picaduras');
    const horaEvento =
      datos.horaEvento ||
      new Date().toLocaleTimeString('es-EC', {
        hour: '2-digit',
        minute: '2-digit',
      });
    const alergias = datos.alergias || perfil.alergias || ['No registradas'];
    const medicamentosAdministrados =
      datos.medicamentosAdministrados ||
      this._reporteActual?.medicamentosAdministrados ||
      [];
    this._reporteActual = {
      nombre: perfil.nombre,
      horaEvento,
      sintoma: sintomaBase,
      alergias,
      antecedentes: window.PerfilSalud?.generarResumenMedico?.() || '',
      medicamentosAdministrados,
      observaciones:
        datos.observaciones ||
        manual?.ordenFinal ||
        'Sin observaciones adicionales.',
    };

    const panel = document.getElementById('panel-novedades');
    if (!panel) return false;
    this._activarPaulette();
    panel.style.maxWidth = '760px';
    panel.innerHTML = `
      <div class="novedad-card" data-experto="Paulette" style="display:grid;gap:12px;max-height:84vh;overflow:auto">
        <div>
          <p class="novedad-n1" style="margin:0">Paulette · Reporte para el medico</p>
          <p class="novedad-n2" style="margin:6px 0 0">Completa solo lo esencial para que el personal medico reciba un reporte corto y util.</p>
        </div>
        <div class="salud-reporte-form">
          <label><span>Hora del evento</span><input id="salud-reporte-hora" type="text" value="${horaEvento}" placeholder="Ej. 14:35"></label>
          <label><span>Sintoma principal</span><input id="salud-reporte-sintoma" type="text" value="${String(sintomaBase).replace(/"/g, '&quot;')}" placeholder="Ej. dolor abdominal agudo"></label>
          <label><span>Alergias</span><input id="salud-reporte-alergias" type="text" value="${(Array.isArray(alergias) ? alergias.join(', ') : String(alergias)).replace(/"/g, '&quot;')}" placeholder="Ej. penicilina"></label>
          <label><span>Observaciones</span><textarea id="salud-reporte-observaciones" rows="3" placeholder="Datos extra para el medico">${String(this._reporteActual.observaciones).replace(/</g, '&lt;')}</textarea></label>
        </div>
        <div class="salud-reporte-previo">${this._reporteTexto(this._reporteActual)}</div>
        <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px">
          <button type="button" onclick="Salud.actualizarReporteMedicoDesdeUI()">Guardar reporte</button>
          <button type="button" onclick="Salud.abrirBotiquin()">Botiquin</button>
          <button type="button" onclick="Salud.leerParaDoctor()">Leer para el doctor</button>
          <button type="button" onclick="Salud.llamarCentroMedico()">Llamar</button>
          <button type="button" onclick="document.getElementById('panel-novedades').style.display='none'">Cerrar</button>
        </div>
      </div>`;
    panel.style.display = 'block';
    this._hablar(
      'Estoy armando el reporte para el medico. Revisa hora del evento, sintoma principal y alergias.'
    );
    return true;
  },

  actualizarReporteMedicoDesdeUI() {
    const hora = document.getElementById('salud-reporte-hora')?.value || '';
    const sintoma =
      document.getElementById('salud-reporte-sintoma')?.value || '';
    const alergias =
      document.getElementById('salud-reporte-alergias')?.value ||
      'No registradas';
    const observaciones =
      document.getElementById('salud-reporte-observaciones')?.value || '';
    this._guardarPerfilSalud({ alergias });
    return this.armarReporteMedico({
      horaEvento: hora,
      sintoma,
      alergias,
      observaciones,
      medicamentosAdministrados:
        this._reporteActual?.medicamentosAdministrados || [],
    });
  },

  leerParaDoctor() {
    if (!this._reporteActual) {
      this.armarReporteMedico();
      return true;
    }
    const texto = this._reporteTexto(this._reporteActual);
    this._activarPaulette();
    this._hablar(texto);
    return true;
  },

  responderRescate() {
    this._registrarUsoComando('paulette_rescate_paciente');
    if (!this._reporteActual) {
      this.armarReporteMedico();
    }
    this._hablar(this._resumenRescateVoz());
    return true;
  },

  _resolverSintoma(textoLibre = '') {
    const texto = this._normalizar(textoLibre);
    if (
      texto.includes('cabeza') ||
      texto.includes('mareo') ||
      texto.includes('sol')
    ) {
      return 'cabeza';
    }
    if (
      texto.includes('espalda') ||
      texto.includes('cintura') ||
      texto.includes('hombro')
    ) {
      return 'espalda';
    }
    if (texto.includes('fiebre') || texto.includes('escalofrio')) {
      return 'fiebre';
    }
    if (
      texto.includes('picadura') ||
      texto.includes('mordedura') ||
      texto.includes('serpiente')
    ) {
      return 'picadura';
    }
    if (texto.includes('quimic') || texto.includes('fumig')) {
      return 'quimicos';
    }
    if (
      texto.includes('abdomen') ||
      texto.includes('barriga') ||
      texto.includes('ombligo') ||
      texto.includes('pancrea')
    ) {
      return 'abdominal';
    }
    if (
      texto.includes('corte') ||
      texto.includes('sangra') ||
      texto.includes('hemorrag')
    ) {
      return 'hemorragia';
    }
    if (
      texto.includes('fractura') ||
      texto.includes('hueso') ||
      texto.includes('amput') ||
      texto.includes('atrap')
    ) {
      return 'fractura';
    }
    return null;
  },

  iniciarTriaje(textoLibre = '') {
    const detalle = this._obtenerDetalle();
    if (!detalle) {
      this.abrirPanel();
      return this.iniciarTriaje(textoLibre);
    }
    const sugerido = this._resolverSintoma(textoLibre);
    const pista = sugerido && this._triaje[sugerido]?.mensaje;
    const alerta = pista
      ? `<div class="salud-alerta"><strong>Pista detectada:</strong> ${pista}</div>`
      : '<div class="salud-alerta"><strong>Atencion:</strong> Si hay desmayo, sangrado fuerte o dificultad para respirar, llama de inmediato.</div>';
    detalle.innerHTML = `
      <h3>Detector de sintomas</h3>
      <p>Selecciona el malestar principal para que Paulette te guie con una recomendacion inicial offline.</p>
      ${alerta}
      <div class="salud-triaje-grid">
        <button type="button" class="salud-mini-btn" onclick="Salud.seleccionarSintoma('fiebre')">Fiebre</button>
        <button type="button" class="salud-mini-btn" onclick="Salud.seleccionarSintoma('cabeza')">Cabeza o mareo</button>
        <button type="button" class="salud-mini-btn" onclick="Salud.seleccionarSintoma('espalda')">Espalda</button>
        <button type="button" class="salud-mini-btn" onclick="Salud.seleccionarSintoma('picadura')">Picadura</button>
        <button type="button" class="salud-mini-btn" onclick="Salud.seleccionarSintoma('quimicos')">Quimicos</button>
        <button type="button" class="salud-mini-btn" onclick="Salud.abrirModoPanico('abdominal')">Abdomen agudo</button>
        <button type="button" class="salud-mini-btn" onclick="Salud.abrirModoPanico('hemorragia')">Hemorragia</button>
        <button type="button" class="salud-mini-btn" onclick="Salud.abrirModoPanico('fractura')">Fractura</button>
      </div>
      <div class="salud-acciones">
        <button type="button" onclick="Salud.llamarCentroMedico()">Centro medico</button>
        <button type="button" class="salud-mini-btn secundario" onclick="Salud.mostrarFicha('sol')">Cuidados del sol</button>
      </div>`;
    this._activarPaulette();
    this._hablar(
      pista ||
        'Vamos a revisar el sintoma principal. Si ves signos graves, activa llamada de inmediato.'
    );
    return true;
  },

  seleccionarSintoma(tipo) {
    const item = this._triaje[tipo];
    if (!item) return false;
    const detalle = this._obtenerDetalle();
    if (!detalle) return false;
    detalle.innerHTML = `
      <h3>${item.titulo}</h3>
      <p>${item.mensaje}</p>
      <div class="salud-acciones">
        <button type="button" onclick="Salud.repetirMensaje(${JSON.stringify(item.mensaje)})">Escuchar</button>
        <button type="button" class="salud-mini-btn secundario" onclick="Salud.iniciarTriaje()">Cambiar sintoma</button>
        <button type="button" class="salud-mini-btn secundario" onclick="Salud.llamarCentroMedico()">Llamar</button>
      </div>`;
    this._activarPaulette();
    this._hablar(item.mensaje);
    return true;
  },

  llamarCentroMedico() {
    const numero = this._numeroEmergencia();
    this._activarPaulette();
    this._hablar(`Preparando llamada al centro medico ${numero}.`);
    window.location.href = `tel:${numero}`;
    return true;
  },
};

const PerfilSalud = {
  get datos() {
    return Salud._leerPerfilSalud();
  },

  validarCompatibilidad(medicinaRecomendada) {
    const medicina = String(medicinaRecomendada || '').toLowerCase();
    const alergias = (this.datos.alergias || []).map((item) =>
      String(item || '').toLowerCase()
    );
    const incompatible = alergias.find((item) => medicina.includes(item));
    if (incompatible) {
      window.MelantiaVoz?.hablar(
        `Alerta. Paulette detecta que eres alergico a ${incompatible}. No la uses.`,
        'paulette'
      );
      return false;
    }
    return true;
  },

  generarResumenMedico() {
    const datos = this.datos;
    const condiciones = datos.condiciones.length
      ? datos.condiciones.join(', ')
      : 'sin condiciones cronicas registradas';
    const alergias = datos.alergias.length
      ? datos.alergias.join(', ')
      : 'sin alergias registradas';
    const medicacion = datos.medicacion.length
      ? datos.medicacion.join(', ')
      : 'sin medicacion diaria registrada';
    return `ANTECEDENTES: ${condiciones}. ALERGIAS: ${alergias}. MEDICACION DIARIA: ${medicacion}. TIPO DE SANGRE: ${datos.tipoSangre || 'No registrado'}.`;
  },
};

const Botiquin = {
  verificarCaducidad(inventario) {
    return Salud.verificarCaducidadBotiquin(inventario);
  },

  consultarUso(medicina) {
    return Salud.consultarUsoBotiquin(medicina);
  },
};

const ComandosPaulette = {
  procesar(comandoOriginal) {
    const comando = Salud._normalizar(comandoOriginal);
    if (!comando || !comando.includes('paulette')) return false;

    if (
      comando.includes('que tiene el paciente') ||
      comando.includes('ayuda emergencia')
    ) {
      Salud.responderRescate();
      return true;
    }

    if (comando.includes('emergencia') || comando.includes('ayuda')) {
      Salud._registrarUsoComando('paulette_emergencia');
      Salud.abrirModoPanico();
      return true;
    }

    if (
      comando.includes('duele') ||
      comando.includes('sintoma') ||
      comando.includes('sintomas')
    ) {
      Salud._registrarUsoComando('paulette_triaje');
      Salud.abrirPanel();
      Salud.iniciarTriaje(comando);
      return true;
    }

    if (
      comando.includes('cuidados del sol') ||
      comando.includes('golpe de calor') ||
      comando.includes('sol')
    ) {
      Salud._registrarUsoComando('paulette_sol');
      Salud.abrirPanel();
      Salud.mostrarFicha('sol');
      return true;
    }

    if (comando.includes('dengue')) {
      Salud._registrarUsoComando('paulette_dengue');
      Salud.abrirPanel();
      Salud.mostrarFicha('tropicales');
      return true;
    }

    if (
      comando.includes('pausa activa') ||
      comando.includes('estirar') ||
      comando.includes('espalda')
    ) {
      Salud._registrarUsoComando('paulette_pausa_activa');
      Salud.abrirPanel();
      Salud.mostrarFicha('espalda');
      return true;
    }

    if (
      comando.includes('mordedura') ||
      comando.includes('picadura') ||
      comando.includes('serpiente') ||
      comando.includes('arana')
    ) {
      Salud._registrarUsoComando('paulette_picaduras');
      Salud.abrirModoPanico('picaduras');
      return true;
    }

    if (
      comando.includes('dolor abdominal') ||
      comando.includes('apendicitis') ||
      comando.includes('pancreatitis')
    ) {
      Salud._registrarUsoComando('paulette_abdomen_agudo');
      Salud.abrirModoPanico('abdominal');
      return true;
    }

    if (
      comando.includes('agroquimico') ||
      comando.includes('fumigacion') ||
      comando.includes('intoxicacion')
    ) {
      Salud._registrarUsoComando('paulette_agroquimicos');
      Salud.abrirModoPanico('agroquimicos');
      return true;
    }

    if (
      comando.includes('hemorragia') ||
      comando.includes('corte profundo') ||
      comando.includes('machete') ||
      comando.includes('motosierra') ||
      comando.includes('sangra mucho')
    ) {
      Salud._registrarUsoComando('paulette_hemorragia');
      Salud.abrirModoPanico('hemorragia');
      return true;
    }

    if (
      comando.includes('fractura') ||
      comando.includes('atrapamiento') ||
      comando.includes('amputacion')
    ) {
      Salud._registrarUsoComando('paulette_fractura');
      Salud.abrirModoPanico('fractura');
      return true;
    }

    if (comando.includes('arma el reporte')) {
      Salud._registrarUsoComando('paulette_arma_reporte');
      Salud.armarReporteMedico();
      return true;
    }

    if (comando.includes('lee para el doctor')) {
      Salud._registrarUsoComando('paulette_lee_doctor');
      Salud.leerParaDoctor();
      return true;
    }

    if (
      comando.includes('botiquin') ||
      comando.includes('paracetamol') ||
      comando.includes('suero oral') ||
      comando.includes('antigripal')
    ) {
      Salud._registrarUsoComando('paulette_botiquin');
      Salud.abrirPanel();
      Salud.abrirBotiquin();
      if (comando.includes('paracetamol'))
        Salud.consultarUsoBotiquin('paracetamol');
      if (comando.includes('suero oral'))
        Salud.consultarUsoBotiquin('suero_oral');
      if (comando.includes('antigripal'))
        Salud.consultarUsoBotiquin('antigripal');
      return true;
    }

    if (
      comando.includes('ficha de vida') ||
      comando.includes('antecedentes') ||
      comando.includes('perfil de salud')
    ) {
      Salud._registrarUsoComando('paulette_ficha_vida');
      Salud.abrirPanel();
      Salud.abrirFichaVida();
      return true;
    }

    Salud.abrirPanel();
    Salud.repetirMensaje(
      'Puedes pedirme emergencia, detector de sintomas, cuidados del sol, dengue, pausa activa, hemorragia, fractura, ficha de vida, botiquin, arma el reporte o lee para el doctor.'
    );
    return true;
  },
};

window.Salud = Salud;
window.ComandosPaulette = ComandosPaulette;
window.PerfilSalud = PerfilSalud;
window.Botiquin = Botiquin;

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('view-salud')) Salud.init();
});
