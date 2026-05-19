# Tablero de Control - Paso Fino MELANT IA
import json

TABLERO_PATH = 'paso_fino/normativas_paso_fino.json'

def mostrar_tablero():
    with open(TABLERO_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print('\n=== TABLERO DE CONTROL PASO FINO ===')
    for sec in data['secciones']:
        logo = data['logos'].get(sec.split()[0].lower(), '🐎')
        print(f'{logo} {sec}')
    print('\nÚltima actualización:', data['ultima_actualizacion'])

if __name__ == "__main__":
    mostrar_tablero()
