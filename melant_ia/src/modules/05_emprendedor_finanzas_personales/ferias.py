import os
import json
import time
from plyer import gps
from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.properties import ListProperty, StringProperty
from kivy.clock import Clock

CACHE_DIR = 'cache_ferias'
FERIAS_FILE = 'ferias.json'


import importlib.util
CONFIG_FILE = 'config_app.json'

import importlib.util
REGIONES_FILE = 'regiones.py'

class FeriaList(BoxLayout):
    ferias = ListProperty([])
    provincia = StringProperty('Nacional')

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.ferias = self.cargar_lista_ferias()
        self.ubicacion = None
        self.provincias = self.cargar_provincias()
        self.regiones = self.cargar_regiones()
        self.cargar_config()
        Clock.schedule_once(lambda dt: self.mostrar_menu_regiones(), 0.2)
        Clock.schedule_once(lambda dt: self.obtener_ubicacion_una_vez(), 0.5)
        self.limpiar_cache_ferias()

    def cargar_regiones(self):
        spec = importlib.util.spec_from_file_location("regiones", os.path.join(os.path.dirname(__file__), REGIONES_FILE))
        regiones = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(regiones)
        return regiones.REGIONES

    def mostrar_menu_regiones(self):
        grid = self.ids.regiones_grid
        grid.clear_widgets()
        for region in self.regiones:
            from kivy.uix.label import Label
            from kivy.uix.boxlayout import BoxLayout
            region_label = Label(text=f"[b]{region['nombre']}[/b]", markup=True, size_hint_y=None, height=28, color=(.7,1,.7,1))
            grid.add_widget(region_label)
            chips_box = BoxLayout(orientation='horizontal', spacing=6, size_hint_y=None, height=38)
            for prov in region['provincias']:
                chips_box.add_widget(self.crear_chip(prov))
            grid.add_widget(chips_box)

    def cargar_provincias(self):
        # Carga la lista de provincias desde provincias.py
        spec = importlib.util.spec_from_file_location("provincias", os.path.join(os.path.dirname(__file__), "provincias.py"))
        provincias = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(provincias)
        return provincias.PROVINCIAS

    def mostrar_chips_provincias(self):
        grid = self.ids.chips_grid
        grid.clear_widgets()
        for prov in self.provincias:
            btn = self.crear_chip(prov['nombre'])
            grid.add_widget(btn)

    def crear_chip(self, nombre):
        from kivy.uix.button import Button
        btn = Button(text=nombre, size_hint_x=None, width=110, background_color=(.13,.13,.13,1), color=(1,1,1,1), font_size=14)
        btn.bind(on_release=lambda inst: self.seleccionar_provincia(nombre))
        return btn

    def seleccionar_provincia(self, nombre):
        self.provincia = nombre
        self.guardar_config()
        self.ferias = self.buscar_por_provincia(nombre)
        self.mostrar_ferias()
        self.voz_informativa(nombre)

    def detectar_provincia(self):
        # Simulación: en producción, usar GPS y lógica inversa
        self.seleccionar_provincia('Manabí')

    def guardar_config(self):
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump({'provincia': self.provincia}, f)

    def cargar_config(self):
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, encoding='utf-8') as f:
                data = json.load(f)
                self.provincia = data.get('provincia', 'Nacional')

    def voz_informativa(self, provincia):
        try:
            from plyer import tts
            tts.speak(f'Cargando ferias de {provincia}. Toca cualquier evento para ver más detalles sin conexión')
        except Exception:
            pass

    def cargar_lista_ferias(self):
        if os.path.exists(FERIAS_FILE):
            with open(FERIAS_FILE, encoding='utf-8') as f:
                return json.load(f)
        return []

    def mostrar_feria(self, feria):
        # Solo cargar detalles si el usuario lo solicita
        detalles = self.cargar_detalle_feria(feria['id'])
        # Aquí mostrar detalles en la UI
        print('Detalles:', detalles)

    def cargar_detalle_feria(self, feria_id):
        cache_path = os.path.join(CACHE_DIR, f'{feria_id}.json')
        if os.path.exists(cache_path):
            with open(cache_path, encoding='utf-8') as f:
                return json.load(f)
        # Si no está en caché y hay internet, descargar (simulado aquí)
        detalles = self.descargar_detalle_feria(feria_id)
        os.makedirs(CACHE_DIR, exist_ok=True)
        with open(cache_path, 'w', encoding='utf-8') as f:
            json.dump(detalles, f)
        return detalles

    def descargar_detalle_feria(self, feria_id):
        # Simulación: en producción, hacer petición HTTP
        return {'id': feria_id, 'descripcion': 'Detalles de la feria', 'mapa': 'url', 'contacto': '0999999999'}

    def limpiar_cache_ferias(self):
        ahora = time.time()
        if not os.path.exists(CACHE_DIR):
            return
        for archivo in os.listdir(CACHE_DIR):
            ruta = os.path.join(CACHE_DIR, archivo)
            if os.path.isfile(ruta):
                modificado = os.path.getmtime(ruta)
                if ahora - modificado > 30*24*3600:
                    os.remove(ruta)

    def obtener_ubicacion_una_vez(self):
        def on_location(**kwargs):
            self.ubicacion = kwargs
            gps.stop()
        try:
            gps.configure(on_location=on_location)
            gps.start()
        except Exception:
            pass

    def buscar_por_provincia(self, provincia):
        return [f for f in self.ferias if f.get('provincia') == provincia]

    def mostrar_ferias(self):
        grid = self.ids.ferias_grid
        grid.clear_widgets()
        for feria in self.ferias:
            box = self.crear_feria_box(feria)
            grid.add_widget(box)

    def crear_feria_box(self, feria):
        from kivy.uix.boxlayout import BoxLayout
        from kivy.uix.label import Label
        from kivy.uix.button import Button
        box = BoxLayout(orientation='horizontal', spacing=8)
        lbl = Label(text=f"{feria['titulo']}\n{feria['fecha']}", halign='left', valign='middle', size_hint_x=0.7)
        btn = Button(text='Me Interesa', size_hint_x=0.3, background_color=(0,.7,0,1), color=(1,1,1,1))
        btn.bind(on_release=lambda inst: self.mostrar_detalle_feria(feria))
        box.add_widget(lbl)
        box.add_widget(btn)
        return box

    def mostrar_detalle_feria(self, feria):
        detalles = self.cargar_detalle_feria(feria['id'])
        # Aquí puedes mostrar un popup o cambiar de pantalla
        from kivy.uix.popup import Popup
        from kivy.uix.label import Label
        Popup(title='Detalle de Feria', content=Label(text=json.dumps(detalles, indent=2)), size_hint=(.8,.4)).open()

    def sincronizar_ferias(self):
        # Simulación: en producción, descargar solo títulos/fechas nuevos
        # Aquí solo actualiza el archivo local
        nuevos = [
            {"id": 3, "titulo": "Feria en Loja", "fecha": "2026-07-10", "provincia": "Loja"}
        ]
        if os.path.exists(FERIAS_FILE):
            with open(FERIAS_FILE, encoding='utf-8') as f:
                ferias = json.load(f)
        else:
            ferias = []
        ferias.extend(nuevos)
        with open(FERIAS_FILE, 'w', encoding='utf-8') as f:
            json.dump(ferias, f)
        self.ferias = ferias
        self.mostrar_ferias()

class FeriaApp(App):
    def build(self):
        feria_list = FeriaList()
        Clock.schedule_once(lambda dt: feria_list.mostrar_ferias(), 0.3)
        return feria_list

if __name__ == '__main__':
    FeriaApp().run()
