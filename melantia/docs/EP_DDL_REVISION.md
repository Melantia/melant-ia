# MELANTIA — EP-3 · Revisión estática del DDL propuesto

**Fecha:** 2026-09-29
**Archivo revisado:** `backend/database/schema/ecosistema_profesional.sql`
**Estado:** **EJECUTADO Y VALIDADO** en `melantia_db` (2026-09-29,
EP-3.2/EP-3.3). Ver registro de ejecución en §4.

---

## 1. Checklist por tabla (13 propuestas)

| Tabla | PK | FK | ON DELETE | UNIQUE | CHECK | NOT NULL | Timestamps | Reversible |
|---|---|---|---|---|---|---|---|---|
| `perfiles_profesionales` | UUID ✓ | — | — | codigo | — | codigo, nombre, activo | created | DROP directo |
| `usuarios_perfiles` | UUID ✓ | usuarios, perfiles | CASCADE ×2 | (usuario, perfil) | — | ambas FK | created | DROP directo |
| `workspaces` | UUID ✓ | usuarios (propietario) | CASCADE | — | estado | nombre, propietario, estado | created+updated | DROP directo |
| `workspace_miembros` | UUID ✓ | workspaces, usuarios | CASCADE ×2 | (ws, usuario) | rol, estado | todas las FK + rol + estado | created | DROP directo |
| `ep_proyectos` | UUID ✓ | workspaces, usuarios(creado_por) | SET NULL ×2 — nunca pierde el proyecto | — | estado (5 valores) | nombre, estado | created+updated | DROP directo |
| `ep_proyecto_participantes` | UUID ✓ | proyecto, usuario, asignado_por | CASCADE ×2, SET NULL | (proyecto, usuario) | rol (6), estado (3) | FK×2, rol, estado | created | DROP directo |
| `ep_proyecto_fincas` | UUID ✓ | proyecto, finca, vinculado_por | CASCADE ×2, SET NULL | (proyecto, finca) | — | FK×2 | created | DROP directo |
| `ep_proyecto_lotes` | idem | proyecto, lote | idem | (proyecto, lote) | — | idem | created | DROP directo |
| `ep_proyecto_levantamientos` | idem | proyecto, levantamiento | idem | (proyecto, levantamiento) | — | idem | created | DROP directo |
| `ep_proyecto_registros` | idem | proyecto, registro | idem | (proyecto, registro) | — | idem | created | DROP directo |
| `actividades` | UUID ✓ | responsable, creado_por | SET NULL ×2 | — | estado (4) | titulo, estado | created+updated | DROP directo |
| `agenda_eventos` | UUID ✓ | actividades, usuarios | CASCADE (actividad), CASCADE (usuario) | — | duracion_min>0, estado (3) | usuario_id, fecha_inicio | created+updated | DROP directo |
| `audit_eventos` | UUID ✓ | usuarios (actor) | SET NULL | — | actor_tipo (2) | accion, created_at | **solo created** (append-only) | DROP directo |

`ON UPDATE`: ninguna FK necesita acción — todas referencian `id UUID`
inmutable (convención del schema: nunca se actualizan PKs).

## 2. Verificaciones transversales

- **Orden de creación:** perfiles → usuarios_perfiles → workspaces →
  workspace_miembros → ep_proyectos → ep_proyecto_participantes →
  enlaces ×4 → actividades → agenda_eventos → audit_eventos.
  Cada FK apunta a tabla ya creada en el archivo o ya existente — sin
  dependencias circulares ni orden imposible.
- **PostgreSQL 17:** todo es DDL estándar (uuid-ossp ya activa, JSONB,
  CHECK, UNIQUE, índices parciales no usados). `IF NOT EXISTS` en todo →
  re-ejecución segura.
- **Reversibilidad total:** cero ALTER sobre tablas existentes — el
  rollback es `DROP TABLE` de las 13 en orden inverso. Nada destructivo
  sobre datos existentes porque no hay datos dependientes todavía.
