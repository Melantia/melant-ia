import numpy as np
from PIL import Image
import os

# 1. Manejo inteligente de la librería de IA
try:
    from tensorflow.lite.python.interpreter import Interpreter
except ImportError:
    try:
        from tflite_runtime.interpreter import Interpreter
    except ImportError:
        print("❌ Error: No se encontró TensorFlow. Ejecuta: pip install tensorflow")

class DetectorFitopatologico:
    def __init__(self, ruta_modelo):
        """Inicializa el motor de IA para funcionamiento OFFLINE."""
        self.hallazgos = []
        try:
            self.interpreter = Interpreter(model_path=ruta_modelo)
            self.interpreter.allocate_tensors()
            self.input_details = self.interpreter.get_input_details()
            self.output_details = self.interpreter.get_output_details()
            print("✅ Modelo cargado correctamente.")
        except Exception as e:
            print(f"❌ Error al cargar el modelo TFLite: {e}")
            self.interpreter = None

    def obtener_resumen_hallazgos(self):
        """Retorna un resumen de los últimos hallazgos de plagas/enfermedades."""
        if not self.hallazgos:
            return "Sin hallazgos recientes."
        return f"{len(self.hallazgos)} hallazgo(s): " + ", ".join(self.hallazgos[-3:])

# --- BLOQUE DE PRUEBA OFFLINE ---
if __name__ == "__main__":
    ruta_base = os.path.dirname(__file__)
    ruta_al_modelo = os.path.join(ruta_base, "modelo_ligero.tflite")
    ia = DetectorFitopatologico(ruta_al_modelo)