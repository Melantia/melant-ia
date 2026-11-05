# MELANTIA — ESTADO DE IMPLEMENTACIÓN Y BITÁCORA TÉCNICA

> **Última revisión:** 2026-11-04 · **Rama verificada:** `feat/sync-offline-first-m8-m9`
> **Último commit verificado:** `50568e72` · Suite: **555 passed, 0 skipped, 0 errors**
> (suite ejecutada antes del commit)

---

## Reglas de jerarquía documental

1. **`MELANTIA_PROJECT_MASTER_FULL.md` es la fuente canónica** de
   arquitectura, objetivos, reglas, decisiones aprobadas y alcance
   del MVP.
2. **Este documento es la bitácora de ejecución:** evidencias
   técnicas, pruebas, historial de implementación y siguientes hitos.
3. El código fuente, los esquemas SQL, las migraciones, Git y las
   pruebas son **la evidencia** que determina qué está implementado
   realmente.
4. Si existe contradicción entre fuentes, no se resuelve aquí: se
   identifican las fuentes enfrentadas y se registra el conflicto
   para su aprobación en el Master FULL.
5. Una funcionalidad documentada o planificada **no se considera
   implementada** por el mero hecho de aparecer en un Markdown.

### Leyenda de estados

| Estado | Significado |
|---|---|
| **IMPLEMENTADO Y VERIFICADO** | Código + pruebas ejecutadas con resultado real registrado |
| **IMPLEMENTADO PARCIALMENTE** | Existe código funcional, pero falta parte del alcance previsto |
| **DISEÑADO, NO IMPLEMENTADO** | Documentado/aprobado; sin código funcional |
| **PENDIENTE DE VALIDACIÓN** | Código escrito, pero sin verificación suficiente |
| **FUTURO FUERA DEL MVP** | Planificado para fases posteriores al MVP |

---

## A. Propósito y relación con el Master FULL

Este archivo consolida el estado real de implementación de MELANTIA
al 2026-10-21: qué está construido, qué está verificado, con qué
evidencia y qué falta. Su propósito es operativo: permitir que cada
sesión de trabajo empiece sabiendo dónde está el proyecto sin releer
todo el historial.

**Límites:** no define arquitectura ni decide requisitos — eso es
exclusivo del Master FULL. No sustituye los documentos de dominio en
`docs/` (ADMINISTRACION, ECOSISTEMA_PROFESIONAL, planes de BD, etc.).
Si aquí algo difiere del Master FULL, **gana el Master FULL** y la
diferencia se registra como conflicto pendiente.

---

## B. Estado ejecutivo de MELANTIA

| Ámbito | Estado | Síntesis verificada |
|---|---|---|
| Backend FastAPI | **IMPLEMENTADO Y VERIFICADO** | `backend/main.py` con 7 routers montados; arranque con pools psycopg3; handler `MelantiaException`; suite 444 en verde |
| Frontend React/Vite | **IMPLEMENTADO PARCIALMENTE** | Shell + módulos M2–M5 montados en `AppShell.jsx`; build y lint OK; dashboard/Excel/reportes pendientes |
| PostgreSQL | **IMPLEMENTADO Y VERIFICADO** | 16.15-5 portable en `.pg16/`; `melantia_db` (52 tablas) y `melantia_test` vivas con esquema + m2–m9 + seeds |
| Autenticación y aislamiento | **IMPLEMENTADO Y VERIFICADO** | JWT dual (Supabase ES256/JWKS + legado HS256 con flag); `get_current_user` real; aislamiento `usuario_id` probado E2E en fincas y EP |
| Gestión de Fincas | **IMPLEMENTADO Y VERIFICADO** | CRUD fincas + lotes end-to-end (API + UI real); 23 tests E2E; ver §F |
| Geografía y migraciones | **IMPLEMENTADO Y VERIFICADO** | Catálogo DPA/INEC 24/221/1.042 con UNIQUE en los 3 niveles (`migracion_inicial` + m2–m7); seeds idempotentes |
| Pruebas automatizadas | **IMPLEMENTADO Y VERIFICADO** | 444 passed contra `melantia_test`; conftest fail-closed |
| Aplicación móvil | **DISEÑADO, NO IMPLEMENTADO** | React Native aprobado en Master (§2); no existe proyecto móvil en el repo |
| Offline / sincronización | **IMPLEMENTADO PARCIALMENTE** (infraestructura BD + push create + pull incremental implementados; update/delete/móvil pendientes) | Base servidor real: `client_operation_id` (m2/B1), dedup `hash_transaccion` (m6), `dispositivos`/`sesiones` (m4), `audit_eventos`. **Infraestructura sync (m8+m9) aplicada en `melantia_test` y `melantia_db`**: ledger `sync_operaciones` con `payload_hash` SHA-256, changelog `sync_cambios`, asignación transaccional `sync_cursors`+`sync_next_seq`, metadatos `version`/`deleted_at`/`dispositivo_origen_id`. **I-2 implementado (commit `5c8b6fe6`):** `POST /api/v1/sync/push` create-only de `finca`/`lote`, UUID de cliente, una tx por op, idempotencia por ledger, vínculo token→sesión→dispositivo. **I-4 implementado (commit `50568e72`):** `GET /api/v1/sync/pull` — descarga incremental por `seq ASC` con paginación `limit+1`, `next_cursor`/`has_more`, cursor independiente por dispositivo, ACK implícito por cursor recibido, `ultimo_pull_seq` monótono, cursor futuro → 409. Pendiente: writers web→changelog (el CRUD web aún no emite a `sync_cambios`), update/delete, conflictos por `version`, tombstones, retención/purga/`requires_full_resync`, más entidades, cliente móvil. Diseño: `docs/SYNC_OFFLINE_FIRST_DESIGN.md` |
| Administración General | **DISEÑADO, NO IMPLEMENTADO** | Concepto completo en §42 + `docs/ADMINISTRACION.md`; sin rutas `/api/v1/admin/*` ni roles admin en código |
| Trazabilidad | **IMPLEMENTADO PARCIALMENTE** | Schema completo (plantillas, fases, eventos, cadena de custodia); sin API dedicada; evidencias tiene router propio |
| Evidencias | **IMPLEMENTADO PARCIALMENTE** | Router `/api/evidencias` + UI M11 existen; verificador SHA-256 por confirmar |
| Negocios rurales | **IMPLEMENTADO PARCIALMENTE** | Router `/api/negocios` + UI; **Bolsa incompatible con schema v2** (pendiente adaptación C5); comisión 3 % sin flujo |
| Excel import/export | **DISEÑADO, NO IMPLEMENTADO** | Solo `exportador_excel.py` legacy en raíz |

