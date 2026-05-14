# logica_difusa_agro.py

def calcular_riesgo(hallazgo_usuario):
    """
    Simulación: Devuelve un valor difuso entre 0 y 1 y una etiqueta de sentimiento.
    En producción, aquí iría tu lógica real basada en datos de sensores, visión, etc.
    """
    # Ejemplo simple para pruebas
    if "grave" in hallazgo_usuario.lower():
        return 0.85, "Crítico"
    elif "leve" in hallazgo_usuario.lower():
        return 0.2, "Estable"
    else:
        return 0.5, "En observación"

def mapear_tono_humano(valor_difuso):
    if valor_difuso < 0.3:
        return {
            "estado": "Estable",
            "frase_inicio": "¡Buenas noticias! Los indicadores están en un rango muy saludable.",
            "estilo": "Tranquilizador"
        }
    elif 0.3 <= valor_difuso < 0.7:
        return {
            "estado": "En observación",
            "frase_inicio": "He notado una ligera variación que merece nuestra atención para evitar problemas mayores.",
            "estilo": "Preventivo"
        }
    else:
        return {
            "estado": "Crítico",
            "frase_inicio": "Necesito que revisemos esto con urgencia; la situación en el campo parece delicada.",
            "estilo": "Alerta Empática"
        }
