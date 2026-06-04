"""
Curso Práctico Escuela de Campo MELANTIA
Palma Africana y Híbrido OxG
"""
CURSOS = [
    {
        "titulo": "Manejo de Vivero y Siembra",
        "objetivos": [
            "Preparar sustrato y fundas correctamente",
            "Identificar plántulas sanas",
            "Realizar siembra y trasplante"
        ],
        "contenidos": [
            "Selección de semillas y germinación",
            "Preparación de sustrato (3:1:1)",
            "Control de malezas y riego",
            "Fertilización fraccionada en vivero"
        ]
    },
    {
        "titulo": "Fertilización y Nutrición",
        "objetivos": [
            "Aplicar dosis según edad y análisis foliar",
            "Reconocer síntomas de deficiencia de Boro y Magnesio"
        ],
        "contenidos": [
            "Plan de fertilización anual por edad",
            "Métodos de aplicación en campo",
            "Uso seguro de fertilizantes"
        ]
    },
    {
        "titulo": "Cosecha y Herramientas",
        "objetivos": [
            "Determinar el momento óptimo de cosecha",
            "Utilizar herramientas adecuadas para cada etapa"
        ],
        "contenidos": [
            "Criterios visuales de madurez",
            "Uso de cuchino malayo y carretillas",
            "Registro de rendimiento por lote"
        ]
    },
    {
        "titulo": "Sanidad y Manejo Integrado de Plagas",
        "objetivos": [
            "Identificar síntomas de PC y plagas clave",
            "Registrar y reportar monitoreos en la app"
        ],
        "contenidos": [
            "Síntomas visuales de Pudrición del Cogollo",
            "Monitoreo y control de Rhynchophorus palmarum",
            "Uso de la app para bitácora sanitaria"
        ]
    }
]

def mostrar_cursos():
    for curso in CURSOS:
        print(f"\n{curso['titulo']}")
        print("Objetivos:")
        for obj in curso['objetivos']:
            print(f"  - {obj}")
        print("Contenidos:")
        for cont in curso['contenidos']:
            print(f"  - {cont}")

if __name__ == "__main__":
    mostrar_cursos()
