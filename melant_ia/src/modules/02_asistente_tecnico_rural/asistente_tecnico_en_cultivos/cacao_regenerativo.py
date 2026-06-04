# cacao_regenerativo.py
# Estructura para consulta rápida y voz en MELANT IA

CURSO_CACAO = {
    "informacion_general": [
        "Clima ideal: 22 a 28 grados Celsius, precipitación anual de 1,500 a 2,500 mm.",
        "Suelo: Profundo, franco, buen drenaje, pH 5.5 a 7.0.",
        "Ciclo de vida: Produce entre 2 y 4 años, puede durar más de 30 años.",
        "Sombra: Necesita 50-60% en etapas iniciales para proteger hojas jóvenes."
    ],
    "enfermedades": [
        "Moniliasis: Manchas chocolate y polvo blanco en frutos jóvenes. Pudre la mazorca.",
        "Escoba de Bruja: Ramas deformadas, frutos en forma de zanahoria. Agota energía del árbol.",
        "Mazorca Negra: Manchas oscuras rápidas, pudre la cáscara y puede dañar los granos."
    ],
    "plagas": [
        "Chinches de la fruta: Succionan savia, dejan puntos negros y deforman frutos.",
        "Barrenador del tallo: Larvas que debilitan el árbol con túneles.",
        "Hormigas y pulgones: Atacan brotes y flores, retrasan desarrollo.",
        "Ardillas y pájaros carpinteros: Perforan mazorcas maduras, exponen el grano a hongos."
    ],
    "prevencion_control": [
        "Poda fitosanitaria cada 15 días: Elimina frutos y ramas enfermas.",
        "Control de sombra y drenaje: Mantén el suelo limpio y ventilado.",
        "Nutrición: Fertiliza con N, P, K y Mg para resistencia.",
        "Cosecha oportuna: No dejes frutos maduros en el árbol."
    ]
}

def obtener_bloque_cacao(seccion):
    return CURSO_CACAO.get(seccion, ["No hay información disponible para esa sección."])
