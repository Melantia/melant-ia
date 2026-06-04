import os
import json

def centralizar_conocimiento_melantia():
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    SEED_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "..", "knowledge_seeds", "03_asistente_tecnico_veterinario"))
    SEED_CULTIVOS_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "..", "knowledge_seeds", "02_asistente_tecnico_rural", "asistente_tecnico_cultivos"))

    mapa_global = {
        "expertos": {
            "valentina": {"area": "Medicina Veterinaria", "activo": True},
            "fabrizio": {"area": "Agricultura de Precisión y GPS", "activo": True},
            "jorge": {"area": "Manejo y Producción Bovino", "activo": True},
            "angel": {"area": "Gestión Financiera, Costos y Trazabilidad", "activo": True}
        },
        "imagenes_veterinaria": {},
        "guias_clinicas_md": {},
        "modelos_costos_json": {},
        "cultivos_indexados": {}
    }

    # 1. Valentina: Escaneo de los 252 MB de fotos reales de enfermedades
    ruta_fotos = os.path.join(SEED_DIR, "Dataset_Optimizado")
    print("[VALENTINA] Buscando imágenes clínicas en el dataset...")
    if os.path.exists(ruta_fotos):
        for carpeta in os.listdir(ruta_fotos):
            ruta_cap = os.path.join(ruta_fotos, carpeta)
            if os.path.isdir(ruta_cap) and not carpeta.endswith("_only") and carpeta != ".venv":
                fotos = [f for f in os.listdir(ruta_cap) if f.lower().endswith((".jpg", ".png", ".jpeg"))]
                if len(fotos) > 0:
                    mapa_global["imagenes_veterinaria"][carpeta] = {
                        "total": len(fotos),
                        "directorio": ruta_cap
                    }
        print(f"   -> Éxito: {len(mapa_global['imagenes_veterinaria'])} clases de enfermedad indexadas.")

    # 2. Fabrizio y Jorge: Carga de guías clínicas y operativas (.md)
    print("\n[FABRIZIO Y JORGE] Cargando manuales de campo y agricultura...")
    if os.path.exists(SEED_DIR):
        for archivo in os.listdir(SEED_DIR):
            if archivo.endswith('.md'):
                try:
                    with open(os.path.join(SEED_DIR, archivo), 'r', encoding='utf-8') as f:
                        mapa_global["guias_clinicas_md"][archivo] = f.read()
                    print(f"   -> Manual cargado: {archivo}")
                except Exception as e:
                    print(f"   -> Error leyendo {archivo}: {e}")

    # 3. Ángel: Absorción de estructuras financieras y costos (.json)
    print("\n[ÁNGEL] Cargando estructuras de presupuestos y balances...")
    for archivo in os.listdir(BASE_DIR):
        if archivo.endswith('.json') and "structure" not in archivo:
            try:
                with open(os.path.join(BASE_DIR, archivo), 'r', encoding='utf-8') as f:
                    mapa_global["modelos_costos_json"][archivo] = json.load(f)
                print(f"   -> Archivo financiero cargado: {archivo}")
            except Exception as e:
                print(f"   -> Error leyendo {archivo}: {e}")

    # 3B. Indice de cultivos para nexo dinamico foto/voz en ID2
    print("\n[ID2 CULTIVOS] Indexando archivos de cultivos para navegacion dinamica...")
    if os.path.exists(SEED_CULTIVOS_DIR):
        for archivo in os.listdir(SEED_CULTIVOS_DIR):
            if not (archivo.startswith("cultivos_") and archivo.endswith('.json')):
                continue
            ruta = os.path.join(SEED_CULTIVOS_DIR, archivo)
            try:
                with open(ruta, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                clave = os.path.splitext(archivo)[0].replace('cultivos_', '')
                nombre_visible = clave.replace('_', ' ').title()
                mapa_global["cultivos_indexados"][clave] = {
                    "archivo": archivo,
                    "nombre": nombre_visible,
                    "ruta": os.path.relpath(ruta, os.path.join(BASE_DIR, "..", "..")).replace('\\\\', '/'),
                    "claves": list(data.keys()) if isinstance(data, dict) else []
                }
            except Exception as e:
                print(f"   -> Error indexando cultivo {archivo}: {e}")
        print(f"   -> Cultivos indexados: {len(mapa_global['cultivos_indexados'])}")
    else:
        print("   -> Directorio de cultivos no encontrado.")

    # 4. Guardar el archivo indexado final para uso de la app
    rutas_salida = [
        os.path.join(BASE_DIR, "conocimiento_comite_global.json"),
        os.path.join(BASE_DIR, "..", "..", "knowledge_seeds", "02_asistente_tecnico_rural", "conocimiento_comite_global.json"),
    ]

    for ruta_salida in rutas_salida:
        try:
            os.makedirs(os.path.dirname(os.path.abspath(ruta_salida)), exist_ok=True)
            with open(ruta_salida, 'w', encoding='utf-8') as f:
                json.dump(mapa_global, f, indent=4, ensure_ascii=False)
            print(f"   -> Consolidado guardado: {ruta_salida}")
        except Exception as e:
            print(f"   -> Error guardando consolidado en {ruta_salida}: {e}")

    print("\n[ÉXITO DE JUNTA] Conocimiento consolidado para el Comité de Expertos.")

if __name__ == "__main__":
    print("=== CONFIGURACIÓN CENTRALIZADA DEL COMITÉ DE EXPERTOS - MELANTIA ===\n")
    centralizar_conocimiento_melantia()
