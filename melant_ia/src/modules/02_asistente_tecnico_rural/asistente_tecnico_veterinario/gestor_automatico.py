
import os
import shutil
from datetime import datetime

class GestorTrazabilidadAuto:
    def __init__(self):
        # Ruta base que creamos en el paso anterior
        self.base_storage = "src/storage/trazabilidad"

    def procesar_entrada_campo(self, especie, animal_id, etapa, ruta_foto_temp):
        """
        Mueve la foto y crea el registro sin que el usuario escriba nada.
        especie: 'porcinos', 'equinos', 'aves', 'bovinos', 'cabras'
        etapa: 'nacimiento', 'vacuna', 'engorde', 'venta'
        """
        # 1. Definir carpeta de destino según la especie seleccionada por ícono
        carpeta_destino = os.path.join(self.base_storage, especie.lower())
        
        if not os.path.exists(carpeta_destino):
            os.makedirs(carpeta_destino)

        # 2. Generar nombre automático (ID + Etapa + Fecha)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M")
        nombre_final = f"{animal_id}_{etapa}_{timestamp}.jpg"
        ruta_final = os.path.join(carpeta_destino, nombre_final)

        # 3. Mover archivo físicamente
        try:
            shutil.move(ruta_foto_temp, ruta_final)
            return {
                "status": "success",
                "ruta": ruta_final,
                "mensaje": f"Foto de {especie} guardada correctamente"
            }
        except Exception as e:
            return {"status": "error", "mensaje": str(e)}

# Para usarlo en la App:
# auto = GestorTrazabilidadAuto()
# auto.procesar_entrada_campo('equinos', 'LUCERO_01', 'vacuna', 'foto_desde_camara.jpg')
{
  "modulo": "Asistente de Acompañamiento",
  "config_guia_automatica": {
    "disparador": "on_open_manual",
    "mensaje_ia": "He detectado que estás consultando sobre {especie}. ¿Deseas que te guíe en el proceso completo para asegurar tu inversión y evitar pérdidas de dinero?",
    "opciones_respuesta": [
      {
        "id": "guia_especifica_1",
        "texto": "Sí, son Gallinas Criollas (Libre Pastoreo)",
        "accion": "cargar_protocolo_pastoreo",
        "objetivo": "Optimizar recursos locales y precio premium"
      },
      {
        "id": "guia_especifica_2",
        "texto": "Sí, son Gallinas de Granja (Galpón)",
        "accion": "cargar_protocolo_galpon",
        "objetivo": "Control estricto de bioseguridad y conversión"
      },
      {
        "id": "solo_lectura",
        "texto": "No, solo quiero leer el manual",
        "accion": "abrir_pdf_estatico"
      }
    ],
    "bovinos": {
      "mensaje": "He detectado que consultas sobre Bovinos. ¿Deseas guía para Ganado de Leche o de Carne?",
      "pasos_criticos": ["Plan vacunal aftosa/brucelosis", "Control de mastitis", "Rotación de potreros"],
      "alerta_dinero": "Un día sin control de mastitis puede reducir su producción de leche en un 20%."
    },
    "cabras": {
      "mensaje": "He detectado que consultas sobre Cabras. ¿Deseas guía para producción de Leche o Pie de Cría?",
      "pasos_criticos": ["Desparasitación específica", "Higiene del ordeño", "Control de pezuñas"],
      "alerta_dinero": "Las cabras son sensibles a la humedad; un suelo inadecuado causa pérdidas por enfermedades podales."
    },
    "cuyes": {
      "mensaje": "He detectado que consultas sobre Cuyes. ¿Deseas guía para cría familiar o producción comercial?",
      "pasos_criticos": ["Selección de reproductores", "Control de temperatura y humedad", "Manejo de jaulas y limpieza", "Alimentación balanceada", "Prevención de enfermedades"],
      "alerta_dinero": "Un mal manejo sanitario puede causar pérdidas de hasta el 30% en la producción de cuyes."
    }
  },
  "flujo_acompañamiento": {
    "pasos_criticos": {
      "aves": ["Vacunación inicial", "Control de temperatura", "Registro de mortalidad"],
      "cerdos": ["Control de camadas", "Higiene de corral", "Pesaje mensual"],
      "equinos_paso_fino": ["Genealogía", "Herrado", "Entrenamiento"],
      "bovinos": ["Identificación individual", "Vacunación contra fiebre aftosa", "Control de desparasitación", "Registro de partos", "Manejo de pasturas"],
      "cabras": ["Identificación y registro", "Vacunación clostridiales", "Control de mastitis", "Manejo de lactancia", "Registro de nacimientos"],
      "cuyes": ["Selección de reproductores", "Control de temperatura y humedad", "Manejo de jaulas y limpieza", "Alimentación balanceada", "Prevención de enfermedades"]
    }
  }
}
