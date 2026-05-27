// modules/03_gestion_fincas_trazabilidad/storage/trazabilidad_pecuaria/cuyes.js
// Módulo de trazabilidad para Cuyes (carga bajo demanda)

const Cuyes = (() => {
  let vozActiva = false;

  async function generarFicha(animal) {
    const ficha = {
      id: animal.id,
      nombre: animal.nombre,
      edad: animal.edad,
      peso: animal.peso,
      salud: animal.salud,
      historial: animal.historial || [],
    };
    if (vozActiva) {
      hablar('Ficha técnica generada para ' + (animal.nombre || 'el cuy'));
    }
    return ficha;
  }

  async function registrarEvidencia(animalId, tipo, datos) {
    if (vozActiva) {
      hablar('Evidencia registrada: ' + tipo);
    }
    return { success: true };
  }

  function protocoloEmergencia(tipo) {
    const protocolos = {
      parto: 'Llama al técnico. Limpia el área. Prepara agua tibia y toallas.',
      fiebre: 'Aísla el cuy. Mide temperatura. Consulta veterinario.',
    };
    if (vozActiva) {
      hablar(
        'Protocolo de emergencia: ' + (protocolos[tipo] || 'No definido.')
      );
    }
    return protocolos[tipo] || 'Protocolo no definido.';
  }

  function guiarManejo(paso) {
    const pasos = [
      'Verifica la jaula y la ventilación.',
      'Asegura agua limpia y comida balanceada.',
      'Revisa signos de enfermedad o estrés.',
      'Limpia bebederos y comederos diariamente.',
    ];
    if (vozActiva) {
      hablar(pasos[paso] || 'Fin de la guía.');
    }
    return pasos[paso] || null;
  }

  function obtenerContactos() {
    return [
      { nombre: 'Valentina', telefono: '0988888888', rol: 'Técnica' },
      { nombre: 'Dr. Jorge', telefono: '0999999999', rol: 'Veterinario' },
    ];
  }

  function activarVoz(opcion) {
    vozActiva = !!opcion;
  }

  function hablar(texto) {
    if (typeof window.vozValentina === 'function') {
      window.vozValentina(texto);
    } else if ('speechSynthesis' in window) {
      const utt = new SpeechSynthesisUtterance(texto);
      utt.lang = 'es-EC';
      utt.pitch = 1.15;
      utt.rate = 1.0;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utt);
    }
  }

  return {
    generarFicha,
    registrarEvidencia,
    protocoloEmergencia,
    guiarManejo,
    obtenerContactos,
    activarVoz,
  };
})();

if (typeof window !== 'undefined') {
  window.Cuyes = Cuyes;
}

export default Cuyes;
