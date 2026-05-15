import pyttsx3

class ValentinaGPS:
    def _init_(self):
        # Inicializa el motor de voz offline
        self.engine = pyttsx3.init()
        
        # Configuración de voz femenina basada en su JSON
        voices = self.engine.getProperty('voices')
        for voice in voices:
            # Buscamos una voz en español que suene natural para el campo
            if "spanish" in voice.name.lower() or "mexico" in voice.name.lower():
                self.engine.setProperty('voice', voice.id)
                break
        
        # Ajustamos la velocidad para que se entienda bien bajo el sol
        self.engine.setProperty('rate', 150) 
        self.engine.setProperty('volume', 1.0)

    def hablar(self, mensaje):
        """Hace que Valentina hable por el altavoz"""
        self.engine.say(mensaje)
        self.engine.runAndWait()

    def confirmar_tarea(self, tarea, tipo="CULTIVO"):
        """Valentina confirma la acción para evitar confusiones"""
        if tarea == "inicio":
            mensaje = f"Iniciando medición de {tipo}. Camine por el lindero."
        elif tarea == "punto":
            mensaje = f"Punto de {tipo} registrado correctamente."
        elif tarea == "fin":
            mensaje = f"Medición de {tipo} finalizada. Plano guardado."
        
        self.hablar(mensaje)