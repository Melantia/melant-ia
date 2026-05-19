import os
import json
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from pathlib import Path

try:
    import PyPDF2
except ImportError:
    PyPDF2 = None
    print("PyPDF2 no está instalado. Instala con: pip install PyPDF2")

def descargar_pdf(url, destino):
    r = requests.get(url)
    with open(destino, 'wb') as f:
        f.write(r.content)

def extraer_texto_pdf(ruta_pdf):
    if not PyPDF2:
        raise ImportError("PyPDF2 no está instalado.")
    texto = ""
    with open(ruta_pdf, 'rb') as f:
        lector = PyPDF2.PdfReader(f)
        for pagina in lector.pages:
            texto += pagina.extract_text() or ""
    return texto

def extraer_texto_web(url):
    r = requests.get(url)
    soup = BeautifulSoup(r.content, 'html.parser')
    # Extrae solo texto visible
    textos = soup.stripped_strings
    return '\n'.join(textos)

def guardar_json(data, ruta):
    with open(ruta, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def ingesta_desde_pdf(url_pdf, archivo_json, tipo='curso'):
    nombre_pdf = Path(urlparse(url_pdf).path).name
    ruta_pdf = f"tmp_{nombre_pdf}"
    descargar_pdf(url_pdf, ruta_pdf)
    texto = extraer_texto_pdf(ruta_pdf)
    os.remove(ruta_pdf)
    # Aquí se puede agregar procesamiento NLP para extraer módulos/prácticas/términos
    # Por ahora, solo agrega el texto completo como referencia
    with open(archivo_json, 'r', encoding='utf-8') as f:
        data = json.load(f)
    if tipo == 'curso':
        data['modulos'].append({
            'nombre': f'Extraído de {nombre_pdf}',
            'descripcion': 'Contenido extraído automáticamente.',
            'lecciones': [texto[:1000] + '...']
        })
    elif tipo == 'practica':
        data['practicas'].append({
            'nombre': f'Extraído de {nombre_pdf}',
            'descripcion': 'Contenido extraído automáticamente.',
            'pasos': [texto[:1000] + '...']
        })
    elif tipo == 'glosario':
        data['terminos'].append({
            'termino': f'Extraído de {nombre_pdf}',
            'definicion': texto[:500] + '...'
        })
    guardar_json(data, archivo_json)

def ingesta_desde_web(url, archivo_json, tipo='curso'):
    texto = extraer_texto_web(url)
    with open(archivo_json, 'r', encoding='utf-8') as f:
        data = json.load(f)
    if tipo == 'curso':
        data['modulos'].append({
            'nombre': f'Extraído de {url}',
            'descripcion': 'Contenido extraído automáticamente.',
            'lecciones': [texto[:1000] + '...']
        })
    elif tipo == 'practica':
        data['practicas'].append({
            'nombre': f'Extraído de {url}',
            'descripcion': 'Contenido extraído automáticamente.',
            'pasos': [texto[:1000] + '...']
        })
    elif tipo == 'glosario':
        data['terminos'].append({
            'termino': f'Extraído de {url}',
            'definicion': texto[:500] + '...'
        })
    guardar_json(data, archivo_json)

if __name__ == "__main__":
    # Ejemplo de uso:
    # ingesta_desde_pdf('https://wwflac.awsassets.panda.org/downloads/manual-de-buenas-practicas-ganaderas_1.pdf', '../cursos/ganaderia_regenerativa_es.json', tipo='curso')
    # ingesta_desde_web('https://ovis21.com/que-es-ganaderia-regenerativa/', '../practicas/ganaderia_regenerativa_es.json', tipo='practica')
    print("Script de ingesta automática listo para usar.")
