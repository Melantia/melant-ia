import random
from datetime import datetime
from registro_tesoro_abuelos import leer_historias_abuelos
from registro_herbario_memoria import leer_remedios_herbario

# Lógica para mostrar 0, 1 o 2 registros por día, sin repetir en el mismo día
class DonEloyModerador:
    def __init__(self):
        self.hoy = datetime.now().date().isoformat()
        self._cache = {"tesoro": [], "herbario": []}
        self._last_date = None

    def _reset_cache_if_new_day(self):
        if self._last_date != self.hoy:
            self._cache = {"tesoro": [], "herbario": []}
            self._last_date = self.hoy

    def mostrar_historias_del_dia(self):
        self._reset_cache_if_new_day()
        historias = leer_historias_abuelos()
        if not historias:
            return []
        restantes = [h for h in historias if h['id'] not in self._cache['tesoro']]
        n = random.choice([0, 1, 2])
        seleccionadas = random.sample(restantes, min(n, len(restantes)))
        self._cache['tesoro'].extend([h['id'] for h in seleccionadas])
        return seleccionadas

    def mostrar_remedios_del_dia(self):
        self._reset_cache_if_new_day()
        remedios = leer_remedios_herbario()
        if not remedios:
            return []
        restantes = [r for r in remedios if r['id'] not in self._cache['herbario']]
        n = random.choice([0, 1, 2])
        seleccionados = random.sample(restantes, min(n, len(restantes)))
        self._cache['herbario'].extend([r['id'] for r in seleccionados])
        return seleccionados

# Ejemplo de uso:
# don_eloy = DonEloyModerador()
# historias_hoy = don_eloy.mostrar_historias_del_dia()
# remedios_hoy = don_eloy.mostrar_remedios_del_dia()
