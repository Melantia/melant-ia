# Script para generar el manual PDF de manejo de plagas y enfermedades de maracuyá con QR y branding MELANT IA
# Requiere: pip install fpdf qrcode pillow
from fpdf import FPDF
import qrcode
from PIL import Image

LOGO = "assets/logo_melant_ia.png"  # Cambia la ruta si es necesario
QR_LINK = "https://melant.app/validar/manual_manejo_plagas_enfermedades_maracuya"
TITULO = "Manual de Manejo de Plagas y Enfermedades del Maracuyá"
TEXTO = """MANUAL DE MANEJO DE PLAGAS Y ENFERMEDADES DEL MARACUYÁ\nEscuela de Campo MELANT IA\n\n1. Introducción\nEl maracuyá es susceptible a diversas plagas y enfermedades que afectan la calidad y el rendimiento del cultivo. Un manejo integrado y preventivo es clave para la producción sostenible.\n\n2. Plagas principales\n- Mosca de la fruta (Anastrepha spp.):\n  - Daño: Larvas en frutos, pudrición y caída prematura.\n  - Manejo: Monitoreo con trampas, destrucción de frutos caídos, bolsas protectoras, control biológico.\n  - Imagen: assets/maracuya_mosca_fruta.jpg\n- Ácaros (Tetranychus spp.):\n  - Daño: Amarillamiento y caída de hojas.\n  - Manejo: Riego adecuado, extractos botánicos, control biológico con ácaros benéficos.\n  - Imagen: assets/maracuya_acaros.jpg\n\n3. Enfermedades principales\n- Fusariosis (Fusarium spp.):\n  - Daño: Marchitez y pudrición de raíces y tallos.\n  - Manejo: Rotación de cultivos, plantas sanas, biofungicidas, manejo de humedad.\n  - Imagen: assets/maracuya_fusariosis.jpg\n- Antracnosis (Colletotrichum spp.):\n  - Daño: Manchas oscuras en frutos y tallos, caída prematura de frutos.\n  - Manejo: Poda sanitaria, caldo bordelés, manejo de residuos, selección de plantas sanas.\n  - Imagen: assets/maracuya_antracnosis.jpg\n\n4. Recomendaciones generales\n- Monitorear el cultivo semanalmente.\n- Mantener la biodiversidad y el control biológico.\n- Usar productos permitidos en agricultura orgánica/regenerativa.\n- Consultar recursos multimedia MELANT IA para identificación visual precisa.\n\n---\n\n© 2026 MELANT IA. Uso libre con atribución. Manual offline con imágenes y QR de validación.\n"""

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

def generar_pdf():
    # Generar QR
    qr = qrcode.make(QR_LINK)
    qr_path = "manual_manejo_plagas_enfermedades_maracuya_qr.png"
    qr.save(qr_path)
    # Crear PDF
    pdf = PDF()
    pdf.title = TITULO
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    for linea in TEXTO.split('\n'):
        pdf.multi_cell(0, 10, linea)
    pdf.ln(10)
    pdf.image(qr_path, x=160, y=pdf.get_y(), w=30)
    pdf.output("manual_manejo_plagas_enfermedades_maracuya.pdf")
    print("PDF generado: manual_manejo_plagas_enfermedades_maracuya.pdf")

if __name__ == "__main__":
    generar_pdf()
