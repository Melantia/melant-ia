import os
import json
from datetime import datetime

class AlertaEquinaPro:
    def _init_(self):
        self.ruta_equinos = "src/storage/trazabilidad/equinos/alertas"
        if not os.path.exists(self.ruta_equinos):
            os.makedirs(self.ruta_equinos)

    def registrar_emergencia_paso_fino(self, nombre_caballo, valor_estimado, sintomas_voz, empleado, veterinario_contacto):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        nombre_archivo = f"CRITICO_{nombre_caballo}_{timestamp}.json"
        
        # Estructura empresarial de alto nivel
        data_emergencia = {
            "prioridad": "MÁXIMA - VALOR ACTIVO",
            "ejemplar": nombre_caballo,
            "valor_en_riesgo": f"${valor_estimado}",
            "fecha_reporte": datetime.now().isoformat(),
            "reportado_por": empleado,
            "diagnostico_voz": sintomas_voz,
            "contacto_veterinario": veterinario_contacto,
            "instrucciones_inmediatas": "Mantener al ejemplar caminando. No suministrar grano.",
            "estado": "NOTIFICADO"
        }

        ruta_final = os.path.join(self.ruta_equinos, nombre_archivo)
        
        with open(ruta_final, 'w', encoding='utf-8') as f:
            json.dump(data_emergencia, f, ensure_ascii=False, indent=4)
        
        return f"🚨 ALERTA CRÍTICA: Reporte generado para {nombre_caballo}. Archivo guardado en carpeta de alertas equinas."

# --- SIMULACIÓN DE ALERTA ---
# ejecutor = AlertaEquinaPro()
# print(ejecutor.registrar_emergencia_paso_fino(
#    "LUCERO_DEL_VALLE", 25000, "Presenta sudoración excesiva y patea el abdomen", "Juan Perez", "Dr. Castillo - 099xxxxxx"
# ))