- **Convenciones replicadas:** junction con `id` PK + UNIQUE
  (`feria_participantes`), rol `VARCHAR+CHECK`, SET NULL para
  referencias opcionales (`practicas_regenerativas.responsable_id`),
  `DOUBLE PRECISION` para lat/lon (lección REAL de 2-B1), TIMESTAMPTZ.
- **Excepciones documentadas deliberadamente:** `actividades.contexto_*`
  y `audit_eventos.contexto_*` son referencias suaves sin FK — el
  contexto es opcional y heterogéneo; excepción a D1-c justificada
  porque no son vínculos de pertenencia sino trazabilidad (registrado
  en cabecera del SQL).
- **Sync/offline:** ninguna tabla interfiere con la captura actual; los
  UUID generables en cliente son compatibles con el futuro outbox; el
  campo `contexto` del envelope D9 no requiere columna en estas tablas
  (los vínculos los crea el servidor al aplicar la operación).
- **Audit:** `audit_eventos` existe pero nada escribe aún — la
  infraestructura queda lista; los writers llegan con EP-4+ y ADM.

## 3. Separación explícita

### ✅ Ejecutables ahora (13)

`perfiles_profesionales`, `usuarios_perfiles`, `workspaces`,
`workspace_miembros`, `ep_proyectos`, `ep_proyecto_participantes`,
`ep_proyecto_fincas`, `ep_proyecto_lotes`, `ep_proyecto_levantamientos`,
`ep_proyecto_registros`, `actividades`, `agenda_eventos`,
`audit_eventos`.

### ⏸ Bloqueadas por M11/B2 (2, no incluidas en el archivo)

`ep_proyecto_evidencias`, `ep_proyecto_informes` — `evidencias_documentos`
exige campos comerciales NOT NULL hoy; requieren rediseño B2 o tabla
documental genérica.

### ⚠ Decisiones bloqueadas por B5

El gate de entitlements (D6) — doble fuente de plan
(`usuarios.tipo_suscripcion` vs `usuarios_suscripciones.plan_actual`).
No bloquea el DDL pero sí el service de permisos EP-4.

### ⏳ Aún requieren aprobación

- Incluir o no el seed de `perfiles_profesionales` (bloque comentado al
  final del SQL — convención B6 de seeds por separado).
- `hash_integridad` encadenado en `audit_eventos` (diferido a detalle).
- Política multi-rol (un usuario, un rol por proyecto — hoy fijado por
  `UNIQUE(proyecto_id, usuario_id)`).
- Flag `cliente_principal` en participantes.

## 4. Registro de ejecución (EP-3.2/EP-3.3, 2026-09-29)

| Campo | Resultado |
|---|---|
| Backup | `backups/melantia_pre_ep3.sql` — pg_dump completo (2.504 líneas, 32 CREATE TABLE) |
| Estado previo | 32 tablas · 71 FK · 100 índices · 32 PK · 0 tablas EP |
| Ejecución | `psql -1` — BEGIN → COMMIT único; 13 CREATE TABLE + 29 CREATE INDEX; sin errores |
| Estado posterior | **45 tablas** — 32 preexistentes intactas (71 FK verificadas) + 13 EP |
| FK nuevas | **27** — 17 CASCADE (contenedor/recurso) + 10 SET NULL (referencias opcionales/auditoría) |
| Índices nuevos | **29** `idx_*` + PKs/UNIQUE automáticos |
| UNIQUE nuevas | 8 · CHECK verificados en negativo (rol inválido y duplicado rechazados) |
| Regresión | **pytest 91/91 passed** |
| Funcionales | inserción completa EP, CHECK negativo, UNIQUE negativo, SET NULL (workspace→proyecto), CASCADE (proyecto→participantes+vínculos) — todas OK |
| Limpieza | 0 restos `EP3_TEST`; 0 filas en las 13 tablas EP |

**Pendientes tras ejecución:** enlaces `ep_proyecto_evidencias` /
`ep_proyecto_informes` (bloqueados por M11/B2) y gate de entitlements
(bloqueado por B5 — doble fuente de plan).

