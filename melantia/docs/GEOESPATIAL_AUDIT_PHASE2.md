# MELANTIA — Auditoría Técnica Geoespacial (Fase 2)

Fecha: 2026-09-27 · Alcance: GPS, medición de terrenos, levantamiento de
lotes, geometría, polígonos, curvas de nivel, DEM/DSM, GeoTIFF, drones,
CRS/UTM, DXF, GeoJSON, exportación GIS, topografía, evidencias
georreferenciadas.
Estado: **AUDITORÍA — cero código modificado, cero dependencias instaladas,
cero SQL ejecutado.**

---

## 1. Resumen ejecutivo

MELANTIA ya posee un **núcleo geodésico real y probado** en el backend
(`services/geodesia.py`: Haversine, área Gauss con proyección esférica,
Lat/Lon→UTM) con endpoint funcional `/api/v1/asistente/geodesia/*` y tests
verdes (54/54). El historial git contiene un conjunto considerable de
componentes legacy reutilizables: plano de linderos SVG, gestor de
polígonos con control de precisión por vértice, captura GPS y patrones de
sincronización por calidad de red.

**No existe** en ninguna forma: lectura de GeoTIFF/DEM/DSM, curvas de
nivel desde raster, Shapefile/KML/DXF/LAS/GPX, integración real con
drones, ni dependencias geoespaciales Python instaladas (no hay
`rasterio`/`pyproj`/`shapely` — el núcleo actual es `math` puro).

Conclusión: Fases A/B/C (GPS + geometría + UTM automático) están
construidas o son port directo del legacy; Fases D–G (raster, curvas,
exportaciones, drones) requieren dependencias y diseño nuevos.

## 2. Archivos encontrados

### Activos (en uso, backend FastAPI)

| Archivo | Función |
|---|---|
| `backend/modules/asistente_tecnico/services/geodesia.py` | Haversine, perímetro, área Gauss equirectangular, Lat/Lon→UTM 17S |
| `backend/modules/asistente_tecnico/routes/geodesia.py` | POST `/geodesia/distancia`, `/poligono`, `/utm` |
| `backend/modules/asistente_tecnico/schemas/geodesia.py` | PuntoGeo, Distancia/Poligono/UTM Request+Response |
| `backend/tests/test_geodesia.py` | Tests Haversine Quito-GYE, cuadrado ~100 m, UTM |
| `frontend/.../pages/GeodesiaPage.jsx` | UI 3 herramientas + `navigator.geolocation` |
| `frontend/.../services/geodesia.service.js` | apiClient + caché offline |

### Extraídos a `.legacy_extract/`

| Archivo | Contenido |
|---|---|
| `geometria.py` | Gauss plano sobre lat/lon (antecesor del servicio actual) |
| `gps_utils.py` | Stub Kivy/plyer — devuelve None/simulado |
| `gps_utils.js` | Geolocation API + LatLng→UTM 17S (origen del port Python) |

### Solo en historial git (`melant_ia/src/...`, rutas espejo
`modules/02_…` y `knowledge_seeds/02_…` con mismo contenido)

| Archivo | Contenido real |
|---|---|
| `plano_linderos.py` | Plano técnico SVG: polígono, distancias por lado, cuadro vértices/linderos/UTM |
| `plano_svg.py` | Versión simple del anterior (sin tabla UTM) |
| `poligono_manager.js` | Vértices con **control de precisión** (`>10 m` rechaza), cierre, área UTM, persistencia localStorage |
| `gps_registro.js` | Una posición → JSON (descarga) — trivial |
| `precision.js` | SyncPolicy (bloquea sync en 2G/edge), FuzzyRules, caché local |
| `gps_medicion_terrenos.js` | Panel entrada manual UTM → área plana |
| `gps_legal_integrator.js` | Sello `[UBICACION_GPS]` en documentos legales |
| `mando_voz_gps.py` | Vosk offline: comandos de voz "marcar punto" |
| `telemetria_drones.py` | **Documental**: MAVLink, sensores, estructura telemetría — cero integración |
| `ancla_geografica_ejemplo.json` | Schema ancla: punto maestro + EXIF + radio tolerancia + estampado |
| `database/gps_logic.py` | 3 líneas: `m²/10000` — trivial |

