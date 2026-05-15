import math
try:
	try:
		from plyer import gps  # Para Android
	except ImportError:
		# Mock gps for non-Android environments
		class MockGPS:
			@staticmethod
			def get_location():
				# Return a fixed location or None
				return {'lat': 0.0, 'lon': 0.0}
		gps = MockGPS()
except ImportError:
	# Mock gps for non-Android environments
	class MockGPS:
		@staticmethod
		def get_location():
			# Return a fixed location or None
			return {'lat': 0.0, 'lon': 0.0}
	gps = MockGPS()

class GPSManager:
	def __init__(self):
		self.puntos_poligono = []  # Lista de dicts: {'lat': ..., 'lon': ...}

	def marcar_punto_voz(self):
		# Captura latitud/longitud actual
		ubicacion = gps.get_location()  # {'lat': ..., 'lon': ...}
		if ubicacion and 'lat' in ubicacion and 'lon' in ubicacion:
			self.puntos_poligono.append({'lat': float(ubicacion['lat']), 'lon': float(ubicacion['lon'])})
			print(f"Punto registrado: {ubicacion}")
		else:
			print("No se pudo obtener la ubicación GPS.")

	def cerrar_finca(self):
		# Cierra el polígono y calcula el área
		if len(self.puntos_poligono) < 3:
			print("Se requieren al menos 3 puntos para cerrar el polígono.")
			return None
		self.puntos_poligono.append(self.puntos_poligono[0])  # Cierra el polígono
		area_m2 = self._calcular_area_utm(self.puntos_poligono)
		area_ha = area_m2 / 10000
		print(f"Área total: {area_ha:.4f} hectáreas")
		return area_ha

	def _calcular_area_utm(self, puntos):
		# Fórmula del área de un polígono (coordenadas UTM)
		area = 0
		for i in range(len(puntos) - 1):
			x1, y1 = self._latlon_to_utm(puntos[i]['lat'], puntos[i]['lon'])
			x2, y2 = self._latlon_to_utm(puntos[i+1]['lat'], puntos[i+1]['lon'])
			area += (x1 * y2 - x2 * y1)
		return abs(area) / 2

	def _latlon_to_utm(self, lat, lon):
		# Conversión simplificada a UTM zona 17S (Ecuador)
		zona = 17
		a = 6378137.0
		f = 1 / 298.257223563
		k0 = 0.9996
		e = math.sqrt(f * (2 - f))
		lambda0 = (-81) * math.pi / 180
		phi = lat * math.pi / 180
		lambda_ = lon * math.pi / 180
		N = a / math.sqrt(1 - (e * math.sin(phi)) ** 2)
		T = math.tan(phi) ** 2
		C = (e ** 2) / (1 - e ** 2) * math.cos(phi) ** 2
		A = (lambda_ - lambda0) * math.cos(phi)
		M = a * ((1 - e ** 2 / 4 - 3 * e ** 4 / 64 - 5 * e ** 6 / 256) * phi
				- (3 * e ** 2 / 8 + 3 * e ** 4 / 32 + 45 * e ** 6 / 1024) * math.sin(2 * phi)
				+ (15 * e ** 4 / 256 + 45 * e ** 6 / 1024) * math.sin(4 * phi)
				- (35 * e ** 6 / 3072) * math.sin(6 * phi))
		x = k0 * N * (A + (1 - T + C) * A ** 3 / 6 + (5 - 18 * T + T ** 2 + 72 * C - 58 * e ** 2) * A ** 5 / 120) + 500000
		y = k0 * (M + N * math.tan(phi) * (A ** 2 / 2 + (5 - T + 9 * C + 4 * C ** 2) * A ** 4 / 24 + (61 - 58 * T + T ** 2 + 600 * C - 330 * e ** 2) * A ** 6 / 720))
		return x, y

	def generar_plano_finca(self, archivo_svg='plano_finca.svg'):
		# Genera el archivo SVG para impresión y compartir
		if len(self.puntos_poligono) < 3:
			print("No hay suficientes puntos para generar el plano.")
			return
		coords = self.puntos_poligono
		puntos_svg = self._normalizar_coordenadas(coords)
		puntos_str = ' '.join(f"{int(x)},{int(y)}" for x, y in puntos_svg)
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
		for idx, (x, y) in enumerate(puntos_svg):
			svg.append(f'<circle cx="{int(x)}" cy="{int(y)}" r="7" fill="#fff" stroke="#2E7D32" stroke-width="2" />')
			svg.append(f'<text x="{int(x)}" y="{int(y)+5}" font-size="13" fill="#2E7D32">P{idx+1}</text>')
		svg.append('</svg>')
		with open(archivo_svg, 'w', encoding='utf-8') as f:
			f.write('\n'.join(svg))
		print(f"SVG generado: {archivo_svg}")

	def _normalizar_coordenadas(self, coords, ancho=500, alto=500, margen=40):
		lats = [p['lat'] for p in coords]
		lons = [p['lon'] for p in coords]
		min_lat, max_lat = min(lats), max(lats)
		min_lon, max_lon = min(lons), max(lons)
		def norm(p):
			x = margen + (p['lon'] - min_lon) / (max_lon - min_lon + 1e-9) * (ancho - 2*margen)
			y = margen + (max_lat - p['lat']) / (max_lat - min_lat + 1e-9) * (alto - 2*margen)
			return x, y
		return [norm(p) for p in coords]
