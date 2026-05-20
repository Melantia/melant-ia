import json
import uuid
from datetime import datetime

HERBARIO_JSON = "herbario_memoria.json"

# Guardar un nuevo registro

def guardar_remedio_herbario(data):
    try:
        with open(HERBARIO_JSON, "r", encoding="utf-8") as f:
            remedios = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        remedios = []
    data['id'] = str(uuid.uuid4())
    data['fecha_registro'] = datetime.now().isoformat()
    remedios.append(data)
    with open(HERBARIO_JSON, "w", encoding="utf-8") as f:
        json.dump(remedios, f, ensure_ascii=False, indent=2)
    return data['id']

# Leer todos los registros

def leer_remedios_herbario():
    try:
        with open(HERBARIO_JSON, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

# Ejemplo de integración con Kivy:
# from registro_herbario_memoria import guardar_remedio_herbario
# data = {
#     "planta": "Ruda (Ruta graveolens)",
#     "uso_medicinal": "Para el mal de ojo y dolores de estómago",
#     "preparacion": "Infusión de hojas",
#     "narrador": "Doña Rosa",
#     "lugar": "San Miguel",
#     "evidencia": {"foto": "", "audio": ""},
#     "validacion": {"comprobada": False, "testigos": []},
#     "notas": "Remedio tradicional"
# }
# guardar_remedio_herbario(data)
