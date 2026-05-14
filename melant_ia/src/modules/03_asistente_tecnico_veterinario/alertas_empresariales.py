import os
import json
from datetime import datetime

class SistemaAlertasEmpresarial:
    def _init_(self):
        self.base_path = "src/storage/trazabilidad"

    def registrar_alerta_critica(self, especie, animal_id, texto_voz, ruta_foto, empleado_nombre):
        """
        Crea la carpeta de alertas, guarda el reporte y vincula al empleado.
        """
        # 1. Crear la ruta: src/storage/trazabilidad/[especie]/alertas/
        ruta_alertas = os.path.join(self.base_path, especie.lower(), "alertas")
        if not os.path.exists(ruta_alertas):
            os.makedirs(ruta_alertas)

        # 2. Generar nombre de archivo único por fecha y animal
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        nombre_reporte = f"ALERTA_{animal_id}_{timestamp}.json"
        ruta_completa_reporte = os.path.join(ruta_alertas, nombre_reporte)

        # 3. Crear el contenido del reporte (Gestión Real)
        reporte_data = {
            "fecha_hora": datetime.now().isoformat(),
            "animal_id": animal_id,
            "especie": especie,
            "empleado_reporta": empleado_nombre, # Registro para premiar detección temprana
            "descripcion_voz": texto_voz,
            "evidencia_foto": ruta_foto,
            "estado_atencion": "PENDIENTE",
            "nivel_prioridad": "ALTA"
        }

        # 4. Guardar el archivo físico
        try:
            with open(ruta_completa_reporte, 'w', encoding='utf-8') as f:
                json.dump(reporte_data, f, ensure_ascii=False, indent=4)
            
            return {
                "status": "success",
                "mensaje": f"Alerta registrada por {empleado_nombre}. Archivo creado en {ruta_alertas}",
                "archivo": nombre_reporte
            }
        except Exception as e:
            return {"status": "error", "mensaje": f"Error al crear reporte: {e}"}

# --- EJEMPLO DE ACTIVACIÓN ---
# Cuando la IA detecta una enfermedad, la App ejecuta esto:
# gestor = SistemaAlertasEmpresarial()
# print(gestor.registrar_alerta_critica(
#    especie="porcinos", 
#    animal_id="LOTE_B24", 
#    texto_voz="Tienen manchas rojas y no quieren comer", 
#    ruta_foto="src/storage/trazabilidad/porcinos/fotos/enf01.jpg",
#    empleado_nombre="Juan Pérez"
# ))