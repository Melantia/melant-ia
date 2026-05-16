"""
Proyecto de Saberes y Folclore Ecuatoriano
Módulo centralizado para mostrar, escuchar y compartir historias, mitos, leyendas, recetas y refranes de Costa, Sierra y Amazonía.
Soporta selección aleatoria diaria, búsqueda por región, idioma y comando natural.
"""
import json
import random
import datetime
import qrcode
from PIL import Image, ImageDraw, ImageFont

IDIOMAS = ['es', 'qu', 'sh', 'ts']
COLECCIONES = {
    'costa': 'conocimiento/saberes_manabitas',
    'sierra': 'conocimiento/cuentos_sierra',
    'oriente': 'conocimiento/cuentos_amazonia'
}
QR_APP_URL = "https://melant-ia.app/descarga"
MARCA_AGUA = "MELANT IA"


def cargar_historias(region, idioma):
    archivo = f"{COLECCIONES[region]}_{idioma}.json"
    try:
        with open(archivo, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        # Fallback a español si no hay traducción
        with open(f"{COLECCIONES[region]}_es.json", "r", encoding="utf-8") as f:
            return json.load(f)


def historia_aleatoria(region, idioma):
    historias = cargar_historias(region, idioma)
    random.seed(datetime.date.today().toordinal() + hash(region))
    return random.choice(historias)


def buscar_historia(region, idioma, palabra_clave):
    historias = cargar_historias(region, idioma)
    for h in historias:
        if palabra_clave.lower() in h['texto'].lower():
            return h
    return None


def generar_imagen_historia(historia, nombre_archivo):
    img = Image.new('RGB', (600, 400), color=(255, 255, 240))
    d = ImageDraw.Draw(img)
    font = ImageFont.load_default()
    d.text((20, 40), historia['texto'], fill=(0, 0, 0), font=font)
    d.text((20, 370), MARCA_AGUA, fill=(100, 100, 100), font=font)
    qr = qrcode.make(QR_APP_URL)
    qr = qr.resize((80, 80))
    img.paste(qr, (500, 300))
    img.save(nombre_archivo)
    return nombre_archivo


def escuchar_historia(historia):
    # Integrar text-to-speech aquí
    print(f"[VOZ] {historia['texto']}")


def procesar_comando(comando, idioma):
    comando = comando.lower()
    if "oriente" in comando or "amazonía" in comando:
        region = "oriente"
    elif "sierra" in comando:
        region = "sierra"
    elif "costa" in comando or "manabita" in comando:
        region = "costa"
    else:
        region = random.choice(list(COLECCIONES.keys()))
    # Buscar historia específica
    palabras = comando.split()
    for palabra in palabras:
        h = buscar_historia(region, idioma, palabra)
        if h:
            return h, region
    # Si no, aleatoria
    return historia_aleatoria(region, idioma), region


if __name__ == "__main__":
    # Ejemplo de uso
    idioma = 'es'  # Detectar idioma real del usuario
    comando = input("¿Qué historia quieres escuchar hoy?: ")
    historia, region = procesar_comando(comando, idioma)
    print(f"[{region.upper()}] {historia['texto']}")
    img = generar_imagen_historia(historia, f"historia_{region}.png")
    escuchar_historia(historia)
    print(f"Imagen lista para compartir: {img}")
