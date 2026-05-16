"""
Script para ingesta automática de datos de SIPA y Agrocalidad (últimos 3 años) para MELANT IA.
Descarga, almacena y actualiza la base de datos técnica, permitiendo sincronización incremental.
"""
import os
import requests
import json
from datetime import datetime

DIR_SALIDA = "aprendizaje_melant_ia/datos_fuentes/"
if not os.path.exists(DIR_SALIDA):
    os.makedirs(DIR_SALIDA)

# URLs de ejemplo (ajustar según endpoints reales y documentación oficial)
SIPA_URL = "https://sipa.agricultura.gob.ec/api/v1/insumos?desde={desde}&hasta={hasta}"
AGROCALIDAD_URL = "https://www.agrocalidad.gob.ec/api/v1/productos?desde={desde}&hasta={hasta}"

# Fechas para los últimos 3 años
hoy = datetime.now()
anos = [hoy.year - i for i in range(3)]


def descargar_y_guardar(url, nombre):
    try:
        r = requests.get(url, timeout=30)
        if r.status_code == 200:
            datos = r.json()
            ruta = os.path.join(DIR_SALIDA, nombre)
            with open(ruta, "w", encoding="utf-8") as f:
                json.dump(datos, f, ensure_ascii=False, indent=2)
            print(f"Datos guardados en {ruta}")
        else:
            print(f"Error {r.status_code} al consultar {url}")
    except Exception as e:
        print(f"Fallo al descargar {url}: {e}")


def ingesta_incremental():
    for anio in anos:
        desde = f"{anio}-01-01"
        hasta = f"{anio}-12-31"
        url_sipa = SIPA_URL.format(desde=desde, hasta=hasta)
        url_agro = AGROCALIDAD_URL.format(desde=desde, hasta=hasta)
        descargar_y_guardar(url_sipa, f"sipa_{anio}.json")
        descargar_y_guardar(url_agro, f"agrocalidad_{anio}.json")

    print("Ingesta de SIPA y Agrocalidad completada.")

if __name__ == "__main__":
    ingesta_incremental()
