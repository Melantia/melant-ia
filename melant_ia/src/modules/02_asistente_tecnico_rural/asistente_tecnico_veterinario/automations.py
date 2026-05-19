import os
from datetime import datetime

try:
    import speech_recognition as sr  # type: ignore # Librería para convertir voz a texto
except ImportError:
    sr = None
    print("Por favor instala speech_recognition: pip install SpeechRecognition")

class AsistenteVozTrazabilidad:
    def __init__(self, especie):
        # El sistema ya sabe la carpeta por la especie que elegiste con el ícono
        self.ruta_archivo = f"src/storage/trazabilidad/{especie}/descripciones.txt"

    def grabar_descripcion_automatica(self, animal_id):
        recognizer = sr.Recognizer()
        with sr.Microphone() as source:
            print("Escuchando descripción del productor...")
            audio = recognizer.listen(source)
            
            try:
                # Convierte la voz en texto (Español)
                texto_dictado = recognizer.recognize_google(audio, language="es-EC")
                
                # Guarda el texto con fecha y ID del animal automáticamente
                registro = f"[{datetime.now()}] ID:{animal_id} - Detalle: {texto_dictado}\n"
                
                with open(self.ruta_archivo, "a") as f:
                    f.write(registro)
                
                return f"✅ Grabado: {texto_dictado}"
            except:
                return "❌ No se pudo entender el audio, intente de nuevo."

# Uso: El productor toca el botón de 'Caballo' y habla.
# asistente = AsistenteVozTrazabilidad("equinos")
# asistente.grabar_descripcion_automatica("PASOFINO_01")