(function () {
  'use strict';

  const _QR_VERSION = 5;
  const _QR_SIZE = 17 + _QR_VERSION * 4;
  const _QR_DATA_CODEWORDS = 108;
  const _QR_ECC_CODEWORDS = 26;
  const _QR_EXP = new Array(512).fill(0);
  const _QR_LOG = new Array(256).fill(0);

  (() => {
    let valor = 1;
    for (let i = 0; i < 255; i += 1) {
      _QR_EXP[i] = valor;
      _QR_LOG[valor] = i;
      valor <<= 1;
      if (valor & 0x100) valor ^= 0x11d;
    }
    for (let i = 255; i < _QR_EXP.length; i += 1) {
      _QR_EXP[i] = _QR_EXP[i - 255];
    }
  })();

  const _qrMul = (a, b) => {
    if (!a || !b) return 0;
    return _QR_EXP[_QR_LOG[a] + _QR_LOG[b]];
  };

  const _qrPolyMul = (a, b) => {
    const resultado = new Array(a.length + b.length - 1).fill(0);
    for (let i = 0; i < a.length; i += 1) {
      for (let j = 0; j < b.length; j += 1) {
        resultado[i + j] ^= _qrMul(a[i], b[j]);
      }
    }
    return resultado;
  };

  const _qrGeneratorPoly = (grado) => {
    let polinomio = [1];
    for (let i = 0; i < grado; i += 1) {
      polinomio = _qrPolyMul(polinomio, [1, _QR_EXP[i]]);
    }
    return polinomio;
  };

  const _qrRemainder = (datos, grado) => {
    const generador = _qrGeneratorPoly(grado);
    const resultado = datos.slice();
    resultado.push(...new Array(grado).fill(0));
    for (let i = 0; i < datos.length; i += 1) {
      const factor = resultado[i];
      if (!factor) continue;
      for (let j = 0; j < generador.length; j += 1) {
        resultado[i + j] ^= _qrMul(generador[j], factor);
      }
    }
    return resultado.slice(-grado);
  };

  const _qrAgregarBits = (bits, valor, longitud) => {
    for (let i = longitud - 1; i >= 0; i -= 1) {
      bits.push((valor >>> i) & 1);
    }
  };

  const _qrCrearCodewords = (texto) => {
    const bytes = new TextEncoder().encode(texto);
    if (bytes.length > 80) {
      throw new Error('El payload QR excede la capacidad del encoder local.');
    }
    const bits = [];
    _qrAgregarBits(bits, 0x4, 4);
    _qrAgregarBits(bits, bytes.length, 8);
    bytes.forEach((byte) => _qrAgregarBits(bits, byte, 8));
    const capacidad = _QR_DATA_CODEWORDS * 8;
    const terminador = Math.min(4, capacidad - bits.length);
    _qrAgregarBits(bits, 0, terminador);
    while (bits.length % 8 !== 0) bits.push(0);
    const datos = [];
    for (let i = 0; i < bits.length; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8; j += 1) byte = (byte << 1) | bits[i + j];
      datos.push(byte);
    }
    let alternador = true;
    while (datos.length < _QR_DATA_CODEWORDS) {
      datos.push(alternador ? 0xec : 0x11);
      alternador = !alternador;
    }
    return datos.concat(_qrRemainder(datos, _QR_ECC_CODEWORDS));
  };

  const _qrNuevaMatriz = () =>
    Array.from({ length: _QR_SIZE }, () => Array(_QR_SIZE).fill(false));
  const _qrNuevoMapa = () =>
    Array.from({ length: _QR_SIZE }, () => Array(_QR_SIZE).fill(false));

  const _qrSetFuncion = (matriz, usadas, fila, col, valor) => {
    if (fila < 0 || col < 0 || fila >= _QR_SIZE || col >= _QR_SIZE) return;
    matriz[fila][col] = valor;
    usadas[fila][col] = true;
  };

  const _qrDibujarFinder = (matriz, usadas, fila, col) => {
    for (let y = fila - 1; y <= fila + 7; y += 1) {
      for (let x = col - 1; x <= col + 7; x += 1) {
        const esBorde = y < fila || y > fila + 6 || x < col || x > col + 6;
        const esMarco =
          y === fila || y === fila + 6 || x === col || x === col + 6;
        const esCentro =
          y >= fila + 2 && y <= fila + 4 && x >= col + 2 && x <= col + 4;
        _qrSetFuncion(matriz, usadas, y, x, !esBorde && (esMarco || esCentro));
      }
    }
  };

  const _qrDibujarAlineacion = (matriz, usadas, centroFila, centroCol) => {
    for (let y = -2; y <= 2; y += 1) {
      for (let x = -2; x <= 2; x += 1) {
        _qrSetFuncion(
          matriz,
          usadas,
          centroFila + y,
          centroCol + x,
          Math.max(Math.abs(x), Math.abs(y)) !== 1
        );
      }
    }
  };

  const _qrReservarFormato = (matriz, usadas) => {
    for (let i = 0; i <= 8; i += 1) {
      if (i !== 6) {
        _qrSetFuncion(matriz, usadas, 8, i, false);
        _qrSetFuncion(matriz, usadas, i, 8, false);
      }
    }
    for (let i = 0; i < 8; i += 1) {
      _qrSetFuncion(matriz, usadas, _QR_SIZE - 1 - i, 8, false);
      _qrSetFuncion(matriz, usadas, 8, _QR_SIZE - 1 - i, false);
    }
  };

  const _qrMascara0 = (fila, col) => (fila + col) % 2 === 0;

  const _qrFormatoBits = (mascara) => {
    let datos = 0b01000 | mascara;
    let resto = datos << 10;
    const generador = 0b10100110111;
    for (let i = 14; i >= 10; i -= 1) {
      if ((resto >>> i) & 1) resto ^= generador << (i - 10);
    }
    return ((datos << 10) | resto) ^ 0b101010000010010;
  };

  const _qrAplicarFormato = (matriz, usadas, mascara) => {
    const bits = _qrFormatoBits(mascara);
    const bit = (i) => ((bits >>> i) & 1) === 1;
    for (let i = 0; i <= 5; i += 1) _qrSetFuncion(matriz, usadas, 8, i, bit(i));
    _qrSetFuncion(matriz, usadas, 8, 7, bit(6));
    _qrSetFuncion(matriz, usadas, 8, 8, bit(7));
    _qrSetFuncion(matriz, usadas, 7, 8, bit(8));
    for (let i = 9; i < 15; i += 1)
      _qrSetFuncion(matriz, usadas, 14 - i, 8, bit(i));
    for (let i = 0; i < 8; i += 1)
      _qrSetFuncion(matriz, usadas, _QR_SIZE - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i += 1)
      _qrSetFuncion(matriz, usadas, 8, _QR_SIZE - 15 + i, bit(i));
    _qrSetFuncion(matriz, usadas, _QR_VERSION * 4 + 9, 8, true);
  };

  const _qrConstruirMatriz = (texto) => {
    const codewords = _qrCrearCodewords(texto);
    const bits = [];
    codewords.forEach((byte) => _qrAgregarBits(bits, byte, 8));
    const matriz = _qrNuevaMatriz();
    const usadas = _qrNuevoMapa();
    _qrDibujarFinder(matriz, usadas, 0, 0);
    _qrDibujarFinder(matriz, usadas, 0, _QR_SIZE - 7);
    _qrDibujarFinder(matriz, usadas, _QR_SIZE - 7, 0);
    _qrDibujarAlineacion(matriz, usadas, 30, 30);
    for (let i = 8; i < _QR_SIZE - 8; i += 1) {
      _qrSetFuncion(matriz, usadas, 6, i, i % 2 === 0);
      _qrSetFuncion(matriz, usadas, i, 6, i % 2 === 0);
    }
    _qrReservarFormato(matriz, usadas);
    let indiceBit = 0;
    let ascendente = true;
    for (let col = _QR_SIZE - 1; col >= 1; col -= 2) {
      if (col === 6) col -= 1;
      for (let offset = 0; offset < _QR_SIZE; offset += 1) {
        const fila = ascendente ? _QR_SIZE - 1 - offset : offset;
        for (let dx = 0; dx < 2; dx += 1) {
          const actualCol = col - dx;
          if (usadas[fila][actualCol]) continue;
          const bit = indiceBit < bits.length ? bits[indiceBit] === 1 : false;
          indiceBit += 1;
          matriz[fila][actualCol] = _qrMascara0(fila, actualCol) ? !bit : bit;
        }
      }
      ascendente = !ascendente;
    }
    _qrAplicarFormato(matriz, usadas, 0);
    return matriz;
  };

  const _qrMatrizASvg = (matriz, borde = 2) => {
    const comandos = [];
    for (let fila = 0; fila < matriz.length; fila += 1) {
      for (let col = 0; col < matriz.length; col += 1) {
        if (!matriz[fila][col]) continue;
        comandos.push(`M${col + borde},${fila + borde}h1v1h-1z`);
      }
    }
    const tam = matriz.length + borde * 2;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${tam} ${tam}" shape-rendering="crispEdges" aria-label="Codigo QR Melantia"><rect width="100%" height="100%" fill="#ffffff"></rect><path d="${comandos.join(' ')}" fill="#173728"></path></svg>`;
  };

  const _crearQrSvgLocal = (payload) =>
    _qrMatrizASvg(_qrConstruirMatriz(payload));

  const EscuelaCampoMelantia = {
    _storageKey: 'melantia_escuela_campo_estado',
    _configKey: 'melantia_escuela_campo_config',
    _stylesId: 'melantia-escuela-campo-css',
    _masterKey: 'MELANTIA-FIRMA-FASE2',
    _convenioNoticeKey: 'melantia_escuela_convenios_notice',

    cursos: {
      pasturas: {
        id: 'pasturas',
        nombre: 'Sanidad y Prevencion en el Hato',
        area: 'veterinaria',
        horas: 16,
        resumen:
          'Prevencion sanitaria del hato para reducir perdidas y anticiparse a las enfermedades mas costosas.',
        certifica: 'Capacitacion en Manejo Sanitario Preventivo',
        asistente: 'drjorge',
        mensajeAprobacion:
          'Excelente trabajo. Has demostrado que sabes cuidar la salud de tu hato. Tu certificado de Melantia ya esta listo. Sigue asi, colega.',
        modulos: [
          'Identificacion de signos vitales con termometro y observacion de mucosas.',
          'Calendario de vacunacion y desparasitacion segun la zona.',
          'Protocolos de higiene en el ordeno y manejo de terneros.',
        ],
        examen: {
          asistente: 'drjorge',
          tipo: '5 preguntas por voz con el Dr. Jorge',
          pregunta:
            'Si una vaca presenta fiebre y mucosas secas, cual es el primer paso preventivo correcto?',
          opciones: [
            {
              icono: '🌡️',
              texto: 'Tomar temperatura y aislarla',
              correcta: true,
            },
            { icono: '🥛', texto: 'Aumentar el ordeno', correcta: false },
            { icono: '🌧️', texto: 'Mojarla completa', correcta: false },
          ],
          explicacion:
            'Primero se confirma el signo vital y se evita contagio o estres adicional antes de decidir el manejo.',
        },
      },
      plagas: {
        id: 'plagas',
        nombre: 'Bioinsumos: Nutricion y Defensa Organica',
        area: 'agronomia',
        horas: 18,
        resumen:
          'Nutricion propia para el suelo y defensa organica para bajar costos de produccion.',
        certifica: 'Especialista en Elaboracion de Bioinsumos Organicos',
        asistente: 'fabrizzio',
        mensajeAprobacion:
          'Felicidades. Ahora eres un experto en bioinsumos. Ya puedes descargar tu certificado con el sello de la Escuela de Campo.',
        modulos: [
          'Elaboracion de biol y abonos fermentados con desechos de la finca.',
          'Caldos minerales para el control de hongos y plagas.',
          'Aplicacion correcta y dosis segun el cultivo.',
        ],
        examen: {
          asistente: 'fabrizzio',
          tipo: '5 preguntas interactivas con Fabrizzio',
          pregunta:
            'Para hacer un buen abono fermentado, que es lo mas importante?',
          opciones: [
            { icono: '💧', texto: 'Mucha agua', correcta: false },
            { icono: '🐄', texto: 'Estiercol fresco y melaza', correcta: true },
            { icono: '🪨', texto: 'Solo tierra seca', correcta: false },
          ],
          explicacion:
            'El estiercol fresco y la melaza activan la fermentacion y alimentan la microbiologia util del preparado.',
        },
      },
      administracion: {
        id: 'administracion',
        nombre: 'Finanzas para la Finca Rentable',
        area: 'gestion',
        horas: 12,
        resumen:
          'Ingresos, egresos, costos y ahorro para que la finca se maneje como una empresa.',
        certifica: 'Gestion Administrativa y Financiera Rural',
        asistente: 'angel',
        mensajeAprobacion:
          'Este certificado no solo es un papel, es la prueba de que tu finca ahora es mas profesional. Compartelo en tu Comunidad Virtual.',
        modulos: [
          'Registro de ingresos y egresos con el cuaderno digital de Melantia.',
          'Calculo del costo de produccion por litro, quintal o unidad productiva.',
          'Ahorro y reinversion para tiempos de sequia o baja produccion.',
        ],
        examen: {
          asistente: 'angel',
          tipo: 'Ejercicio practico de registro con Angel',
          pregunta:
            'Si vendes leche todos los dias, que debes registrar primero para saber tu ganancia real?',
          opciones: [
            { icono: '🧾', texto: 'Ingresos y costos diarios', correcta: true },
            { icono: '🎉', texto: 'Solo las ventas altas', correcta: false },
            { icono: '⏳', texto: 'Esperar al fin del ano', correcta: false },
          ],
          explicacion:
            'Sin registrar ingresos y costos diarios no puedes conocer la rentabilidad verdadera de la finca.',
        },
      },
    },

    _estadoBase() {
      const sesion = window._melantia_session || {};
      return {
        usuario: {
          nombre: sesion.nombre || sesion.productor || 'Socio MELANTIA',
          telefono: sesion.telefono || '0990000000',
        },
        progreso: {},
        certificados: [],
      };
    },

    _configBase() {
      return {
        faseActual: 'FASE_1_AVAL_MELANTIA',
        direccionTecnica: {
          nombre: 'Direccion Tecnica Melantia',
          selloEstado: 'AVAL_MELANTIA_ACTIVO',
          qrBase: 'melantia://certificados/verificar',
        },
        conveniosActivos: {
          cursos: {
            pasturas: {
              activo: false,
              curso_id: 'GAN-001',
              configuracion_visual: {
                espacios_logos: 2,
                header_logo_main: 'logo_melantia.png',
                header_logo_aliado_A: null,
                header_logo_aliado_B: null,
                nombre_proyecto: null,
                nombre_aliado_1: 'GAD / Municipio',
                nombre_aliado_2: 'ONG / Proyecto',
              },
              textos_legales: {
                mencion_convenio: '',
              },
              firmas: {
                footer_signature_A: 'Sello_Direccion_Melantia',
                footer_signature_B: null,
              },
            },
            plagas: {
              activo: false,
              curso_id: 'AGR-001',
              configuracion_visual: {
                espacios_logos: 2,
                header_logo_main: 'logo_melantia.png',
                header_logo_aliado_A: null,
                header_logo_aliado_B: null,
                nombre_proyecto: null,
                nombre_aliado_1: 'GAD / Municipio',
                nombre_aliado_2: 'ONG / Proyecto',
              },
              textos_legales: {
                mencion_convenio: '',
              },
              firmas: {
                footer_signature_A: 'Sello_Direccion_Melantia',
                footer_signature_B: null,
              },
            },
            administracion: {
              activo: false,
              curso_id: 'ADM-001',
              configuracion_visual: {
                espacios_logos: 2,
                header_logo_main: 'logo_melantia.png',
                header_logo_aliado_A: null,
                header_logo_aliado_B: null,
                nombre_proyecto: null,
                nombre_aliado_1: 'GAD / Municipio',
                nombre_aliado_2: 'ONG / Proyecto',
              },
              textos_legales: {
                mencion_convenio: '',
              },
              firmas: {
                footer_signature_A: 'Sello_Direccion_Melantia',
                footer_signature_B: null,
              },
            },
          },
        },
        autoridadesCertificadas: {
          agronomia: {
            nombre: 'Ing. [Nombre por definir]',
            registro_senescyt: '1234-5678',
            firma_electronica_status: 'PENDIENTE_SECURITY_DATA',
            ministerio_trabajo_ref: 'ACUERDO-001',
          },
          veterinaria: {
            nombre: 'Dr. [Nombre por definir]',
            registro_senescyt: '9876-5432',
            firma_electronica_status: 'PENDIENTE_SECURITY_DATA',
            ministerio_trabajo_ref: 'ACUERDO-002',
          },
        },
      };
    },

    _estado() {
      try {
        const guardado = JSON.parse(
          window.localStorage?.getItem(this._storageKey) || 'null'
        );
        return guardado
          ? { ...this._estadoBase(), ...guardado }
          : this._estadoBase();
      } catch {
        return this._estadoBase();
      }
    },

    _guardarEstado(estado) {
      window.localStorage?.setItem(this._storageKey, JSON.stringify(estado));
      return estado;
    },

    _config() {
      try {
        const guardado = JSON.parse(
          window.localStorage?.getItem(this._configKey) || 'null'
        );
        return guardado
          ? {
              ...this._configBase(),
              ...guardado,
              conveniosActivos: {
                ...this._configBase().conveniosActivos,
                ...(guardado.conveniosActivos || {}),
                cursos: {
                  ...this._configBase().conveniosActivos.cursos,
                  ...((guardado.conveniosActivos || {}).cursos || {}),
                },
              },
              autoridadesCertificadas: {
                ...this._configBase().autoridadesCertificadas,
                ...(guardado.autoridadesCertificadas || {}),
              },
            }
          : this._configBase();
      } catch {
        return this._configBase();
      }
    },

    _guardarConfig(config) {
      window.localStorage?.setItem(this._configKey, JSON.stringify(config));
      return config;
    },

    _escapeHtml(texto) {
      return String(texto || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    _activar(personaje) {
      if (window.STAFF_MELANTIA?.activarAsistente) {
        window.STAFF_MELANTIA.activarAsistente(personaje);
        return;
      }
      if (window.StaffController?.activarPersonaje) {
        window.StaffController.activarPersonaje(personaje);
      }
    },

    _hablarMelantia(texto) {
      this._activar('melantia');
      window.MelantiaVoz?.hablar?.(texto, 'melantia');
    },

    _hablarAngel(texto) {
      this._activar('angel');
      window.MelantiaVoz?.hablar?.(texto, 'angel');
    },

    _fechaLarga(fecha = new Date()) {
      return new Intl.DateTimeFormat('es-EC', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(new Date(fecha));
    },

    _hashLigero(texto) {
      let hash = 0;
      const valor = String(texto || '');
      for (let i = 0; i < valor.length; i += 1) {
        hash = (hash * 31 + valor.charCodeAt(i)) >>> 0;
      }
      return `ECM-${hash.toString(16).padStart(8, '0').toUpperCase()}`;
    },

    _curso(id) {
      return this.cursos[id] || null;
    },

    _convenioCurso(cursoId) {
      const base = this._configBase().conveniosActivos.cursos[cursoId] || null;
      const actual = this._config().conveniosActivos?.cursos?.[cursoId] || null;
      if (!base && !actual) return null;
      return {
        ...(base || {}),
        ...(actual || {}),
        configuracion_visual: {
          ...((base && base.configuracion_visual) || {}),
          ...((actual && actual.configuracion_visual) || {}),
        },
        textos_legales: {
          ...((base && base.textos_legales) || {}),
          ...((actual && actual.textos_legales) || {}),
        },
        firmas: {
          ...((base && base.firmas) || {}),
          ...((actual && actual.firmas) || {}),
        },
      };
    },

    _convenioTieneAliados(convenio) {
      const visual = convenio?.configuracion_visual || {};
      return Boolean(
        visual.header_logo_aliado_A ||
        visual.header_logo_aliado_B ||
        visual.nombre_proyecto ||
        convenio?.textos_legales?.mencion_convenio
      );
    },

    _mensajeBienvenidaConvenio(curso, convenio) {
      const aliado =
        convenio?.configuracion_visual?.nombre_proyecto ||
        convenio?.configuracion_visual?.nombre_aliado_1 ||
        'aliado institucional';
      return `Bienvenido. Este curso es especial. Se ha disenado gracias al apoyo del ${aliado}. Al terminar, tu certificado contara con el aval de ambas instituciones. Aprovecha esta oportunidad.`;
    },

    _notificarCambioConvenios() {
      const firmaActual = JSON.stringify(
        Object.keys(this.cursos || {}).map((cursoId) => {
          const convenio = this._convenioCurso(cursoId);
          return {
            cursoId,
            proyecto: convenio?.configuracion_visual?.nombre_proyecto || '',
            logoA: convenio?.configuracion_visual?.header_logo_aliado_A || '',
            logoB: convenio?.configuracion_visual?.header_logo_aliado_B || '',
            firmaB: convenio?.firmas?.footer_signature_B || '',
          };
        })
      );
      const firmaAnterior =
        window.localStorage?.getItem(this._convenioNoticeKey) || '';
      if (firmaActual === firmaAnterior) return;
      window.localStorage?.setItem(this._convenioNoticeKey, firmaActual);
      const hayConvenioVisible = Object.keys(this.cursos || {}).some(
        (cursoId) => this._convenioTieneAliados(this._convenioCurso(cursoId))
      );
      if (!hayConvenioVisible) return;
      this._hablarAngel(
        'He notado que tenemos un nuevo aliado para este curso. El sistema ya ha actualizado la plantilla para que los nuevos certificados salgan con los logos correspondientes. Esto le da mucho peso a nuestra comunidad.'
      );
    },

    _logoConvenioHtml(etiqueta, url, fallback) {
      if (url) {
        return `<div class="escuela-logo-slot"><img src="${this._escapeHtml(url)}" alt="${this._escapeHtml(etiqueta)}" /><small>${this._escapeHtml(etiqueta)}</small></div>`;
      }
      return `<div class="escuela-logo-slot placeholder"><strong>${this._escapeHtml(fallback)}</strong><small>${this._escapeHtml(etiqueta)}</small></div>`;
    },

    _progresoCurso(estado, cursoId) {
      return (
        estado.progreso?.[cursoId] || {
          avance: 0,
          testAprobado: false,
          fechaAprobacion: null,
        }
      );
    },

    _certificadoPorCurso(estado, cursoId) {
      return (
        (estado.certificados || []).find((item) => item.cursoId === cursoId) ||
        null
      );
    },

    _hablarAsistente(personaje, texto) {
      if (!texto) return;
      this._activar(personaje || 'melantia');
      window.MelantiaVoz?.hablar?.(texto, personaje || 'melantia');
    },

    _generarNumeroCertificado(historial = []) {
      const consecutivo = String(historial.length + 1).padStart(4, '0');
      return `ECM-${new Date().getFullYear()}-${consecutivo}`;
    },

    _payloadVerificacion(certificado) {
      return JSON.stringify({
        id: certificado.id,
        socio: certificado.nombreSocio,
        curso: certificado.cursoNombre,
        fase: certificado.fase,
        verificacion: certificado.verificacionId,
      });
    },

    _emitirCertificado(cursoId) {
      const estado = this._estado();
      const curso = this._curso(cursoId);
      if (!curso) return null;
      const progreso = this._progresoCurso(estado, cursoId);
      if (progreso.avance < 100 || !progreso.testAprobado) {
        this._hablarMelantia(
          'Primero debes completar el 100 por ciento del modulo y aprobar el test final.'
        );
        return null;
      }
      const existente = this._certificadoPorCurso(estado, cursoId);
      if (existente) return existente;
      const config = this._config();
      const id = this._generarNumeroCertificado(estado.certificados || []);
      const base = {
        id,
        cursoId,
        cursoNombre: curso.nombre,
        nombreSocio: estado.usuario.nombre,
        horas: curso.horas,
        fechaEmision: new Date().toISOString(),
        fase: config.faseActual,
        sello: config.direccionTecnica.nombre,
        actualizableFase2: true,
        aval: 'DIRECCION TECNICA DE MELANTIA',
        subtitulo: 'Formacion para el Desarrollo Rural Sostenible',
        certifica: curso.certifica || 'Capacitacion tecnica Melantia',
        convenio: this._convenioCurso(cursoId),
      };
      const certificado = {
        ...base,
        verificacionId: this._hashLigero(
          `${id}-${base.nombreSocio}-${cursoId}-${base.fechaEmision}`
        ),
      };
      certificado.qrPayload = this._payloadVerificacion(certificado);
      estado.certificados.unshift(certificado);
      this._guardarEstado(estado);
      this._hablarMelantia(
        `Felicidades. Has completado el curso de ${curso.nombre}. Tu certificado esta siendo generado con el sello institucional de Melantia.`
      );
      if (this._convenioTieneAliados(certificado.convenio)) {
        this._hablarAngel(
          this._mensajeBienvenidaConvenio(curso, certificado.convenio)
        );
      }
      this._hablarAsistente(curso.asistente, curso.mensajeAprobacion);
      this._hablarAngel(
        'Tu certificado ya esta disponible en tu Boveda de Documentos. Puedes descargarlo o enviarlo por WhatsApp. Tiene validez tecnica institucional.'
      );
      return certificado;
    },

    aprobarCurso(cursoId) {
      const estado = this._estado();
      const curso = this._curso(cursoId);
      if (!curso) return false;
      estado.progreso = {
        ...(estado.progreso || {}),
        [cursoId]: {
          avance: 100,
          testAprobado: true,
          fechaAprobacion: new Date().toISOString(),
        },
      };
      this._guardarEstado(estado);
      this.abrirPanel();
      this._hablarAsistente(
        curso.asistente,
        `Modulo completado. ${curso.nombre} ya quedo aprobado y listo para certificar.`
      );
      return true;
    },

    iniciarExamen(cursoId) {
      const curso = this._curso(cursoId);
      const convenio = this._convenioCurso(cursoId);
      if (!curso?.examen) return false;
      const detalle = document.querySelector('[data-escuela-detalle]');
      if (!detalle) {
        this.abrirPanel();
        return this.iniciarExamen(cursoId);
      }
      if (this._convenioTieneAliados(convenio)) {
        this._hablarAngel(this._mensajeBienvenidaConvenio(curso, convenio));
      }
      this._hablarAsistente(
        curso.examen.asistente,
        `${curso.nombre}. ${curso.examen.pregunta}`
      );
      detalle.innerHTML = `
        <div class="escuela-seccion">
          <h3>Test de Melantia</h3>
          <p><strong>${this._escapeHtml(curso.nombre)}</strong> · ${this._escapeHtml(curso.examen.tipo)}</p>
          <p>${this._escapeHtml(curso.examen.pregunta)}</p>
          <div class="escuela-examen-opciones">${curso.examen.opciones
            .map(
              (opcion, indice) =>
                `<button type="button" class="escuela-opcion" onclick="EscuelaCampoMelantia.responderExamen('${curso.id}', ${indice})"><span>${this._escapeHtml(opcion.icono)}</span><strong>${this._escapeHtml(opcion.texto)}</strong></button>`
            )
            .join('')}</div>
          <div class="escuela-alerta"><strong>Segunda oportunidad</strong><p>Si fallas, el asistente te explica brevemente por que te equivocaste y puedes intentarlo otra vez tras repasar el modulo.</p></div>
        </div>`;
      return true;
    },

    responderExamen(cursoId, indice) {
      const curso = this._curso(cursoId);
      const opcion = curso?.examen?.opciones?.[indice];
      if (!curso || !opcion) return false;
      if (opcion.correcta) {
        return this.aprobarCurso(cursoId);
      }
      this._hablarAsistente(curso.asistente, curso.examen.explicacion);
      const detalle = document.querySelector('[data-escuela-detalle]');
      if (detalle) {
        detalle.innerHTML += `<div class="escuela-alerta error"><strong>Repasa y vuelve a intentar</strong><p>${this._escapeHtml(curso.examen.explicacion)}</p><div class="escuela-mini-actions wrap"><button type="button" onclick="EscuelaCampoMelantia.iniciarExamen('${curso.id}')">Intentar de nuevo</button></div></div>`;
      }
      return false;
    },

    generarCertificado(cursoId) {
      const certificado = this._emitirCertificado(cursoId);
      if (!certificado) return false;
      this.verCertificado(certificado.id);
      return true;
    },

    _htmlTarjetasCursos(estado) {
      return Object.values(this.cursos)
        .map((curso) => {
          const progreso = this._progresoCurso(estado, curso.id);
          const certificado = this._certificadoPorCurso(estado, curso.id);
          const convenio = this._convenioCurso(curso.id);
          const tieneConvenioVisible = this._convenioTieneAliados(convenio);
          return `
            <article class="escuela-card">
              <span class="escuela-chip">${this._escapeHtml(curso.area)}</span>
              <h3>${this._escapeHtml(curso.nombre)}</h3>
              <p>${this._escapeHtml(curso.resumen)}</p>
              ${tieneConvenioVisible ? `<div class="escuela-alerta convenio"><strong>Curso de convenio</strong><p>${this._escapeHtml(convenio.configuracion_visual?.nombre_proyecto || convenio.textos_legales?.mencion_convenio || 'Curso emitido con aliado institucional.')}</p></div>` : ''}
              <div class="escuela-lista-modulos">${(curso.modulos || [])
                .map(
                  (modulo, indice) =>
                    `<div><strong>Modulo ${indice + 1}:</strong> ${this._escapeHtml(modulo)}</div>`
                )
                .join('')}</div>
              <div class="escuela-kpis">
                <div><span>Horas</span><strong>${curso.horas}</strong></div>
                <div><span>Progreso</span><strong>${progreso.avance}%</strong></div>
                <div><span>Test</span><strong>${progreso.testAprobado ? 'Aprobado' : 'Pendiente'}</strong></div>
              </div>
              <div class="escuela-alerta"><strong>Certifica</strong><p>${this._escapeHtml(curso.certifica || 'Capacitacion tecnica')}</p><small>${this._escapeHtml(curso.examen?.tipo || 'Examen final accesible')}</small></div>
              <div class="escuela-mini-actions">
                <button type="button" onclick="EscuelaCampoMelantia.iniciarExamen('${curso.id}')">Presentar examen</button>
                ${certificado ? `<button type="button" class="secundario" onclick="EscuelaCampoMelantia.verCertificado('${certificado.id}')">Ver certificado</button>` : `<button type="button" class="secundario" onclick="EscuelaCampoMelantia.generarCertificado('${curso.id}')">Emitir certificado</button>`}
              </div>
            </article>`;
        })
        .join('');
    },

    _htmlBoveda(estado) {
      if (!estado.certificados.length) {
        return '<p>Aun no tienes certificados emitidos. Completa un curso y aprueba su test final para generar el primero.</p>';
      }
      return `<div class="escuela-boveda-lista">${estado.certificados
        .map(
          (item) => `
            <article class="escuela-boveda-item">
              <div>
                <strong>${this._escapeHtml(item.cursoNombre)}</strong>
                <p>ID ${this._escapeHtml(item.id)} · ${this._escapeHtml(this._fechaLarga(item.fechaEmision))}</p>
                <small>Verificacion ${this._escapeHtml(item.verificacionId)} · ${this._escapeHtml(item.fase)}</small>
              </div>
              <div class="escuela-mini-actions wrap">
                <button type="button" onclick="EscuelaCampoMelantia.verCertificado('${item.id}')">Abrir</button>
                <button type="button" class="secundario" onclick="EscuelaCampoMelantia.descargarCertificado('${item.id}')">Imprimir / PDF</button>
                <button type="button" class="secundario" onclick="EscuelaCampoMelantia.compartirWhatsApp('${item.id}')">WhatsApp</button>
              </div>
            </article>`
        )
        .join('')}</div>`;
    },

    _htmlRutaLegal(config) {
      return `
        <div class="escuela-fase2">
          <h3>Preparado para Fase 2</h3>
          <p>Hoy emitimos certificados con aval institucional Melantia. La plantilla ya esta lista para reemplazar el sello por firma electronica oficial cuando se cargue el Security Data.</p>
          <div class="escuela-kpis compactos">
            <div><span>Agronomia</span><strong>${this._escapeHtml(config.autoridadesCertificadas.agronomia.firma_electronica_status)}</strong></div>
            <div><span>Veterinaria</span><strong>${this._escapeHtml(config.autoridadesCertificadas.veterinaria.firma_electronica_status)}</strong></div>
            <div><span>Modo actual</span><strong>${this._escapeHtml(config.faseActual)}</strong></div>
          </div>
          <div class="escuela-mini-actions wrap">
            <button type="button" class="secundario" onclick="EscuelaCampoMelantia.abrirBovedaFirmas()">Boveda de firmas</button>
            <button type="button" class="secundario" onclick="EscuelaCampoMelantia.actualizarCertificadosFase2()">Actualizar certificados cuando haya firma oficial</button>
          </div>
        </div>`;
    },

    _certificadoHtml(certificado) {
      const qrSvg = _crearQrSvgLocal(certificado.qrPayload);
      const convenio = certificado.convenio || null;
      const mostrarConvenio = this._convenioTieneAliados(convenio);
      const logosHtml = mostrarConvenio
        ? `<div class="escuela-logos-convenio">${this._logoConvenioHtml('MELANTIA', convenio?.configuracion_visual?.header_logo_main || '', 'MELANTIA')}${this._logoConvenioHtml(convenio.configuracion_visual?.nombre_aliado_1 || 'Aliado Estrategico 1', convenio.configuracion_visual?.header_logo_aliado_A, 'ALIADO A')}${this._logoConvenioHtml(convenio.configuracion_visual?.nombre_aliado_2 || 'Aliado Estrategico 2', convenio.configuracion_visual?.header_logo_aliado_B, 'ALIADO B')}</div>`
        : `<div class="escuela-logos-convenio centrado">${this._logoConvenioHtml('MELANTIA', '', 'MELANTIA')}</div>`;
      const proyecto =
        mostrarConvenio && convenio?.configuracion_visual?.nombre_proyecto
          ? ` en colaboracion con ${convenio.configuracion_visual.nombre_proyecto}`
          : '';
      const mencionConvenio =
        mostrarConvenio && convenio?.textos_legales?.mencion_convenio
          ? `<p>${this._escapeHtml(convenio.textos_legales.mencion_convenio)}</p>`
          : '';
      const textoConvenio = mostrarConvenio
        ? `<p class="escuela-cert-convenio">En convenio con: ${this._escapeHtml(convenio.configuracion_visual?.nombre_proyecto || convenio.configuracion_visual?.nombre_aliado_1 || 'Socio estrategico')}</p>`
        : '';
      return `
        <div class="escuela-certificado">
          ${logosHtml}
          <div class="escuela-cert-header">
            <div>
              <p class="escuela-eyebrow">ESCUELA DE CAMPO MELANTIA</p>
              <p class="escuela-cert-subtitle">${this._escapeHtml(certificado.subtitulo || 'Formacion para el Desarrollo Rural Sostenible')}</p>
              <h2>${this._escapeHtml(certificado.cursoNombre)}</h2>
              ${textoConvenio}
              <p>Se otorga el presente reconocimiento a:</p>
              <p class="escuela-cert-socio">${this._escapeHtml(certificado.nombreSocio)}</p>
              <p>Por haber completado y aprobado satisfactoriamente el curso tecnico de:</p>
              <p class="escuela-cert-curso">${this._escapeHtml(certificado.cursoNombre)}</p>
              <p>Desarrollado por la Escuela de Campo MELANTIA${this._escapeHtml(proyecto)}. Esta capacitacion incluyo formacion tecnica avanzada en practicas regenerativas y eficiencia productiva.</p>
              ${mencionConvenio}
            </div>
            <div class="escuela-sello">AVAL MELANTIA</div>
          </div>
          <div class="escuela-cert-grid">
            <div class="escuela-cert-bloque">
              <strong>Pie del documento</strong>
              <p>Certificado No: ${this._escapeHtml(certificado.id)}</p>
              <p>Fecha de Emision: ${this._escapeHtml(this._fechaLarga(certificado.fechaEmision))}</p>
              <p>ID de Verificacion: ${this._escapeHtml(certificado.verificacionId)}</p>
              <p>Horas certificadas: ${certificado.horas}</p>
            </div>
            <div class="escuela-cert-bloque">
              <strong>AVALADO POR:</strong>
              <p>${this._escapeHtml(certificado.aval || 'DIRECCION TECNICA DE MELANTIA')}</p>
              <p>Sello de Validez Institucional Interna</p>
              ${mostrarConvenio ? `<p>${this._escapeHtml(convenio.configuracion_visual?.nombre_aliado_1 || 'Aliado estrategico')}${convenio.configuracion_visual?.nombre_aliado_2 ? ` + ${this._escapeHtml(convenio.configuracion_visual.nombre_aliado_2)}` : ''}</p>` : ''}
              <p>Ruta de upgrade: listo para reemplazo por firma electronica oficial.</p>
            </div>
          </div>
          <div class="escuela-cert-firma">
            <div>
              <strong>Bloque de firmas</strong>
              <p>${this._escapeHtml(convenio?.firmas?.footer_signature_A || certificado.aval || 'Sello_Direccion_Melantia')}</p>
              ${mostrarConvenio ? `<p>${this._escapeHtml(convenio?.firmas?.footer_signature_B || convenio.configuracion_visual?.nombre_aliado_1 || 'Firma / sello aliado')}</p>` : ''}
              <p>Fase actual: ${this._escapeHtml(certificado.fase)}</p>
              <p>${this._escapeHtml(certificado.certifica || 'Capacitacion tecnica Melantia')}</p>
            </div>
            <div class="escuela-qr">${qrSvg}</div>
          </div>
        </div>`;
    },

    _contenidoPrincipal() {
      const estado = this._estado();
      const config = this._config();
      return `
        <div class="escuela-shell">
          <div class="escuela-hero">
            <div>
              <p class="escuela-eyebrow">Escuela de Campo</p>
              <h2>Certificacion institucional Melantia</h2>
              <p>Bienvenido a la Escuela de Campo. Aqui el conocimiento es tu mejor herramienta. Al completar cada modulo, recibiras un certificado con el sello de Melantia que acredita tus nuevas habilidades tecnicas.</p>
            </div>
            <div class="escuela-hero-box">
              <span>Fase activa</span>
              <strong>Fase 1</strong>
              <p>Aval institucional Melantia con QR interno de validacion y descarga unica para uso offline en campo.</p>
            </div>
          </div>
          <section class="escuela-seccion">
            <h3>Pestana Escuela</h3>
            <p>Los audios y apoyos visuales se descargan una sola vez para que el socio estudie y rinda su evaluacion aun sin internet.</p>
            <div class="escuela-grid">${this._htmlTarjetasCursos(estado)}</div>
          </section>
          <section class="escuela-seccion">
            <h3>Mi Boveda de Documentos</h3>
            ${this._htmlBoveda(estado)}
          </section>
          <section class="escuela-seccion">
            ${this._htmlRutaLegal(config)}
          </section>
          <section class="escuela-seccion">
            <h3>Validador interno</h3>
            <p>Cualquier empleador o institucion puede comparar el ID y el codigo QR con el registro interno de la app para confirmar que el certificado es autentico.</p>
          </section>
          <div class="escuela-detalle" data-escuela-detalle></div>
        </div>`;
    },

    abrirPanel() {
      this._asegurarEstilos();
      this._notificarCambioConvenios();
      const panel = document.getElementById('panel-novedades');
      if (!panel) return false;
      panel.style.maxWidth = '1080px';
      panel.innerHTML = `<div class="novedad-card escuela-wrapper" data-experto="Melantia">${this._contenidoPrincipal()}</div>`;
      panel.style.display = 'block';
      return true;
    },

    abrirBovedaCertificados() {
      this.abrirPanel();
      const detalle = document.querySelector('[data-escuela-detalle]');
      if (detalle) {
        detalle.innerHTML = `<div class="escuela-seccion"><h3>Boveda de documentos</h3>${this._htmlBoveda(this._estado())}</div>`;
      }
      return true;
    },

    verCertificado(certificadoId) {
      const estado = this._estado();
      const certificado = (estado.certificados || []).find(
        (item) => item.id === certificadoId
      );
      if (!certificado) return false;
      this.abrirPanel();
      const detalle = document.querySelector('[data-escuela-detalle]');
      if (detalle) {
        detalle.innerHTML = `
          <div class="escuela-seccion">
            <h3>Certificado emitido</h3>
            ${this._certificadoHtml(certificado)}
            <div class="escuela-mini-actions wrap" style="margin-top:12px">
              <button type="button" onclick="EscuelaCampoMelantia.descargarCertificado('${certificado.id}')">Imprimir / Guardar PDF</button>
              <button type="button" class="secundario" onclick="EscuelaCampoMelantia.compartirWhatsApp('${certificado.id}')">Enviar por WhatsApp</button>
            </div>
          </div>`;
      }
      return true;
    },

    descargarCertificado(certificadoId) {
      const estado = this._estado();
      const certificado = (estado.certificados || []).find(
        (item) => item.id === certificadoId
      );
      if (!certificado) return false;
      const htmlCertificado = `<!DOCTYPE html><html><head><title>${this._escapeHtml(certificado.id)}</title><style>body{font-family:Segoe UI,Arial,sans-serif;background:#f8f1e8;padding:24px;color:#2f2318}.wrap{max-width:980px;margin:0 auto;background:#fff;border:1px solid #ead7c0;border-radius:20px;padding:24px}@media print{body{background:#fff;padding:0}.wrap{border:none;padding:0}}</style></head><body><div class="wrap">${this._certificadoHtml(certificado)}</div><script>window.onload=function(){window.print();}</script></body></html>`;
      window.MelantiaAsistente?.registrarDocumentoModulo({
        titulo: `Certificado ${certificado.cursoNombre}`,
        contenido: htmlCertificado,
        mimeType: 'text/html;charset=utf-8',
        modulo: 'Escuela de Campo MELANTIA',
        origen: 'certificados_escuela',
        resumen: `Certificado ${certificado.id} · ${certificado.cursoNombre}`,
      }).catch((error) =>
        console.warn(
          '[Melantia] No pude centralizar certificado de Escuela:',
          error
        )
      );
      const ventana = window.open(
        '',
        '_blank',
        'noopener,noreferrer,width=960,height=760'
      );
      if (!ventana) return false;
      ventana.document.write(htmlCertificado);
      ventana.document.close();
      return true;
    },

    compartirWhatsApp(certificadoId) {
      const estado = this._estado();
      const certificado = (estado.certificados || []).find(
        (item) => item.id === certificadoId
      );
      if (!certificado) return false;
      const mensaje = `Mi certificado Melantia ya esta listo. Curso: ${certificado.cursoNombre}. ID: ${certificado.id}. Codigo de verificacion: ${certificado.verificacionId}.`;
      window.open(
        `https://wa.me/?text=${encodeURIComponent(mensaje)}`,
        '_blank',
        'noopener'
      );
      return true;
    },

    abrirBovedaFirmas() {
      const clave = window.prompt('Clave maestra para la boveda de firmas');
      if (clave !== this._masterKey) {
        this._hablarMelantia('Acceso denegado a la boveda de firmas.');
        return false;
      }
      const config = this._config();
      this.abrirPanel();
      const detalle = document.querySelector('[data-escuela-detalle]');
      if (detalle) {
        detalle.innerHTML = `
          <div class="escuela-seccion">
            <h3>Boveda de Firmas</h3>
            <p>Espacio reservado para Security Data. Aqui se cargaran los certificados .p12 o equivalentes cuando se habilite la fase legal.</p>
            <div class="escuela-grid">
              <article class="escuela-card"><h3>Agronomia</h3><p>${this._escapeHtml(config.autoridadesCertificadas.agronomia.nombre)}</p><small>${this._escapeHtml(config.autoridadesCertificadas.agronomia.firma_electronica_status)}</small></article>
              <article class="escuela-card"><h3>Veterinaria</h3><p>${this._escapeHtml(config.autoridadesCertificadas.veterinaria.nombre)}</p><small>${this._escapeHtml(config.autoridadesCertificadas.veterinaria.firma_electronica_status)}</small></article>
            </div>
          </div>`;
      }
      return true;
    },

    actualizarCertificadosFase2() {
      const config = this._config();
      const lista = Object.values(config.autoridadesCertificadas || {});
      if (lista.some((item) => item.firma_electronica_status !== 'ACTIVA')) {
        this._hablarMelantia(
          'La ruta retroactiva ya esta preparada, pero aun faltan firmas oficiales activas para ejecutar la actualizacion.'
        );
        return false;
      }
      const estado = this._estado();
      estado.certificados = (estado.certificados || []).map((item) => ({
        ...item,
        fase: 'FASE_2_FIRMA_OFICIAL',
        actualizableFase2: false,
      }));
      this._guardarEstado(estado);
      this.abrirPanel();
      return true;
    },

    iniciarTarjetaMenu() {
      const menu = document.getElementById('app-menu');
      if (!menu) return false;
      let card = menu.querySelector('[data-modulo="escuela-campo"]');
      if (!card) {
        card = document.createElement('article');
        card.className = 'card';
        card.dataset.modulo = 'escuela-campo';
        card.innerHTML = `
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap">
            <div>
              <h3 style="margin:0">Escuela de Campo</h3>
              <p style="margin:8px 0 0">Cursos tecnicos, aprobacion y certificado institucional Melantia con QR interno.</p>
            </div>
            <span class="escuela-menu-chip">Melantia</span>
          </div>
          <p data-escuela-resumen>Listo para certificar nuevas habilidades.</p>
          <button type="button" style="margin-top:10px;background:#1e5a3a;color:#fff;border:none;border-radius:10px;padding:10px 14px;cursor:pointer;font-weight:700">Abrir escuela</button>`;
        menu.prepend(card);
        card.addEventListener('click', () => this.abrirPanel());
        card.querySelector('button')?.addEventListener('click', (event) => {
          event.stopPropagation();
          this.abrirPanel();
        });
      }
      const resumen = this._estado();
      const nodo = card.querySelector('[data-escuela-resumen]');
      if (nodo) {
        nodo.textContent = `${(resumen.certificados || []).length} certificado(s) emitido(s) · ${Object.keys(this.cursos).length} ruta(s) activas`;
      }
      return true;
    },

    _asegurarEstilos() {
      if (document.getElementById(this._stylesId)) return;
      const style = document.createElement('style');
      style.id = this._stylesId;
      style.textContent = `
        .escuela-wrapper{padding:0;background:transparent;box-shadow:none}
        .escuela-shell{display:grid;gap:16px}
        .escuela-hero{display:grid;grid-template-columns:1.6fr minmax(220px,300px);gap:16px;padding:18px;border-radius:22px;background:linear-gradient(135deg,#eff9f0 0%,#fff8ec 100%);border:1px solid #dcebd7}
        .escuela-eyebrow{margin:0 0 8px;color:#2b6845;font-weight:800;letter-spacing:.4px;text-transform:uppercase;font-size:12px}
        .escuela-hero h2,.escuela-seccion h3{margin:0;color:#1f4e35}
        .escuela-hero p,.escuela-seccion p{margin:0;color:#4a5a4d;line-height:1.5}
        .escuela-hero-box{display:grid;gap:8px;background:#18472d;color:#fff;padding:16px;border-radius:18px}
        .escuela-hero-box span{font-size:12px;opacity:.8;text-transform:uppercase;letter-spacing:.5px}
        .escuela-hero-box strong{font-size:30px}
        .escuela-seccion{display:grid;gap:12px;background:#fff;border:1px solid #e3eadf;border-radius:18px;padding:16px}
        .escuela-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
        .escuela-card{display:grid;gap:10px;padding:14px;border:1px solid #dce7db;border-radius:16px;background:#fbfdfb}
        .escuela-card h3{margin:0;color:#234d36}
        .escuela-logos-convenio{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;align-items:stretch}
        .escuela-logos-convenio.centrado{grid-template-columns:minmax(160px,240px);justify-content:center}
        .escuela-logo-slot{display:grid;gap:8px;justify-items:center;align-content:center;padding:12px;border-radius:14px;background:#fff;border:1px solid #e7dcc9;min-height:92px;text-align:center}
        .escuela-logo-slot img{max-width:100%;max-height:48px;object-fit:contain}
        .escuela-logo-slot.placeholder{background:#f8fbf7;color:#2a5a3c}
        .escuela-lista-modulos{display:grid;gap:6px;font-size:13px;color:#4f6154}
        .escuela-chip,.escuela-menu-chip{display:inline-flex;align-items:center;justify-content:center;padding:6px 10px;border-radius:999px;background:#ebf7ed;color:#22563a;font-size:12px;font-weight:800;text-transform:uppercase}
        .escuela-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
        .escuela-kpis.compactos{grid-template-columns:repeat(3,minmax(0,1fr))}
        .escuela-kpis div{display:grid;gap:4px;padding:10px 12px;border-radius:14px;background:#f7fbf7;border:1px solid #dfebe0}
        .escuela-kpis span{font-size:12px;color:#6d7f71}
        .escuela-kpis strong{color:#214c34}
        .escuela-mini-actions{display:flex;gap:8px;flex-wrap:wrap}
        .escuela-mini-actions button{border:none;border-radius:999px;padding:10px 14px;font-weight:700;cursor:pointer;background:#1e5a3a;color:#fff}
        .escuela-mini-actions button.secundario{background:#eef6ef;color:#1f4e35;border:1px solid #d9e7db}
        .escuela-mini-actions.wrap{margin-top:8px}
        .escuela-alerta{display:grid;gap:6px;padding:12px;border-radius:14px;background:#f7fbf4;border:1px solid #dcebd5;color:#435545}
        .escuela-alerta.error{background:#fff2ee;border-color:#efc1b4}
        .escuela-alerta.convenio{background:#eef6ff;border-color:#bed7f3;color:#244261}
        .escuela-boveda-lista{display:grid;gap:10px}
        .escuela-boveda-item{display:grid;gap:10px;padding:12px;border-radius:14px;background:#fbf8f3;border:1px solid #ebdcc6}
        .escuela-boveda-item p,.escuela-boveda-item small{margin:0;color:#66594b}
        .escuela-fase2{display:grid;gap:12px}
        .escuela-certificado{display:grid;gap:14px;padding:18px;border:1px solid #e7d9c6;border-radius:20px;background:linear-gradient(180deg,#fffdf8 0%,#fff4e8 100%)}
        .escuela-cert-header{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}
        .escuela-cert-subtitle{font-size:14px;color:#6f5a43}
        .escuela-cert-socio,.escuela-cert-curso{font-size:20px;font-weight:800;color:#1f4e35}
        .escuela-sello{display:inline-flex;align-items:center;justify-content:center;padding:12px 16px;border-radius:999px;background:#dcf3de;color:#1f6a3e;font-weight:900;letter-spacing:.6px}
        .escuela-cert-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
        .escuela-cert-bloque{display:grid;gap:6px;padding:12px;border-radius:16px;background:#fff;border:1px solid #e8dccb}
        .escuela-cert-firma{display:grid;grid-template-columns:1.2fr 180px;gap:16px;align-items:center;padding:12px;border-radius:16px;background:#fff;border:1px solid #e8dccb}
        .escuela-qr svg{width:100%;height:auto;display:block}
        .escuela-detalle{display:grid;gap:12px}
        .escuela-examen-opciones{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
        .escuela-opcion{display:grid;gap:8px;justify-items:start;text-align:left;padding:14px;border-radius:16px;border:1px solid #d7e8d8;background:#fff;cursor:pointer;font-weight:700;color:#214c34}
        @media (max-width:860px){.escuela-hero,.escuela-grid,.escuela-kpis,.escuela-kpis.compactos,.escuela-cert-grid,.escuela-cert-firma,.escuela-examen-opciones,.escuela-logos-convenio{grid-template-columns:1fr}}
      `;
      document.head.appendChild(style);
    },

    init() {
      this._asegurarEstilos();
      this.iniciarTarjetaMenu();
    },
  };

  window.EscuelaCampoMelantia = EscuelaCampoMelantia;

  document.addEventListener('DOMContentLoaded', () => {
    EscuelaCampoMelantia.init();
  });
})();
