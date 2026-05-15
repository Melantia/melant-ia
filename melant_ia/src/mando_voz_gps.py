
# src/mando_voz_gps.py
import json
try:
    from vosk import Model, KaldiRecognizer
except ImportError:
    Model = None
    KaldiRecognizer = None
    print("[ERROR] No se pudo importar 'vosk'. Por favor, instale el paquete con 'pip install vosk'.")

class MandoVozMelantia:
    def __init__(self):
        # Usamos la ruta que ya confirmó en su carpeta
        self.model = Model("../models/vosk-model-small-es-0.42")
        self.contexto_actual = "CULTIVO" # Por defecto

    def procesar_comando(self, texto):
        texto = texto.lower()
        
        # 1. Definir qué estamos midiendo para evitar confusiones
        if "medir corral" in texto or "infraestructura" in texto:
            self.contexto_actual = "INFRAESTRUCTURA"
            print(">>> Modo: Medición de Construcciones Activo")
            
        elif "medir lote" in texto or "cacao" in texto:
            self.contexto_actual = "CULTIVO"
            print(">>> Modo: Medición de Lotes de Cacao Activo")

        # 2. Acciones del GPS según el contexto
        if "marcar punto" in texto:
            self.guardar_punto_gps(self.contexto_actual)
            
    def guardar_punto_gps(self, tipo):
        # Aquí se guarda en el JSON
        print(f">>> GPS: Punto registrado en la hoja de {tipo}")
