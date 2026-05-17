"""
MELANTIA - Configuración de ruta unificada apuntando a las Semillas de Conocimiento
"""
import os
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# Subimos tres niveles para salir de modules y entrar a la raíz, luego bajamos a knowledge_seeds
CARPETA_DESTINO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "knowledge_seeds", "03_asistente_tecnico_veterinario", "dataset_optimizado"))
MODELO_DIR   = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "modelo_melantia")
DATASET_DIR  = CARPETA_DESTINO
TAMANO       = 224        # MobileNetV2 espera 224x224
BATCH_SIZE   = 32
EPOCHS       = 15
CLASES       = ["Aftosa_FMD", "OjoRosado_IBK", "Dermatosis_LSD"]

os.makedirs(MODELO_DIR, exist_ok=True)

# ...existing code...
