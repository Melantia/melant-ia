import os
import json

def centralizar_conocimiento_melantia():
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    SEED_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "..", "knowledge_seeds", "03_asistente_tecnico_veterinario"))

    mapa_global = {
        "expertos": {
            "valentina": {"area": "Medicina Veterinaria", "activo": True},
            "fabrizio": {"area": "Agricultura de Precisión y GPS", "activo": True},
            "jorge": {"area": "Manejo y Producción Bovino", "activo": True},
            "angel": {"area": "Gestión Financiera, Costos y Trazabilidad", "activo": True}
        },
        "imagenes_veterinaria": {},
        "guias_clinicas_md": {},
        "modelos_costos_json": {}
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

    # 4. Guardar el archivo indexado final para uso de la app
    ruta_salida = os.path.join(BASE_DIR, "conocimiento_comite_global.json")
    with open(ruta_salida, 'w', encoding='utf-8') as f:
        json.dump(mapa_global, f, indent=4, ensure_ascii=False)
    
    print(f"\n[ÉXITO DE JUNTA] Conocimiento consolidado para el Comité de Expertos en: {ruta_salida}")

if __name__ == "__main__":
    print("=== CONFIGURACIÓN CENTRALIZADA DEL COMITÉ DE EXPERTOS - MELANTIA ===\n")
    centralizar_conocimiento_melantia()
