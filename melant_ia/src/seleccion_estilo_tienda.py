# Pantalla de selección de estilo de etiqueta para "Monte su Tienda"
from kivy.uix.screenmanager import Screen
from kivy.uix.gridlayout import GridLayout
from kivy.uix.button import Button
from kivy.uix.label import Label
import json
import os

TIENDA_CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'config_structure_melant_ia/tienda_config.json')
PERFIL_USUARIO_PATH = os.path.join(os.path.dirname(__file__), 'data/perfil_usuario.json')

def cargar_estilos_etiqueta():
    with open(TIENDA_CONFIG_PATH, encoding='utf-8') as f:
        config = json.load(f)
    return config['identidad']['estilos_etiqueta']

def guardar_estilo_usuario(nombre_estilo):
    with open(PERFIL_USUARIO_PATH, encoding='utf-8') as f:
        perfil = json.load(f)
    perfil['estilo_etiqueta_tienda'] = nombre_estilo
    with open(PERFIL_USUARIO_PATH, 'w', encoding='utf-8') as f:
        json.dump(perfil, f, ensure_ascii=False, indent=2)

class SeleccionEstiloScreen(Screen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.layout = GridLayout(cols=1, spacing=10, padding=20)
        self.add_widget(self.layout)
        self.mostrar_estilos()

    def mostrar_estilos(self):
        self.layout.clear_widgets()
        estilos = cargar_estilos_etiqueta()
        self.layout.add_widget(Label(text="Elige el estilo de tu etiqueta:", font_size=22))
        for estilo in estilos:
            btn = Button(
                text=f"{estilo['nombre']}\n{estilo['diseno']}\n{estilo['tipografia']}\nIdeal: {estilo['ideal_para']}",
                size_hint_y=None, height=120,
                on_release=lambda btn, e=estilo: self.seleccionar_estilo(e['nombre'])
            )
            self.layout.add_widget(btn)

    def seleccionar_estilo(self, nombre_estilo):
        guardar_estilo_usuario(nombre_estilo)
        self.layout.clear_widgets()
        self.layout.add_widget(Label(text=f"¡Listo! Has elegido: {nombre_estilo}", font_size=24))
        # Aquí puedes redirigir a la pantalla de la tienda o continuar el flujo
