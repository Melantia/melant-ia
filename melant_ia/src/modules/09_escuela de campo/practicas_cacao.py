# Prácticas regenerativas para Plátano Barraganete
fuente_regenerativas = "Manual Técnico INIAP, experiencias El Carmen y literatura regenerativa 2026"

PRACTICAS_REGENERATIVAS_PLATANO = {
    "cobertura_suelo": {
        "descripcion": "Mantener el suelo siempre cubierto con rastrojo, hojas picadas o cultivos de cobertura como mucuna o maní forrajero.",
        "beneficio": "Evita erosión, conserva humedad y alimenta microorganismos."
    },
    "microorganismos_montana": {
        "descripcion": "Capturar y aplicar microorganismos locales del bosque para acelerar la descomposición y competir contra patógenos.",
        "beneficio": "Mejora la salud del suelo y reduce enfermedades como Fusarium."
    },
    "biofertilizantes_liquidos": {
        "descripcion": "Preparar bioles con estiércol, melaza, ceniza y suero, fermentados 30-45 días.",
        "beneficio": "Aporta nutrientes y estimula la vida microbiana."
    },
    "cero_labranza": {
        "descripcion": "Evitar voltear la tierra; sembrar solo donde va la planta.",
        "beneficio": "Protege la estructura fúngica y la red de raíces."
    },
    "ciclaje_nutrientes": {
        "descripcion": "Picar pseudotallos y raquis y devolverlos al pie de la planta.",
        "beneficio": "Recupera hasta el 40% del potasio extraído y mejora la fertilidad."
    },
    "control_bioinsumos": {
        "descripcion": "Sustituir fungicidas por caldos sulfocálcicos y extractos botánicos de ajo, ají o neem.",
        "beneficio": "Controla hongos y refuerza la resistencia natural de la planta."
    },
    "monitoreo_paciencia": {
        "descripcion": "Llevar una bitácora de prácticas y observar los cambios en el suelo y las plantas.",
        "beneficio": "Permite ajustar el manejo y comprobar mejoras en salud y resiliencia."
    }
}

def obtener_practica_regenerativa_platano(nombre):
    return PRACTICAS_REGENERATIVAS_PLATANO.get(nombre, {"descripcion": "No disponible.", "beneficio": ""})
# Protocolos técnicos de manejo de cacao — Basado en INIAP
fuente = "Manual Técnico de Cacao INIAP 2025"

PRACTICAS = {
    "poda_sanitaria": {
        "descripcion": "Elimina ramas y frutos enfermos cada 15 días para reducir la presión de inóculo.",
        "pasos": [
            "Identifica ramas con síntomas de Escoba de Bruja o Moniliasis.",
            "Corta y retira el material afectado del lote.",
            "Desinfecta herramientas entre cada árbol para evitar contagios."
        ]
    },
    "control_sombra": {
        "descripcion": "Mantén el dosel abierto y ventilado para reducir humedad y enfermedades.",
        "pasos": [
            "Poda árboles de sombra antes de la época de lluvias.",
            "Evita exceso de sombra (>40%)."
        ]
    },
    "fertilizacion": {
        "descripcion": "Aplica fertilización balanceada según análisis de suelo y etapa fenológica.",
        "pasos": [
            "Realiza análisis de suelo cada 2 años.",
            "Aplica N-P-K y magnesio según recomendación técnica.",
            "Complementa con abonos orgánicos si es posible."
        ]
    },
    "cosecha_oportuna": {
        "descripcion": "Cosecha frutos maduros cada 15 días para evitar proliferación de plagas y enfermedades.",
        "pasos": [
            "No dejes frutos sobremaduros en el árbol.",
            "Evita dañar la corteza al cortar las mazorcas."
        ]
    }
}

def obtener_protocolo(practica):
    info = PRACTICAS.get(practica)
    if info:
        pasos = " ".join([f"- {p}" for p in info["pasos"]])
        return f"{info['descripcion']} Pasos: {pasos}"
    return None
# practicas_cacao.py
# Prácticas recomendadas para la Escuela de Campo MELANT IA

PRACTICAS_CACAO = {
    "poda_formacion": [
        "Realiza la poda de formación en plantas jóvenes para definir la estructura del árbol.",
        "Elimina ramas bajas y brotes que crecen hacia el interior de la copa."
    ],
    "poda_sanitaria": [
        "Cada 15 días, retira frutos enfermos y ramas con síntomas de Escoba de Bruja.",
        "Desinfecta las herramientas entre cada árbol para evitar la propagación de hongos."
    ],
    "fertilizacion_basica": [
        "Aplica abono orgánico alrededor de la base del árbol al inicio de la temporada de lluvias.",
        "Usa compost, bocashi o bioles para mejorar la fertilidad y la vida del suelo."
    ],
    "control_biologico": [
        "Fomenta la presencia de hormigas y hongos benéficos como Beauveria bassiana.",
        "Instala trampas de feromonas para monitorear plagas clave."
    ]
}

def obtener_practica_cacao(nombre):
    return PRACTICAS_CACAO.get(nombre, ["Práctica no disponible."])
