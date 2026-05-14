import sqlite3
import os

# Definimos la ruta de la base de datos para que siempre se guarde en la carpeta correcta
DB_PATH = os.path.join(os.path.dirname(__file__), "melant_ia.db")

def inicializar_bd():
    """Crea las tablas necesarias si no existen."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Tabla para registros de salud
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS registros_salud (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo TEXT, 
            modulo TEXT,
            detalle TEXT,
            fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Tabla para Gestión Productiva (Cerdos, Aves, etc.)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS gestion_productiva (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            categoria TEXT,
            item TEXT,
            valor REAL,
            fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    print(f"✅ Base de datos sincronizada en: {DB_PATH}")

# Esto permite que si ejecutas este archivo directamente, se cree la base de datos
if __name__ == "__main__":
    inicializar_bd()
    