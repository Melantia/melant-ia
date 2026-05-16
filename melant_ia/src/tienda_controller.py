# src/tienda_controller.py

def confirmar_venta_exitosa(id_venta, datos_vendedor):
    """
    Se activa cuando el cliente completa el pago en la Tienda MELANTIA.
    """
    # 1. Don Eloy avisa por los altavoces del dispositivo
    mensaje_voz = f"¡Atención! Se ha realizado una venta exitosa de {id_venta['producto']}. ¡Felicidades!"
    don_eloy.hablar(mensaje_voz)
    
    # 2. El Robot cambia a color VERDE de éxito
    robot.cambiar_estado("exito") 
    
    # 3. Notificación externa (WhatsApp/SMS) al vendedor o dueño
    # Usamos los datos de contacto que Don Eloy ya conoce
    aviso_tienda = (
        f"🏪 *MELANTIA - AVISO DE VENTA*\n\n"
        f"¡Hola! Te informamos que se ha vendido: *{id_venta['producto']}*.\n"
        f"Monto: {id_venta['precio']} {id_venta['moneda']}\n"
        f"Cliente: {id_venta['cliente_nombre']}\n\n"
        f"Ya puedes preparar el pedido para entrega."
    )
    
    enviar_notificacion_vendedor(datos_vendedor['telefono'], aviso_tienda)

# --- Tabla de Planes MELANTIA actualizada ---
PLANES_MELANTIA = {
    "SEMILLA": {"limite": 10, "precio": 0, "prioridad": 3, "almacenamiento": "50 MB"},
    "PRODUCTOR": {"limite": 250, "precio": 25, "prioridad": 2, "almacenamiento": "500 MB"},
    "PROFESIONAL": {"limite": 1000, "precio": 50, "prioridad": 1, "almacenamiento": "2 GB"}
}

def configurar_perfil_tienda(usuario_id, tipo_plan):
    if tipo_plan == "PROFESIONAL":
        don_eloy.hablar("¡Bienvenido al nivel Profesional, patrón! Su vitrina de 1,000 productos está lista. ¡Eso es poner la finca a valer de verdad, sí señor!")
        robot.cambiar_color_premium()
    elif tipo_plan == "PRODUCTOR":
        don_eloy.hablar("¡Qué bueno verlo, socio! Su vitrina de 250 espacios está lista para la carga.")
        robot.cambiar_color("verde")
    elif tipo_plan == "SEMILLA":
        don_eloy.hablar("¡Bienvenido patrón! Tiene cupo para 10 productos gratis. ¡A vender se dijo!")
        robot.cambiar_color("azul")
    else:
        don_eloy.hablar("Bienvenido a la Tienda Virtual MELANTIA. Elija un plan para comenzar a vender.")
        robot.cambiar_color("gris")

# Funciones auxiliares simuladas (deben estar implementadas en el sistema real)
class don_eloy:
    @staticmethod
    def hablar(mensaje):
        print(f"[VOZ DON ELOY]: {mensaje}")

class robot:
    @staticmethod
    def cambiar_color_premium():
        print("[ROBOT]: Estado cambiado a PREMIUM (Dorado/Ámbar)")
    @staticmethod
    def cambiar_estado(estado):
        print(f"[ROBOT]: Estado cambiado a {estado.upper()}")
    @staticmethod
    def cambiar_color(color):
        print(f"[ROBOT]: Estado cambiado a {color.upper()}")

def enviar_notificacion_vendedor(telefono, mensaje):
    print(f"[NOTIFICACIÓN]: Enviado a {telefono}:\n{mensaje}\n")

# Ejemplo de uso:
if __name__ == "__main__":
    venta = {
        'producto': 'Fertilizante Orgánico',
        'precio': 35.5,
        'moneda': 'USD',
        'cliente_nombre': 'María López'
    }
    vendedor = {
        'telefono': '+593999888777',
        'nombre': 'Juan Pérez'
    }
    confirmar_venta_exitosa(venta, vendedor)

    configurar_perfil_tienda(1, "PROFESIONAL")
    configurar_perfil_tienda(2, "PRODUCTOR")
    configurar_perfil_tienda(3, "SEMILLA")
