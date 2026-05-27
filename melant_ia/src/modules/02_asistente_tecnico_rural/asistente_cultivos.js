// asistente_cultivos.js
// Adaptación JS del módulo Python asistente_cultivos.py para integración web

export class AsistenteCultivosIA {
  constructor() {
    this.ruta_gps = '02_BIBLIOTECA/gps_agro';
    this.ruta_conocimiento = '02_BIBLIOTECA/cultivos_varios';
  }

  iniciarMonitoreoLote(loteId, coordenadas, cultivo) {
    // 1. Registrar posición (Agricultura de Precisión)
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.]/g, '')
      .slice(0, 15);
    const logGps = {
      lote: loteId,
      posicion: coordenadas, // Ej: {lat: -1.023, lon: -79.456}
      cultivo: cultivo,
      fecha: timestamp,
    };
    // Simulación: guardar en localStorage (en web no hay acceso a archivos locales)
    const key = `${this.ruta_gps}/lote_${loteId}_${timestamp}`;
    localStorage.setItem(key, JSON.stringify(logGps));
    // 2. Cargar conocimiento proactivo (Inferencia)
    return this.obtenerInstruccionesProactivas(cultivo);
  }

  obtenerInstruccionesProactivas(cultivo) {
    // Simulación: lógica simple para cacao
    if ((cultivo || '').toLowerCase().includes('cacao')) {
      return {
        ia_dice: 'He registrado las coordenadas de este lote de Cacao.',
        accion_precision:
          'Según la bioclimatología actual, toca abonado potásico.',
        manual_recomendado: '02_BIBLIOTECA/cacao/guia_nutricion.pdf',
      };
    }
    return { ia_dice: 'Lote registrado correctamente.' };
  }

  static getVoiceSummary() {
    return (
      'Módulo de Cultivos activo. ' +
      'Puedo monitorear lotes con GPS, vincular cada parcela con su cultivo, ' +
      'y dar instrucciones proactivas según la etapa de crecimiento. ' +
      'Dime el nombre del lote o cultivo para comenzar.'
    );
  }
}
