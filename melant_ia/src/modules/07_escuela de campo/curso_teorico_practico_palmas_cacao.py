"""
Cursos Teórico-Prácticos MELANTIA
Palma Africana y Cacao - Consulta y formación para asistentes técnicos
"""
CURSOS_TEORICO_PRACTICOS = [
    {
        "cultivo": "Palma Africana",
        "titulo": "Fisiología y Fenología de la Palma",
        "objetivos": [
            "Comprender las etapas BBCH y su importancia en manejo agronómico",
            "Relacionar la fenología con la programación de fertilización y cosecha"
        ],
        "contenidos": [
            "Escala BBCH para palma africana",
            "Relación entre fenología y prácticas culturales",
            "Ejercicios prácticos de identificación de estadios"
        ]
    },
    {
        "cultivo": "Palma Africana",
        "titulo": "Gestión Sostenible y Productividad",
        "objetivos": [
            "Aplicar buenas prácticas agrícolas para maximizar el rendimiento",
            "Implementar monitoreo y control fitosanitario integral"
        ],
        "contenidos": [
            "Planificación de labores culturales",
            "Uso de bitácoras y registros de campo",
            "Estudio de casos reales de manejo fitosanitario"
        ]
    },
    {
        "cultivo": "Cacao",
        "titulo": "Manejo Integrado de Plagas y Enfermedades en Cacao",
        "objetivos": [
            "Identificar síntomas de las principales enfermedades y plagas",
            "Aplicar estrategias de control químico y biológico"
        ],
        "contenidos": [
            "Diagnóstico visual de Moniliasis, Mazorca Negra y Escoba de Bruja",
            "Control de Monalonion y Mazorquero",
            "Prácticas regenerativas y sostenibles"
        ]
    },
    {
        "cultivo": "Cacao",
        "titulo": "Agroforestería y Nutrición del Suelo",
        "objetivos": [
            "Diseñar sistemas agroforestales para cacao",
            "Optimizar la nutrición del suelo con bioinsumos"
        ],
        "contenidos": [
            "Principios de agroforestería",
            "Preparación y uso de compost y bioinsumos",
            "Evaluación de la salud del suelo en campo"
        ]
    },
    {
        "cultivo": "Cacao",
        "titulo": "Poda de Formación, Mantenimiento y Rehabilitación en Cacao",
        "objetivos": [
            "Reconocer los tipos de poda y su momento óptimo",
            "Aplicar técnicas correctas para mejorar la sanidad y productividad",
            "Evitar errores comunes que favorecen enfermedades"
        ],
        "contenidos": [
            "Tipos de poda: formación, mantenimiento, fitosanitaria y rehabilitación",
            "Épocas recomendadas según el ciclo de lluvias",
            "Herramientas y desinfección",
            "Secuencia práctica de corte y eliminación de ramas",
            "Errores frecuentes y cómo evitarlos",
            "Relación entre poda y control de Moniliasis/Escoba de Bruja",
            "Video: Poda de formación en cacao - https://www.youtube.com/watch?v=EjemploPodaFormacionCacao",
            "Video: Poda de mantenimiento y rehabilitación en cacao - https://www.youtube.com/watch?v=EjemploPodaMantenimientoCacao"
        ]
    }
]

def mostrar_cursos_teorico_practicos(filtro_cultivo=None):
    print("\n=== Cursos Teórico-Prácticos MELANTIA ===")
    for curso in CURSOS_TEORICO_PRACTICOS:
        if filtro_cultivo and curso["cultivo"].lower() != filtro_cultivo.lower():
            continue
        print(f"\n{curso['cultivo']} - {curso['titulo']}")
        print("Objetivos:")
        for obj in curso['objetivos']:
            print(f"  - {obj}")
        print("Contenidos:")
        for cont in curso['contenidos']:
            print(f"  - {cont}")
    try:
        from curso_teorico_practico_limon_sutil import mostrar_cursos_limon_sutil
        if not filtro_cultivo or filtro_cultivo.lower() in ["limon", "limón sutil", "limón", "limon sutil"]:
            mostrar_cursos_limon_sutil()
    except ImportError:
        pass

if __name__ == "__main__":
    mostrar_cursos_teorico_practicos()
