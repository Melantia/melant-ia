# Validación de límites y subida de productos según el plan activo

import json
import os

# Cargar configuración avanzada desde tienda_config.json
TIENDA_CONFIG_PATH = os.path.join(os.path.dirname(__file__), '../../config_structure_melant_ia/tienda_config.json')
with open(TIENDA_CONFIG_PATH, encoding='utf-8') as f:
    TIENDA_CONFIG = json.load(f)


def puede_publicar_producto(usuario, productos_actuales):
    reglas = TIENDA_CONFIG["emprendedor"]
    plan_requerido = reglas["plan_requerido"]
    max_productos = reglas["max_productos"]
    debe_estar_al_dia = reglas["debe_estar_al_dia"]

    if not hasattr(usuario, 'plan') or usuario.plan != plan_requerido:
        raise Exception(f"Debe tener el plan {plan_requerido} activo para publicar productos y usar la tienda.")
    if debe_estar_al_dia and (not hasattr(usuario, 'al_dia') or not usuario.al_dia):
        raise Exception("Debe estar al día en su suscripción para usar la app y sus beneficios.")
    if productos_actuales >= max_productos:
        raise Exception(f"Solo puede publicar hasta {max_productos} productos en la tienda MELANTIA.")
    return True

def optimizar_foto(foto_bytes):
    # Simulación: aquí se optimizaría la foto a 150KB máximo
    if len(foto_bytes) > 150 * 1024:
        raise Exception("La foto supera el tamaño máximo permitido (150KB). Por favor, suba una imagen más liviana.")
    return foto_bytes

# Ejemplo de uso
class Usuario:
    def __init__(self, nombre, plan):
        self.nombre = nombre
        self.plan = plan

if __name__ == "__main__":
    usuario = Usuario("Juan", "PRODUCTOR")
    productos_actuales = 250
    try:
        puede_publicar_producto(usuario, productos_actuales)
    except Exception as e:
        print(e)
    # Simulación de foto
    foto = bytes(160 * 1024)  # 160KB
    try:
        optimizar_foto(foto)
    except Exception as e:
        print(e)
