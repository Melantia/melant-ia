# Prácticas Regenerativas para Plátano Barraganete
# Basado en los 7 pilares de la transición regenerativa

fuente = "Manual Técnico INIAP, experiencias El Carmen y literatura regenerativa 2026"

PRACTICAS_REGENERATIVAS = {
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

def obtener_practica(nombre):
    return PRACTICAS_REGENERATIVAS.get(nombre, {"descripcion": "No disponible.", "beneficio": ""})
