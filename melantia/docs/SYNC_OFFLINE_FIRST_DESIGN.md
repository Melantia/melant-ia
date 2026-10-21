<!-- ===========================================================================
     MELANTIA — DISEÑO OFFLINE-FIRST Y SINCRONIZACIÓN
     Estado: ESPECIFICACIÓN DE DISEÑO — NO IMPLEMENTADO
             (decisiones parcialmente aprobadas 2026-10-21; ver §13)
     Fecha: 2026-10-21 · Rama: feat/gestion-fincas-end-to-end
     Autoridad: MELANTIA_PROJECT_MASTER_FULL.md (§3–§6 aprobadas)
     Bitácora: MELANTIA_ESTADO_IMPLEMENTACION.md
     ===========================================================================
     Convención de este documento:
       [IMPLEMENTADO]  existe en el repo y se verificó.
       [PARCIAL]       existe pero no cubre el requisito.
       [APROBADO]      decisión adoptada por el usuario (aún sin código).
       [PROPUESTO]     decisión recomendada, pendiente de aprobación.
       [PENDIENTE]     decisión que requiere elección del usuario.
       Nada de lo aquí escrito está construido salvo lo marcado
       [IMPLEMENTADO]. Los nombres de endpoints/columnas/tablas en
       las secciones de diseño son propuestas, no contratos vigentes.
     =========================================================================== -->

# MELANTIA — Diseño de arquitectura offline-first y sincronización

## 0. Contexto y objetivos

El Master FULL (§4–§6, aprobado) define: la App Móvil captura en campo
sin conexión, la App Web consulta datos sincronizados, PostgreSQL es la
fuente central y la sincronización es incremental, prioriza Wi-Fi y
pide autorización antes de usar datos móviles. La regla de integridad
§3.2 prohíbe que la Web sobrescriba registros originales de campo.

Este documento convierte esas reglas en un diseño técnico concreto:
ciclo de subida/bajada, idempotencia, conflictos, evidencias,
persistencia local móvil y la decisión razonada sobre una migración m8.

---

## 1. Estado real auditado (2026-10-21)

### 1.1 Lo que ya existe — cimiento real del sync

| Pieza | Estado | Evidencia |
|---|---|---|
| Identidad de dispositivo | **[IMPLEMENTADO]** | `dispositivos` (m4): `usuario_id`, `fingerprint_hash`, `estado` activo/revocado, UNIQUE parcial `(usuario_id, fingerprint_hash)`. Base lista para validar `device_id` en sync. |
| Custodia de sesión | **[IMPLEMENTADO]** | `sesiones` (m4): estado `activa` exigido además del JWT; revocación con historial; tope absoluto 30 días. |
| Clave de idempotencia por operación | **[IMPLEMENTADO] en 1 entidad** | `levantamientos.client_operation_id UUID` + UNIQUE parcial `(usuario_id, client_operation_id)` (m2, decisión B1). **Es el precedente canónico del proyecto.** |
| Dedup por contenido | **[IMPLEMENTADO] en 2 entidades** | `registros_campo.hash_transaccion` + UNIQUE parcial `(usuario_id, hash_transaccion)` (m6); el endpoint en `main.py` traduce 23505 → 409. `evidencias_documentos.hash_transaccion UNIQUE NOT NULL`. |
| Vocabulario de estados sync | **[IMPLEMENTADO] en DDL** | `trazabilidades.sync_status` y `trazabilidad_eventos.sync_status` con CHECK `('pending','syncing','synced','failed','conflict')` + `hash_integridad`. El vocabulario del Master §4 ya está fijado en el esquema. |
| `updated_at` mantenido | **[IMPLEMENTADO] en fincas/lotes** | Los UPDATE del repo (`shared/repositories/fincas.py`) escriben `updated_at = CURRENT_TIMESTAMP`. No hay trigger; lo mantiene el código. |
| Auditoría transversal | **[IMPLEMENTADO]** | `audit_eventos`: append-only, `actor_id`, `accion`, `objeto_tipo/id`, `detalle JSONB`. Lista para registrar eventos de sync. |
| Estructuras de trazabilidad | **[IMPLEMENTADO] en DDL** | `trazabilidades`, `trazabilidad_eventos`, `cadena_custodia`, `hatos_ganaderos` (sin API aún). |
| Caché web de lectura | **[PARCIAL — no es offline-first]** | `frontend/src/shared/offline/cache.js`: localStorage, clave endpoint+payload, TTL 7 días, best-effort. `offlineRequest.js`: sirve caché solo ante error de red. **Solo lectura; no hay cola de escritura.** |
| Cliente HTTP | **[IMPLEMENTADO]** | `apiClient.js` (axios, Bearer desde `auth.storage`, 401 → clearSession). `baseURL=/api` → los routers modernos cuelgan de `/api/v1/*`. |

### 1.2 Lo que NO existe — brechas

1. **No existe cliente React Native ni Expo.** `package.json` (raíz de
   `melantia/`) solo tiene React 19 + axios + react-router + Vite. No hay
   `app.json`, ni dependencias móviles, ni proyecto `mobile/`. La App
   Móvil del Master §3.1 es diseño, no código.
2. **No hay cola de sincronización** en ningún cliente. La caché web no
   persiste escrituras ni opera como store local.
3. **`fincas`, `lotes`, `hatos_ganaderos` no tienen metadatos de sync:**
   sin `client_operation_id`, sin `version`, sin `deleted_at`, sin
   `dispositivo_origen_id`. El CRUD web actual funciona sin ellos
   (correcto: son del lado servidor), pero el sync los necesitará.
