# MELANTIA — Ejecución Migración BD · ETAPA 1

**Fecha:** 2026-09-28 · 14:35–15:10 (UTC-05)
**Ejecutado por:** Devin (agente), con aprobación de consolidación
`docs/PHASE2_ARCHITECTURE_DECISIONS.md`
**Estado:** ETAPA 1 **CERRADA** — estructura validada, AUTH E2E
superado, hallazgos F1–F3 corregidos y revalidados, BD sin datos de
prueba, PostGIS confirmado ausente. Pendiente aprobación para ETAPA 2.

---

## 1. Entorno verificado

| Parámetro | Valor |
|---|---|
| Motor | **PostgreSQL 17.11** (x86_64-windows, MSVC 19.44) — nativo |
| Host / Puerto | `localhost:5432` |
| Base | `melantia_db` — **vacía** al inicio (0 tablas, solo `plpgsql`) |
| Cliente | `psql 17.11` (`C:\Program Files\PostgreSQL\17\bin\psql.exe`) |
| Credenciales | `postgres` / `melantia_offline_2026` (defaults `core/config.py`) |
| Backend | `.venv` · Python + `psycopg 3.2.3`, `psycopg-pool`, FastAPI 0.115, uvicorn 0.30.6, passlib 1.7.4, **bcrypt 4.0.1** (re-fijado, ver F3), python-jose 3.3.0 |
| PostGIS | **NO instalado en el servidor ni habilitado** — `pg_available_extensions` no lista `postgis` (binarios ausentes en PG17.11); `pg_extension` = solo `plpgsql` + `uuid-ossp`. `CREATE EXTENSION postgis` fallaría. Consistente con A3/B1: diferido, sin acción requerida |
| `docker-compose.yml` | No usado (postgres:16-alpine es referencia Podman; el servidor real es PG17 nativo) |

## 2. Orden ejecutado (DB_MIGRATION_PLAN pasos 0–9)

| Paso | Archivo | Objetos | Resultado |
|---|---|---|---|
| 0 | `schema/extensions.sql` | extensión `uuid-ossp 1.1` | OK — `uuid_generate_v4()` funcional. PostGIS comentado |
| 1 | `schema/geografia.sql` | `provincias`, `cantones`, `parroquias`, `ciiu` | OK — PKs, UNIQUE `codigo_inec`/`codigo`, FKs CASCADE |
| 2 | `schema/usuarios.sql` | `usuarios` + ALTER `storage_usado_mb`, `password_hash` | OK — UUID PK, UNIQUE `cedula_ruc`, 3 FKs geo |
| 3 | `schema/gestion_fincas.sql` | `fincas`, `lotes`, `hatos_ganaderos`, `practicas_regenerativas` + 10 idx | OK — 2 CHECKs no-negativos |
| 4 | `schema/modulos/animales.sql` + `labores_pecuarias.sql` | `animales`, `eventos_animales` | OK — 3 CHECKs, FKs CASCADE/SET NULL |
| 5 | `schema/trazabilidad.sql` | 6 tablas + 12 idx | OK — 15 FKs, CHECKs tipo/estado/sync + XOR lote/hato |
| 6 | `schema/modulos/negocios_rurales_v2.sql` | 9 tablas M4 v2 + 2 funciones + 6 triggers + ~24 idx + 2 FKs diferidas + 2 idx únicos parciales | OK — ver §5 hallazgo sobre NOTICEs esperados |
| 7 | `schema/evidencias.sql` + `schema/registros_campo.sql` | `evidencias_documentos`, `registros_campo` (+5 columnas P3) + función + trigger cuota + 3 idx | OK |
| 8 | `schema/suscripciones.sql` | `usuarios_suscripciones`, `perfil_economico_productor` | OK — PK `usuario_id` → `usuarios` CASCADE |
| 9 | índices restantes | `idx_evidencias_hash`, `idx_registros_campo_user`, `idx_registros_campo_hash` | OK — ya incluidos en archivos del paso 7 |

Cada paso se ejecutó con `psql -v ON_ERROR_STOP=1 -f <archivo>` de forma
individual, con validación inmediata de existencia, columnas, PK, FK,
CHECKs, índices y triggers antes de avanzar.

## 3. Objetos creados (estado final)

