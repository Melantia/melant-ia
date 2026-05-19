import json
import os
import re

from .registro_trazabilidad import registrar_tratamiento

# Rutas a los JSON del módulo veterinario
_DIR = os.path.dirname(__file__)
_RUTA_CALCULADORA = os.path.join(_DIR, 'calculadora_dosis.json')
_RUTA_TRIAJE      = os.path.join(_DIR, 'algoritmo_triaje_ia.json')
_RUTA_BASE_VET    = os.path.join(_DIR, 'base_conocimiento_veterinaria.json')
_RUTA_FICHAS      = os.path.join(_DIR, 'fichas_respuesta_rapida.json')

# Registro de recursos del módulo veterinario
COMANDOS_VETERINARIOS = {
    "triaje":    "algoritmo_triaje_ia.json",
    "dosis":     "calculadora_dosis.json",
    "nutricion": "nutricion_estrategica.json",
    "biblioteca": "fichas_respuesta_rapida.json",
    "documentos": "fichas_respuesta_rapida.json",
}

# Sinónimos/alias que el productor puede usar oralmente → nombre exacto en JSON
_ALIAS_MEDICAMENTOS = {
    "desparasitante":  "Ivermectina",
    "ivermectina":     "Ivermectina",
    "antibiótico":     "Oxitetraciclina",
    "oxitetraciclina": "Oxitetraciclina",
    "albendazol":      "Albendazol",
    "enrofloxacina":   "Enrofloxacina",
}

_ALIAS_ESPECIES = {
    "cerdo": "porcinos",
    "cerdos": "porcinos",
    "chancho": "porcinos",
    "porcino": "porcinos",
    "porcinos": "porcinos",
    "vaca": "bovinos",
    "vacas": "bovinos",
    "toro": "bovinos",
    "ganado": "bovinos",
    "bovino": "bovinos",
    "bovinos": "bovinos",
    "pollo": "aves",
    "pollos": "aves",
    "gallina": "aves",
    "aves": "aves",
    "caballo": "equinos",
    "caballos": "equinos",
    "equino": "equinos",
    "equinos": "equinos",
    "perro": "caninos y felinos",
    "gato": "caninos y felinos",
    "canino": "caninos y felinos",
    "felino": "caninos y felinos",
}


