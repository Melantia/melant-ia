"""
Módulo de Inteligencia Climática y Recomendaciones Agronómicas — MELANT IA

- Integra Open-Meteo, NASA POWER, Agromonitoring.
- Cruza datos con sedes productivas y fotos de evidencia.
- Incluye lógica de recomendaciones y estampado climático.
- Soporta entrada por voz (speech-to-text) para registro inclusivo.
"""
import json
from datetime import datetime
from pathlib import Path

try:
    import requests
except (ImportError, ModuleNotFoundError):
    requests = None

try:
    import speech_recognition as sr
except (ImportError, ModuleNotFoundError):
    sr = None

# --- Configuración ---
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
NASA_POWER_URL = "https://power.larc.nasa.gov/api/temporal/hourly/point"
AGROMONITORING_URL = "https://api.agromonitoring.com/agro/1.0/weather"

CLIMA_CACHE = "nido_silencioso_clima.json"

# --- Utilidades de voz (speech-to-text) ---
def entrada_por_voz(mensaje):
    try:
        import speech_recognition as sr
        r = sr.Recognizer()
        with sr.Microphone() as source:
            print(mensaje + " (puede hablar ahora):")
            audio = r.listen(source, timeout=5)
        texto = r.recognize_google(audio, language="es-ES")
        print(f"Usted dijo: {texto}")
        return texto
    except Exception as e:
        print(f"[Voz] No se pudo capturar entrada por voz: {e}")
        return input(mensaje + " (escriba si falla el micrófono): ")

# --- Extracción de datos climáticos ---
def obtener_clima_open_meteo(lat, lon):
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m",
        "current_weather": True,
        "forecast_days": 1
    }
    r = requests.get(OPEN_METEO_URL, params=params)
    return r.json() if r.status_code == 200 else {}

def obtener_clima_nasa_power(lat, lon):
    params = {
        "latitude": lat,
        "longitude": lon,
        "parameters": "ALLSKY_SFC_SW_DWN,T2M,PRECTOTCORR",
        "community": "AG",
        "format": "JSON"
    }
    r = requests.get(NASA_POWER_URL, params=params)
    return r.json() if r.status_code == 200 else {}

# --- Cacheo y sincronización ---
def cachear_clima_local(clima):
    with open(CLIMA_CACHE, "w", encoding="utf-8") as f:
        json.dump(clima, f, ensure_ascii=False, indent=2)

def cargar_clima_cache():
    if not Path(CLIMA_CACHE).exists():
        return {}
    with open(CLIMA_CACHE, "r", encoding="utf-8") as f:
        return json.load(f)

# --- Lógica de recomendaciones agronómicas ---
def recomendaciones_agronomicas(clima, et0_umbral=5.0):
    recs = []
    temp = clima.get("temperature_2m")
    humedad = clima.get("relative_humidity_2m")
    viento = clima.get("wind_speed_10m")
    lluvia = clima.get("precipitation")
    et0 = clima.get("et0")
    tmin = clima.get("tmin")
    grados_dia = clima.get("gdd")
    if et0 and et0 > et0_umbral:
        recs.append("⚠️ Estrés hídrico: Se recomienda riego.")
    if viento and viento > 15 or (humedad and humedad < 30):
        recs.append("⛔ Ventana de fumigación no apta (viento o humedad).")
    if tmin and tmin < 4:
        recs.append("❄️ Riesgo de helada en próximas 12h.")
    if grados_dia:
        recs.append(f"🌱 Grados día acumulados: {grados_dia}")
    if not recs:
        recs.append("✅ Condiciones normales para manejo agronómico.")
    return recs

# --- Estampado climático en foto (metadatos JSON) ---
def estampar_clima_en_foto(foto_path, clima):
    meta_path = foto_path + ".clima.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump({
            "fecha": datetime.now().isoformat(),
            "clima": clima
        }, f, ensure_ascii=False, indent=2)
    print(f"Metadatos climáticos guardados en: {meta_path}")

# --- Integración con sedes productivas ---
def obtener_clima_para_sedes(sedes):
    climas = []
    for sede in sedes:
        gps = sede.get("gps")
        if gps and gps.get("lat") and gps.get("lon"):
            clima = obtener_clima_open_meteo(gps["lat"], gps["lon"])
            climas.append({"sede": sede["nombre"], "clima": clima})
    return climas

# --- Ejemplo CLI inclusivo ---
def registrar_sede_por_voz():
    nombre = entrada_por_voz("Diga el nombre del predio:")
    # ...continuar con lógica de registro usando voz...
    return nombre