| Métrica | Valor |
|---|---|
| Tablas | **30** |
| PKs | 30 |
| FKs | 66 |
| CHECKs | 37 |
| UNIQUEs | 12 |
| Índices `idx_*` de aplicación | 51 |
| Triggers de aplicación | 7 (`trigger_comision_transaccion_melantia`, 5×`trigger_updated_at_*`, `trigger_verificar_espacio_campo`) |
| Funciones | `calcular_comision_transaccion_melantia()`, `actualizar_updated_at_melantia()`, `verificar_limite_almacenamiento_melantia()` + uuid-ossp |

Tablas (30): `animales`, `bolsa_ofertas`, `cadena_custodia`, `cantones`,
`ciiu`, `comentarios`, `eventos_animales`, `evidencias_documentos`,
`feria_operaciones`, `feria_participantes`, `ferias`, `fincas`,
`hatos_ganaderos`, `lotes`, `oportunidades`, `parroquias`,
`perfil_economico_productor`, `perfiles_comerciales`,
`practicas_regenerativas`, `provincias`, `publicaciones`,
`registros_campo`, `transacciones`, `trazabilidad_eventos`,
`trazabilidad_fases`, `trazabilidad_plantilla_fases`,
`trazabilidad_plantillas`, `trazabilidades`, `usuarios`,
`usuarios_suscripciones`.

**No creadas (correcto):** `levantamientos_lote`, `archivos_topograficos`,
`lote_geometria`, estructuras PostGIS — y `mediciones_campo` (ver §6).

## 4. Datos iniciales

Sin seeds en el repo (B6 pendiente — INEC provincias/cantones/parroquias).
Todas las tablas nacieron vacías, como esperaba el plan. No bloquea:
`usuarios.provincia_id` es nullable.

## 5. AUTH E2E — resultado (revalidado post-fixes)

Lanzamiento: **`python -m uvicorn main:app`** desde `backend/` — ahora
funciona en Windows (ver F1). API: `http://127.0.0.1:8000`.

| # | Prueba | Esperado | Obtenido |
|---|---|---|---|
| 1 | `POST /api/auth/registro` | 201 + JWT | **201** + `access_token`, `usuario_id` UUID |
| 2 | Persistencia en `usuarios` | fila + hash | **OK** — `password_hash` bcrypt `$2b$12$…` (60 chars), `tipo_suscripcion='Standard'`, `storage_usado_mb=0.00` |
| 3 | `POST /api/auth/login` | 200 + JWT | **200** + JWT nuevo |
| 4 | Claims JWT | `sub`=UUID, `exp` | **OK** — `sub`=UUID usuario, `exp` ≈ 30 min, HS256 |
| 5 | `GET /api/auth/me` con token | 200 | **200** — `id`, `nombre`, `cedula_ruc`, `sector_comunidad` correctos |
| 6 | `GET /api/auth/me` sin token | 401 | **401** `AUTHENTICATION_ERROR` |
| 7 | `GET /api/auth/me` token inválido | 401 | **401** `INVALID_TOKEN` |
| 8 | Recuperación usuario autenticado | datos de BD | **OK** — coincide con la fila persistida |
| 9 | Login contraseña incorrecta | 401 | **401** `Cédula o contraseña incorrecta` (antes: 500) |
| 10 | Login usuario inexistente | 401 | **401** (antes: 500) |
| 11 | Registro cédula duplicada | 409 | **409** `Ya existe un usuario con esa cédula/RUC` (antes: 500) |
| 12 | `/me` con JWT válido de UUID inexistente | 404 | **404** `Usuario no encontrado` (antes: 500) |

Cadena demostrada: **REGISTRO → BD → LOGIN → JWT → /AUTH/ME** ✓
Log del servidor limpio: códigos correctos, sin errores de pool ni
warnings de passlib/bcrypt.

## 6. Errores e inconsistencias encontrados

### F1 — `uvicorn main:app` no conectaba a BD en Windows → **CORREGIDO**

**Causa real:** `asyncio.run()` de uvicorn crea el event loop
(Proactor por defecto en Windows) **antes** de `config.load()` importar
`main.py` — la política `WindowsSelectorEventLoopPolicy` a nivel de
módulo llegaba tarde para el loop ya creado, y psycopg3 async no
soporta Proactor.

**Fix:** `.venv/Lib/site-packages/sitecustomize.py` — `site.py` lo
importa al arrancar cualquier intérprete del venv, antes de que exista
el loop. Aplica a `uvicorn main:app`, `python -m uvicorn`, `python
main.py` y pytest. No es un workaround: corrige el orden real del
problema. El set a nivel de módulo en `main.py` se conserva (idempotente).

