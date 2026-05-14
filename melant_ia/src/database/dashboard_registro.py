import sqlite3
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore

# --- CONFIGURACIÓN SQLITE ---
def init_sqlite():
    conn = sqlite3.connect('melant_dashboard.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS informes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha TEXT,
        productor TEXT,
        origen TEXT,
        tecnico TEXT,
        gps TEXT,
        url_almacenamiento TEXT
    )''')
    conn.commit()
    return conn

# --- CONFIGURACIÓN FIREBASE ---
def init_firebase():
    # Reemplaza 'ruta/credenciales.json' por la ruta real de tu archivo de credenciales
    cred = credentials.Certificate('ruta/credenciales.json')
    firebase_admin.initialize_app(cred)
    return firestore.client()

# --- REGISTRO EN DASHBOARD ---
def registrar_en_dashboard(datos_informe, conn_sqlite=None, db_firebase=None):
    payload = {
        "fecha": datetime.now().isoformat(),
        "productor": datos_informe['productor'],
        "origen": datos_informe['modulo'],
        "tecnico": datos_informe['tecnico'],
        "gps": f"{datos_informe['lat']}, {datos_informe['lon']}",
        "url_almacenamiento": datos_informe['ruta_final']
    }
    # Guardar en SQLite
    if conn_sqlite:
        c = conn_sqlite.cursor()
        c.execute('''INSERT INTO informes (fecha, productor, origen, tecnico, gps, url_almacenamiento) VALUES (?, ?, ?, ?, ?, ?)''',
                  (payload['fecha'], payload['productor'], payload['origen'], payload['tecnico'], payload['gps'], payload['url_almacenamiento']))
        conn_sqlite.commit()
        print(f"✅ Guardado en SQLite: {payload['productor']} - {payload['origen']}")
    # Guardar en Firebase
    if db_firebase:
        db_firebase.collection('informes').add(payload)
        print(f"✅ Guardado en Firebase: {payload['productor']} - {payload['origen']}")

# --- USO EJEMPLO ---
if __name__ == "__main__":
    # Inicializar conexiones
    conn_sqlite = init_sqlite()
    # db_firebase = init_firebase() # Descomenta y configura credenciales para usar Firebase
    db_firebase = None
    # Datos de ejemplo
    datos_informe = {
        'productor': 'Hacienda El Porvenir',
        'modulo': 'ATR',
        'tecnico': 'Ing. Juan Perez',
        'lat': -0.2186,
        'lon': -78.5097,
        'ruta_final': '/ruta/ejemplo/2026-04-27_ATR_Ing.Juan_Perez_[-0.2186,-78.5097].pdf'
    }
    registrar_en_dashboard(datos_informe, conn_sqlite, db_firebase)
