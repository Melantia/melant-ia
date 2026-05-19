"""
Módulo: Ciudadano Rural — MELANT IA

- Acceso offline a toda la base informativa legal, educativa y de trámites.
- Unifica leyes, cursos, documentos y directorios útiles para el productor y su familia.
"""
from pathlib import Path
import os
import json
import wave
import contextlib

def cargar_glosario_tsafiki():
    """Carga el glosario base y las correcciones aprendidas, priorizando las correcciones."""
    base_path = "conocimiento/tsafiki_glosario.json"
    aprendido_path = "conocimiento/aprendido_tsafiki.json"
    def mostrar_menu_ciudadano():
        print("Idiomas disponibles: tsafiki, shuar, quichua, english")
        idioma = input("Idioma para aprendizaje (por defecto tsafiki): ").strip().lower() or "tsafiki"
        glosario = cargar_glosario_idioma(idioma)
        while True:
            print(f"\n=== CIUDADANO RURAL — MELANT IA ({idioma.upper()}) ===")
            print("1. Leyes y Normativa (offline)")
            print("2. Cursos Gratuitos de Leyes")
            print("3. Generador de Documentos y Trámites")
            print("4. Directorio de Justicia y Defensoría")
            print("5. Trámites ANT y Movilidad")
            print("6. Gestión Institucional y Programas Sociales")
            print("7. Volver al menú principal")
            print(f"8. Corregir frase en {idioma} (aprendizaje)")
            print(f"9. Grabar audio de frase en {idioma} (aprendizaje oral)")
            opcion = input("Selecciona una opción: ").strip()
            if opcion == "1":
                mostrar_leyes_offline()
            elif opcion == "2":
                try:
                    import cursos_leyes
                    cursos_leyes.menu_cursos_leyes()
                except Exception:
                    print("No se pudo acceder a los cursos.")
            elif opcion == "3":
                try:
                    import generador_documentos_legales
                    generador_documentos_legales.menu_generador_documentos()
                except Exception:
                    print("No se pudo acceder al generador de documentos.")
            elif opcion == "4":
                try:
                    import asesoria_legal
                    asesoria_legal.mostrar_directorio_justicia()
                except Exception:
                    print("No se pudo acceder al directorio.")
            elif opcion == "5":
                menu_tramites_ant()
            elif opcion == "6":
                menu_gestion_institucional()
            elif opcion == "7":
                break
            elif opcion == "8":
                print("Secciones disponibles:", list(glosario.keys()))
                seccion = input("Sección a corregir (ej: interfaz, servicios_rurales): ").strip()
                if seccion not in glosario:
                    print("Sección no encontrada.")
                    continue
                print("Claves disponibles:", list(glosario[seccion].keys()))
                clave = input("Clave a corregir: ").strip()
                if clave not in glosario[seccion]:
                    print("Clave no encontrada.")
                    continue
                print(f"Frase actual: {glosario[seccion][clave]}")
                nueva = input(f"Nueva frase en {idioma}: ").strip()
                guardar_correccion_idioma(idioma, seccion, clave, nueva)
                print("¡Corrección guardada! Será priorizada en futuras consultas.")
            elif opcion == "9":
                print("Secciones disponibles:", list(glosario.keys()))
                seccion = input("Sección para grabar audio (ej: interfaz, servicios_rurales): ").strip()
                if seccion not in glosario:
                    print("Sección no encontrada.")
                    continue
                print("Claves disponibles:", list(glosario[seccion].keys()))
                clave = input("Clave para grabar audio: ").strip()
                if clave not in glosario[seccion]:
                    print("Clave no encontrada.")
                    continue
                print(f"Grabe el audio para la frase: {glosario[seccion][clave]}")
                grabar_audio_idioma(idioma, seccion, clave)
                print("¡Audio guardado! Será usado para aprendizaje oral.")
            else:
                print("Opción no válida.")
        fs = 44100  # Frecuencia de muestreo
        duracion = 5  # segundos
        print("Grabando... Hable ahora.")
        audio = sd.rec(int(duracion * fs), samplerate=fs, channels=1, dtype='int16')
        sd.wait()
        carpeta = "conocimiento/audios_tsafiki"
        os.makedirs(carpeta, exist_ok=True)
        archivo = os.path.join(carpeta, f"{seccion}_{clave}.wav")
        write(archivo, fs, audio)
        print(f"Audio guardado en: {archivo}")
    except Exception as e:
        print(f"No se pudo grabar el audio: {e}")
                generador_documentos_legales.menu_generador_documentos()
            except Exception:
                print("No se pudo acceder al generador de documentos.")
        elif opcion == "4":
            try:
                import asesoria_legal
                asesoria_legal.mostrar_directorio_justicia()
            except Exception:
                print("No se pudo acceder al directorio.")
        elif opcion == "5":
            menu_tramites_ant()
        elif opcion == "6":
            menu_gestion_institucional()
        elif opcion == "7":
            break
        elif opcion == "8":
            print("Secciones disponibles:", list(glosario.keys()))
            seccion = input("Sección a corregir (ej: interfaz, servicios_rurales): ").strip()
            if seccion not in glosario:
                print("Sección no encontrada.")
                continue
            print("Claves disponibles:", list(glosario[seccion].keys()))
            clave = input("Clave a corregir: ").strip()
            if clave not in glosario[seccion]:
                print("Clave no encontrada.")
                continue
            print(f"Frase actual: {glosario[seccion][clave]}")
            nueva = input("Nueva frase en tsafiki: ").strip()
            guardar_correccion_tsafiki(seccion, clave, nueva)
            print("¡Corrección guardada! Será priorizada en futuras consultas.")
        else:
            print("Opción no válida.")

