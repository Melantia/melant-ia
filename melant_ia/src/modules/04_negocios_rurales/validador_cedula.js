// Validador de cédula ecuatoriana (algoritmo del décimo dígito)
function validarCedulaEcuador(cedula) {
    if (!/^[0-9]{10}$/.test(cedula)) return false;
    const provincia = parseInt(cedula.substring(0, 2), 10);
    if (provincia < 1 || provincia > 24) return false;
    let suma = 0;
    for (let i = 0; i < 9; i++) {
        let digito = parseInt(cedula[i], 10);
        if (i % 2 === 0) {
            digito *= 2;
            if (digito > 9) digito -= 9;
        }
        suma += digito;
    }
    const decimo = (10 - (suma % 10)) % 10;
    return decimo === parseInt(cedula[9], 10);
}

// Ejemplo de uso
console.log(validarCedulaEcuador("0912345678")); // true o false

module.exports = { validarCedulaEcuador };
