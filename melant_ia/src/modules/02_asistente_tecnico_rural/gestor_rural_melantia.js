(() => {
  const _RUTA_CULTIVOS =
    'knowledge_seeds/02_asistentes_especificos/data_cultivos.json';
  const _RUTA_SUELOS =
    'modules/asistente_tecnico_rural/datos_suelos_referencia.json.json';
  const _CLAVE_REPORTES = 'melantia_reportes_rurales';
  const _DB_RURAL = 'melantia_rural';
  const _DB_VERSION_RURAL = 2;
  const _STORE_CLIMA = 'cache_clima';
  const _STORE_CLIMA_HIST = 'historial_clima';
  const _STORE_EXPEDIENTE = 'expediente_agronomico';
  const _STORE_EVIDENCIA = 'evidencia_rural';
  const _CLIMA_CACHE_MS = 6 * 60 * 60 * 1000;
  const _CLIMA_GEOFENCE_M = 1000;
  const _VENTANAS_SINCRO = [
    { nombre: 'manana', inicio: 6, intentos: 4, intervaloMin: 15 },
    { nombre: 'tarde', inicio: 12, intentos: 4, intervaloMin: 15 },
    { nombre: 'noche', inicio: 19, intentos: 4, intervaloMin: 15 },
  ];
  const _ENTREVISTA_CULTIVOS = {
    maiz: {
      cultivo: 'Maíz',
      fases: [
        'Emergencia',
        'Vigor (V3-V8)',
        'Floración (R1)',
        'Llenado',
        'Madurez',
      ],
      alertasClave: [
        'Gusano Cogollero',
        'Mancha de Asfalto',
        'Deficiencia de N',
      ],
      preguntasEspecificas: [
        {
          id: 'mz_1',
          pregunta:
            '¿Ves perforaciones circulares en las hojas nuevas (cogollo)?',
          tipo: 'plaga',
          opciones: ['Sí', 'No'],
        },
        {
          id: 'mz_2',
          pregunta:
            "¿El amarillamiento es en forma de 'V' invertida en hojas viejas?",
          tipo: 'nutricion',
          opciones: ['Sí', 'No'],
        },
      ],
    },
    platano_banano: {
      cultivo: 'Plátano/Banano',
      fases: [
        'Puyón/Crecimiento',
        'Pre-floración',
        'Parición',
        'Llenado de racimo',
      ],
      alertasClave: ['Sigatoka Negra', 'Moko', 'Picudo Negro'],
      preguntasEspecificas: [
        {
          id: 'pl_1',
          pregunta:
            '¿Ves rayas color café o negras paralelas a las venas de la hoja?',
          tipo: 'fitosanitario',
          opciones: ['Sí', 'No'],
        },
        {
          id: 'pl_2',
          pregunta: '¿La hoja bandera se ve marchita o doblada prematuramente?',
          tipo: 'moko_alerta',
          opciones: ['Sí', 'No'],
        },
      ],
    },
    cacao: {
      cultivo: 'Cacao',
      fases: ['Crecimiento', 'Floración', 'Fructificación', 'Cosecha'],
      alertasClave: ['Monilla', 'Escoba de Bruja', 'Mazorca Negra'],
      preguntasEspecificas: [
        {
          id: 'ca_1',
          pregunta:
            '¿Los frutos tienen un polvo blanco o manchas color chocolate?',
          tipo: 'monilla',
          opciones: ['Sí', 'No'],
        },
        {
          id: 'ca_2',
          pregunta:
            '¿Ves deformaciones en las ramas (crecimiento tipo escoba)?',
          tipo: 'escoba_bruja',
          opciones: ['Sí', 'No'],
        },
      ],
    },
    palma_africana: {
      cultivo: 'Palma Africana',
      fases: ['Vivero', 'Juvenil', 'Producción'],
      alertasClave: ['Pudrición de Cogollo (PC)', 'Marchitez Sorpresiva'],
      preguntasEspecificas: [
        {
          id: 'pa_1',
          pregunta:
            '¿Las flechas (hojas nuevas) se ven amarillentas o con pudrición en la base?',
          tipo: 'PC_alerta',
          opciones: ['Sí', 'No'],
        },
        {
          id: 'pa_2',
          pregunta:
            '¿Hay secamiento progresivo de las hojas de abajo hacia arriba?',
          tipo: 'marchitez',
          opciones: ['Sí', 'No'],
        },
      ],
    },
    general: {
      cultivo: 'Cultivo general',
      fases: ['Siembra', 'Desarrollo', 'Floración', 'Llenado', 'Cosecha'],
      alertasClave: [
        'Estrés hídrico',
        'Deficiencia nutricional',
        'Problema fitosanitario',
      ],
      preguntasEspecificas: [],
    },
  };

  const GestorRuralMelantia = {
    _cache: {
      cultivos: null,
      suelos: null,
    },
    _db: null,
    _guiaEntrevista: {
      timers: [],
      bloqueActivo: null,
    },
    _sincroClima: {
      timerId: null,
      ventanaKey: null,
      intentos: 0,
      listenersRegistrados: false,
      ultimaProgramacion: null,
    },

    _escaparHtml(valor) {
      return String(valor ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    _normalizar(valor) {
      return String(valor || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
    },

    _capitalizar(valor) {
      const texto = String(valor || '').trim();
      return texto
        ? texto.charAt(0).toUpperCase() + texto.slice(1)
        : 'Sin dato';
    },

    async inicializar() {
      if (this._db) return;
      this._db = await new Promise((resolve, reject) => {
        const req = indexedDB.open(_DB_RURAL, _DB_VERSION_RURAL);

        req.onupgradeneeded = (event) => {
          const db = event.target.result;

          if (!db.objectStoreNames.contains(_STORE_CLIMA)) {
            const clima = db.createObjectStore(_STORE_CLIMA, {
              keyPath: 'id',
            });
            clima.createIndex('idx_lote', 'id_lote', { unique: false });
            clima.createIndex('idx_timestamp', 'timestamp', { unique: false });
          }

          if (!db.objectStoreNames.contains(_STORE_CLIMA_HIST)) {
            const historial = db.createObjectStore(_STORE_CLIMA_HIST, {
              keyPath: 'id',
            });
            historial.createIndex('idx_lote_fecha', ['id_lote', 'fecha'], {
              unique: true,
            });
            historial.createIndex('idx_fecha', 'fecha', { unique: false });
          }

          if (!db.objectStoreNames.contains(_STORE_EXPEDIENTE)) {
            const expediente = db.createObjectStore(_STORE_EXPEDIENTE, {
              keyPath: 'id',
            });
            expediente.createIndex('idx_lote', 'id_lote', { unique: false });
            expediente.createIndex('idx_fecha', 'fecha_registro', {
              unique: false,
            });
            expediente.createIndex(
              'idx_lote_fecha',
              ['id_lote', 'fecha_registro'],
              {
                unique: false,
              }
            );
          }

          if (!db.objectStoreNames.contains(_STORE_EVIDENCIA)) {
            const evidencia = db.createObjectStore(_STORE_EVIDENCIA, {
              keyPath: 'id',
            });
            evidencia.createIndex('idx_lote', 'id_lote', { unique: false });
            evidencia.createIndex('idx_sesion', 'id_sesion', { unique: false });
            evidencia.createIndex('idx_fecha', 'fecha_iso', { unique: false });
          }
        };

        req.onsuccess = (event) => resolve(event.target.result);
        req.onerror = (event) => reject(event.target.error);
      });
    },

    _tx(storeName, modo = 'readwrite') {
      return this._db.transaction([storeName], modo).objectStore(storeName);
    },

    async _put(storeName, payload) {
      await this.inicializar();
      return new Promise((resolve, reject) => {
        const req = this._tx(storeName, 'readwrite').put(payload);
        req.onsuccess = () => resolve(payload);
        req.onerror = () => reject(req.error);
      });
    },

    async _get(storeName, id) {
      await this.inicializar();
      return new Promise((resolve, reject) => {
        const req = this._tx(storeName, 'readonly').get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    },

    async _getAllByIndex(storeName, indexName, value) {
      await this.inicializar();
      return new Promise((resolve, reject) => {
        const req = this._tx(storeName, 'readonly')
          .index(indexName)
          .getAll(IDBKeyRange.only(value));
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    },

    _distanciaMetros(lat1, lon1, lat2, lon2) {
      const rad = (grados) => (grados * Math.PI) / 180;
      const R = 6371000;
      const dLat = rad(lat2 - lat1);
      const dLon = rad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(rad(lat1)) *
          Math.cos(rad(lat2)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },

    _claveClima(idLote, lat, lon) {
      const lote = String(idLote || 'general');
      const latTxt = Number(lat || 0).toFixed(3);
      const lonTxt = Number(lon || 0).toFixed(3);
      return `clima_${lote}_${latTxt}_${lonTxt}`;
    },

    async _resolverUbicacionClima(lote, opciones = {}) {
      const latitud = Number(
        opciones.latitud ||
          opciones.lat ||
          lote?.latitud ||
          lote?.lat ||
          window._melantia_session?.latitud ||
          window._melantia_session?.lat ||
          NaN
      );
      const longitud = Number(
        opciones.longitud ||
          opciones.lon ||
          opciones.longitudGps ||
          lote?.longitud ||
          lote?.lon ||
          window._melantia_session?.longitud ||
          window._melantia_session?.lon ||
          NaN
      );

      if (Number.isFinite(latitud) && Number.isFinite(longitud)) {
        return { latitud, longitud, fuente: 'sesion' };
      }

      if (!navigator.geolocation) return null;

      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (posicion) =>
            resolve({
              latitud: Number(posicion.coords.latitude.toFixed(5)),
              longitud: Number(posicion.coords.longitude.toFixed(5)),
              fuente: 'gps',
            }),
          () => resolve(null),
          {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 300000,
          }
        );
      });
    },

    async _consultarProveedorClima(latitud, longitud) {
      if (window.AgenciaClimaMelantia?.actualizarPronosticoLocal) {
        return window.AgenciaClimaMelantia.actualizarPronosticoLocal(
          latitud,
          longitud
        );
      }

      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(latitud)}` +
        `&longitude=${encodeURIComponent(longitud)}` +
        '&forecast_days=3&timezone=auto' +
        '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,et0_fao_evapotranspiration';
      const respuesta = await fetch(url, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (!respuesta.ok) {
        throw new Error('No pude consultar el proveedor meteorológico.');
      }
      const datos = await respuesta.json();
      return {
        nombre_estacion: datos.timezone || 'Estación meteorológica cercana',
        fuente: 'open-meteo',
        diario: (datos.daily?.time || []).map((fecha, indice) => ({
          fecha,
          temperatura_max: datos.daily?.temperature_2m_max?.[indice] ?? null,
          temperatura_min: datos.daily?.temperature_2m_min?.[indice] ?? null,
          probabilidad_lluvia:
            datos.daily?.precipitation_probability_max?.[indice] ?? null,
          lluvia_mm: datos.daily?.precipitation_sum?.[indice] ?? null,
          viento_max: datos.daily?.wind_speed_10m_max?.[indice] ?? null,
          et0: datos.daily?.et0_fao_evapotranspiration?.[indice] ?? null,
        })),
      };
    },

    async actualizarPronosticoLocal(idLote, opciones = {}) {
      const lote = await this._resolverLote(idLote);
      if (!lote) {
        throw new Error('No encontré un lote agrícola para actualizar clima.');
      }

      const ubicacion = await this._resolverUbicacionClima(lote, opciones);
      if (!ubicacion) {
        throw new Error('No pude resolver una ubicación para consultar clima.');
      }

      const datos = await this._consultarProveedorClima(
        ubicacion.latitud,
        ubicacion.longitud
      );
      const timestamp = Date.now();
      const registro = {
        id: this._claveClima(
          lote.id_lote,
          ubicacion.latitud,
          ubicacion.longitud
        ),
        id_lote: lote.id_lote || 'general',
        nombre_lote: lote.nombre_lote || 'Lote agrícola',
        latitud: ubicacion.latitud,
        longitud: ubicacion.longitud,
        ubicacion: datos.nombre_estacion || 'Estación cercana',
        fuente: datos.fuente || 'agencia_local',
        pronostico: Array.isArray(datos.diario) ? datos.diario : [],
        timestamp,
      };

      await this._put(_STORE_CLIMA, registro);

      for (const item of registro.pronostico) {
        await this._put(_STORE_CLIMA_HIST, {
          id: `${registro.id_lote}_${item.fecha}`,
          id_lote: registro.id_lote,
          fecha: item.fecha,
          fuente: registro.fuente,
          ubicacion: registro.ubicacion,
          lluvia_mm: item.lluvia_mm,
          probabilidad_lluvia: item.probabilidad_lluvia,
          temperatura_max: item.temperatura_max,
          temperatura_min: item.temperatura_min,
          viento_max: item.viento_max,
          et0: item.et0,
          timestamp,
        });
      }

      return registro;
    },

    async _obtenerCacheClima(idLote, opciones = {}) {
      const lote = await this._resolverLote(idLote);
      if (!lote) return null;

      const registros = await this._getAllByIndex(
        _STORE_CLIMA,
        'idx_lote',
        lote.id_lote || 'general'
      );
      if (!registros.length) return null;

      const ubicacion = await this._resolverUbicacionClima(lote, opciones);
      const ordenados = [...registros].sort(
        (a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0)
      );
      if (!ubicacion) return ordenados[0];

      const cercanos = ordenados.filter((registro) => {
        if (
          !Number.isFinite(registro.latitud) ||
          !Number.isFinite(registro.longitud)
        ) {
          return false;
        }
        return (
          this._distanciaMetros(
            ubicacion.latitud,
            ubicacion.longitud,
            registro.latitud,
            registro.longitud
          ) <= _CLIMA_GEOFENCE_M
        );
      });

      return (cercanos[0] || ordenados[0]) ?? null;
    },

    async _obtenerClimaVigente(idLote, opciones = {}) {
      await this.inicializar();
      let cache = await this._obtenerCacheClima(idLote, opciones);
      const expirado =
        !cache || Date.now() - Number(cache.timestamp || 0) > _CLIMA_CACHE_MS;

      if (navigator.onLine && expirado) {
        try {
          cache = await this.actualizarPronosticoLocal(idLote, opciones);
        } catch (error) {
          console.warn('[Rural] No pude refrescar el clima remoto:', error);
        }
      }

      return cache;
    },

    _analizarClimaAgronomico(fichaCultivo, fichaSuelo, clima) {
      const hoy = clima?.pronostico?.[0] || null;
      if (!hoy) {
        return {
          resumen:
            'Sin pronóstico meteorológico guardado. Fabrizzio seguirá operando solo con historial local y contexto del lote.',
          riesgo: 'sin-cache',
          lluvia: 0,
        };
      }

      const lluvia = Number(hoy.probabilidad_lluvia || 0);
      const lluviaMm = Number(hoy.lluvia_mm || 0);
      const viento = Number(hoy.viento_max || 0);
      const et0 = Number(hoy.et0 || 0);
      const tMin = Number(hoy.temperatura_min || 0);
      const zona = String(fichaSuelo?.zona || '').toLowerCase();

      if (lluvia >= 65 || lluviaMm >= 12) {
        return {
          resumen:
            'La agencia meteorológica prevé lluvia fuerte en las próximas horas. Fabrizzio recomienda posponer abonado con urea y aplicaciones foliares para no lavar la inversión.',
          riesgo: 'lluvia',
          lluvia,
        };
      }

      if (
        et0 >= 4.5 ||
        (viento >= 22 && Number(hoy.temperatura_max || 0) >= 28)
      ) {
        return {
          resumen:
            'Hoy habrá alta demanda evaporativa por radiación y viento. Fabrizzio recomienda riego temprano y revisar humedad del suelo antes del mediodía.',
          riesgo: 'evapotranspiracion',
          lluvia,
        };
      }

      if ((zona.includes('sierra') && tMin <= 6) || tMin <= 4) {
        return {
          resumen:
            'Se detecta riesgo de frío fuerte o helada. Fabrizzio recomienda vigilar hongos, quema por frío y evitar aplicaciones sensibles durante la madrugada.',
          riesgo: 'helada',
          lluvia,
        };
      }

      return {
        resumen: `Clima estable desde ${clima.ubicacion || 'la estación cercana'}. Puedes continuar labores normales con vigilancia básica del lote.`,
        riesgo: 'estable',
        lluvia,
      };
    },

    async sincronizarClimaTransparente() {
      return this.ejecutarCicloSincroClima(true);
    },

    _claveVentana(ventana, fechaBase = new Date()) {
      const dia = fechaBase.toISOString().slice(0, 10);
      return `${dia}_${ventana.nombre}`;
    },

    _fechaVentana(ventana, fechaBase = new Date()) {
      const fecha = new Date(fechaBase);
      fecha.setHours(ventana.inicio, 0, 0, 0);
      return fecha;
    },

    _fechaFinVentana(ventana, fechaBase = new Date()) {
      const fecha = this._fechaVentana(ventana, fechaBase);
      fecha.setMinutes(
        fecha.getMinutes() + (ventana.intentos - 1) * ventana.intervaloMin
      );
      return fecha;
    },

    _obtenerVentanaActiva(ahora = new Date()) {
      for (const ventana of _VENTANAS_SINCRO) {
        const inicio = this._fechaVentana(ventana, ahora);
        const fin = this._fechaFinVentana(ventana, ahora);
        if (ahora >= inicio && ahora <= fin) {
          return ventana;
        }
      }
      return null;
    },

    _proximaVentana(ahora = new Date()) {
      for (const ventana of _VENTANAS_SINCRO) {
        const inicio = this._fechaVentana(ventana, ahora);
        if (inicio > ahora) return { ventana, fecha: inicio };
      }
      const manana = new Date(ahora);
      manana.setDate(manana.getDate() + 1);
      const primera = _VENTANAS_SINCRO[0];
      return {
        ventana: primera,
        fecha: this._fechaVentana(primera, manana),
      };
    },

    _programarSiguienteIntento(fechaObjetivo) {
      if (this._sincroClima.timerId) {
        clearTimeout(this._sincroClima.timerId);
      }
      const espera = Math.max(1000, fechaObjetivo.getTime() - Date.now());
      this._sincroClima.ultimaProgramacion = fechaObjetivo.toISOString();
      this._sincroClima.timerId = setTimeout(() => {
        this.ejecutarCicloSincroClima();
      }, espera);
    },

    _reiniciarEstadoVentanaSiCambia(ventana, ahora = new Date()) {
      const clave = this._claveVentana(ventana, ahora);
      if (this._sincroClima.ventanaKey !== clave) {
        this._sincroClima.ventanaKey = clave;
        this._sincroClima.intentos = 0;
      }
    },

    _registrarListenersSincro() {
      if (this._sincroClima.listenersRegistrados) return;
      window.addEventListener('online', () => {
        this.ejecutarCicloSincroClima();
      });
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.ejecutarCicloSincroClima();
        }
      });
      this._sincroClima.listenersRegistrados = true;
    },

    async ejecutarCicloSincroClima(forzado = false) {
      await this.inicializar();
      const ahora = new Date();
      const ventanaActiva = this._obtenerVentanaActiva(ahora);

      if (!forzado && !ventanaActiva) {
        const proxima = this._proximaVentana(ahora);
        this._programarSiguienteIntento(proxima.fecha);
        return {
          estado: 'esperando_ventana',
          proximaVentana: proxima.ventana.nombre,
          fecha: proxima.fecha.toISOString(),
        };
      }

      const ventana =
        ventanaActiva ||
        _VENTANAS_SINCRO.find((item) => item.nombre === 'manana') ||
        _VENTANAS_SINCRO[0];
      this._reiniciarEstadoVentanaSiCambia(ventana, ahora);

      if (!navigator.onLine) {
        if (!forzado && this._sincroClima.intentos < ventana.intentos) {
          this._sincroClima.intentos += 1;
          const siguiente = new Date(ahora.getTime());
          siguiente.setMinutes(siguiente.getMinutes() + ventana.intervaloMin);
          if (
            this._sincroClima.intentos < ventana.intentos &&
            siguiente <= this._fechaFinVentana(ventana, ahora)
          ) {
            this._programarSiguienteIntento(siguiente);
          } else {
            const proxima = this._proximaVentana(ahora);
            this._programarSiguienteIntento(proxima.fecha);
          }
        }
        return {
          estado: 'sin_conexion',
          intentos: this._sincroClima.intentos,
          ventana: ventana.nombre,
        };
      }

      const lote = await this._resolverLote();
      if (!lote) {
        const proxima = this._proximaVentana(ahora);
        this._programarSiguienteIntento(proxima.fecha);
        return { estado: 'sin_lote' };
      }

      try {
        const resultado = await this.actualizarPronosticoLocal(lote.id_lote);
        this._sincroClima.intentos = 0;
        const proxima = this._proximaVentana(ahora);
        this._programarSiguienteIntento(proxima.fecha);
        return {
          estado: 'ok',
          ventana: ventana.nombre,
          ubicacion: resultado?.ubicacion || null,
          siguiente: proxima.fecha.toISOString(),
        };
      } catch (error) {
        console.warn(
          '[Rural] Fallo en ciclo de sincronización climática:',
          error
        );
        if (forzado) {
          throw error;
        }
        this._sincroClima.intentos += 1;
        if (this._sincroClima.intentos < ventana.intentos) {
          const siguiente = new Date(ahora.getTime());
          siguiente.setMinutes(siguiente.getMinutes() + ventana.intervaloMin);
          if (siguiente <= this._fechaFinVentana(ventana, ahora)) {
            this._programarSiguienteIntento(siguiente);
            return {
              estado: 'reintento_programado',
              intentos: this._sincroClima.intentos,
              ventana: ventana.nombre,
              siguiente: siguiente.toISOString(),
            };
          }
        }
        const proxima = this._proximaVentana(ahora);
        this._programarSiguienteIntento(proxima.fecha);
        return {
          estado: 'ventana_agotada',
          intentos: this._sincroClima.intentos,
          ventana: ventana.nombre,
          siguiente: proxima.fecha.toISOString(),
        };
      }
    },

    _calcularDosisArea(lote, fichaCultivo) {
      const areaHa = Number(lote?.area_ha || 0);
      const npk = fichaCultivo?.npk_recomendado || {};
      const totalN = areaHa > 0 ? areaHa * Number(npk.N || 0) : 0;
      const bultos = totalN > 0 ? Math.max(1, Math.round(totalN / 50)) : 0;
      return {
        areaHa,
        totalN,
        bultos,
      };
    },

    _recomendacionSuelo(fichaSuelo, opciones = {}) {
      const phActual = Number(opciones.phActual || opciones.ph || NaN);
      const conductividad = Number(
        opciones.conductividad || opciones.ce || NaN
      );
      if (!fichaSuelo?.ph_ideal || Number.isNaN(phActual)) {
        return {
          resumen:
            'Sin lectura de pH cargada. Fabrizzio puede trabajar con el rango ideal del cultivo, pero no emitir enmienda específica todavía.',
          estado: 'pendiente',
        };
      }

      const [phMin, phMax] = fichaSuelo.ph_ideal;
      if (phActual < phMin) {
        return {
          resumen: `El pH actual (${phActual.toFixed(1)}) está por debajo del rango ideal (${phMin}-${phMax}). Fabrizzio recomienda una enmienda alcalinizante y verificar aluminio intercambiable.`,
          estado: 'corregir',
          conductividad,
        };
      }
      if (phActual > phMax) {
        return {
          resumen: `El pH actual (${phActual.toFixed(1)}) está por encima del rango ideal (${phMin}-${phMax}). Fabrizzio recomienda acidificar gradualmente y ajustar fertilización fosfatada.`,
          estado: 'corregir',
          conductividad,
        };
      }
      return {
        resumen: `El pH actual (${phActual.toFixed(1)}) está dentro del rango ideal para el cultivo. Mantén seguimiento de conductividad${Number.isFinite(conductividad) ? ` (${conductividad.toFixed(2)} dS/m)` : ''}.`,
        estado: 'ok',
        conductividad,
      };
    },

    _getAll(storeName) {
      return new Promise((resolve, reject) => {
        const req = this._tx(storeName, 'readonly').getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    },

    _idSesion(idLote) {
      return `sesion_${String(idLote || 'general')}_${Date.now()}`;
    },

    _bloquesEntrevista() {
      return {
        fase: 'Bloque 1. Identificación de fase y vigor.',
        triaje: 'Bloque 2. Triaje visual y distribución del problema.',
        manejo: 'Bloque 3. Manejo, suelo y clima reciente.',
        cultivo: 'Bloque 4. Confirmaciones específicas del cultivo.',
        libre: 'Bloque adicional del productor.',
      };
    },

    _agruparPreguntasPorBloque(preguntas = []) {
      return preguntas.reduce((acc, pregunta) => {
        const bloque = pregunta.bloque || 'libre';
        if (!acc[bloque]) acc[bloque] = [];
        acc[bloque].push(pregunta);
        return acc;
      }, {});
    },

    _cancelarGuiaEntrevista() {
      (this._guiaEntrevista.timers || []).forEach((timerId) =>
        clearTimeout(timerId)
      );
      this._guiaEntrevista.timers = [];
      this._guiaEntrevista.bloqueActivo = null;
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      document
        .querySelectorAll('[data-fabrizzio-bloque]')
        .forEach((bloque) => (bloque.style.outline = 'none'));
    },

    _resaltarBloqueEntrevista(bloque) {
      document
        .querySelectorAll('[data-fabrizzio-bloque]')
        .forEach((item) => (item.style.outline = 'none'));
      const activo = document.querySelector(
        `[data-fabrizzio-bloque="${this._escaparHtml(bloque)}"]`
      );
      if (!activo) return;
      activo.style.outline = '3px solid #2f855a';
      activo.style.outlineOffset = '2px';
      activo.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },

    _narracionPorBloques(preguntas = []) {
      const grupos = this._agruparPreguntasPorBloque(preguntas);
      const etiquetas = this._bloquesEntrevista();
      return Object.entries(grupos).map(([bloque, items]) => ({
        bloque,
        texto: `${etiquetas[bloque] || 'Bloque técnico.'} ${items
          .map((item) => item.pregunta)
          .join(' ')}`,
      }));
    },

    _narrarEntrevistaPorBloques(preguntas = []) {
      this._cancelarGuiaEntrevista();
      const segmentos = this._narracionPorBloques(preguntas);
      if (!segmentos.length) return;
      let demora = 0;
      segmentos.forEach((segmento) => {
        const timerId = setTimeout(() => {
          this._guiaEntrevista.bloqueActivo = segmento.bloque;
          this._resaltarBloqueEntrevista(segmento.bloque);
          if (window.FabrizzioAsesor?.hablar) {
            window.FabrizzioAsesor.hablar(segmento.texto);
          }
        }, demora);
        this._guiaEntrevista.timers.push(timerId);
        demora += Math.max(5000, Math.min(14000, segmento.texto.length * 45));
      });
    },

    _serializarExpedienteCentroMando(expediente, evidencia = null) {
      return {
        id: expediente.id,
        id_lote: expediente.id_lote,
        fecha_registro: expediente.fecha_registro,
        cultivo: expediente.cultivo,
        etapa_fenologica: expediente.etapa_fenologica,
        sintoma_observado: expediente.sintoma_observado,
        respuestas_entrevista: expediente.respuestas_entrevista,
        clima_agencia_snapshot: expediente.clima_agencia_snapshot,
        id_evidencia_foto: expediente.id_evidencia_foto,
        recomendacion_fabrizzio: expediente.recomendacion_fabrizzio,
        diagnostico_ia: expediente.diagnostico_ia,
        observaciones_productor: expediente.observaciones_productor,
        estado_seguimiento: expediente.estado_seguimiento,
        id_sesion: expediente.id_sesion,
        ultima_sync: new Date().toISOString(),
        evidencia_rural_resumen: evidencia
          ? {
              id: evidencia.id,
              fecha_iso: evidencia.fecha_iso,
              foco: evidencia.foco,
              nombre_archivo: evidencia.nombre_archivo,
              notas: evidencia.notas,
            }
          : null,
      };
    },

    _leerConfigCentroMando(config = null) {
      const fuente =
        config ||
        window.MELANTIA_SUPABASE_CONFIG ||
        (() => {
          try {
            return JSON.parse(
              localStorage.getItem('melantia_supabase_config') || 'null'
            );
          } catch {
            return null;
          }
        })();
      if (!fuente?.url || !fuente?.anonKey) return null;
      return {
        url: String(fuente.url).replace(/\/+$/, ''),
        anonKey: fuente.anonKey,
        tablaExpedienteRural:
          fuente.tablaExpedienteRural || 'expediente_agronomico',
      };
    },

    async _fetchCentroMando(url, opciones = {}, timeoutMs = 20000) {
      const controller = new AbortController();
      const timerId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        return await fetch(url, {
          ...opciones,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timerId);
      }
    },

    _resolverConfigEntrevista(cultivo, fichaCultivo = null) {
      const normalizado = this._normalizar(cultivo);
      const directas = [normalizado];
      if (normalizado.includes('platano') || normalizado.includes('banano')) {
        directas.unshift('platano_banano');
      }
      for (const clave of directas) {
        if (_ENTREVISTA_CULTIVOS[clave]) {
          return _ENTREVISTA_CULTIVOS[clave];
        }
      }
      if (
        fichaCultivo?.nombre &&
        _ENTREVISTA_CULTIVOS[this._normalizar(fichaCultivo.nombre)]
      ) {
        return _ENTREVISTA_CULTIVOS[this._normalizar(fichaCultivo.nombre)];
      }
      return _ENTREVISTA_CULTIVOS.general;
    },

    _entrevistaBase(config, lote, opciones = {}) {
      const faseActual =
        opciones.etapaFenologica ||
        opciones.etapa ||
        lote?.etapa_fenologica ||
        config.fases?.[0] ||
        'Desarrollo';
      return {
        cultivo: config.cultivo,
        faseActual,
        fases: config.fases || [],
        alertasClave: config.alertasClave || [],
        preguntasBase: [
          {
            id: 'etapa_fenologica',
            bloque: 'fase',
            pregunta: '¿En qué etapa está el lote?',
            opciones: config.fases || [
              'Siembra',
              'Desarrollo',
              'Floración',
              'Llenado',
              'Cosecha',
            ],
            valor: faseActual,
          },
          {
            id: 'vigor_general',
            bloque: 'fase',
            pregunta: '¿Cómo calificarías el vigor general del cultivo?',
            opciones: ['Excelente', 'Normal', 'Débil/Raquítico'],
            valor: opciones.vigorGeneral || 'Normal',
          },
          {
            id: 'sintoma_principal',
            bloque: 'triaje',
            pregunta: '¿Cuál es el síntoma principal que observas?',
            opciones: [
              'Sin novedad',
              'Coloración',
              'Marchitez',
              'Manchas',
              'Perforaciones',
              'Pudrición',
              'Bajo crecimiento',
            ],
            valor: opciones.sintomaPrincipal || 'Sin novedad',
          },
          {
            id: 'cambio_hojas',
            bloque: 'triaje',
            pregunta: '¿Notas cambios de color o forma en las hojas?',
            opciones: [
              'Sin cambios',
              'Puntas amarillas',
              'Bordes quemados',
              'Manchas cafés/negras',
              'Hojas moradas',
              'Hojas enrolladas',
            ],
            valor: opciones.cambioHojas || 'Sin cambios',
          },
          {
            id: 'base_tallo_raiz',
            bloque: 'triaje',
            pregunta:
              '¿Hay perforaciones o pudrición en la base del tallo o raíz?',
            opciones: ['No', 'Perforaciones', 'Pudrición', 'Ambas'],
            valor: opciones.baseTalloRaiz || 'No',
          },
          {
            id: 'distribucion_problema',
            bloque: 'triaje',
            pregunta: '¿El problema está en manchones o en todo el lote?',
            opciones: [
              'Todo el lote',
              'Manchones',
              'Borde del lote',
              'Plantas aisladas',
            ],
            valor: opciones.distribucionProblema || 'Todo el lote',
          },
          {
            id: 'condicion_suelo',
            bloque: 'manejo',
            pregunta: '¿Sientes la tierra compactada o con buen drenaje?',
            opciones: ['Buen drenaje', 'Compactada', 'Encharcada', 'Polvosa'],
            valor: opciones.condicionSuelo || 'Buen drenaje',
          },
          {
            id: 'clima_reciente',
            bloque: 'manejo',
            pregunta: '¿Qué pasó con el clima en los últimos 3 días?',
            opciones: [
              'Lluvia fuerte',
              'Lluvia moderada',
              'Sol intenso',
              'Nublado estable',
              'Viento fuerte',
            ],
            valor: opciones.climaReciente || 'Nublado estable',
          },
          {
            id: 'fertilizacion_previa',
            bloque: 'manejo',
            pregunta:
              '¿Cuándo aplicaste fertilizante por última vez y qué usaste?',
            tipo: 'texto',
            valor: opciones.fertilizacionPrevia || '',
          },
          {
            id: 'comentarios_productor',
            bloque: 'manejo',
            pregunta: '¿Qué más quiere dejar registrado el productor?',
            tipo: 'texto',
            valor: opciones.comentariosProductor || '',
          },
        ],
        preguntasEspecificas: (config.preguntasEspecificas || []).map(
          (item) => ({
            ...item,
            bloque: 'cultivo',
            opciones: item.opciones || ['Sí', 'No'],
            valor: opciones[item.id] || 'No',
          })
        ),
      };
    },

    _normalizarRespuestasEntrevista(entrevista = null, modelo = null) {
      const preguntas = [
        ...(modelo?.preguntasBase || []),
        ...(modelo?.preguntasEspecificas || []),
      ];
      const mapa = new Map();
      preguntas.forEach((pregunta) => {
        mapa.set(pregunta.id, {
          id: pregunta.id,
          bloque: pregunta.bloque,
          pregunta: pregunta.pregunta,
          valor: pregunta.valor ?? '',
          tipo: pregunta.tipo || 'seleccion',
        });
      });
      const fuente = Array.isArray(entrevista?.respuestas)
        ? entrevista.respuestas
        : [];
      fuente.forEach((item) => {
        if (!item?.id) return;
        const base = mapa.get(item.id) || {
          id: item.id,
          bloque: item.bloque || 'libre',
          pregunta: item.pregunta || item.id,
          tipo: item.tipo || 'texto',
          valor: '',
        };
        mapa.set(item.id, {
          ...base,
          valor: item.valor ?? item.respuesta ?? '',
        });
      });
      return Array.from(mapa.values());
    },

    _valorRespuesta(respuestas, id) {
      const item = (respuestas || []).find((entrada) => entrada.id === id);
      return String(item?.valor || '').trim();
    },

    _diagnosticarPorCapas(contexto = {}) {
      const respuestas = contexto.entrevista?.respuestas || [];
      const sintomas = [
        this._valorRespuesta(respuestas, 'sintoma_principal'),
        this._valorRespuesta(respuestas, 'cambio_hojas'),
        this._valorRespuesta(respuestas, 'base_tallo_raiz'),
        this._valorRespuesta(respuestas, 'clima_reciente'),
      ]
        .join(' | ')
        .toLowerCase();
      const condicionSuelo = this._valorRespuesta(
        respuestas,
        'condicion_suelo'
      ).toLowerCase();
      const fertilizacionPrevia = this._valorRespuesta(
        respuestas,
        'fertilizacion_previa'
      );
      const hallazgos = [];
      const acciones = [];
      let capaDominante = 'manejo';
      let prioridad = 'media';

      if (
        /marchitez|enrolladas|polvosa|sol intenso/.test(sintomas) ||
        contexto.climaAgronomico?.riesgo === 'evapotranspiracion'
      ) {
        capaDominante = 'hidrico';
        hallazgos.push(
          'Los síntomas apuntan primero a estrés hídrico o a alta demanda evaporativa.'
        );
        acciones.push(
          'Verificar humedad real en 10-20 cm y ajustar riego temprano.'
        );
      }

      if (
        /puntas amarillas|v invertida|moradas|bordes quemados/.test(sintomas)
      ) {
        capaDominante = capaDominante === 'hidrico' ? 'mixto' : 'nutricional';
        hallazgos.push(
          fertilizacionPrevia
            ? `Hay señal nutricional, pero el productor reporta fertilización reciente: ${fertilizacionPrevia}.`
            : 'Hay señal compatible con desbalance nutricional, sobre todo de nitrógeno o potasio.'
        );
        acciones.push(
          'Revisar distribución de amarillamiento entre hojas viejas y nuevas.'
        );
      }

      if (
        /manchas|perforaciones|pudricion|polvo blanco|escoba|rayas color cafe|negras/.test(
          sintomas
        ) ||
        this._valorRespuesta(respuestas, 'mz_1') === 'Sí' ||
        this._valorRespuesta(respuestas, 'pl_1') === 'Sí' ||
        this._valorRespuesta(respuestas, 'pl_2') === 'Sí' ||
        this._valorRespuesta(respuestas, 'ca_1') === 'Sí' ||
        this._valorRespuesta(respuestas, 'ca_2') === 'Sí' ||
        this._valorRespuesta(respuestas, 'pa_1') === 'Sí' ||
        this._valorRespuesta(respuestas, 'pa_2') === 'Sí'
      ) {
        capaDominante = 'fitosanitario';
        prioridad = 'alta';
        hallazgos.push(
          'La evidencia declarada por el productor obliga a descartar primero un problema fitosanitario.'
        );
        acciones.push(
          'Aislar focos, tomar evidencia de detalle y revisar incidencia por manchones.'
        );
      }

      if (
        condicionSuelo.includes('compactada') ||
        condicionSuelo.includes('encharcada') ||
        contexto.suelo?.estado === 'corregir'
      ) {
        capaDominante =
          capaDominante === 'fitosanitario' ? 'fitosanitario-suelo' : 'suelo';
        hallazgos.push(
          'El suelo reporta limitaciones de drenaje, compactación o pH fuera del rango ideal.'
        );
        acciones.push(
          'Abrir drenajes, revisar infiltración y validar pH o conductividad en campo.'
        );
      }

      if (contexto.climaAgronomico?.riesgo === 'lluvia') {
        hallazgos.push(
          'La agencia climática reporta exceso de lluvia reciente, lo que cambia la lectura del síntoma.'
        );
        acciones.push(
          'Posponer aplicaciones lavables y priorizar sanidad de raíz y drenaje.'
        );
      }

      if (contexto.climaAgronomico?.riesgo === 'helada') {
        prioridad = 'alta';
        hallazgos.push('Existe riesgo climático fuerte por frío o helada.');
        acciones.push(
          'Evitar aplicaciones sensibles en madrugada y revisar tejido quemado.'
        );
      }

      const ultimoCaso = Array.isArray(contexto.historial)
        ? contexto.historial[0]
        : null;
      if (ultimoCaso?.sintoma_observado) {
        hallazgos.push(
          `Último antecedente del lote: ${ultimoCaso.sintoma_observado} (${new Date(ultimoCaso.fecha_registro).toLocaleDateString('es-EC')}).`
        );
      }

      if (!hallazgos.length) {
        hallazgos.push(
          'No hay una señal crítica dominante; el caso sigue en observación guiada con entrevista técnica.'
        );
        acciones.push(
          'Completar evidencia fotográfica y comparar en 48 horas.'
        );
      }

      const accionPrincipal =
        acciones[0] || 'Mantener observación y completar la entrevista rural.';
      return {
        capaDominante,
        prioridad,
        hallazgos,
        acciones,
        resumen: `${hallazgos[0]} Acción: ${accionPrincipal}`,
      };
    },

    async _blobToDataUrl(archivo) {
      return new Promise((resolve, reject) => {
        const lector = new FileReader();
        lector.onload = () => resolve(lector.result);
        lector.onerror = () => reject(lector.error);
        lector.readAsDataURL(archivo);
      });
    },

    async _guardarEvidenciaRural(idLote, archivo, meta = {}) {
      if (!archivo) return null;
      const lote = await this._resolverLote(idLote);
      const id = `evr_${String(idLote || 'general')}_${Date.now()}`;
      const urlFoto = await this._blobToDataUrl(archivo);
      const registro = {
        id,
        id_lote: lote?.id_lote || idLote || 'sin-lote',
        nombre_lote: lote?.nombre_lote || 'Lote agrícola',
        id_sesion: meta.idSesion || null,
        fecha_iso: new Date().toISOString(),
        nombre_archivo: archivo.name || 'evidencia_rural.jpg',
        mime_type: archivo.type || 'image/jpeg',
        foco: meta.foco || 'general',
        notas: meta.notas || '',
        url_foto: urlFoto,
      };
      await this._put(_STORE_EVIDENCIA, registro);
      return registro;
    },

    async _guardarExpedienteAgronomico(payload) {
      const registro = {
        id:
          payload.id ||
          `exp_${String(payload.id_lote || 'general')}_${Date.now()}`,
        id_lote: payload.id_lote,
        fecha_registro: payload.fecha_registro || new Date().toISOString(),
        cultivo: payload.cultivo || 'Sin cultivo',
        etapa_fenologica: payload.etapa_fenologica || 'Sin etapa',
        sintoma_observado: payload.sintoma_observado || 'Sin novedad',
        respuestas_entrevista: payload.respuestas_entrevista || [],
        clima_agencia_snapshot: payload.clima_agencia_snapshot || null,
        id_evidencia_foto: payload.id_evidencia_foto || null,
        recomendacion_fabrizzio: payload.recomendacion_fabrizzio || '',
        diagnostico_ia: payload.diagnostico_ia || null,
        observaciones_productor: payload.observaciones_productor || '',
        estado_seguimiento: payload.estado_seguimiento || 'PENDIENTE',
        id_sesion: payload.id_sesion || null,
        pendiente_sync_centro: true,
        sincronizado_centro: false,
        ultima_sync_centro: payload.ultima_sync_centro || null,
      };
      await this._put(_STORE_EXPEDIENTE, registro);
      return registro;
    },

    async actualizarEstadoSeguimiento(idExpediente, estadoSeguimiento) {
      await this.inicializar();
      const actual = await this._get(_STORE_EXPEDIENTE, idExpediente);
      if (!actual) {
        throw new Error('No encontré el caso del expediente agronómico.');
      }
      const actualizado = {
        ...actual,
        estado_seguimiento: estadoSeguimiento,
        pendiente_sync_centro: true,
        sincronizado_centro: false,
      };
      await this._put(_STORE_EXPEDIENTE, actualizado);
      return actualizado;
    },

    async sincronizarExpedienteCentroMando(config = null, opciones = {}) {
      await this.inicializar();
      if (!navigator.onLine) {
        return { aplicado: false, motivo: 'SIN_RED' };
      }
      const centroMando = this._leerConfigCentroMando(config);
      if (!centroMando) {
        return { aplicado: false, motivo: 'SUPABASE_NO_CONFIGURADO' };
      }

      const todos = await this._getAll(_STORE_EXPEDIENTE);
      const pendientes = todos.filter(
        (item) => item.pendiente_sync_centro || !item.sincronizado_centro
      );
      if (!pendientes.length) {
        return {
          aplicado: true,
          sincronizados: 0,
          mensaje: 'Sin expediente rural pendiente.',
        };
      }

      const payload = [];
      for (const expediente of pendientes) {
        const evidencia = expediente.id_evidencia_foto
          ? await this._get(_STORE_EVIDENCIA, expediente.id_evidencia_foto)
          : null;
        payload.push(
          this._serializarExpedienteCentroMando(expediente, evidencia)
        );
      }

      const endpoint = `${centroMando.url}/rest/v1/${encodeURIComponent(
        centroMando.tablaExpedienteRural
      )}`;
      const respuesta = await this._fetchCentroMando(endpoint, {
        method: 'POST',
        headers: {
          apikey: centroMando.anonKey,
          Authorization: `Bearer ${centroMando.anonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(payload),
      });

      if (!respuesta.ok) {
        const detalle = await respuesta.text().catch(() => 'sin detalle');
        throw new Error(
          `Centro de mando respondió ${respuesta.status}: ${detalle}`
        );
      }

      const syncAt = new Date().toISOString();
      for (const expediente of pendientes) {
        await this._put(_STORE_EXPEDIENTE, {
          ...expediente,
          pendiente_sync_centro: false,
          sincronizado_centro: true,
          ultima_sync_centro: syncAt,
        });
      }

      return {
        aplicado: true,
        sincronizados: pendientes.length,
        mensaje: `Centro de mando recibió ${pendientes.length} expediente(s) rurales.`,
      };
    },

    async obtenerEvolucionLote(idLote, limite = 5) {
      await this.inicializar();
      const registros = await this._getAllByIndex(
        _STORE_EXPEDIENTE,
        'idx_lote',
        idLote
      );
      return [...registros]
        .sort(
          (a, b) =>
            new Date(b.fecha_registro || 0).getTime() -
            new Date(a.fecha_registro || 0).getTime()
        )
        .slice(0, limite);
    },

    async obtenerEvidenciasLote(idLote, limite = 6) {
      await this.inicializar();
      const registros = await this._getAllByIndex(
        _STORE_EVIDENCIA,
        'idx_lote',
        idLote
      );
      return [...registros]
        .sort(
          (a, b) =>
            new Date(b.fecha_iso || 0).getTime() -
            new Date(a.fecha_iso || 0).getTime()
        )
        .slice(0, limite);
    },

    async procesarEntrevistaDiagnostica(
      idLote,
      entrevista = {},
      archivo = null
    ) {
      await this.inicializar();
      const idSesion = this._idSesion(idLote);
      const evidencia = await this._guardarEvidenciaRural(idLote, archivo, {
        idSesion,
        foco: entrevista.focoEvidencia || 'hoja_lote',
        notas: entrevista.comentariosProductor || '',
      });
      const resultado = await this.analizarEstadoCultivo(idLote, {
        ...entrevista,
        entrevista: {
          respuestas: entrevista.respuestas || [],
        },
        evidencia,
        idSesion,
        guardarExpediente: true,
      });
      return resultado;
    },

    async abrirEntrevistaDiagnostica(idLote, opciones = {}) {
      const resultadoBase = await this.analizarEstadoCultivo(idLote, {
        guardarExpediente: false,
      });
      const panel = document.getElementById('panel-novedades');
      if (!panel) return false;

      const entrevista = resultadoBase.entrevista;
      const preguntas = [
        ...(entrevista?.preguntasBase || []),
        ...(entrevista?.preguntasEspecificas || []),
      ];
      const grupos = this._agruparPreguntasPorBloque(preguntas);
      const bloques = this._bloquesEntrevista();
      const campos = Object.entries(grupos)
        .map(([bloque, items]) => {
          const htmlPreguntas = items
            .map((pregunta) => {
              if (pregunta.tipo === 'texto') {
                return `<label style="display:grid;gap:6px"><strong>${this._escaparHtml(pregunta.pregunta)}</strong><textarea name="${this._escaparHtml(pregunta.id)}" rows="2" style="width:100%;border:1px solid #d8e5d9;border-radius:8px;padding:8px">${this._escaparHtml(pregunta.valor || '')}</textarea></label>`;
              }
              const opciones = (pregunta.opciones || [])
                .map(
                  (opcion) =>
                    `<option value="${this._escaparHtml(opcion)}" ${String(pregunta.valor || '') === String(opcion) ? 'selected' : ''}>${this._escaparHtml(opcion)}</option>`
                )
                .join('');
              return `<label style="display:grid;gap:6px"><strong>${this._escaparHtml(pregunta.pregunta)}</strong><select name="${this._escaparHtml(pregunta.id)}" style="width:100%;border:1px solid #d8e5d9;border-radius:8px;padding:8px">${opciones}</select></label>`;
            })
            .join('');
          return `<section data-fabrizzio-bloque="${this._escaparHtml(bloque)}" style="display:grid;gap:10px;background:#fff;border:1px solid #d8e5d9;border-radius:12px;padding:12px;transition:outline .2s ease"><div><strong>${this._escaparHtml(bloques[bloque] || 'Bloque técnico')}</strong></div>${htmlPreguntas}</section>`;
        })
        .join('');

      panel.style.maxWidth = '820px';
      panel.innerHTML = `
        <div class="novedad-card" data-experto="Fabrizzio" style="display:grid;gap:12px;max-height:80vh;overflow:auto">
          <div>
            <p class="novedad-n1" style="margin:0">Fabrizzio - Entrevista técnica estructurada</p>
            <p class="novedad-n2" style="margin:6px 0 0">Lote: <strong>${this._escaparHtml(resultadoBase.nombreLote)}</strong> · Cultivo: <strong>${this._escaparHtml(resultadoBase.cultivo)}</strong></p>
          </div>
          <div style="background:#eef6f1;border:1px solid #d8e5d9;border-radius:12px;padding:12px">
            <strong>Alertas clave del cultivo:</strong>
            <div style="margin-top:6px">${this._escaparHtml((entrevista?.alertasClave || []).join(' · ') || 'Sin alertas específicas cargadas.')}</div>
          </div>
          <form id="fabrizzio-entrevista-form" style="display:grid;gap:10px">
            ${campos}
            <div style="display:grid;gap:6px">
              <strong>Lecturas opcionales de campo</strong>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px">
                <input name="ph" type="number" step="0.1" placeholder="pH medido" style="border:1px solid #d8e5d9;border-radius:8px;padding:8px">
                <input name="ce" type="number" step="0.01" placeholder="Conductividad dS/m" style="border:1px solid #d8e5d9;border-radius:8px;padding:8px">
                <input name="temperatura" type="number" step="0.1" placeholder="Temperatura °C" style="border:1px solid #d8e5d9;border-radius:8px;padding:8px">
                <input name="lluviaAcumulada" type="number" step="0.1" placeholder="Lluvia mm" style="border:1px solid #d8e5d9;border-radius:8px;padding:8px">
              </div>
            </div>
            <label style="display:grid;gap:6px">
              <strong>Evidencia de campo</strong>
              <input name="evidencia" type="file" accept="image/*" capture="environment">
              <span style="font-size:12px;color:#466152">Toma hoja, tallo, raíz o suelo según el síntoma principal.</span>
            </label>
          </form>
          <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px">
            <button type="button" data-fabrizzio-voz style="background:#173728;color:#fff">Guía por voz</button>
            <button type="button" data-fabrizzio-guardar>Procesar diagnóstico</button>
            <button type="button" data-fabrizzio-expediente style="background:#eef6f1;color:#1f3d2c">Ver expediente</button>
            <button type="button" data-fabrizzio-cerrar style="background:#e8f5e9;color:#276749">Cerrar</button>
          </div>
        </div>`;
      panel.style.display = 'block';

      const form = panel.querySelector('#fabrizzio-entrevista-form');
      panel
        .querySelector('[data-fabrizzio-cerrar]')
        ?.addEventListener('click', () => {
          this._cancelarGuiaEntrevista();
          panel.style.display = 'none';
        });
      panel
        .querySelector('[data-fabrizzio-voz]')
        ?.addEventListener('click', () => {
          this._narrarEntrevistaPorBloques(preguntas);
        });
      panel
        .querySelector('[data-fabrizzio-expediente]')
        ?.addEventListener('click', async () => {
          this._cancelarGuiaEntrevista();
          await this.abrirExpedienteLote(idLote);
        });
      panel
        .querySelector('[data-fabrizzio-guardar]')
        ?.addEventListener('click', async () => {
          const datos = new FormData(form);
          const respuestas = preguntas.map((pregunta) => ({
            id: pregunta.id,
            bloque: pregunta.bloque,
            pregunta: pregunta.pregunta,
            tipo: pregunta.tipo || 'seleccion',
            valor: String(datos.get(pregunta.id) || '').trim(),
          }));
          const payload = {
            etapaFenologica: String(
              datos.get('etapa_fenologica') || entrevista?.faseActual || ''
            ),
            vigorGeneral: String(datos.get('vigor_general') || 'Normal'),
            sintomaPrincipal: String(
              datos.get('sintoma_principal') || 'Sin novedad'
            ),
            cambioHojas: String(datos.get('cambio_hojas') || 'Sin cambios'),
            baseTalloRaiz: String(datos.get('base_tallo_raiz') || 'No'),
            distribucionProblema: String(
              datos.get('distribucion_problema') || 'Todo el lote'
            ),
            condicionSuelo: String(
              datos.get('condicion_suelo') || 'Buen drenaje'
            ),
            climaReciente: String(
              datos.get('clima_reciente') || 'Nublado estable'
            ),
            fertilizacionPrevia: String(
              datos.get('fertilizacion_previa') || ''
            ).trim(),
            comentariosProductor: String(
              datos.get('comentarios_productor') || ''
            ).trim(),
            ph: Number(datos.get('ph') || NaN),
            ce: Number(datos.get('ce') || NaN),
            temperatura: Number(datos.get('temperatura') || NaN),
            lluviaAcumulada: Number(datos.get('lluviaAcumulada') || NaN),
            respuestas,
          };
          const archivo =
            form.querySelector('input[name="evidencia"]')?.files?.[0] || null;
          const resultado = await this.procesarEntrevistaDiagnostica(
            idLote,
            payload,
            archivo
          );
          this._cancelarGuiaEntrevista();
          this.renderizarRecomendacion(resultado);
        });
      if (opciones.conVoz !== false) {
        this._narrarEntrevistaPorBloques(preguntas);
      }
      return true;
    },

    async abrirExpedienteLote(idLote) {
      const lote = await this._resolverLote(idLote);
      const historial = await this.obtenerEvolucionLote(idLote, 8);
      const evidencias = await this.obtenerEvidenciasLote(idLote, 6);
      const panel = document.getElementById('panel-novedades');
      if (!panel) return false;
      panel.style.maxWidth = '860px';
      const historialHtml = historial.length
        ? historial
            .map(
              (item) => `
                <article style="border:1px solid #d8e5d9;border-radius:12px;padding:12px;background:#fff" data-expediente-item="${this._escaparHtml(item.id)}">
                  <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap">
                    <strong>${this._escaparHtml(item.sintoma_observado || 'Sin síntoma')}</strong>
                    <span>${this._escaparHtml(new Date(item.fecha_registro).toLocaleString('es-EC'))}</span>
                  </div>
                  <div style="margin-top:6px">Etapa: ${this._escaparHtml(item.etapa_fenologica || 'Sin etapa')} · Seguimiento: ${this._escaparHtml(item.estado_seguimiento || 'PENDIENTE')}</div>
                  <div style="margin-top:6px">${this._escaparHtml(item.recomendacion_fabrizzio || 'Sin recomendación almacenada.')}</div>
                  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
                    <button type="button" data-expediente-estado="APLICADO" data-expediente-id="${this._escaparHtml(item.id)}" style="background:${item.estado_seguimiento === 'APLICADO' ? '#1f6b3a' : '#eef6f1'};color:${item.estado_seguimiento === 'APLICADO' ? '#fff' : '#1f3d2c'}">Aplicado</button>
                    <button type="button" data-expediente-estado="NO_APLICADO" data-expediente-id="${this._escaparHtml(item.id)}" style="background:${item.estado_seguimiento === 'NO_APLICADO' ? '#8b1e1e' : '#fff1f0'};color:${item.estado_seguimiento === 'NO_APLICADO' ? '#fff' : '#8b1e1e'}">No aplicado</button>
                    <button type="button" data-expediente-estado="PENDIENTE" data-expediente-id="${this._escaparHtml(item.id)}" style="background:${item.estado_seguimiento === 'PENDIENTE' ? '#8a6300' : '#fff7e8'};color:${item.estado_seguimiento === 'PENDIENTE' ? '#fff' : '#8a6300'}">Pendiente</button>
                  </div>
                </article>`
            )
            .join('')
        : '<p>Aún no hay expediente agronómico guardado para este lote.</p>';
      const evidenciaHtml = evidencias.length
        ? evidencias
            .map(
              (item) => `
                <figure style="margin:0;border:1px solid #d8e5d9;border-radius:12px;padding:8px;background:#fff">
                  <img src="${this._escaparHtml(item.url_foto || '')}" alt="Evidencia rural" style="width:100%;height:120px;object-fit:cover;border-radius:8px">
                  <figcaption style="font-size:12px;margin-top:6px">${this._escaparHtml(item.foco || 'general')} · ${this._escaparHtml(new Date(item.fecha_iso).toLocaleDateString('es-EC'))}</figcaption>
                </figure>`
            )
            .join('')
        : '<p>Sin evidencia fotográfica rural registrada todavía.</p>';
      panel.innerHTML = `
        <div class="novedad-card" data-experto="Fabrizzio" style="display:grid;gap:12px;max-height:80vh;overflow:auto">
          <div>
            <p class="novedad-n1" style="margin:0">Fabrizzio - Expediente agronómico</p>
            <p class="novedad-n2" style="margin:6px 0 0">Lote: <strong>${this._escaparHtml(lote?.nombre_lote || idLote || 'Lote agrícola')}</strong></p>
          </div>
          <section style="display:grid;gap:8px">
            <strong>Historial técnico longitudinal</strong>
            ${historialHtml}
          </section>
          <section style="display:grid;gap:8px">
            <strong>Evidencia de campo</strong>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px">${evidenciaHtml}</div>
          </section>
          <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px">
            <button type="button" onclick="window.GestorRuralMelantia?.abrirEntrevistaDiagnostica(${JSON.stringify(idLote)})">Nueva entrevista</button>
            <button type="button" onclick="document.getElementById('panel-novedades').style.display='none'">Cerrar</button>
          </div>
        </div>`;
      panel.style.display = 'block';
      panel.querySelectorAll('[data-expediente-estado]').forEach((boton) => {
        boton.addEventListener('click', async () => {
          await this.actualizarEstadoSeguimiento(
            boton.dataset.expedienteId,
            boton.dataset.expedienteEstado
          );
          await this.abrirExpedienteLote(idLote);
        });
      });
      return true;
    },

    _guardarReporte(resultado) {
      try {
        const actuales = this.listarReportesRurales();
        actuales.unshift({
          id: resultado.idReporte,
          fecha: resultado.fechaIso,
          idLote: resultado.idLote,
          cultivo: resultado.cultivo,
          semaforo: resultado.semaforo.nivel,
          resumen: resultado.semaforo.mensaje,
        });
        localStorage.setItem(
          _CLAVE_REPORTES,
          JSON.stringify(actuales.slice(0, 30))
        );
      } catch (error) {
        console.warn('[Rural] No pude persistir el reporte rural:', error);
      }
    },

    listarReportesRurales() {
      try {
        return JSON.parse(localStorage.getItem(_CLAVE_REPORTES) || '[]');
      } catch {
        return [];
      }
    },

    async analizarEstadoCultivo(idLote, opciones = {}) {
      await this.inicializar();
      const lote = await this._resolverLote(idLote);
      if (!lote) {
        throw new Error('No encontré un lote agrícola activo para Fabrizzio.');
      }
      if (lote.tipo_lote && lote.tipo_lote !== 'agricola') {
        throw new Error('Fabrizzio solo puede analizar lotes agrícolas.');
      }

      const { cultivos, suelos } = await this._cargarFuentes();
      const cultivoKey = this._resolverCultivoKey(lote, cultivos, suelos);
      const fichaCultivo = cultivoKey ? cultivos.cultivos?.[cultivoKey] : null;
      const fichaSuelo = cultivoKey ? suelos.cultivos?.[cultivoKey] : null;
      const clima = await this._obtenerClimaVigente(idLote, opciones);
      const climaAgronomico = this._analizarClimaAgronomico(
        fichaCultivo,
        fichaSuelo,
        clima
      );
      const entrevistaModelo = this._entrevistaBase(
        this._resolverConfigEntrevista(
          cultivoKey || lote.cultivo || 'general',
          fichaCultivo
        ),
        lote,
        opciones
      );
      const entrevista = {
        ...entrevistaModelo,
        respuestas: this._normalizarRespuestasEntrevista(
          opciones.entrevista,
          entrevistaModelo
        ),
      };
      const historial = await this.obtenerEvolucionLote(
        lote.id_lote || idLote || 'sin-lote',
        5
      );
      const semaforoBase = this._seleccionarSemaforo(
        lote,
        fichaCultivo,
        fichaSuelo,
        {
          ...opciones,
          probabilidadLluvia:
            opciones.probabilidadLluvia || climaAgronomico.lluvia,
        }
      );
      const diagnosticoCapas = this._diagnosticarPorCapas({
        lote,
        fichaCultivo,
        fichaSuelo,
        clima,
        climaAgronomico,
        suelo: this._recomendacionSuelo(fichaSuelo, opciones),
        entrevista,
        historial,
      });
      const semaforo = {
        ...semaforoBase,
        nivel:
          diagnosticoCapas.prioridad === 'alta' ? 'rojo' : semaforoBase.nivel,
        mensaje: diagnosticoCapas.resumen || semaforoBase.mensaje,
      };
      const dosis = this._calcularDosisArea(lote, fichaCultivo);
      const suelo = this._recomendacionSuelo(fichaSuelo, opciones);
      const ahora = new Date();

      const resultado = {
        idReporte: `rural_${String(lote.id_lote || 'general')}_${ahora
          .toISOString()
          .replace(/[.:]/g, '-')}`,
        fechaIso: ahora.toISOString(),
        idLote: lote.id_lote || idLote || 'sin-lote',
        nombreLote: lote.nombre_lote || 'Lote agrícola',
        cultivo: this._capitalizar(
          (cultivoKey || lote.cultivo || 'cultivo').replace(/_/g, ' ')
        ),
        lote,
        fichaCultivo,
        fichaSuelo,
        clima,
        climaAgronomico,
        entrevista,
        historial,
        diagnosticoCapas,
        semaforo,
        dosis,
        suelo,
        evidencia: opciones.evidencia || null,
        lluvia: Number(
          opciones.probabilidadLluvia ||
            climaAgronomico.lluvia ||
            lote.probabilidad_lluvia ||
            0
        ),
        recomendacionVoz: `${semaforo.titulo}. ${diagnosticoCapas.resumen} ${climaAgronomico.resumen} ${suelo.resumen} ${dosis.bultos ? `Para ${dosis.areaHa.toFixed(2)} hectáreas, estima ${dosis.bultos} bultos base de fertilizante nitrogenado.` : 'Aún necesito un área medida para estimar bultos.'}`,
      };

      if (
        opciones.guardarExpediente &&
        entrevista.respuestas.some((item) => item.valor)
      ) {
        const expediente = await this._guardarExpedienteAgronomico({
          id_lote: resultado.idLote,
          cultivo: resultado.cultivo,
          etapa_fenologica:
            this._valorRespuesta(entrevista.respuestas, 'etapa_fenologica') ||
            entrevista.faseActual,
          sintoma_observado:
            this._valorRespuesta(entrevista.respuestas, 'sintoma_principal') ||
            'Sin novedad',
          respuestas_entrevista: entrevista.respuestas,
          clima_agencia_snapshot: clima,
          id_evidencia_foto: opciones.evidencia?.id || null,
          recomendacion_fabrizzio: diagnosticoCapas.resumen,
          diagnostico_ia: diagnosticoCapas,
          observaciones_productor: this._valorRespuesta(
            entrevista.respuestas,
            'comentarios_productor'
          ),
          id_sesion: opciones.idSesion || null,
        });
        resultado.expediente = expediente;
      }

      this._guardarReporte(resultado);
      return resultado;
    },

    renderizarRecomendacion(resultado) {
      const panel = document.getElementById('panel-novedades');
      if (!panel || !resultado) return false;

      const colorSemaforo =
        resultado.semaforo.nivel === 'rojo'
          ? '#8b1e1e'
          : resultado.semaforo.nivel === 'amarillo'
            ? '#8a6300'
            : '#1f6b3a';
      const fichaCultivo = resultado.fichaCultivo || {};
      const fichaSuelo = resultado.fichaSuelo || {};
      const clima = resultado.clima || null;
      const plagaPrincipal = Array.isArray(fichaCultivo.plagas_comunes)
        ? fichaCultivo.plagas_comunes[0]
        : null;

      panel.style.maxWidth = '720px';
      panel.innerHTML = `
        <div class="novedad-card" data-experto="Fabrizzio" style="display:grid;gap:12px">
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:start;flex-wrap:wrap">
            <div>
              <p class="novedad-n1" style="margin:0">Fabrizzio - Diagnóstico rural activo</p>
              <p class="novedad-n2" style="margin:6px 0 0">Lote: <strong>${this._escaparHtml(resultado.nombreLote)}</strong> · Cultivo: <strong>${this._escaparHtml(resultado.cultivo)}</strong></p>
            </div>
            <div style="background:${colorSemaforo};color:#fff;border-radius:999px;padding:8px 12px;font-weight:700;text-transform:uppercase">${this._escaparHtml(resultado.semaforo.nivel)}</div>
          </div>
          <p class="novedad-n3">${this._escaparHtml(resultado.semaforo.mensaje)}</p>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;font-size:13px;color:#244634">
            <div><strong>Riego óptimo:</strong><br>${this._escaparHtml(fichaCultivo.riego_optimo || `${fichaSuelo.riego_mm || 'Sin dato'} mm`)}</div>
            <div><strong>pH ideal:</strong><br>${Array.isArray(fichaSuelo.ph_ideal) ? this._escaparHtml(fichaSuelo.ph_ideal.join(' - ')) : 'Sin dato'}</div>
            <div><strong>NPK base:</strong><br>${fichaCultivo.npk_recomendado ? this._escaparHtml(`N ${fichaCultivo.npk_recomendado.N || 0} / P ${fichaCultivo.npk_recomendado.P || 0} / K ${fichaCultivo.npk_recomendado.K || 0}`) : 'Sin dato'}</div>
            <div><strong>Zona sugerida:</strong><br>${this._escaparHtml(fichaSuelo.zona || 'Sin dato')}</div>
          </div>
          <div style="background:#f4f7f4;border:1px solid #d8e5d9;border-radius:12px;padding:12px">
            <strong>Asesor de suelos:</strong>
            <div style="margin-top:6px">${this._escaparHtml(resultado.suelo.resumen)}</div>
          </div>
          <div style="background:#fff7e8;border:1px solid #efd9ab;border-radius:12px;padding:12px">
            <strong>Área y fertilización:</strong>
            <div style="margin-top:6px">${resultado.dosis.areaHa > 0 ? this._escaparHtml(`Para ${resultado.dosis.areaHa.toFixed(2)} ha, Fabrizzio estima ${resultado.dosis.bultos} bulto(s) base de fertilizante nitrogenado.`) : 'Todavía no hay un área medida para convertir la dosis a bultos.'}</div>
          </div>
          <div style="background:#eef5ff;border:1px solid #d8e5f5;border-radius:12px;padding:12px">
            <strong>Clima y alerta:</strong>
            <div style="margin-top:6px">${this._escaparHtml(resultado.climaAgronomico?.resumen || 'Sin alerta climática fuerte en el contexto actual.')}</div>
            ${clima ? `<div style="margin-top:8px;font-size:12px;color:#466152">Fuente: ${this._escaparHtml(clima.fuente || 'cache local')} • Estación: ${this._escaparHtml(clima.ubicacion || 'cercana')} • Actualizado: ${this._escaparHtml(new Date(clima.timestamp || Date.now()).toLocaleString('es-EC'))}</div>` : ''}
          </div>
          <div style="background:#fff;border:1px solid #d8e5d9;border-radius:12px;padding:12px">
            <strong>Motor por capas:</strong>
            <div style="margin-top:6px">${this._escaparHtml(resultado.diagnosticoCapas?.resumen || 'Sin lectura multicapa todavía.')}</div>
            <div style="margin-top:8px;font-size:12px;color:#466152">Capa dominante: ${this._escaparHtml(resultado.diagnosticoCapas?.capaDominante || 'observacion')} · Prioridad: ${this._escaparHtml(resultado.diagnosticoCapas?.prioridad || 'media')}</div>
          </div>
          <div style="background:#f7faf8;border:1px solid #d8e5d9;border-radius:12px;padding:12px">
            <strong>Continuidad del lote:</strong>
            <div style="margin-top:6px">${resultado.historial?.length ? this._escaparHtml(`Último caso: ${resultado.historial[0].sintoma_observado || 'sin síntoma'} · ${new Date(resultado.historial[0].fecha_registro).toLocaleDateString('es-EC')}`) : 'Este lote aún no tiene expediente agronómico previo.'}</div>
            <div style="margin-top:8px;font-size:12px;color:#466152">Entrevista lista con ${resultado.entrevista?.respuestas?.length || 0} variables técnicas para la siguiente revisión.</div>
          </div>
          ${resultado.evidencia?.url_foto ? `<div style="background:#fff;border:1px solid #d8e5d9;border-radius:12px;padding:12px"><strong>Evidencia capturada:</strong><div style="margin-top:8px"><img src="${this._escaparHtml(resultado.evidencia.url_foto)}" alt="Evidencia rural" style="width:100%;max-height:220px;object-fit:cover;border-radius:10px"></div></div>` : ''}
          ${plagaPrincipal ? `<div style="background:#fff;border:1px solid #e0e7de;border-radius:12px;padding:12px"><strong>Plaga a vigilar:</strong><div style="margin-top:6px">${this._escaparHtml(plagaPrincipal.nombre || 'Plaga registrada')} - ${this._escaparHtml(plagaPrincipal.sintoma || 'Sin síntoma descrito')}</div></div>` : ''}
          <div class="novedad-acciones" style="display:flex;flex-wrap:wrap;gap:8px">
            <button onclick="window.FabrizzioAsesor?.diagnosticarLoteActual()">Reanalizar</button>
            <button onclick="window.GestorRuralMelantia?.abrirEntrevistaDiagnostica(${JSON.stringify(resultado.idLote)})">Entrevista</button>
            <button onclick="window.GestorRuralMelantia?.abrirExpedienteLote(${JSON.stringify(resultado.idLote)})">Expediente</button>
            <button onclick="window.GestorRuralMelantia?.generarReporteTecnico(${JSON.stringify(resultado.idLote)})">Generar reporte</button>
            <button onclick="document.getElementById('panel-novedades').style.display='none'">Cerrar</button>
          </div>
        </div>`;
      panel.style.display = 'block';
      return true;
    },

    async generarReporteTecnico(idLote, opciones = {}) {
      const resultado = await this.analizarEstadoCultivo(idLote, opciones);
      const html = `<!doctype html><html lang="es"><head><meta charset="UTF-8"><title>Reporte técnico rural</title><style>body{font-family:Segoe UI,Tahoma,sans-serif;background:#f4f7f6;color:#173728;padding:24px}main{max-width:860px;margin:0 auto;background:#fff;border:1px solid #d7e6dc;border-radius:18px;padding:24px;box-shadow:0 12px 28px rgba(23,55,40,.08)}h1{margin:0 0 8px}section{margin-top:18px}strong{color:#143524}.badge{display:inline-block;padding:6px 10px;border-radius:999px;background:#eef6f1;font-weight:700;text-transform:uppercase}.nota{background:#f7faf8;border:1px solid #d7e6dc;border-radius:12px;padding:12px;margin-top:10px}</style></head><body><main><div class="badge">${this._escaparHtml(resultado.semaforo.nivel)}</div><h1>Certificado de Manejo Agronómico</h1><div>Lote: <strong>${this._escaparHtml(resultado.nombreLote)}</strong></div><div>Cultivo: <strong>${this._escaparHtml(resultado.cultivo)}</strong></div><div>Fecha: <strong>${this._escaparHtml(new Date(resultado.fechaIso).toLocaleString('es-EC'))}</strong></div><section><h2>Conclusión técnica</h2><div>${this._escaparHtml(resultado.semaforo.mensaje)}</div></section><section><h2>Motor por capas</h2><div>${this._escaparHtml(resultado.diagnosticoCapas?.resumen || 'Sin lectura multicapa.')}</div></section><section><h2>Suelos y enmienda</h2><div>${this._escaparHtml(resultado.suelo.resumen)}</div></section><section><h2>Clima validado</h2><div>${this._escaparHtml(resultado.climaAgronomico?.resumen || 'Sin cache meteorológica vigente.')}</div><div class="nota">${this._escaparHtml(`Fuente: ${resultado.clima?.fuente || 'cache local'} • Estación: ${resultado.clima?.ubicacion || 'cercana'} • Registro: ${resultado.clima ? new Date(resultado.clima.timestamp || Date.now()).toLocaleString('es-EC') : 'sin fecha'}`)}</div></section><section><h2>Área y dosis base</h2><div>${resultado.dosis.areaHa > 0 ? this._escaparHtml(`Área medida: ${resultado.dosis.areaHa.toFixed(2)} ha. Estimación base: ${resultado.dosis.bultos} bulto(s).`) : 'Sin área medida disponible.'}</div></section><section><h2>Expediente longitudinal</h2><div>${this._escaparHtml(resultado.historial?.length ? `Casos previos cargados: ${resultado.historial.length}` : 'Sin casos previos almacenados.')}</div></section><section><h2>Cláusula de trazabilidad rural</h2><div class="nota">Este reporte técnico está validado por la trazabilidad de suelo, cultivo, contexto operativo, entrevista técnica, evidencia de campo y registro meteorológico local de MELANTIA IA.</div></section></main></body></html>`;

      window.MelantiaAsistente?.registrarDocumentoModulo({
        titulo: `Reporte tecnico rural ${resultado.nombreLote}`,
        contenido: html,
        mimeType: 'text/html;charset=utf-8',
        modulo: 'Asistente Tecnico Rural',
        origen: 'reporte_rural',
        loteId: resultado.idLote,
        resumen: resultado.semaforo?.mensaje || 'Reporte tecnico rural',
      }).catch((error) =>
        console.warn('[Rural] No pude centralizar reporte técnico:', error)
      );

      const visor = window.open('', '_blank', 'noopener');
      if (visor) {
        visor.document.open();
        visor.document.write(html);
        visor.document.close();
      }
      return { resultado, html };
    },

    iniciar() {
      const menu = document.getElementById('app-menu');
      if (!menu || menu.querySelector('[data-modulo="fabrizzio-rural"]'))
        return;

      this._registrarListenersSincro();
      this.ejecutarCicloSincroClima();

      const card = document.createElement('article');
      card.className = 'card';
      card.dataset.modulo = 'fabrizzio-rural';
      card.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
          <h3 style="margin:0">Fabrizzio Rural</h3>
          <span style="background:#eef6f1;color:#1f3d2c;border-radius:999px;padding:6px 10px;font-size:12px;font-weight:700">Asesor agronómico offline</span>
        </div>
        <p>Diagnóstico de lotes agrícolas, entrevista técnica, evidencia de campo y expediente longitudinal con panel técnico ligero.</p>
        <p data-rural-resumen>Listo para escuchar: "Fabrizzio, cómo ves este lote" o abrir entrevista técnica.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
          <button type="button" data-fabrizzio-open style="background:#1f3d2c;color:#fff;border:none;border-radius:10px;padding:10px 14px;cursor:pointer;font-weight:700">Realizar diagnóstico</button>
          <button type="button" data-fabrizzio-rapido style="background:#eef6f1;color:#1f3d2c;border:none;border-radius:10px;padding:10px 14px;cursor:pointer;font-weight:700">Diagnóstico rápido</button>
        </div>`;
      menu.prepend(card);
      card.addEventListener('click', async () => {
        const lote = await window.FabrizzioAsesor?._resolverLoteActual?.();
        if (lote) {
          this.abrirEntrevistaDiagnostica(lote);
        }
      });
      card
        .querySelector('[data-fabrizzio-open]')
        ?.addEventListener('click', async (event) => {
          event.stopPropagation();
          const lote = await window.FabrizzioAsesor?._resolverLoteActual?.();
          if (lote) {
            this.abrirEntrevistaDiagnostica(lote);
          }
        });
      card
        .querySelector('[data-fabrizzio-rapido]')
        ?.addEventListener('click', async (event) => {
          event.stopPropagation();
          window.FabrizzioAsesor?.diagnosticarLoteActual();
        });
    },
  };

  window.GestorRuralMelantia = GestorRuralMelantia;
  window.analizarEstadoCultivoMelantia = async (idLote, opciones = {}) =>
    GestorRuralMelantia.analizarEstadoCultivo(idLote, opciones);
  window.generarReporteTecnicoRuralMelantia = async (idLote, opciones = {}) =>
    GestorRuralMelantia.generarReporteTecnico(idLote, opciones);
  window.obtenerReportesRuralesMelantia = () =>
    GestorRuralMelantia.listarReportesRurales();
  window.abrirEntrevistaRuralMelantia = async (idLote) =>
    GestorRuralMelantia.abrirEntrevistaDiagnostica(idLote);
  window.obtenerExpedienteRuralMelantia = async (idLote, limite = 5) =>
    GestorRuralMelantia.obtenerEvolucionLote(idLote, limite);
  window.sincronizarExpedienteRuralMelantia = async (
    config = null,
    opciones = {}
  ) => GestorRuralMelantia.sincronizarExpedienteCentroMando(config, opciones);
  window.actualizarClimaRuralMelantia = async (idLote, opciones = {}) =>
    GestorRuralMelantia.actualizarPronosticoLocal(idLote, opciones);
})();
