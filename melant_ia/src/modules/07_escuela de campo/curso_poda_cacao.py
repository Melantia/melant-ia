"""
Curso Práctico MELANTIA: Poda en Cacao
"""
CURSO_PODA_CACAO = {
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
        "Relación entre poda y control de Moniliasis/Escoba de Bruja"
    ]
}

def mostrar_curso_poda_cacao():
    print(f"\n{CURSO_PODA_CACAO['titulo']}")
    print("Objetivos:")
    for obj in CURSO_PODA_CACAO['objetivos']:
        print(f"  - {obj}")
    print("Contenidos:")
    for cont in CURSO_PODA_CACAO['contenidos']:
        print(f"  - {cont}")

if __name__ == "__main__":
    mostrar_curso_poda_cacao()
