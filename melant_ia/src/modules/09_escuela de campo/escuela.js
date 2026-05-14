// Escuela de Campo MELANT IA — Cursos de Especialización
// Muestra los cursos, temario, precio y genera QR/link de pago

const cursos = require('./escuela_cursos.json');
const qrcode = require('qrcode');

function mostrarCursos() {
    console.log('==============================');
    console.log(' CURSOS DE ESPECIALIZACIÓN MELANT IA');
    console.log('==============================\n');
    cursos.forEach((curso, idx) => {
        console.log(`${idx+1}. ${curso.titulo}`);
        console.log(`   Precio: $${curso.precio} USD`);
        console.log('   Temario:');
        curso.temario.forEach((tema, i) => {
            console.log(`      ${i+1}) ${tema}`);
        });
        console.log(`   Link de pago/descarga: ${curso.link}`);
        console.log('   [Escanea el QR para pagar o descargar]\n');
        // Generar QR en consola (solo para ejemplo)
        qrcode.toString(curso.link, {type:'terminal'}, (err, url) => {
            if (!err) console.log(url);
        });
        console.log('------------------------------\n');
    });
}

// --- Módulo: Cursos de Agricultura Regenerativa, Productos Orgánicos y Biotecnología Vegetal ---
function mostrarModuloEspecializados() {
    const cursos = require('./escuela_cursos.json');
    const qrcode = require('qrcode');
    const modulos = cursos.filter(c => c.id === 'curso13' || c.id === 'curso14' || c.id === 'curso15');
    console.log('==============================');
    console.log(' MÓDULOS DESTACADOS: AGRICULTURA REGENERATIVA, PRODUCTOS ORGÁNICOS Y BIOTECNOLOGÍA VEGETAL');
    console.log('==============================\n');
    modulos.forEach((curso, idx) => {
        console.log(`${idx+1}. ${curso.titulo}`);
        console.log(`   Precio: $${curso.precio} USD`);
        console.log('   Temario:');
        curso.temario.forEach((tema, i) => {
            console.log(`      ${i+1}) ${tema}`);
        });
        console.log(`   Link de pago/descarga: ${curso.link}`);
        console.log('   [Escanea el QR para pagar o descargar]\n');
        qrcode.toString(curso.link, {type:'terminal'}, (err, url) => {
            if (!err) console.log(url);
        });
        console.log('------------------------------\n');
    });
}

// --- Módulo: Cursos Especializados y Prácticas Gratuitas Regenerativas ---
function mostrarModuloDestacados() {
    const cursos = require('./escuela_cursos.json');
    const qrcode = require('qrcode');
    // IDs de cursos avanzados y gratuitos
    const idsDestacados = ["curso13", "curso14", "curso15", "curso16", "cursoP1", "cursoP2", "cursoP3", "cursoP4"];
    const modulos = cursos.filter(c => idsDestacados.includes(c.id));
    console.log('==============================');
    console.log(' MÓDULOS DESTACADOS: AVANZADOS Y PRÁCTICAS GRATUITAS REGENERATIVAS');
    console.log('==============================\n');
    modulos.forEach((curso, idx) => {
        let tipo = curso.precio === 0 ? '[GRATUITO]' : '[AVANZADO]';
        console.log(`${idx+1}. ${tipo} ${curso.titulo}`);
        console.log('   Temario:');
        curso.temario.forEach((tema, i) => {
            console.log(`      ${i+1}) ${tema}`);
        });
        console.log(`   Formato: ${curso.formato}`);
        console.log(`   Link: ${curso.link}`);
        if (curso.precio === 0) {
            console.log('   ¡Solo acepta el reto, realiza la práctica y envía tus fotos!');
        } else {
            console.log(`   Precio: $${curso.precio} USD`);
            console.log('   [Escanea el QR para pagar o descargar]');
        }
        qrcode.toString(curso.link, {type:'terminal'}, (err, url) => {
            if (!err) console.log(url);
        });
        console.log('------------------------------\n');
    });
}

// Si se ejecuta este script directamente
if (require.main === module) {
    mostrarCursos();
}

module.exports = { mostrarCursos };
module.exports.mostrarModuloEspecializados = mostrarModuloEspecializados;
module.exports.mostrarModuloDestacados = mostrarModuloDestacados;
