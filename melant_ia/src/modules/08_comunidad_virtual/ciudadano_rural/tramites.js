// Trámites y guías legales — Voz Dr. Pablo
export const TramitesCiudadanoRural = {
  obtenerRequisitosCreditoBanEcuador() {
    return [
      'Copia de cédula y papeleta de votación',
      'Certificado de Productor (fotos de evidencia)',
      'Plan de inversión detallado',
      'Récord de sede/productivo',
      'Certificado de no adeudar al SRI/IESS',
      'Estatutos y acta constitutiva (si es asociación)',
      'Otros documentos según el tipo de crédito',
    ];
  },
  armarCarpetaCredito(usuario) {
    const requisitos = this.obtenerRequisitosCreditoBanEcuador();
    if (window.hablarDrPablo)
      window.hablarDrPablo(
        `Estimado ${usuario}, estos son los requisitos legales para BanEcuador.`
      );
    return {
      mensaje: `Estimado ${usuario}, estos son los requisitos legales para BanEcuador.`,
      requisitos,
    };
  },
  obtenerGuiaAgrocalidad() {
    if (window.hablarDrPablo)
      window.hablarDrPablo('Guía legal de Agrocalidad disponible.');
    return [
      'Registro de predio y productor',
      'Certificación de Buenas Prácticas Agrícolas (BPA)',
      'Certificado fitosanitario para exportación',
      'Guía de movilización de productos',
      'Otros trámites según el rubro',
    ];
  },
  obtenerGuiaOrganizaciones() {
    if (window.hablarDrPablo)
      window.hablarDrPablo('Guía legal para organizaciones y comunas.');
    return [
      'Acta constitutiva',
      'Estatutos',
      'Lista de socios',
      'Registro en MAG o MIES',
      'Nombramiento de directiva',
      'RUC y documentos legales complementarios',
    ];
  },
  obtenerRequisitosGuiaTrasladoMadera() {
    if (window.hablarDrPablo)
      window.hablarDrPablo('Requisitos legales para traslado de madera.');
    return [
      'Permiso de aprovechamiento forestal vigente',
      'Guía de movilización emitida por el MAATE',
      'Factura de compra o documento que acredite la legalidad de la madera',
      'Certificado de origen de la madera',
      'Cumplimiento de normativas de transporte y trazabilidad',
      'Otros requisitos según la especie y destino',
    ];
  },
};
