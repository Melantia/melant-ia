// Lógica JS para generar cronograma de siembra y alertas según fecha y fase lunar
// Requiere: calendario_siembras.json y calendario_lunar.json

async function generarCronogramaSiembra(fechaSiembra, cultivoNombre) {
  // Carga datos de cultivos y fases lunares
  const cultivos = await fetch('calendario_siembras.json').then(r => r.json());
  const fasesLuna = await fetch('calendario_lunar.json').then(r => r.json());
  const cultivo = cultivos.find(c => c.cultivo.toLowerCase() === cultivoNombre.toLowerCase());
  if (!cultivo) throw new Error('Cultivo no encontrado');

  // Convierte fecha de siembra a objeto Date
  const fechaCero = new Date(fechaSiembra);
  const eventos = [];

  // Genera eventos por cada hito
  cultivo.configuracion_calendario.hitos.forEach(hito => {
    const fechaTarea = new Date(fechaCero);
    fechaTarea.setDate(fechaCero.getDate() + hito.dia_inicio);
    eventos.push({
      tarea: hito.tarea,
      fecha: fechaTarea.toISOString().split('T')[0],
      instruccion: hito.instruccion
    });
  });

  // Recomienda fase lunar ideal para siembra
  const faseIdeal = cultivo.configuracion_calendario.fase_lunar_ideal_siembra;
  const faseInfo = fasesLuna.calendario_lunar.fases.find(f => f.nombre === faseIdeal);
  const recomendacionLunar = faseInfo ? faseInfo.descripcion : '';

  return {
    cultivo: cultivo.cultivo,
    fecha_siembra: fechaSiembra,
    fase_lunar_ideal: faseIdeal,
    recomendacion_lunar: recomendacionLunar,
    eventos
  };
}

// Ejemplo de uso:
// generarCronogramaSiembra('2026-05-01', 'Zanahoria').then(console.log);
