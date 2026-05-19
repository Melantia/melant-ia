# walkie_talkie.py
# Módulo base para Walkie Talkie MELANTIA (Kivy/Python)
from collections import deque
import time

class MensajeTexto:
    def __init__(self, texto, autor, timestamp=None):
        self.texto = texto
        self.autor = autor
        self.timestamp = timestamp or time.time()

class MensajeAudio:
    def __init__(self, ruta_audio, autor, timestamp=None, escuchado=False):
        self.ruta_audio = ruta_audio
        self.autor = autor
        self.timestamp = timestamp or time.time()
        self.escuchado = escuchado
        self.timestamp_escucha = None

class WalkieTalkie:
    def __init__(self, max_mensajes=10):
        self.mensajes = deque(maxlen=max_mensajes)  # FIFO mensajes texto
        self.audios = []  # Lista de MensajeAudio

    def agregar_mensaje(self, texto, autor):
        self.mensajes.append(MensajeTexto(texto, autor))

    def agregar_audio(self, ruta_audio, autor):
        audio = MensajeAudio(ruta_audio, autor)
        self.audios.append(audio)
        return audio

    def marcar_audio_escuchado(self, audio):
        audio.escuchado = True
        audio.timestamp_escucha = time.time()

    def limpiar_audios_viejos(self, segundos=30):
        ahora = time.time()
        self.audios = [a for a in self.audios if not (a.escuchado and (ahora - a.timestamp_escucha > segundos))]

    def obtener_mensajes(self):
        return list(self.mensajes)

    def obtener_audios(self):
        return list(self.audios)