4. **No existe mecanismo de bajada incremental.** `updated_at` existe
   pero sin índice ni garantía de cursor fiable (ver §6.3).
5. **No hay endpoints `/api/v1/sync/*`.** Nada de subida por lotes ni de
   bajada por cursor.
6. **Dos patrones de idempotencia distintos conviven sin unificar**:
   `client_operation_id` (levantamientos) e `hash_transaccion`
   (registros_campo, evidencias). Hay que fijar la convención (§4).
7. **`mediciones_campo.usuario_id` sigue nullable** (diferido en m2);
   relevante si esas filas entran al sync por usuario.
8. **No hay DELETE** en fincas/lotes: las eliminaciones lógicas
   (tombstones) no existen aún como concepto de API.
9. **m2 pospuso explícitamente** "`sync_status`/`hash_integridad`:
   diferido al diseño de Sync" — este documento cierra ese pendiente.

---

## 2. Arquitectura objetivo

```text
                    ┌────────────────────────────────────────────┐
                    │            FastAPI (único backend)          │
                    │                                            │
   push (lotes) ──► │  /api/v1/sync/*  ──► servicio sync ──►     │
   pull (cursor) ◄──│  valida sesión + dispositivo + propiedad    │
                    │  ledger idempotente + changelog            │
                    └───────┬───────────────────┬────────────────┘
                            │                   │
                       PostgreSQL          Storage evidencias
                       (verdad              (binarios, SHA-256)
                        central)
        ▲                    ▲                       ▲
        │ push/pull          │ lectura API           │ subida 2 fases
   ┌────┴─────┐        ┌─────┴──────┐          (mismo canal sync)
   │ Móvil    │        │ Web        │
   │ SQLite   │        │ sin store  │
   │ + cola   │        │ local de   │
   │ propia   │        │ escritura  │
   └──────────┘        └────────────┘        ┌──────────────┐
                                            │ Admin        │
                                            │ misma API/BD │
                                            │ /api/v1/adm* │
                                            └──────────────┘
```

Tres clientes, un backend. La Web **no** usa store local ni cola:
sigue consultando la API (la caché de lectura actual puede quedarse
como mejora, no es parte del sync). La Administración usa la misma
infraestructura cuando exista (`/api/v1/admin/*`, pendiente).

---

## 3. Persistencia local del móvil — evaluación

Requisitos: transaccional (una captura+encolado = todo o nada),
relacional (finca→lotes→eventos), migraciones locales versionadas,
sobrevive a cierre forzado, dispositivos de gama baja (Master §7),
consultas indexadas, sin dependencias pesadas injustificadas.

| Opción | Transacciones | Relaciones | Migraciones | Baja gama | Notas |
|---|---|---|---|---|---|
| **SQLite** (expo-sqlite / op-sqlite) | Sí (ACID) | Sí, SQL | Sí (versionada) | Muy buena | Maduro, cero licencia, tamaño pequeño. Estándar de facto RN. |
| WatermelonDB | Sí (sobre SQLite) | Sí | Sí | Buena | Añade capa reactiva + sync framework propio que habría que adaptar (su sync asume un contrato concreto). |
| Realm / Atlas Device Sync | Sí | Sí | Sí | Media | Motor propio, binario más pesado; su sync nativa ataría a MongoDB Atlas — incompatible con "PostgreSQL central". |
| AsyncStorage | No | No | No | Buena | KV simple; solo preferencias (consentimiento datos móviles, cursor). |
| MMKV | No | No | No | Excelente | KV rápido; mismo uso que AsyncStorage. |

**[APROBADO 2026-10-21] Persistencia local: SQLite vía `expo-sqlite`**,
y stack móvil **React Native con Expo + development builds** como
dirección adoptada (las development builds permiten módulos nativos —
`expo-sqlite` incluido — sin renunciar al toolchain Expo; si hiciera
falta ir más allá, `prebuild`/eject no cambia de stack). Esta decisión
es de **dirección**: no autoriza instalar dependencias ni crear el
proyecto móvil todavía. AsyncStorage/MMKV solo para preferencias y
flags (consentimiento datos móviles, último cursor). WatermelonDB queda
descartado para el MVP (capa reactiva + framework de sync propio que
habría que rehacer sobre nuestro contrato).

**Persistencia local — propiedades exigidas por el diseño:**

- **Migraciones locales versionadas** con `PRAGMA user_version`: cada
  arranque aplica migraciones pendientes en orden, dentro de una
  transacción; un fallo revierte y marca la instalación como
  "requiere reparación" (nunca arranca a medias).
- **Transacciones:** captura de entidad + encolado de su operación en
  `sync_queue` = una sola `withTransaction` — imposible que exista un
  registro sin su op en cola ni una op huérfana.
- **Recuperación tras reinicio:** al arrancar, toda fila de
  `sync_queue` en `syncing` (app murió a mitad de envío) vuelve a
  `pending` — el envío es idempotente, reintentar es seguro.
- SQLite en modo WAL y `PRAGMA foreign_keys = ON`.

### Esquema local mínimo [PROPUESTO]

