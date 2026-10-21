# MELANTIA — Consolidación de Diseño · Fase 2

Fecha: 2026-09-27 · Estado: **CONSOLIDACIÓN — nada ejecutado, nada
modificado, esperando aprobación de implementación.**

Integra: `DB_AUDIT_PHASE2.md` · `DB_MIGRATION_PLAN.md` ·
`GEOESPATIAL_AUDIT_PHASE2.md` · `GEOESPATIAL_IMPLEMENTATION_PLAN.md`

---

## A. Decisiones aprobadas

| # | Decisión | Consecuencia |
|---|---|---|
| A1 | **M4**: adaptar `modules/negocios_rurales/controllers.py` al schema **v2**. No crear schema v1 | El DDL canónico de M4 es `schema/modulos/negocios_rurales_v2.sql` |
| A2 | **Comisión MELANTIA 3%** pertenece a `M4.transacciones` — no a ofertas ni evidencias | `evidencias_documentos` pierde justificación para `comision_app`/`valor_neto`/`estado_pago` (ver E5 — diferido) |
| A3 | **PostGIS**: no instalar todavía, no descartar | `extensions.sql` se ejecuta solo con `uuid-ossp`; PostGIS queda como migración posterior condicionada al modelo geoespacial |
| A4 | **Geoespacial**: arquitectura Dron→archivos→ingesta→validación→normalización CRS→M2→M3→M11 aprobada conceptualmente | Sin SDK de fabricante; ingesta por archivos (DEM/DSM/ortofoto/nube de puntos) |
| A5 | **GPS**: reutilizar `mediciones_campo(latitud, longitud, precision_gps_metros)` para puntos GPS | No se crea tabla GPS nueva sin justificación |
| A6 | **UTM automático**: requisito obligatorio de Fase C; eliminar conceptualmente la dependencia 17S hardcodeada | Zona `floor((lon+180)/6)+1`, hemisferio, EPSG 326xx/327xx; override manual solo como excepción |
| A7 | **Responsabilidades M2/M3/M11**: M2 procesa, M3 persiste finca/lote/geometría, M11 custodia archivos/hashes/versiones | Ningún binario pesado en M3; M4 posee la transacción comercial |
| A8 | **Auth local FastAPI+PostgreSQL** sigue siendo el camino operativo; Supabase queda como decisión de arquitectura separada | `usuarios` + `password_hash` es la tabla de auth real |

## B. Decisiones pendientes

| # | Pendiente | Bloquea |
|---|---|---|
| B1 | **PostGIS sí/no** (geometry vs GeoJSON-en-TEXT para `fincas.coordenadas_gps` y futura `lote_geometria`) | Fase D geoespacial; paso 0 de migración |
| B2 | **Separación evidencia↔transacción** en `evidencias_documentos` (quitar campos comerciales tras decidir rediseño M11) | Rediseño M11 — no bloquea crear la tabla tal cual hoy |
| B3 | **Supabase vs local**: doble auth (`auth.users`/`usuarios_perfiles` vs `usuarios` local) sin resolver; `supabase/migrations/` sin depurar | Cualquier migración a Supabase |
| B4 | **Retiro de `init_db.py`** (SQLite legacy) — documentado, decisión pendiente | Limpieza final |
| B5 | Nomenclatura de planes de suscripción (`Standard` vs planes del trigger de cuota: Basico/Standard/Empresarial) | M1 |
| B6 | Seeds geográficos INEC (provincias/cantones/parroquias) — no existen archivos de seed | Datos de catálogo; no bloquea DDL |

## C. Tablas que deben crearse (nuevas, no existen en SQL)

| Tabla | Motivo | Fuente de verdad del diseño |
|---|---|---|
| `usuarios_suscripciones` | main.py escribe incentivo Melantios hoy (P2) | DDL propuesto en DB_MIGRATION_PLAN paso 8 |
| `perfil_economico_productor` | score worker la hace upsert hoy (P2) | DDL propuesto en DB_MIGRATION_PLAN paso 8 |

## D. Tablas que deben reutilizarse (ya definidas, sin cambio)

