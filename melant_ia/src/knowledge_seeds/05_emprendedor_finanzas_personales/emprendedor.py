from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.properties import ListProperty, StringProperty
from kivy.lang import Builder
from plyer import filechooser

class PreviewCard(BoxLayout):
    source = StringProperty('')
    def on_remove(self):
        App.get_running_app().remove_foto(self.source)


from kivy.uix.screenmanager import ScreenManager, Screen, FadeTransition
from screenqr import ScreenQR

class MainScreen(BoxLayout):
    pass

class EmprendedorApp(App):
    fotos = ListProperty([])
    documento = StringProperty('/Documentos/tu_documento.pdf')
    descripcion = StringProperty('Catálogo de productos frescos y artesanales de Portoviejo.')

    def build(self):
        Builder.load_file('emprendedor.kv')
        Builder.load_file('screenqr.kv')
        self.sm = ScreenManager(transition=FadeTransition())
        self.main_screen = Screen(name='main')
        self.main_screen.add_widget(MainScreen())
        self.sm.add_widget(self.main_screen)
        self.screenqr = None
        return self.sm

    def open_filechooser(self):
        filechooser.open_file(on_selection=self.add_foto)

    def add_foto(self, selection):
        if selection and len(self.fotos) < 3:
            self.fotos.append(selection[0])
            self.update_grid()

    def remove_foto(self, source):
        if source in self.fotos:
            self.fotos.remove(source)
            self.update_grid()

    def update_grid(self):
        grid = self.main_screen.children[0].ids.grid
        grid.clear_widgets()
        for foto in self.fotos:
            card = PreviewCard(source=foto)
            grid.add_widget(card)
        self.main_screen.children[0].ids.empty_label.opacity = 1 if not self.fotos else 0

    def generar_qr(self):
        from datetime import date
        import json
        propuesta = {
            'fotos': self.fotos,
            'documento': self.documento,
            'fecha': str(date.today())
        }
        nombre = f'Propuesta_Portoviejo_{date.today()}.json'
        with open(nombre, 'w', encoding='utf-8') as f:
            json.dump(propuesta, f)
        self.mensaje_motivador()
        self.mostrar_portafolio_final()

    def mensaje_motivador(self):
        try:
            from plyer import tts
            tts.speak('Tus fotos se ven muy profesionales. Recuerda mencionar que tus ingredientes son frescos de aquí de Manabí. ¡Mucho éxito en tu negociación!')
        except Exception:
            pass

    def mostrar_portafolio_final(self):
        if self.screenqr:
            self.sm.remove_widget(self.screenqr)
        self.screenqr = Screen(name='screenqr')
        qr_widget = ScreenQR(
            nombre='Emprendedor Portoviejo',
            fotos=self.fotos,
            documento=self.documento,
            descripcion=self.descripcion
        )
        self.screenqr.add_widget(qr_widget)
        self.sm.add_widget(self.screenqr)
        self.sm.current = 'screenqr'

    def compartir_whatsapp(self):
        # Método para ser llamado desde la UI
        pass

import threading
def iniciar_sync_tools():
    try:
        from sync_tools import network_listener, sync_mediciones, limpiar_imagenes_antiguas
        threading.Thread(target=network_listener, args=(sync_mediciones,), daemon=True).start()
        limpiar_imagenes_antiguas()
    except Exception as e:
        print('Sync tools no disponibles:', e)

if __name__ == '__main__':
    iniciar_sync_tools()
    EmprendedorApp().run()
