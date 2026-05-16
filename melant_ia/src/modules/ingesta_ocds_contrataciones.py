"""
Script para ingesta de datos de la API OCDS de Contrataciones Abiertas Ecuador.
Descarga y almacena información de compras públicas de fertilizantes e insumos agrícolas para MELANT IA.
"""
import requests
import json
import os
from datetime import datetime

DIR_SALIDA = "aprendizaje_melant_ia/datos_fuentes/"
if not os.path.exists(DIR_SALIDA):
    os.makedirs(DIR_SALIDA)

# Endpoint de búsqueda OCDS (puedes filtrar por palabra clave, fechas, etc.)
OCDS_SEARCH_URL = "https://datosabiertos.compraspublicas.gob.ec/PLATAFORMA/api/search_ocds"

# Parámetros de ejemplo para buscar fertilizantes e insumos agrícolas de los últimos 3 años
hoy = datetime.now()
anos = [hoy.year - i for i in range(3)]

PALABRAS_CLAVE = ["fertilizante", "insumo agrícola", "urea", "abono", "pesticida", "herbicida"]


def buscar_y_guardar_ocds(palabra, anio):
    params = {
        "q": palabra,
        "year": anio,
        "size": 1000  # Ajusta según la cantidad de resultados
    }
    try:
        r = requests.get(OCDS_SEARCH_URL, params=params, timeout=30)
        if r.status_code == 200:
            datos = r.json()
            ruta = os.path.join(DIR_SALIDA, f"ocds_{palabra}_{anio}.json")
            with open(ruta, "w", encoding="utf-8") as f:
                json.dump(datos, f, ensure_ascii=False, indent=2)
            print(f"Datos OCDS guardados en {ruta}")
        else:
            print(f"Error {r.status_code} al consultar OCDS para {palabra} {anio}")
    except Exception as e:
        print(f"Fallo al descargar OCDS para {palabra} {anio}: {e}")


def ingesta_ocds():
    for anio in anos:
        for palabra in PALABRAS_CLAVE:
            buscar_y_guardar_ocds(palabra, anio)
    print("Ingesta OCDS completada.")

if __name__ == "__main__":
    ingesta_ocds()
