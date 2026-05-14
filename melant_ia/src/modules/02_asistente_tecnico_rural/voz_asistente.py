import pyttsx3

class AsistenteVoz:
    def _init_(self):
        try:
            self.engine = pyttsx3.init()
            # Ajustes de voz
            self.engine.setProperty('rate', 150)    # Velocidad
            self.engine.setProperty('volume', 1.0)  # Volumen
            
            # Configurar idioma español
            voices = self.engine.getProperty('voices')
            for voice in voices:
                if 'spanish' in voice.name.lower() or 'es' in voice.id.lower():
                    self.engine.setProperty('voice', voice.id)
                    break
        except Exception as e:
            print(f"Error al iniciar voz: {e}")
            self.engine = None

    def decir(self, texto):
        if self.engine:
            self.engine.say(texto)
            self.engine.runAndWait()
        else:
            print(f"Asistente (sin audio): {texto}")

# Prueba rápida
if _name_ == "_main_":
    asistente = AsistenteVoz()
    asistente.decir("Hola. El sistema de monitoreo está activo en El Carmen.")