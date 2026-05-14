import os
import platform
from datetime import datetime

def crear_estructura_melant(nombre_productor, modulo_origen):
    """
    Crea dinámicamente la ruta de carpetas para MELANT IA.
    Clasifica por Productor y Origen (AP, ATR, Costos, etc.)
    """
    # 1. Detectar la carpeta "Documentos" del usuario actual
    sistema = platform.system()
    home = os.path.expanduser("~")
    if sistema == "Windows":
        ruta_base_local = os.path.join(home, "Documents", "MELANT_IA")
    else:
        ruta_base_local = os.path.join(home, "Documents", "MELANT_IA")
    # 2. Definir la ruta interna del servidor (Simulación)
    # En producción, esto sería un volumen montado o ruta de red
    ruta_base_servidor = "DATOS_MELANT_IA_SERVER"
    # 3. Diccionario de clasificación (Se actualiza según configures la App)
    clasificacion = {
        "DRON": "01_Drones_y_Satélites",
        "SUELO": "02_Analisis_de_Suelo",
        "MAQUINARIA": "03_Maquinaria_VRT",
        "ECONOMICO": "04_Gestion_Economica",
        "ATR": "05_Asistencia_Tecnica_Rural"
    }
    # Obtener el nombre de la subcarpeta según el origen
    subcarpeta_origen = clasificacion.get(modulo_origen.upper(), "06_Otros_Informes")
    # 4. Construir las rutas completas
    # Formato: MELANT_IA / Nombre_Productor / Origen / Año
    anio_actual = str(datetime.now().year)
    ruta_final_local = os.path.join(ruta_base_local, nombre_productor, subcarpeta_origen, anio_actual)
    ruta_final_servidor = os.path.join(ruta_base_servidor, nombre_productor, subcarpeta_origen, anio_actual)
    # 5. Crear las carpetas si no existen
    try:
        os.makedirs(ruta_final_local, exist_ok=True)
        # os.makedirs(ruta_final_servidor, exist_ok=True) # Descomentar en el servidor
        print(f"✅ Estructura lista para: {nombre_productor}")
        print(f"📂 Ruta local: {ruta_final_local}")
        return ruta_final_local
    except Exception as e:
        print(f"❌ Error al crear carpetas: {e}")
        return None

# --- EJEMPLO DE USO CUANDO LA APP GENERA UN INFORME ---
# Si el técnico genera una visita de Asistencia Técnica Rural:
# ruta_guardado = crear_estructura_melant("Hacienda_La_Esperanza", "ATR")
# Si se genera un mapa de drones:
# ruta_guardado = crear_estructura_melant("Hacienda_La_Esperanza", "DRON")
