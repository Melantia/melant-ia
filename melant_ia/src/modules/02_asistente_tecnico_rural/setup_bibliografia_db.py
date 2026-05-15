import sqlite3

def crear_tabla_bibliografia(db_path='bibliografia.db'):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS bibliografia (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            categoria TEXT,
            nombre_comun TEXT,
            cientifico_tecnico TEXT,
            fuente_biblio TEXT,
            archivo_ref TEXT,
            umbral_alerta FLOAT
        )
    ''')
    conn.commit()
    print('✅ Tabla bibliografia creada o ya existe.')
    conn.close()

def insertar_ejemplo(db_path='bibliografia.db'):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    ejemplos = [
        ('Plaga', 'Roya del Café', 'Hemileia vastatrix', 'FAO', 'bibliografia/manuales_fao/manual_roya.pdf', None),
        ('Sensor', 'Sensor NPK', 'RS485-NPK', 'Arduino Docs', 'bibliografia/protocolos_sensores/npk_rs485.pdf', 0.45),
        ('Plaga', 'Mosca Blanca', 'Bemisia tabaci', 'EPPO', 'bibliografia/fichas_tecnicas_eppo/mosca_blanca.pdf', None),
        ('Sensor', 'Higrómetro', 'HUM-500', 'Adafruit', 'bibliografia/protocolos_sensores/hum500.pdf', 20.0)
    ]
    cur.executemany('''
        INSERT INTO bibliografia (categoria, nombre_comun, cientifico_tecnico, fuente_biblio, archivo_ref, umbral_alerta)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', ejemplos)
    conn.commit()
    print('✅ Ejemplos insertados.')
    conn.close()

if __name__ == '__main__':
    crear_tabla_bibliografia()
    insertar_ejemplo()
