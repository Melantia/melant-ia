      // Mostrar requisitos para solicitar créditos BanEcuador
      obtenerRequisitosCreditoBanEcuador() {
        return [
          'Copia de cédula y papeleta de votación',
          'Certificado de Productor (fotos de evidencia)',
          'Plan de inversión detallado',
          'Récord de sede/productivo',
          'Certificado de no adeudar al SRI/IESS',
          'Estatutos y acta constitutiva (si es asociación)',
          'Otros documentos según el tipo de crédito'
        ];
      }

      // Don Eloy ayuda a armar la carpeta de crédito
      armarCarpetaCredito(usuario) {
        const requisitos = this.obtenerRequisitosCreditoBanEcuador();
        return {
          mensaje: `Hola ${usuario}, soy Don Eloy y te ayudo a armar tu carpeta para BanEcuador. Asegúrate de tener:`,
          requisitos
        };
      }

      // Guía de Agrocalidad para trámites y certificaciones
      obtenerGuiaAgrocalidad() {
        return [
          'Registro de predio y productor',
          'Certificación de Buenas Prácticas Agrícolas (BPA)',
          'Certificado fitosanitario para exportación',
          'Guía de movilización de productos',
          'Otros trámites según el rubro'
        ];
      }

      // Asesor Legal guía en documentación para organizaciones/comunas
      obtenerGuiaOrganizaciones() {
        return [
          'Acta constitutiva',
          'Estatutos',
          'Lista de socios',
          'Registro en MAG o MIES',
          'Nombramiento de directiva',
          'RUC y documentos legales complementarios'
        ];
      }
    // Método para obtener noticias oficiales de programas y beneficios
    async actualizarNoticiasProgramas() {
      // Ejemplo: consulta a una API pública de noticias del MAG, MIES, MIDUVI, BanEcuador, etc.
      // Debes adaptar la URL y el parseo según la fuente real
      try {
        const resp = await fetch('https://api.ejemplo.gob.ec/noticias/programas-rurales');
        const data = await resp.json();
        if (Array.isArray(data.noticias)) {
          data.noticias.forEach(n => this.agregarNoticia(n.titulo, n.contenido, n.fecha));
        }
        return data;
      } catch (e) {
        return null;
      }
    }
  // Métodos para obtener precios oficiales desde fuentes públicas
  async actualizarPreciosCacao() {
    // Ejemplo: MAGAP publica precios en https://www.agrocalidad.gob.ec/ o https://www.mag.gob.ec/
    // Aquí se simula el fetch, debes adaptar la URL y el parseo según la fuente real
    try {
      const resp = await fetch('https://api.ejemplo.gob.ec/precios/cacao');
      const data = await resp.json();
      this.setPrecioCacao(data.tonelada, data.quintal, data.fecha);
      return data;
    } catch (e) {
      return null;
    }
  }

  async actualizarPreciosCafe() {
    try {
      const resp = await fetch('https://api.ejemplo.gob.ec/precios/cafe');
      const data = await resp.json();
      this.setPrecioCafe(data.quintal, data.fecha);
      return data;
    } catch (e) {
      return null;
    }
  }

  async actualizarPreciosPlatano() {
    try {
      const resp = await fetch('https://api.ejemplo.gob.ec/precios/platano');
      const data = await resp.json();
      this.setPrecioPlatano(data.caja_exportacion, data.caja_rechazo, data.semana);
      return data;
    } catch (e) {
      return null;
    }
  }
// Módulo Ciudadano Rural — Noticias y Precios Agrícolas
// Permite mostrar noticias y precios actualizados de cacao, café y plátano

