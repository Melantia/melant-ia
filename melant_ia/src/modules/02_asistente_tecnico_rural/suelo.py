_fuente_ = "INIAP 2024"
def obtener_protocolo(hallazgo_usuario):
    # Ejemplo simple: si el hallazgo es "baja materia organica" o similar
    if "materia organica" in hallazgo_usuario.lower():
        return "Aplicar compost, bocashi y aumentar cobertura con rastrojo."
    elif "suelo degradado" in hallazgo_usuario.lower():
        return "Intervención urgente: Microorganismos de montaña y mucha materia orgánica."
    else:
        return "Consulta análisis de laboratorio para diagnóstico específico."
# suelo.py
# Calculadora de Fertilidad Orgánica para diagnóstico rápido en campo

def calcular_fertilidad_organica(materia_organica, cobertura, presencia_vida):
    """
    Inputs sugeridos (Escala 1-5):
    - materia_organica: ¿Qué tan oscura es la tierra?
    - cobertura: % de suelo cubierto por rastrojo.
    - presencia_vida: ¿Ves lombrices o insectos benéficos?
    """
    puntaje = materia_organica + cobertura + presencia_vida
    
    if puntaje >= 12:
        estado = "🥇 EXCELENTE: Suelo vivo y fértil. Solo mantén la cobertura."
        recomendacion = "No requiere abonos pesados, solo mantenimiento."
    elif puntaje >= 7:
        estado = "🥈 REGULAR: Falta actividad biológica o carbono."
        recomendacion = "Aplica compost o bocashi y aumenta el rastrojo."
    else:
        estado = "🚨 CRÍTICO: Suelo degradado o inerte."
        recomendacion = "Intervención urgente: Microorganismos de montaña y mucha materia orgánica."

    return f"🌱 ESTADO DEL SUELO: {estado}\n🛠️ ACCIÓN: {recomendacion}"
