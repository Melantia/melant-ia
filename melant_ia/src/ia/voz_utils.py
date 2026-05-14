import os
import json

from plyer import tts

def asegurar_config_voz():
    ruta = 'config_voz.json'
    if not os.path.exists(ruta):
        with open(ruta, 'w') as f:
            json.dump({"rate": 1.0, "pitch": 1.0}, f)

# Llama a esta función al inicio de tu app
asegurar_config_voz()

def cargar_ajustes_voz():
    try:
        with open('config_voz.json', 'r') as f:
            return json.load(f)
    except:
        return {"rate": 1.0, "pitch": 1.0}

def guardar_ajustes_voz(rate, pitch):
    with open('config_voz.json', 'w') as f:
        json.dump({"rate": rate, "pitch": pitch}, f)

def decir_texto(texto):
    ajustes = cargar_ajustes_voz()
    try:
        tts.speak(text=texto, rate=ajustes["rate"], pitch=ajustes["pitch"])
    except Exception as e:
        print(f"Error de voz: {e}")
