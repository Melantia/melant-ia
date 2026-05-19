# guia_campo.py
# Módulo de Guía Rápida para IA - MELANT IA

GUIA_RAPIDA = {
    "ganaderia": {
        "pasto": "🌱 Regla de Oro: Si el pasto está bajo y tienes más de 3 animales por hectárea, rota el ganado hoy mismo para evitar la degradación del suelo.",
        "nutricion": "🐄 Tip de Lactancia: Asegura que las vacas tengan acceso a sales minerales y agua limpia después del ordeño para mantener la ganancia de peso.",
    },
    "agricultura": {
        "suelo": "🧪 Salud del Suelo: Si ves la tierra compacta, aplica materia orgánica y microorganismos. No uses químicos que maten la vida del suelo.",
        "plagas": "🦟 Control Bio: Ante presencia de insectos, usa biopreparados de ajo y ají. Monitorea el envés de las hojas cada mañana.",
    },
    "clima": {
        "hongos": "⚠️ Alerta de Hongos: Alta humedad detectada. Evita el riego foliar y mejora la ventilación del cultivo para prevenir ataques fúngicos.",
        "siembra": "📅 Calendario: Revisa la fase lunar. Siembra raíces en menguante y hojas en creciente para optimizar el vigor de la planta."
    }
}

def obtener_guia(tema, subtema):
    """Devuelve solo el fragmento necesario para consulta rápida por voz o mensaje corto."""
    return GUIA_RAPIDA.get(tema, {}).get(subtema, "No tengo esa información en mi cerebro aún.")
