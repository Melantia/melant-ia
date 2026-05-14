# Importación correcta para que encuentre el Dashboard desde otra carpeta
from src.modules.gestion_productiva.dashboard_dueño import DashboardMelant
import os
import pyttsx3 # Librería para Texto a Voz (funciona offline)
class BienvenidaAuditiva:
    def _init_(self):
        self.monitor = DashboardMelant()
        self.engine = pyttsx3.init()
        # Ajustamos la voz a español y una velocidad pausada
        self.engine.setProperty('rate', 150) 

    def saludar_y_reportar(self, nombre_dueño):
        estado = self.monitor.obtener_estado_actual()
        alertas = estado["total_alertas_pendientes"]
        
        mensaje = f"Buenos días, {nombre_dueño}. "
        
        if alertas == 0:
            mensaje += "Todas las áreas de la finca están bajo control. No hay alertas pendientes."
        else:
            mensaje += f"Atención. Tienes {alertas} alertas pendientes. "
            # Detallamos dónde están los problemas
            for especie, cantidad in estado["detalle_por_especie"].items():
                if cantidad > 0:
                    mensaje += f"En {especie} hay {cantidad} reporte nuevo. "
            
            mensaje += "Por favor, revisa el tablero de control para más detalles."

        # El sistema habla
        self.engine.say(mensaje)
        self.engine.runAndWait()

# --- USO AL INICIAR LA APP ---
# voz = BienvenidaAuditiva()
# voz.saludar_y_reportar("Señor Productor")


def get_voice_summary():
    """Resumen del módulo Bienvenida Auditiva para el asistente de voz."""
    return (
        "Módulo de bienvenida activo. "
        "Al iniciar la app te saludo por tu nombre, reporto el estado general de la finca "
        "y te indico cuántas alertas tienes pendientes por especie o cultivo."
    )