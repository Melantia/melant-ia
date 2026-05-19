from cacao_regenerativo import obtener_bloque_cacao
from voz_ia import hablar_mensaje

# Ejemplo: Recitar información general del cacao
bloque = obtener_bloque_cacao("informacion_general")
for frase in bloque:
    hablar_mensaje(frase)
