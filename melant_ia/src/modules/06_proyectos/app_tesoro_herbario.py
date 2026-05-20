from kivy.app import App
from kivy.lang import Builder
from kivy.uix.boxlayout import BoxLayout
from registro_tesoro_abuelos import guardar_historia_abuelos, leer_historias_abuelos
from registro_herbario_memoria import guardar_remedio_herbario, leer_remedios_herbario

Builder.load_file('tesoro_abuelos_form.kv')
Builder.load_file('herbario_memoria_form.kv')

class MainScreen(BoxLayout):
    pass

class TesoroHerbarioApp(App):
    def build(self):
        return MainScreen()

    def guardar_historia_abuelos(self, root):
        data = {
            'titulo': root.ids.titulo.text,
            'relato': root.ids.relato.text,
            'narrador': root.ids.narrador.text,
            'lugar': root.ids.lugar.text,
            'evidencia': {'foto': root.ids.evidencia_foto.selection[0] if root.ids.evidencia_foto.selection else ''},
            'validacion': {'comprobada': root.ids.comprobada.active, 'testigos': [t.strip() for t in root.ids.testigos.text.split(',') if t.strip()]},
            'notas': root.ids.notas.text
        }
        guardar_historia_abuelos(data)
        self.mostrar_historias_abuelos(root.parent)

    def mostrar_historias_abuelos(self, root):
        historias = leer_historias_abuelos()
        grid = root.ids.historias_grid
        grid.clear_widgets()
        from kivy.uix.label import Label
        for h in historias:
            grid.add_widget(Label(text=f"{h['titulo']} ({h['lugar']})\nPor: {h['narrador']}\n{h['relato']}", size_hint_y=None, height=100))

    def guardar_remedio_herbario(self, root):
        data = {
            'planta': root.ids.planta.text,
            'uso_medicinal': root.ids.uso_medicinal.text,
            'preparacion': root.ids.preparacion.text,
            'narrador': root.ids.narrador.text,
            'lugar': root.ids.lugar.text,
            'evidencia': {'foto': root.ids.evidencia_foto.selection[0] if root.ids.evidencia_foto.selection else ''},
            'validacion': {'comprobada': root.ids.comprobada.active, 'testigos': [t.strip() for t in root.ids.testigos.text.split(',') if t.strip()]},
            'notas': root.ids.notas.text
        }
        guardar_remedio_herbario(data)
        self.mostrar_remedios_herbario(root.parent)

    def mostrar_remedios_herbario(self, root):
        remedios = leer_remedios_herbario()
        grid = root.ids.remedios_grid
        grid.clear_widgets()
        from kivy.uix.label import Label
        for r in remedios:
            grid.add_widget(Label(text=f"{r['planta']} ({r['lugar']})\nPor: {r['narrador']}\n{r['uso_medicinal']}\n{r['preparacion']}", size_hint_y=None, height=100))

if __name__ == '__main__':
    TesoroHerbarioApp().run()
