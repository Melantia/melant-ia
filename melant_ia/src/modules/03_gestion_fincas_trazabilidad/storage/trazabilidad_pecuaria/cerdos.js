// modules/03_gestion_fincas_trazabilidad/storage/trazabilidad_pecuaria/cerdos.js
// Módulo de trazabilidad para Cerdos (carga bajo demanda)

const Cerdos = (() => {
  let vozActiva = false;

  // 1. Ficha técnica y sanitaria
  async function generarFicha(animal) {
    const ficha = {
      id: animal.id,
      nombre: animal.nombre,
      edad: animal.edad,
      peso: animal.peso,
      salud: animal.salud,
      historial: animal.historial || [],
      // ...otros campos
    };
    if (vozActiva) {
      hablar('Ficha técnica generada para ' + (animal.nombre || 'el cerdo'));
    }
    return ficha;
  }

  // 2. Registro de evidencia (foto, peso, evento)
  async function registrarEvidencia(animalId, tipo, datos) {
    // Guardar evidencia en almacenamiento local o remoto
    // ...
    if (vozActiva) {
      hablar('Evidencia registrada: ' + tipo);
    }
    return { success: true };
  }

  // 3. Protocolos de emergencia
  function protocoloEmergencia(tipo) {
    const protocolos = {
      parto: 'Llama al técnico. Limpia el área. Prepara agua tibia y toallas.',
      fiebre: 'Aísla el cerdo. Mide temperatura. Consulta veterinario.',
      // ...otros protocolos
    };
    if (vozActiva) {
      hablar(
        'Protocolo de emergencia: ' + (protocolos[tipo] || 'No definido.')
      );
    }
    return protocolos[tipo] || 'Protocolo no definido.';
  }

  // 4. Guía de manejo y buenas prácticas
  // tipo: 'corral' (default) o 'potrero'
  function guiarManejo(paso, tipo = 'corral') {
    let pasos;
    if (tipo === 'potrero') {
      pasos = [
        'Verifica el cerco perimetral del potrero para evitar fugas.',
        'Asegura sombra natural o refugios móviles.',
        'Proporciona acceso a agua limpia en todo momento.',
        'Permite acceso a pasto fresco y zonas de barro para refrescarse.',
        'Rota el área de pastoreo para evitar sobrepastoreo y enfermedades.',
        'Observa signos de agresividad o estrés por jerarquía.',
        'Limpia y desinfecta los bebederos y comederos portátiles.',
        'Registra nacimientos y bajas en la piara.',
      ];
    } else {
      pasos = [
        'Verifica el corral y la ventilación.',
        'Asegura agua limpia y comida balanceada.',
        'Revisa signos de enfermedad o estrés.',
        'Limpia bebederos y comederos diariamente.',
        'Controla la temperatura y humedad del ambiente.',
        'Realiza desparasitación y vacunación según calendario.',
        'Registra nacimientos y bajas en la piara.',
      ];
    }
    if (vozActiva) {
      hablar(pasos[paso] || 'Fin de la guía.');
    }
    return pasos[paso] || null;
  }

  // 6. Guía de reproducción
  function guiarReproduccion(paso) {
    const pasos = [
      'Selecciona reproductores sanos y de buen peso.',
      'Observa el celo en las hembras (vulva enrojecida, inquietud).',
      'Realiza la monta o inseminación en el momento óptimo.',
      'Separa a la cerda preñada en un corral limpio y tranquilo.',
      'Prepara el área de parto con cama limpia y agua.',
      'Asiste el parto solo si hay complicaciones.',
      'Registra la fecha y número de lechones nacidos.',
    ];
    if (vozActiva) {
      hablar(pasos[paso] || 'Fin de la guía de reproducción.');
    }
    return pasos[paso] || null;
  }

  // 7. Guía de alimentación
  // tipo: 'corral' (default) o 'potrero'
  function guiarAlimentacion(paso, tipo = 'corral') {
    let pasos;
    if (tipo === 'potrero') {
      pasos = [
        'Permite acceso a pasto fresco y raíces comestibles.',
        'Ofrece alimento balanceado como complemento, especialmente en sequía.',
        'Asegura acceso constante a agua limpia.',
        'Incluye sales minerales y vitaminas en bloques o mezclas.',
        'Evita plantas tóxicas y zonas contaminadas.',
        'Rota el área de pastoreo para mejor nutrición.',
        'Limpia comederos y bebederos portátiles diariamente.',
      ];
    } else {
      pasos = [
        'Proporciona leche materna a los lechones hasta el destete.',
        'Introduce alimento balanceado gradualmente después del destete.',
        'Asegura acceso constante a agua limpia.',
        'Ofrece raciones ricas en energía y proteínas para crecimiento.',
        'Evita cambios bruscos de dieta.',
        'Incluye minerales y vitaminas según etapa.',
        'Limpia comederos y bebederos diariamente.',
      ];
    }
    if (vozActiva) {
      hablar(pasos[paso] || 'Fin de la guía de alimentación.');
    }
    return pasos[paso] || null;
  }

  // 8. Guía de sanidad
  function guiarSanidad(paso) {
    const pasos = [
      'Vacuna a los cerdos según el calendario local.',
      'Desparasita internamente cada 3-4 meses.',
      'Mantén el corral seco y limpio para evitar enfermedades.',
      'Observa signos de diarrea, tos o lesiones en piel.',
      'Aísla animales enfermos y consulta al veterinario.',
      'Registra tratamientos y recuperaciones.',
    ];
    if (vozActiva) {
      hablar(pasos[paso] || 'Fin de la guía de sanidad.');
    }
    return pasos[paso] || null;
  }

  // 5. Catálogo de técnicos y contactos
  function obtenerContactos() {
    return [
      { nombre: 'Dr. Jorge', telefono: '0999999999', rol: 'Veterinario' },
      { nombre: 'Valentina', telefono: '0988888888', rol: 'Técnica' },
    ];
  }

  // --- Integración de voz (opcional) ---
  function activarVoz(opcion) {
    vozActiva = !!opcion;
  }

  function hablar(texto) {
    if (typeof window.vozJorge === 'function') {
      window.vozJorge(texto);
    } else if ('speechSynthesis' in window) {
      const utt = new SpeechSynthesisUtterance(texto);
      utt.lang = 'es-EC';
      utt.pitch = 0.95;
      utt.rate = 0.98;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utt);
    }
  }

  // --- API pública ---
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
  window.Cerdos = Cerdos;
}

export default Cerdos;