**Validación:** `python -m uvicorn main:app` → pools conectan en ~130 ms,
cero warnings de Proactor.

### F2 — HTTPExceptions de endpoints enmascaradas como 500 → **CORREGIDO**

`POST /api/auth/login` con contraseña incorrecta devolvía **500** en vez
de 401, por dos capas:

1. `core/dependencies.py::get_db`/`get_db_sync` y
   `database.py::get_db_connection[_sync]` capturaban `Exception`
   genérica → `HTTPException`/`MelantiaException` intencionales se
   re-envolvían como `DatabaseConnectionError` (500).
2. El `print("❌ [DB ERROR] …")` del handler fallaba en consola
   Windows cp1252 (`\u274c`), ocultando el error real.

**Fix aplicado:**
- `database.py`: rollback siempre; `HTTPException`/`MelantiaException`
  se re-lanzan tal cual sin loguearse como error de BD; print sin emoji.
- `dependencies.py`: `except (HTTPException, MelantiaException): raise`
  antes del `Exception` genérico en `get_db` y `get_db_sync`.

**Validación:** 401 credenciales incorrectas, 401 usuario inexistente,
409 registro duplicado, 404 recurso inexistente, 401 sin token,
401 token inválido — todos correctos (§5).

### F3 — Warning `passlib 1.7.4` + `bcrypt 4.2.0` → **CORREGIDO**

`(trapped) error reading bcrypt version` — `bcrypt.__about__` se retiró
en bcrypt≥4.1. **Fix:** `bcrypt==4.0.1` fijado en
`backend/requirements.txt` e instalado en `.venv`. Verificado:
hash+verify sin warnings; el hash `$2b$` generado con 4.2.0 sigue
verificando con 4.0.1. Sin cambio en el sistema de hashing.

### F4 — `mediciones_campo.sql` existe en `schema/` pero fuera de ETAPA 1


El archivo está aprobado canónicamente (decisión A5, puntos GPS) pero
**no está en el orden pasos 0–9 ni en la lista de validación** — su uso
es Etapa 2 (Fase B geoespacial). **No ejecutado.** Queda pendiente.

### F5 — Conteo "26 tablas" del plan quedó desactualizado

Tras las extracciones C2–C4 el total real es **30** (sin
`mediciones_campo`). Documentado aquí como referencia corregida.

### F6 — `contexto/fincas` devolvía 500 cuando el usuario TIENE fincas → **CORREGIDO**

Detectado en el smoke P-7 al insertar una finca de prueba:

```
GET /api/v1/asistente/contexto/fincas → 500
"tuple indices must be integers or slices, not str"
```

**Causa real:** `backend/shared/repositories/fincas.py` usaba
`conn.execute()` directamente; las conexiones del pool no llevaban
`row_factory` (default `tuple_row`), así que las filas llegaban como
tuplas y `finca["id"]` fallaba.

**Auditoría previa al fix (autorizada):** ningún punto del backend usa
acceso posicional (`row[0]`) sobre filas de psycopg — todos los
consumidores (`auth`, `negocios`, `evidencias`, `main.py`, tests)
asumen acceso por nombre. El cambio global era seguro.

**Fix aplicado (dos niveles):**
1. `database.py`: `kwargs={"row_factory": dict_row}` en
   `AsyncConnectionPool` y `ConnectionPool` — alinea los pools con la
   convención del codebase (todo acceso por nombre).
2. `fincas.py`: cursor `dict_row` explícito en las **5** funciones
   (incluye `contar_animales_finca`, también afectada) — el repositorio
   queda autocontenido y correcto aunque cambie la config del pool.

**Validación:** `contexto/fincas` con finca+lote+hato → 200 con
estructura completa; `contexto/lotes/{id}` → 200; lote inexistente →
404; lote ajeno → 403; repo 5/5 funciones contra BD real; pytest
54/54 sin regresión.

### F7 — `main.py` usa `as conn:` sobre contextmanager que entrega tupla → **CORREGIDO** (P-8, autorizado)

Detectado en la auditoría de F6: en `main.py` (líneas ~282, 442, 559,
761) se hacía `async with get_db_connection() as conn:` pero la función
entrega `(conn, cursor)` → `conn` era la tupla y `conn.execute` lanzaba
`AttributeError`. Paths latentes: worker de score, limpieza quincenal,
endpoint de registro de campo e incentivo Melantios.

