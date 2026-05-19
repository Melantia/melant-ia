import math
from typing import List, Dict

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000  # Radio de la Tierra en metros
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

def generar_svg_plano(coords: List[Dict]):
    puntos = normalizar_coordenadas(coords)
    puntos_str = ' '.join(f"{int(x)},{int(y)}" for x, y in puntos)
    svg = [
        '<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">',
        '  <defs>',
        '    <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">',
        '      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#ccc" stroke-width="0.5"/>',
        '    </pattern>',
        '  </defs>',
        '  <rect width="100%" height="100%" fill="url(#grid)" />',
        f'  <polyline points="{puntos_str}" fill="rgba(76,175,80,0.2)" stroke="#2E7D32" stroke-width="3" />'
    ]
    # Etiquetas de distancia y vértices
    for i in range(len(puntos)-1):
        x1, y1 = puntos[i]
        x2, y2 = puntos[i+1]
        dist = haversine(coords[i]['lat'], coords[i]['lng'], coords[i+1]['lat'], coords[i+1]['lng'])
        xm, ym = (x1+x2)/2, (y1+y2)/2
        svg.append(f'<text x="{int(xm)}" y="{int(ym)-8}" font-size="12" fill="black">{dist:.1f} m</text>')
    for idx, (x, y) in enumerate(puntos):
        svg.append(f'<circle cx="{int(x)}" cy="{int(y)}" r="7" fill="#fff" stroke="#2E7D32" stroke-width="2" />')
        svg.append(f'<text x="{int(x)}" y="{int(y)+5}" font-size="13" fill="#2E7D32">P{idx+1}</text>')
    svg.append('</svg>')
    return '\n'.join(svg)

# Ejemplo de uso:
if __name__ == '__main__':
    coords = [
        {"lat": -0.2745, "lng": -79.4632},
        {"lat": -0.2750, "lng": -79.4630},
        {"lat": -0.2755, "lng": -79.4640},
        {"lat": -0.2745, "lng": -79.4632}
    ]
    svg = generar_svg_plano(coords)
    with open('plano_tecnico.svg', 'w', encoding='utf-8') as f:
        f.write(svg)
    print('SVG generado: plano_tecnico.svg')