### Campos geoespaciales existentes en el DDL auditado

| Tabla | Campo geo | Comentario |
|---|---|---|
| `fincas` | `coordenadas_gps TEXT` | Comentario explícito: "puede migrarse a PostGIS" |
| `lotes` | `area_metros_cuadrados NUMERIC` | Área persistida; sin geometría |
| `mediciones_campo` (migracion_inicial) | `latitud, longitud, precision_gps_metros REAL` | **Estructura de puntos GPS ya existe** |
| `evidencias_documentos` | hash, fotos | Sin campos geo propios |
| `trazabilidad_eventos` | `ubicacion TEXT` | Texto libre, sin estructura |

## 3. Componentes reutilizables (REUSE)

- **`services/geodesia.py` + routes + schemas + tests** — núcleo probado,
  puro, offline; base del motor geoespacial.
- **`gps_utils.js` (legacy)** — ya portado a Python; en frontend el
  patrón `enableHighAccuracy, timeout:10000, maximumAge:0` sigue siendo
  la configuración correcta de Geolocation API.
- **`precision.js` (concepto)** — SyncPolicy (calidad de red → decide
  sincronizar o trabajar local) es el patrón correcto para la cola
  offline futura.
- **`telemetria_drones.py`** — contenido de conocimiento (MAVLink,
  sensores, estructura de telemetría) para el asistente; no es código de
  integración.
- **`ancla_geografica_ejemplo.json`** — modelo `punto_gps_maestro +
  precision_metrica + radio_tolerancia + EXIF` = exactamente la
  validación georreferenciada que M11 necesita.

## 4. Componentes a refactorizar (REFACTOR)

- **`GeodesiaPage.jsx`** — funciona, pero le falta el modo "caminar el
  lote": `watchPosition`, lista de vértices capturados con precisión por
  punto, polígono editable, dibujo del resultado.

## 5. Componentes a migrar (MIGRATE)

- **`plano_linderos.py`** → `services/plano_lote.py`: el plano técnico
  SVG con cuadro de linderos es la pieza documental que M11 necesita.
  Corregir la normalización (escala x/y independiente distorsiona el
  aspecto real del lote — usar escala única isotrópica).
- **`poligono_manager.js`** → hook React: portar el modelo de vértice
  `{punto_id, lat, lng, utm_x, utm_y, precision}` y el rechazo por
  precisión; reescribir DOM/alert/localStorage directo.
- **`gps_legal_integrator.js`** → sello GPS server-side al generar
  documentos M11 (concepto, no el código DOM).

## 6. Componentes a reemplazar (REPLACE)

- **`gps_medicion_terrenos.js`** — entrada manual UTM plana reemplazada
  por la captura GPS real + Haversine ya existente.

## 7. Componentes descartables (DISCARD)

- **`gps_utils.py`** (stub Kivy con coordenadas simuladas) — no aplica a
  React/FastAPI.
- **`gps_registro.js`** — trivial; captura la hace el navegador y el
  guardado M11.
- **`plano_svg.py`** — subconjunto estricto de `plano_linderos.py`.
- **`database/gps_logic.py`** — 3 líneas.
- **`mando_voz_gps.py`** — Vosk viable pero pesado; backlog, no bloquea.

## 8. Estado actual GPS

✅ Real: `navigator.geolocation` en GeodesiaPage; legacy validaba
`accuracy` por vértice. ⚠ `altitude` y `accuracy` capturables pero no
persistidos ni mostrados. ❌ Sin `watchPosition` (track por recorrido).

## 9. Estado actual geodesia