**Corrección aplicada (P-8):** los 4 consumidores ahora desempaquetan
`async with get_db_connection() as (conn, cursor):`. Contrato de
`get_db_connection()` sin cambios. Verificación §10 P-8.

## 7. NOTICEs observados (esperados, no errores)

- `negocios_rurales_v2.sql`: `DROP CONSTRAINT IF EXISTS` previos al
  `ADD CONSTRAINT` de `publicaciones_oferta_fk`/`_demanda_fk` → NOTICE
  "no existe la restricción" en primera ejecución. Idempotente.
- `registros_campo.sql`: `DROP TRIGGER IF EXISTS` → NOTICE análogo.
- `negocios_rurales_v2.sql` contiene `DROP TRIGGER IF EXISTS` (6×) —
  idempotente, no destructivo de datos; permitido por el archivo
  canónico aprobado.

## 8. Correcciones realizadas

| Archivo | Cambio | Motivo |
|---|---|---|
| `.venv/Lib/site-packages/sitecustomize.py` | **Nuevo** — fija `WindowsSelectorEventLoopPolicy` al arranque del intérprete | F1 — causa real del fallo `uvicorn main:app` en Windows |
| `backend/database.py` | `get_db_connection`/`_sync`: re-lanza `HTTPException`/`MelantiaException` sin loguearlas como error de BD; `print` sin `❌` | F2 |
| `backend/core/dependencies.py` | `get_db`/`get_db_sync`: `except (HTTPException, MelantiaException): raise` antes del genérico | F2 |
| `backend/requirements.txt` | `bcrypt==4.2.0` → `bcrypt==4.0.1` | F3 — compatibilidad passlib 1.7.4 |
| `backend/database.py` | `kwargs={"row_factory": dict_row}` en ambos pools | F6 — alinear con convención dict del codebase |
| `backend/shared/repositories/fincas.py` | cursor `dict_row` explícito en las 5 funciones | F6 — repo autocontenido |
| `backend/main.py` | 4× `as conn:` → `as (conn, cursor):` | F7/P-8 — desempaquetar la tupla del contextmanager |

Sin cambios al schema SQL, a controllers, ni a funcionalidad.

## 9. Resultado final

| Objetivo | Estado |
|---|---|
| Estructura ETAPA 1 en `melantia_db` (PG17) | **COMPLETA** — 30 tablas, 66 FKs, 37 CHECKs, 12 UNIQUEs, 51 idx, 7 triggers |
| Datos iniciales | OK — vacío, sin seeds (B6) |
| Arranque `uvicorn main:app` / `python -m uvicorn` | **FUNCIONA** (sitecustomize) |
| AUTH E2E | **SUPERADO** — 12/12 verificaciones (§5) |
| Códigos de error HTTP | 401/401/401/409/404 correctos |
| PostGIS | Confirmado **ausente del servidor** — ni siquiera instalable sin instalar binarios; decisión A3/B1 intacta |
| Datos de prueba | **Eliminados** — `usuarios`=0 y todas las tablas en 0 filas |
| DROPs destructivos / geo / tablas vetadas | Ninguno ejecutado |
| Warnings restantes | Ninguno (Proactor y passlib resueltos) |

## 10. Verificación post-migración del plan (P-6, P-7)

### P-6 — pytest: **54/54 PASSED** (17.1 s)

```
54 passed, 7 warnings in 17.10s
```

Warnings (no bloqueantes): deprecación starlette `BlockingPortal` en
TestClient; `Field(example=...)` deprecado en
`modules/suscripciones/schemas.py` (Pydantic v2). Sin fallos, sin
tests modificados.

### P-7 — Smoke M2 `GET /api/v1/asistente/contexto/fincas`

| Caso | Resultado |
|---|---|
| Arranque API (`python -m uvicorn main:app`) | OK — pools conectan |
| Token válido, usuario sin fincas | **200** `{"usuario_id": "…", "fincas": []}` |
| Token válido, finca + lote + hato | **200** — estructura completa (`lotes[]`, `cabezas_ganado: 12`) |
| `contexto/lotes/{id}` válido | **200** — lote + finca + ownership |
| Lote inexistente | **404** `Lote no encontrado` |
| Lote de otro usuario | **403** `no pertenece al usuario autenticado` |
| Sin token | **401** `AUTHENTICATION_ERROR` |
| Token inválido | **401** `INVALID_TOKEN` |
| Repo `shared/repositories/fincas.py` | **5/5 funciones OK** contra BD real |
| Otros consumidores del pool | Sin afectación — ninguno usa acceso posicional (auditoría completa) |

