# notificaciones.py
# Ejemplo de backend para enviar notificaciones de actualización y alarmas a clientes MELANTIA

import datetime
import json

def enviar_mensaje_a_cliente(cliente_id, mensaje):
    """
    Simula el envío de un mensaje a un cliente (puede ser WebSocket, push, etc.)
    """
    # Aquí iría la lógica real de envío
    print(f"Enviando a {cliente_id}: {json.dumps(mensaje, ensure_ascii=False)}")


def notificar_actualizacion(cliente_id):
    """
    Envía una notificación de actualización a un cliente
    """
    mensaje = {
        "tipo": "actualizacion",
        "texto": "¡Hay una nueva actualización disponible!",
        "actualizacion": True,
        "timestamp": datetime.datetime.now().isoformat()
    }
    enviar_mensaje_a_cliente(cliente_id, mensaje)


def notificar_alarma_diaria(cliente_id):
    """
    Envía la alarma diaria de las 6:00 am (sonido de águila)
    """
    mensaje = {
        "tipo": "alarma_diaria",
        "texto": "Alarma diaria: ¡Es hora de iniciar la jornada!",
        "alarma": True,
        "timestamp": datetime.datetime.now().isoformat()
    }
    enviar_mensaje_a_cliente(cliente_id, mensaje)

# Ejemplo de uso manual:
if __name__ == "__main__":
    notificar_actualizacion("usuario_123")
    notificar_alarma_diaria("usuario_123")
