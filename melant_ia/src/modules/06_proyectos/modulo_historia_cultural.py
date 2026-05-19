"""
Módulo genérico para mostrar, escuchar y compartir historias/cuentos/recetas en MELANT IA.
Escalable para múltiples colecciones culturales (Manabita, Sierra, Amazonía, etc.).
"""
import json
import random
import datetime
import qrcode
from PIL import Image, ImageDraw, ImageFont

QR_APP_URL = "https://melant-ia.app/descarga"  # Cambia por la URL real
MARCA_AGUA = "MELANT IA"


def seleccionar_historia_del_dia(archivo_json):
    with open(archivo_json, "r", encoding="utf-8") as f:
        historias = json.load(f)
    random.seed(datetime.date.today().toordinal() + hash(archivo_json))
    return random.choice(historias)


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


def compartir_historia(nombre_archivo):
    # Mostrar QR o compartir imagen por Bluetooth, redes, etc.
    print(f"Comparte la imagen: {nombre_archivo}")


if __name__ == "__main__":
    # Ejemplo de uso para cuentos de la Sierra
    archivo = "conocimiento/cuentos_sierra.json"
    historia = seleccionar_historia_del_dia(archivo)
    print(f"Historia del día: {historia['texto']}")
    img = generar_imagen_historia(historia, "historia_sierra.png")
    escuchar_historia(historia)
    compartir_historia(img)
