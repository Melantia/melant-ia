
python
import os
import json
import queue
import sounddevice as sd
from vosk import Model, KaldiRecognizer

class OidoValentina:
    def __init__(self):
        # Descargue un modelo ligero de Vosk (español) en la carpeta 'models'
        self.modelo_path = "models/vosk-model-small-es-0.42"
        if not os.path.exists(self.modelo_path):
            print(">>> Error: No se encuentra el modelo de voz en /models")
            
        self.model = Model(self.modelo_path)
        self.cola_audio = queue.Queue()

    def callback_audio(self, indata, frames, time, status):
        """Captura el audio del micrófono continuamente"""
        self.cola_audio.put(bytes(indata))

    def escuchar_comandos(self, callback_gps):
        """Escucha y activa funciones del GPS por voz"""
        with sd.RawInputStream(samplerate=16000, blocksize=8000, dtype='int16',
                               channels=1, callback=self.callback_audio):
            
            rec = KaldiRecognizer(self.model, 16000)
            print(">>> Valentina te escucha... (Diga: 'Marcar punto' o 'Cerrar lote')")

            while True:
                data = self.cola_audio.get()
                if rec.AcceptWaveform(data):
                    resultado = json.loads(rec.Result())
                    comando = resultado.get("text", "")
                    
                    if "marcar punto" in comando:
                        print(">>> Voz detectada: Marcando coordenada...")
                        callback_gps.marcar_punto_actual()
                    
                    elif "cerrar lote" in comando:
                        print(">>> Voz detectada: Calculando área...")
                        callback_gps.finalizar_medicion()