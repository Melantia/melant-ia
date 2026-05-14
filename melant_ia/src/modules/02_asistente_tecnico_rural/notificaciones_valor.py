"""
Engine de Notificaciones de Valor (Impact Notifications)
- Trigger: 24h después de alerta confirmada (ej. si llovió tras la alerta)
- Data Source: precios_referenciales_insumos.json
- Formato: Notificación push tipo "¡Buen trabajo! Tu decisión de ayer salvó [Monto] de tu presupuesto"
"""
import json
from datetime import datetime, timedelta
from pathlib import Path

PRECIOS_FILE = "cientifico_rural/inteligencia_climatica/precios_referenciales_insumos.json"
HISTORIAL_ALERTAS = "cientifico_rural/inteligencia_climatica/historial_alertas.json"

# --- Cargar precios referenciales ---
def cargar_precios():
    if not Path(PRECIOS_FILE).exists():
        return {"urea": 40, "glifosato": 25, "jornal": 20}
    with open(PRECIOS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

# --- Registrar alerta y hecho confirmado ---
def registrar_alerta(tipo, fecha, hecho_confirmado=False):
    historial = []
    if Path(HISTORIAL_ALERTAS).exists():
        with open(HISTORIAL_ALERTAS, "r", encoding="utf-8") as f:
            historial = json.load(f)
    historial.append({"tipo": tipo, "fecha": fecha, "hecho_confirmado": hecho_confirmado})
    with open(HISTORIAL_ALERTAS, "w", encoding="utf-8") as f:
        json.dump(historial, f, ensure_ascii=False, indent=2)

# --- Engine de notificación de valor ---
def notificar_valor():
    precios = cargar_precios()
    if not Path(HISTORIAL_ALERTAS).exists():
        return None
    with open(HISTORIAL_ALERTAS, "r", encoding="utf-8") as f:
        historial = json.load(f)
    hoy = datetime.now()
    for alerta in historial:
        fecha_alerta = datetime.strptime(alerta["fecha"], "%Y-%m-%d")
        if not alerta["hecho_confirmado"]:
            # Simulación: si pasaron 24h, se confirma el hecho (en producción: validar con datos reales)
            if (hoy - fecha_alerta) >= timedelta(days=1):
                alerta["hecho_confirmado"] = True
                # Ejemplo: tipo = "lluvia", ahorro = precio de urea
                monto = precios.get("urea", 40) if alerta["tipo"] == "lluvia" else precios.get("glifosato", 25)
                mensaje = f"¡Buen trabajo! Tu decisión de ayer salvó ${monto} de tu presupuesto."
                print(mensaje)
    # Guardar historial actualizado
    with open(HISTORIAL_ALERTAS, "w", encoding="utf-8") as f:
        json.dump(historial, f, ensure_ascii=False, indent=2)
