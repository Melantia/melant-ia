#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SCRIPT OPTIMIZACIÓN IMÁGENES CACAO - Pre-entrenamiento ML
=========================================================================
Propósito: Preparar dataset imágenes para entrenamiento YOLOv8
Funciones:
  1. Redimensionar a tamaño consistente (320×320)
  2. Comprimir JPEG/WebP (reducir de 5-10 MB a 100-300 KB)
  3. Normalizar iluminación (contrast stretching)
  4. Aumentación datos (rotación, zoom, brillo)
  5. Crear estructura YOLO-compatible
  6. Validar calidad post-procesamiento

Uso:
  python optimizar_imagenes_cacao.py --input /ruta/input --output /ruta/output --clase podredumbre_negra
"""

import os
import sys
import argparse
import cv2
import numpy as np
from pathlib import Path
from PIL import Image, ImageEnhance
import json
from datetime import datetime
import shutil

# ========================================================================
# CONFIGURACIÓN GLOBAL
# ========================================================================

CONFIG = {
    'resolucion_salida': 320,  # 320×320 para YOLOv8
    'calidad_jpeg': 85,  # 0-100 (85 = balance calidad/tamaño)
    'calidad_webp': 80,  # WebP más eficiente (20-30% menor)
    'formato_salida': 'jpg',  # 'jpg' o 'webp'
    'extensiones_validas': ['.jpg', '.jpeg', '.png', '.bmp', '.tiff'],
    'tamaño_maximo_original_mb': 20,
    'augmentacion_enabled': True,
    'num_aumentaciones_por_imagen': 2,  # Generar 2 variaciones por imagen
}

# ========================================================================
# FUNCIÓN 1: VALIDAR IMÁGENES
# ========================================================================

def validar_imagen(ruta_imagen):
    """Validar que imagen es readable y tiene tamaño aceptable"""
    try:
        if not os.path.exists(ruta_imagen):
            return False, f"❌ No existe: {ruta_imagen}"
        
        tamaño_mb = os.path.getsize(ruta_imagen) / (1024 * 1024)
        if tamaño_mb > CONFIG['tamaño_maximo_original_mb']:
            return False, f"⚠️ Muy grande: {tamaño_mb:.1f} MB (max {CONFIG['tamaño_maximo_original_mb']} MB)"
        
        # Intentar leer con OpenCV
        img = cv2.imread(ruta_imagen)
        if img is None:
            return False, "❌ No se puede leer (formato corrupto?)"
        
        altura, ancho = img.shape[:2]
        if altura < 100 or ancho < 100:
            return False, f"❌ Muy pequeña: {ancho}×{altura} (mín 100×100)"
        
        return True, f"✅ Válida: {ancho}×{altura} ({tamaño_mb:.1f} MB)"
    
    except Exception as e:
        return False, f"❌ Error: {str(e)}"

# ========================================================================
# FUNCIÓN 2: REDIMENSIONAR IMAGEN
# ========================================================================

def redimensionar_imagen(img, tamaño_salida=320):
    """
    Redimensionar imagen manteniendo aspect ratio
    Rellena con fondo blanco si no es cuadrado
    """
    altura, ancho = img.shape[:2]
    escala = tamaño_salida / max(altura, ancho)
    
    # Calcular nuevas dimensiones
    nuevo_ancho = int(ancho * escala)
    nueva_altura = int(altura * escala)
    
    # Redimensionar
    img_redimensionada = cv2.resize(img, (nuevo_ancho, nueva_altura), interpolation=cv2.INTER_LANCZOS4)
    
    # Crear canvas blanco
    canvas = np.ones((tamaño_salida, tamaño_salida, 3), dtype=np.uint8) * 255
    
    # Centrar imagen en canvas
    offset_y = (tamaño_salida - nueva_altura) // 2
    offset_x = (tamaño_salida - nuevo_ancho) // 2
    
    canvas[offset_y:offset_y+nueva_altura, offset_x:offset_x+nuevo_ancho] = img_redimensionada
    
    return canvas

# ========================================================================
# FUNCIÓN 3: NORMALIZAR ILUMINACIÓN
# ========================================================================

def normalizar_iluminacion(img):
    """
    Mejorar contraste y brillo para uniformidad
    Usar CLAHE (Contrast Limited Adaptive Histogram Equalization)
    """
    # Convertir BGR a HSV
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    
    # Aplicar CLAHE al canal V (Value = luminancia)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    hsv[:, :, 2] = clahe.apply(hsv[:, :, 2])
    
    # Convertir de vuelta a BGR
    img_normalizada = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
    
    return img_normalizada

# ========================================================================
# FUNCIÓN 4: COMPRIMIR IMAGEN
# ========================================================================

def comprimir_imagen(img_array, nombre_archivo, calidad=85, formato='jpg'):
    """
    Comprimir imagen a JPEG o WebP
    Retorna tamaño antes/después
    """
    if formato.lower() == 'jpg':
        encode_param = [cv2.IMWRITE_JPEG_QUALITY, calidad]
        resultado, img_encoded = cv2.imencode('.jpg', img_array, encode_param)
    else:  # WebP
        encode_param = [cv2.IMWRITE_WEBP_QUALITY, calidad]
        resultado, img_encoded = cv2.imencode('.webp', img_array, encode_param)
    
    if not resultado:
        return None, None, None
    
    tamaño_bytes = len(img_encoded)
    tamaño_kb = tamaño_bytes / 1024
    
    return img_encoded, tamaño_kb, resultado

# ========================================================================
# FUNCIÓN 5: AUGMENTACIÓN DE DATOS
# ========================================================================

def augmentar_imagen(img, num_aumentaciones=2):
    """
    Generar variaciones de imagen (rotación, zoom, brillo)
    para aumentar dataset
    """
    aumentaciones = [img]  # Incluir original
    
    for i in range(num_aumentaciones):
        img_aug = img.copy()
        
        # ROTACIÓN aleatoria ±15 grados
        angulo = np.random.randint(-15, 15)
        h, w = img_aug.shape[:2]
        matriz_rotacion = cv2.getRotationMatrix2D((w/2, h/2), angulo, 1.0)
        img_aug = cv2.warpAffine(img_aug, matriz_rotacion, (w, h), borderValue=(255, 255, 255))
        
        # ZOOM aleatorio (0.8-1.2×)
        escala_zoom = np.random.uniform(0.85, 1.15)
        img_aug = cv2.resize(img_aug, None, fx=escala_zoom, fy=escala_zoom, interpolation=cv2.INTER_LINEAR)
        if img_aug.shape[0] < 320 or img_aug.shape[1] < 320:
            canvas = np.ones((320, 320, 3), dtype=np.uint8) * 255
            offset_y = (320 - img_aug.shape[0]) // 2
            offset_x = (320 - img_aug.shape[1]) // 2
            canvas[offset_y:offset_y+img_aug.shape[0], offset_x:offset_x+img_aug.shape[1]] = img_aug
            img_aug = canvas
        else:
            img_aug = cv2.resize(img_aug, (320, 320))
        
        # BRILLO aleatorio (-0.2 a +0.2)
        cambio_brillo = np.random.uniform(-20, 20)
        img_aug = cv2.convertScaleAbs(img_aug, alpha=1.0, beta=cambio_brillo)
        
        # CONTRASTE aleatorio
        contraste = np.random.uniform(0.8, 1.2)
        img_aug = cv2.convertScaleAbs(img_aug, alpha=contraste, beta=0)
        
        aumentaciones.append(img_aug)
    
    return aumentaciones

# ========================================================================
# FUNCIÓN 6: PROCESAR IMAGEN INDIVIDUAL
# ========================================================================

def procesar_imagen(ruta_entrada, ruta_salida, nombre_base, clase, indice=0):
    """
    Pipeline completo: validar → leer → redimensionar → normalizar → 
    comprimir → guardar
    """
    print(f"\n  📷 Procesando: {nombre_base}...")
    
    # Paso 1: Validar
    valida, msg = validar_imagen(ruta_entrada)
    print(f"     {msg}")
    if not valida:
        return False, msg
    
    # Paso 2: Leer imagen
    try:
        img = cv2.imread(ruta_entrada)
        if img is None:
            return False, "❌ No se puede leer imagen"
    except Exception as e:
        return False, f"❌ Error lectura: {e}"
    
    # Paso 3: Redimensionar
    print(f"     📐 Redimensionando a {CONFIG['resolucion_salida']}×{CONFIG['resolucion_salida']}...")
    img = redimensionar_imagen(img, CONFIG['resolucion_salida'])
    
    # Paso 4: Normalizar iluminación
    print(f"     💡 Normalizando iluminación...")
    img = normalizar_iluminacion(img)
    
    # Paso 5: Guardar versión principal
    nombre_salida = f"{nombre_base}_optimized.{CONFIG['formato_salida']}"
    ruta_salida_archivo = os.path.join(ruta_salida, nombre_salida)
    
    img_encoded, tamaño_kb, success = comprimir_imagen(
        img, 
        nombre_salida, 
        CONFIG['calidad_jpeg'],
        CONFIG['formato_salida']
    )
    
    if not success:
        return False, "❌ Error compresión"
    
    with open(ruta_salida_archivo, 'wb') as f:
        f.write(img_encoded)
    
    print(f"     ✅ Guardada: {nombre_salida} ({tamaño_kb:.1f} KB)")
    
    # Paso 6: AUGMENTACIÓN (si enabled)
    archivos_generados = [nombre_salida]
    if CONFIG['augmentacion_enabled']:
        print(f"     🔄 Generando {CONFIG['num_aumentaciones_por_imagen']} aumentaciones...")
        aumentaciones = augmentar_imagen(img, CONFIG['num_aumentaciones_por_imagen'])
        
        for aug_idx, img_aug in enumerate(aumentaciones[1:], 1):  # Skip original
            nombre_aug = f"{nombre_base}_aug{aug_idx}.{CONFIG['formato_salida']}"
            ruta_aug = os.path.join(ruta_salida, nombre_aug)
            
            img_encoded, tamaño_kb, _ = comprimir_imagen(
                img_aug, 
                nombre_aug, 
                CONFIG['calidad_jpeg'],
                CONFIG['formato_salida']
            )
            
            with open(ruta_aug, 'wb') as f:
                f.write(img_encoded)
            
            archivos_generados.append(nombre_aug)
            print(f"       ✅ Aumentación {aug_idx}: {nombre_aug} ({tamaño_kb:.1f} KB)")
    
    return True, f"✅ Procesada con {len(archivos_generados)} archivo(s)", archivos_generados

# ========================================================================
# FUNCIÓN 7: PROCESAR CARPETA COMPLETA
# ========================================================================

def procesar_carpeta(ruta_entrada, ruta_salida, clase):
    """
    Procesar todas las imágenes en carpeta
    Retorna estadísticas
    """
    print(f"\n{'='*70}")
    print(f"🎯 PROCESANDO CLASE: {clase.upper()}")
    print(f"{'='*70}")
    print(f"📁 Entrada: {ruta_entrada}")
    print(f"📁 Salida: {ruta_salida}")
    
    # Crear carpeta salida
    os.makedirs(ruta_salida, exist_ok=True)
    
    # Listar imágenes
    imagenes = [f for f in os.listdir(ruta_entrada) 
                if os.path.isfile(os.path.join(ruta_entrada, f))
                and Path(f).suffix.lower() in CONFIG['extensiones_validas']]
    
    if not imagenes:
        print(f"⚠️  No se encontraron imágenes en {ruta_entrada}")
        return 0, 0, 0, 0
    
    print(f"\n📊 Encontradas {len(imagenes)} imagen(s)\n")
    
    # Estadísticas
    total_procesadas = 0
    total_errores = 0
    tamaño_total_original_kb = 0
    tamaño_total_final_kb = 0
    archivos_finales = 0
    
    # Procesar cada imagen
    for idx, nombre_img in enumerate(imagenes, 1):
        ruta_entrada_img = os.path.join(ruta_entrada, nombre_img)
        
        # Obtener tamaño original
        tamaño_original_kb = os.path.getsize(ruta_entrada_img) / 1024
        tamaño_total_original_kb += tamaño_original_kb
        
        # Nombre sin extensión
        nombre_base = Path(nombre_img).stem
        
        # Procesar
        success, msg, files_generated = procesar_imagen(
            ruta_entrada_img,
            ruta_salida,
            nombre_base,
            clase,
            idx
        )
        
        if success:
            total_procesadas += 1
            archivos_finales += len(files_generated)
            
            # Sumar tamaño final
            for file_gen in files_generated:
                ruta_file = os.path.join(ruta_salida, file_gen)
                tamaño_final_kb = os.path.getsize(ruta_file) / 1024
                tamaño_total_final_kb += tamaño_final_kb
        else:
            total_errores += 1
            print(f"     {msg}")
    
    # Estadísticas finales
    print(f"\n{'─'*70}")
    print(f"📈 ESTADÍSTICAS CLASE '{clase}':")
    print(f"{'─'*70}")
    print(f"✅ Imágenes procesadas: {total_procesadas}/{len(imagenes)}")
    print(f"❌ Errores: {total_errores}")
    print(f"📦 Archivos generados: {archivos_finales}")
    print(f"📊 Tamaño original total: {tamaño_total_original_kb/1024:.2f} MB")
    print(f"📊 Tamaño final total: {tamaño_total_final_kb/1024:.2f} MB")
    
    if tamaño_total_original_kb > 0:
        reduccion_pct = ((tamaño_total_original_kb - tamaño_total_final_kb) / tamaño_total_original_kb) * 100
        print(f"🎯 Reducción: {reduccion_pct:.1f}%")
    
    return total_procesadas, total_errores, tamaño_total_original_kb, tamaño_total_final_kb

# ========================================================================
# FUNCIÓN 8: CREAR ESTRUCTURA YOLO
# ========================================================================

def crear_estructura_yolo(directorio_salida, clases):
    """
    Crear estructura compatible YOLO:
    
    dataset/
    ├── images/
    │   ├── train/
    │   └── val/
    ├── labels/
    │   ├── train/
    │   └── val/
    └── data.yaml
    """
    print(f"\n{'='*70}")
    print(f"🏗️  CREANDO ESTRUCTURA YOLO")
    print(f"{'='*70}")
    
    carpetas = [
        os.path.join(directorio_salida, 'images', 'train'),
        os.path.join(directorio_salida, 'images', 'val'),
        os.path.join(directorio_salida, 'labels', 'train'),
        os.path.join(directorio_salida, 'labels', 'val'),
    ]
    
    for carpeta in carpetas:
        os.makedirs(carpeta, exist_ok=True)
        print(f"✅ Creada: {carpeta}")
    
    # Crear data.yaml
    data_yaml = {
        'path': directorio_salida,
        'train': 'images/train',
        'val': 'images/val',
        'nc': len(clases),
        'names': clases
    }
    
    ruta_yaml = os.path.join(directorio_salida, 'data.yaml')
    with open(ruta_yaml, 'w') as f:
        f.write(f"path: {directorio_salida}\n")
        f.write(f"train: images/train\n")
        f.write(f"val: images/val\n")
        f.write(f"nc: {len(clases)}\n")
        f.write(f"names:\n")
        for idx, clase in enumerate(clases):
            f.write(f"  {idx}: {clase}\n")
    
    print(f"✅ Creado: {ruta_yaml}")
    
    return carpetas

# ========================================================================
# FUNCIÓN MAIN
# ========================================================================

def main():
    parser = argparse.ArgumentParser(
        description='Optimizar imágenes cacao para entrenamiento ML',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
EJEMPLOS DE USO:
  
  1. Procesar una clase:
     python optimizar_imagenes_cacao.py \\
       --input "C:\\fotos\\podredumbre_negra" \\
       --output "C:\\dataset\\optimized" \\
       --clase podredumbre_negra
  
  2. Procesar múltiples clases (en bucle):
     for clase in podredumbre_negra fruto_sano barrenador_fruto; do
       python optimizar_imagenes_cacao.py \\
         --input "C:\\fotos\\$clase" \\
         --output "C:\\dataset\\optimized" \\
         --clase $clase
     done
  
  3. Con parámetros personalizados:
     python optimizar_imagenes_cacao.py \\
       --input "C:\\fotos\\podredumbre_negra" \\
       --output "C:\\dataset" \\
       --clase podredumbre_negra \\
       --resolucion 416 \\
       --calidad 90 \\
       --sin-augmentacion
        '''
    )
    
    parser.add_argument('--input', required=True, help='Carpeta imágenes entrada')
    parser.add_argument('--output', required=True, help='Carpeta salida optimizadas')
    parser.add_argument('--clase', required=True, help='Nombre clase (ej: podredumbre_negra)')
    parser.add_argument('--resolucion', type=int, default=320, help='Tamaño salida (default 320)')
    parser.add_argument('--calidad', type=int, default=85, help='Calidad JPEG 0-100 (default 85)')
    parser.add_argument('--formato', default='jpg', choices=['jpg', 'webp'], help='Formato salida')
    parser.add_argument('--sin-augmentacion', action='store_true', help='Desactivar aumentación datos')
    parser.add_argument('--num-aug', type=int, default=2, help='Número aumentaciones por imagen')
    
    args = parser.parse_args()
    
    # Validar carpetas
    if not os.path.isdir(args.input):
        print(f"❌ ERROR: Carpeta entrada no existe: {args.input}")
        sys.exit(1)
    
    # Actualizar config
    CONFIG['resolucion_salida'] = args.resolucion
    CONFIG['calidad_jpeg'] = args.calidad
    CONFIG['formato_salida'] = args.formato
    CONFIG['augmentacion_enabled'] = not args.sin_augmentacion
    CONFIG['num_aumentaciones_por_imagen'] = args.num_aug
    
    # Procesar
    print(f"\n🚀 INICIANDO OPTIMIZACIÓN IMÁGENES CACAO")
    print(f"{'='*70}")
    print(f"⏰ Inicio: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    total, errores, tamaño_orig, tamaño_final = procesar_carpeta(
        args.input,
        os.path.join(args.output, args.clase),
        args.clase
    )
    
    print(f"\n✅ COMPLETADO")
    print(f"⏰ Fin: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*70}\n")

if __name__ == '__main__':
    main()
