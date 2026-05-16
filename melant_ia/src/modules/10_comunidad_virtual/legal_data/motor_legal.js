const fs = require('fs');

class AsesorLegalMelant {
  constructor() {
    // Cargamos los datos que ya tienes en DATABASE
    this.protocolos = JSON.parse(
      fs.readFileSync('./src/database/cerebro_auxilio_penal.json', 'utf8')
    );
    this.tramites = JSON.parse(
      fs.readFileSync('./src/database/legal_gobierno.json', 'utf8')
    );
  }

  // PASO 1: Identificar el problema
  identificarCaso(inputUsuario) {
    const texto = inputUsuario.toLowerCase();

    if (texto.includes('amenaza') || texto.includes('miedo'))
      return 'RUTA_C_PREVENTIVA';
    if (texto.includes('robo') || texto.includes('quitaron'))
      return 'RUTA_B_INVESTIGACION';
    if (texto.includes('violencia') || texto.includes('golpe'))
      return 'RUTA_A_INMEDIATA';

    return null;
  }

  // PASO 2: Iniciar la "Entrevista" para llenar el formato
  generarEntrevista(rutaId) {
    const preguntasBase = [
      '¿Cuál es tu nombre completo?',
      'Número de cédula:',
      '¿En qué lugar exacto ocurrieron los hechos? (El GPS puede ayudar)',
      'Describe detalladamente lo que sucedió:',
    ];
    return preguntasBase;
  }

  // PASO 3: Construir el documento final
  ensamblarDocumento(
    plantilla,
    datosUsuario,
    datosGps = null,
    selloGps = null
  ) {
    let documento = plantilla;
    // Reemplazo de etiquetas de usuario
    Object.keys(datosUsuario).forEach((llave) => {
      documento = documento.replace(`[${llave}]`, datosUsuario[llave]);
    });
    // Si hay datos GPS y sello, integrar el bloque GPS
    if (datosGps && selloGps) {
      // Importar la función si no está ya disponible
      const { integrarUbicacionGps } = require('./gps_legal_integrator');
      documento = integrarUbicacionGps(documento, datosGps, selloGps);
    }
    return documento;
  }
}
