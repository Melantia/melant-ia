from kivy.app import App
from kivy.lang import Builder
from kivy.uix.screenmanager import ScreenManager, Screen
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.button import Button
import json
import os

CURSOS_PATH = os.path.join(os.path.dirname(__file__), 'escuela_cursos.json')

Builder.load_string('''
<EscuelaCampoMenu>:
    orientation: 'vertical'
    canvas.before:
        Rectangle:
            pos: self.pos
            size: self.size
            source: 'fondo_escuela.jpg'
    Label:
        text: 'Escuela de Campo MELANTIA'
        font_size: 32
        color: 0.2,0.5,0.2,1
        font_name: 'Roboto-Bold'
        size_hint_y: None
        height: 60
    ScrollView:
        BoxLayout:
            id: cursos_box
            orientation: 'vertical'
            size_hint_y: None
            height: self.minimum_height
    Button:
        text: 'Volver'
        size_hint_y: None
        height: 50
        on_release: app.root.current = 'menu'
''')

class EscuelaCampoMenu(BoxLayout, Screen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.cargar_cursos()

    def cargar_cursos(self):
        box = self.ids.cursos_box
        box.clear_widgets()
        with open(CURSOS_PATH, 'r', encoding='utf-8') as f:
            cursos = json.load(f)
        for curso in cursos:
            gratis = curso.get('precio', 0) == 0
            etiqueta = '[GRATIS] ' if gratis else ''
            color = (0,0.6,0,1) if gratis else (0.2,0.2,0.2,1)
            box.add_widget(Label(text=f"{etiqueta}{curso['titulo']}", font_size=22, color=color, size_hint_y=None, height=40, bold=gratis))
            for tema in curso.get('temario', []):
                box.add_widget(Label(text=f"   - {tema}", font_size=16, color=(0.1,0.3,0.1,1), size_hint_y=None, height=28))
            box.add_widget(Label(text=f"Formato: {curso.get('formato','')} | Link: {curso.get('link','')}", font_size=12, color=(0.2,0.2,0.2,1), size_hint_y=None, height=20))
            box.add_widget(Label(text="", size_hint_y=None, height=10))

class EscuelaCampoApp(App):
    def build(self):
        sm = ScreenManager()
        sm.add_widget(EscuelaCampoMenu(name='escuela'))
        return sm

if __name__ == '__main__':
    EscuelaCampoApp().run()
