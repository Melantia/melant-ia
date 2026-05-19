// Archivo eliminado por limpieza de voces innecesarias.

from modules.ia.motor_inferencia import motor_inferencia


def procesar_comando_total(texto_escuchado):
    comando = texto_escuchado.lower()

    # Módulo Veterinario
    if "vaca" in comando or "chancho" in comando or "veterinario" in comando:
        return "Navegando a Asistente Veterinario..." # Aquí llamas al módulo correspondiente

    # Módulo de Finanzas
    elif "dinero" in comando or "gastos" in comando:
        return "Abriendo tus Finanzas Personales..."

    # Módulo Agronómico (el que ya hicimos)
    elif "siembra" in comando or "cultivo" in comando or "ph" in comando:
        # Aquí conectas con asistente_tecnico_rural
        return motor_inferencia.consultar_campo(comando)

    else:
        return "No estoy seguro de qué módulo necesitas. ¿Quieres hablar con el veterinario o ver tus finanzas?"
    