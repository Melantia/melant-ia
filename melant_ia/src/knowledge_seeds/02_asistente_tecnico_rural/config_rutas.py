# src/config_rutas.py
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
DOCUMENTOS_DIR = os.path.join(BASE_DIR, "documentos")

# Crea las carpetas si no existen para que no den error
for carpeta in [DATA_DIR, DOCUMENTOS_DIR]:
    if not os.path.exists(carpeta):
        os.makedirs(carpeta)