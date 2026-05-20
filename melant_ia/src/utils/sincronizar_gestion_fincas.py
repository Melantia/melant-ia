import os
import json
from typing import List, Dict, Any

# Carpetas fuente de conocimiento
ESCUELA_CAMPO_DIR = os.path.join(os.path.dirname(__file__), '..', 'knowledge_seeds', '07_escuela de campo')
TECNICO_RURAL_DIR = os.path.join(os.path.dirname(__file__), '..', 'knowledge_seeds', '02_asistente_tecnico_rural')
DESTINO_GESTION_FINCA = os.path.join(os.path.dirname(__file__), '..', 'knowledge_seeds', '03_gestion_fincas_trazabilidad')


def copiar_recursos_fuente_a_destino(fuentes: List[str], destino: str):
    if not os.path.exists(destino):
        os.makedirs(destino)
    for carpeta in fuentes:
        for archivo in os.listdir(carpeta):
            ruta_origen = os.path.join(carpeta, archivo)
            ruta_destino = os.path.join(destino, archivo)
            if os.path.isfile(ruta_origen) and (archivo.endswith('.json') or archivo.endswith('.md')):
                with open(ruta_origen, 'r', encoding='utf-8') as f:
                    contenido = f.read()
                with open(ruta_destino, 'w', encoding='utf-8') as f:
                    f.write(contenido)
                print(f"Copiado: {archivo} -> {destino}")

if __name__ == "__main__":
    fuentes = [ESCUELA_CAMPO_DIR, TECNICO_RURAL_DIR]
    copiar_recursos_fuente_a_destino(fuentes, DESTINO_GESTION_FINCA)
    print("¡Gestión de Fincas y Trazabilidad ahora tiene acceso a los recursos de Escuela de Campo y Asistente Técnico Rural!")
