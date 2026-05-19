"""
Curso Práctico MELANTIA: Aprovechamiento Integral del Limón Sutil
Incluye elaboración de extractos, zumos, rayado superficial y licores artesanales.
"""
CURSO_APROVECHAMIENTO_LIMON_SUTIL = {
    "titulo": "Aprovechamiento Integral del Limón Sutil: Extractos, Zumos y Licores",
    "objetivos": [
        "Conocer técnicas para obtener el máximo valor del fruto",
        "Aprender a elaborar extractos, zumos y licores artesanales",
        "Promover el valor agregado y la diversificación de productos"
    ],
    "contenidos": [
        "Extracción de zumo: selección de frutos, lavado, corte y prensado manual/mecánico",
        "Filtrado y conservación del zumo (pasteurización, refrigeración)",
        "Elaboración de extracto de aceite esencial: rayado superficial de la cáscara, extracción en frío o con solventes alimentarios",
        "Usos del aceite esencial: aromaterapia, repostería, limpieza",
        "Elaboración de licores artesanales: receta básica de limoncello (alcohol, cáscara, jarabe de azúcar)",
        "Buenas prácticas de higiene y seguridad alimentaria",
        "Empaque y etiquetado para venta local",
        "Referencia: FAO, Manual de Agroindustria Rural, INTA, Recetarios tradicionales"
    ],
    "logo": "assets/logo_melant_ia.png",
    "qr_validacion": "assets/qr_curso_aprovechamiento_limon.png",
    "link_app": "https://melant-ia.app"
}

def mostrar_curso_aprovechamiento_limon():
    print(f"\n{CURSO_APROVECHAMIENTO_LIMON_SUTIL['titulo']}")
    print("Objetivos:")
    for obj in CURSO_APROVECHAMIENTO_LIMON_SUTIL['objetivos']:
        print(f"  - {obj}")
    print("Contenidos:")
    for cont in CURSO_APROVECHAMIENTO_LIMON_SUTIL['contenidos']:
        print(f"  - {cont}")
    print(f"\nLogo: {CURSO_APROVECHAMIENTO_LIMON_SUTIL['logo']}")
    print(f"QR de validación: {CURSO_APROVECHAMIENTO_LIMON_SUTIL['qr_validacion']}")
    print(f"Link de la app: {CURSO_APROVECHAMIENTO_LIMON_SUTIL['link_app']}")

if __name__ == "__main__":
    mostrar_curso_aprovechamiento_limon()
