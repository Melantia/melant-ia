import os
import json

try:
    import markdown
except ImportError:
    markdown = None

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

def cargar_markdown(rutas):
    docs = {}
    for ruta in rutas:
        if os.path.isfile(ruta) and ruta.endswith('.md'):
            with open(ruta, encoding='utf-8') as f:
                texto = f.read()
                if markdown:
                    docs[os.path.basename(ruta)] = markdown.markdown(texto)
                else:
                    docs[os.path.basename(ruta)] = texto
    return docs

def cargar_imagenes(rutas):
    imagenes = {}
    for ruta in rutas:
        imagenes[ruta] = []
        for root, _, files in os.walk(ruta):
            for file in files:
                if file.lower().endswith((".jpg", ".jpeg", ".png")):
                    imagenes[ruta].append(os.path.join(root, file))
    return imagenes

def cargar_conocimiento():
    rutas_md = [
        "knowledge_seeds/04_agricultura_digital/guia_usuario_vision_artificial.md"
    ]
    rutas_json = [
        "knowledge_seeds/04_agricultura_digital/informe_tecnico_precision.json",
        "knowledge_seeds/04_agricultura_digital/prompts_vision_fitosanitario.json",
        "knowledge_seeds/04_agricultura_digital/prompts_vision_palmas.json",
        "knowledge_seeds/04_agricultura_digital/sensores_agricultura_precision.json",
        "knowledge_seeds/04_agricultura_digital/bioclimatologia_fenologia.json",
        "knowledge_seeds/04_agricultura_digital/catalogo_sensores.json"
    ]
    rutas_imagenes = [
        "knowledge_seeds/04_agricultura_digital/agri_precision",
        "knowledge_seeds/04_agricultura_digital/gps"
    ]
    conocimiento = {
        "markdown": cargar_markdown(rutas_md),
        "json": cargar_json(rutas_json),
        "imagenes": cargar_imagenes(rutas_imagenes)
    }
    return conocimiento

if __name__ == "__main__":
    conocimiento = cargar_conocimiento()
    print("Conocimiento agricultura digital cargado:")
    print(list(conocimiento.keys()))