def mostrar_leyes_offline():
    ruta = Path("conocimiento/leyes/")
    if not ruta.exists():
        print("No hay leyes descargadas. Use la sincronización legal.")
        return
    print("\n=== LEYES Y NORMATIVA DISPONIBLES OFFLINE ===")
    for archivo in ruta.glob("*.pdf"):
        print(f"- {archivo.name}")
    input("Presiona Enter para continuar...")

def menu_tramites_ant():
    print("\n=== TRÁMITES ANT Y MOVILIDAD ===")
    print("1. Consultar multas y estado de licencia (requiere internet)")
    print("2. Denuncia por pérdida de documentos")
    print("3. Enlace a pasarela de pagos de multas")
    print("4. Mapa a agencia de tránsito más cercana")
    print("5. Volver")
    opcion = input("Selecciona una opción: ").strip()
    if opcion == "1":
        print("Consulta en línea: https://www.ant.gob.ec/consulta-de-multas/")
    elif opcion == "2":
        try:
            import generador_documentos_legales
            doc = generador_documentos_legales.plantilla_denuncia_perdida()
            archivo = generador_documentos_legales.guardar_documento("denuncia_perdida", doc)
            generador_documentos_legales.generar_qr_documento(doc, str(archivo) + ".qr.png")
        except Exception:
            print("No se pudo generar la denuncia.")
    elif opcion == "3":
        print("Enlace pagos: https://www.ant.gob.ec/pagos/")
    elif opcion == "4":
        print("(Simulación) Mostrando mapa a la agencia de tránsito más cercana al GPS maestro...")
    else:
        print("Volviendo...")
    input("Presiona Enter para continuar...")

