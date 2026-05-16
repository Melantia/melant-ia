# Ejemplo de integración del Asesor Legal en el menú principal de MELANTIA
from kivy.app import App
from kivy.uix.screenmanager import ScreenManager, Screen, FadeTransition
from kivy.uix.button import Button
from kivy.uix.boxlayout import BoxLayout
from modules.10_comunidad_virtual.asesor_legal import AsesorLegalScreen

class MenuPrincipal(Screen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        layout = BoxLayout(orientation='vertical', spacing=10, padding=20)
        btn_asesor = Button(text="Asesor Legal (Dr. Pablo)", size_hint_y=None, height=60)
        btn_asesor.bind(on_release=self.ir_a_asesor_legal)
        layout.add_widget(btn_asesor)
        self.add_widget(layout)

    def ir_a_asesor_legal(self, instance):
        self.manager.current = 'asesor_legal'

class MelantiaApp(App):
    def build(self):
        sm = ScreenManager(transition=FadeTransition())
        sm.add_widget(MenuPrincipal(name='menu'))
        sm.add_widget(AsesorLegalScreen())
        sm.current = 'menu'
        return sm

if __name__ == '__main__':
    MelantiaApp().run()
