import sqlite3
import shutil
import os
from datetime import datetime

# Ruta centralizada de la base de datos del sistema
_DB_PATH = os.path.join(
    os.path.dirname(__file__), '..', '..', 'sistema_agro.db'
)


def registrar_tratamiento(medicamento, dosis, unidad, peso_animal, animal_id=None):
    """
    Guarda automáticamente en historial_tratamientos cada vez que el motor
    de inferencia dicta una dosis.

    Args:
        medicamento  (str):   Nombre del medicamento aplicado.
        dosis        (float): Cantidad calculada.
        unidad       (str):   'mL' o 'mg'.
        peso_animal  (float): Peso del animal en kg.
        animal_id    (int):   ID del animal en la BD; None si no se conoce.
    """
    conn = None
    try:
        conn = sqlite3.connect(_DB_PATH)
        cursor = conn.cursor()

        # Crear la tabla si todavía no existe
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS historial_tratamientos (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                animal_id    INTEGER,
                medicamento  TEXT    NOT NULL,
                dosis        REAL    NOT NULL,
                unidad       TEXT    NOT NULL,
                peso_animal  REAL,
                fecha        TEXT    NOT NULL
            )
        """)

        cursor.execute("""
            INSERT INTO historial_tratamientos
                (animal_id, medicamento, dosis, unidad, peso_animal, fecha)
            VALUES (?, ?, ?, ?, ?, datetime('now','localtime'))
        """, (animal_id, medicamento, dosis, unidad, peso_animal))

        conn.commit()
    except Exception as e:
        print(f"[Trazabilidad] Error al registrar tratamiento: {e}")
    finally:
        if conn:
            conn.close()

def registrar_animal_con_foto(especie, identificador, ruta_foto_original, empleado_id):
    # 1. Definir la nueva ruta en la estructura limpia
    destino_carpeta = os.path.join('src', 'storage', 'trazabilidad')
    if not os.path.exists(destino_carpeta):
        os.makedirs(destino_carpeta)

    # 2. Crear nombre profesional: ESPECIE_ID_FECHA.jpg
    fecha_hoy = datetime.now().strftime("%Y%m%d")
    nombre_archivo = f"{especie}{identificador}{fecha_hoy}_registro.jpg"
    ruta_destino = os.path.join(destino_carpeta, nombre_archivo)

    try:
        # 3. Mover la foto a la carpeta de trazabilidad
        shutil.copy(ruta_foto_original, ruta_destino)

        # 4. Guardar en la Base de Datos SQL
        conn = sqlite3.connect('sistema_agro.db')
        cursor = conn.cursor()
        
        query = """
        INSERT INTO trazabilidad_animal 
        (tipo_animal, codigo_arete, fecha_nacimiento, ruta_foto_inicio, estado_salud) 
        VALUES (?, ?, ?, ?, ?)
        """
        cursor.execute(query, (especie, identificador, fecha_hoy, ruta_destino, "Sano - Registro Inicial"))
        
        conn.commit()
        conn.close()
        
        print(f"[Trazabilidad] Exito: {especie} registrado con exito.")
        print(f"[Trazabilidad] Foto guardada en: {ruta_destino}")
        
    except Exception as e:
        print(f"[Trazabilidad] Error en el registro: {e}")

if __name__ == '__main__':
    # --- PRUEBA DE REGISTRO EMPRESARIAL ---
    # Imagina que el productor registra un Caballo de Paso Fino:
    registrar_animal_con_foto(
        especie="EQUINO_PASO_FINO",
        identificador="LUCERO_01",
        ruta_foto_original="temp/foto_nacimiento.jpg",
        empleado_id=1,
    )