✅ Haversine (test ±5% Quito–Guayaquil), perímetro, área poligonal
Gauss sobre proyección equirectangular local (mejor que el legacy: usa
latitud media). ❌ UTM→Lat/Lon inversa. ❌ azimut/rumbo entre vértices
(necesario para el cuadro de linderos formal).

## 10. Estado actual geometría

✅ Área, perímetro, vértices → polígono. ⚠ Plano SVG legacy existe pero
sin uso en el frontend actual. ❌ Validación de auto-intersección,
simplificación Douglas-Peucker, centroides, buffers.

## 11. Estado actual topografía

**Nada real**: no hay curvas de nivel, elevación, pendiente, aspecto ni
perfiles — y tampoco hay código demo que pudiera confundirse con real
(verificación explícita: ningún archivo genera contornos). Área y
perímetro geodésicos sí existen. Elevación solo disponible en bruto vía
`pos.coords.altitude` (no usada).

## 12. Estado actual CRS/UTM

⚠ **Zona 17S hardcodeada** (`lambda0 = −81°`): correcta para Ecuador
continental occidental, incorrecta para Galápagos y el oriente sur
(zona 18). Hemisferio detectado solo por `lat<0` (falso norte). ❌ Sin
cálculo automático de zona (`floor((lon+180)/6)+1`), sin EPSG, sin
detección de CRS de archivos (no hay ingesta de archivos). WGS84
asumido — correcto para GPS de teléfono.

## 13. Estado actual DXF/GeoJSON

❌ Ninguno. Cero referencias en código. GeoJSON sería el formato natural
para `fincas.coordenadas_gps` (hoy TEXT libre).

## 14. Estado actual soporte drone

❌ **No existe integración con ningún fabricante** (DJI/Autel/Parrot:
cero SDK, cero API, cero telemetría real). `telemetria_drones.py` es
documental. La abstracción `DroneAdapter{DJI, Autel, Parrot,
ImportArchivos}` es válida pero **solo la variante `ImportArchivos`
tiene justificación hoy** — las demás esperan SDK real.

## 15. Estado actual GeoTIFF/DEM/DSM

❌ Sin soporte. `pillow` instalado abre TIFF genérico pero no interpreta
GeoTIFF tags de CRS. Sin `rasterio`/`gdal`. PIL sí puede leer **EXIF
GPS de fotos** — camino disponible para evidencias georreferenciadas sin
dependencias nuevas.

## 16. Dependencias existentes

`numpy`, `pillow`, `opencv-python`, `pandas`, `fpdf2` (PDF genérico),
`psycopg`, `defusedxml`. Ninguna geoespacial propiamente.

## 17. Dependencias faltantes (NO instalar aún)

| Necesidad | Biblioteca | Fase |
|---|---|---|
| CRS/UTM completo, transformaciones | `pyproj` | C |
| Validación vectorial, GeoJSON | `shapely` | B/C |
| GeoTIFF/DEM/DSM + contornos | `rasterio` + `scikit-image`/`matplotlib` | D |
| DXF / Shapefile | `ezdxf` / `pyshp` | E |
| LAS/LAZ | `laspy` | F |
| Columna geometry | extensión PostGIS (ya declarada en `extensions.sql`) | BD |

## 18. Relación M2 / M3 / M11

```
M2 ASISTENTE TÉCNICO (procesamiento)
  geodesia.py            ← existe (REUSE)
  sistemas_coordenadas.py  ← zona UTM auto, EPSG, UTM↔LL
  levantamiento.py         ← sesión vértices + precisión
  plano_lote.py            ← migrar plano_linderos.py
  curvas_nivel.py          ← futuro (rasterio)
  exportacion_gis.py       ← futuro (DXF/GeoJSON/SHP)
        │  geometría validada + metadatos
        ▼
M3 FINCAS/LOTES (persistencia)
  lotes.area_metros_cuadrados · fincas.coordenadas_gps
  mediciones_campo(lat,lon,precision_gps_metros) ← vértices
  [propuesta] levantamientos_lote, lote_geometria, archivos_topograficos
        ▼
M11 EVIDENCIAS (custodia)
  evidencias_documentos ← SVG/DXF/PDF/GeoTIFF + hash + EXIF + ancla geo
```

