import os
import json

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

def cargar_imagenes(rutas):
    imagenes = {}
    for ruta in rutas:
        imagenes[ruta] = []
        for root, _, files in os.walk(ruta):
            for file in files:
                if file.lower().endswith((".jpg", ".jpeg", ".png")):
                    imagenes[ruta].append(os.path.join(root, file))
    return imagenes

def cargar_markdown(rutas):
    docs = {}
    for ruta in rutas:
        if os.path.isfile(ruta) and ruta.endswith('.md'):
            with open(ruta, encoding='utf-8') as f:
                docs[os.path.basename(ruta)] = f.read()
    return docs

def cargar_conocimiento():
    rutas_json = [
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_medicina_veterinaria/Como Mejorar la Produccion de Leche de mi Ganado Caprino.json",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_medicina_veterinaria/ganaderia_biotecnologica_es.json",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_medicina_veterinaria/nutricion_estrategica.json",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_medicina_veterinaria/protocolo_recoleccion_biomaterial.json",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_medicina_veterinaria/protocolo_recoleccion_placenta.json",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_medicina_veterinaria/quiz_medicina_regenerativa.json",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_medicina_veterinaria/sanidad_y_control_parasitos.json",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_medicina_veterinaria/videos_microcursos.json",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_medicina_veterinaria/algoritmo_triaje_ia.json",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_medicina_veterinaria/asistente_veterinario.json",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_medicina_veterinaria/asistente_veterinario_ampliado.json",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_medicina_veterinaria/avicultura.json",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_medicina_veterinaria/base_conocimiento_veterinaria.json",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_medicina_veterinaria/calculadora_dosis.json",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_medicina_veterinaria/caprinos.json",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_medicina_veterinaria/Como Mejorar la Alimentacion y Nutricion de mi Ganado Caprino.json"
    ]
    rutas_imagenes = [
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_medicina_veterinaria/Dataset_Optimizado",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_medicina_veterinaria/aves",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_medicina_veterinaria/cabras",
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_medicina_veterinaria/cuyes"
    ]
    rutas_md = [
        "knowledge_seeds/02_asistente_tecnico_rural/asistente_medicina_veterinaria/manual_hato_protegido_hongos_aliados.md"
    ]
    conocimiento = {
        "json": cargar_json(rutas_json),
        "imagenes": cargar_imagenes(rutas_imagenes),
        "markdown": cargar_markdown(rutas_md)
    }
    return conocimiento

if __name__ == "__main__":
    conocimiento = cargar_conocimiento()
    print("Conocimiento medicina veterinaria cargado:")
    print(list(conocimiento.keys()))
