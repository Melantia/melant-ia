# Devuelve un valor de severidad entre 0 y 1 para integración con lógica difusa
def detectar_severidad(imagen_path):
    """
    Analiza la imagen y retorna un valor de severidad entre 0 (sin daño) y 1 (daño máximo).
    Usa el modelo IA si está disponible, o un valor simulado si no.
    """
    try:
        resultado = clasificar_con_ia(imagen_path, top_k=1)
        pred = resultado["mejor_prediccion"]
        if pred["es_sana"]:
            return 0.0
        # Usamos la confianza como proxy de severidad (0-100%)
        return min(max(pred["confianza"] / 100.0, 0), 1)
    except Exception:
        # Si falla el modelo, simula un valor medio
        return 0.5
"""
Módulo de Análisis de Daño Foliar y Detección de Enfermedades — MELANT IA

Analiza fotografías de hojas para:
  1. Calcular porcentaje de área dañada (insectos masticadores, necrosis)
  2. Detectar tipo de daño por patrón de color (hongos, bacterias, virus)
  3. Clasificar severidad en escala 1-5
  4. Generar mapa de calor de zonas afectadas
  5. Clasificar enfermedad con IA (PlantVillage + ONNX Runtime)

Motores:
  - OpenCV (HSV): siempre disponible, ligero, 100% offline.
  - ONNX Runtime + PlantVillage: clasificación IA de 38 enfermedades.
    (TensorFlow no soporta Python 3.14; usamos ONNX como runtime portable.)
"""

from __future__ import annotations

import json
from pathlib import Path
from datetime import datetime

import numpy as np


# ─────────────────────────────────────────────
# MODELO IA — PlantVillage vía ONNX Runtime
# ─────────────────────────────────────────────

# 38 clases del dataset PlantVillage (14 especies, sanas + enfermas)
PLANTVILLAGE_CLASES = [
    "Apple___Apple_scab", "Apple___Black_rot", "Apple___Cedar_apple_rust", "Apple___healthy",
    "Blueberry___healthy",
    "Cherry_(including_sour)___Powdery_mildew", "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot", "Corn_(maize)___Common_rust",
    "Corn_(maize)___Northern_Leaf_Blight", "Corn_(maize)___healthy",
    "Grape___Black_rot", "Grape___Esca_(Black_Measles)",
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)", "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)",
    "Peach___Bacterial_spot", "Peach___healthy",
    "Pepper,_bell___Bacterial_spot", "Pepper,_bell___healthy",
    "Potato___Early_blight", "Potato___Late_blight", "Potato___healthy",
    "Raspberry___healthy",
    "Soybean___healthy",
    "Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch", "Strawberry___healthy",
    "Tomato___Bacterial_spot", "Tomato___Early_blight", "Tomato___Late_blight",
    "Tomato___Leaf_Mold", "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites", "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus", "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy",
]

# Traducción de enfermedades PlantVillage al español
TRADUCCION_PLANTVILLAGE = {
    "Apple_scab": "Sarna del manzano (Venturia inaequalis)",
    "Black_rot": "Pudrición negra (Botryosphaeria obtusa)",
    "Cedar_apple_rust": "Roya del manzano-cedro (Gymnosporangium juniperi-virginianae)",
    "Powdery_mildew": "Oídio / Cenicilla (Erysiphe spp.)",
    "Cercospora_leaf_spot": "Mancha de Cercospora (Cercospora zeae-maydis)",
    "Common_rust": "Roya común (Puccinia sorghi)",
    "Northern_Leaf_Blight": "Tizón norteño (Exserohilum turcicum)",
    "Esca_(Black_Measles)": "Esca / Sarampión negro de la vid",
    "Leaf_blight_(Isariopsis_Leaf_Spot)": "Tizón foliar (Isariopsis)",
    "Haunglongbing_(Citrus_greening)": "HLB / Enverdecimiento de cítricos (Candidatus Liberibacter)",
    "Bacterial_spot": "Mancha bacteriana (Xanthomonas spp.)",
    "Early_blight": "Tizón temprano (Alternaria solani)",
    "Late_blight": "Tizón tardío (Phytophthora infestans)",
    "Leaf_Mold": "Moho foliar (Passalora fulva)",
    "Septoria_leaf_spot": "Mancha de Septoria (Septoria lycopersici)",
    "Spider_mites": "Ácaros araña (Tetranychus urticae)",
    "Target_Spot": "Mancha diana (Corynespora cassiicola)",
    "Tomato_Yellow_Leaf_Curl_Virus": "Virus del rizado amarillo del tomate (TYLCV)",
    "Tomato_mosaic_virus": "Virus del mosaico del tomate (ToMV)",
    "Leaf_scorch": "Chamuscado foliar",
    "healthy": "Sana — sin enfermedad detectada",
}

