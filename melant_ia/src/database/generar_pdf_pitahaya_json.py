# Script para generar los manuales PDF de pitahaya desde a.json con QR y branding MELANT IA
# Requiere: pip install fpdf qrcode pillow
import json
from fpdf import FPDF
import qrcode
from PIL import Image

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

def generar_pdf(titulo, contenido, qr_data, pdf_file):
    # Generar QR
    qr = qrcode.make(qr_data)
    qr_path = pdf_file + "_qr.png"
    qr.save(qr_path)
    # Crear PDF
    pdf = PDF()
    pdf.title = titulo
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    for linea in contenido.split('\n'):
        pdf.multi_cell(0, 10, linea)
    pdf.ln(10)
    pdf.image(qr_path, x=160, y=pdf.get_y(), w=30)
    pdf.output(pdf_file)
    print(f"PDF generado: {pdf_file}")

def main():
    with open("a.json", encoding="utf-8") as f:
        data = json.load(f)
    # Manual regenerativo
    mr = data["manual_regenerativo"]
    generar_pdf(mr["titulo"], mr["contenido"], mr["qr_link"], "manual_pitahaya_regenerativo.pdf")
    # Manual químico
    mq = data["manual_quimico"]
    generar_pdf(mq["titulo"], mq["contenido"], mq["qr_link"], "manual_pitahaya_quimico.pdf")

if __name__ == "__main__":
    main()
