import json
from utils.gestor_voces_melantia import GestorVocesMelantia
import speech_recognition as sr
from vosk import Model, KaldiRecognizer
import pyaudio
import os

# Simulación de un chatbot simple para MELANTIA
class ChatBotMelantia:
    def __init__(self):
        self.gestor_voces = GestorVocesMelantia()
        # Relación de palabras clave a id de módulo (puedes mejorar esto con NLP)
        self.temas_modulo = {
            'escuela de campo': 7,
            'asistente técnico rural': 2,
            'finanzas': 5,
            'proyectos': 6,
            'comunidad': 8,
            'salud rural': 9,
            'suscripciones': 1,
            'trazabilidad': 3,
            'servicios financieros': 10,
            'evidencias': 11
        }

    def responder(self, pregunta):
        pregunta_lower = pregunta.lower()
        modulo_id = 1  # Por defecto
        for tema, mid in self.temas_modulo.items():
            if tema in pregunta_lower:
                modulo_id = mid
                break
        # Respuesta simulada
        respuesta = self.generar_respuesta(pregunta, modulo_id)
        print(f"[ChatBot]: {respuesta}")
        self.gestor_voces.hablar(respuesta, modulo_id=modulo_id)

    def generar_respuesta(self, pregunta, modulo_id):
        # Aquí puedes conectar lógica real, IA, o base de datos de cursos
        if modulo_id == 7:
            return "Para ensilar correctamente, debes picar el forraje, compactar y sellar bien. ¿Te explico el paso a paso?"
        elif modulo_id == 2:
            return "El Asistente Técnico Rural puede ayudarte con recomendaciones agrícolas y registro de prácticas."
        elif modulo_id == 5:
            return "En Finanzas Personales puedes aprender a llevar tus cuentas y planificar tu emprendimiento."
        else:
            return "Estoy aquí para ayudarte con cualquier módulo de MELANTIA. ¿Sobre qué tema necesitas información?"


def escuchar_pregunta():
    model_path = r"e:\Desktop\MELANTIA\melant_ia\models\vosk-model-small-es-0.42"
    if not os.path.exists(model_path):
        print("No se encontró el modelo Vosk en:", model_path)
        return None
    model = Model(model_path)
    recognizer = KaldiRecognizer(model, 16000)
    p = pyaudio.PyAudio()
    stream = p.open(format=pyaudio.paInt16, channels=1, rate=16000, input=True, frames_per_buffer=8192)
    stream.start_stream()
    print("Habla ahora (presiona Ctrl+C para salir)...")
    print("(Reconocimiento offline Vosk)")
    try:
        frames = []
        for _ in range(0, int(16000 / 8192 * 5)):
            data = stream.read(8192, exception_on_overflow=False)
            if recognizer.AcceptWaveform(data):
                result = recognizer.Result()
                break
            frames.append(data)
        else:
            result = recognizer.FinalResult()
        import json as _json
        text = _json.loads(result).get("text", "")
        if text:
            print(f"[Usuario]: {text}")
            return text
        else:
            print("No se entendió el audio.")
            return None
    except Exception as e:
        print(f"Error con el reconocimiento offline: {e}")
        return None
    finally:
        stream.stop_stream()
        stream.close()
        p.terminate()

if __name__ == "__main__":
    bot = ChatBotMelantia()
    while True:
        pregunta = escuchar_pregunta()
        if pregunta:
            bot.responder(pregunta)
