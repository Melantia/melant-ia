# Módulo: Inteligencia Climática MELANT IA
# Integración de APIs meteorológicas, procesamiento y recomendaciones agronómicas

import requests
import json
import sys
sys.path.append("../../..")  # Para importar módulos raíz si es necesario
from valor_ahorro import calcular_ahorro_lavado_insumos, calcular_ahorro_deriva, ImpactoFinanciero

# --- Configuración de APIs ---
with open('cientifico_rural/inteligencia_climatica/config_clima.json', 'r', encoding='utf-8') as f:
    config = json.load(f)

# --- Plantilla de función para obtener clima actual ---
def obtener_clima_open_meteo(lat, lon):
    """
    Consulta Open-Meteo API para obtener el clima actual en la ubicación dada.
    """
    url = config['apis']['open_meteo']
    params = {
        'latitude': lat,
        'longitude': lon,
        'current_weather': True
    }
    try:
        resp = requests.get(url, params=params, timeout=10)
        if resp.status_code == 200:
            return resp.json()
        else:
            return {"error": f"Código {resp.status_code}"}
    except Exception as e:
        return {"error": str(e)}

# --- Plantilla de función para cachear datos climáticos ---
def cachear_clima_local(data, lat, lon):
    """
    Guarda el clima consultado en caché local para modo offline.
    """
    archivo = f"cientifico_rural/inteligencia_climatica/cache_clima_{lat}_{lon}.json"
    with open(archivo, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# --- Plantilla de función para recomendaciones agronómicas ---
def recomendar_agronomia(clima, hectareas=1.0, producto_usd=100.0, impacto: ImpactoFinanciero = None):
    """
    Genera recomendaciones según parámetros climáticos y calcula/almacena ahorro estimado.
    """
    recomendaciones = []
    if impacto is None:
        impacto = ImpactoFinanciero()
    if 'current_weather' in clima:
        t = clima['current_weather'].get('temperature')
        viento = clima['current_weather'].get('windspeed')
        if t is not None and t < 4:
            recomendaciones.append('¡Alerta de helada! Protege tus cultivos.')
        if viento is not None and viento > 15:
            recomendaciones.append('Viento alto: No aplicar insumos foliares.')
            msg = calcular_ahorro_deriva(producto_usd)
            recomendaciones.append(msg)
            impacto.registrar_ahorro_deriva(producto_usd)
        lluvia = clima['current_weather'].get('precipitation')
        if lluvia is not None and lluvia > 5:
            msg = calcular_ahorro_lavado_insumos(hectareas)
            recomendaciones.append(msg)
            impacto.registrar_ahorro_lavado(hectareas)
    return recomendaciones

# --- Ejemplo de uso ---
if __name__ == "__main__":
    lat = float(input("Latitud: "))
    lon = float(input("Longitud: "))
    clima = obtener_clima_open_meteo(lat, lon)
    print("Clima actual:", clima)
    cachear_clima_local(clima, lat, lon)
    recs = recomendar_agronomia(clima)
    print("Recomendaciones:")
    for r in recs:
        print("-", r)


def get_voice_summary():
    """Resumen del módulo Inteligencia Climática para el asistente de voz."""
    return (
        "Módulo Climático activo. "
        "Consulto el clima en tiempo real según tu ubicación GPS y genero alertas agronómicas. "
        "Si hay riesgo de helada, viento alto o lluvia intensa, te aviso antes de aplicar insumos "
        "para que ahorres tiempo y dinero."
    )