### P-8 — Corrección F7 y smoke de las 4 rutas (`main.py`)

**pytest tras el fix: `54 passed, 7 warnings in 14.36s`** — sin regresión.

| Ruta | Caso | Resultado |
|---|---|---|
| R3 `POST /api/ia/clasificar-evidencia` | registro de campo + abono Melantios | **201** — `+10.00 Melantios`, `registro_id` generado |
| R1 `recalcular_score_productivo` (background task de R3) | worker en segundo plano | **OK** — log: `Indicador productivo actualizado: 315` |
| R4 `GET /api/finanzas/perfil-bancario/{id}` | incentivo/perfil Melantios | **200** — `indicador_productivo_melantia: 315` (consistente con R1) |
| R2 `POST /api/sistema/cron-quincenal` | lanza worker de limpieza | **202** + log worker: `Registros eliminados: 0` — sin `AttributeError` |

Ningún `AttributeError` en log del servidor, ningún 500 nuevo. Tras el
smoke se eliminó el usuario de prueba (`1777777777`) — CASCADE limpió
`registros_campo`, `usuarios_suscripciones`, `perfil_economico_productor`
y `evidencias_documentos`. Verificación final: **0 filas en las 30
tablas**. Conteo estructural intacto: 30 tablas · 30 PK · 66 FK ·
37 CHECK · 12 UNIQUE · 51 índices · 7 triggers.

## 11. Pendientes

| # | Ítem | Bloquea |
|---|---|---|
| ~~P-4~~ | ~~`mediciones_campo.sql` sin ejecutar~~ — **RESUELTO** en ETAPA 2-A (§13) | — |
| P-5 | Seeds INEC (B6) | Catálogos geo con datos |
| ~~P-8~~ | ~~F7: `as conn` recibe tupla en `main.py`~~ — **RESUELTO** (§10 P-8) | — |
| P-9 | Warnings Pydantic `Field(example=...)` en `suscripciones/schemas.py` | Higiene |
| P-10 | `negocios_rurales/controllers.py` usa columnas v1 (`rubro_o_ruta`, `estado='Abierta'`) sobre schema v2 → 500 conocido; adaptación = ETAPA 3 (A1) | M4 funcional |

## 12. Aprobación requerida

**ETAPA 1 cerrada** (P-6, P-7, F6 y P-8/F7 resueltos — todas las rutas
del backend operativas, BD sin datos de prueba). No se avanza a ETAPA 2
(geoespacial) sin aprobación expresa.

## 13. ETAPA 2-A — `mediciones_campo` (autorizada y ejecutada)

**Fecha:** 2026-09-28 · **PostgreSQL:** 17.11 · **Opción:** A (archivo
canónico tal cual, sin modificaciones).

**SQL ejecutado:** `backend/database/schema/mediciones_campo.sql`
completo, dentro de transacción explícita `BEGIN → COMMIT` (habría sido
`ROLLBACK` ante cualquier error — no hubo). Sin `migracion_inicial.sql`,
sin PostGIS, sin dependencias geoespaciales, sin CHECKs/índices
adicionales ni cambios de tipos.

### Resultado estructural

| Métrica | Esperado | Real |
|---|---|---|
| Tablas | 31 | **31** |
| PK | 31 | **31** |
| FK | 68 | **68** |
| Índices `idx_*` | 53 | **53** |
| Columnas `mediciones_campo` | 12 | **12** |
| `id` default `uuid_generate_v4()` | sí | **sí** |
| FK `usuario_id → usuarios ON DELETE CASCADE` | sí | **sí** |
| FK `lote_id → lotes ON DELETE SET NULL` | sí | **sí** |

Cero modificaciones a las 30 tablas existentes.

### Pruebas funcionales (datos temporales)

| # | Prueba | Resultado |
|---|---|---|
| T1 | Insert válido → `id` UUID y `fecha_hora` automáticos | OK — `2026-09-28 18:00:51-05` |
| T2 | Lectura `latitud/longitud/precision/sensor_tipo` | OK — `(-0.95, -80.73, 4.2, 'GPS')` |
| T3 | `usuario_id` inexistente | `ForeignKeyViolation` — rechazada |
| T4 | `lote_id` inexistente | `ForeignKeyViolation` — rechazada |
| T5 | `DELETE` lote → `lote_id` en medición | `NULL` — SET NULL funciona |
| T6 | `DELETE` usuario → medición | 0 filas — CASCADE funciona |

