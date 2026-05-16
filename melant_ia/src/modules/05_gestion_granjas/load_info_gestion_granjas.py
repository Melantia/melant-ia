import json
import os

def cargar_info_gestion_granjas():
    """
    Carga la información de bienvenida y beneficios para el módulo de Gestión de Granjas desde el archivo JSON.
    """
    ruta = os.path.join(os.path.dirname(__file__), 'info_gestion_granjas.json')
    with open(ruta, encoding='utf-8') as f:
        return json.load(f)

# Ejemplo de uso
if __name__ == "__main__":
    info = cargar_info_gestion_granjas()
    print(f"Voz principal: {info['voz_principal']}")
    print(f"Descripción: {info['descripcion']}")
    print("Beneficios:")
    for b in info['beneficios']:
        print(f"- {b}")
