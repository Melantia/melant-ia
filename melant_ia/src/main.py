# main.py — MELANTIA Admin Desktop

import os
import sys
import subprocess
import time
# Integración de lógica de supervivencia MELANTIA
try:
    from utils.supervivencia import (
        verificar_estado_celular,
        guardar_evidencia_offline,
        barra_progreso_ligera,
        ejecutar_proceso_seguro,
        verificar_modo_offline,
        activar_modo_nocturno,
        desactivar_modo_nocturno,
        procesar_evidencia_inteligente
    )
except ImportError:
    print("[ADVERTENCIA] No se pudo cargar utils/supervivencia.py. Funciones de ahorro extremo deshabilitadas.")

def hay_conexion_internet():
    import socket
    try:
        # Intenta conectarse a un servidor público
        socket.create_connection(("8.8.8.8", 53), timeout=2)
        return True
    except Exception:
        return False

def notificar_usuario(mensaje):
    try:
        from ia.voz_ia import hablar_voz
        hablar_voz(mensaje, voz='Don Eloy')
    except Exception:
        print("[Don Eloy]:", mensaje)

def verificar_actualizaciones():
    if hay_conexion_internet():
        print("Conexión detectada. Buscando actualizaciones...")
        # Ejecuta el script de actualización automática
        script_path = os.path.join(os.path.dirname(__file__), "actualizar_cerebro.py")
        if os.path.exists(script_path):
            subprocess.run([sys.executable, script_path])
            notificar_usuario("¡Patrón! Le acabo de poner herramientas nuevas a la App. ¡Écheles un ojo!")
        else:
            print("No se encontró actualizar_cerebro.py")
    else:
        print("Sin conexión. No se puede actualizar.")

def main():
    print("=== MELANTIA Admin Desktop ===")
    # verificar_actualizaciones()  # Desactivado: ahora la actualización es solo en horarios programados
    # Aquí puedes agregar más lógica de administración, menús, etc.
    # ...

if __name__ == "__main__":
    main()
