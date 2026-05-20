import json
import uuid
from datetime import datetime

TESORO_JSON = "tesoro_abuelos.json"

# Guardar un nuevo registro

def guardar_historia_abuelos(data):
    try:
        with open(TESORO_JSON, "r", encoding="utf-8") as f:
            historias = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        historias = []
    data['id'] = str(uuid.uuid4())
    data['fecha_registro'] = datetime.now().isoformat()
    historias.append(data)
    with open(TESORO_JSON, "w", encoding="utf-8") as f:
        json.dump(historias, f, ensure_ascii=False, indent=2)
    return data['id']

# Leer todos los registros

def leer_historias_abuelos():
    try:
        with open(TESORO_JSON, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

# Ejemplo de integración con Kivy:
# from registro_tesoro_abuelos import guardar_historia_abuelos
# data = {
#     "titulo": "La fiesta de San Juan",
#     "relato": "En mi pueblo...",
#     "narrador": "Don Pedro",
#     "lugar": "Pueblo Viejo",
#     "evidencia": {"audio": "", "foto": "", "video": ""},
#     "validacion": {"comprobada": False, "testigos": []},
#     "notas": "Historia familiar"
# }
# guardar_historia_abuelos(data)