# Directorio donde se almacena el modelo ONNX
MODELO_DIR = Path(__file__).parent / "modelos" / "plantvillage"
MODELO_ONNX = MODELO_DIR / "plantvillage_mobilenetv2.onnx"


def _cargar_modelo_onnx():
    """Carga el modelo PlantVillage en formato ONNX."""
    try:
        import onnxruntime as ort
    except ImportError:
        raise ImportError(
            "ONNX Runtime no está instalado. Ejecuta:\n"
            "  uv pip install onnxruntime -p .venv\\Scripts\\python.exe --link-mode copy"
        )

    if not MODELO_ONNX.exists():
        raise FileNotFoundError(
            f"Modelo ONNX no encontrado en: {MODELO_ONNX}\n"
            "Para obtener el modelo:\n"
            "  1. Entrenar con PlantVillage dataset y exportar a ONNX, o\n"
            "  2. Descargar modelo pre-entrenado PlantVillage (.onnx) y colocarlo en:\n"
            f"     {MODELO_ONNX}"
        )

    sesion = ort.InferenceSession(str(MODELO_ONNX))
    return sesion


def _preprocesar_imagen(imagen_path: Path, tamaño: int = 224) -> np.ndarray:
    """Carga y preprocesa imagen para el modelo (224x224, float32, normalizada)."""
    from PIL import Image

    img = Image.open(imagen_path).convert("RGB").resize((tamaño, tamaño))
    arr = np.array(img, dtype=np.float32) / 255.0
    # ONNX espera (batch, channels, height, width) o (batch, height, width, channels)
    arr = np.expand_dims(arr, axis=0)  # (1, 224, 224, 3)
    return arr


def clasificar_con_ia(imagen_path: str | Path, top_k: int = 3) -> dict:
    """
    Clasifica una imagen de hoja usando el modelo PlantVillage (ONNX).

    Retorna las top_k predicciones con nombre en español, confianza y tratamiento.
    Funciona 100% offline después de tener el modelo .onnx.
    """
    imagen_path = Path(imagen_path)
    if not imagen_path.exists():
        raise FileNotFoundError(f"Imagen no encontrada: {imagen_path}")

    sesion = _cargar_modelo_onnx()
    entrada = _preprocesar_imagen(imagen_path)

    # Ejecutar inferencia
    nombre_entrada = sesion.get_inputs()[0].name
    predicciones = sesion.run(None, {nombre_entrada: entrada})[0][0]

    # Aplicar softmax si el modelo no lo incluye
    exp = np.exp(predicciones - np.max(predicciones))
    probabilidades = exp / exp.sum()

    # Top K resultados
    indices_top = np.argsort(probabilidades)[::-1][:top_k]
    resultados = []
    for idx in indices_top:
        if idx >= len(PLANTVILLAGE_CLASES):
            continue
        clase = PLANTVILLAGE_CLASES[idx]
        especie, enfermedad = clase.split("___", 1)
        especie_limpia = especie.replace("_", " ").replace(",", ",")
        nombre_es = TRADUCCION_PLANTVILLAGE.get(enfermedad, enfermedad.replace("_", " "))
        es_sana = enfermedad == "healthy"

        resultado = {
            "clase_original": clase,
            "especie": especie_limpia,
            "enfermedad": nombre_es,
            "confianza": round(float(probabilidades[idx]) * 100, 1),
            "es_sana": es_sana,
        }

        # Enriquecer con conocimiento fitosanitario si es enfermedad
        if not es_sana:
            try:
                from conocimiento_fitosanitario import consultar_enfermedad
                info = consultar_enfermedad(enfermedad)
                if info and info["tratamientos_biologicos"]:
                    resultado["tratamiento_biologico"] = [
                        f"{t['producto']} — {t['dosis_referencia']}"
                        for t in info["tratamientos_biologicos"]
                    ]
            except ImportError:
                pass

        resultados.append(resultado)

    return {
        "imagen": str(imagen_path),
        "motor": "PlantVillage-IA (ONNX Runtime + MobileNetV2)",
        "predicciones": resultados,
        "mejor_prediccion": resultados[0] if resultados else {},
        "fecha_analisis": datetime.now().strftime("%Y-%m-%d %H:%M"),
    }


