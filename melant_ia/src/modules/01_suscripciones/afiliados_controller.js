import PLANES from './planes_beneficios.js';
import { moneda, escapeHtml, fechaLarga } from './utils.js';
import { reciboHtml } from './contenido_panel_html.js';
import {
  registrarAfiliado,
  cambiarEstadoAfiliado,
  solicitarTransferencia,
} from './negocio_afiliados.js';
import { normalizarEstado } from './helpers_estado.js';
import {
  agregarASyncQueue,
  procesarSyncQueue,
  inicializarSyncQueue,
} from './utils_sync.js';
import {
  cargarConfigMelantios,
  convertToUSD,
  convertFromUSD,
  ganarMelantioCascada,
  validarVencimientoMelantios,
  validarCanjeAl50,
  liberarMelantiosPorValidacionPadrino,
} from '../04_negocios_rurales/economia_melantia.js';
(function () {
  'use strict';

  const SistemaAfiliados = {
    _storageKey: 'melantia_afiliados_estado',
    _stylesId: 'melantia-afiliados-css',
    _datosDemoKey: 'melantia_afiliados_demo_cargado',
    // PLANES DE SUSCRIPCIÓN (importados)
    get planes() {
      return PLANES;
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
        return normalizarEstado(this._estadoBase, guardado);
      } catch {
        return this._estadoBase();
      }
    },

    _guardarEstado(estado) {
      window.localStorage?.setItem(this._storageKey, JSON.stringify(estado));
      return estado;
    },

    // Funciones de economía Melantios importadas
    cargarConfigMelantios,
    convertToUSD,
    convertFromUSD,
    ganarMelantioCascada,
    validarVencimientoMelantios,
    validarCanjeAl50,
    liberarMelantiosPorValidacionPadrino,

    // Finalizar validación del Padrino: libera los Melantios

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
        return `Presidente, buenas noticias. Ya superamos el monto minimo de ${moneda(estado.umbral_pago)}. Tienes ${moneda(resumen.neto)} netos listos para tu cuenta. ¿Quieres cobrarlos ahora o prefieres que sigan creciendo en tu boveda?`;
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

    // ...

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
        vista.innerHTML = reciboHtml(recibo);
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
        `<!DOCTYPE html><html><head><title>Recibo ${escapeHtml(recibo.numeroOperacion)}</title><style>body{font-family:Segoe UI,Arial,sans-serif;padding:24px;background:#fff8ef;color:#3b2a18}.recibo{max-width:900px;margin:0 auto;background:#fff;border:1px solid #ecd7bf;border-radius:20px;padding:24px}.recibo h1,.recibo h2,.recibo h3,.recibo p{margin:0 0 10px}.sello{display:inline-flex;padding:10px 16px;border-radius:999px;background:#d9f3df;color:#17643b;font-weight:800}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.bloque{margin-top:18px;padding:16px;border:1px solid #ecd7bf;border-radius:16px;background:#fffaf4}@media print{body{background:#fff;padding:0}.recibo{border:none;padding:0}}</style></head><body><div class="recibo">${reciboHtml(
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
          ? `Socio actual: ${base.activos}. Ganancia acumulada por excedente: ${moneda(base.gananciaExpansion)}.`
          : `Activos actuales: ${base.activos}. Ahorro logrado: ${moneda(base.cuotaBase - base.cuotaFinal)}.`,
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

    _mensajeProgreso() {
      const estado = this._estado();
      const resumen = this._resumenFinanciero(estado);
      if (resumen.faltantePago <= 0) {
        return 'Disponible para cobro: ya puedes retirar ahora o seguir acumulando para un desembolso mayor.';
      }
      return `Faltan ${moneda(resumen.faltantePago)} para tu proximo retiro.`;
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
              <div class="afiliados-plan-precio">${moneda(plan.precio)}</div>
              <h4>${escapeHtml(plan.nombre)}</h4>
              <p>${escapeHtml(plan.enfoque)}</p>
              <ul>${plan.accesos.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
              <small>Cupo preventivo: ${Number.isFinite(plan.cupoPreventivo) ? `${plan.cupoPreventivo} registro(s)` : 'Ilimitado'}</small>
              <small>${escapeHtml(plan.valorAgregado)}</small>
            </article>`
        )
        .join('');
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
          : `Faltan ${moneda(resumen.faltantePago)}`;
      const texto = `${resumen.activos} activo(s) • ${moneda(resumen.bruto)} bruto • ${objetivo} • ${resumen.gratis ? 'Mes gratis desbloqueado' : `Plan ${plan.nombre}`} • Excedente ${moneda(resumen.gananciaDirecta)}`;
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

    // Los estilos ahora están en afiliados_controller.css. Importa ese archivo en tu HTML para mejor rendimiento móvil.
    _asegurarEstilos() {
      // No hace nada: el CSS es externo.
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