---

## C. Arquitectura acordada

```text
APP MÓVIL (React Native, campo)  ─┐
APP WEB (React, oficina/laptop)  ─┼──► FastAPI ──► PostgreSQL
ADMIN (uso privado, fundador)    ─┘        │
                              Storage │ Sync │ Audit (transversales)
```

**Un solo backend.** Web, Móvil y Administración **no** requieren
tres backends: comparten el mismo FastAPI, la misma PostgreSQL y las
capacidades transversales (storage de evidencias, sincronización,
auditoría). Se diferencian por cliente y por autorización.

**Separación de identidades y roles (diseño aprobado):**

| Plano | Qué es | Fuente |
|---|---|---|
| Perfil/identidad del usuario | quién es la persona (auth, `usuarios`) | módulo `auth` |
| Workspace | contenedor organizacional del EP | EP-4B |
| Proyecto profesional + rol en proyecto | rol contextual (propietario/socio/técnico/cliente) | EP-4E |
| Rol administrativo MELANTIA (L0–L5) | gobierno de la plataforma, eje independiente | §42–43 |

**Regla:** los roles de proyecto no otorgan poder administrativo y
los roles administrativos no operan sobre datos productivos salvo
vía operación auditada. La Administración General sigue siendo
**DISEÑADO, NO IMPLEMENTADO** — no hay código de roles admin ni
rutas `/api/v1/admin/*` todavía.

---

## D. Bitácora cronológica de trabajo verificado

### 2026-10-20 — Saneamiento del entorno y suite en verde

- venv provisionado con subconjunto mínimo de
  `backend/requirements.txt` (sin tensorflow/opencv — los tests no
  los importan). `psycopg[binary]` requerido en Windows sin libpq.
- PostgreSQL 16.15-5 portable instalado en `.pg16/` (binarios EDB,
  SHA-256 verificado contra checksum oficial, sin Docker ni admin).
- Esquema completo aplicado a `melantia_db` y `melantia_test` según
  `docs/DB_MIGRATION_EXECUTION_PHASE1.md` + migraciones m2–m6.
  49 tablas.
- Seeds geográficos creados desde catálogo DPA (CC-BY-4.0):
  `seeds/{provincias,cantones,parroquias}.sql` — 24+221+1.042 filas
  idempotentes.
- Cuarentena `.legacy_extract/`: prototipo `asistente_tecnico_rural`
  y draft `Controllers.py` perdido en frontend.
- Suite: **412 passed, 0 skipped** con `MELANTIA_TEST_DATABASE_URL`.

### 2026-10-21 — Auditoría de Git, commits clasificados y m7

- Auditoría: raíz `E:\Desktop\MELANTIA` (proyecto en `melantia/`),
  rama `ep/ecosistema-profesional-ddl`. Trabajo acumulado registrado
  en commits por responsabilidad: 10 de clasificación
  (`0ee6c548`..`ea5a4a74`) + `228ba09f` (m7) + `166dfaff`,
  `3c2b1710` (docs del día). Ver `git log`.
- Auditoría geo en ambas bases: 0 duplicados, 0 malformados, 0
  huérfanos, prefijos coherentes, conteos exactos.
- **m7** `m7_geografia_inec_unicidad.sql`: UNIQUE indexes en
  `cantones.codigo_inec` y `parroquias.codigo_inec` (aditiva,
  transaccional, idempotente, rollback = DROP INDEX).
  `geografia.sql` declara UNIQUE inline para instalaciones nuevas.
  Aplicada y verificada en `melantia_db` y `melantia_test`.
- `test_m7_geografia_inec.py` (9 tests: estáticos + ejecución real
  en schema temporal aislado).
- Suite: **421 passed** (412 + 9).
- Hallazgo documentado: directorios `melantia/{assets, business,
  core_python, data, .pytest_cache}` **vacíos** con ACL de Windows
  restrictiva — git reporta "permission denied" al enumerarlos;
  inofensivos, borrado pendiente de decisión del usuario.
- Warning cosmético documentado: `psql -1` + BEGIN/COMMIT interno
  (convención de migraciones) emite "already/no transaction in
  progress"; inofensivo, explicado en el header de m7.

### 2026-10-21 — Gestión de Fincas end-to-end (hito completado)

