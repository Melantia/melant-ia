import json
import os
from src.ia.logica_asistente import AsistenteTecnico # Importa tu lógica de suelos
from src.ia.voz_asistente import VozAsistente       # Importa tu motor de voz

class MotorInferencia:
    def __init__(self):
        # 1. Cargamos los datos de tus JSON
        with open('data_cultivos.json', 'r', encoding='utf-8') as f:
            self.datos_agronomicos = json.load(f)
        
        # 2. Inicializamos los otros módulos
        self.asistente_suelos = AsistenteTecnico()
        self.voz = VozAsistente()

    def procesar_consulta(self, texto_voz):
        """
        Recibe lo que el agricultor dijo, busca el cultivo 
        y decide qué responder.
        """
        texto = texto_voz.lower()
        cultivo_encontrado = None

        # Buscamos el cultivo en tu lista de 'ultivos' (como vimos en tu imagen)
        for nombre in self.datos_agronomicos['ultivos'].keys():
            if nombre in texto:
                cultivo_encontrado = nombre
                break

        if cultivo_encontrado:
            info = self.datos_agronomicos['ultivos'][cultivo_encontrado]
            
            # Si el agricultor pregunta por costos o ahorro
            if "ahorro" in texto or "cuánto" in texto or "dinero" in texto:
                # Aquí usamos la lógica de cálculo que definimos antes
                calc = info.get('calculos_agriculture', {})
                costo_q = calc.get('convencional', {}).get('costo_ha', 900)
                costo_r = calc.get('organica_regenerativa', {}).get('costo_ha', 450)
                ahorro = costo_q - costo_r
                
                respuesta = f"Para el {cultivo_encontrado}, usando agricultura regenerativa ahorras {ahorro} dólares por hectárea."
            
            # Si pregunta por siembra o luna
            elif "siembra" in texto or "luna" in texto:
                epoca = info.get('epoca_siembra_recomendada')
                luna = info.get('calendario_lunar')
                respuesta = f"La época para sembrar {cultivo_encontrado} es {epoca}. Recuerda que la mejor luna es {luna}."
            
            else:
                respuesta = f"He encontrado información de {cultivo_encontrado}. ¿Quieres saber el ahorro económico o la época de siembra?"
        
        else:
            respuesta = "No pude reconocer el cultivo. Por favor, dime el nombre de nuevo."

        # Finalmente, la IA habla
        self.voz.hablar(respuesta)

# --- INICIO DEL SISTEMA ---
# motor = MotorInferencia()
# motor.procesar_consulta("¿Cuánto ahorro en habichuelas?")


# ==============================================
# Motor de Inferencia Local — Soberanía Offline
# Carga modelos TFLite desde disco local.
# Nunca realiza peticiones a URLs externas.
# ==============================================
try:
    import tflite_runtime.interpreter as tflite
except ImportError:
    tflite = None  # Entorno sin tflite_runtime (desarrollo en PC)


class MotorInferenciaLocal:
    def __init__(self):
        # Ruta local absoluta para garantizar funcionamiento offline
        self.modelo_path = os.path.join('src', 'ia', 'modelos', 'agro_vision_v1.tflite')
        if tflite and os.path.exists(self.modelo_path):
            self.interpreter = tflite.Interpreter(model_path=self.modelo_path)
            self.interpreter.allocate_tensors()
            print('🤖 IA Cargada: Funcionando sin internet correctamente.')
        else:
            self.interpreter = None
            print('⚠️  Modelo TFLite no encontrado — modo texto activo.')

    def esta_listo(self):
        return self.interpreter is not None


def get_voice_summary():
    """Resumen del módulo Motor de Inferencia para el asistente de voz."""
    return (
        "Motor de inteligencia activo. "
        "Proceso consultas en lenguaje natural sobre cultivos, épocas de siembra, "
        "calendario lunar y ahorro económico entre métodos orgánicos y convencionales. "
        "Puedes preguntarme directamente y te respondo con voz."
    )
# Mapa de módulos → archivos de conocimiento
ARCHIVOS_MODULOS = {
    "veterinario": "asistente_veterinario.json",
    "rural":       "data_cultivos.json",
    "precision":   "agricultura_precision.json",
    "digital":     "agricultura_digital.json",
}


class MotorInferencia:
    def _init_(self, modulo_activo):
        # Seleccionamos el archivo según el módulo usando el mapa
        archivo = ARCHIVOS_MODULOS.get(modulo_activo, "data_cultivos.json")
        ruta = os.path.join('src', 'knowledge_seeds', archivo)

        with open(ruta, 'r', encoding='utf-8') as f:
            self.conocimiento = json.load(f)

    def guiar_paso_a_paso(self, actividad, paso_actual=0):
        guia = self.conocimiento.get('guias_interactivas', {}).get(actividad)
        if guia and paso_actual < len(guia):
            instruccion = guia[paso_actual]
            # La voz masculina leerá la instrucción
            self.voz.hablar(instruccion)
            return {"texto": instruccion, "siguiente_paso": paso_actual + 1}
        return {"texto": "Procedimiento finalizado con éxito.", "fin": True}

    def obtener_guia_precision(self, submodulo):
        """Retorna descripción, herramientas y alertas del submódulo de precisión."""
        if self.modulo_activo != 'precision':
            return {"error": "Módulo activo no es 'precision'."}
        data = self.conocimiento.get('submodulos', {}).get(submodulo)
        if not data:
            return {"error": f"Submódulo '{submodulo}' no encontrado."}
        descripcion = data.get('descripcion', '')
        herramientas = data.get('herramientas', data.get('fuente', data.get('integracion', '')))
        texto = f"Iniciando {submodulo}: {descripcion}"
        if herramientas:
            texto += f" Herramientas: {herramientas}."
        return {"texto": texto, "data": data}

    def obtener_umbral_alerta_precision(self, submodulo):
        """Devuelve los umbrales de alerta del submódulo (riego, NDVI, etc.)."""
        if self.modulo_activo != 'precision':
            return None
        data = self.conocimiento.get('submodulos', {}).get(submodulo, {})
        return data.get('umbrales', data.get('zonas', data.get('umbral_alerta')))

    def guiar_medicion(self, tipo_herramienta, paso_actual):
        """
        Busca la instrucción específica en agricultura_digital.json
        y la envía al módulo de voz (voz masculina técnica).

        tipo_herramienta: clave del JSON — 'sensores', 'gps_medicion', 'comunicaciones'
        paso_actual: índice 0-based del paso en la guía
        """
        bloque = self.conocimiento.get(tipo_herramienta, {})
        clave_guia = 'guia_proceso' if 'gps' in tipo_herramienta else (
                     'guia_radio' if 'comunic' in tipo_herramienta else 'guia_instalacion')
        guia = bloque.get(clave_guia)

        if guia and paso_actual < len(guia):
            mensaje = guia[paso_actual]
            self.voz.hablar(mensaje)
            return {
                "instruccion": mensaje,
                "paso": paso_actual,
                "total_pasos": len(guia),
                "status": "en_progreso",
            }

        return {
            "instruccion": "Proceso completado. Datos guardados en la nube de Melant_ia.",
            "status": "finalizado",
        }