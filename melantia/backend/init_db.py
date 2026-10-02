# backend/init_db.py
import sqlite3
import os

DB_NAME = "melantia.db"

def init_database():
    print(f"Creando base de datos local SQLite: {DB_NAME}...")
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS usuarios_suscripciones (
        usuario_id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        plan_actual TEXT DEFAULT 'Gratuito',
        melantios_balance REAL DEFAULT 0.0,
        ultima_sincronizacion TEXT
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS registros_asistente (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER,
        tipo_consulta TEXT,
        descripcion TEXT,
        diagnostico_ia TEXT,
        fecha TEXT DEFAULT (datetime('now', 'localtime'))
    )
    """)
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS evidencias_fotograficas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER,
        ruta_imagen TEXT NOT NULL,
        coordenadas_gps TEXT,
        sincronizado_nube INTEGER DEFAULT 0,
        fecha_captura TEXT DEFAULT (datetime('now', 'localtime'))
    )
    """)
    
    # 4. TABLA: Negocios Rurales - Tiendas Virtuales (Módulo 4)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS tiendas_rurales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER UNIQUE, -- Un usuario solo puede tener UNA tienda (Evita la repetición)
        nombre_tienda TEXT NOT NULL,
        descripcion TEXT,
        fecha_creacion TEXT DEFAULT (datetime('now', 'localtime'))
    )
    """)

    # 5. TABLA: Negocios Rurales - Productos de la Tienda
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS productos_tienda (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tienda_id INTEGER,
        nombre_producto TEXT NOT NULL,
        precio REAL NOT NULL,
        stock INTEGER DEFAULT 0,
        FOREIGN KEY(tienda_id) REFERENCES tiendas_rurales(id)
    )
    """)

    cursor.execute("SELECT COUNT(*) FROM usuarios_suscripciones")
    if cursor.fetchone() == 0:
        cursor.execute("""
        INSERT INTO usuarios_suscripciones (nombre, plan_actual, melantios_balance, ultima_sincronizacion)
        VALUES ('Productor Local', 'Premium Rural', 500.0, datetime('now', 'localtime'))
        """)
        print("-> Usuario de prueba creado con 500 Melantios de saldo.")

    conn.commit()
    conn.close()
    print("¡Base de datos local inicializada con éxito!")

if __name__ == "__main__":
    init_database()