**Datos temporales eliminados:** usuario `1766666666` + finca + lote +
medición — verificación final **0 filas en las 31 tablas**.

**pytest:** `54 passed, 7 warnings in 9.24s` — sin regresión.

### Desviaciones / notas

- La auditoría previa afirmó que `fincas.coordenadas_gps` no existía:
  **error corregido** — la columna sí existe (TEXT), verificado durante
  las pruebas. El plan geoespacial prevé normalizarla a GeoJSON/PostGIS
  (decisión de subfase posterior).
- Error de consola cp1252 con `→` en un print de verificación — solo
  cosmético del script de prueba, sin efecto en BD ni código.
- Riesgos de diseño del archivo canónico (sin CHECK en `sensor_tipo`/
  `unidad_medida`, lat/lon `REAL` sin rango, sin índice `lote_id`/
  `fecha_hora`, `usuario_id` nullable) quedan **registrados y no
  aprobados** — decisión diferida a la subfase de modelado GPS/sensores/
  sync offline, según autorización.

**Detenido tras validación.** Sin repository, service, schemas ni
endpoints nuevos.

## 14. ETAPA 2-B1 — `levantamientos` + vértices GPS (autorizada y ejecutada)

**Fecha:** 2026-09-28 · **PostgreSQL:** 17.11 · Alcance: solo BD, sin
endpoints/repository/frontend.

**SQL ejecutado:** nuevo archivo canónico
`backend/database/schema/levantamientos.sql` — transacción
`BEGIN → COMMIT` limpia, sin errores.

### Objetos creados

- **`levantamientos`** (10 columnas): `id` UUID + `uuid_generate_v4()`,
  `usuario_id → usuarios CASCADE`, `lote_id → lotes SET NULL`,
  `nombre`, `observaciones`, `estado VARCHAR(30) NOT NULL DEFAULT
  'borrador'` ('borrador','cerrado','aplicado'), `area_m2`,
  `perimetro_m` NUMERIC(14,2), `created_at`/`updated_at` TIMESTAMPTZ.
- **`mediciones_campo` ALTER**: `+levantamiento_id UUID →
  levantamientos CASCADE`, `+orden INTEGER`, `latitud`/`longitud`/
  `precision_gps_metros` `REAL → DOUBLE PRECISION`.
- **Índices** (convención `idx_*`): `idx_levantamientos_usuario`,
  `idx_levantamientos_lote`, `idx_mediciones_levantamiento` — añadidos
  por convención del esquema sobre las nuevas FKs; la limitación
  registrada de `mediciones_campo` (sin índice `lote_id`/`fecha_hora`)
  permanece sin tocar.

### Resultado estructural

| Métrica | Antes | Después |
|---|---|---|
| Tablas | 31 | **32** |
| PK | 31 | **32** |
| FK | 68 | **71** (+2 en `levantamientos`, +1 `levantamiento_id`) |
| Índices `idx_*` | 53 | **56** |
| Columnas `mediciones_campo` | 12 | **14** |
| Tipos GPS | REAL | **DOUBLE PRECISION** |

`lote_id ON DELETE SET NULL` en `mediciones_campo` **se mantiene**.

### Pruebas funcionales (datos temporales)

| # | Prueba | Resultado |
|---|---|---|
| T1 | Insert `levantamientos` → `id` UUID, `estado='borrador'`, `created_at` automáticos | OK |
| T2 | 4 vértices GPS con `orden` 1-4 ligados al levantamiento | OK |
| T3 | `DELETE` levantamiento → 0 vértices | **CASCADE OK** |
| T4 | `DELETE` usuario → 0 levantamientos | **CASCADE OK** |

**Datos temporales eliminados:** usuario `1755555555` + finca + lote +
levantamientos + vértices — **0 filas en las 32 tablas**.

**pytest:** `54 passed, 7 warnings in 9.00s` — sin regresión.

`fincas.coordenadas_gps` intacta (no eliminada, no modificada).
Sin PostGIS ni dependencias nuevas.

**Detenido tras 2-B1.** Pendientes de la subfase siguiente: repository
`levantamientos`, schemas Pydantic, endpoints `POST/GET`, cola offline
del cliente y decisión sobre zona UTM 17S/18S.