def imprimir_diagnostico_ia(resultado: dict) -> None:
    """Muestra el diagnóstico IA en consola."""
    print(f"\n   🤖 DIAGNÓSTICO IA — PlantVillage")
    print(f"   ──────────────────────────────────")
    print(f"   📷 Imagen: {Path(resultado['imagen']).name}")
    print(f"   ⚙️  Motor: {resultado['motor']}")
    for i, pred in enumerate(resultado["predicciones"], 1):
        estado = "✅" if pred["es_sana"] else "🦠"
        print(f"   {estado} #{i}: {pred['especie']} → {pred['enfermedad']} ({pred['confianza']}%)")
        if "tratamiento_biologico" in pred:
            for t in pred["tratamiento_biologico"]:
                print(f"      💊 {t}")
    print(f"   📅 {resultado['fecha_analisis']}")

# ─────────────────────────────────────────────
# CONSTANTES DE CLASIFICACIÓN
# ─────────────────────────────────────────────

# Escala de severidad (% de área dañada → nivel)
ESCALA_SEVERIDAD = {
    1: (0, 5),      # Sana o daño insignificante
    2: (5, 15),     # Leve — monitorear
    3: (15, 30),    # Moderado — intervención recomendada
    4: (30, 50),    # Severo — intervención urgente
    5: (50, 100),   # Crítico — pérdida probable de la planta
}

# Rangos HSV para detectar tipos de daño en hojas
# (H: 0-179, S: 0-255, V: 0-255 en OpenCV)
PATRON_COLORES = {
    "tejido_sano":  {"h_min": 25, "h_max": 85, "s_min": 40, "s_max": 255, "v_min": 40, "v_max": 255},
    "necrosis":     {"h_min": 0,  "h_max": 25, "s_min": 30, "s_max": 255, "v_min": 20, "v_max": 180},
    "clorosis":     {"h_min": 20, "h_max": 35, "s_min": 50, "s_max": 255, "v_min": 100, "v_max": 255},
    "moho_blanco":  {"h_min": 0,  "h_max": 179, "s_min": 0,  "s_max": 30,  "v_min": 180, "v_max": 255},
    "antracnosis":  {"h_min": 0,  "h_max": 15, "s_min": 40, "s_max": 200, "v_min": 10, "v_max": 100},
}

# Diagnóstico por tipo de daño detectado
DIAGNOSTICOS = {
    "necrosis": {
        "posible_causa": "Hongos (Phytophthora, Moniliasis) o quemadura química",
        "tratamiento": "Fungicida cúprico o Trichoderma harzianum. Podar tejido afectado.",
    },
    "clorosis": {
        "posible_causa": "Deficiencia de Hierro/Nitrógeno, o virus del mosaico",
        "tratamiento": "Análisis foliar para confirmar. Aplicar quelato de hierro si es nutricional.",
    },
    "moho_blanco": {
        "posible_causa": "Oidio (Erysiphe spp.) o Esclerotinia",
        "tratamiento": "Azufre mojable o Bacillus subtilis. Mejorar ventilación del cultivo.",
    },
    "antracnosis": {
        "posible_causa": "Colletotrichum spp. (muy común en cacao y plátano)",
        "tratamiento": "Eliminación de frutos afectados. Aplicar fungicida protectante.",
    },
}


# ─────────────────────────────────────────────
# FUNCIONES DE ANÁLISIS
# ─────────────────────────────────────────────

def _importar_cv2():
    """Importa OpenCV con manejo de error claro."""
    try:
        import cv2
        return cv2
    except ImportError:
        raise ImportError(
            "OpenCV no está instalado. Ejecuta:\n"
            "  uv pip install opencv-python-headless -p .venv\\Scripts\\python.exe --link-mode copy"
        )


