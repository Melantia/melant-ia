import subprocess
import sys

def instalar(paquete):
    print(f"Instalando {paquete}...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", paquete])

# Lista de lo que necesitas para tu proyecto de agricultura
librerias = ["pandas", "matplotlib", "pyttsx3"]
for lib in librerias:
    try:
        instalar(lib)
        print(f"✅ {lib} se instaló correctamente.")
    except Exception as e:
        print(f"❌ Error instalando {lib}: {e}")

print("\n--- Proceso terminado ---")