Regla: M2 calcula/valida, M3 persiste geometría del lote, M11 custodia
archivos y auditoría. Ningún binario pesado en M3.

## 19. Arquitectura propuesta

Flujo topográfico dividido honestamente:

```
DRON (externo, agnóstico) → fotogrametría EXTERNA (WebODM/Pix4D/etc.)
  → productos: ortofoto/DEM/DSM/GeoJSON/nube de puntos
  → MELANTIA ingiere por UPLOAD (ImportArchivos)
  → validación + detección CRS + normalización (backend)
  → motor geoespacial M2
  → persistencia M3 (lote/geometría)
  → custodia M11 (originales + procesados + hashes)
```

MELANTIA **no** controla el dron ni hace fotogrametría propia en esta
etapa — solo ingiere productos terminados con metadatos.

## 20. Offline/Online

**Offline (dispositivo):** captura GPS/watchPosition, vértices con
precisión, polígono, área/perímetro (Haversine trivial en JS — el legacy
ya lo hacía), plano SVG, fotos, cola de sync (patrón SyncPolicy).

**Backend:** GeoTIFF/DEM/DSM, curvas de nivel, transformaciones masivas,
DXF/SHP, validación cruzada.

**Externo:** fotogrametría y control de vuelo.

La arquitectura actual (apiClient + caché + cálculo puro duplicable
Python↔JS) **sí permite** esta separación.

## 21. Rendimiento (gama baja)

Vectorial de lotes: despreciable. SVG: trivial. **Riesgos:** GeoTIFF/
ortofotos >50 MB, nubes LAS/LAZ, raster pesado — nunca en el teléfono;
backend genera curvas/tiles/thumbnails y entrega vector ligero.
Regla: dispositivo = captura + vector; backend = raster; externo =
fotogrametría.

## 22. Riesgos

1. **UTM 17S hardcodeada** — incorrecta fuera de Ecuador continental
   occidental; corregir antes de persistir levantamientos.
2. `fincas.coordenadas_gps TEXT` sin formato → basura potencial;
   normalizar a GeoJSON.
3. Sin `pyproj`, toda transformación CRS es artesanal.
4. PostGIS no incluido en PG17 vanilla (ya señalado en auditoría BD).
5. Sobrestimar precisión: GPS de teléfono ≈3–30 m — delimitación
   aproximada, no catastral. RTK entra como dato importado con
   `precision` declarada.
6. Telemetría de dron es documental — no confundir con soporte real.

## 23. Recomendaciones

1. Mantener núcleo geodésico puro y duplicable Python↔JS.
2. `sistemas_coordenadas.py` con zona/hemisferio/EPSG automáticos —
   mostrar CRS detectado y permitir override manual como excepción.
3. Migrar `plano_linderos.py` a documento M11 (cuadro de linderos).
4. Ingesta de dron = archivos únicamente (GeoTIFF/GeoJSON/LAS + hash M11).
5. EXIF GPS con PIL para evidencias georreferenciadas sin deps nuevas.
6. Cruce BD: `mediciones_campo` ya es la tabla de puntos; las entidades
   nuevas van en `schema/` tras aprobación, no en `migracion_inicial`.

## 24. Orden recomendado de implementación

Ver `docs/GEOESPATIAL_IMPLEMENTATION_PLAN.md`:

**A** ✅ hecha → **C** (zona UTM automática, antes de persistir lotes) →
**B** (levantamiento de lote) → **E-parcial** (GeoJSON/CSV sin deps) →
**D** (DEM/curvas) → **F** (archivos de dron) → **E-completo** →
**H** (offline/móvil) → **G** (fabricantes, condicional).
