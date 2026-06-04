import os
import json
import glob

try:
    import markdown
except ImportError:
    markdown = None  # Si no está instalado, solo se leerá como texto

def cargar_json(rutas):
    datos = {}
    for ruta in rutas:
        if os.path.isfile(ruta) and ruta.endswith('.json'):
            with open(ruta, encoding='utf-8') as f:
                try:
                    datos[os.path.basename(ruta)] = json.load(f)
                except Exception as e:
                    datos[os.path.basename(ruta)] = f"Error: {e}"
    return datos

def cargar_markdown(rutas):
    docs = {}
    for ruta in rutas:
        if os.path.isfile(ruta) and ruta.endswith('.md'):
            with open(ruta, encoding='utf-8') as f:
                texto = f.read()
                if markdown:
                    docs[os.path.basename(ruta)] = markdown.markdown(texto)
                else:
                    docs[os.path.basename(ruta)] = texto
    return docs

def cargar_txt(rutas):
    docs = {}
    for ruta in rutas:
        if os.path.isfile(ruta) and ruta.endswith('.txt'):
            with open(ruta, encoding='utf-8') as f:
                docs[os.path.basename(ruta)] = f.read()
    return docs

def cargar_py(rutas):
    scripts = {}
    for ruta in rutas:
        if os.path.isfile(ruta) and ruta.endswith('.py'):
            with open(ruta, encoding='utf-8') as f:
                scripts[os.path.basename(ruta)] = f.read()
    return scripts

def cargar_sql(rutas):
    scripts = {}
    for ruta in rutas:
        if os.path.isfile(ruta) and ruta.endswith('.sql'):
            with open(ruta, encoding='utf-8') as f:
                scripts[os.path.basename(ruta)] = f.read()
    return scripts

def cargar_js(rutas):
    scripts = {}
    for ruta in rutas:
        if os.path.isfile(ruta) and ruta.endswith('.js'):
            with open(ruta, encoding='utf-8') as f:
                scripts[os.path.basename(ruta)] = f.read()
    return scripts

