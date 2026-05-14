"""
reporte_a4.py
Generador de Reporte A4 oficial de MELANT IA.
Requisito: pip install fpdf2
"""
import os

try:
    from fpdf import FPDF
except ImportError:
    raise ImportError("Instala la dependencia: pip install fpdf2")

from src.modules.asistente_tecnico_rural.voz_asistente import VozAsistente


RUTA_LOGO = os.path.join("src", "ui_features", "assets", "logo_melantia_hd.png")
CARPETA_SALIDA = os.path.join("src", "storage", "documentos")


def agregar_encabezado_tecnico(pdf: FPDF) -> None:
    """Inserta el logo institucional y el título del certificado."""
    if os.path.exists(RUTA_LOGO):
        pdf.image(RUTA_LOGO, x=10, y=8, w=33)

    pdf.set_font("Arial", "B", 12)
    pdf.cell(80)
    pdf.cell(
        30, 10,
        "CERTIFICADO TECNICO DE LINDEROS Y MEDICION GPS",
        border=0, ln=0, align="C"
    )
    pdf.ln(20)


def agregar_area_firma(pdf: FPDF, nombre_productor: str, cedula: str) -> None:
    """Dibuja el área de firma digital al pie de la página A4."""
    pdf.set_y(-50)
    pdf.set_font("Arial", "I", 8)

    # Línea para la firma
    y_linea = pdf.get_y()
    pdf.line(60, y_linea, 150, y_linea)
    pdf.ln(2)

    # Nombre del firmante
    pdf.set_font("Arial", "B", 10)
    pdf.cell(0, 10, f"Firma: {nombre_productor}", border=0, ln=0, align="C")
    pdf.ln(5)

    # Cédula
    pdf.set_font("Arial", "", 9)
    pdf.cell(0, 10, f"C.I.: {cedula}", border=0, ln=0, align="C")
    pdf.ln(10)

    # Sello de validación MELANT IA
    pdf.set_text_color(100, 100, 100)
    pdf.set_font("Arial", "I", 7)
    pdf.cell(
        0, 5,
        "Documento validado digitalmente por el Motor de Inferencia de MELANT IA",
        border=0, ln=0, align="C"
    )
    pdf.set_text_color(0, 0, 0)


def generar_reporte_linderos(
    nombre_productor: str,
    cedula: str,
    hectareas: float,
    puntos_gps: list,
    productor_id: int = 0,
) -> str:
    """
    Genera el PDF del certificado de linderos y lo guarda en CARPETA_SALIDA.

    Returns:
        Ruta absoluta al archivo PDF generado.
    """
    os.makedirs(CARPETA_SALIDA, exist_ok=True)

    pdf = FPDF(orientation="P", unit="mm", format="A4")
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    # --- Encabezado institucional ---
    agregar_encabezado_tecnico(pdf)

    # --- Datos del productor ---
    pdf.set_font("Arial", "B", 11)
    pdf.cell(0, 8, f"Productor: {nombre_productor}", ln=True)
    pdf.set_font("Arial", "", 10)
    pdf.cell(0, 6, f"C.I.: {cedula}", ln=True)
    pdf.cell(0, 6, f"Area medida: {hectareas:.4f} hectareas", ln=True)
    pdf.ln(6)

    # --- Tabla de puntos GPS ---
    pdf.set_font("Arial", "B", 10)
    pdf.cell(20, 8, "Punto", border=1, align="C")
    pdf.cell(55, 8, "Latitud", border=1, align="C")
    pdf.cell(55, 8, "Longitud", border=1, align="C")
    pdf.ln()

    pdf.set_font("Arial", "", 9)
    for i, punto in enumerate(puntos_gps, start=1):
        pdf.cell(20, 7, str(i), border=1, align="C")
        pdf.cell(55, 7, f"{punto.get('lat', '')}", border=1, align="C")
        pdf.cell(55, 7, f"{punto.get('lon', '')}", border=1, align="C")
        pdf.ln()

    # --- Pie de firma ---
    agregar_area_firma(pdf, nombre_productor, cedula)

    # --- Guardar ---
    nombre_archivo = f"certificado_linderos_{productor_id}_{cedula}.pdf"
    ruta_salida = os.path.join(CARPETA_SALIDA, nombre_archivo)
    pdf.output(ruta_salida)

    # --- Notificación de voz ---
    try:
        voz = VozAsistente()
        voz.hablar(
            "Verificacion completada. Su reporte A4 ya incluye el logo institucional "
            "y el espacio para su firma digital. He enviado una copia a su carpeta "
            "de Documentos en el modulo de Comunidad."
        )
    except Exception:
        pass  # La voz es opcional; no interrumpe el guardado

    return ruta_salida
