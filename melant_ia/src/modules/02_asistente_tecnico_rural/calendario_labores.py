from kivy.app import App
from kivy.uix.button import Button
from kivy.uix.scrollview import ScrollView
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.screenmanager import ScreenManager, Screen
from kivy.uix.textinput import TextInput
from kivy.uix.gridlayout import GridLayout

class PantallaSeleccionIdioma(Screen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.layout = BoxLayout(orientation='vertical', padding=30, spacing=20)
        self.layout.add_widget(Label(text="Selecciona tu idioma", font_size='24sp', bold=True))
        idiomas = [
            ("Español", "es"),
            ("Quichua", "qu"),
            ("Shuar", "sh"),
            ("Tsafiki", "ts"),
            ("Inglés", "english"),
            ("Quichua (variante)", "quichua"),
            ("Shuar (variante)", "shuar"),
            ("Tsafiki (variante)", "tsafiki")
        ]
        for nombre, codigo in idiomas:
            btn = Button(text=nombre, size_hint_y=None, height=60)
            btn.bind(on_release=lambda x, c=codigo: self.seleccionar_idioma(c))
            self.layout.add_widget(btn)
        self.add_widget(self.layout)

    def seleccionar_idioma(self, codigo):

        app = App.get_running_app()
        app.idioma_usuario = codigo
        self.manager.current = 'menu'

import os
import random
import datetime
import uuid
import json
from config_rutas import SABERES_DIR, SALUD_DIR, GPS_DIR, FOTOS_DIR, DOCUMENTOS_DIR, CARBONO_DIR
from kivy.utils import platform
from comunicacion import WalkieTalkieMotor
from base_datos import guardar_registro_salud
from calculos import calcular_fertilizante
from geometria import calcular_area_poligono
try:
    from plyer import audio
except ImportError:
    audio = None
class PantallaSaberesAncestrales(Screen):
    def __init__(self, idioma_usuario='es', **kwargs):
        super().__init__(**kwargs)
        self.idioma_usuario = idioma_usuario
        self.layout = BoxLayout(orientation='vertical', padding=15, spacing=10)
        self.layout.add_widget(Label(text="👂 SABERES ANCESTRALES", font_size='22sp', bold=True, color=(0.5,0.3,0.1,1)))
        self.historia_actual = self.seleccionar_historia_del_dia()
        self.reproducciones = 0
        self.label_historia = Label(text=f"Hoy: {self.formatear_historia(self.historia_actual) if self.historia_actual else 'No hay historias.'}", font_size='18sp')
        self.layout.add_widget(self.label_historia)
        self.btn_siguiente = Button(text="🔄 Cambiar idioma", size_hint_y=None, height=50, background_color=(0.7,0.7,0.2,1))
        self.btn_siguiente.bind(on_release=self.cambiar_idioma)
        self.layout.add_widget(self.btn_siguiente)
        self.label_info = Label(text="Solo puedes ver una historia diferente cada día.", font_size='14sp')
        self.layout.add_widget(self.label_info)
        btn_volver = Button(text="Volver", size_hint_y=None, height=50, background_color=(0.7,0.7,0.7,1))
        btn_volver.bind(on_release=lambda x: setattr(self.manager, 'current', 'menu'))
        self.layout.add_widget(btn_volver)
        self.add_widget(self.layout)

    def seleccionar_historia_del_dia(self):
        idioma = self.idioma_usuario
        rutas = [
            os.path.join(SABERES_DIR, f'saberes_folclore_{idioma}.json'),
            os.path.join(SABERES_DIR, f'saberes_manabitas_{idioma}.json'),
            os.path.join(SABERES_DIR, 'saberes_manabitas.json')
        ]
        ruta = None
        for r in rutas:
            if os.path.exists(r):
                ruta = r
                break
        if not ruta:
            return None
        try:
            with open(ruta, 'r', encoding='utf-8') as f:
                historias = json.load(f)
        except Exception:
            return None
        if not historias:
            return None
        hoy = datetime.date.today().toordinal()
        idx = hoy % len(historias)
        return historias[idx]

    def formatear_historia(self, historia):
        if not historia:
            return "No hay historia."
        if 'titulo' in historia and 'descripcion' in historia:
            return f"{historia['titulo']}\n{historia['descripcion']}"
        if 'texto' in historia:
            return historia['texto']
        return str(historia)

    def cambiar_idioma(self, instance):
        # Cambia entre los idiomas disponibles
        idiomas = ['es', 'qu', 'sh', 'ts', 'english', 'quichua', 'shuar', 'tsafiki']
        idx = idiomas.index(self.idioma_usuario) if self.idioma_usuario in idiomas else 0
        idx = (idx + 1) % len(idiomas)
        self.idioma_usuario = idiomas[idx]
        self.historia_actual = self.seleccionar_historia_del_dia()
        self.label_historia.text = f"Hoy: {self.formatear_historia(self.historia_actual) if self.historia_actual else 'No hay historias.'}"

    def control_audio(self, accion):
        # Simulación: en producción, usar funciones de audio para adelantar/retroceder
        if audio:
            if accion == 'back':
                audio.seek(-10)  # Retrocede 10 segundos (si la función existe)
            elif accion == 'forward':
                audio.seek(10)   # Adelanta 10 segundos
        self.label_info.text = f"{accion.capitalize()} 10 segundos."
from comunicacion import WalkieTalkieMotor
import uuid
# --- 4. PANTALLA WALKIE TALKIE (MALLA) ---
class PantallaWalkieTalkie(Screen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.motor = WalkieTalkieMotor(self.recibir_mensaje_red)
        self.layout = BoxLayout(orientation='vertical', padding=15, spacing=10)
        from kivy.uix.scrollview import ScrollView
        self.chat_log = Label(text="[Chat Rural Mesh]", size_hint_y=None, halign="left", valign="top")
        self.chat_log.bind(size=self.chat_log.setter('text_size'))
        self.chat_log.bind(texture_size=self._update_chat_log_height)
        self.scroll = ScrollView(size_hint=(1, 0.7))
        self.scroll.add_widget(self.chat_log)
        self.layout.add_widget(self.scroll)
        # Campo de entrada y botones
        self.input_box = TextInput(hint_text="Escribe tu mensaje...", multiline=False, size_hint_y=None, height=50)
        self.layout.add_widget(self.input_box)
        btn_enviar = Button(text="Enviar", size_hint_y=None, height=50, background_color=(0.2,0.6,0.2,1))
        btn_enviar.bind(on_release=self.enviar_desde_input)
        self.layout.add_widget(btn_enviar)
        btn_sos = Button(
            text="🚨 ENVIAR ALERTA S.O.S",
            size_hint_y=None,
            height=80,
            background_color=(1, 0, 0, 1),
            bold=True
        )
        btn_sos.bind(on_release=lambda x: self.enviar_mensaje_malla("¡EMERGENCIA! Necesito ayuda en mi posición."))
        self.layout.add_widget(btn_sos)
        btn_volver = Button(text="Volver", size_hint_y=None, height=50, background_color=(0.7,0.7,0.7,1))
        btn_volver.bind(on_release=lambda x: setattr(self.manager, 'current', 'agro_digital'))
        self.layout.add_widget(btn_volver)
        self.add_widget(self.layout)

    def _update_chat_log_height(self, instance, value):
        self.chat_log.height = self.chat_log.texture_size[1]
        self.chat_log.text_size = (self.scroll.width, None)

    def enviar_desde_input(self, instance):
        texto = self.input_box.text.strip()
        if texto:
            self.enviar_mensaje_malla(texto)
            self.input_box.text = ""

    def enviar_mensaje_malla(self, texto):
        msg_id = str(uuid.uuid4())[:8]
        paquete = f"{msg_id}|{texto}"
        self.motor.propagar_mensaje(paquete)
        self.chat_log.text += f"\n[Tú]: {texto}"

    def recibir_mensaje_red(self, contenido):
        self.chat_log.text += f"\n[RURAL]: {contenido}"
import json
from kivy.app import App
from kivy.uix.button import Button
from kivy.uix.scrollview import ScrollView
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.screenmanager import ScreenManager, Screen
from kivy.uix.textinput import TextInput
from calculos import calcular_fertilizante
from kivy.uix.gridlayout import GridLayout
from base_datos import guardar_registro_salud
from geometria import calcular_area_poligono
from kivy.utils import platform

# --- 1. PANTALLA DE DETALLE (SUBMÓDULOS O ÍTEMS) ---
class PantallaDetalle(Screen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.layout = BoxLayout(orientation='vertical', padding=10)
        self.add_widget(self.layout)

    def actualizar_contenido(self, categoria_data):
        self.layout.clear_widgets()
        # Título de la sección
        self.layout.add_widget(Label(text=categoria_data['categoria'], font_size='22sp', size_hint_y=None, height=60, bold=True))
        menu_items = BoxLayout(orientation='vertical', size_hint_y=None, spacing=10, padding=10)
        menu_items.bind(minimum_height=menu_items.setter('height'))
        # LÓGICA DE TU JSON: ¿Tiene submodulos o items directos?
        if "submodulos" in categoria_data:
            for sub in categoria_data['submodulos']:
                # Etiqueta de Subgrupo
                menu_items.add_widget(Label(text=sub['nombre'], color=(0.7, 0.7, 0.7, 1), size_hint_y=None, height=40))
                for item in sub['items']:
                    nombre = item['nombre'] if isinstance(item, dict) else item
                    btn = Button(text=nombre, size_hint_y=None, height=60, background_color=(0.3, 0.5, 0.3, 1))
                    menu_items.add_widget(btn)
        elif "items" in categoria_data:
            for item in categoria_data['items']:
                nombre = item['nombre'] if isinstance(item, dict) else item
                btn = Button(text=nombre, size_hint_y=None, height=60)
                menu_items.add_widget(btn)
        # Botón Volver
        btn_volver = Button(text="<< Volver al Inicio", size_hint_y=None, height=70, background_color=(0.8, 0.2, 0.2, 1))
        btn_volver.bind(on_release=self.ir_atras)
        scroll = ScrollView()
        scroll.add_widget(menu_items)
        self.layout.add_widget(scroll)
        self.layout.add_widget(btn_volver)

    def ir_atras(self, instance):
        self.manager.current = 'menu'

# --- 2. PANTALLA DE MENÚ PRINCIPAL ---
class MenuPrincipal(Screen):
    def __init__(self, data, **kwargs):
        super().__init__(**kwargs)
        layout = BoxLayout(orientation='vertical', padding=10, spacing=10)
        layout.add_widget(Label(text=data['app_name'], font_size='28sp', bold=True, size_hint_y=None, height=60))
        scroll = ScrollView()
        menu_items = BoxLayout(orientation='vertical', size_hint_y=None, spacing=10)
        menu_items.bind(minimum_height=menu_items.setter('height'))
        for cat in data['menu_principal']:
            btn = Button(text=cat['categoria'], size_hint_y=None, height=70, background_color=(0.2, 0.4, 0.2, 1))
            btn.bind(on_release=lambda x, c=cat: self.ir_a_detalle(c))
            menu_items.add_widget(btn)
        scroll.add_widget(menu_items)
        layout.add_widget(scroll)
        self.add_widget(layout)

    def ir_a_detalle(self, categoria):
        detalle_screen = self.manager.get_screen('detalle')
        detalle_screen.actualizar_contenido(categoria)
        self.manager.current = 'detalle'

# --- 3. PANTALLA DE ASISTENTE TÉCNICO ---
class PantallaAsistente(Screen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.layout = BoxLayout(orientation='vertical', padding=20, spacing=10)
        self.layout.add_widget(Label(text="Asistente Técnico MELANT", font_size='22sp', bold=True))
        # Entrada de texto para el cultivo
        self.layout.add_widget(Label(text="¿Qué cultivo tienes? (Ej: Maíz)"))
        self.cultivo_input = TextInput(multiline=False, size_hint_y=None, height=50)
        self.layout.add_widget(self.cultivo_input)
        # Entrada de texto para el síntoma
        self.layout.add_widget(Label(text="¿Qué problema observas?"))
        self.problema_input = TextInput(multiline=False, size_hint_y=None, height=50)
        self.layout.add_widget(self.problema_input)
        # Botón de Consulta
        btn_consultar = Button(text="Consultar Asistente", size_hint_y=None, height=60, background_color=(0.1, 0.7, 0.1, 1))
        btn_consultar.bind(on_release=self.consultar_tecnico)
        self.layout.add_widget(btn_consultar)
        # Resultado
        self.resultado_label = Label(text="La respuesta aparecerá aquí...", halign="center", valign="middle")
        self.resultado_label.bind(size=self.resultado_label.setter('text_size'))
        self.layout.add_widget(self.resultado_label)
        # --- SECCIÓN DE CALCULADORA ---
        self.layout.add_widget(Label(text="--- Calculadora de Fertilizante ---", color=(0.5, 0.8, 0.5, 1)))
        fila_calc = BoxLayout(orientation='horizontal', size_hint_y=None, height=50, spacing=5)
        self.ha_input = TextInput(hint_text="Hectáreas", multiline=False, input_filter='float')
        self.dosis_input = TextInput(hint_text="Dosis (kg/ha)", multiline=False, input_filter='float')
        fila_calc.add_widget(self.ha_input)
        fila_calc.add_widget(self.dosis_input)
        self.layout.add_widget(fila_calc)
        btn_calc = Button(text="Calcular Sacos", size_hint_y=None, height=50, background_color=(0.2, 0.5, 0.8, 1))
        btn_calc.bind(on_release=self.ejecutar_calculo)
        self.layout.add_widget(btn_calc)
        self.resultado_calc = Label(text="Resultado: 0 sacos", font_size='16sp', bold=True)
        self.layout.add_widget(self.resultado_calc)
        # --- SECCIÓN: REGISTRAR LOTE ---
        self.layout.add_widget(Label(text="--- Registrar Nuevo Lote ---", color=(0.8, 0.8, 0.2, 1)))
        fila_lote = BoxLayout(orientation='horizontal', size_hint_y=None, height=50, spacing=5)
        self.nombre_lote_input = TextInput(hint_text="Nombre (Ej: La Loma)", multiline=False)
        self.area_lote_input = TextInput(hint_text="Área (Ha)", multiline=False, input_filter='float')
        fila_lote.add_widget(self.nombre_lote_input)
        fila_lote.add_widget(self.area_lote_input)
        self.layout.add_widget(fila_lote)
        btn_guardar_lote = Button(text="Guardar Lote", size_hint_y=None, height=50, background_color=(0.5, 0.4, 0.2, 1))
        btn_guardar_lote.bind(on_release=self.guardar_lote_db)
        self.layout.add_widget(btn_guardar_lote)
        # Volver
        btn_volver = Button(text="Volver", size_hint_y=None, height=50)
        btn_volver.bind(on_release=lambda x: setattr(self.manager, 'current', 'menu'))
        self.layout.add_widget(btn_volver)
        self.add_widget(self.layout)

    def consultar_tecnico(self, instance):
        import sqlite3
        conn = sqlite3.connect('melant_ia.db')
        cursor = conn.cursor()
        cursor.execute("SELECT solucion FROM conocimiento_tecnico WHERE cultivo LIKE ? AND problema LIKE ?", 
                       ('%'+self.cultivo_input.text+'%', '%'+self.problema_input.text+'%'))
        res = cursor.fetchone()
        if res:
            self.resultado_label.text = f"RECOMENDACIÓN:\n{res[0]}"
        else:
            self.resultado_label.text = "No tengo esa información offline. Registraremos tu duda para cuando tengas señal."
        conn.close()

    def ejecutar_calculo(self, instance):
        try:
            # 1. Obtener datos de la interfaz
            nombre_cultivo = self.cultivo_input.text.strip().capitalize()
            hectareas = float(self.ha_input.text)
            # 2. Lógica de adaptación
            dosis = 0.0
            if self.dosis_input.text:
                # Si el usuario puso una dosis manual, usamos esa
                dosis = float(self.dosis_input.text)
            else:
                # Si no, buscamos en la base de datos según el cultivo
                import sqlite3
                conn = sqlite3.connect('melant_ia.db')
                cursor = conn.cursor()
                cursor.execute("SELECT dosis_sugerida_kg_ha FROM requerimientos_cultivos WHERE nombre_cultivo = ?", (nombre_cultivo,))
                res = cursor.fetchone()
                conn.close()
                if res:
                    dosis = res[0]
                    self.dosis_input.text = str(dosis) # Mostramos la dosis encontrada
                else:
                    self.resultado_calc.text = "Cultivo no encontrado. Ingresa la dosis manual."
                    return
            # 3. Cálculo Universal
            total_kg = hectareas * dosis
            sacos = total_kg / 50
            self.resultado_calc.text = f"Para {nombre_cultivo}: {total_kg}kg totales\n({round(sacos, 1)} sacos de 50kg)"
            from base_datos import guardar_registro_salud
            guardar_registro_salud('Tecnico', 'Calculo Fertilizante', f"{hectareas}ha a {dosis}kg/ha para {nombre_cultivo}")
        except ValueError:
            self.resultado_calc.text = "Por favor, ingresa números válidos."

    def guardar_lote_db(self, instance):
        nombre = self.nombre_lote_input.text.strip()
        try:
            area = float(self.area_lote_input.text)
            import sqlite3
            conn = sqlite3.connect('melant_ia.db')
            cursor = conn.cursor()
            cursor.execute("INSERT OR REPLACE INTO lotes (nombre_lote, area_ha) VALUES (?, ?)", (nombre, area))
            conn.commit()
            conn.close()
            self.resultado_calc.text = f"✅ Lote '{nombre}' guardado."
            # Limpiar campos
            self.nombre_lote_input.text = ""
            self.area_lote_input.text = ""
        except ValueError:
            self.resultado_calc.text = "Error: Pon un nombre y área válida."

    def cargar_lote_para_calculo(self, nombre_lote):
        """Busca el lote y llena automáticamente el campo de hectáreas."""
        import sqlite3
        conn = sqlite3.connect('melant_ia.db')
        cursor = conn.cursor()
        cursor.execute("SELECT area_ha FROM lotes WHERE nombre_lote = ?", (nombre_lote,))
        res = cursor.fetchone()
        conn.close()
        if res:
            self.ha_input.text = str(res[0])
            self.resultado_calc.text = f"Lote {nombre_lote} cargado: {res[0]} Ha"

# --- 3. PANTALLA DE AGRO DIGITAL ---
class PantallaAgroDigital(Screen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.build_menu()

    def build_menu(self):
        from base_datos import obtener_balance_total
        self.layout = BoxLayout(orientation='vertical', padding=15, spacing=10)
        self.layout.clear_widgets()
        self.layout.add_widget(Label(text="AGRICULTURA DIGITAL", font_size='22sp', bold=True, color=(0.2, 0.6, 1, 1)))
        grid = GridLayout(cols=1, spacing=10, size_hint_y=None)
        grid.bind(minimum_height=grid.setter('height'))
        # --- BOTONES DE HERRAMIENTAS ---
        btn_precision = Button(text="Agricultura de Precisión\n(Sensores y Datos)", size_hint_y=None, height=60)
        btn_precision.bind(on_release=self.abrir_precision)
        btn_gps = Button(text="GPS - Topografía\n(Medición de Terrenos)", size_hint_y=None, height=60)
        btn_gps.bind(on_release=self.abrir_gps)
        btn_walkie = Button(text="Walkie Talkie\n(Comunicación Local)", size_hint_y=None, height=60)
        btn_walkie.bind(on_release=self.abrir_walkie)
        btn_saberes = Button(text="👂 SABERES ANCESTRALES", size_hint_y=None, height=60, background_color=(0.5,0.3,0.1,1), bold=True)
        btn_saberes.bind(on_release=lambda x: setattr(self.manager, 'current', 'saberes_ancestrales'))
        btn_sostenibilidad = Button(text="🌱 SOSTENIBILIDAD Y PROYECTOS", size_hint_y=None, height=60)
        btn_sostenibilidad.bind(on_release=lambda x: setattr(self.manager, 'current', 'sostenibilidad_proyectos'))
        btn_sos = Button(text="🚨 ALERTA S.O.S", size_hint_y=None, height=60, background_color=(1,0,0,1), bold=True)
        btn_sos.bind(on_release=lambda x: self.manager.get_screen('walkie_talkie').enviar_mensaje_malla("¡EMERGENCIA! Necesito ayuda en mi posición."))
        grid.add_widget(btn_precision)
        grid.add_widget(btn_gps)
        grid.add_widget(btn_walkie)
        grid.add_widget(btn_saberes)
        grid.add_widget(btn_sostenibilidad)
        grid.add_widget(btn_sos)
        btn_balance = Button(text="Ver Balance Productivo", size_hint_y=None, height=60, background_color=(0.8, 0.7, 0.2, 1))
        btn_balance.bind(on_release=self.mostrar_balance)
        grid.add_widget(btn_balance)
        self.layout.add_widget(grid)
        self.resultado_label = Label(text="", font_size='16sp')
        self.layout.add_widget(self.resultado_label)
        self.balance_label = Label(text="", font_size='18sp', color=(0.2,0.5,0.2,1))
        self.layout.add_widget(self.balance_label)
        btn_volver = Button(text="Volver", size_hint_y=None, height=50, background_color=(0.7, 0.7, 0.7, 1))
        btn_volver.bind(on_release=lambda x: setattr(self.manager, 'current', 'menu'))
        self.layout.add_widget(btn_volver)
        self.clear_widgets()
        self.add_widget(self.layout)

    def abrir_walkie(self, instance):
        self.manager.current = 'walkie_talkie'

    def mostrar_balance(self, instance):
        from base_datos import obtener_balance_total
        total = obtener_balance_total()
        self.balance_label.text = f"Balance productivo acumulado: ${total:.2f}"

    def reset_screen(self):
        self.clear_widgets()
        self.build_menu()

    def abrir_precision(self, instance):
        self.clear_widgets()
        layout = BoxLayout(orientation='vertical', padding=15, spacing=10)
        layout.add_widget(Label(text="MAPEO DE PRECISIÓN", font_size='22sp', bold=True))
        info = (
            "Análisis de Suelo (Lote 1):\n"
            "- Fósforo: Óptimo\n"
            "- Nitrógeno: Bajo (Requiere refuerzo)\n"
            "- Humedad: 65% (Ideal para siembra)"
        )
        layout.add_widget(Label(text=info, halign="center"))
        btn_volver = Button(text="Volver", size_hint_y=None, height=60)
        btn_volver.bind(on_release=lambda x: self.reset_screen())
        layout.add_widget(btn_volver)
        self.add_widget(layout)

    def abrir_gps(self, instance):
        self.manager.current = 'gps_tool'

# --- 3. HERRAMIENTA GPS ---
from data.produccion.gps.gps_utils import obtener_coordenadas_gps
from kivy.utils import platform
from kivy.clock import Clock
try:
    from plyer import gps
except ImportError:
    gps = None

class HerramientaGPS(Screen):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.puntos_capturados = []
        self.ultima_posicion = None
        self.layout = BoxLayout(orientation='vertical', padding=20, spacing=10)
        self.label_info = Label(text="Buscando satélites... por favor, quédese quieto en la primera esquina", halign="center")
        self.layout.add_widget(self.label_info)
        btn_punto = Button(text="📍 MARCAR ESQUINA", size_hint_y=None, height=100, background_color=(0.1, 0.5, 0.8, 1))
        btn_punto.bind(on_release=self.capturar_punto)
        self.layout.add_widget(btn_punto)
        self.lbl_puntos = Label(text="Puntos marcados: 0")
        self.layout.add_widget(self.lbl_puntos)
        btn_finalizar = Button(text="CALCULAR ÁREA TOTAL", size_hint_y=None, height=70, background_color=(0.1, 0.8, 0.1, 1))
        btn_finalizar.bind(on_release=self.finalizar_medicion)
        self.layout.add_widget(btn_finalizar)
        btn_volver = Button(text="Volver", size_hint_y=None, height=50)
        btn_volver.bind(on_release=lambda x: setattr(self.manager, 'current', 'agro_digital'))
        self.layout.add_widget(btn_volver)
        self.add_widget(self.layout)

        # Inicializar GPS si es Android
        if platform == 'android' and gps:
            try:
                gps.configure(on_location=self.on_gps_location, on_status=self.on_gps_status)
                gps.start(minTime=1000, minDistance=1)
            except Exception as e:
                self.label_info.text = f"Error al iniciar GPS: {e}"
        else:
            # En PC, simular posición periódicamente
            Clock.schedule_interval(self.simular_gps_pc, 2)

    def on_gps_location(self, **kwargs):
        lat = kwargs.get('lat')
        lon = kwargs.get('lon')
        if lat and lon:
            self.ultima_posicion = (lat, lon)
            self.label_info.text = f"GPS listo. Posición actual:\nLat: {lat}, Lon: {lon}"

    def on_gps_status(self, stype, status):
        if stype == 'provider-enabled':
            self.label_info.text = "GPS activado."
        elif stype == 'provider-disabled':
            self.label_info.text = "GPS desactivado. Actívalo para continuar."

    def simular_gps_pc(self, dt):
        # Solo para pruebas en PC
        self.ultima_posicion = obtener_coordenadas_gps()
        if self.ultima_posicion:
            lat, lon = self.ultima_posicion
            self.label_info.text = f"Simulación GPS:\nLat: {lat}, Lon: {lon}"

    def capturar_punto(self, instance):
        pos = self.ultima_posicion or obtener_coordenadas_gps()
        if pos:
            self.puntos_capturados.append(pos)
            self.lbl_puntos.text = f"Puntos marcados: {len(self.puntos_capturados)}"
        else:
            self.label_info.text = "Esperando señal GPS..."

    def finalizar_medicion(self, instance):
        if len(self.puntos_capturados) >= 3:
            area_ha = calcular_area_poligono(self.puntos_capturados)
            self.label_info.text = f"¡MEDICIÓN COMPLETADA!\nÁrea: {area_ha} Hectáreas"
            # Guardar puntos y área en la base de datos
            import sqlite3
            conn = sqlite3.connect('melant_ia.db')
            cursor = conn.cursor()
            for lat, lon in self.puntos_capturados:
                cursor.execute("INSERT INTO puntos_gps (lote_id, latitud, longitud) VALUES (?, ?, ?)", (None, lat, lon))
            conn.commit()
            conn.close()
            from base_datos import guardar_registro_salud
            guardar_registro_salud('AgroDigital', 'GPS-Topografia', f"{len(self.puntos_capturados)} puntos, área {area_ha} Ha")
        else:
            self.label_info.text = "Error: Necesitas marcar al menos 3 esquinas."

# --- 3. APP MAESTRA ---

class MelantApp(App):
    idioma_usuario = 'es'
    def build(self):
        # Si existe, importar la función de permisos Android
        try:
            from scripts.utilidades.android_utils import solicitar_permisos_android
            solicitar_permisos_android()
        except ImportError:
            pass
        config_path = os.path.join(DOCUMENTOS_DIR, 'config.json')
        with open(config_path, 'r', encoding='utf-8') as f:
            self.data = json.load(f)
        from base_datos import inicializar_bd
        inicializar_bd()  # Asegura que la DB esté lista
        sm = ScreenManager()
        sm.add_widget(PantallaSeleccionIdioma(name='seleccion_idioma'))
        sm.add_widget(MenuPrincipal(self.data, name='menu'))
        sm.add_widget(PantallaDetalle(name='detalle'))
        sm.add_widget(PantallaAsistente(name='asistente'))
        sm.add_widget(PantallaAgroDigital(name='agro_digital'))
        sm.add_widget(HerramientaGPS(name='gps_tool'))
        sm.add_widget(PantallaWalkieTalkie(name='walkie_talkie'))
        try:
            from scripts.sostenibilidad.sostenibilidad_proyectos import PantallaSostenibilidadProyectos
            sm.add_widget(PantallaSostenibilidadProyectos(name='sostenibilidad_proyectos'))
        except ImportError:
            pass
        sm.add_widget(PantallaSaberesAncestrales(name='saberes_ancestrales', idioma_usuario=self.idioma_usuario))
        sm.current = 'seleccion_idioma'
        return sm

if __name__ == '__main__':
    MelantApp().run()
