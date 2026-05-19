# Guía de casos legales frecuentes para el Asesor Legal (Dr. Pablo)
from kivy.uix.screenmanager import Screen
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.uix.label import Label
from kivy.uix.scrollview import ScrollView

CASOS = [
    {
        'nombre': 'Robo',
        'guia': [
            '1. Mantén la calma y resguarda tu seguridad.',
            '2. Llama o acude a la Policía Nacional lo antes posible.',
            '3. Reúne pruebas: fotos, testigos, facturas, etc.',
            '4. Presenta la denuncia en la Fiscalía o Comisaría más cercana.',
            '5. Guarda una copia de la denuncia y el número de caso.'
        ],
        'mensaje': 'Recuerda: No enfrentes al delincuente. La denuncia es tu derecho.'
    },
    {
        'nombre': 'Amenaza',
        'guia': [
            '1. No respondas a la provocación y resguarda tu integridad.',
            '2. Anota detalles: fecha, hora, lugar, testigos.',
            '3. Si es posible, graba o guarda mensajes de amenaza.',
            '4. Acude a la Fiscalía y presenta la denuncia.',
            '5. Solicita medidas de protección si te sientes en peligro.'
        ],
        'mensaje': 'La amenaza es un delito. No estás solo, busca apoyo legal y familiar.'
    },
    {
        'nombre': 'Conflicto de tierras',
        'guia': [
            '1. Reúne todos los documentos de propiedad y escrituras.',
            '2. No firmes nada sin asesoría.',
            '3. Busca testigos y antecedentes del terreno.',
            '4. Acude a la Tenencia Política, Municipio o Fiscalía según el caso.',
            '5. Si hay invasión, denuncia de inmediato.'
        ],
        'mensaje': 'La tierra es tu patrimonio. Defiéndela con pruebas y asesoría.'
    },
    {
        'nombre': 'Trámite de escrituras',
        'guia': [
            '1. Acude a un notario o abogado de confianza.',
            '2. Reúne cédulas, certificados de gravamen y pago de impuestos.',
            '3. Verifica que el terreno esté libre de deudas o juicios.',
            '4. Firma la escritura ante notario y registra en el Municipio.',
            '5. Guarda copias de todos los documentos.'
        ],
        'mensaje': 'No entregues dinero sin documentos. Exige recibos y copias.'
    },
    {
        'nombre': 'Violación',
        'guia': [
            '1. Busca ayuda médica y psicológica de inmediato.',
            '2. No te bañes ni cambies de ropa antes de la revisión médica.',
            '3. Acude a la Fiscalía o Comisaría de la Mujer.',
            '4. Lleva a un familiar o persona de confianza.',
            '5. Solicita protección y acompañamiento.'
        ],
        'mensaje': 'No es tu culpa. Tienes derecho a apoyo, justicia y protección.'
    },
    {
        'nombre': 'Maltrato físico a una mujer',
        'guia': [
            '1. Busca un lugar seguro y pide ayuda.',
            '2. Acude a la Fiscalía, Comisaría de la Mujer o Tenencia Política.',
            '3. Solicita medidas de protección inmediatas.',
            '4. Guarda pruebas: fotos, mensajes, testigos.',
            '5. No te quedes callada, denuncia.'
        ],
        'mensaje': 'La violencia no se justifica. Hay leyes que te protegen.'
    },
    {
        'nombre': 'Peleas',
        'guia': [
            '1. Evita la confrontación y busca testigos.',
            '2. Si hay lesiones, acude al centro de salud y pide certificado médico.',
            '3. Denuncia en la Fiscalía o Tenencia Política.',
            '4. Guarda pruebas y testimonios.',
            '5. Busca mediación si es posible.'
        ],
        'mensaje': 'La mediación puede evitar problemas mayores. Busca soluciones pacíficas.'
    }
]

class CasosLegalesScreen(Screen):
    def __init__(self, **kwargs):
        super().__init__(name='casos_legales', **kwargs)
        self.layout = BoxLayout(orientation='vertical', spacing=10, padding=20)
        self.add_widget(self.layout)
        self.mostrar_menu()

    def mostrar_menu(self):
        self.layout.clear_widgets()
        self.layout.add_widget(Label(text="¿En qué caso necesitas ayuda?", font_size=22))
        for caso in CASOS:
            btn = Button(text=caso['nombre'], size_hint_y=None, height=50, on_release=lambda btn, c=caso: self.mostrar_guia(c))
            self.layout.add_widget(btn)
        self.layout.add_widget(Button(text="Volver", size_hint_y=None, height=40, on_release=lambda btn: self.manager.current = 'asesor_legal'))

    def mostrar_guia(self, caso):
        self.layout.clear_widgets()
        scroll = ScrollView(size_hint=(1, 0.8))
        box = BoxLayout(orientation='vertical', size_hint_y=None)
        box.bind(minimum_height=box.setter('height'))
        box.add_widget(Label(text=f"Guía para: {caso['nombre']}", font_size=20, size_hint_y=None, height=40))
        for paso in caso['guia']:
            box.add_widget(Label(text=paso, font_size=16, size_hint_y=None, height=30))
        box.add_widget(Label(text=caso['mensaje'], font_size=16, size_hint_y=None, height=40, color=(1,0,0,1)))
        scroll.add_widget(box)
        self.layout.add_widget(scroll)
        self.layout.add_widget(Button(text="Volver", size_hint_y=None, height=40, on_release=lambda btn: self.mostrar_menu()))

# Para integrar en el Asesor Legal:
# from modules.10_comunidad_virtual.casos_legales import CasosLegalesScreen
# sm.add_widget(CasosLegalesScreen())
# Desde AsesorLegalScreen, agrega un botón para ir a 'casos_legales'
