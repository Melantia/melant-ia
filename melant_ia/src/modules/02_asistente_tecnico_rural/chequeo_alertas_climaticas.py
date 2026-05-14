# Script para chequeo automático de alertas climáticas multicultivo MELANT IA
# Requiere: pip install requests
import json
from datetime import datetime

# Simulación de datos climáticos (reemplazar por API real en producción)
datos_clima = {
    "humedad_relativa": 85,
    "temp_min": 16,
    "temp_max": 24,
    "lluvia": True,
    "duracion_humedad_horas": 12,
    "presencia_vector": True
}

with open("alertas_climaticas_multicultivo.json", encoding="utf-8") as f:
    alertas = json.load(f)["alertas_climaticas"]

for alerta in alertas:
    c = alerta["condiciones"]
    cumple = True
    # Chequeo de condiciones generales
    if "humedad_relativa_min" in c and datos_clima["humedad_relativa"] < c["humedad_relativa_min"]:
        cumple = False
    if "duracion_horas_min" in c and datos_clima["duracion_humedad_horas"] < c["duracion_horas_min"]:
        cumple = False
    if "temp_min_c" in c and datos_clima["temp_min"] < c["temp_min_c"]:
        cumple = False
    if "temp_max_c" in c and datos_clima["temp_max"] > c["temp_max_c"]:
        cumple = False
    if "lluvia_o_rocio" in c and c["lluvia_o_rocio"] and not datos_clima["lluvia"]:
        cumple = False
    if "lluvia_reciente" in c and c["lluvia_reciente"] and not datos_clima["lluvia"]:
        cumple = False
    if "presencia_vector" in c and c["presencia_vector"] and not datos_clima["presencia_vector"]:
        cumple = False
    if cumple:
        print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M')}] ALERTA: {alerta['cultivo']} - {alerta['evento']}")
        print(f"Mensaje: {alerta['mensaje_push']}")
        print(f"Acciones sugeridas: {', '.join(alerta['accion'])}\n")
