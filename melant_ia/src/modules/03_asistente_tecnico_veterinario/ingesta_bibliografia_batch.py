import json
import os
from ingesta_automatica import ingesta_desde_web

BIBLIO_PATH = '../bibliografia/biotecnologia_ganadera_es.json'
CURSO_PATH = '../cursos/biotecnologia_ganadera_es.json'

# Cargar bibliografía
def cargar_bibliografia(path):
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    return data['recursos']

def main():
    recursos = cargar_bibliografia(BIBLIO_PATH)
    for recurso in recursos:
        url = recurso['url']
        print(f'Ingiere contenido de: {url}')
        try:
            ingesta_desde_web(url, CURSO_PATH, tipo='curso')
        except Exception as e:
            print(f'Error procesando {url}: {e}')

if __name__ == '__main__':
    main()
