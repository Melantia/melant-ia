import os
import platform
from datetime import datetime

def preparar_salida_informe(productor, tecnico, lat, lon, modulo):
    """
    1. Crea la estructura de carpetas (Local y Servidor).
    2. Clasifica según el origen (ATR, Drones, Suelos, etc.).
    3. Genera un nombre de archivo profesional y único.
    """
    # --- CONFIGURACIÓN DE RUTAS ---
    home = os.path.expanduser("~")
    base_local = os.path.join(home, "Documents", "MELANT_IA", "PRODUCTORES")
    # En el servidor, define la ruta de tu base de datos de archivos
    base_servidor = "DATOS_MELANT_IA_INTERNO"
    # --- LÓGICA DE CLASIFICACIÓN (Evolutiva) ---
    categorias = {
        "ATR": "01_Asistencia_Tecnica_Rural",
        "DRON": "02_Monitoreo_Drones_Satellites",
        "SUELO": "03_Analisis_Suelo_Precision",
        "MAQUINARIA": "04_Aplicacion_Variable_VRT",
        "COSTOS": "05_Gestion_Economica_ROI"
    }
    subcarpeta = categorias.get(modulo.upper(), "06_Otros_Informes")
    fecha_hoy = datetime.now().strftime("%Y-%m-%d")
    anio_actual = str(datetime.now().year)
    # --- CREACIÓN DE DIRECTORIOS ---
    # Ruta: Documentos/MELANT_IA/PRODUCTORES/Nombre_Productor/Categoria/Año
    ruta_destino = os.path.join(base_local, productor.replace(" ", "_"), subcarpeta, anio_actual)
    try:
        os.makedirs(ruta_destino, exist_ok=True)
        # Aquí podrías añadir la lógica para crear también en el servidor central
    except Exception as e:
        return f"Error creando carpetas: {e}"
    # --- GENERACIÓN DEL NOMBRE DE ARCHIVO PROFESIONAL ---
    # Formato: FECHA_MODULO_TECNICO_LAT_LON.pdf
    nombre_limpio_tecnico = tecnico.replace(" ", "_")
    nombre_archivo = f"{fecha_hoy}_{modulo.upper()}_{nombre_limpio_tecnico}_[{lat},{lon}].pdf"
    ruta_completa_archivo = os.path.join(ruta_destino, nombre_archivo)
    return {
        "ruta_final": ruta_completa_archivo,
        "directorio": ruta_destino,
        "archivo": nombre_archivo
    }

# --- EJEMPLO DE EJECUCIÓN REAL EN LA APP ---
# Supongamos que un Técnico realiza una Asistencia Técnica Rural (ATR)
resultado = preparar_salida_informe(
    productor="Hacienda El Porvenir",
    tecnico="Ing. Juan Perez",
    lat=-0.2186,
    lon=-78.5097,
    modulo="ATR"
)

print(f"✅ Carpeta de destino lista: {resultado['directorio']}")
print(f"📄 Nombre del informe generado: {resultado['archivo']}")
print(f"📍 Ruta completa para guardar: {resultado['ruta_final']}")
