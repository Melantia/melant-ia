# MELANTIA — ECOSISTEMA PROFESIONAL · EP-2 Revisión de Integración

**Fecha:** 2026-09-29
**Estado:** REVISIÓN COMPLETA — verificación del modelo propuesto
(`EP_MODELO_DATOS.md`) contra el schema real de `backend/database/schema/`.
**0 SQL ejecutado, 0 tablas creadas, 0 código modificado.**

---

## 1. Verificación de targets de FK (todos existen y son UUID)

| Tabla existente | PK | FK candidata | DELETE real | Integración EP |
|---|---|---|---|---|
| `usuarios` | `id UUID` | ✅ | — | participantes, miembros, creado_por, vinculado_por |
| `fincas` | `id UUID` | ✅ | usuario CASCADE | `ep_proyecto_fincas` |
| `lotes` | `id UUID` | ✅ | finca CASCADE | `ep_proyecto_lotes` |
| `levantamientos` | `id UUID` | ✅ | usuario CASCADE, lote SET NULL | `ep_proyecto_levantamientos` |
| `mediciones_campo` | `id UUID` | ✅ | levantamiento CASCADE | enlazable vía levantamiento — enlace individual probablemente innecesario (§4.1) |
| `registros_campo` | `id UUID` | ✅ | usuario CASCADE, lote SET NULL | `ep_proyecto_registros` |
| `evidencias_documentos` | `id UUID` | ⚠️ estructural sí, funcional no (§3.1) | usuario CASCADE | `ep_proyecto_evidencias` / `ep_proyecto_informes` |

## 2. Colisiones de nombre — ninguna

Verificado sobre los 32 `CREATE TABLE` del schema: no existe `workspaces`,
`workspace_miembros`, `perfiles_profesionales`, `usuarios_perfiles`,
`ep_*`, `actividades`, `agenda_eventos`, `audit_eventos`, `proyectos`.
El espacio `proyectos_*` queda libre para M6 según decisión D8.

## 3. Hallazgos de integración

### 3.1 ⚠️ `evidencias_documentos` no es custodia genérica (bloquea 2 enlaces)

La tabla actual es de **custodia comercial de transacciones**, no un
repositorio documental:

```text
categoria_bien    VARCHAR NOT NULL   ('Cosecha','Bienes Raíces',…)
monto_total       NUMERIC NOT NULL
comision_app      NUMERIC NOT NULL   — 3%
monto_liberado    NUMERIC NOT NULL
hash_transaccion  VARCHAR(64) UNIQUE NOT NULL
```

Un informe técnico o una evidencia de campo **no puede insertarse hoy**
sin rellenar campos comerciales absurdos. Esto ya estaba identificado
como deuda B2 (`PHASE2_ARCHITECTURE_DECISIONS.md` §E — separación
evidencia↔transacción diferida).

**Consecuencia para EP:** `ep_proyecto_evidencias` y
`ep_proyecto_informes` son estructuralmente correctas (el `id UUID`
existe), pero **funcionalmente dependen del rediseño M11** — ya sea B2
(limpiar la tabla) o una tabla documental genérica futura. Recomendación:
dejar ambos enlaces diseñados y **marcarlos como dependientes de B2**;
no crearlos en el primer DDL de EP.

*Dato a favor:* `hash_transaccion UNIQUE NOT NULL` encaja bien con un
informe generado (SHA-256 del archivo) — una vez separada la parte
comercial, la custodia funciona tal como el diseño prevé.

### 3.2 ⚠️ Doble fuente de plan de suscripción (afecta D6)

- `usuarios.tipo_suscripcion` — leída por el trigger de cuota
  (`verificar_limite_almacenamiento_melantia`, registros_campo.sql:44).
- `usuarios_suscripciones.plan_actual` — escrita por el flujo de
  suscripciones.

Son dos campos con valores solapables (B5 pendiente en Phase2). El
gate de entitlements del EP (D6) debe leer **una sola fuente** —
propuesta: `usuarios_suscripciones.plan_actual` una vez se resuelva B5.
Registrar como dependencia, no como decisión del EP.

### 3.3 Convenciones confirmadas para el DDL futuro

