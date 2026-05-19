import math

def calcular_area_poligono(puntos):
    """
    Usa la fórmula de Gauss para calcular el área en metros cuadrados
    a partir de una lista de puntos [(lat, lon), (lat, lon)...]
    """
    if len(puntos) < 3:
        return 0
    area = 0.0
    R = 6378137  # Radio de la tierra en metros
    def proyectar(lat, lon):
        x = R * math.radians(lon) * math.cos(math.radians(lat))
        y = R * math.radians(lat)
        return x, y
    puntos_planos = [proyectar(p[0], p[1]) for p in puntos]
    n = len(puntos_planos)
    for i in range(n):
        j = (i + 1) % n
        area += puntos_planos[i][0] * puntos_planos[j][1]
        area -= puntos_planos[j][0] * puntos_planos[i][1]
    area = abs(area) / 2.0
    return round(area / 10000, 2)  # Devuelve Hectáreas
