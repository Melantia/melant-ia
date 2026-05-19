"""
Cursos Teórico-Prácticos MELANTIA: Limón Sutil (Citrus aurantifolia)
Incluye manejo agronómico, fitosanitario, cosecha, sostenibilidad y referencias técnicas.
"""
CURSOS_LIMON_SUTIL = [
    {
        "titulo": "Manejo Agronómico: Siembra, Poda y Fertilización",
        "objetivos": [
            "Conocer el proceso óptimo de siembra y trasplante",
            "Aplicar técnicas de poda de formación y fructificación",
            "Planificar la fertilización anual según análisis de suelo"
        ],
        "contenidos": [
            "Siembra: distancias recomendadas (5x5 m), época ideal (fin de lluvias)",
            "Poda: formación en los 2 primeros años, luego poda de fructificación y sanitaria",
            "Fertilización: NPK + Ca + Mg según análisis, fraccionada en 3-4 aplicaciones/año",
            "Referencia: Manual Técnico de Citricultura, INTA Argentina; FAO"
        ]
    },
    {
        "titulo": "Plagas y Enfermedades Comunes",
        "objetivos": [
            "Identificar síntomas de minador, ácaros, gomosis y otras enfermedades",
            "Aplicar controles integrados y monitoreo regular"
        ],
        "contenidos": [
            "Minador de la hoja (Phyllocnistis citrella): galerías en hojas jóvenes",
            "Ácaros (Brevipalpus, Tetranychus): bronceado y deformación de frutos",
            "Gomosis (Phytophthora spp.): exudado gomoso en tronco, necrosis",
            "Control: podas sanitarias, trampas cromáticas, aplicaciones de azufre y extractos vegetales",
            "Referencia: Guía de Plagas y Enfermedades de Cítricos, SENASA Perú; FAO"
        ]
    },
    {
        "titulo": "Cosecha y Poscosecha",
        "objetivos": [
            "Determinar el momento óptimo de cosecha",
            "Aplicar buenas prácticas de manipulación y almacenamiento"
        ],
        "contenidos": [
            "Cosecha: frutos de color verde brillante, firmeza y tamaño comercial",
            "Corte manual con tijeras limpias, evitar daños en la piel",
            "Poscosecha: lavado, desinfección, clasificación y empaque en cajas ventiladas",
            "Referencia: Manual de Cosecha y Poscosecha de Cítricos, INIA Uruguay; FAO"
        ]
    },
    {
        "titulo": "Requerimientos de Suelo y Clima",
        "objetivos": [
            "Seleccionar suelos y clima óptimos para el cultivo",
            "Prevenir problemas de salinidad y encharcamiento"
        ],
        "contenidos": [
            "Suelos: francos, bien drenados, pH 5.5-7.0, evitar suelos salinos",
            "Clima: temperaturas 20-32°C, lluvias 1000-2000 mm/año, evitar heladas",
            "Preparación del terreno y manejo de microcuencas",
            "Referencia: FAO, Manual Técnico de Citricultura INTA"
        ]
    },
    {
        "titulo": "Manejo Sostenible y Control Biológico",
        "objetivos": [
            "Implementar prácticas regenerativas y reducir agroquímicos",
            "Fomentar control biológico y biodiversidad en la finca"
        ],
        "contenidos": [
            "Coberturas vivas (leguminosas) y abonos verdes",
            "Uso de biopreparados: extracto de ajo, neem, jabón potásico",
            "Liberación de enemigos naturales (Coccinélidos, crisopas)",
            "Rotación de cultivos y manejo integrado de plagas",
            "Referencia: FAO, Manual de Agricultura Ecológica, INTA"
        ]
    },
    {
        "titulo": "Manejo Regenerativo y Prácticas Agroecológicas en Limón Sutil",
        "objetivos": [
            "Restaurar la salud del suelo y biodiversidad",
            "Reducir el uso de agroquímicos mediante prácticas regenerativas",
            "Implementar bioinsumos y manejo integrado de plagas"
        ],
        "contenidos": [
            "Coberturas vivas y abonos verdes (leguminosas, gramíneas)",
            "Compostaje y biofertilizantes líquidos (Bocashi, té de compost)",
            "Uso de biopreparados: extracto de ajo, ají, neem, microorganismos de montaña",
            "Asociación con cultivos repelentes y plantas polinizadoras",
            "Rotación de cultivos y manejo de residuos orgánicos",
            "Referencia: FAO, Manual de Agricultura Ecológica, INTA, Red de Agricultura Regenerativa"
        ]
    }
]

def mostrar_cursos_limon_sutil():
    print("\n=== Cursos Teórico-Prácticos MELANTIA: Limón Sutil ===")
    for curso in CURSOS_LIMON_SUTIL:
        print(f"\n{curso['titulo']}")
        print("Objetivos:")
        for obj in curso['objetivos']:
            print(f"  - {obj}")
        print("Contenidos:")
        for cont in curso['contenidos']:
            print(f"  - {cont}")
    try:
        from curso_practico_regenerativo_limon_sutil import mostrar_curso_regenerativo_limon
        mostrar_curso_regenerativo_limon()
    except ImportError:
        pass
    try:
        from curso_aprovechamiento_limon_sutil import mostrar_curso_aprovechamiento_limon
        mostrar_curso_aprovechamiento_limon()
    except ImportError:
        pass

if __name__ == "__main__":
    mostrar_cursos_limon_sutil()
