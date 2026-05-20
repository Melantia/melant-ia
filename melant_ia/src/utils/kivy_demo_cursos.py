
from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.button import Button
from kivy.uix.scrollview import ScrollView
from kivy.uix.popup import Popup

import os
import json
import threading
import speech_recognition as sr
from chatbot_melantia import ChatBotMelantia

# Importar el gestor de voces
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), ''))
from gestor_voces_melantia import GestorVocesMelantia

CURSOS_DIR = os.path.join(os.path.dirname(__file__), '..', 'knowledge_seeds', '07_escuela de campo')


def cargar_cursos_json(directorio):
    cursos = []
    for archivo in os.listdir(directorio):
        if archivo.endswith('.json'):
            ruta = os.path.join(directorio, archivo)
            with open(ruta, 'r', encoding='utf-8') as f:
                try:
                    data = json.load(f)
                    cursos.append(data)
                except Exception as e:
                    print(f"Error leyendo {archivo}: {e}")
    return cursos

class CursoPopup(Popup):
    def __init__(self, curso, gestor_voces, **kwargs):
        super().__init__(**kwargs)
        self.title = curso.get('titulo', 'Curso')
        self.gestor_voces = gestor_voces
        box = BoxLayout(orientation='vertical')
        self.resumen = Label(text=curso.get('resumen', ''), size_hint_y=None, height=100)
        box.add_widget(self.resumen)
        for modulo in curso.get('modulos', []):
            mod_label = Label(text=f"[b]{modulo['nombre']}[/b]\n{modulo['objetivo']}\n{modulo['concepto']}", markup=True, size_hint_y=None, height=120)
            box.add_widget(mod_label)
        btn_voz = Button(text="🔊 Escuchar resumen", size_hint_y=None, height=50)
        btn_voz.bind(on_release=self.hablar_resumen)
        box.add_widget(btn_voz)
        scroll = ScrollView()
        scroll.add_widget(box)
        self.content = scroll
        self.size_hint = (0.9, 0.9)

    def hablar_resumen(self, instance):
        # Usar id=7 para Escuela de Campo (ajustar según el módulo si es necesario)
        self.gestor_voces.hablar(self.resumen.text, modulo_id=7)



class CursosApp(App):
    def build(self):
        layout = BoxLayout(orientation='vertical')
        self.gestor_voces = GestorVocesMelantia()
        self.chatbot = ChatBotMelantia()
        self.respuesta_label = Label(text="", size_hint_y=None, height=60)
        cursos = cargar_cursos_json(CURSOS_DIR)
        for curso in cursos:
            btn = Button(text=curso.get('titulo', 'Curso'), size_hint_y=None, height=60)
            btn.bind(on_release=lambda btn, c=curso: self.mostrar_curso(c))
            layout.add_widget(btn)
        btn_preguntar = Button(text="🎤 Preguntar por voz", size_hint_y=None, height=60)
        btn_preguntar.bind(on_release=self.preguntar_por_voz)
        layout.add_widget(btn_preguntar)
        layout.add_widget(self.respuesta_label)
        scroll = ScrollView()
        scroll.add_widget(layout)
        return scroll

    def mostrar_curso(self, curso):
        popup = CursoPopup(curso, self.gestor_voces)
        popup.open()

    def preguntar_por_voz(self, instance):
        threading.Thread(target=self._escuchar_y_responder).start()

    def _escuchar_y_responder(self):
        recognizer = sr.Recognizer()
        with sr.Microphone() as source:
            print("Habla ahora (Kivy)...")
            audio = recognizer.listen(source)
        try:
            pregunta = recognizer.recognize_google(audio, language="es-ES")
            print(f"[Usuario]: {pregunta}")
            self.respuesta_label.text = f"Tú: {pregunta}"
            self.chatbot.responder(pregunta)
        except sr.UnknownValueError:
            self.respuesta_label.text = "No se entendió el audio."
        except sr.RequestError as e:
            self.respuesta_label.text = f"Error de reconocimiento: {e}"

if __name__ == "__main__":
    CursosApp().run()
