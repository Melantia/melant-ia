from kivy.app import App
from kivy.lang import Builder
from kivy.uix.screenmanager import ScreenManager, Screen
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from don_eloy_saberes import DonEloySaberes

Builder.load_string('''
<SaberesMenuScreen>:
    orientation: 'vertical'
    canvas.before:
        Rectangle:
            pos: self.pos
            size: self.size
            source: 'fondo_saberes.jpg'
    Label:
        text: 'Saberes Ancestrales y Folklore'
        font_size: 28
        color: 0.3,0.2,0.6,1
        font_name: 'Roboto-Bold'
        size_hint_y: None
        height: 60
    Button:
        text: 'Ver Saberes de Hoy'
        font_size: 22
        size_hint_y: None
        height: 60
        on_release: root.mostrar_saberes()
    BoxLayout:
        id: saberes_box
        orientation: 'vertical'
        size_hint_y: 1
    Button:
        text: 'Volver'
        size_hint_y: None
        height: 50
        on_release: app.root.current = 'menu'
''')

class SaberesMenuScreen(BoxLayout, Screen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.don_eloy = DonEloySaberes(idioma_usuario=self.obtener_idioma_usuario())

    def obtener_idioma_usuario(self):
        # Aquí puedes conectar con la preferencia real del usuario
        # Por ahora, se asume español
        return 'es'

    def mostrar_saberes(self):
        box = self.ids.saberes_box
        box.clear_widgets()
        saberes = self.don_eloy.mostrar_saberes_del_dia()
        if not saberes:
            box.add_widget(Label(text='No hay saberes para hoy.', font_size=18))
        else:
            for s in saberes:
                texto = s.get('texto') or s.get('descripcion') or s.get('titulo', '')
                box.add_widget(Label(text=texto, font_size=20, size_hint_y=None, height=80))

class SaberesApp(App):
    def build(self):
        sm = ScreenManager()
        sm.add_widget(SaberesMenuScreen(name='saberes'))
        return sm

if __name__ == '__main__':
    SaberesApp().run()
