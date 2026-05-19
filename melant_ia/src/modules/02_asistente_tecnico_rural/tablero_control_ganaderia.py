# Tablero de Control - Módulo Ganadería MELANT IA
import json

TABLERO_PATH = 'ganaderia/tablero_control_ganaderia.json'

def mostrar_tablero():
    with open(TABLERO_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print('\n=== TABLERO DE CONTROL GANADERÍA ===')
    for sec in data['secciones']:
        print(f'- {sec}')
    print('\nInventario de animales:', len(data['inventario_animales']))
    print('Eventos registrados:', len(data['eventos']))
    print('Alertas activas:', len(data['alertas']))
    print('Modo Ahorro de Energía:', 'Activo' if data['modo_ahorro'] else 'Inactivo')
    print('Última actualización:', data['ultima_actualizacion'])

if __name__ == "__main__":
    mostrar_tablero()
