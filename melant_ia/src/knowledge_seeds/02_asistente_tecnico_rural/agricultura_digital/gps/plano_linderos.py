import math
from typing import List, Dict

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return 2 * R * math.asin(math.sqrt(a))

def normalizar_coordenadas(coords: List[Dict], ancho=500, alto=500, margen=40):
    lats = [p['lat'] for p in coords]
    lngs = [p['lng'] for p in coords]
    min_lat, max_lat = min(lats), max(lats)
    min_lng, max_lng = min(lngs), max(lngs)
    def norm(p):
        x = margen + (p['lng'] - min_lng) / (max_lng - min_lng + 1e-9) * (ancho - 2*margen)
        y = margen + (max_lat - p['lat']) / (max_lat - min_lat + 1e-9) * (alto - 2*margen)
        return x, y
    return [norm(p) for p in coords]


def generar_svg_plano(coords: List[Dict], linderos: List[str], utm_coords: List[Dict]=None):
    puntos = normalizar_coordenadas(coords)
    puntos_str = ' '.join(f"{int(x)},{int(y)}" for x, y in puntos)
    svg = [
        '<svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg">',
        '  <defs>',
        '    <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">',
        '      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#ccc" stroke-width="0.5"/>',
        '    </pattern>',
        '  </defs>',
        '  <rect width="500" height="100%" fill="url(#grid)" />',
        f'  <polyline points="{puntos_str}" fill="rgba(76,175,80,0.2)" stroke="#2E7D32" stroke-width="3" />'
    ]
    # Etiquetas de distancia, vértices y linderos
    for i in range(len(puntos)-1):
        x1, y1 = puntos[i]
        x2, y2 = puntos[i+1]
        dist = haversine(coords[i]['lat'], coords[i]['lng'], coords[i+1]['lat'], coords[i+1]['lng'])
        xm, ym = (x1+x2)/2, (y1+y2)/2
        svg.append(f'<text x="{int(xm)}" y="{int(ym)-16}" font-size="13" fill="black">{dist:.1f} m</text>')
        if linderos and i < len(linderos):
            svg.append(f'<text x="{int(xm)}" y="{int(ym)+8}" font-size="13" fill="#1565C0">{linderos[i]}</text>')
    for idx, (x, y) in enumerate(puntos):
        svg.append(f'<circle cx="{int(x)}" cy="{int(y)}" r="7" fill="#fff" stroke="#2E7D32" stroke-width="2" />')
        svg.append(f'<text x="{int(x)}" y="{int(y)+5}" font-size="13" fill="#2E7D32">P{idx+1}</text>')
    # Tabla de coordenadas y linderos
    if utm_coords:
        tabla_x = 520
        tabla_y = 40
        svg.append(f'<rect x="{tabla_x-10}" y="{tabla_y-30}" width="260" height="{30+30*len(utm_coords)}" fill="#fff" stroke="#888" stroke-width="1" rx="8"/>' )
        svg.append(f'<text x="{tabla_x+5}" y="{tabla_y-10}" font-size="15" fill="#222" font-weight="bold">Cuadro de Coordenadas y Linderos</text>')
        svg.append(f'<text x="{tabla_x}" y="{tabla_y+5}" font-size="13" fill="#222">Vértice   Distancia   Lindero   Este(X)   Norte(Y)   Zona</text>')
        for i, p in enumerate(utm_coords):
            dist = ''
            if i < len(utm_coords)-1:
                dist = f"{haversine(coords[i]['lat'], coords[i]['lng'], coords[i+1]['lat'], coords[i+1]['lng']):.1f}"
            lind = linderos[i] if linderos and i < len(linderos) else ''
            svg.append(f'<text x="{tabla_x}" y="{tabla_y+30+30*i}" font-size="14" fill="#333">P{i+1}   {dist}   {lind}   {p["utm_x"]}   {p["utm_y"]}   {p["zona"]}</text>')
    svg.append('</svg>')
    return '\n'.join(svg)

# --- Captura/edición de linderos ---
def capturar_linderos(n):
    print("Ingrese el lindero para cada lado del polígono:")
    linderos = []
    for i in range(n):
        txt = input(f"Lindero del lado P{i+1}-P{i+2 if i+2<=n else 1}: ")
        linderos.append(txt)
    return linderos

# --- Ejemplo de uso ---
if __name__ == '__main__':
    coords = [
        {"lat": -0.2745, "lng": -79.4632},
        {"lat": -0.2750, "lng": -79.4630},
        {"lat": -0.2755, "lng": -79.4640},
        {"lat": -0.2745, "lng": -79.4632}
    ]
    linderos = ["Camino vecinal", "Finca Sosa", "Quebrada", "Camino vecinal"]
    utm_coords = [
        {"utm_x": 671042.32, "utm_y": 9969645.15, "zona": "17S"},
        {"utm_x": 671087.52, "utm_y": 9969647.10, "zona": "17S"},
        {"utm_x": 671112.10, "utm_y": 9969620.25, "zona": "17S"},
        {"utm_x": 671042.32, "utm_y": 9969645.15, "zona": "17S"}
    ]
    svg = generar_svg_plano(coords, linderos, utm_coords)
    with open('plano_tecnico_linderos_tabla.svg', 'w', encoding='utf-8') as f:
        f.write(svg)
    print('SVG generado: plano_tecnico_linderos_tabla.svg')
