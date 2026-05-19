# Asesor Legal (Dr. Pablo) - Integración completa en Comunidad Virtual MELANTIA
from kivy.uix.screenmanager import Screen
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.uix.label import Label
from kivy.uix.textinput import TextInput
import os
import json
from datetime import datetime

CARPETA_DOCUMENTOS = os.path.join(os.path.dirname(__file__), '../../database/documents/')
if not os.path.exists(CARPETA_DOCUMENTOS):
    os.makedirs(CARPETA_DOCUMENTOS)

class AsesorLegalScreen(Screen):
    def __init__(self, **kwargs):
        super().__init__(name='asesor_legal', **kwargs)
        self.layout = BoxLayout(orientation='vertical', spacing=10, padding=20)
        self.add_widget(self.layout)
        self.mostrar_menu()

    def mostrar_menu(self):
        self.layout.clear_widgets()
        self.layout.add_widget(Label(text="Asesor Legal - Dr. Pablo", font_size=24))
        self.layout.add_widget(Button(text="Crear escrito legal", on_release=lambda btn: self.mostrar_formulario()))
        self.layout.add_widget(Button(text="Preparar denuncia por voz", on_release=lambda btn: self.preparar_denuncia_voz()))

    def mostrar_formulario(self):
        self.layout.clear_widgets()
        self.layout.add_widget(Label(text="Redactar escrito legal", font_size=20))
        self.titulo = TextInput(hint_text="Título del escrito", size_hint_y=None, height=40)
        self.cuerpo = TextInput(hint_text="Contenido del escrito", multiline=True, size_hint_y=None, height=120)
        self.layout.add_widget(self.titulo)
        self.layout.add_widget(self.cuerpo)
        self.layout.add_widget(Button(text="Guardar en Carpeta de Documentos", on_release=lambda btn: self.guardar_escrito()))
        self.layout.add_widget(Button(text="Volver", on_release=lambda btn: self.mostrar_menu()))

    def guardar_escrito(self):
        titulo = self.titulo.text.strip() or "escrito_sin_titulo"
        cuerpo = self.cuerpo.text.strip()
        nombre_archivo = f"{titulo.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        ruta = os.path.join(CARPETA_DOCUMENTOS, nombre_archivo)
        with open(ruta, 'w', encoding='utf-8') as f:
            f.write(f"Título: {titulo}\n\n{cuerpo}")
        self.layout.clear_widgets()
        self.layout.add_widget(Label(text=f"Escrito guardado como {nombre_archivo}", font_size=18))
        self.layout.add_widget(Button(text="Volver", on_release=lambda btn: self.mostrar_menu()))

    def preparar_denuncia_voz(self):
        # Aquí se integraría el reconocimiento de voz real
        self.layout.clear_widgets()
        self.layout.add_widget(Label(text="Dicta tu denuncia (simulado)", font_size=20))
        self.denuncia = TextInput(hint_text="Dicta aquí o pega el texto...", multiline=True, size_hint_y=None, height=120)
        self.layout.add_widget(self.denuncia)
        self.layout.add_widget(Button(text="Guardar denuncia lista para impresión", on_release=lambda btn: self.guardar_denuncia()))
        self.layout.add_widget(Button(text="Volver", on_release=lambda btn: self.mostrar_menu()))

    def guardar_denuncia(self):
        texto = self.denuncia.text.strip()
        nombre_archivo = f"denuncia_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        ruta = os.path.join(CARPETA_DOCUMENTOS, nombre_archivo)
        with open(ruta, 'w', encoding='utf-8') as f:
            f.write(texto)
        self.layout.clear_widgets()
        self.layout.add_widget(Label(text=f"Denuncia guardada como {nombre_archivo}", font_size=18))
        self.layout.add_widget(Button(text="Volver", on_release=lambda btn: self.mostrar_menu()))

# Para integrar en tu ScreenManager principal:
# from modules.comunidad_virtual.asesor_legal import AsesorLegalScreen
# sm.add_widget(AsesorLegalScreen())
# sm.current = 'asesor_legal'