def menu_gestion_institucional():
    print("\n=== GESTIÓN INSTITUCIONAL Y PROGRAMAS SOCIALES ===")
    print("1. Fortalecimiento Asociativo (MAG/MIES)")
    print("2. Vivienda Rural - Casa para Todos (MIDUVI)")
    print("3. Vigilante de Programas Gubernamentales")
    print("4. Asistente de Postulación Inteligente a Programas Estatales")
    print("5. 🏘️ Desarrollo Social y Financiero (Vivienda/Crédito)")
    print("6. Web Scraper de Programas (gob.ec)")
    print("7. Generador de Carpeta Digital (Dossier)")
    print("8. Ir a la oficina técnica más cercana (MAG/MIDUVI/BanEcuador)")
    print("9. Volver")
    opcion = input("Selecciona una opción: ").strip()
    if opcion == "1":
        print("\nAsociaciones de Primer Grado: Mínimo 10-15 socios, Acta Constitutiva, Estatutos, Directiva. Registro en MAG (SUT).\nAsociaciones de Segundo Grado: Unión de 2+ asociaciones con personería jurídica. Objetivo: acopio, exportación, compras públicas.")
        print("Guía oficial: https://www.mag.gob.ec/organizaciones-productivas/")
    elif opcion == "2":
        print("\nRequisitos Casa para Todos (MIDUVI):\n- Registro Social (MIES)\n- Terreno propio legalizado\n- No tener otra vivienda\n- Ingresos bajos/medios\nGuía oficial: https://www.habitatyvivienda.gob.ec/casa-para-todos/")
    elif opcion == "3":
        vigilante_programas_scraper()
    elif opcion == "4":
        asistente_postulacion_programas()
    elif opcion == "5":
        menu_desarrollo_social_financiero()
    elif opcion == "6":
        vigilante_programas_scraper()
    elif opcion == "7":
        generador_carpeta_digital()
    elif opcion == "8":
        geolocalizar_oficina_tecnica()
    else:
        print("Volviendo...")
    input("Presiona Enter para continuar...")

# --- Políticas de eficiencia del sistema ---
# - Cero Latencia: El motor de IA responde en <2s (WebSockets, fuera del CLI)
# - Bajo Consumo de Batería: GPS solo se activa al tomar foto para Ancla Geográfica
# - Sincronización Selectiva: Solo texto en 3G, fotos solo en Wi-Fi/4G

def geolocalizar_oficina_tecnica():
    print("\n=== OFICINA TÉCNICA MÁS CERCANA ===")
    # Simulación: en producción, usar GPS real y base de direcciones
    sedes = []
    try:
        from main import cargar_sedes
        sedes = cargar_sedes()
    except Exception:
        pass
    if not sedes or not sedes[0].get("gps"):
        print("Registra tu sede productiva y GPS maestro para usar esta función.")
        return
    lat = sedes[0]["gps"].get("lat")
    lon = sedes[0]["gps"].get("lon")
    # Simulación de búsqueda de oficinas
    oficinas = [
        {"nombre": "MAG - Oficina Distrital", "lat": "-2.170998", "lon": "-79.922359", "direccion": "Guayaquil, Av. 9 de Octubre 200"},
        {"nombre": "MIDUVI - Oficina Técnica", "lat": "-2.149187", "lon": "-79.964735", "direccion": "Guayaquil, Av. del Bombero 100"},
        {"nombre": "BanEcuador - Sucursal", "lat": "-2.183333", "lon": "-80.0", "direccion": "Guayaquil, Av. Francisco de Orellana 300"}
    ]
    # Selección simple (en producción: calcular distancia real)
    print("Oficinas técnicas disponibles:")
    for o in oficinas:
        print(f"- {o['nombre']}: {o['direccion']} (Lat: {o['lat']}, Lon: {o['lon']})")
    print("\nDirígete a la oficina más cercana según tu ubicación.")
    input("Presiona Enter para continuar...")