class MotorInferencia:
    """
    Motor principal de inferencia veterinaria de MELANT IA.
    Centraliza diagnóstico y cálculo de dosis con salida por voz.
    """

    def __init__(self, voz):
        """
        Args:
            voz: instancia de AsistenteVoz con método decir(texto).
        """
        self.voz = voz

    # ------------------------------------------------------------------
    # Utilidades internas
    # ------------------------------------------------------------------

    def _cargar_medicamentos(self):
        """Carga y devuelve la lista de medicamentos desde calculadora_dosis.json."""
        with open(_RUTA_CALCULADORA, 'r', encoding='utf-8') as f:
            datos = json.load(f)
        return datos['calculadora_dosis']['medicamentos']

    @staticmethod
    def _cargar_json(ruta):
        with open(ruta, 'r', encoding='utf-8') as archivo:
            return json.load(archivo)

    def _cargar_base_veterinaria(self):
        return self._cargar_json(_RUTA_BASE_VET)['manual_veterinario_ingesta']

    def _cargar_fichas_rapidas(self):
        return self._cargar_json(_RUTA_FICHAS)['fichas_respuesta_rapida']

    @staticmethod
    def _normalizar_especie(texto):
        texto_limpio = texto.lower()
        for alias, especie in _ALIAS_ESPECIES.items():
            if alias in texto_limpio:
                return especie
        return None

    def _buscar_diagnostico_presuntivo(self, texto, especie=None):
        base = self._cargar_base_veterinaria()
        texto_limpio = texto.lower()
        especie_detectada = especie or self._normalizar_especie(texto_limpio)
        mejores = []

        for categoria in base['categorias_animales']:
            nombre_categoria = categoria.get('especie', '').lower()
            especie_categoria = self._normalizar_especie(nombre_categoria) or nombre_categoria
            if especie_detectada and especie_categoria != especie_detectada:
                continue
            for enfermedad in categoria.get('enfermedades_comunes', []):
                sintomas = enfermedad.get('sintomas_alerta', [])
                coincidencias = [s for s in sintomas if s.lower() in texto_limpio]
                if coincidencias:
                    mejores.append({
                        'especie': especie_categoria,
                        'categoria': categoria.get('especie'),
                        'nombre': enfermedad.get('nombre'),
                        'coincidencias': coincidencias,
                        'accion_preventiva': enfermedad.get('accion_preventiva'),
                        'gravedad': enfermedad.get('gravedad'),
                        'urgencia_veterinaria': enfermedad.get('urgencia_veterinaria', False),
                    })

        mejores.sort(key=lambda item: (len(item['coincidencias']), item['urgencia_veterinaria']), reverse=True)
        return mejores[0] if mejores else None

    def obtener_ficha_manejo(self, especie, fase='inicio'):
        fichas = self._cargar_fichas_rapidas()['biblioteca_trazabilidad_manejo']
        especie_norm = self._normalizar_especie(especie) or especie.lower()
        ficha = fichas.get(especie_norm, {}).get(fase)
        if ficha:
            return ficha
        return {
            'objetivo': 'Sin ficha disponible aún.',
            'pasos': ['Indique especie y fase válidas: inicio, crecimiento o finalizacion.'],
        }

    def generar_documento_guiado(self, tipo_documento, datos):
        documentos = self._cargar_fichas_rapidas()['documentos_generables']
        plantilla = documentos.get(tipo_documento)
        if not plantilla:
            return None
        payload = {campo: datos.get(campo, 'pendiente') for campo in plantilla['campos']}
        return {
            'titulo': plantilla['titulo'],
            'texto': plantilla['plantilla'].format(**payload),
        }

    def diagnostico_guiado_voz(self, comando_voz):
        fichas = self._cargar_fichas_rapidas()['diagnostico_voz_guiado']
        especie = self._normalizar_especie(comando_voz)
        diagnostico = self._buscar_diagnostico_presuntivo(comando_voz, especie)
        ficha = fichas.get(especie or '', None)

        preguntas = ficha['preguntas'] if ficha else [
            '¿Tiene fiebre o está más caliente de lo normal?',
            '¿Dejó de comer o está apartado del grupo?',
            '¿Observa manchas, diarrea o dificultad para respirar?'
        ]
        acciones = ficha['acciones_inmediatas'] if ficha else [
            'Aislar al animal.',
            'Desinfectar el área.',
            'Registrar foto y evolución.'
        ]

        if diagnostico:
            mensaje = (
                f"Diagnóstico presuntivo: podría ser {diagnostico['nombre']}. "
                f"Coinciden estos signos: {', '.join(diagnostico['coincidencias'])}. "
                f"Acción inmediata: {diagnostico['accion_preventiva']}."
            )
            if diagnostico['urgencia_veterinaria']:
                mensaje += ' Es un caso de alerta alta; contacte al veterinario.'
        else:
            mensaje = (
                'No tengo un diagnóstico presuntivo sólido todavía. '
                'Voy a guiarle con preguntas rápidas para reducir el riesgo.'
            )

        self.voz.decir(mensaje + ' ' + ' '.join(preguntas[:2]))
        return {
            'especie': especie,
            'diagnostico': diagnostico,
            'preguntas': preguntas,
            'acciones_inmediatas': acciones,
            'mensaje': mensaje,
        }

    def _buscar_medicamento(self, nombre_medicamento):
        """
        Busca un medicamento por nombre (sin distinción de mayúsculas).

        Returns:
            dict con los datos del medicamento, o None si no se encontró.
        """
        medicamentos = self._cargar_medicamentos()
        nombre_normalizado = nombre_medicamento.strip().lower()
        for med in medicamentos:
            if med['nombre'].lower() == nombre_normalizado:
                return med
        return None

    @staticmethod
    def _extraer_via(presentacion):
        """
        Deriva la vía de administración desde el campo 'presentacion'.
        Ejemplos: '1% inyectable' → 'inyectable', 'oral' → 'oral'.
        """
        presentacion_lower = presentacion.lower()
        if 'inyectable' in presentacion_lower:
            return 'inyectable'
        if 'oral' in presentacion_lower:
            return 'oral'
        return presentacion  # devuelve la presentación tal cual si no coincide

    @staticmethod
    def _calcular_volumen_ml(dosis_mg, presentacion):
        """
        Convierte mg totales a mL para presentaciones inyectables.
        Extrae el porcentaje de la cadena (ej. '1% inyectable' → 10 mg/mL).
        Si es oral, devuelve los mg directamente.

        Returns:
            (cantidad, unidad): tupla con el valor calculado y su unidad.
        """
        presentacion_lower = presentacion.lower()
        if 'inyectable' in presentacion_lower:
            # Extraer porcentaje: '20% inyectable' → 20 → 200 mg/mL
            try:
                porcentaje = float(presentacion_lower.split('%')[0].strip())
                concentracion_mg_ml = porcentaje * 10  # 1% = 10 mg/mL
                volumen = round(dosis_mg / concentracion_mg_ml, 2)
                return volumen, 'mL'
            except (ValueError, IndexError):
                return round(dosis_mg, 2), 'mg'
        # Presentación oral u otras: entregar en mg
        return round(dosis_mg, 2), 'mg'

    # ------------------------------------------------------------------
    # Método principal: Calculadora de Dosis por Voz
    # ------------------------------------------------------------------

    def ejecutar_calculo_voz(self, medicamento, peso_animal):
        """
        Calcula la dosis según el peso y la dicta al productor mediante voz.

        Args:
            medicamento (str): nombre del medicamento (ej. 'Ivermectina').
            peso_animal (float): peso del animal en kilogramos.
        """
        try:
            datos_med = self._buscar_medicamento(medicamento)

            if datos_med is None:
                self.voz.decir(
                    f"Lo siento, el medicamento {medicamento} no está en mi base de datos. "
                    "Por favor, consulte con su veterinario."
                )
                return

            # Cálculo de dosis total en mg
            dosis_total_mg = peso_animal * datos_med['dosis_mg_kg']

            # Convertir a unidad de presentación
            cantidad, unidad = self._calcular_volumen_ml(
                dosis_total_mg, datos_med['presentacion']
            )

            via = self._extraer_via(datos_med['presentacion'])
            nombre_med = datos_med['nombre']
            intervalo = datos_med.get('intervalo_repeticion', '')

            mensaje = (
                f"Cálculo completado. Para un animal de {peso_animal} kilos, "
                f"debe administrar {cantidad} {unidad} de {nombre_med}. "
                f"Repito: {cantidad} {unidad} de {nombre_med}. "
                f"Vía de administración: {via}. "
                f"Repetir {intervalo}."
            )

            self.voz.decir(mensaje)

            # --- Trazabilidad automática ---
            try:
                registrar_tratamiento(
                    medicamento=nombre_med,
                    dosis=cantidad,
                    unidad=unidad,
                    peso_animal=peso_animal,
                )
            except Exception:
                pass  # La trazabilidad no debe interrumpir el flujo de voz

        except FileNotFoundError:
            self.voz.decir(
                "Error: no se encontró el archivo de calculadora de dosis. "
                "Verifique la instalación del sistema."
            )
        except Exception:
            self.voz.decir(
                "Lo siento, no pude calcular la dosis. "
                "Por favor, verifique el peso del animal."
            )

    # ------------------------------------------------------------------
    # Procesamiento de consultas veterinarias por voz
    # ------------------------------------------------------------------

    @staticmethod
    def _extraer_peso(texto):
        """
        Extrae el primer número (entero o decimal) mencionado en el texto.
        Ej: 'una vaca de 400 kilos' → 400.0
        Devuelve None si no encuentra ninguno.
        """
        match = re.search(r'\b(\d+(?:[.,]\d+)?)\b', texto)
        if match:
            return float(match.group(1).replace(',', '.'))
        return None

    @staticmethod
    def _resolver_alias(texto):
        """
        Busca en el texto algún alias conocido y devuelve el nombre exacto
        del medicamento en la base de datos.
        Devuelve None si no encuentra coincidencia.
        """
        texto_lower = texto.lower()
        for alias, nombre_real in _ALIAS_MEDICAMENTOS.items():
            if alias in texto_lower:
                return nombre_real
        return None

    def _iniciar_triaje(self):
        """
        Lee la primera pregunta del árbol de triaje y la dicta al productor.
        """
        try:
            with open(_RUTA_TRIAJE, 'r', encoding='utf-8') as f:
                datos = json.load(f)
            preguntas = datos['algoritmo_triaje_ia']['arbol_de_preguntas']
            primera = preguntas[0]['pregunta']
            self.voz.decir(
                "Iniciando protocolo de triaje. " + primera
            )
        except Exception:
            self.voz.decir(
                "Iniciando protocolo de triaje. "
                "¿El animal presenta fiebre o falta de apetito?"
            )

    def _responder_biblioteca(self, texto):
        especie = self._normalizar_especie(texto)
        if not especie:
            self.voz.decir(
                'Indique la especie para abrir la biblioteca de manejo: porcinos, bovinos, aves o equinos.'
            )
            return

        fase = 'inicio'
        if 'crecimiento' in texto or 'vacun' in texto or 'peso' in texto:
            fase = 'crecimiento'
        elif 'final' in texto or 'venta' in texto or 'comercial' in texto:
            fase = 'finalizacion'

        ficha = self.obtener_ficha_manejo(especie, fase)
        pasos = ' '.join(ficha.get('pasos', [])[:3])
        self.voz.decir(
            f"Biblioteca veterinaria para {especie}, fase {fase}. Objetivo: {ficha.get('objetivo')}. {pasos}"
        )

    def _responder_documento(self, texto):
        especie = self._normalizar_especie(texto) or 'porcinos'
        datos = {
            'productor': 'Productor pendiente',
            'finca': 'Finca pendiente',
            'origen': 'Origen pendiente',
            'destino': 'Destino pendiente',
            'especie': especie,
            'cantidad': '1',
            'identificador_lote': 'Lote pendiente',
            'hallazgo': 'Hallazgo pendiente',
            'accion': 'Acción pendiente',
            'fecha': 'pendiente',
        }

        if 'movil' in texto or 'transport' in texto:
            doc = self.generar_documento_guiado('guia_movilizacion', datos)
        else:
            doc = self.generar_documento_guiado('reporte_sanitario', datos)

        if not doc:
            self.voz.decir('No pude preparar el documento solicitado.')
            return

        self.voz.decir(f"{doc['titulo']}. {doc['texto']}")

    def procesar_consulta_veterinaria(self, comando_voz):
        """
        Analiza el comando de voz del productor y ejecuta la función
        veterinaria correspondiente.

        Flujos soportados:
        - Cálculo de dosis: detecta 'dosis', 'cuánto le pongo', 'cuanto le pongo'.
        - Triaje / diagnóstico: detecta 'síntomas', 'síntoma', 'está enferma',
          'está enfermo', 'triaje'.

        Args:
            comando_voz (str): texto reconocido por el sistema de voz.
        """
        texto = comando_voz.lower()

        # --- Rama de cálculo de dosis ---
        palabras_dosis = ("dosis", "cuánto le pongo", "cuanto le pongo",
                          "cuánto aplico", "cuanto aplico")
        if any(p in texto for p in palabras_dosis):
            medicamento = self._resolver_alias(texto)
            peso = self._extraer_peso(texto)

            if medicamento is None:
                self.voz.decir(
                    "Indique el medicamento. Por ejemplo: ivermectina, albendazol "
                    "o enrofloxacina."
                )
                return

            if peso is None:
                self.voz.decir(
                    "No detecté el peso del animal. "
                    "Por favor, diga el peso en kilos."
                )
                return

            self.ejecutar_calculo_voz(medicamento, peso)

        # --- Rama de triaje / diagnóstico ---
        elif any(p in texto for p in ("síntomas", "sintomas", "está enferma",
                                      "esta enferma", "está enfermo",
                                      "esta enfermo", "triaje")):
            self._iniciar_triaje()

        elif any(p in texto for p in (
            'no quiere comer', 'no come', 'manchas', 'piel roja', 'cojera', 'diagnostica'
        )):
            self.diagnostico_guiado_voz(comando_voz)

        elif any(p in texto for p in (
            'vacunacion', 'vacunación', 'trazabilidad', 'crecimiento', 'comercializar', 'biblioteca'
        )):
            self._responder_biblioteca(texto)

        elif any(p in texto for p in (
            'guia de movilizacion', 'guía de movilización', 'movilizar', 'reporte sanitario'
        )):
            self._responder_documento(texto)

        else:
            self.voz.decir(
                "No entendí la consulta veterinaria. "
                "Puede preguntar por dosis, reportar síntomas, abrir la biblioteca veterinaria o pedir un documento sanitario."
            )
