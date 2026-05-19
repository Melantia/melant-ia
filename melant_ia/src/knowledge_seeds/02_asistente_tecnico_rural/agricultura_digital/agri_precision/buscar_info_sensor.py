import sqlite3

def buscar_info_sensor(sensor_modelo, db_path='bibliografia.db'):
    """
    Busca información técnica y umbrales de alerta para un sensor específico.
    """
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("""
        SELECT nombre_comun, cientifico_tecnico, fuente_biblio, archivo_ref, umbral_alerta
        FROM bibliografia
        WHERE LOWER(cientifico_tecnico) = LOWER(?) OR LOWER(nombre_comun) = LOWER(?)
        LIMIT 1
    """, (sensor_modelo, sensor_modelo))
    row = cur.fetchone()
    conn.close()
    if row:
        nombre, modelo, fuente, archivo, umbral = row
        print(f"\n✅ Sensor: {nombre} ({modelo})\nFuente: {fuente}\nManual: {archivo}\nUmbral de alerta: {umbral}")
    else:
        print(f"❌ No se encontró información para el sensor: {sensor_modelo}")

# Ejemplo de uso:
# buscar_info_sensor('RS485-NPK')
