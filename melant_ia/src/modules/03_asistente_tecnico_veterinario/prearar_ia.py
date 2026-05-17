import os
import cv2
import numpy as np

# --- CONFIGURACIÓN ---
CARPETA_CRUDAS = "Descargas_crudas"
CARPETA_DESTINO = "Dataset_Optimizado"
TAMANO_IMG = 400
CALIDAD = 70

if not os.path.exists(CARPETA_DESTINO):
    os.makedirs(CARPETA_DESTINO)

# Diccionario de rutas
categorias = {
    "Aftosa_FMD": ["FMD_only/0", "FMD_only/1"],
    "OjoRosado_IBK": ["IBK_only/IBK", "IBK_only/No_IBK"],
    "Dermatosis_LSD": ["LSD_only/Lumpy", "LSD_only/No_Lumpy"]
}

total = 0
print("🚀 Iniciando optimización de Melant_ia...")

for nombre_cat, subcarpetas in categorias.items():
    ruta_cat = os.path.join(CARPETA_DESTINO, nombre_cat)
    if not os.path.exists(ruta_cat):
        os.makedirs(ruta_cat)
    
    for sub in subcarpetas:
        ruta_full = os.path.join(CARPETA_CRUDAS, sub)
        if os.path.exists(ruta_full):
            for archivo in os.listdir(ruta_full):
                if archivo.lower().endswith(('.jpg', '.jpeg', '.png')):
                    try:
                        img_path = os.path.join(ruta_full, archivo)
                        img = cv2.imread(img_path)
                        if img is not None:
                            img_res = cv2.resize(img, (TAMANO_IMG, TAMANO_IMG))
                            dest_path = os.path.join(ruta_cat, f"sanidad_{total}.jpg")
                            cv2.imwrite(dest_path, img_res, [cv2.IMWRITE_JPEG_QUALITY, CALIDAD])
                            total += 1
                            if total % 100 == 0:
                                print(f"✅ {total} fotos optimizadas...")
                    except:
                        continue

print(f"\n¡LISTO! 🏆 Procesadas {total} imágenes de sanidad animal.")