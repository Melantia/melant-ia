from PIL import Image, ImageDraw, ImageFont
import os
import datetime

CARPETA_BASE_DATOS = "dashboard_central/fotos_validadas"
LOGO_PATH = "assets/logo_melant_ia.png"  # Ajusta la ruta si tienes el logo
if not os.path.exists(CARPETA_BASE_DATOS):
    os.makedirs(CARPETA_BASE_DATOS)

def procesar_y_enviar_foto(ruta_original, paso, coordenadas, marca_agua=True):
    """
    Reduce el tamaño de la foto, añade metadatos y la guarda en la BD.
    Si marca_agua=True, añade logo y coordenadas como marca de agua.
    """
    try:
        with Image.open(ruta_original) as img:
            # 1. Reducir tamaño (Manteniendo proporción para ahorrar datos)
            img.thumbnail((800, 800))
            draw = ImageDraw.Draw(img)
            # 2. Añadir marca de agua (logo y coordenadas)
            if marca_agua:
                # Coordenadas como texto
                texto = f"GPS: {coordenadas}"
                font_size = 22
                try:
                    font = ImageFont.truetype("arial.ttf", font_size)
                except:
                    font = ImageFont.load_default()
                draw.text((10, img.height - 30), texto, (255, 255, 255), font=font)
                # Logo (opcional)
                if os.path.exists(LOGO_PATH):
                    try:
                        logo = Image.open(LOGO_PATH).convert("RGBA")
                        logo.thumbnail((80, 80))
                        img.paste(logo, (img.width - 90, img.height - 90), logo)
                    except Exception as e:
                        print(f"[INFO] No se pudo añadir logo: {e}")
            # 3. Generar nombre único para la Base de Información
            fecha = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            nombre_final = f"ID_PROD_{fecha}_{paso}.jpg"
            ruta_destino = os.path.join(CARPETA_BASE_DATOS, nombre_final)
            # 4. Guardar con compresión (Calidad 70% es ideal para reportes técnicos)
            img.save(ruta_destino, "JPEG", quality=70, optimize=True)
            # 5. Simulación de envío a la base de información central
            print(f"🚀 Foto '{paso}' reducida y marcada con éxito ({nombre_final})")
            print(f"📦 Enviada a: {CARPETA_BASE_DATOS}")
            print(f"📍 Marcador GPS vinculado: {coordenadas}")
            return ruta_destino
    except Exception as e:
        print(f"❌ Error al procesar la imagen: {e}")
        return None
# Ejemplo de uso:
# procesar_y_enviar_foto("foto_campo.jpg", "Inicio", "-0.2694, -79.4632")