```text
entidades espejo: fincas, lotes, ... (columnas del dominio + metadatos
  de sync: sync_status, server_version, client_operation_id, deleted_at)

sync_queue:                       -- LA cola persistente
  client_operation_id TEXT PK     -- UUID generado al encolar
  entity_type   TEXT
  entity_id     TEXT              -- UUID local = UUID servidor
  action        TEXT              -- 'create' | 'update' | 'delete'
  payload       TEXT              -- JSON del cuerpo
  base_version  INTEGER           -- versión vista al editar (updates)
  estado        TEXT              -- pending|syncing|failed|conflict
  intentos      INTEGER
  last_error    TEXT
  created_at    TEXT              -- captura offline (del dispositivo)

sync_meta:
  pull_cursor   TEXT              -- último seq confirmado
  updated_at    TEXT
```

Identidades: el **id de entidad lo genera el cliente en el momento de
la captura** (UUID v4/v7 local). Así finca y sus lotes se relacionan
offline sin reasignación de ids al sincronizar. Prohibido
`Date.now()` como id (Master §4).

---

## 4. Contrato conceptual de sincronización [PROPUESTO]

Endpoints, campos y respuestas son **propuesta** — hoy no existe nada
equivalente. Prefijo coherente con la convención `/api/v1/*`.

### 4.1 Registro de dispositivo (previo, una vez por instalación)

`POST /api/v1/dispositivos` — crea fila en `dispositivos` (ya existe la
tabla): `nombre`, `fingerprint_hash` futuro. Devuelve `dispositivo_id`
que el móvil guarda y envía en cada lote. Reusa m4 sin cambios de DDL.

### 4.2 Subida — `POST /api/v1/sync/push`

```jsonc
{
  "device_id": "uuid",
  "operations": [
    {
      "client_operation_id": "uuid",   // clave de idempotencia (§4.4)
      "entity_type": "finca|lote|registro_campo|...",
      "entity_id": "uuid",             // id asignado en el móvil
      "action": "create|update|delete",
      "base_version": 3,               // solo update/delete
      "payload": { "...campos del dominio..." },
      "client_created_at": "2026-10-21T14:03:00Z"
    }
  ]
}
```

Autenticación: el mismo JWT (`get_current_user`) + sesión `activa`.
El servidor valida por lote: sesión activa, `dispositivo_id` existe,
pertenece al `usuario_id` del token y `estado='activo'`.

### 4.3 Respuesta — por operación, no por lote

```jsonc
{
  "results": [
    { "client_operation_id": "uuid",
      "status": "applied",             // insertado/actualizado
      "entity_id": "uuid",
      "server_version": 4 },
    { "client_operation_id": "uuid",
      "status": "duplicate",           // ya procesada antes (reintento)
      "entity_id": "uuid",
      "server_version": 4 },
    { "client_operation_id": "uuid",
      "status": "conflict",
      "reason": "version_mismatch",
      "server_state": { "...fila actual del servidor..." } },
    { "client_operation_id": "uuid",
      "status": "error",
      "code": "validation|forbidden|retryable",
      "detail": "..." }
  ],
  "pull_cursor_hint": "latest-seq"
}
```

Reglas de procesamiento: cada operación se ejecuta en su propia
transacción (una operación mala no aborta el lote) y su resultado se
registra en el ledger antes de responder — la respuesta es reproducible
si el cliente reintenta el mismo lote.

### 4.4 Idempotencia — la decisión de convención

El repo tiene dos mecanismos que **no se sustituyen entre sí**:

- **`client_operation_id` (UUID por operación, precedente B1/m2):**
  identifica *la operación* — sus reintentos. Es la clave del ledger:
  si el lote se procesó, un reenvío devuelve los mismos resultados sin
  re-ejecutar nada.
- **`hash_transaccion` (huella de contenido, m6):** dedup *de negocio*
  — dos operaciones distintas con el mismo contenido (p.ej. mismo
  registro de incentivo) chocan por contenido. Sigue vigente en
  `registros_campo`/`evidencias_documentos` para su caso original.

**[PROPUESTO] Convención:** `client_operation_id` = mecanismo
transversal de idempotencia de sync para todas las entidades; el
servidor lo registra en tabla ledger `sync_operaciones`
`(usuario_id, client_operation_id)` con UNIQUE parcial (mismo patrón
exacto que m2/m6: `WHERE client_operation_id IS NOT NULL`).
`hash_transaccion` se conserva donde ya existe con su semántica de
contenido — no se migra ni renombra.

### 4.5 Bajada — `GET /api/v1/sync/pull?cursor=<seq>&limit=N`

```jsonc
{
  "changes": [
    { "seq": 1042, "entity_type": "finca", "entity_id": "uuid",
      "op": "upsert", "data": {...}, "server_version": 4 },
    { "seq": 1043, "entity_type": "lote", "entity_id": "uuid",
      "op": "delete", "data": null }
  ],
  "next_cursor": "1043",
  "has_more": false
}
```

El cliente aplica los cambios en orden de `seq` y solo persiste
`pull_cursor = next_cursor` **después** de aplicar toda la página en su
transacción local: si cae a mitad, reintenta desde el último cursor
confirmado (los cambios son `upsert`/`delete` idempotentes, reaplicar
es seguro). Paginación por `seq`, no por offset — inmune a inserciones
durante la descarga.

### 4.6 El cursor incremental — diseño corregido

`updated_at` queda descartado como cursor (timestamps no monótonos
entre commits concurrentes). Pero el primer borrador de este
documento proponía `sync_cambios.seq BIGSERIAL` **y esa propuesta era
incorrecta por una razón sutil y crítica**:

