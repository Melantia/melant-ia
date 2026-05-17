# -*- coding: utf-8 -*-
import os
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing.image import ImageDataGenerator

"""
MELANTIA - Configuración de ruta unificada apuntando a las Semillas de Conocimiento
"""
# Subimos tres niveles para salir de modules y entrar a la raíz, luego bajamos a knowledge_seeds
CARPETA_DESTINO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "knowledge_seeds", "03_asistente_tecnico_veterinario", "dataset_optimizado"))
MODELO_DIR   = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "modelo_melantia")
DATASET_DIR  = CARPETA_DESTINO
TAMANO       = 224        # MobileNetV2 espera 224x224
BATCH_SIZE   = 32
EPOCHS       = 15
CLASES       = ["Aftosa_FMD", "OjoRosado_IBK", "Dermatosis_LSD"]

os.makedirs(MODELO_DIR, exist_ok=True)

# =====================================================================
# PASO 1 - Cargar y dividir el dataset (80% train / 20% val)
# =====================================================================
print("[1/4] Cargando dataset...")

datagen = ImageDataGenerator(
    rescale=1.0 / 255,
    validation_split=0.2,
    rotation_range=15,
    horizontal_flip=True,
    zoom_range=0.1
)

train_data = datagen.flow_from_directory(
    DATASET_DIR,
    target_size=(TAMANO, TAMANO),
    batch_size=BATCH_SIZE,
    class_mode="categorical",
    subset="training",
    classes=CLASES,
    shuffle=True
)

val_data = datagen.flow_from_directory(
    DATASET_DIR,
    target_size=(TAMANO, TAMANO),
    batch_size=BATCH_SIZE,
    class_mode="categorical",
    subset="validation",
    classes=CLASES,
    shuffle=False
)

num_clases = len(train_data.class_indices)
print(f"    Clases: {train_data.class_indices}")
print(f"    Train: {train_data.samples} | Val: {val_data.samples}")

# =====================================================================
# PASO 2 - Construir modelo con MobileNetV2 (transfer learning)
# =====================================================================
print("[2/4] Construyendo modelo MobileNetV2...")

base = MobileNetV2(
    input_shape=(TAMANO, TAMANO, 3),
    include_top=False,
    weights="imagenet"
)
base.trainable = False  # Congelar base, solo entrenar cabeza

modelo = models.Sequential([
    base,
    layers.GlobalAveragePooling2D(),
    layers.Dropout(0.3),
    layers.Dense(128, activation="relu"),
    layers.Dense(num_clases, activation="softmax")
])

modelo.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)
modelo.summary()

# =====================================================================
# PASO 3 - Entrenar
# =====================================================================
print("[3/4] Entrenando...")

callbacks = [
    tf.keras.callbacks.EarlyStopping(patience=4, restore_best_weights=True),
    tf.keras.callbacks.ReduceLROnPlateau(patience=2, factor=0.5, verbose=1),
    tf.keras.callbacks.ModelCheckpoint(
        os.path.join(MODELO_DIR, "mejor_modelo.keras"),
        save_best_only=True, verbose=1
    )
]

historia = modelo.fit(
    train_data,
    validation_data=val_data,
    epochs=EPOCHS,
    callbacks=callbacks
)

val_loss, val_acc = modelo.evaluate(val_data)
print(f"\n    Precision final en validacion: {val_acc * 100:.1f}%")

# =====================================================================
# PASO 4 - Convertir a TFLite (para la app movil offline)
# =====================================================================
print("[4/4] Convirtiendo a TFLite...")

converter = tf.lite.TFLiteConverter.from_keras_model(modelo)
converter.optimizations = [tf.lite.Optimize.DEFAULT]  # Cuantizacion
tflite_model = converter.convert()

ruta_tflite = os.path.join(MODELO_DIR, "melantia_model.tflite")
with open(ruta_tflite, "wb") as f:
    f.write(tflite_model)

tamano_mb = os.path.getsize(ruta_tflite) / (1024 * 1024)
print(f"\n[LISTO] Modelo guardado: {ruta_tflite}")
print(f"        Tamano: {tamano_mb:.1f} MB")
print(f"        Precision: {val_acc * 100:.1f}%")
print(f"        Listo para integrar en MELANT IA app")


# Configuración
URLS_IMAGENES = ["url1", "url2", "url3"] # Aquí pegarías tu lista de 3706 enlaces
CARPETA_DESTINO = "dataset_optimizado"

if not os.path.exists(CARPETA_DESTINO):
    os.makedirs(CARPETA_DESTINO)

def descargar_y_comprimir(url, nombre_archivo):
    try:
        response = requests.get(url, timeout=10)
        img = Image.open(BytesIO(response.content))
        
        # Convertir a RGB (evita errores con PNGs transparentes)
        img = img.convert('RGB')
        
        # Redimensionar (400px es el dulce punto entre calidad y peso)
        img.thumbnail((400, 400))
        
        # Guardar con compresión de 70%
        ruta_final = os.path.join(CARPETA_DESTINO, f"{nombre_archivo}.jpg")
        img.save(ruta_final, "JPEG", quality=70, optimize=True)
        print(f"✅ Guardada: {nombre_archivo}")
    except Exception as e:
        print(f"❌ Error en {url}: {e}")

# Ejecutar para todas las fotos
# for i, url in enumerate(URLS_IMAGENES):
#     descargar_y_comprimir(url, f"ganado_{i}")