_fuente_ = "Manual de Agrocalidad 2025"
def obtener_protocolo(nombre_plaga):
    # Busca en críticas y secundarias
    for tipo in ["criticas", "secundarias"]:
        for plaga in PLAGAS_CACAO.get(tipo, []):
            if plaga["nombre"].lower() == nombre_plaga.lower():
                return f"Síntomas: {plaga['sintomas']}. Control: {'; '.join(plaga['control'])}"
    return None
# plagas_cacao.py
# Clasificación y consulta de plagas, enfermedades y prácticas para MELANT IA

PLAGAS_CACAO = {
    "criticas": [
        {
            "nombre": "Moniliasis",
            "impacto": "Muy alto",
            "sintomas": "Manchas chocolate en fruto joven, polvo blanco (esporas), pudrición interna de la mazorca.",
            "control": [
                "Poda fitosanitaria cada 15 días.",
                "Cosecha oportuna de frutos.",
                "Ventilación y control de sombra."
            ]
        },
        {
            "nombre": "Escoba de Bruja",
            "impacto": "Alto",
            "sintomas": "Ramas deformadas (escobas), frutos en forma de zanahoria o chirimoya.",
            "control": [
                "Eliminar brotes y ramas enfermas.",
                "Desinfectar herramientas entre árboles."
            ]
        },
        {
            "nombre": "Mazorca Negra",
            "impacto": "Alto",
            "sintomas": "Manchas oscuras rápidas en frutos, pudrición de cáscara y granos.",
            "control": [
                "Mejorar drenaje y ventilación.",
                "Cosechar frutos afectados a tiempo."
            ]
        }
    ],
    "secundarias": [
        {
            "nombre": "Chinches de la fruta",
            "impacto": "Medio",
            "sintomas": "Puntos negros y deformaciones en frutos jóvenes.",
            "control": [
                "Monitoreo frecuente.",
                "Control biológico y trampas."
            ]
        },
        {
            "nombre": "Barrenador del tallo",
            "impacto": "Medio",
            "sintomas": "Túneles en el tronco, debilitamiento del árbol.",
            "control": [
                "Eliminación manual de larvas.",
                "Trampas y monitoreo."
            ]
        },
        {
            "nombre": "Hormigas y pulgones",
            "impacto": "Medio",
            "sintomas": "Ataque a brotes tiernos y flores, retraso en desarrollo foliar.",
            "control": [
                "Fomentar enemigos naturales.",
                "Monitoreo y control biológico."
            ]
        },
        {
            "nombre": "Ardillas y pájaros carpinteros",
            "impacto": "Bajo",
            "sintomas": "Perforan mazorcas maduras, exponen el grano a hongos.",
            "control": [
                "Cosecha oportuna.",
                "Barreras físicas si es necesario."
            ]
        }
    ]
}

PRACTICAS_CACAO = {
    "poda_fitosanitaria": [
        "Elimina frutos enfermos y ramas con Escoba de Bruja cada 15 días.",
        "Desinfecta las herramientas entre cada árbol."
    ],
    "control_sombra_drenaje": [
        "Mantén el suelo limpio y el dosel ventilado para evitar exceso de humedad.",
        "Poda árboles de sombra antes de la época de lluvias."
    ],
    "nutricion": [
        "Fertiliza con Nitrógeno, Fósforo, Potasio y Magnesio.",
        "Aplica abonos orgánicos y bioinsumos hechos en finca."
    ],
    "cosecha_oportuna": [
        "No dejes frutos maduros o sobremaduros en el árbol.",
        "Cosecha a tiempo para evitar plagas y enfermedades."
    ]
}

def obtener_plaga(tipo, indice=0):
    return PLAGAS_CACAO.get(tipo, [])[indice] if tipo in PLAGAS_CACAO and len(PLAGAS_CACAO[tipo]) > indice else None

def obtener_practica(nombre):
    return PRACTICAS_CACAO.get(nombre, ["Práctica no disponible."])
