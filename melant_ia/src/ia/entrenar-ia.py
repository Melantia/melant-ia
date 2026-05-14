import tensorflow as tf
from tensorflow.keras import layers, modelscd 
import os

# --- 1. CONFIGURACIÓN DE RUTAS (Lógica de conexión) ---
# Usamos la ruta absoluta que mencionaste para que no haya errores de lectura
PATH_DATASET = r"E:\Desktop\MELANTIA\MELANTIA_DATASET\Dataset_Optimizado"
IMG_SIZE = (224, 224)
BATCH_SIZE = 32

print(f"📂 Accediendo al dataset en: {PATH_DATASET}")

# --- 2. CARGA Y DIVISIÓN DE DATOS ---
# Esto separa tus 2,842 imágenes: 80% para que la IA estudie y 20% para examinarla
train_ds = tf.keras.utils.image_dataset_from_directory(
    PATH_DATASET,
    validation_split=0.2,
    subset="training",
    seed=123,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE
)

val_ds = tf.keras.utils.image_dataset_from_directory(
    PATH_DATASET,
    validation_split=0.2,
    subset="validation",
    seed=123,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE
)

# Obtener los nombres de las enfermedades (Aftosa, Ojo Rosado, Dermatosis)
class_names = train_ds.class_names
print(f"✅ Clases detectadas: {class_names}")

# --- 3. ARQUITECTURA DEL CEREBRO (MobileNetV2) ---
# Usamos "Transfer Learning": aprovechamos lo que Google ya sabe de imágenes
base_model = tf.keras.applications.MobileNetV2(
    input_shape=(224, 224, 3), 
    include_top=False, 
    weights='imagenet'
)
base_model.trainable = False 

model = models.Sequential([
    base_model,
    layers.GlobalAveragePooling2D(),
    layers.Dropout(0.2), # Evita que la IA memorice, la obliga a aprender
    layers.Dense(len(class_names), activation='softmax') 
])

model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

# --- 4. ENTRENAMIENTO ---
print("\n🚀 Melant_ia está empezando a aprender... (15 vueltas)")
model.fit(train_ds, validation_data=val_ds, epochs=15)

# --- 5. GUARDADO DE RESULTADOS ---
# Guardamos en formato .h5 para respaldo y .tflite para que la App sea veloz
model.save("melantia_cerebro.h5")

converter = tf.lite.TFLiteConverter.from_keras_model(model)
tflite_model = converter.convert()
with open("melantia_model.tflite", "wb") as f:
    f.write(tflite_model)

print("\n🏆 ¡PROCESO EXITOSO!")
print(f"Archivos guardados en: {os.getcwd()}")