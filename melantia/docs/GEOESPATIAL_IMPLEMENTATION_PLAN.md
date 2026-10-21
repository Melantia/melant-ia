# MELANTIA — Plan de Implementación Geoespacial

Propuesta por fases. **Nada implementado — esperando aprobación.**
Reutiliza el núcleo ya probado (`services/geodesia.py` + tests).

## Estructura propuesta (M2)

```
backend/modules/asistente_tecnico/
├── services/
│   ├── geodesia.py                 ← EXISTE (REUSE)
│   ├── sistemas_coordenadas.py     ← nuevo: zona UTM auto, EPSG, UTM↔LL
│   ├── levantamiento.py            ← nuevo: sesión de vértices + precisión
│   ├── plano_lote.py               ← migrar plano_linderos.py
│   ├── curvas_nivel.py             ← futuro (rasterio)
│   └── exportacion_gis.py          ← futuro (DXF/GeoJSON/SHP)
├── schemas/
│   ├── geodesia.py                 ← EXISTE
│   ├── coordenadas.py              ← nuevo
│   └── levantamiento.py            ← nuevo
└── routes/
    ├── geodesia.py                 ← EXISTE (extender)
    └── levantamiento.py            ← nuevo
```

Frontend: extender `GeodesiaPage.jsx` (o `LevantamientoPage.jsx`) con
captura por GPS de vértices, precisión por punto, edición de polígono.

## Fases

### FASE A — GPS + geometría básica ✅ ya existe
Haversine, área/perímetro, Geolocation API, endpoint, tests.
Delta mínimo: mostrar `pos.coords.accuracy` y `altitude` en la captura.
Dependencias nuevas: **ninguna**.

### FASE B — Levantamiento de lote
- Backend `levantamiento.py`: validación de polígono (auto-intersección
  simple), cierre, vértices con precisión, resultado persistible.
- Frontend: modo "caminar lote" — `watchPosition`, lista de vértices con
  precisión, regla `precision > umbral` → rechaza/alerta (patrón de
  `poligono_manager.js`), edición/borrado de vértice, dibujo del polígono.
- M3: persistir resultado en `lotes.area_metros_cuadrados` +
  `fincas.coordenadas_gps` (formato GeoJSON acordado) o tabla
  `lote_geometria` nueva (ver auditoría §11 — requiere migración aprobada).
- Migrar `plano_lote.py` (SVG plano + cuadro linderos/UTM) → M11.
Dependencias: ninguna obligatoria (shapely opcional para validación).

### FASE C — CRS + UTM automático
- `sistemas_coordenadas.py`: zona desde longitud
  `floor((lon+180)/6)+1`, hemisferio N/S, EPSG 326xx/327xx,
  UTM→Lat/Lon inversa, conversión parametrizada por meridiano central.
- API muestra CRS detectado al usuario + override manual como excepción.
- **Corrige el bug objetivo**: zona 17S hardcodeada actual.
Dependencias: `pyproj` (recomendado) o fórmula propia parametrizada.

### FASE D — DEM/DSM + curvas de nivel
- Ingesta GeoTIFF vía upload → hash + metadatos en M11.
- Backend: `rasterio` lectura → `matplotlib`/`skimage` contornos
  (curvas **reales** desde raster; nunca líneas demo).
- Salida: GeoJSON de curvas + pendiente/aspecto derivados.
Dependencias free-tier OK: `rasterio`, `scikit-image` (o `matplotlib`).

### FASE E — Exportaciones GIS
- `exportacion_gis.py`: GeoJSON (nativo, sin deps), DXF (`ezdxf`),
  Shapefile ZIP (`pyshp`), KML/KMZ (plantilla XML), CSV, PDF (fpdf2 ya
  instalado — plano técnico), GeoPackage (via fiona — evaluar peso).
- Prioridad: GeoJSON → CSV → DXF → PDF plano → SHP → KML.

### FASE F — Archivos de drones
- Upload de productos terminados (ortofoto GeoTIFF, DEM, GeoJSON de
  límites, LAS/LAZ opcional vía `laspy`).
- Extracción de metadatos: CRS detectado del archivo, GSD, bbox, fecha.
- EXIF GPS de fotos (PIL ya instalado) → evidencias georreferenciadas.
- **No** control de vuelo ni SDK — agnóstico de fabricante.

### FASE G — Integración fabricantes (futura, condicional)
`DroneAdapter{DJI, Autel, Parrot, ImportArchivos}` — solo si aparece un
SDK/API concreto con necesidad real. Hoy la única variante real es
`ImportArchivos`.

### FASE H — Optimización móvil/offline
- Cola de sync de levantamientos (patrón `precision.js` SyncPolicy:
  decidir por calidad de red).
- Tiles/thumbnails generados en backend para raster; el dispositivo solo
  vector.
- Reimplementación JS del núcleo geodésico para cálculo offline
  (misma semilla que Python — legacy ya lo hacía en `poligono_manager.js`).

## Dependencias a instalar (por fase, al ejecutar)

| Fase | Pip |
|---|---|
| C | `pyproj` |
| D | `rasterio`, `scikit-image` o `matplotlib` |
| E | `ezdxf`, `pyshp` (fiona/geopandas opcional) |
| F | `laspy` (opcional); PIL ya está |
| BD | PostGIS (extensión PG, solo si se adopta columna geometry) |

## Orden recomendado

A ✅ → **C (corrige zona UTM antes de escalar)** → B → E-parcial
(GeoJSON/CSV baratos) → D → F → E-completo → H → G (condicional).

C antes que B porque el levantamiento debe registrar `zona_utm`/EPSG
correctos en los metadatos desde el primer lote persistido.

## Cruce con auditoría PostgreSQL (pendiente de aprobación previa)

- `mediciones_campo` (lat, lon, precision_gps_metros) ya sirve para
  puntos GPS → REUSE.
- `fincas.coordenadas_gps` TEXT → normalizar a GeoJSON o PostGIS
  (decisión con la migración de BD).
- Nuevas tablas `levantamientos_lote`/`archivos_topograficos` se proponen
  en `docs/DB_AUDIT_PHASE2.md` §11 — **esperan la misma aprobación**.