| Tabla(s) | Uso |
|---|---|
| `provincias`, `cantones`, `parroquias`, `ciiu` | Geo + FK de usuarios/fincas |
| `usuarios` (+`password_hash`, `storage_usado_mb`) | Auth JWT local, cuota |
| `fincas`, `lotes`, `hatos_ganaderos`, `practicas_regenerativas` | M3 base + contexto M2 + score |
| `animales`, `eventos_animales` | M3 pecuario |
| `trazabilidad_*` (6) | M3 trazabilidad (ya con `sync_status`/`hash_integridad`) |
| `perfiles_comerciales`, `publicaciones`, `comentarios`, `bolsa_ofertas`, `oportunidades`, `ferias`, `feria_participantes`, `feria_operaciones`, `transacciones` | M4 v2 — comisión 3% vive en `transacciones` |
| `mediciones_campo` | **Puntos GPS del levantamiento** (A5) |
| `evidencias_documentos` | M11 custodia — crear tal cual; rediseño B2 diferido |

## E. Tablas que requieren modificación

| Tabla | Cambio necesario | Justificación |
|---|---|---|
| `registros_campo` | **+5 columnas**: `especie_afectada`, `diagnostico_usuario`, `clasificacion_ia`, `es_activo_conocimiento BOOL`, `hash_transaccion` | main.py las escribe hoy; sin ellas el endpoint da 500 (P3) |
| `fincas.coordenadas_gps` | Normalizar formato (GeoJSON o PostGIS) | Pendiente B1; hoy es TEXT libre |
| `lotes` | Posible `geometria` + `perimetro_m`/`zona_utm` (o tabla `lote_geometria` aparte) | Levantamiento M2 → persistencia M3; decisión con B1 |
| `evidencias_documentos` | Retirar campos comerciales (monto/comisión/estado_pago) | B2 — rediseño posterior, no bloquea |
| Futuras: `levantamientos_lote`, `archivos_topograficos` | Nuevas — solo si Fase B/D las justifica | `mediciones_campo` absorbe puntos GPS primero (A5) |

## F. Código que debe adaptarse

| Archivo | Cambio | Prioridad |
|---|---|---|
| `backend/modules/negocios_rurales/controllers.py` | A v2: `producto_servicio`, `cantidad`+`unidad`, estados lowercase, sin `comision_app`/`valor_neto` en oferta → van a `transacciones` | Tras migración M4 |
| `backend/main.py` (score/melantios/registro) | Ninguno de código — funcionan cuando existan las tablas/columnas de C y E | Automático tras migración |
| `frontend/.../GeodesiaPage.jsx` | Modo levantamiento: watchPosition, vértices con precisión, polígono editable | Fase B |
| `backend/.../services/geodesia.py` | Zona UTM automática + UTM→LL inversa (parametrizar meridiano central) | Fase C |

## G. Código legacy que debe migrarse

| Origen (git `melant_ia/src/...`) | Destino propuesto | Valor |
|---|---|---|
| `plano_linderos.py` | `services/plano_lote.py` → documento M11 | Plano técnico SVG + cuadro linderos; corregir escala isotrópica |
| `poligono_manager.js` | Hook React de levantamiento | Modelo vértice con `precision` + rechazo >10 m |
| `gps_legal_integrator.js` | Sello GPS server-side en M11 | Evidencia georreferenciada en documentos |
| `precision.js` | Patrón cola de sync offline | SyncPolicy por calidad de red |
| `ancla_geografica_ejemplo.json` | Schema de validación M11 | Punto maestro + tolerancia + EXIF |
| `telemetria_drones.py` | Knowledge de M2 | Documental, no integración |

Descartables confirmados: `gps_utils.py` (stub Kivy), `gps_registro.js`,
`plano_svg.py`, `gps_logic.py`, `gps_medicion_terrenos.js`,
`mando_voz_gps.py` (backlog Vosk).

## H. Dependencias que todavía NO deben instalarse

`pyproj` (Fase C) · `rasterio` + `scikit-image`/`matplotlib` (Fase D) ·
`ezdxf`/`pyshp` (Fase E) · `laspy` (Fase F) · **PostGIS** (extensión,
pendiente B1) · ningún SDK de dron.

