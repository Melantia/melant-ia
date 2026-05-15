
import random
import os
import json
from kivy.uix.boxlayout import BoxLayout
from kivy.properties import ObjectProperty, BooleanProperty

class RegistroScreen(BoxLayout):
    # Conectamos con los IDs del archivo .kv
    txt_nombre = ObjectProperty(None)
    txt_cedula = ObjectProperty(None)
    check_privacidad = ObjectProperty(None)
    btn_ingresar = ObjectProperty(None)

    def on_kv_post(self, base_widget):
        """Se ejecuta apenas se carga el diseño visual"""
        mensajes = [
            {"quien": "Melantia", "texto": "Bienvenido. Sus datos son la semilla de la agricultura digital segura."},
            {"quien": "Don Eloy", "texto": "Vea patrón, firme tranquilo que aquí cuidamos su información como el mejor cacao."},
            {"quien": "Paulette", "texto": "Hola. Al aceptar, activamos sus herramientas de trazabilidad y analítica."}
        ]
        eleccion = random.choice(mensajes)
        self.ids.label_autor.text = f"{eleccion['quien']} dice:"
        self.ids.label_mensaje.text = eleccion['texto']

    def on_field_change(self):
        """Activa el botón verde solo cuando todo está listo"""
        # Verificamos si hay texto y si el check está marcado
        valido = (
            len(self.ids.txt_nombre.text) > 3 and
            len(self.ids.txt_cedula.text) > 5 and
            self.ids.check_privacidad.active
        )
        if valido:
            self.ids.btn_ingresar.disabled = False
            self.ids.btn_ingresar.background_color = (0.2, 0.8, 0.2, 1)  # Verde Cacao Madurito
        else:
            self.ids.btn_ingresar.disabled = True
            self.ids.btn_ingresar.background_color = (0.5, 0.5, 0.5, 1)

import os
import json

def verificar_acceso_melantia():
    ruta_perfil = "src/data/perfil_usuario.json"
    
    # 1. ¿Existe el archivo de perfil?
    if not os.path.exists(ruta_perfil):
        print(">>> Redirigiendo a: PANTALLA DE REGISTRO INICIAL")
        return "mostrar_registro"
    
    with open(ruta_perfil, 'r', encoding='utf-8') as f:
        data = json.load(f)
        perfil = data.get("usuario", {})
        
        # 2. ¿Ya aceptó la política de privacidad y terminó el registro?
        if perfil.get("registro_completado") and perfil.get("politica_privacidad", {}).get("aceptada"):
            print(f">>> Bienvenido de nuevo, {perfil.get('nombre')}")
            return "entrar_app"
        else:
            print(">>> Registro incompleto. Redirigiendo a REGISTRO.")
            return "mostrar_registro"

# Al arrancar la App ejecutamos al portero
estado = verificar_acceso_melantia()

