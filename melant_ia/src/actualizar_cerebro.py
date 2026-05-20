
import os
import json
import shutil
from datetime import datetime
import threading
import time
import os
import json
import shutil
from datetime import datetime
import threading
import time

# Configuración de rutas base de MELANTIA
FUENTE = os.path.abspath(os.path.join(os.getcwd(), "..", "knowledge_seeds", "03_asistente_tecnico_veterinario"))
LOG_FILE = "registro_actualizaciones.log"

DESTINOS = [
    "asistente_veterinario_ampliado.json",
    "Dataset_Optimizado",  # El cofre de 252 MB con las fotos de enfermedades (Aftosa, Dermatosis, Ojo Rosado)
    "ganado_bovino",       # Estructuras operativas de Don Jorge
    "aves",
    "cabras",
    "cerdos",
    "cuyes"
]

def copiar_actualizar():
    print(f"\n[INICIO] Iniciando migración de conocimiento desde: {FUENTE}")
    cambios = []
    
    for carpeta in DESTINOS:
        # ----------------------------------------------------------
        # CASO A: Es un archivo de configuración suelto (.json)
        # ----------------------------------------------------------
        if carpeta.endswith('.json'):
            src_file = os.path.join(FUENTE, carpeta)
            dst_file = os.path.join(os.getcwd(), carpeta)
            dst_dir = os.path.dirname(dst_file)
            
            if not os.path.exists(src_file):
                print(f"[AVISO] No se encontró el archivo origen: {src_file}, se omite.")
                continue
                
            if not os.path.exists(dst_dir):
                os.makedirs(dst_dir)
                
            try:
                # Copia simple con metadatos para archivos de texto
                shutil.copy2(src_file, dst_file)
                print(f"[OK] Configuración actualizada: {carpeta}")
                cambios.append(carpeta)
            except Exception as e:
                print(f"[ERROR] No se pudo copiar el archivo {carpeta}: {e}")
                
        # ----------------------------------------------------------
        # CASO B: Es una estructura de directorios o datasets de fotos
        # ----------------------------------------------------------
        else:
            src_dir = os.path.join(FUENTE, carpeta)
            dst_dir = os.path.join(os.getcwd(), carpeta)
            
            if not os.path.exists(src_dir):
                print(f"[AVISO] Carpeta no encontrada en origen: {src_dir}, se omite.")
                continue
                
            if os.path.isdir(src_dir):
                print(f"\n[MIGRACIÓN] Moviendo estructura completa de: {carpeta}")
                
                # Si el directorio de ejecución ya existe, lo limpiamos para una carga limpia
                if os.path.exists(dst_dir):
                    print(f" ┃ -> Removiendo versión obsoleta en destino...")
                    shutil.rmtree(dst_dir)
                    
                try:
                    # Copia recursiva de carpetas (Trae los 252 MB de fotos de vacas de golpe)
                    # Ignoramos la carpeta interna .venv para no duplicar basura de dependencias
                    shutil.copytree(
                        src_dir, 
                        dst_dir, 
                        ignore=shutil.ignore_patterns('.venv', '*_only', '.gitkeep')
                    )
                    print(f" ┗ 🚀 [ÉXITO] Carpeta clonada en producción: {carpeta}")
                    cambios.append(carpeta)
                except Exception as e:
                    print(f" ┗ ❌ [ERROR] Falló la migración del árbol de {carpeta}: {e}")
                    
    return cambios

def registrar_log(cambios):
    if not cambios:
        return
    # Deja asentado en el cuaderno de la finca los cambios de la jornada
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Archivo de actualización ejecutado.\n")
        for c in cambios:
            f.write(f" - Actualizado: {c}\n")
    print(f"\n[LOG] Se registraron {len(cambios)} movimientos en {LOG_FILE}\n")

def programar_actualizacion():
    # Esta es la rutina interna que corre el hilo en segundo plano cada 60 segundos
    cambios_detectados = copiar_actualizar()
    registrar_log(cambios_detectados)

if __name__ == '__main__':
    # Hilo secundario (Daemon) para que MELANTIA verifique datos de fondo mientras el usuario trabaja
    t = threading.Thread(target=programar_actualizacion, daemon=True)
    t.start()
    
    print("[HILO] Temporizador de actualización corriendo en segundo plano...")
    
    # Bucle infinito para mantener vivo el script en la terminal
    while True:
        time.sleep(60)

