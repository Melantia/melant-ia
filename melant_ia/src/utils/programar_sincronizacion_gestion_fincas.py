# Script para registrar la tarea programada en Windows que sincroniza Gestión de Fincas
import os
import subprocess
import sys

# Ruta absoluta al script de sincronización
script_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'sincronizar_gestion_fincas.py'))

# Comando para crear la tarea programada (ejecuta cada día a las 2:00 AM)
task_name = "SincronizarGestionFincasMelantia"
cmd = [
    'schtasks',
    '/Create',
    '/SC', 'DAILY',
    '/TN', task_name,
    '/TR', f'"{sys.executable}" "{script_path}"',
    '/ST', '02:00',
    '/F'
]

try:
    print("Registrando tarea programada para sincronizar Gestión de Fincas y Trazabilidad...")
    subprocess.run(' '.join(cmd), check=True, shell=True)
    print(f"Tarea '{task_name}' creada correctamente. Se ejecutará todos los días a las 2:00 AM.")
except Exception as e:
    print(f"Error al crear la tarea programada: {e}")
