
// Asistencia Técnica Rural MELANT IA — Especialista en Agricultura
// Carga recomendaciones agrícolas, sensores y recursos científicos

const AsistenciaTecnica = {
		// Registrar y descargar coordenada GPS actual como archivo JSON
		registrarUbicacionGPS(nombreArchivo = 'plano_gps.json') {
			if (!window.GPSUtils) {
				alert('Módulo GPSUtils no disponible');
				return;
			}
			window.GPSUtils.obtenerUbicacion(pos => {
				const datos = {
					latitud: pos.lat,
					longitud: pos.lng,
					precision: pos.precision,
					utm_x: pos.utm?.x,
					utm_y: pos.utm?.y,
					zona_utm: pos.zona_utm,
					timestamp: new Date().toISOString()
				};
				const blob = new Blob([JSON.stringify(datos, null, 2)], {type: 'application/json'});
				const link = document.createElement('a');
				link.href = URL.createObjectURL(blob);
				link.download = nombreArchivo;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				alert('Coordenadas descargadas como ' + nombreArchivo);
			}, () => {
				alert('No se pudo obtener la ubicación GPS.');
			});
		},
	cursos: [],
	sensores: [],
	catalogo: [],

	async cargarDatos() {
		try {
			const [cursos, sensores, catalogo] = await Promise.all([
				fetch('cursos_agricultura_precision.json').then(r => r.json()),
				fetch('sensores_agricultura_precision.json').then(r => r.json()),
				fetch('catalogo_sensores.json').then(r => r.json())
			]);
			this.cursos = cursos;
			this.sensores = sensores;
			this.catalogo = catalogo;
		} catch (e) {
			console.warn('No se pudieron cargar los datos técnicos:', e);
		}
	},

	mostrarRecomendaciones(containerId = 'asistenciaRecomendaciones') {
		const cont = document.getElementById(containerId);
		if (!cont) return;
		let html = '';
		html += '<h2>Recomendaciones Agrícolas Inteligentes</h2>';
		html += '<ul style="margin-bottom:18px;">';
		this.cursos.forEach(curso => {
			html += `<li><b>${curso.titulo}</b>: ${curso.descripcion}<br>`;
			html += '<span style="font-size:12px;color:#7B8F7D;">Bibliotecas: ';
			html += curso.recursos.map(r => `<a href="${r.url}" target="_blank">${r.nombre}</a>`).join(', ');
			html += '</span></li>';
		});
		html += '</ul>';

		html += '<h3>Sensores recomendados</h3>';
		html += '<ul>';
		this.sensores.forEach(s => {
			html += `<li><b>${s.nombre}</b> (${s.tecnologia}): ${s.descripcion}<br>`;
			html += `<span style="font-size:12px;color:#7B8F7D;">Aplicaciones: ${s.aplicaciones.join(', ')}</span></li>`;
		});
		html += '</ul>';

		html += '<h3>Catálogo de sensores</h3>';
		html += '<ul>';
		this.catalogo.forEach(c => {
			html += `<li><b>${c.nombre}</b> (${c.tipo}): ${c.descripcion}<br>`;
			html += `<span style="font-size:12px;color:#7B8F7D;">Modelo: ${c.modelo}, Precisión: ${c.especificaciones.precision}</span></li>`;
		});
		html += '</ul>';

		cont.innerHTML = html;
	},

	async init() {
		await this.cargarDatos();
		this.mostrarRecomendaciones();
	}
};

// Inicializar cuando se muestre la vista
document.addEventListener('DOMContentLoaded', () => {
	const view = document.getElementById('view-asistencia_tecnica_rural');
	if (view) {
		// Crear contenedor para recomendaciones
		let cont = document.getElementById('asistenciaRecomendaciones');
		if (!cont) {
			cont = document.createElement('div');
			cont.id = 'asistenciaRecomendaciones';
			view.appendChild(cont);
		}
		AsistenciaTecnica.init();
	}
	// Exponer función de registro GPS en window
	window.registrarUbicacionGPS_Asistencia = AsistenciaTecnica.registrarUbicacionGPS.bind(AsistenciaTecnica);
});
