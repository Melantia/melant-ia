import json
import pyttsx3
import os

# Ruta al archivo de configuración de voces
dir_actual = os.path.dirname(__file__)
VOCES_JSON = os.path.join(dir_actual, '..', 'knowledge_seeds', 'voces_melantia.json')


class GestorVocesMelantia:
    def __init__(self):
        with open(VOCES_JSON, encoding='utf-8') as f:
            self.config = json.load(f)
        self.engine = pyttsx3.init()
        self.voz_actual = None
        self.voz_cache = self._mapear_voces()

    def _mapear_voces(self):
        # Mapea nombres de voz a IDs de pyttsx3 (según disponibilidad local)
        voces = self.engine.getProperty('voices')
        voz_map = {}
        for v in voces:
            nombre = v.name.lower()
            if 'spanish' in nombre or 'español' in nombre:
                if 'femenina' in nombre or 'female' in nombre:
                    voz_map['Femenina'] = v.id
                elif 'masculina' in nombre or 'male' in nombre:
                    voz_map['Masculina'] = v.id
        return voz_map

    def seleccionar_voz(self, modulo_id, funcion=None):
        """
        Selecciona la voz según el módulo y, si se especifica, según la función/submódulo.
        """
        voz_id = None
        voz_nombre = None
        genero = None
        for modulo in self.config['modulos']:
            if modulo['id'] == modulo_id:
                # Buscar voz por función/submódulo si existe
                if funcion:
                    # Estructura recomendada: funciones: {"nombre_funcion": {"voz":..., "genero":...}}
                    funciones = modulo.get('funciones') or modulo.get('sub_items')
                    if funciones and funcion in funciones:
                        voz_nombre = funciones[funcion].get('voz')
                        genero = funciones[funcion].get('genero', modulo.get('genero', 'Femenina'))
                # Si no hay función o no encontrada, usar voz principal
                if not genero:
                    genero = modulo.get('genero', 'Femenina')
                voz_id = self.voz_cache.get(genero)
                if voz_id:
                    self.engine.setProperty('voice', voz_id)
                    self.voz_actual = voz_nombre or modulo.get('voz_principal', 'Melantia')
                break

    def hablar(self, texto, modulo_id=1, funcion=None):
        self.seleccionar_voz(modulo_id, funcion)
        self.engine.say(texto)
        self.engine.runAndWait()

# Ejemplo de uso
if __name__ == "__main__":
    gestor = GestorVocesMelantia()
    gestor.hablar("Bienvenido al Asistente Técnico Rural de MELANTIA.", modulo_id=2)
    gestor.hablar("Alerta de salud detectada.", modulo_id=2, funcion="alertas")
    gestor.hablar("Bienvenido al curso de ensilaje.", modulo_id=7, funcion="cursos")
