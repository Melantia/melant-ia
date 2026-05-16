"""
Script base para consumir la API de datos abiertos de Ecuador (Gob.Ec) y almacenar resultados localmente para MELANT IA.
"""
import requests
import json
import os

API_URL = "https://www.gob.ec/api/v1/tramites-servicios"
SALIDA_JSON = "aprendizaje_melant_ia/datos_tramites_servicios.json"

def descargar_datos():
    try:
        r = requests.get(API_URL, timeout=30)
        if r.status_code == 200:
            datos = r.json()
            with open(SALIDA_JSON, "w", encoding="utf-8") as f:
                json.dump(datos, f, ensure_ascii=False, indent=2)
            print(f"Datos descargados y guardados en {SALIDA_JSON}")
        else:
            print(f"Error {r.status_code} al consultar la API")
    except Exception as e:
        print(f"Fallo al descargar datos: {e}")

if __name__ == "__main__":
    descargar_datos()
