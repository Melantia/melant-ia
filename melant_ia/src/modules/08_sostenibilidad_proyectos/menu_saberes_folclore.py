"""
Menú principal para el Proyecto de Saberes y Folclore Ecuatoriano en MELANT IA.
Permite seleccionar región, idioma y escuchar/compartir historias aleatorias o por comando.
"""
import sys
from aprendizaje_melant_ia.proyecto_saberes_folclore import procesar_comando, historia_aleatoria, IDIOMAS

def menu_saberes_folclore(idioma):
    while True:
        print("\n=== PROYECTO DE SABERES Y FOLCLORE ECUATORIANO ===")
        print("1. Historia aleatoria (cualquier región)")
        print("2. Historia de la Costa (Manabita)")
        print("3. Historia de la Sierra")
        print("4. Historia del Oriente (Amazonía)")
        print("5. Pedir una historia por comando (voz o texto)")
        print("6. Volver al menú principal")
        opcion = input("Selecciona una opción: ").strip()
        if opcion == "1":
            region = None
        elif opcion == "2":
            region = "costa"
        elif opcion == "3":
            region = "sierra"
        elif opcion == "4":
            region = "oriente"
        elif opcion == "5":
            comando = input("¿Qué historia quieres escuchar o leer?: ")
            historia, region = procesar_comando(comando, idioma)
            print(f"[{region.upper()}] {historia['texto']}")
            continue
        elif opcion == "6":
            break
        else:
            print("Opción no válida.")
            continue
        if region:
            historia = historia_aleatoria(region, idioma)
        else:
            import random
            region = random.choice(["costa", "sierra", "oriente"])
            historia = historia_aleatoria(region, idioma)
        print(f"[{region.upper()}] {historia['texto']}")
        # Aquí puedes llamar a escuchar_historia(historia) o generar_imagen_historia(historia, ...)
