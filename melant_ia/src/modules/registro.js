// registro.js — Módulo de Registro MELANTIA
// Aquí puedes agregar la lógica de registro de usuarios, sesiones, actividades, etc.

const RegistroMelantia = {
  registrarUsuario: function (datosUsuario) {
    // Validación avanzada de campos
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    const cedulaRegex = /^\d{8,12}$/;
    let errores = [];
    if (
      !datosUsuario.nombre ||
      typeof datosUsuario.nombre !== 'string' ||
      !datosUsuario.nombre.trim()
    ) {
      errores.push('El nombre del productor/usuario es obligatorio.');
    }
    if (!datosUsuario.cedula || !cedulaRegex.test(datosUsuario.cedula)) {
      errores.push(
        'La cédula es obligatoria y debe ser numérica (8-12 dígitos).'
      );
    }
    if (!datosUsuario.correo || !emailRegex.test(datosUsuario.correo)) {
      errores.push(
        'El correo electrónico es obligatorio y debe tener formato válido.'
      );
    }
    if (!datosUsuario.celular || !/^\d{8,15}$/.test(datosUsuario.celular)) {
      errores.push('El número de celular es obligatorio y debe ser numérico.');
    }
    if (!datosUsuario.finca || !datosUsuario.finca.trim()) {
      errores.push('El nombre de la finca es obligatorio.');
    }
    if (
      !datosUsuario.coordenadas ||
      !Array.isArray(datosUsuario.coordenadas) ||
      datosUsuario.coordenadas.length !== 2
    ) {
      errores.push(
        'Debe ingresar las coordenadas de la finca (latitud y longitud).'
      );
    }
    if (!datosUsuario.actividad || !datosUsuario.actividad.trim()) {
      errores.push(
        'Debe indicar el principal rubro de producción o actividad.'
      );
    }
    if (!datosUsuario.fotoCedula) {
      errores.push('Debe adjuntar la foto de la cédula.');
    }
    if (!datosUsuario.fotoPersona) {
      errores.push('Debe adjuntar la foto de la persona.');
    }
    if (!datosUsuario.aceptaPoliticaPrivacidad) {
      errores.push('Debe aceptar las políticas de privacidad para continuar.');
    }
    if (errores.length) {
      RegistroMelantia.mostrarMensaje(errores.join('\n'), 'error');
      return false;
    }
    // Guardar el registro (puede haber varios, historial)
    let registros = JSON.parse(
      localStorage.getItem('registrosUsuarios') || '[]'
    );
    const registro = {
      nombre: datosUsuario.nombre.trim(),
      cedula: datosUsuario.cedula.trim(),
      correo: datosUsuario.correo.trim(),
      celular: datosUsuario.celular.trim(),
      finca: datosUsuario.finca.trim(),
      coordenadas: datosUsuario.coordenadas,
      actividad: datosUsuario.actividad.trim(),
      fotoCedula: datosUsuario.fotoCedula,
      fotoPersona: datosUsuario.fotoPersona,
      aceptaPoliticaPrivacidad: true,
      fecha: new Date().toISOString(),
    };
    registros.unshift(registro);
    localStorage.setItem('registrosUsuarios', JSON.stringify(registros));
    RegistroMelantia.mostrarMensaje('¡Registro exitoso!', 'success');
    RegistroMelantia.limpiarFormulario();
    RegistroMelantia.mostrarRegistrosRecientes();
    if (window.activarReconocimientoVisual)
      window.activarReconocimientoVisual();
    return true;
  },
  mostrarMensaje: function (msg, tipo) {
    let div = document.getElementById('msg-registro');
    if (!div) {
      div = document.createElement('div');
      div.id = 'msg-registro';
      document.body.appendChild(div);
    }
    div.innerText = msg;
    div.style.padding = '8px';
    div.style.margin = '8px 0';
    div.style.borderRadius = '6px';
    div.style.color = tipo === 'success' ? '#155724' : '#721c24';
    div.style.background = tipo === 'success' ? '#d4edda' : '#f8d7da';
    div.style.border =
      tipo === 'success' ? '1px solid #c3e6cb' : '1px solid #f5c6cb';
  },
  limpiarFormulario: function () {
    const form = document.getElementById('form-registro-usuario');
    if (form) form.reset();
  },
  mostrarRegistrosRecientes: function () {
    const panel = document.getElementById('panel-registros-recientes');
    if (!panel) return;
    const registros = JSON.parse(
      localStorage.getItem('registrosUsuarios') || '[]'
    );
    if (!registros.length) {
      panel.innerHTML = '<p>No hay registros recientes.</p>';
      return;
    }
    panel.innerHTML =
      '<h3>Registros recientes</h3>' +
      registros
        .slice(0, 5)
        .map(
          (r) =>
            `<div class='card-registro'><b>${r.nombre}</b> (${r.cedula}) — ${r.finca}<br>${r.actividad}<br><span style='font-size:0.9em;color:#888;'>${new Date(r.fecha).toLocaleString()}</span></div>`
        )
        .join('<hr>');
  },
  exportarCSV: function () {
    const registros = JSON.parse(
      localStorage.getItem('registrosUsuarios') || '[]'
    );
    if (!registros.length) return;
    const encabezado = Object.keys(registros[0]);
    const csv = [encabezado.join(',')]
      .concat(
        registros.map((r) =>
          encabezado.map((k) => '"' + (r[k] || '') + '"').join(',')
        )
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'registros_melantia.csv';
    a.click();
  },
  eliminarRegistro: function (cedula) {
    if (!confirm('¿Seguro que desea eliminar este registro?')) return;
    let registros = JSON.parse(
      localStorage.getItem('registrosUsuarios') || '[]'
    );
    registros = registros.filter((r) => r.cedula !== cedula);
    localStorage.setItem('registrosUsuarios', JSON.stringify(registros));
    RegistroMelantia.mostrarMensaje('Registro eliminado.', 'success');
    RegistroMelantia.mostrarRegistrosRecientes();
  },
  obtenerRegistro: function () {
    const registros = JSON.parse(
      localStorage.getItem('registrosUsuarios') || '[]'
    );
    return registros.length ? registros[0] : null;
  },
  // Integración: obtener cuentas para transferencias
  obtenerCuentas: function () {
    const registros = JSON.parse(
      localStorage.getItem('registrosUsuarios') || '[]'
    );
    return registros.map((r) => ({
      nombre: r.nombre,
      cedula: r.cedula,
      finca: r.finca,
    }));
  },
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
