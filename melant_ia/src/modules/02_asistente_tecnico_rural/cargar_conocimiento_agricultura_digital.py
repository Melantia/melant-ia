import os
import json

def cargar_json(rutas):
    datos = {}
    for ruta in rutas:
        if os.path.isfile(ruta) and ruta.endswith('.json'):
            with open(ruta, encoding='utf-8') as f:
                try:
                    datos[os.path.basename(ruta)] = json.load(f)
                except Exception as e:
                    datos[os.path.basename(ruta)] = f"Error: {e}"
    return datos

def cargar_imagenes(rutas):
    imagenes = {}
    for ruta in rutas:
        imagenes[ruta] = []
        for root, _, files in os.walk(ruta):
            for file in files:
                if file.lower().endswith((".jpg", ".jpeg", ".png")):
                    imagenes[ruta].append(os.path.join(root, file))
    return imagenes

def cargar_markdown(rutas):
    docs = {}
    for ruta in rutas:
        if os.path.isfile(ruta) and ruta.endswith('.md'):
            with open(ruta, encoding='utf-8') as f:
                docs[os.path.basename(ruta)] = f.read()
    return docs

def cargar_conocimiento():
    rutas_json = [
        "knowledge_seeds/02_asistente_tecnico_rural/agricultura_digital/informe_tecnico_precision.json",
        "knowledge_seeds/02_asistente_tecnico_rural/agricultura_digital/prompts_vision_fitosanitario.json",
        "knowledge_seeds/02_asistente_tecnico_rural/agricultura_digital/prompts_vision_palmas.json",
        "knowledge_seeds/02_asistente_tecnico_rural/agricultura_digital/sensores_agricultura_precision.json",
        "knowledge_seeds/02_asistente_tecnico_rural/agricultura_digital/bioclimatologia_fenologia.json",
        "knowledge_seeds/02_asistente_tecnico_rural/agricultura_digital/catalogo_sensores.json"
    ]
    rutas_md = [
        "knowledge_seeds/02_asistente_tecnico_rural/agricultura_digital/guia_usuario_vision_artificial.md"
    ]
    conocimiento = {
        "json": cargar_json(rutas_json),
        "markdown": cargar_markdown(rutas_md)
    }
    return conocimiento

if __name__ == "__main__":
    conocimiento = cargar_conocimiento()
    print("Conocimiento agricultura digital cargado:")
    print(list(conocimiento.keys()))
