import os
import json
from typing import List, Dict, Any

# Rutas a los bancos de conocimiento
TRAZABILIDAD_DIR = os.path.join(os.path.dirname(__file__), '..', 'knowledge_seeds', '03_gestion_fincas_trazabilidad')
ESCUELA_CAMPO_DIR = os.path.join(os.path.dirname(__file__), '..', 'knowledge_seeds', '07_escuela de campo')


def cargar_contenido_carpeta(directorio: str) -> List[Dict[str, Any]]:
    recursos = []
    if not os.path.exists(directorio):
        return recursos
    for archivo in os.listdir(directorio):
        ruta = os.path.join(directorio, archivo)
        if archivo.endswith('.json'):
            with open(ruta, 'r', encoding='utf-8') as f:
                try:
                    data = json.load(f)
                    recursos.append({'nombre': data.get('titulo', archivo), 'tipo': 'json', 'contenido': data})
                except Exception as e:
                    print(f"Error leyendo {archivo}: {e}")
        elif archivo.endswith('.md'):
            with open(ruta, 'r', encoding='utf-8') as f:
                recursos.append({'nombre': archivo.replace('.md', ''), 'tipo': 'md', 'contenido': f.read()})
    return recursos


def obtener_conocimiento_gestion_fincas():
    return cargar_contenido_carpeta(TRAZABILIDAD_DIR)

def obtener_cursos_escuela_campo():
    return cargar_contenido_carpeta(ESCUELA_CAMPO_DIR)

# Ejemplo de uso para alimentar ambos módulos
def alimentar_modulo_tecnico_y_escuela():
    gestion_fincas = obtener_conocimiento_gestion_fincas()
    escuela_campo = obtener_cursos_escuela_campo()
    print("Recursos de Gestión de Fincas y Trazabilidad:")
    for recurso in gestion_fincas:
        print(f"- {recurso['nombre']} ({recurso['tipo']})")
    print("\nCursos y Prácticas de la Escuela de Campo:")
    for recurso in escuela_campo:
        print(f"- {recurso['nombre']} ({recurso['tipo']})")

if __name__ == "__main__":
    alimentar_modulo_tecnico_y_escuela()
