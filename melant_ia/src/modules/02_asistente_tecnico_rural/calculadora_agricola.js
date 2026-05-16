// Calculadora Agrícola: Número de plantas por hectárea
// Uso: calcularPlantasPorHectarea(distanciaEntrePlantas, distanciaEntreFilas)

function calcularPlantasPorHectarea(distanciaEntrePlantas, distanciaEntreFilas) {
    // Convertir distancias de metros a hectárea (1 ha = 10,000 m2)
    const areaPlanta = distanciaEntrePlantas * distanciaEntreFilas;
    if (areaPlanta <= 0) return 0;
    const plantasPorHectarea = 10000 / areaPlanta;
    return Math.floor(plantasPorHectarea);
}

// Ejemplo de uso:
// const plantas = calcularPlantasPorHectarea(1, 2.5);
// console.log(`Plantas por hectárea: ${plantas}`);
