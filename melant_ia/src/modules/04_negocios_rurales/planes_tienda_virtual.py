# Definición de niveles en la lógica de Tienda Virtual MELANTIA

PLANES_MELANTIA = {
    "SEMILLA": {"limite": 10, "precio": 0, "dias": 30},
    "PRODUCTOR": {"limite": 250, "precio": 25, "dias": 30},
    "PREMIUM": {"limite": 1000, "precio": 50, "dias": 30}
}

def bienvenida_don_eloy(usuario):
    if usuario.plan == "SEMILLA":
        don_eloy.hablar(f"¡Bienvenido patrón {usuario.nombre}! Tiene cupo para 10 productos gratis. ¡A vender se dijo!")
    elif usuario.plan == "PRODUCTOR":
        don_eloy.hablar("¡Qué bueno verlo, socio! Su vitrina de 250 espacios está lista para la carga.")
    elif usuario.plan == "PREMIUM":
        don_eloy.hablar("¡Patrón, usted juega en las grandes ligas! Puede publicar hasta 1000 productos y acceder a beneficios premium.")
    else:
        don_eloy.hablar("Bienvenido a la Tienda Virtual MELANTIA. Elija un plan para comenzar a vender.")

# Ejemplo de uso
class Usuario:
    def __init__(self, nombre, plan):
        self.nombre = nombre
        self.plan = plan

class don_eloy:
    @staticmethod
    def hablar(mensaje):
        print(f"[VOZ DON ELOY]: {mensaje}")

if __name__ == "__main__":
    usuario1 = Usuario("Juan", "SEMILLA")
    usuario2 = Usuario("Ana", "PRODUCTOR")
    usuario3 = Usuario("Pedro", "PREMIUM")
    bienvenida_don_eloy(usuario1)
    bienvenida_don_eloy(usuario2)
    bienvenida_don_eloy(usuario3)
