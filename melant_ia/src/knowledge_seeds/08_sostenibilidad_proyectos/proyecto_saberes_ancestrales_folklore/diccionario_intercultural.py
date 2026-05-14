# Diccionario intercultural para MELANT IA
# Español, Quichua, Shuar, Tsafiki
# Estructura lista para ingestión y consulta multilingüe

data_ancestral = {
    "persona": {
        "espanol": "Persona / Ser humano",
        "quichua": "Runa",
        "shuar": "Shuar",
        "tsafiki": "Tsá’chi",
        "descripcion": "Ser humano, sujeto de derechos y deberes."
    },
    "tierra": {
        "espanol": "Tierra / Suelo",
        "quichua": "Allpa",
        "shuar": "Nunka",
        "tsafiki": "To",
        "descripcion": "Base de la vida y el cultivo."
    },
    "agua": {
        "espanol": "Agua / Río",
        "quichua": "Yaku",
        "shuar": "Entsa",
        "tsafiki": "Pi",
        "descripcion": "Recurso vital para el riego y consumo."
    },
    "sol": {
        "espanol": "Sol",
        "quichua": "Inti",
        "shuar": "Etsa",
        "tsafiki": "Shu",
        "descripcion": "Fuente de energía y vida."
    },
    "luna": {
        "espanol": "Luna",
        "quichua": "Killa",
        "shuar": "Nantu",
        "tsafiki": "Ke",
        "descripcion": "Guía para la siembra y cosecha."
    },
    "fuego": {
        "espanol": "Fuego",
        "quichua": "Nina",
        "shuar": "Jí",
        "tsafiki": "Ni",
        "descripcion": "Elemento para cocinar y proteger."
    },
    "arbol": {
        "espanol": "Árbol / Planta",
        "quichua": "Sacha / Yura",
        "shuar": "Numi",
        "tsafiki": "Ti",
        "descripcion": "Fuente de medicina y alimento."
    },
    "maiz": {
        "espanol": "Maíz",
        "quichua": "Sara",
        "shuar": "Shinki",
        "tsafiki": "Isu",
        "descripcion": "Cultivo ancestral básico."
    },
    "selva": {
        "espanol": "Selva / Campo",
        "quichua": "Sacha",
        "shuar": "Ikiam",
        "tsafiki": "Jaca",
        "descripcion": "Espacio de vida y biodiversidad."
    },
    "viento": {
        "espanol": "Viento",
        "quichua": "Wayra",
        "shuar": "Nampí",
        "tsafiki": "Fitu",
        "descripcion": "Regula el clima y la polinización."
    },
    "lluvia": {
        "espanol": "Lluvia",
        "quichua": "Tamya",
        "shuar": "Yumi",
        "tsafiki": "Shu",
        "descripcion": "Permite el crecimiento de los cultivos."
    },
    "vida": {
        "espanol": "Vida",
        "quichua": "Kawsay",
        "shuar": "Iwia",
        "tsafiki": "-",
        "descripcion": "Existencia, energía vital."
    },
    # Frases útiles para el campo
    "esta planta esta enferma": {
        "espanol": "Esta planta está enferma",
        "quichua": "Kay yura unquyukmi",
        "shuar": "Numi nuka nintin",
        "tsafiki": "Ti nuka shina",
        "descripcion": "Frase para diagnóstico agrícola."
    },
    "necesito agua": {
        "espanol": "Necesito agua",
        "quichua": "Yaku mikanay",
        "shuar": "Entsa nintin",
        "tsafiki": "Pi nuka shina",
        "descripcion": "Frase para pedir agua."
    },
    # Conceptos clave
    "chakra": {
        "espanol": "Chakra (huerto biodiverso)",
        "quichua": "Chakra",
        "shuar": "Ajaj",
        "tsafiki": "-",
        "descripcion": "Sistema de cultivo tradicional."
    },
    "minka": {
        "espanol": "Minka (trabajo comunitario)",
        "quichua": "Minka",
        "shuar": "-",
        "tsafiki": "-",
        "descripcion": "Trabajo colectivo, ayuda mutua."
    },
    "pachamama": {
        "espanol": "Pachamama (Madre Tierra)",
        "quichua": "Pachamama",
        "shuar": "-",
        "tsafiki": "-",
        "descripcion": "Madre Tierra, fuente de vida."
    },
    "uwishin": {
        "espanol": "Uwishin (sabio/médico)",
        "quichua": "-",
        "shuar": "Uwishin",
        "tsafiki": "Pone",
        "descripcion": "Guía espiritual y médico tradicional."
    },
    "wayusa": {
        "espanol": "Wayusa (bebida energética)",
        "quichua": "Wayusa",
        "shuar": "Wayusa",
        "tsafiki": "-",
        "descripcion": "Infusión tradicional, energía y salud."
    },
    "kasama": {
        "espanol": "Kasama (nuevo amanecer)",
        "quichua": "-",
        "shuar": "-",
        "tsafiki": "Kasama",
        "descripcion": "Fiesta principal Tsáchila, nuevo ciclo."
    }
}

def traducir_termino(termino, idioma):
    """Devuelve la traducción y descripción de un término según idioma ('espanol', 'quichua', 'shuar', 'tsafiki')."""
    t = termino.lower()
    if t in data_ancestral:
        entry = data_ancestral[t]
        traduccion = entry.get(idioma, "-")
        descripcion = entry.get("descripcion", "")
        return f"{traduccion} — {descripcion}"
    return "Término no disponible."

# Ejemplo de uso:
# print(traducir_termino("agua", "tsafiki"))
# print(traducir_termino("chakra", "quichua"))
