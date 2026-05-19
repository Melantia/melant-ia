# cursos_cortos_cacao.py
# Cursos cortos y prácticas para la Escuela de Campo MELANT IA

CURSOS_CORTOS = [
    {
        "titulo": "Poda Sanitaria de Cacao",
        "objetivo": "Aprender a identificar y eliminar ramas y frutos enfermos para reducir la incidencia de hongos.",
        "pasos": [
            "Identifica frutos con manchas o deformaciones.",
            "Corta y retira las ramas con Escoba de Bruja.",
            "Desinfecta las herramientas después de cada árbol.",
            "Deposita los restos lejos del cultivo para evitar reinfección."
        ],
        "practica": "Realiza una ronda de poda sanitaria en 10 árboles y registra los síntomas encontrados."
    },
    {
        "titulo": "Fertilización Orgánica Básica",
        "objetivo": "Aplicar abonos orgánicos para mejorar la salud y productividad del cacao.",
        "pasos": [
            "Recolecta compost, bocashi o biol disponible en la finca.",
            "Aplica el abono alrededor de la base del árbol, evitando el contacto directo con el tallo.",
            "Riega ligeramente para activar los microorganismos."
        ],
        "practica": "Prepara una mezcla de bocashi y aplícala en al menos 5 árboles jóvenes."
    },
    {
        "titulo": "Control Biológico de Plagas",
        "objetivo": "Fomentar el equilibrio ecológico y reducir el uso de químicos.",
        "pasos": [
            "Identifica hormigas y hongos benéficos en el cultivo.",
            "Instala trampas de feromonas o atrayentes naturales.",
            "Monitorea semanalmente la presencia de plagas y enemigos naturales."
        ],
        "practica": "Coloca al menos 2 trampas de feromonas y registra los insectos capturados."
    }
]

def obtener_curso_corto(indice):
    if 0 <= indice < len(CURSOS_CORTOS):
        return CURSOS_CORTOS[indice]
    return {"titulo": "No disponible", "objetivo": "", "pasos": [], "practica": ""}
