# main.py — MELANTIA Admin Desktop
import os
import sys
import subprocess
import time

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
    verificar_actualizaciones()
    # Aquí puedes agregar más lógica de administración, menús, etc.
    # ...

if __name__ == "__main__":
    main()