# ─────────────────────────────────────────────
# DIAGNÓSTICO DIFERENCIAL: HONGO / BACTERIA / VIRUS
# ─────────────────────────────────────────────

def diagnostico_diferencial(imagen_path: str | Path) -> dict:
    """
    Analiza una foto de hoja y clasifica la probabilidad de:
      - HONGO: textura rugosa (Laplacian) + bordes irregulares (LBP)
      - BACTERIA: manchas acuosas múltiples (contornos pequeños)
      - VIRUS: patrón mosaico (variación de tono H en HSV)

    Retorna dict con probabilidades 0-100 para cada tipo.
    """
    cv2 = _importar_cv2()
    imagen_path = Path(imagen_path)

    if not imagen_path.exists():
        raise FileNotFoundError(f"Imagen no encontrada: {imagen_path}")

    img = cv2.imread(str(imagen_path))
    if img is None:
        raise ValueError(f"No se pudo leer la imagen: {imagen_path}")

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    h, s, v = cv2.split(hsv)

    resultados = {"hongo": 0.0, "bacteria": 0.0, "virus": 0.0}
    indicadores = {}

    # ── FILTRO 1: HONGOS (Textura rugosa + LBP) ──
    # Laplacian: mide rugosidad/textura de la superficie
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    indicadores["laplacian_var"] = round(laplacian_var, 2)

    # LBP (Local Binary Patterns) para detectar pústulas/esporas
    try:
        from skimage.feature import local_binary_pattern
        lbp = local_binary_pattern(gray, P=8, R=1, method="uniform")
        lbp_var = float(np.std(lbp))
        indicadores["lbp_std"] = round(lbp_var, 2)
    except ImportError:
        lbp_var = 0
        indicadores["lbp_std"] = "N/A (scikit-image no instalado)"

    # Puntuación hongo: Laplacian alto + LBP alto = textura irregular
    if laplacian_var > 100:
        resultados["hongo"] += min(laplacian_var / 5, 60)
    if isinstance(lbp_var, float) and lbp_var > 2.0:
        resultados["hongo"] += min(lbp_var * 8, 40)
    resultados["hongo"] = round(min(resultados["hongo"], 100), 1)

    # ── FILTRO 2: BACTERIAS (Manchas acuosas múltiples) ──
    # Umbralizar para encontrar manchas oscuras/acuosas
    _, thresh = cv2.threshold(gray, 100, 255, cv2.THRESH_BINARY_INV)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=2)
    contornos, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Filtrar contornos pequeños (manchas acuosas típicas de bacterias)
    manchas_pequenas = [c for c in contornos if 50 < cv2.contourArea(c) < 5000]
    num_manchas = len(manchas_pequenas)
    indicadores["manchas_acuosas"] = num_manchas

    if num_manchas > 5:
        resultados["bacteria"] += min(num_manchas * 6, 70)
    # Uniformidad de las manchas (bacterias = manchas similares entre sí)
    if manchas_pequenas:
        areas = [cv2.contourArea(c) for c in manchas_pequenas]
        cv_areas = np.std(areas) / (np.mean(areas) + 1e-6)  # Coeficiente de variación
        indicadores["uniformidad_manchas"] = round(cv_areas, 2)
        if cv_areas < 1.5:  # Manchas uniformes = más probable bacteria
            resultados["bacteria"] += 30
    resultados["bacteria"] = round(min(resultados["bacteria"], 100), 1)

    # ── FILTRO 3: VIRUS (Patrón mosaico — variación de tono) ──
    # Segmentar solo la zona verde de la hoja
    rango = PATRON_COLORES["tejido_sano"]
    mascara_hoja = cv2.inRange(
        hsv,
        np.array([rango["h_min"], rango["s_min"], rango["v_min"]]),
        np.array([rango["h_max"], rango["s_max"], rango["v_max"]]),
    )
    h_hoja = h[mascara_hoja > 0]

    if len(h_hoja) > 100:
        std_h = float(np.std(h_hoja))
        indicadores["std_tono_hoja"] = round(std_h, 2)
        # Alta variación de tono dentro del verde = mosaico viral
        if std_h > 12:
            resultados["virus"] += min(std_h * 4, 80)
        # Verificar bimodalidad (dos picos de verde = mosaico clásico)
        hist = np.histogram(h_hoja, bins=30)[0]
        picos = sum(1 for i in range(1, len(hist)-1)
                     if hist[i] > hist[i-1] and hist[i] > hist[i+1] and hist[i] > len(h_hoja)*0.03)
        indicadores["picos_color"] = picos
        if picos >= 2:
            resultados["virus"] += 20
    else:
        indicadores["std_tono_hoja"] = "N/A (hoja no detectada)"
    resultados["virus"] = round(min(resultados["virus"], 100), 1)

    # ── DIAGNÓSTICO PRINCIPAL ──
    tipo_max = max(resultados, key=resultados.get)
    confianza_max = resultados[tipo_max]

    diagnostico = {
        "probabilidades": resultados,
        "indicadores_tecnicos": indicadores,
        "diagnostico_principal": tipo_max if confianza_max > 20 else "indeterminado",
        "confianza": confianza_max,
        "nivel": (
            "Alta" if confianza_max > 60 else
            "Media" if confianza_max > 35 else
            "Baja" if confianza_max > 20 else
            "Insuficiente — se requieren preguntas adicionales"
        ),
        "fecha_analisis": datetime.now().strftime("%Y-%m-%d %H:%M"),
    }

    return diagnostico


