// registro.js — Módulo de Registro MELANTIA
// Aquí puedes agregar la lógica de registro de usuarios, sesiones, actividades, etc.

const RegistroMelantia = {
  // Ejemplo: registrar un nuevo usuario
  registrarUsuario: function (datosUsuario) {
    // Validación de campos obligatorios
    if (
      !datosUsuario.nombre ||
      typeof datosUsuario.nombre !== 'string' ||
      !datosUsuario.nombre.trim()
    ) {
      alert('El nombre del productor/usuario es obligatorio.');
      return false;
    }
    if (
      !datosUsuario.celular ||
      typeof datosUsuario.celular !== 'string' ||
      !datosUsuario.celular.trim()
    ) {
      alert('El número de celular es obligatorio.');
      return false;
    }
    if (!datosUsuario.aceptaPoliticaPrivacidad) {
      alert('Debe aceptar las políticas de privacidad para continuar.');
      return false;
    }
    // Correo es opcional, coordenadas, finca y actividad productiva también
    // Guardar el registro principal del usuario (solo uno)
    const registro = {
      nombre: datosUsuario.nombre.trim(),
      correo: datosUsuario.correo ? datosUsuario.correo.trim() : '',
      celular: datosUsuario.celular.trim(),
      coordenadas: datosUsuario.coordenadas || null,
      finca: datosUsuario.finca || '',
      actividad: datosUsuario.actividad || '',
      aceptaPoliticaPrivacidad: true,
      fecha: new Date().toISOString(),
    };
    localStorage.setItem('registroUsuario', JSON.stringify(registro));
    alert('¡Registro exitoso!');
    // Ocultar formulario si existe y activar reconocimiento visual
    const form = document.getElementById('form-registro-usuario');
    if (form) form.style.display = 'none';
    if (window.activarReconocimientoVisual) {
      window.activarReconocimientoVisual();
    }
    return true;
  },

  // Ejemplo: obtener todos los registros
  obtenerRegistro: function () {
    // Devuelve el registro principal del usuario si existe
    const registro = localStorage.getItem('registroUsuario');
    return registro ? JSON.parse(registro) : null;
  },

  // Puedes agregar más funciones según tus necesidades
};

// Mostrar u ocultar el formulario según si ya hay registro
export function verificarRegistroUsuario() {
  const registro = localStorage.getItem('registroUsuario');
  const form = document.getElementById('form-registro-usuario');
  if (registro) {
    if (form) form.style.display = 'none';
    if (window.activarReconocimientoVisual) {
      window.activarReconocimientoVisual();
    }
  } else {
    if (form) form.style.display = '';
  }
}

if (
  document.readyState === 'complete' ||
  document.readyState === 'interactive'
) {
  setTimeout(verificarRegistroUsuario, 0);
} else {
  document.addEventListener('DOMContentLoaded', verificarRegistroUsuario);
}

// Exponer globalmente si es necesario
window.RegistroMelantia = RegistroMelantia;

export default RegistroMelantia;
