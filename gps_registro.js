// GPS: Función para registrar latitud y longitud y guardar en un archivo JSON
// Uso: iniciarGPS(nombreArchivo)

const fs = window.require ? window.require('fs') : null;

function iniciarGPS(nombreArchivo = 'plano_gps.json') {
    if (!navigator.geolocation) {
        alert('Geolocalización no soportada');
        return;
    }
    navigator.geolocation.getCurrentPosition(function(pos) {
        const datos = {
            latitud: pos.coords.latitude,
            longitud: pos.coords.longitude,
            timestamp: new Date().toISOString()
        };
        if (fs) {
            fs.writeFile(nombreArchivo, JSON.stringify(datos, null, 2), err => {
                if (err) alert('Error guardando archivo: ' + err);
                else alert('Coordenadas guardadas en ' + nombreArchivo);
            });
        } else {
            // Alternativa: descarga automática en navegador
            const blob = new Blob([JSON.stringify(datos, null, 2)], {type: 'application/json'});
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = nombreArchivo;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            alert('Coordenadas descargadas como ' + nombreArchivo);
        }
    }, function(err) {
        alert('Error obteniendo GPS: ' + err.message);
    });
}

// Ejemplo de uso:
// iniciarGPS();
