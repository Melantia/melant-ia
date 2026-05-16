# Generación de links para productos y tienda según plan
from tienda_controller import PLANES_MELANTIA

def generar_link_producto(id_producto, usuario):
    base_url = "https://melant-ia.com/tienda/"
    plan = usuario.plan
    if plan == "PROFESIONAL":
        return f"{base_url}pro/{id_producto}"
    elif plan == "PRODUCTOR":
        return f"{base_url}prod/{id_producto}"
    else:
        return f"{base_url}semilla/{id_producto}"

def generar_link_tienda(usuario):
    base_url = "https://melant-ia.com/tienda/"
    plan = usuario.plan
    return f"{base_url}{plan.lower()}/{usuario.nombre}"

# Ejemplo de uso
class Usuario:
    def __init__(self, nombre, plan):
        self.nombre = nombre
        self.plan = plan

if __name__ == "__main__":
    usuario = Usuario("Juan", "PROFESIONAL")
    print(generar_link_producto("12345", usuario))
    print(generar_link_tienda(usuario))
