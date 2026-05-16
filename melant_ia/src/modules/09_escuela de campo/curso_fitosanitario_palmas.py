"""
Curso Práctico Escuela de Campo MELANTIA
Manejo Fitosanitario Integral de Palma Africana
"""
CURSO_FITOSANITARIO = [
    {
        "titulo": "Manejo Cultural y Prevención",
        "objetivos": [
            "Mantener el plato libre de malezas",
            "Realizar podas de mantenimiento correctas",
            "Fomentar coberturas vivas (Kudzu)"
        ],
        "contenidos": [
            "Desmalezado manual y químico",
            "Reglas de poda: máximo 2 hojas verdes bajo racimo",
            "Beneficios de la cobertura de Kudzu"
        ]
    },
    {
        "titulo": "Control de Enfermedades Críticas",
        "objetivos": [
            "Identificar síntomas de PC, Marchitez y Anillo Rojo",
            "Aplicar protocolos de cirugía y erradicación"
        ],
        "contenidos": [
            "Síntomas visuales y manejo de PC",
            "Control de Marchitez Sorpresiva y Anillo Rojo",
            "Uso de la app para registro de intervenciones"
        ]
    },
    {
        "titulo": "Manejo Integrado de Plagas",
        "objetivos": [
            "Detectar y monitorear plagas clave",
            "Implementar trampeo y control biológico"
        ],
        "contenidos": [
            "Trampeo masivo de picudo",
            "Control biológico de gusano de canasta",
            "Manejo de chinche de encaje"
        ]
    }
]

def mostrar_curso_fitosanitario():
    for curso in CURSO_FITOSANITARIO:
        print(f"\n{curso['titulo']}")
        print("Objetivos:")
        for obj in curso['objetivos']:
            print(f"  - {obj}")
        print("Contenidos:")
        for cont in curso['contenidos']:
            print(f"  - {cont}")

if __name__ == "__main__":
    mostrar_curso_fitosanitario()
