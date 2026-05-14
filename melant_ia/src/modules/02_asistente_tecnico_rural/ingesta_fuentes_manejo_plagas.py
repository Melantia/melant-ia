"""
Script de ingesta automática de fuentes externas para manejo de plagas (químico y orgánico).
Descarga, estructura y almacena datos clave para el cerebro MELANT IA.
"""
import requests
import json
from pathlib import Path

# --- Fuentes externas ---
FUENTES = [
    {
        "nombre": "ATTRA Sustainable Pest and Weed Control",
        "url": "https://attra.ncat.org/es/base-de-datos-de-control-sostenible-de-plagas-y-malezas/",
        "tipo": "web"
    },
    {
        "nombre": "Guía MIP JICA",
        "url": "https://www.jica.go.jp/project/panama/0603268/materials/pdf/04_manual/manual_04.pdf",
        "tipo": "pdf"
    },
    {
        "nombre": "Hoja de Datos USDA",
        "url": "https://www.ams.usda.gov/sites/default/files/media/FINAL%20Manejo%20Organico%20de%20Plagas.pdf",
        "tipo": "pdf"
    }
]

# --- Carpeta de destino ---
DESTINO = Path("conocimiento/fuentes_manejo_plagas")
DESTINO.mkdir(parents=True, exist_ok=True)

# --- Descarga y almacenamiento ---
def descargar_fuentes():
    for fuente in FUENTES:
        nombre_archivo = fuente["nombre"].replace(" ", "_").replace("/", "_").lower()
        if fuente["tipo"] == "web":
            # Guardar solo la URL como referencia (scraping avanzado requiere permisos)
            with open(DESTINO / f"{nombre_archivo}.url", "w", encoding="utf-8") as f:
                f.write(fuente["url"])
        elif fuente["tipo"] == "pdf":
            try:
                r = requests.get(fuente["url"])
                if r.status_code == 200:
                    with open(DESTINO / f"{nombre_archivo}.pdf", "wb") as f:
                        f.write(r.content)
            except Exception as e:
                print(f"Error descargando {fuente['nombre']}: {e}")

if __name__ == "__main__":
    descargar_fuentes()
    print("Fuentes descargadas y almacenadas en conocimiento/fuentes_manejo_plagas/")
