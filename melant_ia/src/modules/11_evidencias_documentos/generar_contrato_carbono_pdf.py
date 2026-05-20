import os
from fpdf import FPDF
from datetime import datetime

class ContratoCarbonoPDF(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 14)
        self.cell(0, 10, 'Contrato de Cesión de Beneficios de Carbono', 0, 1, 'C')
        self.ln(5)

    def cuerpo(self, productor, cedula, lote, proyecto, vigencia, porcentaje, fecha):
        self.set_font('Arial', '', 11)
        self.multi_cell(0, 8, f"\nEntre: {productor}, identificado con cédula {cedula}, propietario del predio {lote}, en adelante EL PRODUCTOR,\ny {proyecto}, en adelante EL PROYECTO.\n\nCONSIDERANDO:\n- Que EL PRODUCTOR es titular legítimo del predio y desea participar en el Proyecto de Captura de Carbono bajo estándares internacionales (Verra, Gold Standard, ISO 14068, ISO 14067).\n- Que EL PROYECTO implementa prácticas de mitigación y captura de carbono, y requiere la cesión de derechos sobre los beneficios de carbono generados.\n\nCLÁUSULAS:\n\n1. OBJETO\nEL PRODUCTOR cede a EL PROYECTO, de manera exclusiva, los derechos de generación, certificación y comercialización de los beneficios de carbono (bonos de carbono) derivados de las prácticas implementadas en el predio identificado.\n\n2. DURACIÓN\nEl presente contrato tendrá una vigencia de {vigencia} año(s), renovable por períodos iguales salvo notificación de cambio por alguna de las partes.\n\n3. OBLIGACIONES DEL PRODUCTOR\n- Permitir el acceso para monitoreo, verificación y auditoría de prácticas y resultados.\n- Implementar y mantener prácticas agrícolas alineadas a los estándares internacionales mencionados.\n- Registrar evidencias (fotos, documentos, geolocalización) a través del sistema MELANTIA, conectando el módulo de fotos con el registro de evidencia del proyecto carbono.\n- No transferir ni ceder los derechos de carbono a terceros durante la vigencia del contrato.\n\n4. OBLIGACIONES DEL PROYECTO\n- Gestionar la certificación y comercialización de los bonos de carbono.\n- Compartir con EL PRODUCTOR los reportes de auditoría y resultados de verificación.\n- Transferir al PRODUCTOR el {porcentaje}% de los beneficios económicos netos obtenidos por la venta de bonos de carbono.\n\n5. REGISTRO DE EVIDENCIA\nToda evidencia (fotos, documentos, geolocalización) deberá ser registrada en el sistema MELANTIA, quedando asociada al expediente digital del productor y lote correspondiente. El módulo de fotos se integra automáticamente con el registro de evidencia para trazabilidad y auditoría.\n\n6. ACEPTACIÓN DIGITAL Y COMPROMISO\nEl productor deberá:\n- Sostener su cédula frente a la cámara y grabar un video/foto expresando verbalmente su deseo de ser parte del proyecto, comprometiéndose a cumplir los requisitos y a seguir las recomendaciones de Fabrizzio en prácticas regenerativas.\n- Esta grabación servirá como aceptación legal y digital del contrato.\n\n7. RESOLUCIÓN DE CONFLICTOS\nLas partes acuerdan resolver cualquier controversia mediante mediación y, en su defecto, arbitraje conforme a la legislación vigente.\n\n8. ACEPTACIÓN\nAmbas partes declaran haber leído, entendido y aceptado todas las cláusulas del presente contrato.\n\nFirmas:\n\n__________________________           __________________________\nEL PRODUCTOR                              EL PROYECTO\n\nFecha: {fecha}\n\nAnexo: Tabla de distribución de beneficios, cronograma de monitoreo, lista de prácticas obligatorias.")

    def guia(self):
        self.set_font('Arial', 'B', 12)
        self.cell(0, 10, 'Guía para el Productor:', 0, 1)
        self.set_font('Arial', '', 11)
        self.multi_cell(0, 8, "1. Sostenga su cédula frente a la cámara.\n2. Exprese en voz alta: 'Acepto ser parte del Proyecto de Carbono y me comprometo a cumplir los requisitos y seguir las recomendaciones de Fabrizzio en prácticas regenerativas.'\n3. El sistema tomará una foto/video y la asociará a su expediente digital.\n4. Siga las instrucciones en pantalla para registrar evidencias de sus prácticas.")


def generar_contrato_carbono_pdf(productor, cedula, lote, proyecto, vigencia, porcentaje, ruta_pdf):
    pdf = ContratoCarbonoPDF()
    pdf.add_page()
    pdf.cuerpo(productor, cedula, lote, proyecto, vigencia, porcentaje, datetime.now().strftime('%d/%m/%Y'))
    pdf.ln(10)
    pdf.guia()
    pdf.output(ruta_pdf)
    print(f"Contrato PDF generado en: {ruta_pdf}")

# Ejemplo de integración:
# generar_contrato_carbono_pdf('Juan Pérez', '1234567890', 'Lote 5', 'Proyecto MELANTIA Carbono', 5, 60, 'contrato_juan_perez.pdf')

# El sistema debe guiar al usuario para tomar la foto/video y registrar la aceptación digital junto al PDF generado.