def cargar_conocimiento():
    rutas_md = [
        "knowledge_seeds/02_asistente_tecnico_rural/Curso_TRANSICION_AGRICULTURA_REGENERATIVA.md",
        "knowledge_seeds/02_asistente_tecnico_rural/Curso_TRANSICION_MAIZ_DURO_REGENERATIVO.md",
        "knowledge_seeds/02_asistente_tecnico_rural/ENMIENDAS_ORGANICAS_CELULOSICAS_Y_COBERTURAS_RECICLADAS.md",
        "knowledge_seeds/02_asistente_tecnico_rural/guia_usuario_vision_artificial.md",
        "knowledge_seeds/02_asistente_tecnico_rural/indice_ingestion.md",
        "knowledge_seeds/02_asistente_tecnico_rural/LA_LOMBRICULTURA_Y_SUS_BENEFICIOS_EN_LA_NUTRICION_DE_LOS_SUELOS.md",
        "knowledge_seeds/02_asistente_tecnico_rural/LA_TRAZABILIDAD_DEL_CACAO.md",
        "knowledge_seeds/02_asistente_tecnico_rural/LA_TRAZABILIDAD_DEL_CAFE.md",
        "knowledge_seeds/02_asistente_tecnico_rural/LOS_AGROQUIMICOS_Y_SU_AFECTACION_A_LA_SALUD.md",
        "knowledge_seeds/02_asistente_tecnico_rural/manual_microorganismos_montana.md",
        "knowledge_seeds/02_asistente_tecnico_rural/memoria_productor.md",
        "knowledge_seeds/02_asistente_tecnico_rural/NUTRICION_FOLIAR_PRECISION_Y_MICROBIOLOGIA_SUELOS.md",
        "knowledge_seeds/02_asistente_tecnico_rural/reglas_decision.md"
    ]
    rutas_json = [
        "knowledge_seeds/02_asistente_tecnico_rural/agenda_agricola_platano_alertas_personalizadas.json",
        "knowledge_seeds/02_asistente_tecnico_rural/agronegocios.json",
        "knowledge_seeds/02_asistente_tecnico_rural/alerta_climatica_papa.json",
        "knowledge_seeds/02_asistente_tecnico_rural/alertas_climaticas_multicultivo.json",
        "knowledge_seeds/02_asistente_tecnico_rural/ancla_geografica_ejemplo.json",
        "knowledge_seeds/02_asistente_tecnico_rural/base_fitosanitaria_limon_sutil.json",
        "knowledge_seeds/02_asistente_tecnico_rural/bibliografia_palmas_cacao.json",
        "knowledge_seeds/02_asistente_tecnico_rural/calculadora_fertilidad_ec.json",
        "knowledge_seeds/02_asistente_tecnico_rural/calculadora_proporciones.json",
        "knowledge_seeds/02_asistente_tecnico_rural/calendario_inteligente.json",
        "knowledge_seeds/02_asistente_tecnico_rural/calendario_siembras.json",
        "knowledge_seeds/02_asistente_tecnico_rural/catalogo_hardware_agricola.json",
        "knowledge_seeds/02_asistente_tecnico_rural/config_clima.json",
        "knowledge_seeds/02_asistente_tecnico_rural/conocimiento_agro.json",
        "knowledge_seeds/02_asistente_tecnico_rural/costos_arroz.json",
        "knowledge_seeds/02_asistente_tecnico_rural/cultivos_achocha.json",
        "knowledge_seeds/02_asistente_tecnico_rural/cultivos_agricultura_regenerativa.json",
        "knowledge_seeds/02_asistente_tecnico_rural/cultivos_aguacates.json",
        "knowledge_seeds/02_asistente_tecnico_rural/cultivos_ajo.json",
        "knowledge_seeds/02_asistente_tecnico_rural/cultivos_amaranto.json"
        # ...agrega aquí el resto de rutas JSON que necesites...
    ]
    rutas_txt = [
        "knowledge_seeds/02_asistente_tecnico_rural/manual_aprovechamiento_limon_sutil.txt",
        "knowledge_seeds/02_asistente_tecnico_rural/manual_manejo_plagas_enfermedades_arandano.txt"
        # ...agrega aquí el resto de rutas TXT que necesites...
    ]
    rutas_py = [
        "knowledge_seeds/02_asistente_tecnico_rural/config_rutas.py",
        "knowledge_seeds/02_asistente_tecnico_rural/tareas_diarias_fusarium.py"
    ]
    rutas_sql = [
        "knowledge_seeds/02_asistente_tecnico_rural/esquema_agro_interoperable.sql",
        "knowledge_seeds/02_asistente_tecnico_rural/esquema_fitosanitario.sql",
        "knowledge_seeds/02_asistente_tecnico_rural/tablas_control_palmas.sql"
    ]
    rutas_js = [
        "knowledge_seeds/02_asistente_tecnico_rural/calendario_lunar.js",
        "knowledge_seeds/02_asistente_tecnico_rural/levantamiento_lote.js",
        "knowledge_seeds/02_asistente_tecnico_rural/asistencia.js",
        "knowledge_seeds/02_asistente_tecnico_rural/asistencia_tecnica_rural.js",
        "knowledge_seeds/02_asistente_tecnico_rural/calculadora_agricola.js"
    ]
    conocimiento = {
        "markdown": cargar_markdown(rutas_md),
        "json": cargar_json(rutas_json),
        "txt": cargar_txt(rutas_txt),
        "python": cargar_py(rutas_py),
        "sql": cargar_sql(rutas_sql),
        "js": cargar_js(rutas_js)
    }
    return conocimiento

if __name__ == "__main__":
    conocimiento = cargar_conocimiento()
    print("Conocimiento cargado:")
    print(list(conocimiento.keys()))