def imprimir_diagnostico_diferencial(diag: dict) -> None:
    """Muestra el diagnóstico diferencial en consola."""
    print(f"\n   🔬 DIAGNÓSTICO DIFERENCIAL — MELANT IA")
    print(f"   ────────────────────────────────────────")
    probs = diag["probabilidades"]
    iconos = {"hongo": "🍄", "bacteria": "🧫", "virus": "🧬"}
    for tipo, prob in sorted(probs.items(), key=lambda x: x[1], reverse=True):
        barra = "█" * int(prob / 5) + "░" * (20 - int(prob / 5))
        print(f"   {iconos[tipo]} {tipo.upper():10s} {barra} {prob}%")

    principal = diag["diagnostico_principal"]
    if principal != "indeterminado":
        print(f"\n   ➡️  Diagnóstico probable: {principal.upper()} (confianza: {diag['nivel']})")
    else:
        print(f"\n   ❓ Confianza insuficiente — activando preguntas de campo...")

    # Indicadores técnicos para debug/expertos
    ind = diag["indicadores_tecnicos"]
    print(f"   📐 Laplacian: {ind.get('laplacian_var', '?')} | LBP: {ind.get('lbp_std', '?')}")
    print(f"   📐 Manchas: {ind.get('manchas_acuosas', '?')} | Tono σ: {ind.get('std_tono_hoja', '?')}")


