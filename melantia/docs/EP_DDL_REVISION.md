# MELANTIA — EP-3 · Revisión estática del DDL propuesto

**Fecha:** 2026-09-29
**Archivo revisado:** `backend/database/schema/ecosistema_profesional.sql`
**Estado:** **NO EJECUTADO** — propuesta estática pendiente de
autorización explícita. 0 SQL ejecutado, 0 código modificado.

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
