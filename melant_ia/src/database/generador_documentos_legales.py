"""
Módulo: Generador de Documentos y Trámites Legales — MELANT IA

- Redacta borradores legales a partir de plantillas oficiales del Estado Ecuatoriano.
- Solicita datos al usuario (por voz o texto) y genera el documento listo para imprimir o compartir.
- Ofrece QR descargable para facilitar el trámite digital.
"""
import json
from pathlib import Path
from datetime import datetime
import qrcode
from PIL import Image, ImageDraw, ImageFont

def solicitar_datos_campos(campos):
    datos = {}
    for campo in campos:
        try:
            from main import entrada_por_voz
            valor = entrada_por_voz(f"{campo}:")
        except Exception:
            valor = input(f"{campo}: ")
        datos[campo] = valor
    return datos

def generar_qr_documento(texto, ruta):
    img = qrcode.make(texto)
    img.save(ruta)
    print(f"QR generado en: {ruta}")

def guardar_documento(nombre, contenido):
    carpeta = Path("documentos_legales")
    carpeta.mkdir(exist_ok=True)
    archivo = carpeta / f"{nombre}_{datetime.now().strftime('%Y%m%d_%H%M')}.txt"
    with open(archivo, "w", encoding="utf-8") as f:
        f.write(contenido)
    print(f"Documento guardado en: {archivo}")
    return archivo

def plantilla_denuncia_perdida():
    campos = ["Nombre completo", "Cédula", "Tipo de documento perdido", "Lugar y fecha de pérdida", "Descripción breve"]
    datos = solicitar_datos_campos(campos)
    doc = f"""
DENUNCIA POR PÉRDIDA DE DOCUMENTOS
Consejo de la Judicatura

Yo, {datos['Nombre completo']} (C.I. {datos['Cédula']}), denuncio la pérdida de mi {datos['Tipo de documento perdido']} el día {datos['Lugar y fecha de pérdida']}. Descripción: {datos['Descripción breve']}.

Solicito se registre la presente para los fines legales pertinentes.

Firma:
________________________
Fecha: {datetime.now().strftime('%Y-%m-%d')}
"""
    return doc

def plantilla_contrato_vehiculo():
    campos = ["Nombre comprador", "Cédula comprador", "Nombre vendedor", "Cédula vendedor", "Marca y modelo", "Placa", "Valor"]
    datos = solicitar_datos_campos(campos)
    doc = f"""
CONTRATO DE COMPRA-VENTA DE VEHÍCULO

Entre {datos['Nombre vendedor']} (C.I. {datos['Cédula vendedor']}) y {datos['Nombre comprador']} (C.I. {datos['Cédula comprador']}) se acuerda la venta del vehículo {datos['Marca y modelo']} placa {datos['Placa']} por un valor de ${datos['Valor']}.

Ambas partes aceptan las condiciones según el Código Civil.

Firmas:
________________________
________________________
Fecha: {datetime.now().strftime('%Y-%m-%d')}
"""
    return doc

def plantilla_denuncia_violencia():
    campos = ["Nombre denunciante", "Cédula", "Nombre agresor", "Relación", "Descripción de hechos", "Fecha y lugar"]
    datos = solicitar_datos_campos(campos)
    doc = f"""
DENUNCIA DE VIOLENCIA DOMÉSTICA
Unidad Judicial de Violencia contra la Mujer y la Familia

Yo, {datos['Nombre denunciante']} (C.I. {datos['Cédula']}), denuncio a {datos['Nombre agresor']} ({datos['Relación']}) por los siguientes hechos: {datos['Descripción de hechos']}.
Ocurrido el {datos['Fecha y lugar']}.

Solicito protección y medidas cautelares.

Firma:
________________________
Fecha: {datetime.now().strftime('%Y-%m-%d')}
"""
    return doc

