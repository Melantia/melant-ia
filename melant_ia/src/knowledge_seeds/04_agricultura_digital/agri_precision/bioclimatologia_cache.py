"""
Módulo: bioclimatologia_cache.py
- Sincroniza y almacena el pronóstico climático de los últimos 7 días para uso offline.
- Integra con PCSE (Python Crop Simulation Environment) para modelar rendimiento por hectárea.
"""
import json
from pathlib import Path
from datetime import datetime, timedelta

CACHE_FILE = "clima_cache_7d.json"

# --- Simulación de integración con PCSE (stub) ---
def simular_rendimiento_pcse(datos_clima: list, parametros_cultivo: dict) -> float:
    """Simula el rendimiento por hectárea usando datos climáticos y parámetros del cultivo."""
    # Aquí se integraría PCSE real
    # Por ahora, promedio simple de condiciones ideales
    ideal = sum(1 for d in datos_clima if 20 <= d['temp'] <= 28 and d['lluvia'] < 10) / len(datos_clima)
    return round(ideal * parametros_cultivo.get('rendimiento_max', 3.5), 2)

# --- Manejo de caché offline ---
def guardar_pronostico_cache(pronostico: list):
    """Guarda los últimos 7 días de pronóstico en caché local."""
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(pronostico, f, ensure_ascii=False, indent=2)

def cargar_pronostico_cache() -> list:
    """Carga el pronóstico de los últimos 7 días desde caché local."""
    if not Path(CACHE_FILE).exists():
        return []
    with open(CACHE_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

# --- Dashboard visual (texto, para CLI) ---
def mostrar_dashboard_clima(pronostico: list):
    print("\n=== DASHBOARD CLIMA-CULTIVO (7 días) ===")
    for d in pronostico:
        color = "🟢" if d['condicion'] == 'ideal' else ("🟡" if d['condicion'] == 'riesgo' else "🔴")
        print(f"{d['fecha']}: {color} T: {d['temp']}°C, Lluvia: {d['lluvia']}mm, Viento: {d['viento']}km/h")
    print("Leyenda: 🟢 Ideal | 🟡 Riesgo moderado | 🔴 Estrés/helada")
