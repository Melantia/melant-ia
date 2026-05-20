import os
import json
from typing import List, Dict, Any

CURSOS_DIR = os.path.join(os.path.dirname(__file__), '..', 'knowledge_seeds', '07_escuela de campo')


def cargar_cursos_json_md(directorio: str) -> List[Dict[str, Any]]:
    cursos = []
    for archivo in os.listdir(directorio):
        ruta = os.path.join(directorio, archivo)
        if archivo.endswith('.json'):
            with open(ruta, 'r', encoding='utf-8') as f:
                try:
                    data = json.load(f)
                    cursos.append({
                        'nombre': data.get('titulo', archivo),
                        'tipo': 'json',
                        'contenido': data
                    })
                except Exception as e:
                    print(f"Error leyendo {archivo}: {e}")
        elif archivo.endswith('.md'):
            with open(ruta, 'r', encoding='utf-8') as f:
                contenido = f.read()
                cursos.append({
                    'nombre': archivo.replace('.md', ''),
                    'tipo': 'md',
                    'contenido': contenido
                })
    return cursos


def alimentar_asistente(cursos: List[Dict[str, Any]]):
    """
    Ejemplo: Esta función puede ser adaptada para alimentar un chatbot, una API o una interfaz Kivy.
    Aquí solo imprime los títulos de los cursos cargados.
    """
    print("Cursos y prácticas disponibles para el Asistente Técnico Rural:")
    for curso in cursos:
        print(f"- {curso['nombre']} ({curso['tipo']})")


if __name__ == "__main__":
    cursos = cargar_cursos_json_md(CURSOS_DIR)
    alimentar_asistente(cursos)