def plantilla_conflicto_linderos():
    campos = ["Nombre solicitante", "Cédula", "Nombre vecino", "Descripción del conflicto", "Ubicación del predio"]
    datos = solicitar_datos_campos(campos)
    doc = f"""
CARTA DE MEDIACIÓN POR CONFLICTO DE LINDEROS

Yo, {datos['Nombre solicitante']} (C.I. {datos['Cédula']}), solicito mediación comunitaria con {datos['Nombre vecino']} por el siguiente conflicto: {datos['Descripción del conflicto']}.
Ubicación: {datos['Ubicación del predio']}.

Solicito intervención de la autoridad local.

Firma:
________________________
Fecha: {datetime.now().strftime('%Y-%m-%d')}
"""
    return doc

def generar_certificado_practica(nombre_productor, nombre_curso, fecha, coordenadas, logo_path="assets/logo_melant_ia.png"):
    """
    Genera un certificado PDF/JPG con logo MELANT IA y QR de validación en una esquina.
    """
    # 1. Crear imagen base
    width, height = 900, 600
    certificado = Image.new("RGB", (width, height), (255, 255, 255))
    draw = ImageDraw.Draw(certificado)
    # 2. Logo MELANT IA
    if os.path.exists(logo_path):
        logo = Image.open(logo_path).convert("RGBA")
        logo.thumbnail((120, 120))
        certificado.paste(logo, (40, 40), logo)
    # 3. Texto principal
    try:
        font_title = ImageFont.truetype("arial.ttf", 38)
        font_body = ImageFont.truetype("arial.ttf", 24)
    except:
        font_title = ImageFont.load_default()
        font_body = ImageFont.load_default()
    draw.text((200, 60), "CERTIFICADO DE PRÁCTICA SOSTENIBLE", (0, 70, 0), font=font_title)
    draw.text((60, 180), f"Otorgado a: {nombre_productor}", (0, 0, 0), font=font_body)
    draw.text((60, 230), f"Curso: {nombre_curso}", (0, 0, 0), font=font_body)
    draw.text((60, 280), f"Fecha: {fecha}", (0, 0, 0), font=font_body)
    draw.text((60, 330), f"Coordenadas: {coordenadas}", (0, 0, 0), font=font_body)
    # 4. QR de validación
    texto_qr = f"MELANT IA | {nombre_productor} | {nombre_curso} | {fecha}"
    qr = qrcode.make(texto_qr)
    qr = qr.resize((120, 120))
    certificado.paste(qr, (width - 160, height - 160))
    # 5. Guardar
    carpeta = Path("documentos_legales")
    carpeta.mkdir(exist_ok=True)
    nombre_archivo = f"certificado_{nombre_productor}_{fecha.replace('-', '')}.jpg"
    ruta_certificado = carpeta / nombre_archivo
    certificado.save(ruta_certificado)
    print(f"Certificado generado en: {ruta_certificado}")
    return ruta_certificado

def menu_generador_documentos():
    while True:
        print("\n=== GENERADOR DE DOCUMENTOS LEGALES ===")
        print("1. Denuncia por pérdida de documentos")
        print("2. Contrato de compra-venta de vehículo/maquinaria")
        print("3. Denuncia de violencia doméstica")
        print("4. Carta de mediación por linderos")
        print("5. Volver al menú principal")
        opcion = input("¿Desea que MELANT IA le ayude a preparar el documento? (1-5): ").strip()
        if opcion == "1":
            doc = plantilla_denuncia_perdida()
        elif opcion == "2":
            doc = plantilla_contrato_vehiculo()
        elif opcion == "3":
            doc = plantilla_denuncia_violencia()
        elif opcion == "4":
            doc = plantilla_conflicto_linderos()
        elif opcion == "5":
            break
        else:
            print("Opción no válida.")
            continue
        archivo = guardar_documento("documento_legal", doc)
        generar_qr_documento(doc, str(archivo) + ".qr.png")
        print("Documento listo para imprimir o compartir por celular.")
        input("Presiona Enter para continuar...")
