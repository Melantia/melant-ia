"""
Módulo para mostrar, compartir y escuchar la sabiduría/dicho/historia del día en MELANT IA.
Incluye marca de agua y QR para descarga de la app.
"""
import json
import random
import datetime
import qrcode
from PIL import Image, ImageDraw, ImageFont

SABERES_PATH = "conocimiento/saberes_manabitas.json"
QR_APP_URL = "https://melant-ia.app/descarga"  # Cambia por la URL real de descarga
MARCA_AGUA = "MELANT IA"


def seleccionar_sabiduria_del_dia():
    with open(SABERES_PATH, "r", encoding="utf-8") as f:
        saberes = json.load(f)
    # Selección aleatoria diaria (cambia cada día)
    random.seed(datetime.date.today().toordinal())
    return random.choice(saberes)


def generar_imagen_compartible(sabiduria):
    # Crear imagen base
    img = Image.new('RGB', (600, 400), color=(255, 255, 240))
    d = ImageDraw.Draw(img)
    font = ImageFont.load_default()
    # Texto principal
    d.text((20, 40), sabiduria['texto'], fill=(0, 0, 0), font=font)
    # Marca de agua
    d.text((20, 370), MARCA_AGUA, fill=(100, 100, 100), font=font)
    # QR para descargar la app
    qr = qrcode.make(QR_APP_URL)
    qr = qr.resize((80, 80))
    img.paste(qr, (500, 300))
    # Guardar imagen
    nombre = f"sabiduria_{datetime.date.today()}.png"
    img.save(nombre)
    return nombre


def escuchar_sabiduria(sabiduria):
    # Aquí se integraría text-to-speech (ejemplo con pyttsx3 o similar)
    print(f"[VOZ] {sabiduria['texto']}")


if __name__ == "__main__":
    sabiduria = seleccionar_sabiduria_del_dia()
    print(f"Sabiduría del día: {sabiduria['texto']}")
    img = generar_imagen_compartible(sabiduria)
    print(f"Imagen lista para compartir: {img}")
    escuchar_sabiduria(sabiduria)
