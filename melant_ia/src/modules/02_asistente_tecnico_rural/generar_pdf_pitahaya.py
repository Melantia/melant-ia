# Script para generar los manuales PDF de pitahaya con QR y branding MELANT IA
# Requiere: pip install fpdf qrcode pillow
from fpdf import FPDF
import qrcode
from PIL import Image

# Datos de los manuales
MANUALES = [
    {
        "txt": "manual_pitahaya_regenerativo.txt",
        "pdf": "manual_pitahaya_regenerativo.pdf",
        "titulo": "Manual Práctico de Pitahaya (Regenerativo)",
        "qr_data": "https://melant.app/validar/manual_pitahaya_regenerativo"
    },
    {
        "txt": "manual_pitahaya_quimico.txt",
        "pdf": "manual_pitahaya_quimico.pdf",
        "titulo": "Manual Práctico de Pitahaya (Químico)",
        "qr_data": "https://melant.app/validar/manual_pitahaya_quimico"
    }
]

LOGO = "assets/logo_melant_ia.png"  # Cambia la ruta si es necesario

class PDF(FPDF):
    def header(self):
        if LOGO:
            try:
                self.image(LOGO, 10, 8, 33)
            except Exception:
                pass
        self.set_font('Arial', 'B', 14)
        self.cell(0, 10, self.title, ln=1, align='C')
        self.ln(10)
    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Página {self.page_no()}', 0, 0, 'C')

def generar_pdf(manual):
    # Leer contenido
    with open(manual["txt"], encoding="utf-8") as f:
        contenido = f.read()
    # Generar QR
    qr = qrcode.make(manual["qr_data"])
    qr_path = manual["pdf"] + "_qr.png"
    qr.save(qr_path)
    # Crear PDF
    pdf = PDF()
    pdf.title = manual["titulo"]
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    for linea in contenido.split('\n'):
        pdf.multi_cell(0, 10, linea)
    pdf.ln(10)
    pdf.image(qr_path, x=160, y=pdf.get_y(), w=30)
    pdf.output(manual["pdf"])
    print(f"PDF generado: {manual['pdf']}")

def main():
    for manual in MANUALES:
        generar_pdf(manual)

if __name__ == "__main__":
    main()
