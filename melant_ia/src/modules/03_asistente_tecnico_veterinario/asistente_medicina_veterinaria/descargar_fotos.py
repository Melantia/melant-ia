# -*- coding: utf-8 -*-
"""
Extractor de referencias bibliograficas para MELANT IA
Crea un archivo .txt por cada referencia con su contenido.
"""
import os
import subprocess
import sys

def instalar(pkg):
    subprocess.check_call([sys.executable, "-m", "pip", "install", pkg, "--quiet"])

try:
    import requests
except ImportError:
    instalar("requests"); import requests

try:
    from bs4 import BeautifulSoup
except ImportError:
    instalar("beautifulsoup4")
    from bs4 import BeautifulSoup

"""
MELANTIA - Configuración para el script de descarga de imágenes
"""
import os

CARPETA_DESTINO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "knowledge_seeds", "03_asistente_tecnico_veterinario", "dataset_optimizado"))

# =====================================================================
# REFERENCIAS — solo las que tienen URL accesible
# =====================================================================
REFERENCIAS = [
    {
        "archivo": "Andrade-Yucailla_2017_pollos_camperos_Ecuador",
        "cita": "Andrade-Yucailla et al. (2017). Comportamiento productivo de dos fenotipos de pollos camperos en la region Amazonica de Ecuador. Revista Amazonica, 6(1), 1-8.",
        "url": "https://doi.org/10.59410/RACYT-v06n01ep01-0075"
    },
    # ...agrega el resto de tus referencias aquí...
]