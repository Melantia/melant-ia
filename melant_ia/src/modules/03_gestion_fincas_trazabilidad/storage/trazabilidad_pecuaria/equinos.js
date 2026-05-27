// modules/03_gestion_fincas_trazabilidad/storage/trazabilidad_pecuaria/equinos.js
// Módulo de trazabilidad para Equinos (carga bajo demanda)

const Equinos = (() => {
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
      hablar('Ficha técnica generada para ' + (animal.nombre || 'el equino'));
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
      fiebre: 'Aísla el equino. Mide temperatura. Consulta veterinario.',
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
      'Verifica el establo y la ventilación.',
      'Asegura sombra y protección contra lluvias.',
      'Asegura agua limpia y comida balanceada.',
      'Revisa signos de enfermedad o estrés.',
      'Limpia bebederos y comederos diariamente.',
      'Cepilla y revisa el pelaje regularmente.',
    ];
    if (vozActiva) {
      hablar(pasos[paso] || 'Fin de la guía.');
    }
    return pasos[paso] || null;
  }

  function guiarReproduccion(paso) {
    const pasos = [
      'Selecciona yeguas y padrillos sanos y fértiles.',
      'Observa el celo en las yeguas (inquietud, monta).',
      'Realiza la monta o inseminación en el momento óptimo.',
      'Separa a la yegua preñada en un establo limpio y tranquilo.',
      'Prepara el área de parto con cama limpia y agua.',
      'Asiste el parto solo si hay complicaciones.',
      'Registra la fecha y número de potrillos nacidos.',
    ];
    if (vozActiva) {
      hablar(pasos[paso] || 'Fin de la guía de reproducción.');
    }
    return pasos[paso] || null;
  }

  function guiarAlimentacion(paso) {
    const pasos = [
      'Ofrece forraje fresco y seco diariamente.',
      'Incluye sales minerales y bloques nutricionales.',
      'Asegura acceso constante a agua limpia.',
      'Evita plantas tóxicas en el pastoreo.',
      'Proporciona alimento balanceado en épocas de trabajo intenso.',
      'Limpia comederos y bebederos diariamente.',
    ];
    if (vozActiva) {
      hablar(pasos[paso] || 'Fin de la guía de alimentación.');
    }
    return pasos[paso] || null;
  }

  function guiarSanidad(paso) {
    const pasos = [
      'Vacuna a los equinos según el calendario local.',
      'Desparasita internamente cada 3-4 meses.',
      'Mantén el establo seco y limpio para evitar enfermedades.',
      'Observa signos de cojera, tos o lesiones en piel.',
      'Aísla animales enfermos y consulta al veterinario.',
      'Registra tratamientos y recuperaciones.',
    ];
    if (vozActiva) {
      hablar(pasos[paso] || 'Fin de la guía de sanidad.');
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
    guiarReproduccion,
    guiarAlimentacion,
    guiarSanidad,
    obtenerContactos,
    activarVoz,
  };
})();

if (typeof window !== 'undefined') {
  window.Equinos = Equinos;
}

export default Equinos;