- `shared/repositories/fincas.py` ampliado **aditivamente** (la
  función `listar_lotes_finca` ganó `finca_id`+timestamps; lecturas
  del adaptador M2 intactas) + nuevo `shared/repositories/
  geografia.py` (catálogo solo-lectura, reusable).
- Nuevo `backend/modules/gestion_fincas/` (convención EP: router
  agregador + `routes/` + `schemas/` + `services/` → repositories).
- Montado en `main.py` bajo `/api/v1` (prefijo canónico de módulos
  modernos): `/api/v1/fincas*` y `/api/v1/geografia/*`.
- Frontend: `GestionFincas.jsx` reescrito funcional +
  `fincas.service.js` sobre `apiClient`/`errors.js`.
- Auditoría pre-commit detectó y corrigió: botón ✏️ Editar en vista
  detalle no abría el formulario (vive en vista lista) →
  `setDetalle(null)` en `iniciarEdicion`.
- Auditoría final aprobada → commits autorizados en rama propia
  `feat/gestion-fincas-end-to-end`:
  `73f4b32c` (19 archivos, código+tests) y `5b061f5d` (docs).
- Suite: **444 passed** (421 + 23 nuevas E2E); lint 0 errores
  (2 warnings preexistentes); build OK (110 módulos).

### 2026-10-21 — Incidencia pgAdmin 4 (entorno de desarrollo)

- **Síntoma:** pgAdmin 4 v9.18 no arrancaba — su Python embebido
  lanzaba `ImportError: no pq wrapper available` (el `.pyd` de
  `psycopg_c` no cargaba y `psycopg_binary` no estaba instalado).
- **Corrección:** `psycopg-binary==3.3.4` (pareja del psycopg 3.3.4
  incluido) instalado en el Python embebido de pgAdmin
  (`AppData\Local\Programs\pgAdmin 4\python`).
- **Verificación:** `import psycopg` → `impl: binary`; `pgAdmin4.py`
  arranca como proceso web y se mantiene vivo.
- **PENDIENTE DE VALIDACIÓN:** la apertura de la interfaz gráfica
  (ventana de escritorio) NO está confirmada — el usuario debe
  verificarla. Si falla, siguiente sospechoso: perfil
  `%APPDATA%\pgAdmin` (renombrable; regenera limpio pero pierde
  servidores guardados — copiar antes).

### 2026-10-21 — Diseño offline-first y sincronización (documental)

- Auditoría real del repo: cimiento existente localizado
  (`client_operation_id` m2/B1, `hash_transaccion` m6,
  `dispositivos`/`sesiones` m4, `sync_status` en DDL trazabilidad,
  `audit_eventos`, `updated_at` mantenido por repo) y brechas
  confirmadas (sin React Native/Expo, sin cola, sin endpoints sync,
  fincas/lotes/hatos sin metadatos de sync).
- Creado `docs/SYNC_OFFLINE_FIRST_DESIGN.md`: arquitectura,
  contrato conceptual push/pull, idempotencia (`client_operation_id`
  canónico + ledger `sync_operaciones`), changelog `sync_cambios`
  con cursor `seq`, política de conflictos por `version`, evidencias
  en 2 fases con SHA-256, evaluación de persistencia móvil
  (SQLite propuesto) y matriz m2–m7.
- **Dictamen migraciones:** sí necesarias, en dos etapas aprobadas —
  `m8_sync_infraestructura` (`sync_operaciones` + `sync_cambios` +
  `sync_cursors`) y `m9_sync_metadatos_entidades` (`version`,
  `deleted_at`, `client_operation_id`, `dispositivo_origen_id` en
  fincas/lotes/hatos). Nombres conformes a la convención
  `m<N>_<desc>.sql` verificada. Pendientes de autorización;
  **no implementadas**.
- Revisión final del diseño (misma fecha): cursor corregido de
  `BIGSERIAL` ingenuo a **contador transaccional por ámbito**
  `sync_cursors` (BIGSERIAL no garantiza orden de commit —
  escenario documentado en §4.6 del diseño); decisiones aprobadas
  incorporadas: Expo + development builds, `expo-sqlite`, object
  storage tras abstracción, retención 90 días con reconciliación
  que conserva ops locales pendientes.
- Tarea exclusivamente documental: cero cambios de código, SQL o BD.

### 2026-10-21 — Infraestructura de sincronización m8 + m9 (solo `melantia_test`)

- Rama `feat/sync-offline-first-m8-m9`.
- **`m8_sync_infraestructura.sql`** aplicada: `sync_cursors`
  (contador transaccional por ámbito — NO BIGSERIAL, serializa por
  row lock), `sync_cambios` (changelog por scope), `sync_operaciones`
  (ledger idempotente `UNIQUE(usuario_id, client_operation_id)`) y
  función `sync_next_seq` (única vía de asignación).
- **`m9_sync_metadatos_entidades.sql`** aplicada: `version`,
  `deleted_at`, `dispositivo_origen_id` en `fincas`/`lotes`/
  `hatos_ganaderos`; `ultimo_pull_seq` en `dispositivos`; índices
  parciales de filas activas. **`client_operation_id` queda en el
  ledger, no en entidades** (decisión documentada).
- **Ámbito resuelto:** solo `usr:<usuario>` habilitado (autorización
  existente por `usuario_id`); `wks:`/`prj:` reservados; un scope
  existente no concede acceso a otros usuarios.
