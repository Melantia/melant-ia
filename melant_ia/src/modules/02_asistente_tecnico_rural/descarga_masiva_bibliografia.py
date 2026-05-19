import os
import sqlite3
import requests
import csv
import json

def descargar_y_registrar(lista_enlaces, db_path='bibliografia.db'):
    """
    Descarga manuales desde una lista de diccionarios y los registra en la base de datos.
    Cada item debe tener: nombre_comun, cientifico_tecnico, fuente_biblio, url_pdf, archivo_ref, categoria, umbral_alerta, palabras_clave
    """
    os.makedirs('bibliografia', exist_ok=True)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    for item in lista_enlaces:
        # Descargar PDF si hay url
        if item.get('url_pdf') and item.get('archivo_ref'):
            try:
                resp = requests.get(item['url_pdf'])
                if resp.status_code == 200:
                    os.makedirs(os.path.dirname(item['archivo_ref']), exist_ok=True)
                    with open(item['archivo_ref'], 'wb') as f:
                        f.write(resp.content)
                    print(f"✅ Descargado: {item['archivo_ref']}")
                else:
                    print(f"❌ Error al descargar {item['url_pdf']}")
            except Exception as e:
                print(f"❌ Error: {e}")
        # Insertar en DB
        cur.execute('''
            INSERT INTO bibliografia (categoria, nombre_comun, cientifico_tecnico, fuente_biblio, archivo_ref, umbral_alerta, palabras_clave)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            item.get('categoria'),
            item.get('nombre_comun'),
            item.get('cientifico_tecnico'),
            item.get('fuente_biblio'),
            item.get('archivo_ref'),
            item.get('umbral_alerta'),
            ','.join(item.get('palabras_clave', []))
        ))
    conn.commit()
    conn.close()
    print('✅ Proceso masivo completado.')

# Ejemplo de uso con lista en Python
# lista = [
#   {"categoria": "Plaga", "nombre_comun": "Roya", "cientifico_tecnico": "Hemileia vastatrix", "fuente_biblio": "FAO", "url_pdf": "https://ejemplo.com/roya.pdf", "archivo_ref": "bibliografia/manuales_fao/roya.pdf", "umbral_alerta": None, "palabras_clave": ["cafe", "hongo", "mancha"]},
#   ...
# ]
# descargar_y_registrar(lista)

# Para CSV/JSON, ver scripts adicionales.