## 15. ETAPA 2-B2 — Repository + Schemas de levantamientos (autorizada)

**Fecha:** 2026-09-28 · Alcance: solo código Python + tests; sin
endpoints, sin frontend, sin cambios de BD ni dependencias.

### Archivos creados

| Archivo | Contenido |
|---|---|
| `backend/shared/repositories/levantamientos.py` | 6 funciones async con `dict_row` explícito (patrón de `fincas.py`): `listar_levantamientos_usuario`, `obtener_levantamiento`, `crear_levantamiento`, `agregar_puntos`, `obtener_puntos` (`ORDER BY orden`), `obtener_levantamiento_completo`, `guardar_resultado` |
| `backend/modules/asistente_tecnico/schemas/levantamientos.py` | `PuntoGPSCaptura` **hereda `PuntoGeo`** (sin duplicar), `LevantamientoCreate`, `PuntosAgregar` (≥1 punto), `PoligonoCaptura` (≥3), `ResultadoLevantamiento` (`estado` Literal borrador/cerrado/aplicado), responses |
| `backend/tests/test_levantamientos.py` | 14 tests: 8 de schemas + 6 de aislamiento repo |

### Aislamiento por `usuario_id`

- Lecturas: `WHERE usuario_id = %s` (lista/detalle) y
  `JOIN levantamientos … l.usuario_id = %s` (puntos).
- Escrituras: `agregar_puntos` hace `INSERT … SELECT … FROM
  levantamientos WHERE l.id=%s AND l.usuario_id=%s` — levantamiento
  ajeno → no inserta nada. `guardar_resultado` idem en el UPDATE.

### Convención de vértices en `mediciones_campo`

Las columnas NOT NULL heredadas del esquema de sensores se rellenan así:
`sensor_tipo='GPS'`, `valor_lectura=0`, `unidad_medida=
'grados_decimales'`. Registrado como convención provisional; la
definición final queda en la decisión de diseño de la subfase de
captura/sincronización.

### Verificación

- **pytest: `68 passed` (54 + 14 nuevos), 7 warnings** — sin regresión.
- **Smoke contra BD real** (datos temporales): crear → `borrador`;
  3 puntos insertados con `orden` 1-3; **usuario ajeno**: obtener→`None`,
  agregar→0 filas, listar→vacío; `obtener_levantamiento_completo` →
  vértices ordenados; `guardar_resultado` → `cerrado` + área/perímetro
  persistidos. Limpieza → **0 filas**.

### Nota

Primera ejecución de pytest falló con `pytest-asyncio` ausente (plugin
no instalado); los tests async se convirtieron a síncronos con
`asyncio.run` — sin nuevas dependencias.

**Detenido tras 2-B2.** Endpoints REST de levantamientos quedan
pendientes de autorización separada (2-B3), igual que el servicio que
conecte repository con `services/geodesia.py` y la cola offline.

## 16. ETAPA 2-B3 — Servicio + endpoints de levantamientos (autorizada)

**Fecha:** 2026-09-28 · Alcance: servicio + router + tests. Sin PostGIS,
pyproj, frontend, outbox ni cambios de esquema.

### Archivos

| Archivo | Contenido |
|---|---|
| `modules/asistente_tecnico/services/levantamientos.py` | **Nuevo** — coordina la operación: valida propiedad del lote vía `repositories.fincas`, estados, llama `geodesia.area_poligono` y persiste con el repository. Sin SQL ni fórmulas |
| `modules/asistente_tecnico/routes/levantamientos.py` | **Nuevo** — router delgado, 5 endpoints, JWT obligatorio en todos |
| `modules/asistente_tecnico/router.py` | `include_router(levantamientos.router)` |
| `tests/test_levantamientos_api.py` | **Nuevo** — 16 tests con `dependency_overrides` (sin BD real) |

### Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/v1/asistente/levantamientos` | Crear en `borrador` (201); `lote_id` ajeno → 403 |
| GET | `/api/v1/asistente/levantamientos` | Lista solo los propios |
| GET | `/api/v1/asistente/levantamientos/{id}` | Detalle + vértices ordenados; ajeno/inexistente → **404** |
| POST | `…/{id}/puntos` | Anexar vértices (201); solo en `borrador` → si no, 400 |
| POST | `…/{id}/calcular` | `geodesia.area_poligono` sobre puntos persistidos → guarda resultado y cierra; <3 puntos → 400; `aplicado` → 400 |

