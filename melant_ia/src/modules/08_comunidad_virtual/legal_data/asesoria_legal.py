"""
Módulo de Asesoría Legal y Normativa — MELANT IA

- Proporciona orientación legal preventiva basada en el marco jurídico ecuatoriano.
- Integra COIP, Código Civil, Código del Trabajo y Ley de Tierras.
- Utiliza búsqueda semántica (RAG) para responder consultas legales citando artículos.
- Direcciona a usuarios a la justicia formal si el caso lo requiere.
- Incluye disclaimer obligatorio.
"""
import json
from pathlib import Path
import requests

ENLACES_LEYES = {
    "COIP": "https://www.funcionjudicial.gob.ec/pdf/COIP.pdf",
    "Código Civil": "https://www.funcionjudicial.gob.ec/pdf/Codigo_Civil.pdf",
    "Código del Trabajo": "https://www.trabajo.gob.ec/wp-content/uploads/2015/12/CODIGO-DEL-TRABAJO.pdf",
    "Registro Oficial": "https://www.registroficial.gob.ec/"
}

RUTA_LEYES = "conocimiento/leyes/"

def mostrar_disclaimer():
    print("\n⚠️ AVISO LEGAL: Esta es una orientación basada en IA. No sustituye el patrocinio de un abogado profesional. En casos penales, contacte inmediatamente a un profesional o a la Defensoría Pública.\n")

def cargar_base_legal():
    # Simulación: en producción, cargar desde base vectorial o archivos indexados
    leyes = {}
    for nombre, archivo in [
        ("COIP", "conocimiento/cerebro_legal.md"),
        ("Código Civil", "conocimiento/cerebro_legal.md"),
        ("Código del Trabajo", "conocimiento/cerebro_legal.md"),
        ("Ley de Tierras", "conocimiento/cerebro_legal.md")
    ]:
        if Path(archivo).exists():
            with open(archivo, "r", encoding="utf-8") as f:
                leyes[nombre] = f.read()
    return leyes

def buscar_articulo(consulta, leyes):
    # Simulación: búsqueda por palabras clave, en producción usar RAG/vectorial
    resultados = []
    for nombre, texto in leyes.items():
        if consulta.lower() in texto.lower():
            resultados.append((nombre, texto[:300]))
    return resultados

def asesorar_usuario():
    mostrar_disclaimer()
    leyes = cargar_base_legal()
    consulta = input("Describe tu consulta legal o normativa: ").strip()
    resultados = buscar_articulo(consulta, leyes)
    if resultados:
        print("\nRespuesta basada en la legislación ecuatoriana:")
        for nombre, fragmento in resultados:
            print(f"- {nombre}: {fragmento} ...")
        print("\nPara casos complejos o judiciales, acuda a un abogado o defensoría pública.")
    else:
        print("No se encontró un artículo relevante. Se recomienda consultar a un profesional.")
    input("Presiona Enter para continuar...")

def mostrar_directorio_justicia():
    print("\n=== DIRECTORIO DE JUSTICIA Y DEFENSORÍA ===")
    print("1. Buscar unidad judicial más cercana")
    print("2. Enlace a Defensoría Pública")
    print("3. Consultorios jurídicos gratuitos por provincia")
    print("4. Volver")
    opcion = input("Selecciona una opción: ").strip()
    if opcion == "1":
        print("(Simulación) Mostrando unidad judicial más cercana al GPS maestro...")
    elif opcion == "2":
        print("Enlace: https://www.defensoria.gob.ec/")
    elif opcion == "3":
        print("(Simulación) Listado de universidades con consultorios jurídicos gratuitos...")
    else:
        print("Volviendo al menú legal...")
    input("Presiona Enter para continuar...")

def auto_descargar_leyes():
    Path(RUTA_LEYES).mkdir(parents=True, exist_ok=True)
    for nombre, url in ENLACES_LEYES.items():
        if not url.endswith(".pdf"):
            continue  # Solo descarga PDFs
        destino = Path(RUTA_LEYES) / f"{nombre.replace(' ', '_')}.pdf"
        if destino.exists():
            print(f"{nombre} ya descargado.")
            continue
        print(f"Descargando {nombre}...")
        try:
            r = requests.get(url, timeout=30)
            if r.status_code == 200:
                with open(destino, "wb") as f:
                    f.write(r.content)
                print(f"Guardado en: {destino}")
            else:
                print(f"No se pudo descargar {nombre} (código {r.status_code})")
        except Exception as e:
            print(f"Error al descargar {nombre}: {e}")

def detectar_wifi():
    # Simulación: en producción, detectar conectividad real
    try:
        import socket
        socket.create_connection(("8.8.8.8", 53), timeout=2)
        return True
    except Exception:
        return False

def vectorizar_pdf(ruta_pdf):
    # Simulación: en producción, usar ServiceNow, Haystack, etc.
    print(f"Vectorizando {ruta_pdf} ... (simulado)")
    # Aquí se generaría el índice vectorial y se guardaría localmente
    idx_path = str(ruta_pdf) + ".vector.idx"
    with open(idx_path, "w", encoding="utf-8") as f:
        f.write("[Índice vectorial simulado]")
    print(f"Índice vectorial guardado en: {idx_path}")

def sincronizar_base_legal():
    if detectar_wifi():
        print("Wi-Fi detectado. Verificando actualizaciones legales...")
        auto_descargar_leyes()
        for pdf in Path(RUTA_LEYES).glob("*.pdf"):
            vectorizar_pdf(pdf)
        print("Base legal sincronizada y vectorizada para consultas offline.")
    else:
        print("No hay conexión Wi-Fi. Sincronización legal pospuesta.")

def menu_asesoria_legal():
    while True:
        print("\n=== ASESORÍA LEGAL Y NORMATIVA (ECUADOR) ===")
        print("1. Consulta legal o normativa")
        print("2. Directorio de justicia y defensoría")
        print("3. Descargar/actualizar base legal")
        print("4. Sincronizar y vectorizar base legal (Wi-Fi)")
        print("5. Volver al menú principal")
        opcion = input("Selecciona una opción: ").strip()
        if opcion == "1":
            asesorar_usuario()
        elif opcion == "2":
            mostrar_directorio_justicia()
        elif opcion == "3":
            auto_descargar_leyes()
        elif opcion == "4":
            sincronizar_base_legal()
        elif opcion == "5":
            break
        else:
            print("Opción no válida.")