## 5. Adecuación tras el rediseño conceptual EP-4C (2026-09-29)

El rediseño del modelo de trabajo (EP_MODELO_DATOS §12) introduce
visita puntual, programas, fases, presupuesto y cartera de clientes.
Evaluación del DDL ejecutado:

- **Suficiente sin cambios:** `ep_proyectos` (contenedor),
  `ep_proyecto_participantes`, `actividades`, `agenda_eventos`,
  `audit_eventos`, `perfiles_profesionales`, `usuarios_perfiles`,
  `workspaces`.
- **Requiere evolución futura (no ahora):**
  - `workspace_miembros` CHECK de rol — el plan profesional usa
    `administrador`/`trabajador`; solo admite `propietario/socio/
    colaborador`. Cambio depende de B5 y de aprobación explícita.
  - Nuevas entidades documentadas en EP_MODELO_DATOS §12.10 —
    `ep_programas`, `ep_fases`, `ep_visitas`, `ep_presupuestos`,
    `ep_propuestas`, `clientes_profesionales`. Cada una requerirá su
    propio DDL revisado como este documento.
- **Membresías removidas:** sin cambio de DDL — la reactivación
  `removido → activo` reutiliza la fila existente (decisión aprobada,
  EP_MODELO_DATOS §10).

### 5.1 EP-4D — adecuación de `ep_proyecto_participantes` (diseño)

El DDL existente cubre el diseño EP-4D sin modificaciones inmediatas:
los 6 roles y los 3 estados del CHECK son exactamente los que el
modelo usa (`invitado → activo → removido → activo` sobre la misma
fila). Limitaciones detectadas que solo requieren evolución futura si
se aprueban (EP_MODELO_DATOS §13.13):

- Sin estado `rechazado` para incorporaciones declinadas.
- `UNIQUE(proyecto_id, usuario_id)` impide multi-rol — decisión
  pendiente §10.
- Sin `updated_at` — `audit_eventos` cubrirá la trazabilidad.
- `workspace_miembros` sin rol `administrador` (depende de B5).

Ningún cambio de DDL propuesto ahora.

### 5.2 EP-4D — reinterpretación de `invitado` (2026-09-30)

Tras el refinamiento de D-D1/D-D2 (EP_MODELO_DATOS §13.3.1 y §13.9),
el concepto "invitación informal" se sustituye por **incorporación
propuesta/contractual pendiente de aceptación** (`contrato/acuerdo →
pendiente → aceptado → activo`).

**El DDL físico no cambia:** el CHECK `estado IN ('invitado',
'activo', 'removido')` se mantiene y el valor `invitado` se
reinterpreta conceptualmente como *incorporación pendiente de
aceptación* — no como invitación informal. Tampoco hay puerta de
cualificación: ningún rol exige perfil profesional para participar
(D-D1); la incorporación es decisión del propietario del proyecto,
con venia opcional del `profesional_responsable` registrada como
dato, nunca como condición impuesta por la plataforma.

Evolución física posible — **solo si se decide en una migración
futura**:

- renombrar `invitado` → `pendiente_aceptacion` (o `contrato_pendiente`);
- añadir `rechazado` al CHECK para incorporaciones declinadas;
- añadir `aceptado_at` si se requiere timestamp dedicado de aceptación
  (hoy la transición es implícita).

Cualquiera de ellas requiere `ALTER TABLE` sobre el CHECK — decisión
técnica posterior, no bloqueante para EP-4D.

**Cierre documental EP-4D (2026-09-30):** D-D1…D-D7 aprobadas — el DDL
ejecutado sigue siendo suficiente. Confirmaciones sin cambio físico:
revocación inmediata al `removido` (D-D3), reactivación sobre la misma
fila sin re-aceptación (D-D4), aislamiento de recursos vinculados
(D-D7 — la política rol × recurso × nivel es de EP-4E, se implementa
en servicios/autorización, no en este CHECK) y acceso EP por Plan
Profesional vigente en lugar de `tiene_perfil` (D-C1 corregida — el
gate es comercial vía suscripciones/entitlements, no cualificación).