**Respuesta de aislamiento definida:** levantamiento ajeno → **404**
`RESOURCE_NOT_FOUND` (idéntico a inexistente — no se revela que existe).

### Resultados

- **pytest: `84 passed`** (68 + 16 nuevos), 7 warnings — sin regresión.
- **E2E real contra PostgreSQL** (API en `:8000`):

| Caso | Resultado |
|---|---|
| Crear levantamiento | **201** `estado=borrador` |
| Listar propios | **200** |
| Agregar 4 vértices | **201** |
| Calcular (cuadrado ~1 ha) | **200** — `area_m2=10037.54`, `perimetro_m=400.75`, `estado=cerrado` (cálculo real vía `geodesia.area_poligono`) |
| Usuario B: GET / puntos / calcular sobre recurso de A | **404 / 404 / 404** |
| Lista de B | **200** `[]` |
| Sin token | **401** en los 5 endpoints |
| Inexistente | **404** `RESOURCE_NOT_FOUND` |
| Puntos sobre `cerrado` | **400** `OPERATION_NOT_ALLOWED` |

- **Datos de prueba eliminados:** usuarios `1722222223`, `1711111111`,
  `1722222222` (residual del primer intento) — **0 filas en las 32
  tablas**.

### Desviación corregida durante la ejecución

La primera versión del servicio llamaba a `ResourceNotFoundError` /
`OperationNotAllowedError` con firmas incorrectas (los constructores de
`core/exceptions.py` son personalizados) → 500 en los casos de error.
Corregido: `ResourceNotFoundError("Levantamiento", id)`,
`LoteNotFoundError(id)`, `OperationNotAllowedError(operación, razón)`.
Detectado por los propios tests nuevos antes de tocar la API real.

**Detenido tras 2-B3.** Pendiente: cola offline/outbox del cliente,
aplicar levantamiento a `lotes.area_metros_cuadrados` / normalización de
`fincas.coordenadas_gps`, y decisión UTM 17S/18S.

## 17. ETAPA 2-B4 — Aplicar levantamiento al lote (autorizada)

**Fecha:** 2026-09-28 · Alcance: 1 endpoint + servicio + 1 función de
repository + tests. Sin cambios de esquema ni dependencias.

### Auditoría previa de `lotes.area_metros_cuadrados`

Consumidores actuales — **todos de solo lectura**:

- `main.py` worker `recalcular_score_productivo` (~L292): `SUM(area)`
  alimenta el score productivo (10 pts/ha).
- `repositories/fincas.py`: `listar_lotes_finca` / `obtener_lote` lo
  exponen al contexto M2.
- CHECK `lotes_area_no_negativa` (`NULL OR >= 0`): el área calculada
  siempre cumple.

Nadie lo escribía: es dato derivado seguro de actualizar.

### Cambios

- `shared/repositories/fincas.py` → `actualizar_area_lote()`: UPDATE con
  `finca_id IN (SELECT … WHERE usuario_id=%s)` — escritura aislada por
  propietario.
- `services/levantamientos.py` → `aplicar_levantamiento()`: verifica
  propietario (404), `estado='cerrado'` (400 si no), `lote_id` presente
  (400), escribe área, `estado='aplicado'`, log de auditoría
  `[LEVANTAMIENTO APLICADO]`. **Los vértices GPS y el cálculo se
  conservan intactos** — solo se toca el dato derivado del lote.
- `routes/levantamientos.py` → `POST /levantamientos/{id}/aplicar`.

### Resultados

- **pytest: `91 passed`** (84 + 7 nuevos), 7 warnings — sin regresión.
- **E2E real:** lote con `area=5000` → crear levantamiento ligado →
  4 vértices → calcular → **aplicar 200**: `estado=aplicado`,
  `lotes.area_metros_cuadrados=10037.54`, **4 vértices conservados** en
  `mediciones_campo`. Re-aplicar → **400**.
- Aislamiento y rechazos: ajeno/inexistente → 404; `borrador`/`aplicado`
  → 400; sin `lote_id` → 400; sin token → 401.
- **Datos de prueba eliminados** — 0 filas en las 32 tablas.

**Detenido tras 2-B4.** Pendientes separados: outbox offline del
cliente, normalización de `fincas.coordenadas_gps`, decisión UTM
17S/18S, seeds INEC (B6).
