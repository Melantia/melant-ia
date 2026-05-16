# Ejemplo de integración directa de frecuencia de módulos en Kivy

from kivy.app import App
from kivy.uix.gridlayout import GridLayout
from kivy.uix.button import Button
from kivy.uix.screenmanager import ScreenManager, Screen, FadeTransition
from kivy.uix.label import Label
from utils.modulos_frecuencia import registrar_uso_modulo, reordenar_modulos

class MenuPrincipalScreen(Screen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.layout = GridLayout(cols=2)
        self.add_widget(self.layout)
        self.actualizar_menu()

    def actualizar_menu(self):
        self.layout.clear_widgets()
        modulos_ordenados = reordenar_modulos()
        destacados = modulos_ordenados[:4]
        ver_mas = modulos_ordenados[4:]
        for modulo in destacados:
            btn = Button(text=modulo['titulo'], on_release=lambda btn, m=modulo: self.abrir_modulo(m))
            self.layout.add_widget(btn)
        if ver_mas:
            btn_ver_mas = Button(text='Ver más', on_release=lambda btn: self.mostrar_ver_mas(ver_mas))
            self.layout.add_widget(btn_ver_mas)

    def abrir_modulo(self, modulo):
        registrar_uso_modulo(modulo['id'])
        self.manager.current = f"modulo_{modulo['id']}"

    def mostrar_ver_mas(self, modulos):
        self.manager.get_screen('ver_mas').actualizar_lista(modulos)
        self.manager.current = 'ver_mas'

class ModuloScreen(Screen):
    def __init__(self, modulo, **kwargs):
        super().__init__(name=f"modulo_{modulo['id']}", **kwargs)
        self.add_widget(Label(text=f"Pantalla de {modulo['titulo']}", font_size=28))

class VerMasScreen(Screen):
    def __init__(self, **kwargs):
        super().__init__(name='ver_mas', **kwargs)
        self.layout = GridLayout(cols=1)
        self.add_widget(self.layout)

    def actualizar_lista(self, modulos):
        self.layout.clear_widgets()
        for modulo in modulos:
            btn = Button(text=modulo['titulo'], on_release=lambda btn, m=modulo: self.abrir_modulo(m))
            self.layout.add_widget(btn)

    def abrir_modulo(self, modulo):
        registrar_uso_modulo(modulo['id'])
        self.manager.current = f"modulo_{modulo['id']}"

class MelantiaApp(App):
    def build(self):
        sm = ScreenManager(transition=FadeTransition())
        menu_screen = MenuPrincipalScreen(name='menu')
        sm.add_widget(menu_screen)

        # Crea pantallas individuales para cada módulo
        for modulo in reordenar_modulos():
            sm.add_widget(ModuloScreen(modulo))

        sm.add_widget(VerMasScreen())
        return sm

if __name__ == '__main__':
    MelantiaApp().run()