- **Prueba concurrente ejecutada** (`test_pg_cursor_commits_fuera_de_orden`):
  dos transacciones reales — T2 bloquea en `sync_next_seq` hasta que
  T1 confirma; pull intermedio ve 0 filas; orden final [1,2]; rollback
  reutiliza el seq sin dejar hueco. Propiedad del cursor **validada**.
- 15 tests nuevos en `test_m8_m9_sync_infraestructura.py` — todos verdes.
- Suite completa: **459 passed** (444 + 15), 0 skipped, 0 errors.
- **`melantia_db` NO tocada** — pendiente de revisión del diff.

### 2026-10-22 — Corrección FAIL-01: idempotencia segura del ledger

- Auditoría detectó: sin huella de solicitud, el mismo
  `client_operation_id` con contenido distinto habría devuelto el
  resultado previo y descartado en silencio la operación nueva.
- **Corrección en m8** (aún sin commit ni aplicación a `melantia_db`):
  `sync_operaciones.payload_hash VARCHAR(64) NOT NULL` = SHA-256 de la
  solicitud canónica (scope, entity_type, entity_id, accion,
  base_version, payload; claves ordenadas, Unicode literal, UTF-8).
  Distinto de `hash_transaccion` (m6, dedup por contenido de negocio).
- Semántica A–D documentada y probada: mismo hash → `duplicate` con el
  resultado guardado; hash distinto → detección para
  `idempotency_key_reuse` (409 en el futuro servicio); concurrentes
  misma clave → una sola gana (commit) o toma el relevo (rollback);
  rollback nunca deja éxito registrado.
- Re-aplicación segura en `melantia_test`: tablas sync verificadas
  vacías y sin dependientes → `DROP TABLE sync_operaciones` +
  re-ejecución de m8 con `psql -1`. Esquema resultante ≡ archivo.
- Tests ampliados a **20/20 verdes** (5 nuevos: existencia NOT NULL,
  canonicidad del hash, misma clave+mismo hash, misma clave+hash
  distinto, concurrencia misma clave con commit y rollback).
- **`melantia_db` verificada intacta** tras toda la operación.

### 2026-10-22 — Aplicación controlada de m8/m9 a `melantia_db`

- **Respaldo previo verificado:** `pg_dump -Fc` →
  `…\AppData\Local\MELANTIA\backups\melantia_db_pre_m8_m9_20261022.dump`
  (fuera de la raíz Git; 191.814 bytes; SHA-256
  `912d8e35e7cc788730c418477c7bb8ad3eef431f8964809cc32fcf0070660c6f`).
- **Restauración de prueba real:** `pg_restore` a base temporal
  `melantia_restore_check_m8` exit 0; comparada 1:1 con `melantia_db`
  (49 tablas, 14 funciones, 4 secuencias, 174 índices, 111 PK/108 FK/
  61 CHECK, 2 extensiones, geo 24/221/1.042, 6 perfiles, 8 triggers).
  Base temporal eliminada tras verificar su nombre.
- **Aplicación:** m8 (exit 0, verificada) → m9 (exit 0) sobre
  `melantia_db`, rama `feat/sync-offline-first-m8-m9`, commits
  `974baf08`/`57b33a3d`. Ejecutadas con `psql -1`; los warnings
  "already/no transaction in progress" se documentaron — cada
  archivo conservó atomicidad propia (BEGIN/COMMIT interno).
- **Verificación post:** 52 tablas (3 `sync_*`), `sync_next_seq`,
  9 columnas m9, `dispositivos.ultimo_pull_seq`, UNIQUE del ledger,
  `payload_hash` NOT NULL, 3 índices parciales; smoke transaccional
  de `sync_next_seq` retornó 1,2 y se revirtió — **cero residuo**.
  Datos previos intactos: geo 24/221/1.042, perfiles 6, triggers 8.
- **Sigue pendiente:** endpoints push/pull, servicio de
  sincronización, cliente móvil — infraestructura de BD ≠ sync
  completa.

### 2026-11-04 — Sync Push I-2: create de finca/lote end-to-end

- Commit `5c8b6fe6` en `feat/sync-offline-first-m8-m9` (14
  archivos: 2 modificados + 12 nuevos). Sin migraciones: usa la
  infraestructura m8/m9 ya aplicada en `melantia_db` y
  `melantia_test`.
- `POST /api/v1/sync/push` — módulo `backend/modules/sync/` con la
  convención EP (router agregador + `routes/` + `schemas/` +
  `services/` → `shared/repositories/`). Sobre
  `{device_id, operations[1..50]}`; cada op lleva
  `client_operation_id`/`entity_id` UUID asignados por el cliente.
  Resultados por operación (`applied`/`duplicate`/`conflict`/
  `error`): el lote no es atómico — una tx por operación.
- Alcance create-only: `entity_type ∈ {finca, lote}`,
  `action='create'`; allowlist por op con error individual.
- Idempotencia: inserción especulativa en `sync_operaciones` como
  primer paso de la tx; `UNIQUE(usuario_id, client_operation_id)`
  bloquea a la concurrente hasta su commit/rollback;
  `payload_hash` SHA-256 canónico distingue `duplicate` de
  `idempotency_key_reuse`. Dominio + `sync_next_seq` + changelog
  `sync_cambios` + resultado del ledger confirman o revierten
  juntos.
