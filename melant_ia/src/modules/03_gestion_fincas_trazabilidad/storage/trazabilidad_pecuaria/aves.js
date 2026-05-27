// modules/03_gestion_fincas_trazabilidad/storage/trazabilidad_pecuaria/aves.js
// Módulo de trazabilidad para Aves (carga bajo demanda)

const Aves = (() => {
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
      hablar('Ficha técnica generada para ' + (animal.nombre || 'el ave'));
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
      emergencia: 'Aísla el ave. Revisa signos vitales. Consulta veterinario.',
      huevo: 'Revisa postura y ambiente. Mantén temperatura estable.',
    };
    if (vozActiva) {
      hablar(
        'Protocolo de emergencia: ' + (protocolos[tipo] || 'No definido.')
      );
    }
    return protocolos[tipo] || 'Protocolo no definido.';
  }

  // Guía de manejo para pollos de granja y pollos criollos a libre pastoreo
  function guiarManejo(paso, tipo = 'granja') {
    let pasos;
    if (tipo === 'potrero') {
      pasos = [
        'Verifica el gallinero móvil o refugio en el potrero.',
        'Asegura sombra natural y protección contra depredadores.',
        'Asegura agua limpia y alimento balanceado.',
        'Permite acceso a pasto fresco y espacio para escarbar.',
        'Revisa signos de enfermedad o estrés.',
        'Limpia bebederos y comederos diariamente.',
        'Rota el área de pastoreo para evitar sobrepastoreo.',
      ];
    } else {
      pasos = [
        'Verifica el gallinero y la ventilación.',
        'Asegura agua limpia y alimento balanceado.',
        'Revisa signos de enfermedad o estrés.',
        'Limpia bebederos y comederos diariamente.',
        'Controla la densidad de aves por metro cuadrado.',
        'Mantén cama seca y limpia.',
        'Realiza limpieza profunda periódicamente.',
      ];
    }
    if (vozActiva) {
      hablar(pasos[paso] || 'Fin de la guía.');
    }
    return pasos[paso] || null;
  }

  function guiarReproduccion(paso) {
    const pasos = [
      'Selecciona gallinas y gallos sanos y productivos.',
      'Proporciona nidos limpios y protegidos.',
      'Observa el celo y comportamiento reproductivo.',
      'Permite la incubación natural o usa incubadora.',
      'Asegura temperatura y humedad adecuadas para incubación.',
      'Registra la fecha y número de pollitos nacidos.',
    ];
    if (vozActiva) {
      hablar(pasos[paso] || 'Fin de la guía de reproducción.');
    }
    return pasos[paso] || null;
  }

  function guiarAlimentacion(paso, tipo = 'granja') {
    let pasos;
    if (tipo === 'potrero') {
      pasos = [
        'Permite acceso a pasto fresco y semillas.',
        'Ofrece alimento balanceado como complemento.',
        'Asegura agua limpia en todo momento.',
        'Incluye calcio y minerales para postura.',
        'Evita alimentos tóxicos o en mal estado.',
        'Rota el área de pastoreo para mejor nutrición.',
      ];
    } else {
      pasos = [
        'Ofrece alimento balanceado según la etapa (inicio, crecimiento, postura).',
        'Asegura acceso constante a agua limpia.',
        'Incluye calcio y minerales para postura.',
        'Evita cambios bruscos de dieta.',
        'Limpia comederos y bebederos diariamente.',
      ];
    }
    if (vozActiva) {
      hablar(pasos[paso] || 'Fin de la guía de alimentación.');
    }
    return pasos[paso] || null;
  }

  function guiarSanidad(paso) {
    const pasos = [
      'Vacuna a las aves según el calendario local.',
      'Desparasita internamente cada 3-4 meses.',
      'Mantén el gallinero seco y limpio para evitar enfermedades.',
      'Observa signos de diarrea, tos o lesiones en piel.',
      'Aísla aves enfermas y consulta al veterinario.',
      'Registra tratamientos y recuperaciones.',
    ];
    if (vozActiva) {
      hablar(pasos[paso] || 'Fin de la guía de sanidad.');
    }
    return pasos[paso] || null;
  }

  function obtenerContactos() {
    return [
      { nombre: 'Valentina', telefono: '0988888888', rol: 'Técnica Avícola' },
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
    guiarReproduccion,
    guiarAlimentacion,
    guiarSanidad,
    obtenerContactos,
    activarVoz,
  };
})();

if (typeof window !== 'undefined') {
  window.Aves = Aves;
}

export default Aves;