def analizar_hoja(imagen_path: str | Path, guardar_resultado: bool = True) -> dict:
    """
    Analiza una fotografía de hoja y devuelve diagnóstico completo.

    Parámetros
    ----------
    imagen_path : ruta a la imagen (JPG, PNG).
    guardar_resultado : si True, guarda imagen anotada y JSON de resultados.

    Retorna
    -------
    dict con: porcentaje_dano, severidad, tipo_dano, diagnostico, recomendacion.
    """
    cv2 = _importar_cv2()
    imagen_path = Path(imagen_path)

    if not imagen_path.exists():
        raise FileNotFoundError(f"Imagen no encontrada: {imagen_path}")

    img = cv2.imread(str(imagen_path))
    if img is None:
        raise ValueError(f"No se pudo leer la imagen: {imagen_path}")

    # Convertir a HSV (más resistente a cambios de luz en campo)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    # --- Paso 1: Segmentar la hoja (separar del fondo) ---
    rango = PATRON_COLORES["tejido_sano"]
    mascara_verde = cv2.inRange(
        hsv,
        np.array([rango["h_min"], rango["s_min"], rango["v_min"]]),
        np.array([rango["h_max"], rango["s_max"], rango["v_max"]]),
    )

    # Incluir tejido dañado como parte de la hoja (no es fondo)
    mascara_hoja = mascara_verde.copy()
    for tipo in ("necrosis", "clorosis", "antracnosis"):
        r = PATRON_COLORES[tipo]
        m = cv2.inRange(
            hsv,
            np.array([r["h_min"], r["s_min"], r["v_min"]]),
            np.array([r["h_max"], r["s_max"], r["v_max"]]),
        )
        mascara_hoja = cv2.bitwise_or(mascara_hoja, m)

    # Limpiar ruido con operaciones morfológicas
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    mascara_hoja = cv2.morphologyEx(mascara_hoja, cv2.MORPH_CLOSE, kernel, iterations=3)
    mascara_hoja = cv2.morphologyEx(mascara_hoja, cv2.MORPH_OPEN, kernel, iterations=2)

    pixeles_hoja = int(np.sum(mascara_hoja > 0))
    pixeles_sanos = int(np.sum(mascara_verde > 0))

    if pixeles_hoja == 0:
        return {
            "error": "No se detectó hoja en la imagen. Asegúrese de que el fondo contraste.",
            "severidad": 0,
        }

    # --- Paso 2: Calcular área dañada ---
    pixeles_danados = pixeles_hoja - pixeles_sanos
    porcentaje_dano = round((pixeles_danados / pixeles_hoja) * 100, 1)
    porcentaje_dano = max(0, min(100, porcentaje_dano))

    # --- Paso 3: Clasificar severidad ---
    severidad = 1
    for nivel, (pmin, pmax) in ESCALA_SEVERIDAD.items():
        if pmin <= porcentaje_dano < pmax:
            severidad = nivel
            break

    etiquetas_severidad = {
        1: "Sana / Insignificante",
        2: "Leve — Monitorear",
        3: "Moderado — Intervención recomendada",
        4: "Severo — Intervención urgente",
        5: "Crítico — Pérdida probable",
    }

    # --- Paso 4: Detectar tipo de daño predominante ---
    conteo_tipos = {}
    for tipo in ("necrosis", "clorosis", "moho_blanco", "antracnosis"):
        r = PATRON_COLORES[tipo]
        m = cv2.inRange(
            hsv,
            np.array([r["h_min"], r["s_min"], r["v_min"]]),
            np.array([r["h_max"], r["s_max"], r["v_max"]]),
        )
        # Solo contar dentro de la máscara de la hoja
        m = cv2.bitwise_and(m, mascara_hoja)
        conteo_tipos[tipo] = int(np.sum(m > 0))

    tipo_principal = max(conteo_tipos, key=conteo_tipos.get)
    diagnostico = DIAGNOSTICOS.get(tipo_principal, {})

    # --- Paso 5: Generar mapa de calor de zonas afectadas ---
    mapa_calor = None
    if guardar_resultado:
        # Crear máscara de daño (todo lo que NO es verde sano dentro de la hoja)
        mascara_dano = cv2.bitwise_and(
            cv2.bitwise_not(mascara_verde), mascara_hoja
        )
        # Colorear zonas dañadas en rojo sobre la imagen original
        overlay = img.copy()
        overlay[mascara_dano > 0] = [0, 0, 255]  # Rojo BGR
        resultado_visual = cv2.addWeighted(img, 0.6, overlay, 0.4, 0)

        # Guardar imagen anotada
        salida_img = imagen_path.parent / f"{imagen_path.stem}_diagnostico{imagen_path.suffix}"
        cv2.imwrite(str(salida_img), resultado_visual)
        mapa_calor = str(salida_img)

    resultado = {
        "imagen": str(imagen_path),
        "pixeles_hoja": pixeles_hoja,
        "pixeles_sanos": pixeles_sanos,
        "pixeles_danados": pixeles_danados,
        "porcentaje_dano": porcentaje_dano,
        "severidad": severidad,
        "severidad_texto": etiquetas_severidad[severidad],
        "tipo_dano_principal": tipo_principal.replace("_", " ").title(),
        "distribucion_dano": {k.replace("_", " ").title(): v for k, v in conteo_tipos.items()},
        "posible_causa": diagnostico.get("posible_causa", "No determinada"),
        "tratamiento_sugerido": diagnostico.get("tratamiento", "Consultar especialista"),
        "mapa_calor": mapa_calor,
        "fecha_analisis": datetime.now().strftime("%Y-%m-%d %H:%M"),
    }

    # Guardar JSON de resultados
    if guardar_resultado:
        salida_json = imagen_path.parent / f"{imagen_path.stem}_diagnostico.json"
        with open(salida_json, "w", encoding="utf-8") as f:
            json.dump(resultado, f, ensure_ascii=False, indent=2)

    return resultado