- Seguridad (auditoría I-2 aplicada): **H-1** — la sesión EXACTA
  del token se vincula por `session_id` verificado (claim JWT,
  nunca decodificado sin firma) → `sesiones.auth_session_id` +
  `estado='activa'` + `expires_at > now` +
  `sesiones.dispositivo_id == device_id` del sobre + dispositivo
  propio y activo. Ninguna otra sesión activa del usuario
  sustituye el vínculo; la procedencia registrada
  (`dispositivo_origen_id`, `sync_operaciones.dispositivo_id`) es
  la del dispositivo de la sesión autenticada. Credenciales
  legacy HS256 sin `session_id` verificable → 401 controlado
  (solo en este endpoint; `get_current_user` global intacto).
  **M-1** (scope sync): `expires_at` se exige de verdad — una
  'activa' vencida no barrida no pasa. **M-2**:
  `ResourceNotFoundError` → `not_found` indistinguible; cualquier
  otra `MelantiaException`/inesperada → rollback + log +
  `internal` (la infraestructura ya no se disfraza de 404).
  **B-1**: colisiones UNIQUE clasificadas por
  `diag.constraint_name` (`uq_sync_operaciones_client_op` → flujo
  idempotente; `fincas_pkey`/`lotes_pkey` → política de
  propiedad; otras → `internal`). **B-2**: `base_version` no nulo
  en `create` → 422 del sobre en el schema.
- **B-3 registrado para I-3:** `_finca_propia` no filtra
  `deleted_at` — inerte hoy (ningún camino escribe tombstones);
  exigir filtro cuando exista soft-delete.
- Pruebas (ejecutadas antes del commit): 20 unitarias
  canon/schema + 33 E2E push contra `melantia_test` — auth real
  con tokens ES256 firmados de prueba + JWKS simulado (sesión
  correcta/otra sesión del mismo usuario/dispositivo ajeno/
  revocada/vencida-activa/legacy/sin puente), idempotencia
  intra-lote y entre requests, concurrencia real misma clave con
  conexiones independientes, rollback integral verificado hasta
  `sync_cursors.last_seq`, `DatabaseConnectionError` → `internal`
  (no `not_found`), `create`+`base_version` → 422. Suite
  completa: **517 passed, 0 skipped, 0 errors**.
- `melantia_db` intacta tras las pruebas
  (`sync_operaciones`/`sync_cambios` = 0).
- **Pendiente:** `GET /api/v1/sync/pull`, `update`/`delete`,
  conflictos por `version`, tombstones y purga, más tipos de
  entidad, writers web integrados al changelog (el CRUD web
  actual no emite a `sync_cambios`), cliente móvil Expo+SQLite y
  cola offline. M-1 global de `resolver_usuario_desde_claims`
  (sin `expires_at`) queda pendiente a nivel plataforma.

### 2026-11-04 — Sync Pull I-4: descarga incremental por dispositivo

- Commit `50568e72` en `feat/sync-offline-first-m8-m9` (5
  archivos: 3 modificados + 2 nuevos). Sin migraciones.
- `GET /api/v1/sync/pull?device_id=<uuid>&cursor=<int>&limit=<int>`
  — `device_id` obligatorio UUID; `cursor` entero ≥0 (default 0);
  `limit` default 100, rango 1–500. Respuesta
  `{changes[], next_cursor, has_more}`; cada change expone
  `seq`/`entity_type`/`entity_id`/`op`/`data`/`entity_version`
  (sin `scope`/`actor_id`/`created_at` internos).
- Lectura incremental: `WHERE scope = 'usr:<usuario_id>'
  AND seq > :cursor ORDER BY seq ASC LIMIT :limit+1` — el stream
  se sirve completo, sin filtros por `entity_type` que oculten
  secuencias; scope construido solo en servidor.
- Paginación: `limit+1` decide `has_more` sin consulta extra;
  `next_cursor` = último seq **incluido** en la página (nunca
  `cursor+limit` ni el máximo del servidor); página vacía →
  `next_cursor = cursor` (no se adelanta artificialmente).
- Errores del sobre: `cursor < 0` → 422 (validación);
  `cursor > last_seq del scope` → **409 `future_cursor`** sin
  servir eventos ni tocar metadatos del dispositivo; scope sin
  fila de cursor → máximo tratado como 0.
- **Alternativa B — ACK implícito:** el `cursor` recibido es la
  última secuencia que el dispositivo declara haber persistido en
  su tx local; el servidor NO da por confirmada la página que
  entrega. `dispositivos.ultimo_pull_seq` se actualiza solo con
  el cursor recibido: `GREATEST(COALESCE(ultimo_pull_seq,0),
  LEAST(cursor, last_seq))` — monótono por dispositivo, jamás
  retrocede ni supera el máximo confirmado. `ultimo_pull_seq` es
  metadato de seguimiento, NO suelo seguro de purga (un
  dispositivo restaurado puede reenviar cursor menor).
  `last_seen_at` se actualiza en cada pull válido.
- Seguridad: misma pila de I-2 — `get_sync_identity`, sesión
  EXACTA activa y no vencida, `sesiones.dispositivo_id ==
  device_id` (404 indistinguible), dispositivo propio y activo,
  legacy rechazado. Sin cambios en auth global, `sync_next_seq`,
  DDL ni CRUD web.
- Pruebas: **555 passed, 0 skipped, 0 errors** — ejecución
  completa realizada ANTES del commit I-4 (38 nuevas de pull:
  unitarias, integración PostgreSQL real y concurrencia con
  conexiones independientes; pull durante push sin eventos a
  medio confirmar; dos dispositivos con cursores independientes;
  interrupción y reintento; ACK monótono; aislamiento por scope;
  push confirmado entre páginas). `melantia_db` intacta.
