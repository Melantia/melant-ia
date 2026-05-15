# Archivo: src/asistente_visual.py
from kivy.uix.widget import Widget
from kivy.properties import NumericProperty
from kivy.animation import Animation
from kivy.lang import Builder

# Cargamos el diseño que acabamos de crear
Builder.load_file('robot_val.kv')

class RobotMelantia(Widget):
    angulo_pensando = NumericProperty(0)
    brillo_ojos = NumericProperty(1)

    def animar_pensando(self):
        """La antena virtual gira mientras el GPS procesa"""
        anim = Animation(angulo_pensando=360, duration=1.5)
        anim.repeat = True
        anim.start(self)

    def detener_y_brillar(self):
        """El robot se queda quieto y sus ojos brillan al terminar"""
        Animation.stop_all(self)
        anim = Animation(brillo_ojos=0.3, duration=0.5) + Animation(brillo_ojos=1, duration=0.5)
        anim.repeat = True
        anim.start(self)

    def saltar(self):
        """El robot salta hacia arriba y vuelve a bajar (efecto rebote)"""
        y_inicial = self.y
        anim = (
            Animation(y=y_inicial + 40, duration=0.18, t='out_quad') +
            Animation(y=y_inicial, duration=0.22, t='in_bounce')
        )
        anim.start(self)
