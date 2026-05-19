
import os
import json

def cargar_imagenes(rutas):
    imagenes = {}
    for ruta in rutas:
        imagenes[ruta] = []
        for root, _, files in os.walk(ruta):
            for file in files:
                if file.lower().endswith((".jpg", ".jpeg", ".png")):
                    imagenes[ruta].append(os.path.join(root, file))
    return imagenes

def cargar_json(rutas):
    """Carga archivos JSON de rutas dadas con manejo de errores."""
    datos = {}
    for ruta in rutas:
        if os.path.isfile(ruta) and ruta.endswith('.json'):
            try:
                with open(ruta, 'r', encoding='utf-8') as f:
                    datos[os.path.basename(ruta)] = json.load(f)
            except Exception as e:
                datos[os.path.basename(ruta)] = f"Error: {str(e)}"
    return datos

def cargar_markdown(rutas):
    """Carga archivos Markdown de rutas dadas con manejo de errores."""
    docs = {}
    for ruta in rutas:
        if os.path.isfile(ruta) and ruta.endswith('.md'):
            try:
                with open(ruta, 'r', encoding='utf-8') as f:
                    docs[os.path.basename(ruta)] = f.read()
            except Exception as e:
                docs[os.path.basename(ruta)] = f"Error: {str(e)}"
    return docs

def cargar_conocimiento():
    rutas_imagenes = [
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_tecnico_veterinario/Dataset_Optimizado/OjoRosado_IBK",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_tecnico_veterinario/Dataset_Optimizado/Otros",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_tecnico_veterinario/Dataset_Optimizado/Test_Images",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_tecnico_veterinario/Dataset_Optimizado/Aftosa_FMD",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_tecnico_veterinario/Dataset_Optimizado/Dermatosis_LSD"
    ]
    rutas_json = [
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_tecnico_veterinario/biotecnologia_ganadera_es.json",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_tecnico_veterinario/bovinos.json",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_tecnico_veterinario/Como Mejorar la Alimentacion y Nutricion de mi Ganado Porcino.json",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_tecnico_veterinario/Como Mejorar la Alimentacion y Nutricion de mi Hato Bovino.json",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_tecnico_veterinario/Como Mejorar la Produccion de Carne de mi Ganado Bovino.json",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_tecnico_veterinario/Como Mejorar la Produccion de Leche de mi Ganado Bovino.json",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_tecnico_veterinario/Conservacion de Forrajes.json",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_tecnico_veterinario/El Ordeño y Sanidad de la Leche.json",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_tecnico_veterinario/fichas_respuesta_rapida.json",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_tecnico_veterinario/functions.json",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_tecnico_veterinario/ganaderia_regenerativa_es.json",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_tecnico_veterinario/Integracion del Sistema Silvopastoril.json",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_tecnico_veterinario/normativas_caballo_paso_fino.json",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_tecnico_veterinario/porcinos.json",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_tecnico_veterinario/protocolo_recoleccion_placenta.json",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_tecnico_veterinario/Reproduccion y Mejoramiento Genetico del Ganado Bovino.json",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_tecnico_veterinario/Sanidad, Bienestar y Manejo Animal del Ganado Bovino.json",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_tecnico_veterinario/tablero_control_ganaderia.json",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_tecnico_veterinario/Administracion y Comercializacion Ganadera y Registro Ganadero.json",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_tecnico_veterinario/asistente_veterinario.json",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_tecnico_veterinario/asistente_veterinario_ampliado.json"
    ]

    # ==========================================
    # LÍNEAS CORRECTIVAS (¡Las que faltaban, patrón!)
    # ==========================================
    import os
    import json

    def cargar_imagenes(rutas):
        imagenes = {}
        for ruta in rutas:
            # Validamos que la ruta exista de verdad en el potrero antes de entrar
            if not os.path.exists(ruta):
                print(f"[ALERTA] La ruta de imágenes no existe: {ruta}")
                continue
            imagenes[ruta] = []
            for root, _, files in os.walk(ruta):
                # Filtro inteligente: Saltarse carpetas virtuales o vacías intermedios
                if ".venv" in root or any(x in root for x in ["FMD_only", "IBK_only", "LSD_only"]):
                    continue
                for file in files:
                    if file.lower().endswith((".jpg", ".jpeg", ".png")):
                        imagenes[ruta].append(os.path.join(root, file))
        return imagenes

    def cargar_json(rutas):
        datos = {}
        for ruta in rutas:
            if os.path.isfile(ruta) and ruta.endswith('.json'):
                with open(ruta, 'utf-8', encoding='utf-8') as f:
                    try:
                        datos[os.path.basename(ruta)] = json.load(f)
                    except Exception as e:
                        datos[os.path.basename(ruta)] = f"Error: {str(e)}"
        return datos

    def cargar_markdown(rutas):
        docs = {}
        for ruta in rutas:
            if os.path.isfile(ruta) and ruta.endswith('.md'):
                with open(ruta, 'utf-8', encoding='utf-8') as f:
                    try:
                        docs[os.path.basename(ruta)] = f.read()
                    except Exception as e:
                        docs[os.path.basename(ruta)] = f"Error: {str(e)}"
        return docs