- **Pendiente:** writers web→changelog (el CRUD web no emite —
  sus cambios NO aparecen en pull y no se finge que aparecen),
  update/delete, conflictos por `version`, tombstones, retención/
  purga/`min_seq`/snapshot/`requires_full_resync` (sin detección
  de cursor obsoleto posible aún), más tipos de entidad, cliente
  móvil offline-first. La sincronización bidireccional completa
  sigue pendiente.

---

## E. Base de datos y entorno

| Elemento | Valor verificado |
|---|---|
| Motor | PostgreSQL 16.15-5, binarios EDB portables en `.pg16/` (gitignored) |
| Arranque | `.pg16/pgsql/bin/pg_ctl.exe -D .pg16/data -l .pg16/pg.log start` |
| Parada | `.pg16/pgsql/bin/pg_ctl.exe -D .pg16/data stop` |
| psql | `.pg16/pgsql/bin/psql.exe -U postgres -h localhost -d melantia_db` |
| Auth | `trust` en localhost — **solo desarrollo** |
| Base app | `melantia_db` — **52 tablas: esquema + m2–m9 + seeds** (m8/m9 aplicadas 2026-10-22 con respaldo verificado) |
| Base tests | `melantia_test` — idéntica (m2–m9); conftest exige URL explícita (fail-closed) |

**Esquema aplicado** (`backend/database/schema/`): extensions →
geografia → usuarios → auth_puente → sesiones → gestion_fincas →
modulos/{animales, labores_pecuarias} → trazabilidad →
modulos/negocios_rurales_v2 → evidencias → registros_campo →
mediciones_campo → levantamientos → suscripciones →
ecosistema_profesional → migraciones → seeds.

**Migraciones** (`backend/database/migraciones/`): `migracion_inicial`,
m2 levantamientos integridad, m3 EP-4E autorización, m4 sesiones +
dispositivos (F7a), m5 auth_puente usuarios, m6 dedup
`hash_transaccion` registros_campo, m7 UNIQUE INEC cantones +
parroquias.

**Seeds** (`backend/database/seeds/`): provincias (24), cantones
(221), parroquias (1.042), perfiles_profesionales. Idempotentes.
Códigos INEC: provincia 2 dígitos, cantón 4, parroquia 6; UNIQUE en
los tres niveles (provincias desde schema; cantones/parroquias por
m7).

**Suite de pruebas (comando canónico):**

```bash
MELANTIA_TEST_DATABASE_URL="postgresql://postgres@localhost:5432/melantia_test" \
  venv/Scripts/python.exe -m pytest backend/tests -q
```

Sin la variable, los tests de BD hacen skip explícito — el conftest
es fail-closed y valida que el destino sea BD de pruebas local.

**Fuera de Git (nunca commitear):** `.env`, `.pg16/`, `venv/`,
`.venv/`, `.legacy_extract/`, `node_modules/`, `frontend/dist/`,
`API OpenRouter/` (contiene `antigua_clave/` con credenciales),
`db_cluster-*.backup.gz`, `pgadmin4.exe`, logs, artefactos locales.

---

## F. Gestión de Fincas: estado real

**Estado: IMPLEMENTADO Y VERIFICADO** (commit `73f4b32c`, rama
`feat/gestion-fincas-end-to-end`).

### Endpoints registrados (verificados en `app.openapi()` por test)

| Método | Ruta | Función |
|---|---|---|
| POST | `/api/v1/fincas` | Crear finca → 201 |
| GET | `/api/v1/fincas` | Listar solo propias + conteos lotes/hatos |
| GET | `/api/v1/fincas/{id}` | Detalle con lotes (404 si ajena) |
| PATCH | `/api/v1/fincas/{id}` | Edición parcial campos permitidos |
| POST | `/api/v1/fincas/{id}/lotes` | Crear lote → 201 |
| GET | `/api/v1/fincas/{id}/lotes` | Listar lotes de finca propia |
| PATCH | `/api/v1/fincas/{id}/lotes/{lote_id}` | Editar lote de finca propia |
| GET | `/api/v1/geografia/provincias` | 24 provincias DPA |
| GET | `/api/v1/geografia/cantones?provincia_id=` | Cantones filtrados |
| GET | `/api/v1/geografia/parroquias?canton_id=` | Parroquias filtradas |

### Reglas de seguridad implementadas y probadas

- Identidad **solo** vía `get_current_user` (JWT); sin token → 401.
- `usuario_id` jamás entra por body: schemas `extra="forbid"` → 422.
- Recurso ajeno o inexistente → **404 indistinguible** (fincas,
  lotes, y lote-colgado-de-otra-finca).
- `UPDATE fincas ... AND usuario_id = %s` en SQL — el propietario
  no puede cambiarse por esta vía.
- Lotes: doble alcance (lote ∈ finca ∈ usuario), verificado por la
  finca padre antes de tocar el lote.
- Geografía validada por FK real del catálogo: parroquia→cantón→
  provincia coherentes o 422; niveles superiores ausentes se derivan.
- Todo parametrizado; nombres de columna del UPDATE salen del schema
  Pydantic, no del cliente.
- Sin DELETE físico por diseño — soft-delete llega con sync (m8).

### Pendiente en el módulo

Hatos ganaderos, animales individuales, eventos de trazabilidad,
prácticas regenerativas, escrituras `audit_eventos` (ADM-2),
metadatos de sincronización (`version`, `deleted_at`, `device_id`,
`hash_transaccion`).

