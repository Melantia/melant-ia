"""
Curso Práctico MELANTIA: Agricultura Regenerativa en Limón Sutil
Incluye transición, implementación, beneficios económicos y manual de prácticas.
"""
CURSO_REGENERATIVO_LIMON_SUTIL = {
    "titulo": "Transición y Prácticas de Agricultura Regenerativa en Limón Sutil",
    "objetivos": [
        "Comprender el proceso de transición del manejo convencional al regenerativo",
        "Implementar prácticas regenerativas para restaurar suelo y biodiversidad",
        "Calcular el ahorro económico y los beneficios a mediano plazo"
    ],
    "contenidos": [
        "¿Qué es la agricultura regenerativa? Principios y diferencias con el manejo convencional",
        "Diagnóstico inicial: análisis de suelo, biodiversidad y uso de insumos",
        "Transición: reducción progresiva de agroquímicos, introducción de coberturas vivas y abonos verdes",
        "Implementación: compostaje, biofertilizantes líquidos, biopreparados (ajo, ají, neem)",
        "Asociación con cultivos repelentes y plantas polinizadoras",
        "Rotación de cultivos y manejo de residuos orgánicos",
        "Monitoreo de indicadores: materia orgánica, infiltración, biodiversidad de insectos",
        "Cálculo de ahorro: reducción de fertilizantes y pesticidas, menor gasto en riego y control de malezas",
        "Estudio de caso: finca que redujo 40% sus costos en 3 años tras la transición",
        "Manual práctico: recetas de bioinsumos, calendario de labores regenerativas, registro de indicadores"
    ],
    "referencias": [
        "FAO: Manual de Agricultura Ecológica y Regenerativa",
        "Red de Agricultura Regenerativa Latinoamérica",
        "INTA: Guía de Buenas Prácticas en Cítricos"
    ],
    "logo": "assets/logo_melant_ia.png",
    "qr_validacion": "assets/qr_curso_regenerativo_limon.png",
    "link_app": "https://melant-ia.app"
}

def mostrar_curso_regenerativo_limon():
    print(f"\n{CURSO_REGENERATIVO_LIMON_SUTIL['titulo']}")
    print("Objetivos:")
    for obj in CURSO_REGENERATIVO_LIMON_SUTIL['objetivos']:
        print(f"  - {obj}")
    print("Contenidos:")
    for cont in CURSO_REGENERATIVO_LIMON_SUTIL['contenidos']:
        print(f"  - {cont}")
    print("\nReferencias:")
    for ref in CURSO_REGENERATIVO_LIMON_SUTIL['referencias']:
        print(f"  - {ref}")
    print(f"\nLogo: {CURSO_REGENERATIVO_LIMON_SUTIL['logo']}")
    print(f"QR de validación: {CURSO_REGENERATIVO_LIMON_SUTIL['qr_validacion']}")
    print(f"Link de la app: {CURSO_REGENERATIVO_LIMON_SUTIL['link_app']}")

if __name__ == "__main__":
    mostrar_curso_regenerativo_limon()
