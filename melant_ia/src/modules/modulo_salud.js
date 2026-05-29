// modulo_salud.js
// Módulo para gestión de botiquín casero e historia clínica de pacientes MELANTIA
import { supabase } from './supabase_config.js';

const BOTIQUIN_KEY = 'melantia_botiquin';
const HISTORIAL_KEY = 'melantia_historial_pacientes';

export async function cargarBotiquin() {
  // Carga el botiquín local o inicializa si no existe
  let data = localStorage.getItem(BOTIQUIN_KEY);
  if (!data) {
    const resp = await fetch(
      './knowledge_seeds/botiquin_historia_clinica.json'
    );
    const json = await resp.json();
    data = JSON.stringify(json.botiquin);
    localStorage.setItem(BOTIQUIN_KEY, data);
  }
  return JSON.parse(data);
}

export function guardarBotiquin(botiquin) {
  localStorage.setItem(BOTIQUIN_KEY, JSON.stringify(botiquin));
}

export function cargarHistorialPacientes() {
  // Devuelve todos los historiales guardados localmente
  let data = localStorage.getItem(HISTORIAL_KEY);
  if (!data) return [];
  return JSON.parse(data);
}

export function guardarHistorialPaciente(historial) {
  // Guarda o actualiza historial por cédula o nombre
  let historiales = cargarHistorialPacientes();
  const idx = historiales.findIndex(
    (h) => h.cedula === historial.cedula || h.nombre === historial.nombre
  );
  if (idx >= 0) historiales[idx] = historial;
  else historiales.push(historial);
  localStorage.setItem(HISTORIAL_KEY, JSON.stringify(historiales));
}

export function buscarHistorialPaciente({ nombre, cedula }) {
  const historiales = cargarHistorialPacientes();
  if (cedula) return historiales.find((h) => h.cedula === cedula);
  if (nombre)
    return historiales.find(
      (h) => h.nombre.toLowerCase() === nombre.toLowerCase()
    );
  return null;
}

export function exportarHistorialPaciente(historial) {
  // Exporta a JSON y lo guarda en carpeta Documentos (descarga)
  const blob = new Blob([JSON.stringify(historial, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `historial_${historial.nombre || historial.cedula}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generarQRHistorial(historial) {
  // Usa una librería QR (ej: qrious, qr.js) para generar el QR con el JSON o un enlace
  // Aquí solo se deja el placeholder
  return 'QR_GENERADO';
}
