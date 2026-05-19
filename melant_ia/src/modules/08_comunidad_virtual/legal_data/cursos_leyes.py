_fuente_ = "Ley de Sanidad Agropecuaria - Agrocalidad"

def validar_normativa(accion):
    normas = {
        "movilizacion": "Se requiere guía de remisión oficial.",
        "exportacion": "Certificado fitosanitario de exportación es obligatorio."
    }
    return normas.get(accion, "Consulta con un técnico local para este trámite.")
"""
Módulo: Cursos Gratuitos de Leyes para la Escuela MELANT IA

- Ofrece cursos básicos de leyes ecuatorianas (COIP, Civil, Trabajo, Tierras) en formato accesible.
- Permite descargar el contenido y obtener un QR para compartir o imprimir.
"""
import qrcode
from pathlib import Path
from datetime import datetime
import os
import random
import time

CURSOS = [
    {
        "titulo": "Introducción al COIP (Código Orgánico Integral Penal)",
        "descripcion": "Aprende los conceptos básicos del COIP, delitos, contravenciones y derechos ciudadanos.",
        "contenido": "El COIP regula los delitos, contravenciones y sanciones en Ecuador. Ejemplos: robo, amenazas, violencia intrafamiliar, etc. Todo ciudadano debe conocer sus derechos y deberes penales."
    },
    {
        "titulo": "Derechos y Contratos en el Código Civil",
        "descripcion": "Conoce cómo proteger tu propiedad, contratos y resolver conflictos de linderos.",
        "contenido": "El Código Civil regula la propiedad, contratos, arrendamientos y linderos. Ejemplo: cómo hacer un contrato de arriendo, qué hacer ante un conflicto de linderos, etc."
    },
    {
        "titulo": "Normas Laborales para el Campo",
        "descripcion": "Derechos y obligaciones de empleadores y trabajadores agrícolas según el Código de Trabajo.",
        "contenido": "El Código de Trabajo protege a jornaleros y empleadores. Temas: salario mínimo, jornada laboral, vacaciones, seguridad social, etc."
    },
    {
        "titulo": "Legalidad de Tierras y Territorios",
        "descripcion": "Aprende sobre la Ley de Tierras y cómo validar la legalidad de tu predio.",
        "contenido": "La Ley Orgánica de Tierras regula la tenencia, uso y legalidad de predios rurales. Importante para evitar conflictos y acceder a créditos o programas estatales."
    }
]

def descargar_curso(curso):
    carpeta = Path("cursos_leyes")
    carpeta.mkdir(exist_ok=True)
    nombre = curso["titulo"].replace(" ", "_")
    archivo = carpeta / f"{nombre}_{datetime.now().strftime('%Y%m%d_%H%M')}.txt"
    with open(archivo, "w", encoding="utf-8") as f:
        f.write(f"{curso['titulo']}\n\n{curso['descripcion']}\n\n{curso['contenido']}")
    print(f"Curso guardado en: {archivo}")
    return archivo

def generar_qr_curso(archivo):
    with open(archivo, "r", encoding="utf-8") as f:
        texto = f.read()
    qr_path = str(archivo) + ".qr.png"
    img = qrcode.make(texto)
    img.save(qr_path)
    print(f"QR generado en: {qr_path}")

def menu_cursos_leyes():
    while True:
        print("\n=== CURSOS GRATUITOS DE LEYES (MELANT IA) ===")
        for i, curso in enumerate(CURSOS, 1):
            print(f"{i}. {curso['titulo']} — {curso['descripcion']}")
        print(f"{len(CURSOS)+1}. Volver al menú principal")
        opcion = input("Seleccione un curso para descargar y obtener QR: ").strip()
        if opcion.isdigit() and 1 <= int(opcion) <= len(CURSOS):
            idx = int(opcion)-1
            archivo = descargar_curso(CURSOS[idx])
            generar_qr_curso(archivo)
            input("Presiona Enter para continuar...")
        elif opcion == str(len(CURSOS)+1):
            break
        else:
            print("Opción no válida.")

def menu_cursos_agricolas():
    print("\n=== ESCUELA AGRÍCOLA MELANT IA ===")
    print("1. Curso de Bioclimatología (GRATIS)")
    print("2. Curso de Fisiología Vegetal (PREMIUM)")
    print("3. Volver")
    opcion = input("Selecciona una opción: ").strip()
    if opcion == "1":
        mostrar_curso("conocimiento/curso_bioclimatologia.md", gratis=True)
    elif opcion == "2":
        mostrar_curso("conocimiento/curso_fisiologia_vegetal.md", gratis=False)
    else:
        print("Volviendo...")

def mostrar_curso(ruta, gratis=True):
    print("\n=== CURSO ===")
    if not gratis:
        print("Este curso es PREMIUM. Solicita tu acceso en melantia.ec o con tu asesor técnico.")
        return
    try:
        with open(ruta, "r", encoding="utf-8") as f:
            print(f.read())
    except Exception:
        print("No se pudo cargar el curso.")

def menu_cursos_escuela_campo():
    print("\n=== ESCUELA DE CAMPO MELANT IA ===")
    # Listar cursos gratuitos y de pago
    ruta_cursos = "conocimiento/cursos_escuela_campo"
    cursos = [f for f in os.listdir(ruta_cursos) if f.endswith(".md")]
    cursos_gratis = [c for c in cursos if "gratis" in c or "diy" in c or "basico" in c or "integrado" in c or "organico" in c]
    cursos_pago = [c for c in cursos if c not in cursos_gratis]
    # Alternar 4 cursos aleatorios por semana
    semana = int(time.time() // (7*24*3600))
    random.seed(semana)
    mostrar_gratis = random.sample(cursos_gratis, min(4, len(cursos_gratis)))
    mostrar_pago = random.sample(cursos_pago, min(4, len(cursos_pago)))
    print("\n--- Cursos Gratuitos de la Semana ---")
    for idx, c in enumerate(mostrar_gratis, 1):
        print(f"{idx}. {c.replace('_',' ').replace('.md','').capitalize()} (GRATIS)")
    print("\n--- Cursos Premium de la Semana ---")
    for idx, c in enumerate(mostrar_pago, 1):
        print(f"{idx+4}. {c.replace('_',' ').replace('.md','').capitalize()} (PREMIUM)")
    print("9. Volver")
    opcion = input("Selecciona un curso para ver detalles: ").strip()
    if opcion.isdigit():
        opcion = int(opcion)
        if 1 <= opcion <= len(mostrar_gratis):
            mostrar_curso(os.path.join(ruta_cursos, mostrar_gratis[opcion-1]), gratis=True)
        elif 5 <= opcion <= 4+len(mostrar_pago):
            mostrar_curso(os.path.join(ruta_cursos, mostrar_pago[opcion-5]), gratis=False)
        else:
            print("Opción no válida.")
    else:
        print("Volviendo...")