def menu_desarrollo_social_financiero():
    print("\n=== 🏘️ DESARROLLO SOCIAL Y FINANCIERO ===")
    perfil = cargar_perfil_usuario()
    es_mujer = perfil.get("genero", "").lower() == "femenino"
    if es_mujer:
        print("\033[93m\u2B50 Beneficio Exclusivo: Crédito Súper Mujer Rural (BanEcuador) \u2B50\033[0m")
        print("\033[93m[Botón Dorado]\033[0m Solicitar Crédito Súper Mujer Rural")
        print("\n- Monto: $1,000 a $10,000 sin garante (según calificación)")
        print("- Tasa: 1% anual (el más bajo del mercado)")
        print("- Perfil: Mujeres del sector agropecuario\n")
        print("Más información: https://www.banecuador.fin.ec/super-mujer-rural/")
    print("1. Crédito Productivo BanEcuador")
    print("2. Crédito Vivienda MIDUVI")
    print("3. Crédito Joven Rural")
    print("4. Volver")
    opcion = input("Selecciona una opción: ").strip()
    if es_mujer and opcion == "1":
        print("\nHas seleccionado el Crédito Súper Mujer Rural.\nRequisitos: Ser mujer, actividad agropecuaria, calificación crediticia.\nSolicita en BanEcuador con tu cédula y certificado de actividad.")
    elif opcion == "1":
        print("\nCrédito Productivo BanEcuador: Desde $1,000, tasa preferencial, requisitos estándar.")
    elif opcion == "2":
        print("\nCrédito Vivienda MIDUVI: Para compra/construcción de vivienda rural. Requisitos: Registro Social, terreno legalizado.")
    elif opcion == "3":
        print("\nCrédito Joven Rural: Para jóvenes de 18 a 29 años, condiciones preferentes.")
    else:
        print("Volviendo...")
    input("Presiona Enter para continuar...")

