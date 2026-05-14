"""
Módulo de Diagnóstico Visual MELANT IA
Permite al usuario seleccionar síntomas o cargar una imagen para recibir orientación técnica.
"""
import json

# Cargar tabla de síntomas
SINTOMAS_PATH = "tabla_comparativa_sintomas.csv"

# Cargar recursos multimedia
MULTIMEDIA_PATH = "recursos_multimedia.json"

def diagnostico_por_sintoma():
    print("\n=== Diagnóstico por Síntoma Visual ===")
    sintomas = []
    try:
        with open(SINTOMAS_PATH, encoding="utf-8") as f:
            next(f)  # Saltar encabezado
            for linea in f:
                partes = linea.strip().split(",")
                if len(partes) > 1:
                    sintomas.append((partes[0], partes[1], partes[2], partes[3]))
    except Exception as e:
        print(f"No se pudo cargar la tabla de síntomas: {e}")
        return
    for idx, sint in enumerate(sintomas, 1):
        print(f"{idx}. {sint[1]} ({sint[0]})")
    opcion = input("Selecciona el síntoma que observas (número): ")
    if opcion.isdigit():
        opcion = int(opcion)
        if 1 <= opcion <= len(sintomas):
            print(f"\nDiagnóstico sugerido: {sintomas[opcion-1][0]}")
            print(f"Dónde buscar: {sintomas[opcion-1][2]}")
            print(f"Referencia: {sintomas[opcion-1][3]}")
        else:
            print("Opción no válida.")
    else:
        print("Entrada no válida.")

def mostrar_imagenes_referencia():
    print("\n=== Imágenes de Referencia ===")
    try:
        with open(MULTIMEDIA_PATH, encoding="utf-8") as f:
            recursos = json.load(f)
        for rec in recursos:
            if rec["tipo"] == "imagen":
                print(f"- {rec['tema']}: {rec['descripcion']} (Archivo: {rec['archivo']})")
    except Exception as e:
        print(f"No se pudieron cargar las imágenes: {e}")

def diagnostico_visual():
    print("\n=== Módulo de Diagnóstico Visual MELANT IA ===")
    print("1. Diagnóstico por síntoma visual")
    print("2. Ver imágenes de referencia")
    print("0. Salir")
    opcion = input("Selecciona una opción: ")
    if opcion == "1":
        diagnostico_por_sintoma()
    elif opcion == "2":
        mostrar_imagenes_referencia()
    elif opcion == "0":
        print("Saliendo del diagnóstico visual.")
    else:
        print("Opción no válida.")

if __name__ == "__main__":
    diagnostico_visual()
