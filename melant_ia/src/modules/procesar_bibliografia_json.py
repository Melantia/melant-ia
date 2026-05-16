import json
import sqlite3
import os

CAMPOS_OBLIGATORIOS = [
    "id", "titulo", "categoria", "subcategoria", "cultivo", "idioma", "region", "nivel_tecnico",
    "url_descarga", "descripcion", "palabras_clave", "autor", "año"
]

def validar_bibliografia_json(ruta_json):
    with open(ruta_json, 'r', encoding='utf-8') as f:
        datos = json.load(f)
    errores = False
    datos_validos = []
    for i, entrada in enumerate(datos):
        faltantes = [campo for campo in CAMPOS_OBLIGATORIOS if campo not in entrada or entrada[campo] in (None, "", [])]
        if faltantes:
            print(f"⚠️ Entrada #{i+1} ('{entrada.get('titulo','SIN TITULO')}') con campos faltantes: {faltantes}")
            errores = True
        else:
            datos_validos.append(entrada)
    if not errores:
        print("✅ Todas las entradas tienen los campos obligatorios.")
    else:
        print("❌ Revisa y completa los campos indicados.")
    return datos_validos

def crear_tabla_sqlite(db_path='bibliografia.db'):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS bibliografia (
            id INTEGER PRIMARY KEY,
            titulo TEXT,
            categoria TEXT,
            subcategoria TEXT,
            cultivo TEXT,
            idioma TEXT,
            region TEXT,
            nivel_tecnico TEXT,
            url_descarga TEXT,
            descripcion TEXT,
            palabras_clave TEXT,
            autor TEXT,
            anio INTEGER
        )
    ''')
    conn.commit()
    conn.close()

def insertar_lote_sqlite(datos, db_path='bibliografia.db', lote=10):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    for i in range(0, len(datos), lote):
        batch = datos[i:i+lote]
        for entrada in batch:
            cur.execute('''
                INSERT OR REPLACE INTO bibliografia (id, titulo, categoria, subcategoria, cultivo, idioma, region, nivel_tecnico, url_descarga, descripcion, palabras_clave, autor, anio)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                entrada['id'],
                entrada['titulo'],
                entrada['categoria'],
                entrada['subcategoria'],
                entrada['cultivo'],
                entrada['idioma'],
                entrada['region'],
                entrada['nivel_tecnico'],
                entrada['url_descarga'],
                entrada['descripcion'],
                ','.join(entrada['palabras_clave']),
                entrada['autor'],
                entrada['año']
            ))
        conn.commit()
        print(f"✅ Insertado lote {i//lote+1} ({len(batch)} registros)")
    conn.close()

def actualizar_manifiesto_sqlite(db_path='bibliografia.db', manifiesto_path='descargas/manifiesto.json'):
    if not os.path.exists(manifiesto_path):
        print(f"⚠️ Manifiesto no encontrado: {manifiesto_path}")
        return
    with open(manifiesto_path, 'r', encoding='utf-8') as f:
        manifiesto = json.load(f)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    for item in manifiesto:
        cur.execute('''
            UPDATE bibliografia SET url_descarga=?, anio=COALESCE(anio, ?)
            WHERE titulo=?
        ''', (item.get('url'), item.get('version', None), item.get('archivo').replace('.pdf','').replace('_',' ')))
    conn.commit()
    conn.close()
    print(f"📝 Manifiesto sincronizado con la base de datos.")

if __name__ == '__main__':
    crear_tabla_sqlite()
    datos = validar_bibliografia_json('plantilla_bibliografia.json')
    if datos:
        insertar_lote_sqlite(datos)
    actualizar_manifiesto_sqlite()