> **`BIGSERIAL` asigna el valor en el INSERT, dentro de la
> transacción — no en el COMMIT.** Dos transacciones concurrentes
> pueden obtener `seq=1` (T1) y `seq=2` (T2) con T2 confirmando
> primero. Un pull que lee "todo `seq > cursor`" vería `seq=2`
> confirmado, avanzaría su cursor a 2, y cuando T1 confirmara
> después, `seq=1` quedaría **permanentemente perdido** para ese
> cliente. La secuencia garantiza unicidad y crecimiento de
> asignación, **no orden de commit**.

#### Mecanismo elegido: cursor transaccional por ámbito [APROBADO]

El pull ya se filtra por usuario; el cursor se serializa por el mismo
ámbito con una fila-contador por `usuario_id` (el "ámbito de sync"):

```sql
-- [PROPUESTO — no existe aún]
sync_cursors (
    scope     TEXT PRIMARY KEY,        -- 'usr:<usuario_id>'
    last_seq  BIGINT NOT NULL DEFAULT 0
);
sync_cambios (
    scope        TEXT    NOT NULL,
    seq          BIGINT  NOT NULL,
    entity_type  TEXT    NOT NULL,
    entity_id    UUID    NOT NULL,
    op           TEXT    NOT NULL,     -- 'upsert' | 'delete'
    data         JSONB,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (scope, seq)
);
```

**Algoritmo de asignación** — dentro de la **misma transacción** que
el cambio de negocio, como últimos pasos antes del COMMIT:

```sql
-- 1) escrituras de dominio (finca/lote..., ledger, tombstone)
-- 2) bump del cursor (bloquea si otra tx del mismo scope lo tiene):
INSERT INTO sync_cursors (scope, last_seq) VALUES (:scope, 1)
ON CONFLICT (scope) DO UPDATE
    SET last_seq = sync_cursors.last_seq + 1
RETURNING last_seq;                       -- → :seq
-- 3) registro del cambio con ese seq:
INSERT INTO sync_cambios (scope, seq, entity_type, entity_id, op, data)
VALUES (:scope, :seq, :type, :id, :op, :payload);
-- 4) COMMIT
```

**Por qué garantiza orden de commit:** el `UPDATE/INSERT ... ON
CONFLICT` toma un **row lock** sobre la fila del scope que se retiene
hasta el final de la transacción. Una segunda transacción del mismo
usuario se **bloquea en el paso 2** hasta que la primera haga COMMIT
o ROLLBACK. Por tanto `seq=N+1` solo puede asignarse después de que la
transacción dueña de `seq=N` haya terminado → **si un pull ve `seq=5`
confirmado, todos los `seq ≤ 5` de ese scope ya están confirmados**. El
cursor del cliente (`next_cursor = max(seq)` de la última página) nunca
salta por encima de una operación en vuelo.

**Commit fuera de orden — escenario resuelto:** con este diseño *no
puede ocurrir dentro de un scope*: T2 no obtiene `seq=2` mientras T1
(`seq=1`) siga en vuelo. Entre scopes distintos no importa: cada pull
lee un solo scope.

**Rollback:** si T1 aborta, el bump del cursor y la fila de changelog
se revierten juntos en la misma transacción; T2 desbloquea y recibe
`seq=1`. Sin huecos ni filas huerfanas — la atomicidad cubre
dominio + ledger + changelog + cursor.

**Atomicidad obligatoria:** todo escritor de una entidad sincronizada
(servicio de sync y también el CRUD web) debe emitir su fila de
`sync_cambios` + bump en **la misma transacción** que el cambio.
Implementación: llamada explícita en el repository/service (convención
del repo: SQL visible en `shared/repositories/`); un trigger AFTER como
defensa en profundidad queda como opción a evaluar en la fase de
implementación, no como mecanismo primario.

**Coste de concurrencia:** serializa escrituras **del mismo usuario**
solo durante la cola de la transacción (ms); usuarios distintos nunca
compiten (scopes distintos). Dos dispositivos del mismo productor se
serializan brevemente — aceptable a escala MVP. Un contador **global**
alternativo serializaría todas las escrituras de la plataforma:
rechazado por innecesario.

#### Alternativas evaluadas

| Alternativa | Garantía | Veredicto |
|---|---|---|
| `BIGSERIAL` solo | Ninguna (asignación ≠ commit) | **Rechazado** — pérdida demostrable |
| `BIGSERIAL` + ventana de espera/“gap detection” en el lector | Heurística; sigue teniendo casos límite bajo carga | Rechazado — complejo y no demostrable |
| `pg_advisory_xact_lock(scope)` + `BIGSERIAL` | Correcta (serializa igual) | Viable; menos observable que una fila-contador (no hay `last_seq` consultable) — alternativa documentada |
| **`sync_cursors` por scope (elegido)** | Correcta y observable | **Recomendado** |
| Cursor global único | Correcta pero serializa toda la plataforma | Rechazado — contención innecesaria |
| `updated_at` + desempate | No fiable bajo commits concurrentes | Rechazado |
| Logical decoding / WAL | Correcta pero infra pesada | Fuera de alcance MVP |

#### Paginación y avance seguro del cursor

- `GET /api/v1/sync/pull?cursor=C&limit=N` →
  `WHERE scope=:u AND seq > :C ORDER BY seq LIMIT N`.
- `next_cursor` = `seq` de la última fila devuelta; `has_more` si la
  página vino llena. Nunca offset: inmune a inserts durante la lectura.
