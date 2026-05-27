// Asesor Legal MELANTIA — Dr. Pablo
// Orquesta la experiencia legal: voz, formularios, QR, GPS, evidencia, seguridad
import {
  identificarCaso,
  generarEntrevista,
  ensamblarDocumento,
} from './motor_legal.js';
import { integrarUbicacionGps } from './gps_legal_integrator.js';
import { formularios_entrevista } from '../../../knowledge_seeds/08_comunidad_virtual/legal_data/entrevistas_legales.js';
import { encryptData, securityLayer } from './security_handler.js';
import guiaProcesos from '../../../knowledge_seeds/08_comunidad_virtual/legal_data/guia_procesos_legales.json';
import tramitesGob from '../../../knowledge_seeds/08_comunidad_virtual/legal_data/tramites_instituciones_gobierno.json';

// Utilidad para generar QR
function generarQR(texto, contenedorId = 'qr-legal') {
  if (!window.QRCode) return;
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  cont.innerHTML = '';
  new window.QRCode(cont, { text: texto, width: 180, height: 180 });
}

export const AsesorLegal = {
  async iniciarAsesoriaLegal() {
    // Paso 1: Consulta inicial
    if (window.hablarDrPablo)
      window.hablarDrPablo('Describe brevemente tu caso o solicitud legal.');
    const consulta = await this._inputUsuario('Describe tu caso o trámite:');
    const caso = identificarCaso(consulta);
    if (!caso) {
      if (window.hablarDrPablo)
        window.hablarDrPablo(
          'No pude identificar el tipo de trámite. Por favor, selecciona uno de la lista.'
        );
      return this.seleccionarTramite();
    }
    return this.procesarCaso(caso);
  },

  async seleccionarTramite() {
    // Mostrar lista de trámites sencillos
    const lista = Object.keys(formularios_entrevista);
    const tramite = await this._inputUsuario(
      'Selecciona trámite: ' + lista.join(', ')
    );
    if (!formularios_entrevista[tramite]) return;
    return this.procesarCaso(tramite);
  },

  async procesarCaso(caso) {
    // Paso 2: Entrevista guiada
    const preguntas = formularios_entrevista[caso] || generarEntrevista(caso);
    const respuestas = {};
    for (const p of preguntas) {
      if (window.hablarDrPablo) window.hablarDrPablo(p.pregunta || p);
      respuestas[p.id || p] = await this._inputUsuario(p.pregunta || p);
    }
    // Paso 3: Integrar GPS si aplica
    let datosGps = null,
      selloGps = null;
    if (navigator.geolocation) {
      await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            datosGps = {
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
              parroquia: 'Desconocida',
              precision: pos.coords.accuracy + 'm',
            };
            selloGps = {
              titulo: 'DATOS DE UBICACIÓN CERTIFICADOS',
              campos: [
                'Latitud',
                'Longitud',
                'Referencia',
                'Precisión del sensor',
              ],
            };
            resolve();
          },
          resolve,
          { timeout: 5000 }
        );
      });
    }
    // Paso 4: Ensamblar documento
    const plantilla = this._obtenerPlantilla(caso);
    let documento = ensamblarDocumento(
      plantilla,
      respuestas,
      datosGps,
      selloGps
    );
    // Paso 5: Seguridad y QR
    const docCifrado = encryptData ? encryptData(documento) : documento;
    this._guardarDocumento(docCifrado, caso);
    this._mostrarQR(docCifrado);
    if (window.hablarDrPablo)
      window.hablarDrPablo(
        'Documento generado y QR listo para imprimir o compartir.'
      );
  },

  _obtenerPlantilla(caso) {
    // Buscar plantilla en tramitesGob o guiaProcesos
    const formato = (tramitesGob.formatos_legales || []).find(
      (f) =>
        f.id === caso || f.nombre?.toLowerCase().includes(caso.toLowerCase())
    );
    if (formato) {
      let plantilla = `FORMATO: ${formato.nombre}\n`;
      for (const campo of formato.campos_necesarios) {
        plantilla += `[${campo}]\n`;
      }
      plantilla += '\n[UBICACION_GPS]\n';
      return plantilla;
    }
    // Si no hay, plantilla genérica
    return 'Documento legal generado por MELANTIA.\n[UBICACION_GPS]\n';
  },

  _guardarDocumento(documento, caso) {
    // Guardar en carpeta de documentos del módulo 11
    if (!window.MelantiaDocumentos) return;
    window.MelantiaDocumentos.guardarDocumento({
      nombre: `legal_${caso}_${Date.now()}.txt`,
      contenido: documento,
      tipo: 'legal',
      origen: 'asesor_legal',
    });
  },

  _mostrarQR(documento) {
    // Generar QR y mostrarlo en la UI
    generarQR(documento, 'qr-legal');
  },

  async _inputUsuario(mensaje) {
    // Utilidad para pedir input al usuario (puede ser reemplazada por UI real)
    return prompt(mensaje);
  },

  activarModoPanico() {
    // Seguridad: oculta sección legal
    securityLayer.triggerPanicMode();
  },
};

// Uso: AsesorLegal.iniciarAsesoriaLegal();
// El documento generado y QR se guarda en el módulo 11 (carpeta de documentos) para imprimir o compartir.
