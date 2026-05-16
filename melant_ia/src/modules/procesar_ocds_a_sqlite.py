"""
Procesa los datos descargados de la API OCDS y los inserta/actualiza en la base de datos SQLite de MELANT IA.
Puede ejecutarse periódicamente para mantener la información actualizada.
"""
import os
import json
import sqlite3
from glob import glob

DB_PATH = "aprendizaje_melant_ia/melant_ia.db"
DATOS_DIR = "aprendizaje_melant_ia/datos_fuentes/"

# Asegura que la base de datos y tablas existen (puedes expandir el esquema según tu SQL)
def inicializar_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
    CREATE TABLE IF NOT EXISTS contrataciones (
        id TEXT PRIMARY KEY,
        anio INTEGER,
        producto TEXT,
        proveedor TEXT,
        monto REAL,
        fecha TEXT,
        fuente TEXT
    )
    """)
    conn.commit()
    conn.close()

# Procesa todos los archivos OCDS descargados y actualiza la base de datos
def procesar_ocds():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    archivos = glob(os.path.join(DATOS_DIR, "ocds_*.json"))
    for archivo in archivos:
        with open(archivo, encoding="utf-8") as f:
            datos = json.load(f)
            for item in datos.get("results", []):
                id_ = item.get("ocid")
                anio = item.get("year")
                producto = item.get("title")
                proveedor = item.get("supplier", "")
                monto = item.get("amount", 0)
                fecha = item.get("date", "")
                fuente = "OCDS"
                if id_:
                    c.execute("""
                    INSERT OR REPLACE INTO contrataciones (id, anio, producto, proveedor, monto, fecha, fuente)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (id_, anio, producto, proveedor, monto, fecha, fuente))
    conn.commit()
    conn.close()
    print("Datos OCDS procesados e insertados en la base de datos.")

if __name__ == "__main__":
    inicializar_db()
    procesar_ocds()