def imprimir_diagnostico(resultado: dict) -> None:
    """Muestra el diagnóstico en consola de forma legible."""
    if "error" in resultado:
        print(f"   ❌ {resultado['error']}")
        return

    print(f"\n   🍃 DIAGNÓSTICO FOLIAR — MELANT IA")
    print(f"   ─────────────────────────────────")
    print(f"   📷 Imagen: {Path(resultado['imagen']).name}")
    print(f"   📊 Área dañada: {resultado['porcentaje_dano']}%")
    print(f"   ⚠️  Severidad: {resultado['severidad']}/5 — {resultado['severidad_texto']}")
    print(f"   🔍 Tipo de daño: {resultado['tipo_dano_principal']}")
    print(f"   🦠 Posible causa: {resultado['posible_causa']}")
    print(f"   💊 Tratamiento: {resultado['tratamiento_sugerido']}")
    if resultado.get("mapa_calor"):
        print(f"   🗺️  Mapa de calor: {resultado['mapa_calor']}")
    print(f"   📅 Fecha: {resultado['fecha_analisis']}")


def analizar_lote_hojas(carpeta: str | Path) -> list[dict]:
    """
    Analiza todas las imágenes JPG/PNG en una carpeta.
    Devuelve lista de resultados ordenados por severidad (peor primero).
    """
    carpeta = Path(carpeta)
    if not carpeta.is_dir():
        raise NotADirectoryError(f"No es una carpeta: {carpeta}")

    extensiones = {".jpg", ".jpeg", ".png", ".bmp"}
    imagenes = [f for f in carpeta.iterdir() if f.suffix.lower() in extensiones]

    if not imagenes:
        print(f"   No se encontraron imágenes en {carpeta}")
        return []

    resultados = []
    for img in imagenes:
        print(f"   Analizando: {img.name}...", end=" ")
        try:
            r = analizar_hoja(img)
            resultados.append(r)
            sev = r.get("severidad", 0)
            pct = r.get("porcentaje_dano", 0)
            print(f"Severidad {sev}/5 ({pct}% daño)")
        except Exception as e:
            print(f"Error: {e}")

    resultados.sort(key=lambda x: x.get("severidad", 0), reverse=True)

    # Resumen
    if resultados:
        print(f"\n   📋 RESUMEN DEL LOTE: {len(resultados)} hojas analizadas")
        criticas = sum(1 for r in resultados if r.get("severidad", 0) >= 4)
        if criticas:
            print(f"   🚨 {criticas} hojas en estado SEVERO o CRÍTICO")
        promedio = np.mean([r.get("porcentaje_dano", 0) for r in resultados])
        print(f"   📊 Daño promedio del lote: {promedio:.1f}%")

    return resultados


# ─────────────────────────────────────────────
# ANÁLISIS DUAL (OpenCV + IA si disponible)
# ─────────────────────────────────────────────

def analisis_completo(imagen_path: str | Path, usar_ia: bool = True) -> dict:
    """
    Ejecuta análisis con OpenCV (siempre) y con IA (si TensorFlow está disponible).
    Combina ambos resultados en un solo diagnóstico enriquecido.
    """
    imagen_path = Path(imagen_path)

    # Siempre ejecutar motor OpenCV (ligero, offline)
    resultado_cv = analizar_hoja(imagen_path)

    # Intentar motor IA si se solicita
    resultado_ia = None
    if usar_ia:
        try:
            resultado_ia = clasificar_con_ia(imagen_path)
        except ImportError:
            print("   ℹ️  TensorFlow no instalado — usando solo OpenCV")
        except Exception as e:
            print(f"   ⚠️  Motor IA no disponible: {e} — usando solo OpenCV")

    return {
        "opencv": resultado_cv,
        "ia": resultado_ia,
        "motor_usado": "OpenCV + PlantVillage IA" if resultado_ia else "OpenCV (solo)",
    }
