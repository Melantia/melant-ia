# client_app.py
import os
import json
import requests
from PIL import Image
import io
from dotenv import load_dotenv
import datetime

# Cargar configuración
load_dotenv()
SERVER_URL = "http://localhost:8000"
API_KEY = os.getenv("API_KEY")
OFFLINE_QUEUE_FILE = "offline_queue.json"

# Configuración de Compresión
MAX_WIDTH = 800
JPEG_QUALITY = 60  # 0-100

def compress_image(image_path):
    """
    Comprime la imagen usando Pillow para ahorrar datos.
    Devuelve los bytes comprimidos.
    """
    try:
        img = Image.open(image_path)
        
        # Calcular nuevas dimensiones manteniendo aspect ratio
        if img.width > MAX_WIDTH:
            ratio = MAX_WIDTH / img.width
            new_height = int(img.height * ratio)
            img = img.resize((MAX_WIDTH, new_height), Image.Resampling.LANCZOS)
            
        # Convertir a RGB si está en RGBA (PNG a JPG)
        if img.mode == "RGBA":
            img = img.convert("RGB")
            
        # Guardar en memoria buffer
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='JPEG', quality=JPEG_QUALITY)
        img_byte_arr.seek(0)
        
        original_size = os.path.getsize(image_path) / 1024
        compressed_size = len(img_byte_arr.getvalue()) / 1024
        
        print(f"✅ Imagen comprimida: {original_size:.1f}KB -> {compressed_size:.1f}KB")
        return img_byte_arr
    except Exception as e:
        print(f"❌ Error comprimiendo imagen: {e}")
        return None

def save_offline(crop_type, status, image_path):
    """Guarda el reporte localmente si no hay internet."""
    try:
        queue = []
        if os.path.exists(OFFLINE_QUEUE_FILE):
            with open(OFFLINE_QUEUE_FILE, 'r') as f:
                queue = json.load(f)
        
        queue.append({
            "timestamp": str(datetime.datetime.now()),
            "crop_type": crop_type,
            "status": status,
            "image_path": image_path
        })
        
        with open(OFFLINE_QUEUE_FILE, 'w') as f:
            json.dump(queue, f)
        print("💾 [OFFLINE] Reporte guardado localmente. Se enviará cuando haya conexión.")
    except Exception as e:
        print(f"❌ Error guardando offline: {e}")

def send_report(crop_type, status, image_path):
    """Envía el reporte al servidor FastAPI."""
    img_buffer = compress_image(image_path)
    if not img_buffer:
        print("No se pudo procesar la imagen.")
        return

    url = f"{SERVER_URL}/api/v1/reports"
    
    # Preparar multipart/form-data
    files = {
        'image': ('report.jpg', img_buffer, 'image/jpeg')
    }
    data = {
        'crop_type': crop_type,
        'status': status
    }
    headers = {
        'X-API-KEY': API_KEY
    }

    try:
        print(f"📡 Enviando a {url}...")
        response = requests.post(url, files=files, data=data, headers=headers, timeout=5)
        
        if response.status_code == 200:
            print("✅ [ÉXITO] Reporte recibido por el servidor.")
            print("Servidor:", response.json())
        else:
            print(f"❌ Error Servidor: {response.status_code} - {response.text}")
            # Fallback a offline si el error es 500 o de conexión
            save_offline(crop_type, status, image_path)
            
    except requests.exceptions.ConnectionError:
        print("❌ [SIN CONEXIÓN] No se pudo contactar al servidor.")
        save_offline(crop_type, status, image_path)
    except Exception as e:
        print(f"❌ Error inesperado: {e}")

def generate_dummy_image(filename="dummy_crop.jpg"):
    """Crea una imagen de prueba para que el código funcione sin tener una real."""
    img = Image.new('RGB', (60, 30), color = (73, 109, 137))
    img.save(filename)
    return filename

if __name__ == "__main__":
    print("--- APP AGRICOLA CLIENTE (PYTHON) ---")
    
    # Simulación de datos del agricultor
    cultivo = "Maíz"
    estado = "Plagas"
    
    # Crear imagen dummy si no existe una
    test_image = "crop_photo.jpg"
    if not os.path.exists(test_image):
        print("Creando imagen de prueba...")
        test_image = generate_dummy_image(test_image)
    
    print(f"Reportando: Cultivo={cultivo}, Estado={estado}, Foto={test_image}")
    
    # Intentar enviar
    send_report(cultivo, estado, test_image)