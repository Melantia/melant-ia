import os
import json

class DashboardMelant_ia:
    def _init_(self):
        self.base_path = "src/storage/trazabilidad"
        self.especies = ["porcinos", "aves", "equinos", "bovinos", "cabras"]

    def obtener_estado_actual(self):
        resumen = {}
        alertas_totales = 0
        
        for especie in self.especies:
            ruta_alertas = os.path.join(self.base_path, especie, "alertas")
            
            # Contamos cuántos archivos JSON hay en la carpeta de alertas
            if os.path.exists(ruta_alertas):
                num_alertas = len([f for f in os.listdir(ruta_alertas) if f.endswith('.json')])
            else:
                num_alertas = 0
            
            resumen[especie] = num_alertas
            alertas_totales += num_alertas
            
        return {
            "detalle_por_especie": resumen,
            "total_alertas_pendientes": alertas_totales,
            "estado_general": "CRÍTICO" if alertas_totales > 0 else "TODO EN ORDEN"
        }

# --- PRUEBA DEL TABLERO ---
# monitor = DashboardMelant_ia()
# print(monitor.obtener_estado_actual())