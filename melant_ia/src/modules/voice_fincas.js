// voice_fincas.js — Control por voz para gestión de fincas MELANTIA (Web Speech API)
// Incluye comandos: alta, búsqueda, eliminar y feedback por voz

export class VoiceFincasMelantia {
  constructor() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = SpeechRecognition ? new SpeechRecognition() : null;
    if (!this.recognition) {
      alert('Reconocimiento de voz no soportado en este navegador.');
      return;
    }
    this.recognition.lang = 'es-EC';
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.onCommand = null; // callback externo
  }

  start() {
    if (!this.recognition) return;
    this.recognition.start();
    this.recognition.onresult = (event) => {
      const texto = event.results[0][0].transcript.toLowerCase();
      this._procesarComando(texto);
    };
    this.recognition.onerror = (e) => {
      if (e.error !== 'aborted')
        this._feedback('Error de reconocimiento de voz.');
    };
  }

  _procesarComando(texto) {
    // Comando: agregar finca "Nombre" cultivo "Cultivo"
    let match = texto.match(/agregar finca ([\w\s]+)( cultivo ([\w\s]+))?/);
    if (match) {
      const nombre = match[1].trim();
      const cultivo = match[3] ? match[3].trim() : '';
      this._feedback(`Agregando finca ${nombre}`);
      if (this.onCommand) this.onCommand({ accion: 'alta', nombre, cultivo });
      return;
    }
    // Comando: buscar finca "Nombre"
    match = texto.match(/buscar finca ([\w\s]+)/);
    if (match) {
      const nombre = match[1].trim();
      this._feedback(`Buscando finca ${nombre}`);
      if (this.onCommand) this.onCommand({ accion: 'buscar', nombre });
      return;
    }
    // Comando: eliminar finca "Nombre"
    match = texto.match(/eliminar finca ([\w\s]+)/);
    if (match) {
      const nombre = match[1].trim();
      this._feedback(`Eliminando finca ${nombre}`);
      if (this.onCommand) this.onCommand({ accion: 'eliminar', nombre });
      return;
    }
    this._feedback('Comando no reconocido.');
  }

  _feedback(mensaje) {
    if ('speechSynthesis' in window) {
      const utt = new window.SpeechSynthesisUtterance(mensaje);
      utt.lang = 'es-EC';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utt);
    }
  }
}

// Ejemplo de integración en la UI:
// import { VoiceFincasMelantia } from './voice_fincas.js';
// const voz = new VoiceFincasMelantia();
// voz.onCommand = ({accion, nombre, cultivo}) => { ... };
// voz.start(); // para iniciar escucha
