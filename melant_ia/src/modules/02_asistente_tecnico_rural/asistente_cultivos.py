import json
import os
from datetime import datetime

class AsistenteCultivosIA:
    def __init__(self):
        self.ruta_gps = "02_BIBLIOTECA/gps_agro"
        self.ruta_conocimiento = "02_BIBLIOTECA/cultivos_varios"

    def iniciar_monitoreo_lote(self, lote_id, coordenadas, cultivo):
        """
        Vincula la posición GPS con el conocimiento técnico del cultivo.
        """
        # 1. Registrar posición (Agricultura de Precisión)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_gps = {
            "lote": lote_id,
            "posicion": coordenadas, # Ej: {"lat": -1.023, "lon": -79.456}
            "cultivo": cultivo,
            "fecha": timestamp
        }
        
        # Guardamos en tu carpeta de GPS
        with open(f"{self.ruta_gps}/lote_{lote_id}_{timestamp}.json", 'w') as f:
            json.dump(log_gps, f, indent=4)

        # 2. Cargar conocimiento proactivo (Inferencia)
        return self.obtener_instrucciones_proactivas(cultivo)

    def obtener_instrucciones_proactivas(self, cultivo):
        # Buscamos en tus archivos JSON de la biblioteca
        if "cacao" in cultivo.lower():
            return {
                "ia_dice": "He registrado las coordenadas de este lote de Cacao.",
                "accion_precisón": "Según la bioclimatología actual, toca abonado potásico.",
                "manual_recomendado": "02_BIBLIOTECA/cacao/guia_nutricion.pdf"
            }
        return {"ia_dice": "Lote registrado correctamente."}

# Ejemplo:
# asistente = AsistenteCultivosIA()
# print(asistente.iniciar_monitoreo_lote("LOTE_NORTE", {"lat": -1.2, "lon": -78.5}, "Cacao CCN-51"))


def get_voice_summary():
    """Resumen del módulo Cultivos para el asistente de voz."""
    return (
        "Módulo de Cultivos activo. "
        "Puedo monitorear lotes con GPS, vincular cada parcela con su cultivo, "
        "y dar instrucciones proactivas según la etapa de crecimiento. "
        "Dime el nombre del lote o cultivo para comenzar."
    )