def cargar_perfil_usuario():
    # Simulación: en producción, cargar desde base de datos o archivo
    try:
        import json
        with open("perfil_usuario.json", "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        # Por defecto, género femenino para pruebas
        return {"nombre": "Productora Rural", "genero": "femenino"}

def asistente_vivienda_miduvi():
    print("\n=== Asistente de Vivienda Rural (MIDUVI) ===")
    print("Este asistente evalúa tu elegibilidad para el programa de vivienda rural y genera una ficha de pre-factibilidad para entregar en la oficina técnica del MIDUVI.")
    # 1. Validación de Tenencia
    tiene_escrituras = input("¿Tienes escrituras registradas del terreno? (s/n): ").strip().lower() == "s"
    # 2. Ancla Geográfica (simulado)
    zona_riesgo = input("¿Tu lote está en zona de riesgo (inundaciones/deslaves)? (s/n): ").strip().lower() == "s"
    # 3. Cuestionario Social
    hijos = input("¿Cuántos hijos menores tienes?: ").strip()
    adultos_mayores = input("¿Cuántos adultos mayores viven contigo?: ").strip()
    luz = input("¿Tienes acceso a luz eléctrica? (s/n): ").strip().lower() == "s"
    agua = input("¿Tienes acceso a agua potable? (s/n): ").strip().lower() == "s"
    pozo = input("¿Tienes pozo séptico? (s/n): ").strip().lower() == "s"
    # Resultado
    print("\n--- FICHA DE PRE-FACTIBILIDAD (SIMULADA) ---")
    print(f"Tenencia legal: {'Sí' if tiene_escrituras else 'No'}")
    print(f"Zona de riesgo: {'Sí' if zona_riesgo else 'No'}")
    print(f"Hijos menores: {hijos}")
    print(f"Adultos mayores: {adultos_mayores}")
    print(f"Servicios: Luz={'Sí' if luz else 'No'}, Agua={'Sí' if agua else 'No'}, Pozo={'Sí' if pozo else 'No'}")
    print("\nLleva esta ficha y tus documentos a la oficina técnica del MIDUVI más cercana. MELANT IA solo asesora, no garantiza la aprobación del beneficio.")
    input("Presiona Enter para continuar...")

def asistente_credito_banecuador():
    print("\n=== Asistente de Crédito Agrícola (BanEcuador) ===")
    print("Este asistente te ayuda a preparar la carpeta para créditos de interés social (1% / 30 años) para asociaciones y pequeños productores.")
    print("⚠️ MELANT IA solo asesora en la preparación, no garantiza la aprobación del crédito.")
    # Certificado de Productor
    print("\n1. Certificado de Productor:")
    print("- Genera el reporte de las 24 fotos de evidencia desde el módulo de inventario/productivo.")
    print("- Asegúrate de que las fotos estén etiquetadas con fecha, sede y cultivo.")
    # Plan de Inversión
    print("\n2. Plan de Inversión:")
    plan = input("¿En qué invertirás el crédito? (ej: insumos, riego, maquinaria): ")
    print(f"Plan de inversión registrado: {plan}")
    # Récord de Sede
    print("\n3. Récord de Sede:")
    print("- Descarga el historial climático y productivo desde la app para avalar la viabilidad del proyecto.")
    print("\nDocumentos recomendados para la carpeta:")
    print("- Copia de cédula del solicitante y socios (si aplica)")
    print("- Certificado de Productor (reporte de fotos)")
    print("- Plan de Inversión (este documento)")
    print("- Récord de Sede (historial climático/productivo)")
    print("- Estatutos y acta constitutiva (si es asociación)")
    print("- Certificado de no adeudar al SRI/IESS")
    print("\nLleva esta carpeta a BanEcuador. MELANT IA solo asesora, no garantiza la aprobación.")

def asistente_postulacion_programas():
    print("\n=== ASISTENTE DE POSTULACIÓN INTELIGENTE ===")
    print("Este asistente te ayuda a armar tu carpeta para postular a programas estatales, cruzando los datos de tus sedes productivas con los requisitos oficiales.")
    print("⚠️ AVISO: MELANT IA solo asesora en la preparación de la carpeta. No garantiza la aprobación del crédito o beneficio.")
    try:
        from main import cargar_sedes
        sedes = cargar_sedes()
    except Exception:
        sedes = []
    if not sedes:
        print("Primero registra tus sedes productivas en el menú de gestión productiva.")
        return
    print("\nTus sedes productivas:")
    for i, sede in enumerate(sedes, 1):
        print(f"{i}. {sede.get('nombre','-')} | GPS: {sede.get('gps','-')}")
    print("\nEjemplo de carpeta recomendada:")
    print("- Copia de cédula del titular y socios (si aplica)")
    print("- Certificado de propiedad o legalización del terreno")
    print("- Registro Social actualizado (MIES)")
    print("- Acta Constitutiva y Estatutos (si es asociación)")
    print("- Certificado de no poseer otra vivienda (MIDUVI)")
    print("- Historial de actividades productivas (descargable desde la app)")
    print("- Inventario productivo (descargable desde la app)")
    print("- Fotos de la sede/producto (opcional)")
    print("\nPuedes descargar estos documentos desde los módulos de Inventario, Historial y Sedes Productivas.")
    print("Lleva esta carpeta a la entidad correspondiente para formalizar tu postulación.")
    input("Presiona Enter para continuar...")

def vigilante_programas_scraper():
    print("\n=== VIGILANTE DE PROGRAMAS (Web Scraper) ===")
    print("(Simulación) Monitoreando https://www.gob.ec/programas-sociales para nuevos bonos/créditos...")
    # Simulación de scraping y coincidencia de perfil
    time.sleep(1)
    # Aquí se haría scraping real y matching con perfil del usuario
    perfil_coincide = True  # Simulación
    if perfil_coincide:
        print("¡Nuevo programa disponible que coincide con tu perfil!\nNotificación enviada.")
    else:
        print("No hay nuevos programas relevantes para tu perfil.")
    input("Presiona Enter para continuar...")

def generador_carpeta_digital():
    print("\n=== GENERADOR DE CARPETA DIGITAL (DOSSIER) ===")
    print("La app compilará los documentos clave en un archivo ZIP para tu postulación.")
    # Simulación de rutas de archivos
    docs = [
        "perfil/cedula.pdf",
        "perfil/votacion.pdf",
        "conocimiento/leyes/Certificado_Propiedad.pdf",
        "sedes_productivas.json",
        "fotos_predio/identificacion1.jpg",
        "fotos_predio/identificacion2.jpg",
        "formulario_solicitud.txt"
    ]
    zip_path = f"dossier_postulacion_{int(time.time())}.zip"
    with zipfile.ZipFile(zip_path, 'w') as zipf:
        for doc in docs:
            if os.path.exists(doc):
                zipf.write(doc)
    print(f"Carpeta digital generada: {zip_path}\nPuedes enviarla por correo o presentar en ventanilla.")
    input("Presiona Enter para continuar...")