---

## G. Matriz de pruebas y calidad

| Comando | Fecha | Resultado verificado |
|---|---|---|
| `pytest backend/tests -q` (sin TEST_URL) | 2026-10-20 | 373 passed / 39 skipped — antes de PostgreSQL |
| `pytest` con `MELANTIA_TEST_DATABASE_URL` | 2026-10-20 | **412 passed** — tras aplicar esquema a `melantia_test` |
| idem, post-m7 | 2026-10-21 | **421 passed** (+9 tests m7) |
| idem, post-Gestión-Fincas | 2026-10-21 | **444 passed** (+23 E2E M3), 0 skipped, 0 errors |
| idem, post-m8/m9 | 2026-10-21 | **459 passed** (+15 sync infra), 0 skipped, 0 errors — `melantia_test` con m8/m9 |
| idem, post-FAIL-01 (`payload_hash`) | 2026-10-22 | **464 passed** (+5 idempotencia), 0 skipped, 0 errors |
| idem, post-correcciones I-2 (push create) | 2026-11-04 | **517 passed** (+53: 20 canonical + 33 push E2E), 0 skipped, 0 errors — ejecutada antes del commit `5c8b6fe6` |
| idem, post-I-4 (pull incremental) | 2026-11-04 | **555 passed** (+38 pull E2E), 0 skipped, 0 errors — ejecutada antes del commit `50568e72` |
| `npm run lint` | 2026-10-20/21 | 0 errores; 2 warnings preexistentes en `DocumentosYImpresion.jsx` (`visualizarFichaDigital`, `evidenciasFiltradas` sin uso) |
| `npm run build` | 2026-10-21 | OK — 110 módulos, dist generado |
| m7 en psql `-1` | 2026-10-21 | Aplicada en ambas bases; warnings cosméticos documentados en el header de m7 |

Las cifras 412/421/444 **no son una sola ejecución**: corresponden a
tres hitos distintos del mismo entorno, cada una verificada en el
momento. Última ejecución real (esta fecha): 444 passed.

Advertencias conocidas (no errores): `Field(example=...)` deprecado
en `suscripciones/schemas.py`, `datetime.utcnow()` en
`core/security.py` y jose, permisos de escritura en
`.pytest_cache/` (ACL — directorio vacío bloqueado).

---

## H. Deuda técnica y próximos hitos

| # | Pendiente | Prioridad / nota |
|---|---|---|
| 1 | Merge/integración de `feat/gestion-fincas-end-to-end` a la rama de trabajo | Decisión del propietario del repo |
| 2 | Stack móvil: decisión Expo vs RN bare + persistencia local (SQLite propuesto) | Hito offline-first F0/F1 — ver `docs/SYNC_OFFLINE_FIRST_DESIGN.md` §3, §13 |
| 3 | Cola de sincronización + sync engine incremental + reintentos | Push create (I-2) y pull incremental (I-4) implementados; pendiente la cola del lado cliente (móvil) |
| 4 | Idempotencia y resolución de conflictos en flujos | Idempotencia por ledger + `payload_hash` implementada en push create; conflictos por `version` pendientes con update/delete |
| 5 | Migraciones de sync — **m8+m9 aplicadas a `melantia_test` y `melantia_db`** (2026-10-22, respaldo verificado) | Infraestructura usada por I-2 e I-4; pendientes los writers web→changelog y las demás acciones |
| 6 | M3: hatos, animales individuales, eventos de trazabilidad | Ampliación del módulo |
| 7 | Auditoría transversal (`audit_eventos` writers, ADM-2) + verificador SHA-256 evidencias | Antes de exponer trazabilidad pública |
| 8 | Excel import/export/validación, dashboard, reportes | Semana-4 del plan MVP |
| 9 | Negocios: adaptar Bolsa a `negocios_rurales_v2` (C5), transacciones + comisión 3 % | Semana-3 pendiente |
| 10 | Administración General (`/api/v1/admin/*`, roles L0–L5) | **Solo cuando corresponda** a su fase aprobada |
| 11 | Borrado de directorios vacíos con ACL (`assets/`, `business/`, `core_python/`, `data/`, `.pytest_cache/`) | Requiere confirmación del usuario |
| 12 | Warnings deprecación (`Field(example=)`, `utcnow()`) | Higiene, no urgente |
| 13 | M-1 global: `resolver_usuario_desde_claims` no exige `expires_at` | Corregido solo en el scope sync (`sesion_autenticada_activa`); pendiente a nivel plataforma |
| 14 | B-3: `_finca_propia` no filtra `deleted_at` | Inerte en I-2/I-4 (ningún camino escribe tombstones); exigir filtro cuando exista soft-delete |
| 15 | Writers web → `sync_cambios` no integrados | Los cambios del CRUD web NO aparecen en pull (limitación real verificada por test); integración en la fase de writers correspondiente |
| 16 | Retención/purga/`min_seq`/snapshot/`requires_full_resync` | No implementados: sin política de retención no hay detección de cursor obsoleto posible; `ultimo_pull_seq` es metadato, no suelo de purga |

**Siguiente hito técnico recomendado:** diseño e implementación
controlada de la **sincronización offline-first** (almacenamiento
local, cola, push/pull, idempotencia, conflictos) — tras confirmar
el estado final del hito actual.

---

## I. Decisiones arquitectónicas relacionadas

