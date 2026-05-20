import random
import json
import os
from datetime import datetime

IDIOMAS = [
    'es', 'qu', 'sh', 'ts', 'tsafiki', 'english'
]

SABERES_PATHS = [
    'modules/06_proyectos/saberes_json/saberes_manabitas_{lang}.json',
    'modules/06_proyectos/saberes_json/saberes_folclore_{lang}.json'
]

class DonEloySaberes:
    def __init__(self, idioma_usuario='es'):
        self.idioma = idioma_usuario if idioma_usuario in IDIOMAS else 'es'
        self.hoy = datetime.now().date().isoformat()
        self._cache = set()
        self._last_date = None
        self._saberes = self._cargar_saberes()

    def _cargar_saberes(self):
        saberes = []
        for path_tpl in SABERES_PATHS:
            path = path_tpl.format(lang=self.idioma)
            abs_path = os.path.join(os.path.dirname(__file__), '..', path)
            abs_path = os.path.normpath(abs_path)
            if os.path.exists(abs_path):
                with open(abs_path, 'r', encoding='utf-8') as f:
                    try:
                        data = json.load(f)
                        saberes.extend(data)
                    except Exception:
                        continue
        return saberes

    def _reset_cache_if_new_day(self):
        if self._last_date != self.hoy:
            self._cache = set()
            self._last_date = self.hoy

    def mostrar_saberes_del_dia(self):
        self._reset_cache_if_new_day()
        restantes = [i for i, s in enumerate(self._saberes) if i not in self._cache]
        n = random.choice([1, 2]) if restantes else 0
        seleccionados_idx = random.sample(restantes, min(n, len(restantes)))
        self._cache.update(seleccionados_idx)
        return [self._saberes[i] for i in seleccionados_idx]

# Ejemplo de uso:
# don_eloy = DonEloySaberes(idioma_usuario='qu')
# saberes_hoy = don_eloy.mostrar_saberes_del_dia()
