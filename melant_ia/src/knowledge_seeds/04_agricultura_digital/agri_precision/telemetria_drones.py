"""
telemetria_drones.py

Este módulo recopila y centraliza información relevante sobre telemetría de drones para aplicaciones agrícolas, integrando conceptos clave, ejemplos de uso, sensores, protocolos y recomendaciones prácticas para agricultura digital.

Autor: Especialista en Drones (IA)
Fecha de creación: 2 de mayo de 2026
"""

# Conceptos básicos de telemetría de drones

TELEMETRIA_DEFINITION = (
    "La telemetría de drones es el proceso de recopilación, transmisión y análisis de datos en tiempo real "
    "provenientes de sensores a bordo del dron, permitiendo monitoreo, control y toma de decisiones remotas."
)

# Sensores comunes en drones agrícolas
SENSORES_COMUNES = [
    "GPS (posicionamiento y navegación)",
    "IMU (Unidad de Medición Inercial: acelerómetro, giroscopio, magnetómetro)",
    "Altímetro/barómetro",
    "Cámaras multiespectrales y RGB",
    "Sensores de temperatura y humedad",
    "LIDAR",
    "Sensores de nivel de batería y consumo energético"
]

# Protocolos de comunicación típicos
PROTOCOLOS_COMUNICACION = [
    "MAVLink (Micro Air Vehicle Link)",
    "SBUS",
    "PPM",
    "CAN Bus",
    "WiFi/4G/5G para transmisión de datos"
]

# Ejemplo de estructura de datos de telemetría
EJEMPLO_TELEMETRIA = {
    "timestamp": "2026-05-02T10:00:00Z",
    "gps": {"lat": -2.170998, "lon": -79.922359, "alt": 120.5},
    "imu": {"roll": 0.2, "pitch": -0.1, "yaw": 1.5},
    "bateria": {"voltaje": 15.2, "porcentaje": 78},
    "temperatura": 32.1,
    "humedad": 65.3,
    "velocidad": 12.4,
    "estado": "En vuelo"
}

# Recomendaciones para integración en agricultura digital
RECOMENDACIONES = [
    "Asegurar la calibración de sensores antes de cada vuelo.",
    "Utilizar protocolos estándar (como MAVLink) para compatibilidad con software de análisis.",
    "Implementar almacenamiento redundante de datos (en dron y en estación base).",
    "Automatizar la descarga y análisis de datos tras cada misión.",
    "Integrar la telemetría con sistemas de gestión agrícola para trazabilidad y toma de decisiones."
]

# Función de ejemplo para simular la recepción de datos de telemetría
def recibir_telemetria():
    """Simula la recepción de un paquete de telemetría de un dron agrícola."""
    return EJEMPLO_TELEMETRIA

# Función para mostrar recomendaciones

def mostrar_recomendaciones():
    print("Recomendaciones para telemetría de drones en agricultura digital:")
    for rec in RECOMENDACIONES:
        print(f"- {rec}")

if __name__ == "__main__":
    print("Definición:", TELEMETRIA_DEFINITION)
    print("\nSensores comunes:")
    for sensor in SENSORES_COMUNES:
        print(f"- {sensor}")
    print("\nProtocolos de comunicación:")
    for proto in PROTOCOLOS_COMUNICACION:
        print(f"- {proto}")
    print("\nEjemplo de telemetría recibida:")
    print(recibir_telemetria())
    print()
    mostrar_recomendaciones()