| Decisión | Estado | Relación con el Master FULL |
|---|---|---|
| Backend común FastAPI para todos los clientes | Aprobado e implementado | §2 principio arquitectónico |
| Tres superficies: Móvil, Web, Administración | Aprobado como diseño; solo Web existe en código | §35, §42 |
| Roles de proyecto separados de roles administrativos | Diseño aprobado | EP (§30s) + §42–43 |
| `shared/repositories/audit.py` separado de auditoría admin futura | Diseño conceptual; repo existe, writers pendientes (ADM-2) | §42, docs/ADMINISTRACION.md |
| Gestión administrativa de releases separada del mecanismo técnico de actualización | Diseño conceptual | docs/ADMINISTRACION.md |
| CRUD Gestión de Fincas conectado a PostgreSQL | **Implementado y verificado** (444 tests, rama `feat/gestion-fincas-end-to-end`) | Módulo 3 |
| Aplicación móvil y sincronización completa | Diseño técnico propuesto en `docs/SYNC_OFFLINE_FIRST_DESIGN.md`; implementación pendiente | §2, §4–§6, Offline First |
| Panel funcional de Administración General | Pendiente de implementación | §42 |

---

## J. Registro de actualización del documento

| Fecha | Cambio | Fuentes verificadas | Estado |
|---|---|---|---|
| 2026-10-21 | Creación del documento: estado al 2026-10-21, hitos 10-20/10-21, m7, Gestión de Fincas, incidencia pgAdmin | `git log` (`0ee6c548`..`5b061f5d`), suite 444 ejecutada, OpenAPI, `docs/*`, Master FULL | Verificado |
| 2026-10-21 | Registro del diseño offline-first (`docs/SYNC_OFFLINE_FIRST_DESIGN.md`): auditoría de cimiento sync existente, dictamen de migraciones, deuda §H actualizada | Auditoría de schemas m2–m7, módulos, `frontend/src/shared/offline/`, `package.json`; commit `280740ef` | Verificado |
| 2026-10-21 | Revisión final del diseño sync: cursor corregido a `sync_cursors` transaccional por scope (BIGSERIAL ≠ orden de commit); decisiones aprobadas incorporadas (Expo+dev builds, expo-sqlite, object storage, retención 90 d, etapas m8/m9) | `docs/SYNC_OFFLINE_FIRST_DESIGN.md` §4.6/§13; convención de nombres de migraciones verificada en `migraciones/` + `DB_MIGRATION_EXECUTION_PHASE1.md` | Verificado |
| 2026-10-21 | Implementación m8+m9 **solo en `melantia_test`**: scope `usr:` resuelto, `client_operation_id` en ledger (no entidades), 15 tests nuevos incl. prueba concurrente real de cursores — rama `feat/sync-offline-first-m8-m9` | `m8_*.sql`, `m9_*.sql` aplicados con `psql -1`; `test_m8_m9_sync_infraestructura.py` 15/15 | Verificado |
| 2026-10-22 | Corrección FAIL-01: `payload_hash` en ledger + semántica A–D; m8 re-aplicada en `melantia_test` tras verificar vacío/dependencias; tests 20/20; `melantia_db` intacta verificada | m8 corregida + `test_m8_m9_sync_infraestructura.py`; psql `\d`/counts pre y post | Verificado |
| 2026-10-22 | Aplicación de m8+m9 a `melantia_db` tras respaldo verificado por restauración real (`melantia_db_pre_m8_m9_20261022.dump`, SHA-256 `912d8e35…60c6f`); 52 tablas/9 columnas/UNIQUE/NOT NULL verificados; smoke `sync_next_seq` con rollback sin residuo; procedimiento psql corregido (ON_ERROR_STOP, sin `-1` sobre archivos con BEGIN/COMMIT propio) | `pg_restore` exit 0 + comparación 12 métricas; introspección post-aplicación de `melantia_db` | Verificado |
| 2026-11-04 | **I-2 Sync Push create (finca/lote)**: `POST /api/v1/sync/push` con UUID de cliente, una tx por op, ledger idempotente `payload_hash` (duplicate/`idempotency_key_reuse`), changelog+cursor transaccionales, vínculo token→sesión→dispositivo (Supabase real; legacy rechazado, H-1), `expires_at` exigido (M-1 scope sync), errores infra≠`not_found` (M-2), UNIQUE por `constraint_name` (B-1), `base_version` en create rechazado (B-2), B-3 documentado; commit `5c8b6fe6` (14 archivos); suite **517 passed** ejecutada antes del commit; `melantia_db` intacta | `backend/modules/sync/`, `shared/repositories/sync.py`, `shared/sync_canonical.py`, `test_sync_{canonical,push_api}.py`; `git show 5c8b6fe6` | Verificado |
| 2026-11-04 | **I-4 Sync Pull incremental**: `GET /api/v1/sync/pull?device_id&cursor&limit` — página `seq ASC` con `limit+1`/`has_more`/`next_cursor` (último incluido), cursor negativo→422, futuro→409 `future_cursor`, ACK implícito por cursor recibido con `ultimo_pull_seq` monótono y acotado (metadato, no suelo de purga), `last_seen_at` actualizado, misma seguridad token→sesión→dispositivo de I-2; commit `50568e72` (5 archivos); suite **555 passed** ejecutada antes del commit; `melantia_db` intacta | `backend/modules/sync/services/pull.py`, `routes/sync.py`, `schemas.py`, `shared/repositories/sync.py`, `test_sync_pull_api.py`; `git show 50568e72` | Verificado |

<!--
Mantener esta tabla al día con cada hito verificado.
-->