export class CiudadanoRural {
  constructor() {
    this.noticias = [];
    this.precios = {
      cacao: { tonelada: null, quintal: null, fecha: null },
      cafe: { quintal: null, fecha: null },
      platano: {
        caja_exportacion: null,
        caja_rechazo: null,
        semana: null
      },
      ganaderia: {
        bovino: { precio_kg: null, precio_cabeza: null, fecha: null },
        porcino: { precio_kg: null, precio_cabeza: null, fecha: null },
        caballos: { precio_kg: null, precio_cabeza: null, fecha: null }
      },
      maderas: {
        balsa: { precio_m3: null, fecha: null },
        teca: { precio_m3: null, fecha: null },
        gmelina: { precio_m3: null, fecha: null },
        otras: [] // [{nombre, precio_m3, fecha}]
      }
    };
      setPrecioMadera(tipo, precio_m3, fecha = new Date()) {
        if (this.precios.maderas[tipo] !== undefined) {
          this.precios.maderas[tipo] = { precio_m3, fecha };
        } else {
          this.precios.maderas.otras.push({ nombre: tipo, precio_m3, fecha });
        }
      }

      async actualizarPreciosMaderas() {
        // Simulación: debes adaptar la URL y el parseo según la fuente real
        try {
          const resp = await fetch('https://api.ejemplo.gob.ec/precios/maderas');
          const data = await resp.json();
          if (data.balsa) this.setPrecioMadera('balsa', data.balsa.precio_m3, data.balsa.fecha);
          if (data.teca) this.setPrecioMadera('teca', data.teca.precio_m3, data.teca.fecha);
          if (data.gmelina) this.setPrecioMadera('gmelina', data.gmelina.precio_m3, data.gmelina.fecha);
          if (Array.isArray(data.otras)) {
            data.otras.forEach(m => this.setPrecioMadera(m.nombre, m.precio_m3, m.fecha));
          }
          return data;
        } catch (e) {
          return null;
        }
      }

      // Requisitos ambientales para guías de traslado de madera
      obtenerRequisitosGuiaTrasladoMadera() {
        return [
          'Permiso de aprovechamiento forestal vigente',
          'Guía de movilización emitida por el MAATE (Ministerio del Ambiente, Agua y Transición Ecológica)',
          'Factura de compra o documento que acredite la legalidad de la madera',
          'Certificado de origen de la madera',
          'Cumplimiento de normativas de transporte y trazabilidad',
          'Otros requisitos según la especie y destino'
        ];
      }
    setPrecioGanaderia(tipo, precio_kg, precio_cabeza, fecha = new Date()) {
      if (this.precios.ganaderia[tipo]) {
        this.precios.ganaderia[tipo] = { precio_kg, precio_cabeza, fecha };
      }
    }

    async actualizarPreciosGanaderia() {
      // Simulación: debes adaptar la URL y el parseo según la fuente real
      try {
        const resp = await fetch('https://api.ejemplo.gob.ec/precios/ganaderia');
        const data = await resp.json();
        if (data.bovino) this.setPrecioGanaderia('bovino', data.bovino.precio_kg, data.bovino.precio_cabeza, data.bovino.fecha);
        if (data.porcino) this.setPrecioGanaderia('porcino', data.porcino.precio_kg, data.porcino.precio_cabeza, data.porcino.fecha);
        if (data.caballos) this.setPrecioGanaderia('caballos', data.caballos.precio_kg, data.caballos.precio_cabeza, data.caballos.fecha);
        return data;
      } catch (e) {
        return null;
      }
    }
  }

  agregarNoticia(titulo, contenido, fecha = new Date()) {
    this.noticias.unshift({ titulo, contenido, fecha });
    if (this.noticias.length > 20) this.noticias = this.noticias.slice(0, 20);
  }

  setPrecioCacao(tonelada, quintal, fecha = new Date()) {
    this.precios.cacao = { tonelada, quintal, fecha };
  }

  setPrecioCafe(quintal, fecha = new Date()) {
    this.precios.cafe = { quintal, fecha };
  }

  setPrecioPlatano(caja_exportacion, caja_rechazo, semana) {
    this.precios.platano = { caja_exportacion, caja_rechazo, semana };
  }

  obtenerNoticias() {
    return this.noticias;
  }

  obtenerPrecios() {
    return this.precios;
  }
}
