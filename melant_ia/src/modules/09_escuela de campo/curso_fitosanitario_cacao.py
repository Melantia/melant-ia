"""
Curso Práctico Escuela de Campo MELANTIA
Manejo Fitosanitario Integral de Cacao
"""
CURSO_FITOSANITARIO_CACAO = [
    {
        "titulo": "Identificación de Enfermedades Fúngicas",
        "objetivos": [
            "Reconocer síntomas de Moniliasis, Mazorca Negra y Escoba de Bruja",
            "Diferenciar daño fúngico de daño por insectos"
        ],
        "contenidos": [
            "Síntomas visuales de Moniliasis (puntos amarillos, polvo blanco)",
            "Mazorca Negra: manchas café y pudrición rápida",
            "Escoba de Bruja: brotes deformes y escobas"
        ]
    },
    {
        "titulo": "Manejo Integrado de Plagas",
        "objetivos": [
            "Identificar daño de Monalonion y Mazorquero",
            "Aplicar control biológico y químico según umbral"
        ],
        "contenidos": [
            "Síntomas de chinche (pústulas negras, brotes quemados)",
            "Daño de Mazorquero (excrementos, galerías en mazorca)",
            "Uso de Beauveria, trampas y parasitoides"
        ]
    },
    {
        "titulo": "Enfoque Regenerativo y Sostenible",
        "objetivos": [
            "Implementar agroforestería y bioinsumos",
            "Aprovechar residuos para compost y abonos orgánicos"
        ],
        "contenidos": [
            "Diseño agroforestal con árboles de sombra",
            "Preparación y uso de bioinsumos (ají-ajo, Trichoderma)",
            "Manejo de frutos enfermos para compost"
        ]
    }
]

def mostrar_curso_fitosanitario_cacao():
    for curso in CURSO_FITOSANITARIO_CACAO:
        print(f"\n{curso['titulo']}")
        print("Objetivos:")
        for obj in curso['objetivos']:
            print(f"  - {obj}")
        print("Contenidos:")
        for cont in curso['contenidos']:
            print(f"  - {cont}")

if __name__ == "__main__":
    mostrar_curso_fitosanitario_cacao()
