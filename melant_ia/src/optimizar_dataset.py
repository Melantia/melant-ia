import os
import cv2

# 1. Rutas relativas del proyecto
ruta_origen = "knowledge_seeds/02_asistente_tecnico_rural/dataset_cacao"
ruta_destino = "knowledge_seeds/02_asistente_tecnico_rural/dataset_cacao_optimizado"

# Categorias actualizadas en espanol
categorias = ["fruto_sano", "podredumbre_negra", "barrenador_fruto"]

# Configuracion del tamano optimo para la IA
TAMANO_IA = 512

print("Iniciando optimizacion de imagenes de cacao con OpenCV...")
total_procesadas = 0

for cat in categorias:
    carpeta_in = os.path.join(ruta_origen, cat)
    carpeta_out = os.path.join(ruta_destino, cat)

    # Crear la carpeta de destino si no existe
    os.makedirs(carpeta_out, exist_ok=True)

    if not os.path.exists(carpeta_in):
        print(f"[!] La carpeta {carpeta_in} no existe. Saltando...")
        continue

    print(f"\n[+] Procesando categoria: {cat}")

    # Leer todos los archivos de la subcarpeta
    archivos = [
        f
        for f in os.listdir(carpeta_in)
        if f.lower().endswith((".jpg", ".jpeg", ".png")) and not f.startswith(".")
    ]

    for i, archivo in enumerate(archivos, 1):
        ruta_archivo_in = os.path.join(carpeta_in, archivo)

        # Cargar imagen en formato BGR nativo de OpenCV
        img = cv2.imread(ruta_archivo_in)

        if img is None:
            print(f" [!] Error al leer {archivo} (posible archivo corrupto).")
            continue

        # 2. Logica de recorte central cuadrado
        alto, ancho = img.shape[:2]
        lado_cuadrado = min(alto, ancho)

        # Calcular los puntos de corte para centrar la imagen
        inicio_y = (alto - lado_cuadrado) // 2
        fin_y = inicio_y + lado_cuadrado
        inicio_x = (ancho - lado_cuadrado) // 2
        fin_x = inicio_x + lado_cuadrado

        # Recorte mediante slicing de NumPy (rapido y directo en RAM)
        img_cuadrada = img[inicio_y:fin_y, inicio_x:fin_x]

        # 3. Redimensionar manteniendo texturas
        img_final = cv2.resize(
            img_cuadrada, (TAMANO_IA, TAMANO_IA), interpolation=cv2.INTER_AREA
        )

        # 4. Guardado en disco
        nombre_salida = os.path.splitext(archivo)[0] + ".png"
        ruta_archivo_out = os.path.join(carpeta_out, nombre_salida)

        cv2.imwrite(ruta_archivo_out, img_final)
        total_procesadas += 1

        # Mostrar progreso cada 100 imagenes
        if i % 100 == 0 or i == len(archivos):
            print(f" -> Progreso en {cat}: {i}/{len(archivos)} imagenes procesadas.")

print("\n[FIN] El proceso ha terminado con exito.")
print(f"Se optimizaron un total de {total_procesadas} imagenes de cacao.")
print(f"Dataset listo en: {ruta_destino}")