- El cliente aplica la página completa en una transacción local y solo
  entonces guarda `pull_cursor = next_cursor`. Interrupción → reintenta
  desde el último cursor persistido; los `upsert`/`delete` son
  idempotentes, reaplicar es seguro.
- Si `cursor` del cliente es **menor que el seq más antiguo retenido**
  (changelog ya purgado), el servidor responde `requires_full_resync` →
  reconciliación completa (§5.1).

#### Prueba que demuestra la propiedad (E2E, PostgreSQL real)

```text
conn A: BEGIN; INSERT finca; bump cursor → seq=1;  -- se queda abierta
conn B: BEGIN; INSERT finca; bump cursor → BLOQUEA en sync_cursors
conn C: pull(cursor=0) → 0 filas (ni A ni B confirmaron)
conn A: COMMIT  → conn B desbloquea → seq=2; COMMIT
conn C: pull(cursor=0) → filas seq=1, seq=2 en orden
Assert: en ningún instante fue visible seq=2 sin seq=1.
Variante rollback: conn A hace ROLLBACK → B obtiene seq=1;
        el changelog queda con exactamente 1 fila, sin hueco.
```

Se añade a la matriz de pruebas (§11 #9/11) cuando exista el mecanismo.

### 4.7 Visibilidad en la Web

Un registro móvil existe en PostgreSQL (y por tanto en la Web) **solo
cuando su lote push fue aplicado**. Mientras el móvil esté offline no
hay visibilidad — eso no se promete ni se simula. La Web no necesita
push-notifications en MVP: basta `?updated_after` o recarga manual;
como mejora se añade refresco al enfocar la vista (polling suave) —
no es parte del sync protocol.

---

## 5. Ciclo completo y modelo de estados

```text
CAPTURA (offline)
  → entidad local sync_status='pending' + fila en sync_queue
  → sobrevive cierre/reinicio (SQLite transaccional)

DECISIÓN DE RED
  sin red          → nada, todo queda pending
  wifi + internet  → sync automático (si preferencia lo permite)
  datos móviles    → bloqueado hasta autorización explícita
                     (Master §5.2; preferencia §5.3 persiste la decisión)
  nota: "hay red" ≠ "el servidor responde": antes del lote se hace
        un ping ligero (GET /api/v1/health o el propio pull con límite 1)

ENVÍO
  sync_queue pending → syncing → POST push (lotes de ~50 ops)
  respuesta por op:
    applied/duplicate → op fuera de cola, entidad synced + server_version
    conflict          → op marcada conflict, entidad conflict (§6)
    error retryable   → pending con backoff (2^intentos, tope, jitter)
    error permanente  → failed (no reintenta solo; queda visible)

BAJADA
  GET pull desde pull_cursor → aplicar en tx local → guardar cursor
  upsert/delete sobre espejo; si la fila local tiene op pendiente, la
  versión del servidor se guarda pero NO pisa los cambios sin enviar
  (queda como base para el conflicto futuro).
```

Estados (ya tipados en el DDL de trazabilidad, mismos valores):
`pending → syncing → synced` · `syncing → pending` (reintento) ·
`syncing → failed` (error permanente) · `syncing → conflict`
(resolución humana). **Estos estados viven en el cliente** — el
servidor no replica `sync_status` por fila; su equivalente es el
ledger `sync_operaciones`.

### 5.1 Retención de tombstones, antigüedad de cursores y reconciliación

El changelog y los tombstones no pueden crecer sin límite, pero
purgarlos puede romper a un dispositivo que lleva tiempo sin
sincronizar. Diseño [APROBADO como propuesta, requiere validación
operativa]:

- **Ventana de retención inicial: 90 días** — valor de partida a
  validar con uso real; no es una regla automática incondicional.
- **Seguimiento del cursor por dispositivo:** en cada `pull`, el
  servidor registra en `dispositivos.last_seen_at` (+ campo de cursor
  a añadir en m9 si se aprueba) el `pull_cursor` que el cliente
  confirmó. La purga solo elimina filas de `sync_cambios` y
  tombstones con `seq` **estrictamente menor que el cursor mínimo de
  todos los dispositivos activos del scope** — un dispositivo atrasado
  retiene lo que aún necesita.
- **Cursor más viejo que lo retenido** (dispositivo inactivo más allá
  de la ventana, o su cursor ya purgado): el pull responde
  `requires_full_resync`. El cliente ejecuta **reconciliación
  completa**: descarga el snapshot del scope, obtiene cursor fresco,
  y **conserva íntegras sus operaciones locales `pending`/`failed`/
  `conflict`** — la reconciliación solo actualiza entidades limpias
  (`synced`); lo pendiente nunca se descarta y tras el resync reintenta
  su push normal (los conflictos, si los hubiera, se resuelven con la
  versión recién descargada).
- Purga ejecutada por tarea de mantenimiento (`mantenimiento` module
  ya existe) — nunca inline en una request de sync.

---

## 6. Conflictos e integridad

**No hay LWW global.** Política por tipo de operación:

| Caso | Política |
|---|---|
| Registros nuevos independientes | Sin conflicto posible; dedup por `client_operation_id` (y `hash_transaccion` donde aplique). |
| Update del mismo atributo en móvil y Web | Optimistic concurrency por `version`: el push trae `base_version`; si ≠ versión del servidor → `conflict` + `server_state`. El cliente muestra ambos valores y el usuario elige: conservar servidor / reenviar como corrección (nueva op con `base_version` actualizada). |
| Update de atributos distintos del mismo registro | Se permite merge por campos en el servicio de sync **solo** si el payload declara los campos tocados y ninguno solapa con los cambiados en el servidor desde `base_version` — si hay duda, conflict (conservador). |
| Registros originales de campo (`registros_campo`, `trazabilidad_eventos`, evidencias) | **Append-only.** El servidor nunca aplica update/delete de sync sobre ellos (Master §3.2): las "correcciones" son entidades nuevas (corrección/version/evento relacionado). La Web puede corregir, pero creando un registro relacionado, no editando el original. |
| Relaciones (lote→finca) | La cola respeta orden de captura: el padre va antes que el hijo dentro del lote; el servidor procesa en orden recibido. Si un hijo llega sin padre confirmado → error retryable, no orphan. |
| Eliminaciones | Soft-delete (`deleted_at`): `op:'delete'` marca tombstone en servidor y changelog; el cliente elimina localmente al confirmar. Sin DELETE físico en MVP. |
| Operaciones financieras | Ver §8 — nunca se confirman offline. |

Un `conflict` conserva siempre: payload local, `server_state` completo,
`base_version` y timestamps — nada se pierde antes de que el humano
decida.

---

## 7. Evidencias (flujo separado de los datos estructurados)

```text
1. Captura → archivo local + fila de metadatos en sync_queue
   (sha256, bytes, mime, entity_id, foto comprimida si excede umbral)
2. Push de metadatos → servidor crea la evidencia 'pendiente_archivo'
   idempotente por (usuario_id, sha256 o hash_transaccion)
3. Subida binaria en endpoint aparte, reanudable por sesión de subida
   (upload_id + rangos; reintento reanuda, no duplica)
4. Servidor recalcula SHA-256 → coincide → evidencia 'confirmada';
   solo entonces el móvil puede liberar el original (política de
   retención del usuario decide cuándo).
5. Interrupción: metadatos quedan, binario reanuda donde quedó;
   evidencia duplicada por reintento = misma sha256 → 'duplicate'.
```

**[APROBADO 2026-10-21] Almacenamiento en dos niveles:**

- **Teléfono:** archivo en almacenamiento local de la app
  (`expo-file-system`) + metadatos en `sync_queue` de SQLite; el
  original se conserva hasta confirmación del servidor y luego según
  la política de retención del usuario.
- **Servidor:** los binarios van a un **object storage detrás de una
  abstracción de almacenamiento** (interfaz `put/get/delete` +
  proveedor configurado por entorno). **PostgreSQL nunca contiene los
  binarios**: `evidencias_documentos` (y futuras tablas de evidencia)
  guardan solo metadatos + `storage_key` + `sha256` + `bytes`. El
  proveedor concreto queda a nivel de configuración/despliegue — el
  código solo conoce la abstracción.
- Reanudación: sesión de subida (`upload_id`) con rangos; la sesión
  queda registrada y una reanudación continúa donde quedó, sin
  duplicar partes ni crear evidencia nueva.

`hash_transaccion UNIQUE` de `evidencias_documentos` ya da dedup por
contenido. **SHA-256 garantiza integridad del archivo, no la veracidad
del contenido** — la verificación de evidencias (Master: módulo Web) es
un proceso posterior con el hash como ancla.

---

## 8. Operaciones financieras — regla dura

La aceptación offline **solo guarda intención**. Quedan como intención
(no efecto): ofertas/demandas, intereses de compra, solicitudes de
transacción, canjes de Melantios. Requieren confirmación online del
servidor (y del proveedor de pago cuando aplique): pagos, liberación
de fondos, comisiones, liquidaciones, cobros. En la cola se persisten
con tipo `financial_intent`, pero el estado de negocio "pagado/
liberado/cobrado" **nunca** lo fija el cliente — solo aparece tras la
respuesta del servidor en el mismo ciclo push.

---

## 9. Auditoría m2–m7 y decisión sobre m8

### 9.1 Matriz entidad/mecanismo

| Entidad / mecanismo | Estado actual | Brecha real | Solución propuesta | ¿Migración? |
|---|---|---|---|---|
| `fincas` | `created_at`, `updated_at` (mantenido por repo) | Sin idempotencia, sin versión, sin tombstone, sin dispositivo origen | +`version INT NOT NULL DEFAULT 1`, +`deleted_at`, +`client_operation_id` (+UNIQUE parcial patrón m2), +`dispositivo_origen_id` NULL→`dispositivos` | **Sí (m9)** |
| `lotes` | igual que fincas | idem | idem | **Sí (m9)** |
| `hatos_ganaderos` | DDL existe, sin API | idem | incluir ahora (aditivo, evita otra migración al exponer API) | **Sí (m9)** |
| `registros_campo` | `hash_transaccion` + UNIQUE parcial (m6) | Sin `version`/`deleted_at`; sin `client_operation_id` | Append-only por regla §3.2: `version`/`deleted_at` no aportan; +`client_operation_id` opcional por uniformidad (baja prioridad) | Opcional (puede entrar en m9 o diferir) |
| `trazabilidades`, `trazabilidad_eventos` | `sync_status`, `hash_integridad` en DDL | `sync_status` **servidor** no es útil (el servidor siempre está "synced") — semántica por revisar al implementar | Mantener columnas (no molestan); la semántica real del sync la da el ledger | No |
| `levantamientos` | `client_operation_id` + UNIQUE (B1) | Sin `version`/`deleted_at` | Mismos campos cuando entre al alcance del sync | Diferido (hito de levantamientos) |
| `evidencias_documentos` | `hash_transaccion` UNIQUE | Falta flujo de archivo (storage, reanudación) — decisión de storage pendiente | metadatos de upload en tabla auxiliar de sesiones de subida | Diferido (hito evidencias) |
| `dispositivos` | existe (m4) | sin `last_seen_at` actualizado por sync (columna ya existe) | el push actualiza `last_seen_at` — sin DDL | No |
| `mediciones_campo` | vértices con UNIQUE (B2) | `usuario_id` nullable | endurecer cuando entre al sync | Diferido |
| **Ledger de operaciones** | no existe | Sin ledger no hay reintento reproducible del lote | `sync_operaciones(id, usuario_id, client_operation_id, entity_type, entity_id, resultado JSONB, created_at)` + UNIQUE parcial `(usuario_id, client_operation_id)` | **Sí (m8)** |
| **Changelog + cursor para pull** | no existe | Sin changelog no hay bajada incremental; `BIGSERIAL` solo no garantiza orden de commit | `sync_cambios(scope, seq, ...)` + `sync_cursors(scope, last_seq)` — cursor transaccional por ámbito (§4.6) | **Sí (m8)** |

### 9.2 Conclusión sobre las migraciones

**Sí hace falta migración — y se organiza en dos etapas separadas
[APROBADO 2026-10-21]:**

- **Etapa 1 — `m8_sync_infraestructura.sql`:** `sync_operaciones`
  (ledger) + `sync_cambios` (changelog) + `sync_cursors` (contador
  por ámbito). Tres tablas nuevas, cero ALTER → aditiva, sin riesgo
  sobre datos existentes.
- **Etapa 2 — `m9_sync_metadatos_entidades.sql`:** `version`,
  `deleted_at`, `client_operation_id` (+índices parciales patrón m2)
  y `dispositivo_origen_id` en `fincas`, `lotes`, `hatos_ganaderos`;
  cursor del dispositivo en `dispositivos` si se confirma §5.1.

**Convención de nombres verificada:** las migraciones son
`m<N>_<descripcion>.sql` con **entero secuencial** (`m2`…`m7`) y el
orden de aplicación es una lista documentada manualmente
(`docs/DB_MIGRATION_EXECUTION_PHASE1.md`, AGENTS.md §schema) — no hay
herramienta que auto-descubra archivos. Por eso las dos etapas son
**m8 y m9**, no "m8a/m8b" (subíndices fuera de convención).

Mismas convenciones que m2–m7: header PROPUESTA, pre-chequeos,
`psql -1`, `BEGIN/COMMIT`, `IF NOT EXISTS`, aditiva. `registros_campo`,
`levantamientos`, `mediciones_campo` y evidencias quedan para sus
hitos — **no son bloqueantes** para arrancar el sync de fincas/lotes.

No crear ni ejecutar migraciones en esta fase: quedan como propuesta
lista para autorización.

---

## 10. Seguridad y aislamiento

| Control | Diseño | Estado |
|---|---|---|
| Autenticación del lote | Mismo JWT + `sesiones.estado='activa'` (m4 ya lo exige) | Reusa implementado |
| `device_id` | Debe existir en `dispositivos`, `usuario_id` = usuario del token, `estado='activo'`; un usuario no puede presentar el dispositivo de otro (404 indistinguible). Suplantación dentro de los propios dispositivos del usuario: mitigación futura con `fingerprint_hash` (Fase ②/③ ya prevista en DDL) | Reusa + validación a implementar |
| Autorización por entidad | Push: `usuario_id` siempre del token, nunca del payload; update/delete verifica propiedad (mismo patrón que Gestión de Fincas: 404 indistinguible). Pull: changelog filtrado por `usuario_id` del token | A implementar en el servicio sync |
| Idempotencia scoped | UNIQUE parcial `(usuario_id, client_operation_id)` — colisión inter-usuario imposible por construcción | Reusa patrón m2/m6 |
| Auditoría | Eventos de sync (lote recibido, conflicto, rechazo) → `audit_eventos` con `objeto_tipo='sync'` | Reusa tabla implementada; escrituras a implementar |
| Credenciales locales | Token en almacenamiento seguro del SO (Keychain/Keystore), nunca en SQLite en claro; el esquema local no guarda el token | A implementar en el cliente |
| Datos ajenos en respuestas | `conflict`/`error` nunca devuelven filas de otros usuarios; `forbidden` indistinguible de `not_found` | Convención ya aplicada en Gestión de Fincas |
| Retención | Propuesta inicial 90 días (validación operativa pendiente); purga solo bajo el cursor mínimo de dispositivos activos del scope; cursor más viejo → `requires_full_resync` conservando ops locales pendientes — §5.1 | Propuesta aprobada como inicial |

Sesión offline: el tope absoluto de 30 días (m4) significa que un móvil
que estuvo 30+ días sin conexión tendrá sesión expirada al sincronizar
→ re-login requerido; la cola local no se pierde, se conserva cifrada
hasta reautenticar.

---

## 11. Plan de pruebas de aceptación

| # | Prueba | Tipo |
|---|---|---|
| 1 | Captura offline → matar app → reabrir → registro intacto `pending` | E2E móvil |
| 2 | Push con reintento del mismo lote (red cortada tras recibir respuesta) → una sola fila en PostgreSQL | E2E backend, PostgreSQL real |
| 3 | Interrumpir a mitad de lote → reanudar → cero duplicados, cero pérdidas | E2E |
| 4 | Push de lote a nombre de otro usuario / finca ajena → 404/`forbidden` indistinguible, cero escritura | E2E backend (patrón ya probado en `test_gestion_fincas_api.py`) |
| 5 | Edición concurrente (Web PATCH vs push móvil) → `conflict` + `server_state` completo, original intacto | E2E |
| 6 | Lote con hijo antes que padre reordenado → orden aplicado correcto, sin orphans | Integración |
| 7 | Evidencia: subir, verificar SHA-256 servidor, reintento → duplicate sin archivo doble | E2E |
| 8 | Red móvil detectada → no sincroniza hasta autorización; preferencia persistida | E2E móvil |
| 9 | Pull con 2 páginas interrumpido → reanuda desde cursor, sin filas perdidas ni duplicadas | E2E |
| 10 | Registro sincronizado visible vía API existente (misma respuesta que crearlo desde Web) | E2E |
| 11 | Regresión: suite existente sigue verde | `pytest backend/tests -q` |

Unitarias sin BD: máquina de estados de la cola, ordenamiento, backoff,
serialización del contrato. Con PostgreSQL real: todo lo que toque
`sync_operaciones`, `sync_cambios`, UNIQUEs y autorización.

---

## 12. Fases de implementación propuestas

```text
F0  Stack móvil Expo + development builds [DECIDIDO] + esqueleto app
F1  SQLite local + sync_queue + captura de fincas/lotes offline (móvil)
F2  m8 (infra sync) + POST /api/v1/sync/push (entidades M3)   [requiere autorización]
F2b m9 (metadatos entidad) — puede ir junto a F2 o justo antes de exponer
    update/delete por sync
F3  GET /api/v1/sync/pull + changelog + Web muestra datos sync
F4  Evidencias 2 fases + SHA-256 + reanudación
F5  Conflictos UI (móvil resolución + Web corrección-versionada)
F6  Sync de registros_campo/levantamientos/eventos (ampliar alcance)
F7  Administración General: visor de sync, dispositivos, auditoría
```

Las etapas de migración van separadas por decisión aprobada: m8 es la
infraestructura del protocolo y m9 los metadatos por entidad; m9 puede
ejecutarse junto a m8 o diferirse hasta justo antes de habilitar
update/delete vía sync — pero nunca después de exponerlos.

---

## 13. Decisiones

### Aprobadas (del Master FULL / precedentes en código)

- Offline-first, incremental, Wi-Fi primero, consentimiento datos
  móviles; UUID como id; estados pending/syncing/synced/failed/conflict;
  registros originales intocables (§3.2); patrón de idempotencia
  `(usuario_id, client_operation_id)` parcial (B1); dedup por contenido
  `hash_transaccion` (m6); `dispositivos`+`sesiones` (m4).
- **2026-10-21:** stack móvil = React Native + **Expo con development
  builds**; persistencia local = SQLite vía `expo-sqlite` (§3).
- **2026-10-21:** migraciones de sync en **dos etapas separadas**
  (m8 infraestructura, m9 metadatos de entidad) — §9.2.
- **2026-10-21:** evidencias en dos niveles — archivo local en el
  teléfono + object storage tras abstracción en el servidor;
  PostgreSQL solo metadatos (§7).
- **2026-10-21:** cursor incremental = contador transaccional por
  ámbito `sync_cursors` (§4.6) — sustituye al `BIGSERIAL` ingenuo del
  primer borrador, que no garantizaba orden de commit.
- **2026-10-21:** retención de tombstones/changelog = 90 días como
  propuesta inicial a validar operativamente; reconciliación completa
  conserva siempre las ops locales pendientes (§5.1).

### Propuestas en este documento (pendientes de aprobación)

- Contrato `/api/v1/sync/push` + `/api/v1/sync/pull` por lotes con
  resultado por operación (§4).
- Optimistic concurrency por `version` + merge por campos no solapados
  (§6).
- Append-only para registros/eventos/evidencias; correcciones como
  nuevas entidades (§6).
- Sesión de subida reanudable por `upload_id` + rangos (§7).

### Pendientes de decisión del usuario

1. Autorización para implementar m8 y m9 (pueden ir juntas o m9
   diferida, nunca después de exponer update/delete por sync).
2. Proveedor concreto del object storage (configuración, no código).
3. Validación operativa de la ventana de retención de 90 días.
4. ¿Pull filtrado estrictamente por `usuario_id`, o algunas entidades
   (catálogo geográfico) con cursor global? (Recomendado: geografía
   por endpoint propio versionado, no por changelog.)

---

## Registro del documento

| Fecha | Cambio | Evidencia |
|---|---|---|
| 2026-10-21 | Creación — auditoría real del repo (schemas m2–m7, módulos, frontend offline, package.json) | `git show` HEAD `280740ef`; archivos citados en §1 |
| 2026-10-21 | Revisión final: corrección del cursor (BIGSERIAL ingenuo → `sync_cursors` transaccional por scope, §4.6); decisiones incorporadas — Expo+dev builds/`expo-sqlite` (§3), evidencias dos niveles con abstracción de storage (§7), retención 90 d + reconciliación (§5.1), migraciones en dos etapas m8/m9 con convención de nombres verificada (§9.2) | Decisión del usuario 2026-10-21; convención `m<N>_<desc>.sql` en `backend/database/migraciones/` y orden manual en `docs/DB_MIGRATION_EXECUTION_PHASE1.md` |
