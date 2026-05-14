(function () {
  'use strict';

  const SistemaAfiliados = {
    _storageKey: 'melantia_afiliados_estado',
    _stylesId: 'melantia-afiliados-css',
    _datosDemoKey: 'melantia_afiliados_demo_cargado',
    // PLANES DE SUSCRIPCION
    planes: {
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
    },

    _estadoBase() {
      return {
        usuario: {
          nombre: 'Padrino MELANTIA',
          pin_usuario: 'MEL-8829',
          plan_actual: 'profesional',
          correo: 'presidencia@melantia.ec',
          banco: 'Banco Cooperativo Rural',
          cuenta_destino: '****4321',
        },
        acumulado_bruto: 0,
        umbral_pago: 60,
        retiro_solicitado: false,
        historial_pagos: [],
        lista_afiliados: [],
        materiales: [
          {
            titulo: 'Invitacion de campo',
            texto:
              'Unete a mi red en MELANTIA y mejora tu finca conmigo. Usa mi PIN maestro para activar tus beneficios.',
          },
          {
            titulo: 'Mensaje para comunidad',
            texto:
              'Nuestra organizacion puede bajar costos y subir productividad con MELANTIA. Usa este PIN y entra a la red comunitaria.',
          },
        ],
      };
    },

    init() {
      this._asegurarEstilos();
      this._asegurarDatosDemo();
      this.iniciarTarjetaMenu();
    },

    _normalizar(texto) {
      return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    },

    _estado() {
      try {
        const guardado = JSON.parse(
          window.localStorage?.getItem(this._storageKey) || 'null'
        );
        if (!guardado) return this._estadoBase();
        return {
          ...this._estadoBase(),
          ...guardado,
          usuario: {
            ...this._estadoBase().usuario,
            ...(guardado.usuario || {}),
          },
          lista_afiliados: Array.isArray(guardado.lista_afiliados)
            ? guardado.lista_afiliados
            : [],
          historial_pagos: Array.isArray(guardado.historial_pagos)
            ? guardado.historial_pagos
            : [],
        };
      } catch {
        return this._estadoBase();
      }
    },

    _guardarEstado(estado) {
      window.localStorage?.setItem(this._storageKey, JSON.stringify(estado));
      return estado;
    },

    // === SISTEMA DE MELANTIOS (Economía en Cascada) ===
    _cargarConfigMelantios() {
      try {
        const config = require('../../database/melantios_economy_v1.json');
        return config.business_rules.reward_points;
      } catch {
        return {
          loyalty_6_months: {
            cascada: { socio: 100, padrino: 20, presidente: 10 },
            total_cost_usd: 1.3,
          },
          folklore_story: {
            cascada: { socio: 25, padrino: 10, presidente: 5 },
            total_cost_usd: 0.4,
          },
          new_word: {
            cascada: { socio: 5, padrino: 2, presidente: 1 },
            total_cost_usd: 0.08,
          },
          health_record: {
            cascada: { socio: 10, padrino: 5, presidente: 2 },
            total_cost_usd: 0.17,
          },
        };
      }
    },

    _convertToUSD(melantios) {
      // 1 Melantio = 0.01 USD (100 M = $1)
      return (melantios * 0.01).toFixed(2);
    },

    _convertFromUSD(dolares) {
      // Inverso: $1 USD = 100 Melantios
      return Math.round(dolares * 100);
    },

    ganarMelantioCascada(tipoRecompensa, idSocio, idPadrino, idPresidente) {
      // Distribuye Melantios en cascada: socio, padrino, presidente
      const config = this._cargarConfigMelantios();
      const recompensa = config[tipoRecompensa];

      if (!recompensa) {
        console.warn(`Tipo de recompensa desconocida: ${tipoRecompensa}`);
        return null;
      }

      const { cascada, total_cost_usd } = recompensa;
      const timestamp = new Date().toISOString();

      return {
        tipoRecompensa,
        timestamp,
        estado: 'PENDIENTE_VALIDACION_PADRINO', // Se libera cuando Padrino valida
        distribucion: {
          socio: {
            idSocio,
            melantios: cascada.socio,
            usd: this._convertToUSD(cascada.socio),
          },
          padrino: {
            idPadrino,
            melantios: cascada.padrino,
            usd: this._convertToUSD(cascada.padrino),
          },
          presidente: {
            idPresidente,
            melantios: cascada.presidente,
            usd: this._convertToUSD(cascada.presidente),
          },
        },
        costoTotal: {
          melantios: cascada.socio + cascada.padrino + cascada.presidente,
          usd: total_cost_usd,
        },
        vencimiento: new Date(
          Date.now() + 90 * 24 * 60 * 60 * 1000
        ).toISOString(), // 90 días
      };
    },

    validarVencimientoMelantios(fechaVencimiento) {
      const ahora = new Date();
      const vencimiento = new Date(fechaVencimiento);
      const diasRestantes = Math.floor(
        (vencimiento - ahora) / (1000 * 60 * 60 * 24)
      );

      return {
        expirado: diasRestantes < 0,
        proximoVencer: diasRestantes < 30 && diasRestantes >= 0,
        diasRestantes: Math.max(diasRestantes, 0),
        estado:
          diasRestantes < 0
            ? 'EXPIRADO'
            : diasRestantes < 30
              ? 'PROXIMOAVENCER'
              : 'VIGENTE',
      };
    },

    validarCanjeAl50(melantiosUsados, precioProducto) {
      // Valida que los Melantios no superen el 50% del precio
      const usdEquivalente = this._convertToUSD(melantiosUsados);
      const montoEnEfectivo = (
        precioProducto - parseFloat(usdEquivalente)
      ).toFixed(2);

      return {
        permitido: parseFloat(usdEquivalente) <= precioProducto * 0.5,
        melantiosUsados,
        equivalenciaUSD: usdEquivalente,
        precioProducto: precioProducto.toFixed(2),
        efectivoRequerido: montoEnEfectivo,
        porcentajeMelantios: ((usdEquivalente / precioProducto) * 100).toFixed(
          1
        ),
      };
    },

    // Finalizar validación del Padrino: libera los Melantios
    liberarMelantiosPorValidacionPadrino(idRecompensa, estado) {
      const recompensa = estado.lista_afiliados.find(
        (a) => a.id === idRecompensa
      );
      if (
        !recompensa ||
        recompensa.recompensa.estado !== 'PENDIENTE_VALIDACION_PADRINO'
      ) {
        return { error: 'Recompensa no encontrada o ya validada' };
      }

      recompensa.recompensa.estado = 'LIBERADO';
      recompensa.recompensa.fechaLiberacion = new Date().toISOString();

      return this._guardarEstado(estado);
    },

    _fechaLarga(fecha = new Date()) {
      return new Intl.DateTimeFormat('es-EC', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(new Date(fecha));
    },

    _generarNumeroOperacion(historial = []) {
      const consecutivo = String((historial?.length || 0) + 1).padStart(4, '0');
      const anio = new Date().getFullYear();
      return `ML-${anio}-${consecutivo}`;
    },

    _desgloseFondos(
      estado = this._estado(),
      resumen = this._resumenFinanciero(estado)
    ) {
      const activos = estado.lista_afiliados.filter(
        (item) => item.estado === 'activo'
      );
      const liderazgo = resumen.liderazgo;
      const metaBase = Number(liderazgo.metaGratis || 0);
      const sociosBase = liderazgo.esComunitario
        ? Math.min(liderazgo.activos, metaBase)
        : 0;
      const excedentes = liderazgo.esComunitario ? liderazgo.excedente : 0;
      const amigosGenerales = activos.filter((item) => {
        if (!liderazgo.esComunitario) return true;
        return (
          item.plan !== 'comunidad_basico' && item.plan !== 'comunidad_premium'
        );
      });
      const gananciaGenerales = amigosGenerales.reduce(
        (suma, item) => suma + Number(item.aporte || 0),
        0
      );
      return {
        sociosBase,
        metaBase,
        excedentes,
        gananciaExcedente: liderazgo.gananciaExpansion,
        amigosGenerales: amigosGenerales.length,
        gananciaGenerales,
        bruto: resumen.bruto,
      };
    },

    _mensajeMantenimiento(estado = this._estado()) {
      const alertas = estado.lista_afiliados.filter(
        (item) => item.estado === 'pendiente'
      );
      if (!alertas.length) {
        return 'Tu red se mantiene estable. Sigue acompanando a tus afiliados para que el acumulado no se detenga.';
      }
      return `Atencion: ${alertas.length} ${alertas.length === 1 ? 'afiliado esta por vencer' : 'afiliados estan por vencer'} su plan. Un recordatorio rapido por el Walkie-Talkie podria ayudar.`;
    },

    _mensajeCobroDisponible(
      estado = this._estado(),
      resumen = this._resumenFinanciero(estado)
    ) {
      if (resumen.bruto >= Number(estado.umbral_pago || 60)) {
        return `Presidente, buenas noticias. Ya superamos el monto minimo de ${this._moneda(estado.umbral_pago)}. Tienes ${this._moneda(resumen.neto)} netos listos para tu cuenta. ¿Quieres cobrarlos ahora o prefieres que sigan creciendo en tu boveda?`;
      }
      return 'Recuerda que mientras tus amigos y socios se mantengan activos, tu ganancia mensual seguira subiendo. No hay limite para lo que puedes acumular.';
    },

    _crearReciboCobro(estado, resumen) {
      const numeroOperacion = this._generarNumeroOperacion(
        estado.historial_pagos
      );
      const detalle = this._desgloseFondos(estado, resumen);
      return {
        numeroOperacion,
        fecha: new Date().toISOString(),
        beneficiario: {
          nombre: estado.usuario.nombre,
          pin: estado.usuario.pin_usuario,
          correo: estado.usuario.correo || 'Sin correo registrado',
          banco: estado.usuario.banco || 'Banco por confirmar',
          cuenta: estado.usuario.cuenta_destino || 'Cuenta por confirmar',
        },
        liquidacion: {
          ahorroPlan: resumen.ahorro,
          comisionesExcedente: detalle.gananciaExcedente,
          sociosExcedente: detalle.excedentes,
          comisionesGenerales: detalle.gananciaGenerales,
          amigosGenerales: detalle.amigosGenerales,
          bruto: resumen.bruto,
          impuestos: resumen.impuestos,
          neto: resumen.neto,
        },
        origenFondos: detalle,
        estadoTransferencia: {
          estado: 'Procesando',
          tiempoEstimado: '24 a 48 horas laborales',
          cuentaDestino: `${estado.usuario.banco || 'Banco por confirmar'} / ${estado.usuario.cuenta_destino || 'Cuenta por confirmar'}`,
        },
      };
    },

    _reciboHtml(recibo) {
      if (!recibo) return '<p>No hay recibo disponible.</p>';
      return `
        <div class="afiliados-recibo">
          <div class="afiliados-recibo-header">
            <div>
              <p class="afiliados-eyebrow">MELANTIA - Comprobante de Liquidacion de Comisiones</p>
              <h3>Numero de Operacion: #${this._escapeHtml(recibo.numeroOperacion)}</h3>
            </div>
            <span class="afiliados-recibo-sello">Aprobado</span>
          </div>
          <div class="afiliados-recibo-grid">
            <div>
              <strong>1. Datos del Beneficiario</strong>
              <p>Nombre: ${this._escapeHtml(recibo.beneficiario.nombre)}</p>
              <p>PIN de Referido: ${this._escapeHtml(recibo.beneficiario.pin)}</p>
              <p>Fecha de Solicitud: ${this._escapeHtml(this._fechaLarga(recibo.fecha))}</p>
              <p>Correo: ${this._escapeHtml(recibo.beneficiario.correo)}</p>
            </div>
            <div>
              <strong>4. Estado de la Transferencia</strong>
              <p>Estado: ${this._escapeHtml(recibo.estadoTransferencia.estado)}</p>
              <p>Tiempo estimado: ${this._escapeHtml(recibo.estadoTransferencia.tiempoEstimado)}</p>
              <p>Cuenta de Destino: ${this._escapeHtml(recibo.estadoTransferencia.cuentaDestino)}</p>
            </div>
          </div>
          <div class="afiliados-recibo-bloque">
            <strong>2. Detalle de la Liquidacion</strong>
            <p>Bono por Liderazgo (Plan Gratis): ${recibo.liquidacion.ahorroPlan > 0 ? `Aplicado. Ahorro de ${this._moneda(recibo.liquidacion.ahorroPlan)}` : 'Aun no aplicado en este periodo.'}</p>
            <p>Comisiones por Socios Excedentes: ${this._moneda(recibo.liquidacion.comisionesExcedente)} (${recibo.liquidacion.sociosExcedente} socios extra)</p>
            <p>Comisiones por Afiliados Generales: ${this._moneda(recibo.liquidacion.comisionesGenerales)} (${recibo.liquidacion.amigosGenerales} amigos)</p>
            <p><strong>Monto Total Bruto Acumulado: ${this._moneda(recibo.liquidacion.bruto)}</strong></p>
          </div>
          <div class="afiliados-recibo-bloque">
            <strong>3. Desglose Fiscal y Neto</strong>
            <p>Retencion de Impuestos (15%): -${this._moneda(recibo.liquidacion.impuestos).replace('$', '')}</p>
            <p><strong>Total Neto a Transferir: ${this._moneda(recibo.liquidacion.neto)}</strong></p>
          </div>
        </div>`;
    },

    verRecibo(numeroOperacion = null) {
      const estado = this._estado();
      const recibo = numeroOperacion
        ? estado.historial_pagos.find(
            (item) => item.numeroOperacion === numeroOperacion
          )
        : estado.historial_pagos[0];
      if (!recibo) return false;
      const panel = document.getElementById('panel-novedades');
      const vista = panel?.querySelector('[data-afiliados-recibo-detalle]');
      if (vista) {
        vista.innerHTML = this._reciboHtml(recibo);
        return true;
      }
      this.abrirPanel();
      return this.verRecibo(numeroOperacion);
    },

    descargarRecibo(numeroOperacion = null) {
      const estado = this._estado();
      const recibo = numeroOperacion
        ? estado.historial_pagos.find(
            (item) => item.numeroOperacion === numeroOperacion
          )
        : estado.historial_pagos[0];
      if (!recibo) return false;
      const ventana = window.open(
        '',
        '_blank',
        'noopener,noreferrer,width=900,height=760'
      );
      if (!ventana) return false;
      ventana.document.write(
        `<!DOCTYPE html><html><head><title>Recibo ${this._escapeHtml(recibo.numeroOperacion)}</title><style>body{font-family:Segoe UI,Arial,sans-serif;padding:24px;background:#fff8ef;color:#3b2a18}.recibo{max-width:900px;margin:0 auto;background:#fff;border:1px solid #ecd7bf;border-radius:20px;padding:24px}.recibo h1,.recibo h2,.recibo h3,.recibo p{margin:0 0 10px}.sello{display:inline-flex;padding:10px 16px;border-radius:999px;background:#d9f3df;color:#17643b;font-weight:800}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.bloque{margin-top:18px;padding:16px;border:1px solid #ecd7bf;border-radius:16px;background:#fffaf4}@media print{body{background:#fff;padding:0}.recibo{border:none;padding:0}}</style></head><body><div class="recibo">${this._reciboHtml(
          recibo
        )
          .replace(/class="afiliados-recibo"/g, '')
          .replace(/class="afiliados-recibo-header"/g, 'class="grid"')
          .replace(/class="afiliados-recibo-grid"/g, 'class="grid"')
          .replace(/class="afiliados-recibo-bloque"/g, 'class="bloque"')
          .replace(
            /class="afiliados-recibo-sello"/g,
            'class="sello"'
          )}</div><script>window.onload=function(){window.print();}</script></body></html>`
      );
      ventana.document.close();
      return true;
    },

    _asegurarDatosDemo() {
      if (window.localStorage?.getItem(this._datosDemoKey) === '1') return;
      const estado = this._estadoBase();
      estado.lista_afiliados = [
        {
          nombre: 'Juan',
          plan: 'basico',
          estado: 'activo',
          aporte: 2,
          desde: '2026-05-01',
        },
        {
          nombre: 'Maria',
          plan: 'standard',
          estado: 'activo',
          aporte: 4,
          desde: '2026-05-03',
        },
        {
          nombre: 'Pedro',
          plan: 'premium',
          estado: 'pendiente',
          aporte: 5,
          desde: '2026-05-04',
        },
        {
          nombre: 'Lucia',
          plan: 'profesional',
          estado: 'activo',
          aporte: 5,
          desde: '2026-05-05',
        },
        {
          nombre: 'Asociacion El Progreso',
          plan: 'comunidad_premium',
          estado: 'activo',
          aporte: 1,
          desde: '2026-05-06',
        },
      ];
      estado.acumulado_bruto = estado.lista_afiliados
        .filter((item) => item.estado === 'activo')
        .reduce((suma, item) => suma + Number(item.aporte || 0), 0);
      this._guardarEstado(estado);
      window.localStorage?.setItem(this._datosDemoKey, '1');
    },

    _activarAngel() {
      if (window.STAFF_MELANTIA?.activarAsistente) {
        window.STAFF_MELANTIA.activarAsistente('angel');
        return;
      }
      if (window.StaffController?.activarPersonaje) {
        window.StaffController.activarPersonaje('angel');
      }
    },

    _hablar(texto) {
      this._activarAngel();
      if (window.MelantiaVoz?.hablar) {
        window.MelantiaVoz.hablar(texto, 'angel');
      }
    },

    _escapeHtml(texto) {
      return String(texto || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    _planActual(estado = this._estado()) {
      return this.planes[estado.usuario.plan_actual] || this.planes.profesional;
    },

    obtenerCapacidadPreventiva(planId = null) {
      const plan = planId
        ? this.planes[planId] || this.planes.profesional
        : this._planActual();
      return plan.cupoPreventivo ?? 10;
    },

    obtenerResumenPreventivo(estado = this._estado()) {
      const plan = this._planActual(estado);
      const limite = this.obtenerCapacidadPreventiva(plan.id);
      const cupoTexto = Number.isFinite(limite)
        ? `${limite} registro(s)`
        : 'Ilimitado';
      return {
        planId: plan.id,
        planNombre: plan.nombre,
        limite,
        cupoTexto,
      };
    },

    _resumenLiderazgo(estado = this._estado()) {
      const plan = this._planActual(estado);
      const base = window.GestionPagos?.calcularBeneficioLiderazgo
        ? window.GestionPagos.calcularBeneficioLiderazgo(estado)
        : {
            planId: plan.id,
            plan,
            activos: estado.lista_afiliados.filter(
              (item) => item.estado === 'activo'
            ).length,
            metaGratis: Number(plan.metaGratis || 0),
            gratis: false,
            cuotaBase: Number(plan.precio || 0),
            cuotaFinal: Number(plan.precio || 0),
            faltanGratis: Number(plan.metaGratis || 0),
            excedente: 0,
            gananciaExpansion: 0,
            siguienteMeta: Number(plan.metaGratis || 0),
            faltanSiguienteNivel: Number(plan.metaGratis || 0),
          };
      const esComunitario =
        base.planId === 'comunidad_basico' ||
        base.planId === 'comunidad_premium';
      return {
        ...base,
        esComunitario,
        estadoMembresia: base.gratis
          ? 'Tu plan actual es GRATIS'
          : `Te faltan ${base.faltanGratis} socios para activar la gratuidad`,
        contadorTexto: esComunitario
          ? `Socio actual: ${base.activos}. Ganancia acumulada por excedente: ${this._moneda(base.gananciaExpansion)}.`
          : `Activos actuales: ${base.activos}. Ahorro logrado: ${this._moneda(base.cuotaBase - base.cuotaFinal)}.`,
        bonoExpansionTexto: base.gratis
          ? `Faltan ${base.faltanSiguienteNivel || 5} socios para tu proximo bloque de expansion.`
          : `Faltan ${base.faltanGratis} socios para desbloquear gratuidad y empezar tu ganancia directa.`,
      };
    },

    _resumenFinanciero(estado = this._estado()) {
      const bruto = Number(estado.acumulado_bruto || 0);
      const impuestos = bruto * 0.15;
      const activos = estado.lista_afiliados.filter(
        (item) => item.estado === 'activo'
      );
      const plan = this._planActual(estado);
      const liderazgo = this._resumenLiderazgo(estado);
      const cuota = liderazgo.cuotaFinal;
      const gratis = liderazgo.gratis;
      const ahorro = Math.max(liderazgo.cuotaBase - liderazgo.cuotaFinal, 0);
      const gananciaDirecta = liderazgo.gananciaExpansion;
      const neto = bruto - impuestos + gananciaDirecta;
      const faltantePago = Math.max(
        Number(estado.umbral_pago || 60) - bruto,
        0
      );
      const faltanGratis = liderazgo.faltanGratis;
      return {
        bruto,
        impuestos,
        neto,
        cuota,
        gratis,
        ahorro,
        beneficioTotal: neto + ahorro,
        faltantePago,
        faltanGratis,
        activos: activos.length,
        gananciaDirecta,
        excedenteComunitario: liderazgo.excedente,
        liderazgo,
      };
    },

    registrarAfiliado(planContratado, datos = {}) {
      const plan = this.planes[planContratado];
      if (!plan) return false;
      const estado = this._estado();
      estado.lista_afiliados.unshift({
        nombre: datos.nombre || `Amigo ${estado.lista_afiliados.length + 1}`,
        plan: plan.id,
        estado: datos.estado || 'activo',
        aporte: plan.aporteAfiliado,
        desde: new Date().toISOString().slice(0, 10),
      });
      estado.acumulado_bruto = estado.lista_afiliados
        .filter((item) => item.estado === 'activo')
        .reduce((suma, item) => suma + Number(item.aporte || 0), 0);
      estado.retiro_solicitado = false;
      this._guardarEstado(estado);
      this.actualizarUI();
      const resumen = this._resumenFinanciero(estado);
      if (resumen.bruto >= estado.umbral_pago) {
        this._hablar(
          'Felicidades. Ya alcanzaste los 60 dolares brutos y puedes solicitar tu transferencia de 51 dolares netos.'
        );
      } else {
        this._hablar(
          `Nuevo afiliado activo registrado. Tu boveda suma ${this._moneda(resumen.bruto)} brutos y te faltan ${this._moneda(resumen.faltantePago)} para retirar.`
        );
      }
      return true;
    },

    cambiarEstadoAfiliado(indice, nuevoEstado) {
      const estado = this._estado();
      if (!estado.lista_afiliados[indice]) return false;
      estado.lista_afiliados[indice].estado = nuevoEstado;
      estado.acumulado_bruto = estado.lista_afiliados
        .filter((item) => item.estado === 'activo')
        .reduce((suma, item) => suma + Number(item.aporte || 0), 0);
      this._guardarEstado(estado);
      this.actualizarUI();
      if (nuevoEstado !== 'activo') {
        this._hablar(
          'Atencion. Uno de tus afiliados ha dejado de aportar. Invita o reactiva a otro amigo para no perder tu bono.'
        );
      }
      return true;
    },

    solicitarTransferencia() {
      const estado = this._estado();
      const resumen = this._resumenFinanciero(estado);
      if (resumen.bruto < estado.umbral_pago) return false;
      const cuenta =
        `${estado.usuario.banco || 'Banco por confirmar'} ${estado.usuario.cuenta_destino || ''}`.trim();
      this._hablar(
        `Presidente, por favor confirma que tu cuenta bancaria ${cuenta} es correcta para enviarte ${this._moneda(resumen.neto)}.`
      );
      const confirmado = window.confirm(
        `Confirma tu cuenta bancaria ${cuenta} para enviarte ${this._moneda(resumen.neto)}.`
      );
      if (!confirmado) {
        this._hablar(
          'Cobro cancelado por ahora. Tu dinero seguira acumulandose en la boveda.'
        );
        return false;
      }
      const recibo = this._crearReciboCobro(estado, resumen);
      estado.retiro_solicitado = true;
      estado.historial_pagos.unshift({
        numeroOperacion: recibo.numeroOperacion,
        fecha: recibo.fecha,
        bruto: resumen.bruto,
        impuestos: resumen.impuestos,
        neto: resumen.neto,
        estado: 'Procesando',
        cuentaDestino: recibo.estadoTransferencia.cuentaDestino,
        recibo,
      });
      this._guardarEstado(estado);
      this.actualizarUI();
      this._hablar(
        'Solicitud registrada. Ya selle tu recibo digital y la transferencia quedo procesando entre 24 y 48 horas laborales.'
      );
      this.verRecibo(recibo.numeroOperacion);
      return true;
    },

    generarRanking(estado = this._estado()) {
      const base = [
        {
          nombre: estado.usuario.nombre,
          afiliados: estado.lista_afiliados.filter(
            (item) => item.estado === 'activo'
          ).length,
          distintivo: 'Padrino actual',
        },
        {
          nombre: 'Red Sierra Verde',
          afiliados: 34,
          distintivo: 'Padrino Oro',
        },
        {
          nombre: 'Cabildo Nuevo Amanecer',
          afiliados: 29,
          distintivo: 'Padrino Plata',
        },
      ];
      return base.sort((a, b) => b.afiliados - a.afiliados).slice(0, 3);
    },

    _moneda(valor) {
      return `$${Number(valor || 0).toFixed(2)}`;
    },

    _mensajeProgreso() {
      const estado = this._estado();
      const resumen = this._resumenFinanciero(estado);
      if (resumen.faltantePago <= 0) {
        return 'Disponible para cobro: ya puedes retirar ahora o seguir acumulando para un desembolso mayor.';
      }
      return `Faltan ${this._moneda(resumen.faltantePago)} para tu proximo retiro.`;
    },

    _mensajeAngel() {
      const estado = this._estado();
      const resumen = this._resumenFinanciero(estado);
      const plan = this._planActual(estado);
      const liderazgo = resumen.liderazgo;
      const faltan = Math.max(
        Math.ceil(resumen.faltantePago / Math.max(plan.aporteAfiliado, 1)),
        0
      );
      if (liderazgo.esComunitario && liderazgo.gratis) {
        return 'Felicidades, Presidente. Has superado el minimo de socios. Tu suscripcion de este mes es gratuita y ya estas generando dolares adicionales por los nuevos afiliados. Tu liderazgo esta fortaleciendo a la comunidad y a tu bolsillo.';
      }
      if (liderazgo.esComunitario) {
        return `Hola, soy Angel. Llevas ${liderazgo.activos} socios activos en ${plan.nombre}. Te faltan ${liderazgo.faltanGratis} para liberar tu mensualidad y activar la ganancia directa de $1 por cada nuevo socio excedente.`;
      }
      if (resumen.faltantePago <= 0) {
        return this._mensajeCobroDisponible(estado, resumen);
      }
      return `Hola, soy Angel. Tienes ${resumen.activos} amigos activos. Si sumas ${faltan} mas en ${plan.nombre}, desbloqueas tu pago mensual de 51 dolares. Vamos, tu puedes.`;
    },

    _resumenPlanes() {
      return Object.values(this.planes)
        .map(
          (plan) => `
            <article class="afiliados-plan-card">
              <div class="afiliados-plan-precio">${this._moneda(plan.precio)}</div>
              <h4>${this._escapeHtml(plan.nombre)}</h4>
              <p>${this._escapeHtml(plan.enfoque)}</p>
              <ul>${plan.accesos.map((item) => `<li>${this._escapeHtml(item)}</li>`).join('')}</ul>
              <small>Cupo preventivo: ${Number.isFinite(plan.cupoPreventivo) ? `${plan.cupoPreventivo} registro(s)` : 'Ilimitado'}</small>
              <small>${this._escapeHtml(plan.valorAgregado)}</small>
            </article>`
        )
        .join('');
    },

    _contenidoPanel() {
      const estado = this._estado();
      const resumen = this._resumenFinanciero(estado);
      const plan = this._planActual(estado);
      const progreso = Math.min(
        (resumen.bruto / Number(estado.umbral_pago || 60)) * 100,
        100
      );
      const ranking = this.generarRanking(estado);
      const preventivo = this.obtenerResumenPreventivo(estado);
      const liderazgo = resumen.liderazgo;
      const desglose = this._desgloseFondos(estado, resumen);
      const ultimoRecibo = estado.historial_pagos[0]?.recibo || null;
      return `
        <div class="afiliados-shell">
          <div class="afiliados-hero">
            <div>
              <p class="afiliados-eyebrow">Sistema de Afiliados MELANTIA</p>
              <h2>Tu red paga tu crecimiento</h2>
              <p>${this._escapeHtml(this._mensajeAngel())}</p>
              <p class="afiliados-legal-note">El Asistente Preventivo de Salud es una herramienta educativa y de registro. MELANTIA no presta servicios medicos; este modulo apoya la prevencion y la respuesta inicial basada en primeros auxilios.</p>
            </div>
            <div class="afiliados-pin-box">
              <span>Tu PIN maestro</span>
              <strong id="afiliados-pin-valor">${this._escapeHtml(estado.usuario.pin_usuario)}</strong>
              <div class="afiliados-mini-actions">
                <button type="button" onclick="SistemaAfiliados.copiarPin()">Copiar</button>
                <button type="button" onclick="SistemaAfiliados.compartirWhatsAppPin()">WhatsApp</button>
              </div>
            </div>
          </div>

          <div class="afiliados-tabs">
            <button type="button" class="afiliados-tab activo" data-afiliados-tab="boveda">Mi Boveda</button>
            <button type="button" class="afiliados-tab" data-afiliados-tab="red">Mi Red de Amigos</button>
            <button type="button" class="afiliados-tab" data-afiliados-tab="crecimiento">Herramientas de Crecimiento</button>
          </div>

          <section class="afiliados-tab-panel" data-afiliados-panel="boveda">
            <div class="afiliados-grid-2">
              <div class="afiliados-card fuerte afiliados-boveda-principal">
                <h3>Mi Boveda de Liderazgo</h3>
                <p>${this._escapeHtml(resumen.gratis ? 'Tu suscripcion esta cubierta por tu liderazgo este mes.' : 'Sigue creciendo tu red para cubrir tu suscripcion con liderazgo.')}</p>
                <div class="afiliados-boveda-estado ${resumen.gratis ? 'activo' : ''}">
                  <div>
                    <span>Estado de tu plan</span>
                    <strong>${this._escapeHtml(resumen.gratis ? 'GRATIS' : 'EN PROGRESO')}</strong>
                  </div>
                  <div>
                    <span>Ahorro del mes</span>
                    <strong>${this._moneda(resumen.ahorro)}</strong>
                  </div>
                  <div>
                    <span>Meta de red</span>
                    <strong>${liderazgo.activos} / ${liderazgo.metaGratis || 0} socios activos</strong>
                  </div>
                </div>
                <div class="afiliados-progress-track"><div class="afiliados-progress-fill" style="width:${progreso}%"></div></div>
                <div class="afiliados-kpis">
                  <div><span>Saldo bruto</span><strong id="monto_bruto">${this._moneda(resumen.bruto)}</strong></div>
                  <div><span>Retencion 15%</span><strong>-${this._moneda(resumen.impuestos).replace('$', '')}</strong></div>
                  <div><span>Saldo neto a cobrar</span><strong id="monto_neto">${this._moneda(resumen.neto)}</strong></div>
                  <div><span>Cupo preventivo</span><strong>${this._escapeHtml(preventivo.cupoTexto)}</strong></div>
                </div>
                <div class="afiliados-solicitud">
                  <div class="afiliados-termometro ${resumen.bruto >= estado.umbral_pago ? 'disponible' : ''}">
                    <div class="afiliados-termometro-top">
                      <strong>Termometro de Desembolso</strong>
                      <span>${this._moneda(estado.umbral_pago)}</span>
                    </div>
                    <p>${this._escapeHtml(this._mensajeProgreso())}</p>
                  </div>
                  <button type="button" id="btn_cobrar" ${resumen.bruto < estado.umbral_pago ? 'disabled' : ''} onclick="SistemaAfiliados.solicitarTransferencia()">Solicitar desembolso de ${this._moneda(resumen.neto)}</button>
                  <small>Puedes retirar ahora o seguir acumulando para un cobro mayor cuando lo necesites. El dinero no vence.</small>
                </div>
              </div>
              <div class="afiliados-card dorada ${resumen.gratis ? 'activa' : ''}">
                <h3>Escudo de Liderazgo</h3>
                <p>${liderazgo.estadoMembresia}</p>
                <div class="afiliados-liderazgo">
                  <div><span>Plan actual</span><strong>${this._escapeHtml(plan.nombre)}</strong></div>
                  <div><span>Ahorro por suscripcion</span><strong>${this._moneda(resumen.ahorro)}</strong></div>
                  <div><span>Ganancia neta afiliados</span><strong>${this._moneda(resumen.neto)}</strong></div>
                  <div><span>Ganancia directa</span><strong>${this._moneda(resumen.gananciaDirecta)}</strong></div>
                  <div><span>Beneficio total del mes</span><strong>${this._moneda(resumen.beneficioTotal)}</strong></div>
                </div>
              </div>
            </div>

            <div class="afiliados-grid-2">
              <div class="afiliados-card">
                <h3>Panel de Liderazgo</h3>
                <div class="afiliados-kpis compactos">
                  <div><span>Estado de membresia</span><strong>${this._escapeHtml(liderazgo.gratis ? 'GRATIS' : 'Aun no gratis')}</strong></div>
                  <div><span>Socios activos</span><strong>${liderazgo.activos}</strong></div>
                  <div><span>Ganancia por excedente</span><strong>${this._moneda(liderazgo.gananciaExpansion)}</strong></div>
                </div>
                <p>${this._escapeHtml(liderazgo.contadorTexto)}</p>
                <div class="afiliados-alerta">
                  <strong>Bono de expansion</strong>
                  <p>${this._escapeHtml(liderazgo.bonoExpansionTexto)}</p>
                </div>
                <div class="afiliados-alerta ${estado.lista_afiliados.some((item) => item.estado === 'pendiente') ? 'riesgo' : ''}">
                  <strong>Alerta de mantenimiento</strong>
                  <p>${this._escapeHtml(this._mensajeMantenimiento(estado))}</p>
                </div>
              </div>
              <div class="afiliados-card">
                <h3>Origen de Fondos</h3>
                <div class="afiliados-tabla-fondos">
                  <div class="afiliados-tabla-head"><span>Concepto</span><span>Cantidad</span><span>Ganancia</span></div>
                  <div><span>Socios Base (Minimo)</span><span>${desglose.sociosBase} / ${desglose.metaBase}</span><span>${resumen.gratis ? 'Plan Gratis' : 'En progreso'}</span></div>
                  <div><span>Nuevos Afiliados (Excedente)</span><span>+${desglose.excedentes} socios</span><span>${this._moneda(desglose.gananciaExcedente)}</span></div>
                  <div><span>Amigos Invitados (Otros Planes)</span><span>${desglose.amigosGenerales} amigos</span><span>${this._moneda(desglose.gananciaGenerales)}</span></div>
                  <div class="total"><span>Total Mensual Bruto</span><span>--</span><span>${this._moneda(desglose.bruto)}</span></div>
                </div>
              </div>
            </div>

            <div class="afiliados-grid-2">
              <div class="afiliados-card">
                <h3>Historial de pagos y recibos</h3>
                ${
                  estado.historial_pagos.length
                    ? `<ul class="afiliados-lista-simple">${estado.historial_pagos
                        .map(
                          (item) =>
                            `<li><strong>${this._escapeHtml(item.numeroOperacion || 'Sin numero')}</strong> · ${new Date(item.fecha).toLocaleDateString('es-EC')} · ${this._moneda(item.neto)} · ${this._escapeHtml(item.estado)}<div class="afiliados-mini-actions wrap"><button type="button" onclick="SistemaAfiliados.verRecibo('${this._escapeHtml(item.numeroOperacion || '')}')">Ver recibo</button><button type="button" onclick="SistemaAfiliados.descargarRecibo('${this._escapeHtml(item.numeroOperacion || '')}')">Imprimir / Guardar PDF</button></div></li>`
                        )
                        .join('')}</ul>`
                    : '<p>Aun no has solicitado retiros este mes.</p>'
                }
              </div>
              <div class="afiliados-card">
                <h3>Recibo de Solicitud de Cobro</h3>
                <div data-afiliados-recibo-detalle>${ultimoRecibo ? this._reciboHtml(ultimoRecibo) : '<p>Cuando solicites un desembolso, aqui aparecera tu comprobante digital con numero de operacion y desglose fiscal.</p>'}</div>
              </div>
            </div>

            <div class="afiliados-grid-2">
              <div class="afiliados-card">
                <h3>Ranking de lideres</h3>
                <ol class="afiliados-ranking">${ranking
                  .map(
                    (item) =>
                      `<li><strong>${this._escapeHtml(item.nombre)}</strong><span>${item.afiliados} afiliados</span><small>${this._escapeHtml(item.distintivo)}</small></li>`
                  )
                  .join('')}</ol>
              </div>
            </div>
          </section>

          <section class="afiliados-tab-panel" data-afiliados-panel="red" hidden>
            <div class="afiliados-grid-2">
              <div class="afiliados-card">
                <h3>Mi red de amigos</h3>
                <div class="afiliados-red-lista">${estado.lista_afiliados
                  .map(
                    (item, indice) => `
                      <article class="afiliados-red-item ${item.estado}">
                        <div>
                          <strong>${item.estado === 'activo' ? '✅' : item.estado === 'pendiente' ? '⚠️' : '⛔'} ${this._escapeHtml(item.nombre)}</strong>
                          <p>${this._escapeHtml((this.planes[item.plan] || {}).nombre || item.plan)} · ${item.estado === 'activo' ? `Aporta ${this._moneda(item.aporte)}` : item.estado === 'pendiente' ? 'Pago pendiente' : 'Desactivado'}</p>
                        </div>
                        <div class="afiliados-mini-actions">
                          <button type="button" onclick="SistemaAfiliados.enviarRecordatorioWhatsApp(${indice})">Recordar</button>
                          ${item.estado !== 'activo' ? `<button type="button" onclick="SistemaAfiliados.cambiarEstadoAfiliado(${indice}, 'activo')">Activar</button>` : `<button type="button" onclick="SistemaAfiliados.cambiarEstadoAfiliado(${indice}, 'pendiente')">Marcar pendiente</button>`}
                        </div>
                      </article>`
                  )
                  .join('')}</div>
              </div>
              <div class="afiliados-card">
                <h3>Panel de comunidad y organizaciones</h3>
                <p>Plan Comunidad Basico: minimo 30 socios. Plan Comunidad Premium: minimo 20 socios.</p>
                <div class="afiliados-kpis compactos">
                  <div><span>Padrino</span><strong>App gratis si hay quorum</strong></div>
                  <div><span>Premio por socio</span><strong>$1.00 mensual</strong></div>
                  <div><span>Asistente Preventivo Comunal</span><strong>${this._escapeHtml(preventivo.cupoTexto)}</strong></div>
                </div>
                <div class="afiliados-alerta">
                  <strong>Alerta preventiva de Angel</strong>
                  <p>${liderazgo.gratis ? 'Si se desactivan socios y caes por debajo del quorum, perderias la gratuidad y la ganancia directa del excedente. Mantente cerca de tu red.' : 'Aun no alcanzas el quorum que te da mensualidad gratis. Enfocate en activacion y acompanamiento.'}</p>
                </div>
                <div class="afiliados-alerta">
                  <strong>Cobertura activa del Asistente Preventivo</strong>
                  <p>Tu plan ${this._escapeHtml(preventivo.planNombre)} habilita ${this._escapeHtml(preventivo.cupoTexto)} dentro del modulo preventivo.</p>
                </div>
              </div>
            </div>
          </section>

          <section class="afiliados-tab-panel" data-afiliados-panel="crecimiento" hidden>
            <div class="afiliados-grid-2">
              <div class="afiliados-card">
                <h3>Herramientas de crecimiento</h3>
                <div class="afiliados-mini-actions wrap">
                  <button type="button" onclick="SistemaAfiliados.copiarPin()">Copiar PIN</button>
                  <button type="button" onclick="SistemaAfiliados.compartirWhatsAppPin()">Compartir WhatsApp</button>
                  <button type="button" onclick="SistemaAfiliados.registrarDemoRapida('basico')">Sumar Basico</button>
                  <button type="button" onclick="SistemaAfiliados.registrarDemoRapida('standard')">Sumar Standard</button>
                  <button type="button" onclick="SistemaAfiliados.registrarDemoRapida('premium')">Sumar Premium</button>
                  <button type="button" onclick="SistemaAfiliados.registrarDemoRapida('profesional')">Sumar Profesional</button>
                </div>
                <div class="afiliados-materiales">
                  ${estado.materiales
                    .map(
                      (item, indice) => `
                        <article class="afiliados-material-card">
                          <strong>${this._escapeHtml(item.titulo)}</strong>
                          <p>${this._escapeHtml(item.texto)}</p>
                          <button type="button" onclick="SistemaAfiliados.compartirMaterial(${indice})">Compartir</button>
                        </article>`
                    )
                    .join('')}
                </div>
              </div>
              <div class="afiliados-card planes">
                <h3>Matriz de beneficios por plan</h3>
                <div class="afiliados-planes-grid">${this._resumenPlanes()}</div>
              </div>
            </div>
          </section>

          <div class="afiliados-footer-note">
            <div>
              <strong>Intervenciones del equipo</strong>
              <p>Angel motiva la red, Dr. Pablo acompana planes comunitarios premium y Paulette recuerda los cupos del Asistente Preventivo de Salud para familias, comunidades y brigadas.</p>
            </div>
            <button type="button" onclick="document.getElementById('panel-novedades').style.display='none'">Cerrar</button>
          </div>
        </div>`;
    },

    abrirPanel() {
      this._asegurarEstilos();
      this._activarAngel();
      const panel = document.getElementById('panel-novedades');
      if (!panel) return false;
      panel.style.maxWidth = '1040px';
      panel.innerHTML = `<div class="novedad-card afiliados-wrapper" data-experto="Angel">${this._contenidoPanel()}</div>`;
      panel.style.display = 'block';
      this._enlazarTabs(panel);
      return true;
    },

    _enlazarTabs(scope) {
      scope.querySelectorAll('[data-afiliados-tab]').forEach((boton) => {
        boton.addEventListener('click', () => {
          const destino = boton.getAttribute('data-afiliados-tab');
          scope.querySelectorAll('[data-afiliados-tab]').forEach((item) => {
            item.classList.toggle('activo', item === boton);
          });
          scope.querySelectorAll('[data-afiliados-panel]').forEach((panel) => {
            panel.hidden =
              panel.getAttribute('data-afiliados-panel') !== destino;
          });
        });
      });
    },

    actualizarUI() {
      const panel = document.getElementById('panel-novedades');
      if (
        panel?.style.display === 'block' &&
        panel.querySelector('.afiliados-wrapper')
      ) {
        this.abrirPanel();
      }
      this.actualizarTarjetaMenu();
      return true;
    },

    iniciarTarjetaMenu() {
      const menu = document.getElementById('app-menu');
      if (!menu) return false;
      let card = menu.querySelector('[data-modulo="sistema-afiliados"]');
      if (!card) {
        card = document.createElement('article');
        card.className = 'card';
        card.dataset.modulo = 'sistema-afiliados';
        card.innerHTML = `
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap">
            <div>
              <h3 style="margin:0">Sistema de Afiliados</h3>
              <p style="margin:8px 0 0">Red de amigos, retiro mensual, liderazgo y acceso preventivo para familias, comunidades y brigadas.</p>
            </div>
            <span class="afiliados-card-chip">Angel</span>
          </div>
          <p data-afiliados-resumen>Cargando red...</p>
          <button type="button" style="margin-top:10px;background:#8a4b10;color:#fff;border:none;border-radius:10px;padding:10px 14px;cursor:pointer;font-weight:700">Abrir afiliados</button>`;
        menu.prepend(card);
        card.addEventListener('click', () => this.abrirPanel());
        card.querySelector('button')?.addEventListener('click', (event) => {
          event.stopPropagation();
          this.abrirPanel();
        });
      }
      this.actualizarTarjetaMenu();
      return true;
    },

    actualizarTarjetaMenu() {
      const card = document.querySelector('[data-modulo="sistema-afiliados"]');
      if (!card) return false;
      const resumen = this._resumenFinanciero();
      const plan = this._planActual();
      const objetivo =
        resumen.faltantePago <= 0
          ? 'Retiro listo'
          : `Faltan ${this._moneda(resumen.faltantePago)}`;
      const texto = `${resumen.activos} activo(s) • ${this._moneda(resumen.bruto)} bruto • ${objetivo} • ${resumen.gratis ? 'Mes gratis desbloqueado' : `Plan ${plan.nombre}`} • Excedente ${this._moneda(resumen.gananciaDirecta)}`;
      const nodo = card.querySelector('[data-afiliados-resumen]');
      if (nodo) nodo.textContent = texto;
      return true;
    },

    copiarPin() {
      const estado = this._estado();
      navigator.clipboard?.writeText(estado.usuario.pin_usuario);
      this._hablar(
        `Tu PIN maestro ${estado.usuario.pin_usuario} ya esta listo para compartir.`
      );
    },

    compartirWhatsAppPin() {
      const estado = this._estado();
      const mensaje = `Unete a mi red MELANTIA con mi PIN ${estado.usuario.pin_usuario}. Mejora tu finca, activa tus beneficios y ayuname a desbloquear mi retiro mensual.`;
      window.open(
        `https://wa.me/?text=${encodeURIComponent(mensaje)}`,
        '_blank',
        'noopener'
      );
    },

    enviarRecordatorioWhatsApp(indice) {
      const estado = this._estado();
      const afiliado = estado.lista_afiliados[indice];
      if (!afiliado) return false;
      const mensaje = `Hola ${afiliado.nombre}, tu activacion en MELANTIA sigue pendiente. Si activas tu plan ${this.planes[afiliado.plan]?.nombre || afiliado.plan}, mantenemos viva la red y los beneficios del grupo.`;
      window.open(
        `https://wa.me/?text=${encodeURIComponent(mensaje)}`,
        '_blank',
        'noopener'
      );
      return true;
    },

    compartirMaterial(indice) {
      const estado = this._estado();
      const material = estado.materiales[indice];
      if (!material) return false;
      window.open(
        `https://wa.me/?text=${encodeURIComponent(material.texto)}`,
        '_blank',
        'noopener'
      );
      return true;
    },

    registrarDemoRapida(planId) {
      return this.registrarAfiliado(planId, {
        nombre: `Invitado ${Math.floor(Math.random() * 900 + 100)}`,
        estado: 'activo',
      });
    },

    resumenVoz() {
      this._hablar(this._mensajeAngel());
      return true;
    },

    _asegurarEstilos() {
      if (document.getElementById(this._stylesId)) return;
      const style = document.createElement('style');
      style.id = this._stylesId;
      style.textContent = `
        .afiliados-wrapper{padding:0;background:transparent;box-shadow:none}
        .afiliados-shell{display:grid;gap:16px}
        .afiliados-hero{display:grid;grid-template-columns:1.6fr minmax(220px,320px);gap:16px;align-items:stretch;background:linear-gradient(135deg,#fff6eb 0%,#fff 100%);border:1px solid #f2d6b3;border-radius:22px;padding:18px}
        .afiliados-eyebrow{margin:0 0 8px;color:#9a611f;font-weight:800;letter-spacing:.4px;text-transform:uppercase;font-size:12px}
        .afiliados-legal-note{margin-top:10px;padding:10px 12px;background:#fff8ef;border:1px solid #f0d4ad;border-radius:14px;font-size:13px;color:#6b543b}
        .afiliados-hero h2{margin:0 0 8px;color:#6f3d09}
        .afiliados-hero p{margin:0;color:#614b37;line-height:1.5}
        .afiliados-pin-box{display:grid;gap:8px;background:#6f3d09;color:#fff;padding:16px;border-radius:18px;align-content:start}
        .afiliados-pin-box span{opacity:.8;font-size:12px;text-transform:uppercase;letter-spacing:.5px}
        .afiliados-pin-box strong{font-size:32px;letter-spacing:2px}
        .afiliados-mini-actions{display:flex;gap:8px;flex-wrap:wrap}
        .afiliados-mini-actions.wrap{margin-top:6px}
        .afiliados-mini-actions button,.afiliados-footer-note button,.afiliados-solicitud button,.afiliados-material-card button{border:none;border-radius:999px;padding:10px 14px;font-weight:700;cursor:pointer;background:#b56a12;color:#fff}
        .afiliados-tabs{display:flex;gap:8px;flex-wrap:wrap}
        .afiliados-tab{border:none;border-radius:999px;padding:10px 14px;font-weight:700;background:#f7e5cf;color:#7c4a10;cursor:pointer}
        .afiliados-tab.activo{background:#b56a12;color:#fff}
        .afiliados-grid-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
        .afiliados-card{display:grid;gap:12px;background:#fff;border:1px solid #efdfce;border-radius:18px;padding:16px}
        .afiliados-card h3,.afiliados-card h4{margin:0;color:#74430f}
        .afiliados-card p{margin:0;color:#5f5145;line-height:1.5}
        .afiliados-card.fuerte{background:linear-gradient(180deg,#fffdf8 0%,#fff 100%)}
        .afiliados-card.dorada{background:linear-gradient(180deg,#fff8e6 0%,#fff 100%);border-color:#f1d491}
        .afiliados-card.dorada.activa{box-shadow:0 10px 26px rgba(181,106,18,.12)}
        .afiliados-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
        .afiliados-kpis.compactos{grid-template-columns:repeat(3,minmax(0,1fr))}
        .afiliados-kpis div,.afiliados-liderazgo div{display:grid;gap:4px;padding:10px 12px;background:#fff8f0;border:1px solid #f4dfc6;border-radius:14px}
        .afiliados-kpis span,.afiliados-liderazgo span{font-size:12px;color:#8c6741}
        .afiliados-kpis strong,.afiliados-liderazgo strong{color:#6a3705}
        .afiliados-progress-track{height:16px;background:#f3e1ca;border-radius:999px;overflow:hidden}
        .afiliados-progress-fill{height:100%;background:linear-gradient(90deg,#e9a52c 0%,#c96f12 100%);border-radius:999px}
        .afiliados-boveda-principal{gap:14px;background:linear-gradient(180deg,#f7fff6 0%,#fff8eb 100%);border-color:#cfe4c6}
        .afiliados-boveda-estado{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;padding:14px;border:1px solid #d4e8c8;border-radius:16px;background:linear-gradient(135deg,#f3fff0 0%,#fff9ec 100%)}
        .afiliados-boveda-estado.activo{box-shadow:0 12px 30px rgba(54,120,52,.10)}
        .afiliados-boveda-estado div{display:grid;gap:4px;padding:10px 12px;background:#fff;border:1px solid #e1ecd9;border-radius:14px}
        .afiliados-boveda-estado span{font-size:12px;color:#5e7a47;text-transform:uppercase;letter-spacing:.4px}
        .afiliados-boveda-estado strong{color:#2b5d22;font-size:18px}
        .afiliados-termometro{display:grid;gap:6px;padding:12px;border-radius:16px;border:1px solid #e4d5c2;background:#fffaf4}
        .afiliados-termometro.disponible{border-color:#8ac0ff;background:linear-gradient(135deg,#eef7ff 0%,#fff 100%);box-shadow:0 10px 24px rgba(62,129,219,.10)}
        .afiliados-termometro-top{display:flex;justify-content:space-between;gap:12px;align-items:center;color:#654420}
        .afiliados-tabla-fondos{display:grid;gap:8px}
        .afiliados-tabla-fondos>div{display:grid;grid-template-columns:2fr 1fr 1fr;gap:10px;align-items:center;padding:10px 12px;border:1px solid #efdfce;border-radius:14px;background:#fffaf4;color:#5f5145}
        .afiliados-tabla-fondos .afiliados-tabla-head{background:#f8ead7;font-weight:800;color:#7a4b15}
        .afiliados-tabla-fondos .total{background:#fff2da;font-weight:800;color:#6f3d09}
        .afiliados-alerta.riesgo{background:#fff1ec;border-color:#efb4a2}
        .afiliados-recibo{display:grid;gap:14px;padding:16px;border-radius:18px;background:linear-gradient(180deg,#fffdfa 0%,#fff4e8 100%);border:1px solid #ecd7bf}
        .afiliados-recibo-header{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}
        .afiliados-recibo-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
        .afiliados-recibo-bloque{display:grid;gap:6px;padding:12px;border-radius:16px;border:1px solid #ead7c0;background:#fff}
        .afiliados-recibo-sello{display:inline-flex;align-items:center;justify-content:center;padding:10px 14px;border-radius:999px;background:#dff4e0;color:#1d7240;font-weight:800;animation:afiliados-sello .45s ease-out both}
        @keyframes afiliados-sello{0%{transform:scale(.6) rotate(-8deg);opacity:0}100%{transform:scale(1) rotate(0);opacity:1}}
        .afiliados-solicitud{display:grid;gap:6px}
        .afiliados-solicitud button[disabled]{opacity:.5;cursor:not-allowed}
        .afiliados-solicitud small{color:#826c57}
        .afiliados-lista-simple,.afiliados-ranking{margin:0;padding-left:18px;color:#5e5043}
        .afiliados-ranking li{display:grid;gap:2px;margin-bottom:10px}
        .afiliados-ranking span,.afiliados-ranking small{color:#846a4a}
        .afiliados-red-lista{display:grid;gap:10px}
        .afiliados-red-item{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap;padding:12px;border-radius:16px;border:1px solid #eddcc5;background:#fffaf4}
        .afiliados-red-item.activo{border-left:5px solid #1f8a4c}
        .afiliados-red-item.pendiente{border-left:5px solid #e39b1d}
        .afiliados-red-item.desactivado{border-left:5px solid #b33a2b}
        .afiliados-red-item p{margin:4px 0 0}
        .afiliados-alerta{display:grid;gap:6px;background:#fff3db;border:1px solid #f0cd8b;border-radius:14px;padding:12px}
        .afiliados-materiales,.afiliados-planes-grid{display:grid;gap:10px}
        .afiliados-material-card,.afiliados-plan-card{display:grid;gap:8px;background:#fffaf4;border:1px solid #efdfce;border-radius:16px;padding:14px}
        .afiliados-plan-precio{display:inline-flex;align-items:center;justify-content:center;min-width:82px;padding:6px 10px;border-radius:999px;background:#b56a12;color:#fff;font-weight:800}
        .afiliados-plan-card ul{margin:0;padding-left:18px;color:#5f5145}
        .afiliados-plan-card small{color:#856b4b}
        .afiliados-footer-note{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap;background:#fff7ef;border:1px solid #eedbc6;border-radius:18px;padding:14px}
        .afiliados-footer-note p{margin:6px 0 0;color:#5e5043;max-width:720px}
        .afiliados-card-chip{display:inline-flex;align-items:center;padding:6px 10px;background:#fff1dc;color:#8b4f12;border-radius:999px;font-size:12px;font-weight:800}
        @media (max-width:820px){.afiliados-hero,.afiliados-grid-2,.afiliados-kpis,.afiliados-kpis.compactos,.afiliados-boveda-estado,.afiliados-recibo-grid{grid-template-columns:1fr}.afiliados-pin-box strong{font-size:26px}.afiliados-tabla-fondos>div{grid-template-columns:1fr}}
      `;
      document.head.appendChild(style);
    },
  };

  const ComandosAngel = {
    procesar(comandoOriginal) {
      const comando = SistemaAfiliados._normalizar(comandoOriginal);
      if (!comando || !comando.includes('angel')) return false;

      if (
        comando.includes('afiliados') ||
        comando.includes('referidos') ||
        comando.includes('mi red') ||
        comando.includes('boveda')
      ) {
        SistemaAfiliados.abrirPanel();
        SistemaAfiliados.resumenVoz();
        return true;
      }

      if (
        comando.includes('pin') ||
        comando.includes('compartir') ||
        comando.includes('whatsapp')
      ) {
        SistemaAfiliados.abrirPanel();
        SistemaAfiliados.compartirWhatsAppPin();
        return true;
      }

      if (
        comando.includes('pago') ||
        comando.includes('retiro') ||
        comando.includes('transferencia')
      ) {
        SistemaAfiliados.abrirPanel();
        SistemaAfiliados.resumenVoz();
        return true;
      }

      if (
        comando.includes('ranking') ||
        comando.includes('lideres') ||
        comando.includes('liderazgo')
      ) {
        SistemaAfiliados.abrirPanel();
        SistemaAfiliados._hablar(
          'Ya tengo listo el ranking de lideres y tu escudo de liderazgo para este mes.'
        );
        return true;
      }

      return false;
    },
  };

  window.SistemaAfiliados = SistemaAfiliados;
  window.ComandosAngel = ComandosAngel;

  document.addEventListener('DOMContentLoaded', () => {
    SistemaAfiliados.init();
  });
})();
