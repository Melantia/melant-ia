# Loader legal para acceder a recursos en legal_data
import os
import json

LEGAL_DATA_PATH = os.path.join(os.path.dirname(__file__), '../../modules/10_comunidad_virtual/legal_data/')
KNOWLEDGE_DATA_PATH = os.path.join(os.path.dirname(__file__), '../../knowledge_seeds/10_comunidad_virtual/legal_data/')

# Carga todos los archivos JSON y MD de legal_data y knowledge_seeds

def listar_archivos_legales():
    archivos = []
    for carpeta in [LEGAL_DATA_PATH, KNOWLEDGE_DATA_PATH]:
        if os.path.exists(carpeta):
            for nombre in os.listdir(carpeta):
                if nombre.endswith('.json') or nombre.endswith('.md'):
                    archivos.append(os.path.join(carpeta, nombre))
    return archivos

# Carga el contenido de un archivo legal específico

def cargar_archivo_legal(ruta):
    if ruta.endswith('.json'):
        with open(ruta, encoding='utf-8') as f:
            return json.load(f)
    elif ruta.endswith('.md'):
        with open(ruta, encoding='utf-8') as f:
            return f.read()
    else:
        return None

# Busca por palabra clave en todos los archivos legales

def buscar_en_legal_data(palabra_clave):
    resultados = []
    for ruta in listar_archivos_legales():
        contenido = cargar_archivo_legal(ruta)
        if isinstance(contenido, dict):
            texto = json.dumps(contenido, ensure_ascii=False)
        else:
            texto = str(contenido)
        if palabra_clave.lower() in texto.lower():
            resultados.append({'archivo': os.path.basename(ruta), 'extracto': texto[:300]})
    return resultados

# Ejemplo de integración en AsesorLegalScreen:
# from modules.10_comunidad_virtual.legal_data.legal_loader import buscar_en_legal_data
# resultados = buscar_en_legal_data('registro sanitario')
# Mostrar resultados en la interfaz