- PK `UUID DEFAULT uuid_generate_v4()` (extensión uuid-ossp ya activa) ✓
- FK con `ON DELETE CASCADE` desde padre y `SET NULL` para referencias
  opcionales — mismo patrón propuesto para `ep_proyecto_*` ✓
- Roles como `VARCHAR + CHECK IN (...)` — patrón exacto de
  `feria_participantes.rol` ✓
- Junction `UNIQUE(contenedor_id, usuario_id)` — patrón
  `feria_participantes`/`feria_operaciones` ✓
- Timestamps: el schema mezcla `TIMESTAMP WITH TIME ZONE` y
  `TIMESTAMPTZ` (equivalentes). Convención para tablas nuevas:
  **`TIMESTAMPTZ`** ✓
- Coordenadas nuevas: **`DOUBLE PRECISION`** (nunca `REAL` — lección de
  mediciones_campo 2-B1), aplica a `agenda_eventos.lat/lon` ✓
- Índices `idx_<tabla>_<columna>` ✓

### 3.4 Orden de dependencias del DDL futuro

```text
perfiles_profesionales ─► usuarios_perfiles
workspaces ─► workspace_miembros ─► ep_proyectos ─► ep_proyecto_participantes
                                                └► ep_proyecto_<tipo> ×4–6
actividades ─► agenda_eventos
audit_eventos (independiente — solo FK a usuarios)
```

Todas las FKs externas apuntan a tablas ya existentes — no hay
dependencias circulares ni orden imposible.

## 4. Ajustes derivados de la revisión

### 4.1 Enlaces — lista revisada

| Enlace | Estado tras revisión |
|---|---|
| `ep_proyecto_fincas` | ✅ viable |
| `ep_proyecto_lotes` | ✅ viable |
| `ep_proyecto_levantamientos` | ✅ viable |
| `ep_proyecto_registros` | ✅ viable |
| `ep_proyecto_evidencias` | ⏸ depende de B2 (M11 rediseño) |
| `ep_proyecto_informes` | ⏸ depende de B2 (informe = documento custodiado) |
| ~~`ep_proyecto_mediciones`~~ | descartado — la medición llega vía su levantamiento; enlace individual solo si surge caso real |

### 4.2 Conteo revisado de tablas nuevas

**Núcleo EP (sin dependencias):** `perfiles_profesionales`,
`usuarios_perfiles`, `workspaces`, `workspace_miembros`,
`ep_proyectos`, `ep_proyecto_participantes`,
`ep_proyecto_fincas`, `ep_proyecto_lotes`,
`ep_proyecto_levantamientos`, `ep_proyecto_registros` → **10 tablas**

**Transversales:** `actividades`, `agenda_eventos`, `audit_eventos` → **3**

**Diferidas a B2:** `ep_proyecto_evidencias`, `ep_proyecto_informes` → **2**

Total diseño: 15 propuestas; **13 ejecutables en el primer DDL** si se
aprueba.

## 5. Riesgos residuales

| Riesgo | Nivel | Mitigación |
|---|---|---|
| M11 no genérica → enlaces de evidencias bloqueados | medio | diferir 2 tablas a B2 (ya recomendado) |
| Doble campo de plan (B5) → gate EP lee fuente incorrecta | bajo | fijar fuente al resolver B5; documentar |
| FK a `registros_campo` dispara solo lectura — el trigger de cuota es INSERT-only, no afecta enlaces | nulo | verificado |
| Borrado de `usuarios` cascada correcta a través de participantes/miembros | nulo | CASCADE estándar |

## 6. Estado

```text
EP-0 ✅ diseño conceptual          docs/ECOSISTEMA_PROFESIONAL.md
EP-1 ✅ modelo propuesto           docs/EP_MODELO_DATOS.md (D1–D9, revisado)
EP-2 ✅ esta revisión              verificado contra schema real
EP-3 ✅ DDL ejecutado              45 tablas en melantia_db — ver
                                   docs/EP_DDL_REVISION.md §4
EP-4A ✅ identidad profesional     /api/v1/ep/perfiles — 114/114 pytest
```

**EP-2 cerrado:** el modelo integra limpio con las tablas reales; 2
enlaces diferidos a B2; 13 tablas desplegadas y validadas (EP-3).