Disponibles sin instalar: `pillow` (EXIF GPS para evidencias
georreferenciadas), `numpy`, `fpdf2` (plano PDF), `pandas`.

## I. Orden exacto de implementación propuesto

```
ETAPA 1 — Migración base (DB_MIGRATION_PLAN pasos 0–8)
  0 extensions (uuid-ossp; postgis diferido) →
  1 geografia → 2 usuarios → 3 gestion_fincas →
  4 animales/labores → 5 trazabilidad → 6 negocios_v2 →
  7 evidencias + registros_campo (+5 columnas) + trigger cuota →
  8 suscripciones (usuarios_suscripciones + perfil_economico_productor)
  → verificación: registro/login/me E2E + pytest 54/54

ETAPA 2 — Geoespacial (GEOESPATIAL_IMPLEMENTATION_PLAN)
  A ✅ hecha → C (UTM automático, ANTES de persistir lotes) →
  B (levantamiento → mediciones_campo + lote) →
  E-parcial (GeoJSON/CSV sin deps) → D (DEM/curvas, pyproj+rasterio) →
  F (ingesta archivos dron → M11) → E-completo (DXF/SHP/PDF) →
  H (optimización offline/móvil) → G (fabricantes, condicional)

ETAPA 3 — Código M4
  Adaptar controllers a v2 + mover comisión a transacciones

ETAPA 4 — Deuda controlada
  Separación evidencia/comercial (B2), retiro init_db.py (B4),
  seeds INEC (B6), PostGIS definitivo (B1)
```

## J. Riesgos de migración

| Riesgo | Mitigación |
|---|---|
| `migracion_inicial.sql` falla standalone (`idx_bolsa_estado` sobre tabla inexistente) | **No ejecutarlo entero** — extraer §6/§9–10 a `schema/evidencias.sql`/`registros_campo.sql` |
| Doble fuente de verdad migracion_inicial vs schema/ | schema/ es canónico (más nuevo); marcar migracion_inicial como histórico (sin borrar) |
| Runtime 500 latentes (score/melantios/registro) | Resueltos por C + E.registros_campo |
| Runtime 500 en M4 (v1↔v2) | Resuelto por A1 — adaptar controller, no duplicar schema |
| `extensions.sql` falla si falta PostGIS | A3 — ejecutar solo `uuid-ossp` |
| Precisión GPS sobreestimada | Campo `precision` por vértice + `metodo_captura` en levantamientos |
| Orden de ejecución cambia resultado (`IF NOT EXISTS` con DDL divergente) | Plan fija orden único; geo/usuarios/fincas solo desde `schema/` |

## K. Dependencias entre módulos (M1–M12)

```
M1 suscripciones ──→ usuarios_suscripciones + planes (alinear nombres B5)
                     └── trigger cuota almacenamiento lee tipo_suscripcion
M2 asistente ──────→ usuarios, fincas/lotes (contexto),
                     mediciones_campo (GPS), registros_campo (legacy),
                     perfil_economico_productor (score)
M3 fincas ─────────→ usuarios + geo + ciiu → fincas → lotes/hatos →
                     animales/eventos → trazabilidad_*
                     ← recibe geometría validada desde M2
M4 negocios ───────→ usuarios + geo → bolsa_ofertas → transacciones
                     (comisión 3% A2); evidencias M11 como soporte doc
M11 evidencias ────→ usuarios; custodia archivos de M2/M3/M4
                     (hashes, EXIF GPS, planos, GeoTIFF, originales)
M5–M10, M12 ───────→ fuera de alcance Fase 2 (sin tablas auditadas en uso)
```

Cadena crítica de desbloqueo: **Etapa 1** desbloquea auth E2E + score +
M4-schema; **Fase C geoespacial** debe preceder a la persistencia de
levantamientos; M11 absorbe custodia de todo artefacto geoespacial.

---

**Confirmación**: este documento es consolidación — cero SQL ejecutado,
cero tabla creada, cero código/schema/controller modificado, cero
dependencia instalada, cero archivo movido o eliminado. `melantia_db`
permanece vacía e intacta.
