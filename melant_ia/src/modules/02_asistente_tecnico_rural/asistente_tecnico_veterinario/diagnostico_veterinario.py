import json

class DiagnosticoIA:
    def _init_(self):
        # Cargamos el conocimiento que pusimos en el functions.json
        self.conocimiento_patologias = {
            "aves": {
                "Newcastle": ["moquillo", "cuello torcido", "cabeza hinchada", "dificultad respirar"],
                "Gumboro": ["diarrea blanca", "plumas erizadas", "tristeza"],
                "Piojillo": ["rasca mucho", "falta de plumas", "puntos negros"]
            },
            "porcinos": {
                "Peste Porcina": ["manchas rojas", "fiebre", "no come", "amontonados"],
                "Erisipela": ["manchas diamante", "cojera", "piel roja"],
                "Sarna": ["rasca contra pared", "costras", "piel gruesa"]
            },
            "equinos": {
                "Colico": ["patea panza", "se tumba", "inquieto", "no defeca"],
                "Encefalitis": ["camina en circulos", "ciego", "fiebre"]
            },
            "bovinos": {
                "Fiebre Aftosa": ["babeo excesivo", "fiebre alta", "úlceras en boca", "cojera", "abortos"],
                "Brucelosis": ["abortos", "fiebre", "inflamación de articulaciones"],
                "Carbunco": ["muerte súbita", "sangrado por orificios", "hinchazón"]
            },
            "cabras": {
                "Fiebre Q": ["fiebre", "abortos", "decaimiento"],
                "Artritis encefalitis caprina": ["cojea", "inflamación de articulaciones", "pérdida de peso"],
                "Brucelosis": ["abortos", "inflamación de ubre", "fiebre"]
            },
            "cuyes": {
                "Salmonelosis": ["diarrea", "pérdida de peso", "decaimiento"],
                "Tifus": ["fiebre", "debilidad", "pérdida de apetito"],
                "Pulicosis": ["rasca mucho", "caída de pelo", "heridas en la piel"]
            }
        }

    def analizar_voz_productor(self, especie, texto_voz):
        """
        Compara lo que dijo el productor con el diccionario de enfermedades.
        """
        texto_voz = texto_voz.lower()
        posibles_diagnosticos = []
        
        # Buscamos en la base de datos de la especie seleccionada
        if especie in self.conocimiento_patologias:
            for enfermedad, sintomas in self.conocimiento_patologias[especie].items():
                for sintoma in sintomas:
                    if sintoma in texto_voz:
                        posibles_diagnosticos.append(enfermedad)
                        break
        
        if posibles_diagnosticos:
            return {
                "alerta": "ROJA",
                "posibles_causas": posibles_diagnosticos,
                "mensaje": "Se detectaron síntomas críticos. Aísle al animal y consulte la guía de emergencia."
            }
        else:
            return {
                "alerta": "VERDE",
                "mensaje": "Síntoma no identificado como crítico, pero se recomienda seguimiento fotográfico."
            }

# --- EJEMPLO DE USO ---
# Si el productor dice: "El chancho tiene manchas rojas y está amontonado con fiebre"
# motor = DiagnosticoIA()
# resultado = motor.analizar_voz_productor("porcinos", "manchas rojas amontonado fiebre")
# print(resultado)


def get_voice_summary():
    """Resumen del módulo Veterinario para el asistente de voz."""
    return (
        "Módulo Veterinario activo. "
        "Puedo diagnosticar síntomas en aves, porcinos y equinos usando descripciones de voz. "
        "Si describes lo que observas en el animal, identifico posibles enfermedades "
        "y emito alertas para que actúes a tiempo."
    )