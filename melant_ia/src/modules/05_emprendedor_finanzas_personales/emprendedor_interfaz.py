# Integración del flujo Emprendedor con la interfaz Kivy
from kivy.uix.screenmanager import ScreenManager, Screen, FadeTransition
from kivy.uix.button import Button
from kivy.uix.label import Label
from kivy.uix.boxlayout import BoxLayout
import json
import os

PERFIL_USUARIO_PATH = os.path.join(os.path.dirname(__file__), '../../data/perfil_usuario.json')
EMPRENDEDOR_CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'emprendedor_config.json')

# Verifica si el usuario tiene un emprendimiento activo
def usuario_es_emprendedor():
    with open(PERFIL_USUARIO_PATH, encoding='utf-8') as f:
        perfil = json.load(f)
    return perfil.get('registro_inicial', {}).get('es_emprendedor', False)

class EmprendedorMenuScreen(Screen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.layout = BoxLayout(orientation='vertical', spacing=10, padding=20)
        self.add_widget(self.layout)
        self.mostrar_menu()

    def mostrar_menu(self):
        self.layout.clear_widgets()
        self.layout.add_widget(Label(text="Módulo Emprendedor MELANTIA", font_size=24))
        self.layout.add_widget(Button(text="Portafolio de Producto Estrella", on_release=lambda btn: self.manager.current = 'portafolio'))
        self.layout.add_widget(Button(text="Agenda de Ferias y Eventos", on_release=lambda btn: self.manager.current = 'agenda_ferias'))
        self.layout.add_widget(Button(text="Simulador de Precio Real (Angel)", on_release=lambda btn: self.manager.current = 'simulador_precio'))
        self.layout.add_widget(Button(text="Asistente de Negociación", on_release=lambda btn: self.manager.current = 'negociacion'))
        self.layout.add_widget(Button(text="Asesoría Legal (Dr. Pablo)", on_release=lambda btn: self.manager.current = 'asesoria_legal'))

# Pantallas placeholder para cada submódulo
class PortafolioScreen(Screen):
    def __init__(self, **kwargs):
        super().__init__(name='portafolio', **kwargs)
        self.add_widget(Label(text="Portafolio de Producto Estrella", font_size=22))

class AgendaFeriasScreen(Screen):
    def __init__(self, **kwargs):
        super().__init__(name='agenda_ferias', **kwargs)
        self.add_widget(Label(text="Agenda de Ferias y Eventos", font_size=22))

class SimuladorPrecioScreen(Screen):
    def __init__(self, **kwargs):
        super().__init__(name='simulador_precio', **kwargs)
        self.add_widget(Label(text="Simulador de Precio Real (Angel)", font_size=22))

class NegociacionScreen(Screen):
    def __init__(self, **kwargs):
        super().__init__(name='negociacion', **kwargs)
        self.add_widget(Label(text="Asistente de Negociación", font_size=22))

class AsesoriaLegalScreen(Screen):
    def __init__(self, **kwargs):
        super().__init__(name='asesoria_legal', **kwargs)
        self.add_widget(Label(text="Asesoría Legal (Dr. Pablo)", font_size=22))

# Integración con el ScreenManager principal
def agregar_emprendedor_a_manager(screen_manager):
    if usuario_es_emprendedor():
        screen_manager.add_widget(EmprendedorMenuScreen(name='emprendedor_menu'))
        screen_manager.add_widget(PortafolioScreen())
        screen_manager.add_widget(AgendaFeriasScreen())
        screen_manager.add_widget(SimuladorPrecioScreen())
        screen_manager.add_widget(NegociacionScreen())
        screen_manager.add_widget(AsesoriaLegalScreen())

# Ejemplo de uso en la app principal:
# from modules.07_emprendedor_finanzas_personales.emprendedor_interfaz import agregar_emprendedor_a_manager
# agregar_emprendedor_a_manager(sm)
# sm.current = 'emprendedor_menu'
