# MELANTIA — ECOSISTEMA PROFESIONAL · Modelo de Datos (propuesta EP-1)

**Fecha:** 2026-09-29
**Estado:** PROPUESTA DE DISEÑO — resuelve conceptualmente las
decisiones D1–D9 de `docs/ECOSISTEMA_PROFESIONAL.md` §20. **Cada
decisión marcada ⏳ requiere tu aprobación.** Nada de este documento se
ha ejecutado en PostgreSQL ni generado código.

> **Regla conservada del diseño:** el Ecosistema Profesional organiza y
> relaciona información; **no duplica** la información que pertenece a
> los módulos de MELANTIA. Todo recurso existente se enlaza por
> referencia, nunca por copia.

**Convenciones heredadas del esquema real** (verificadas en
`backend/database/schema/`): nombres snake_case en plural, familias con
prefijo de dominio (`trazabilidad_*`, `feria_*`), PKs UUID
(`uuid-ossp`), `created_at`/`updated_at`, índices `idx_*`, estados como
`VARCHAR` + `CHECK`, soft patterns `ON DELETE SET NULL` cuando el
recurso referenciado puede desaparecer sin destruir el registro.

---

## 1. Resumen de decisiones propuestas

> **Revisión crítica 2026-09-29 (bis):** D1 revisada de polimórfica a
> enlaces por tipo; D8 matizada (prefijo solo donde hay colisión);
> D9 ampliada a contexto extensible. Detalle en §11.

| # | Decisión (de EP §20) | Propuesta | Estado |
|---|---|---|---|
| D1 | Vínculo proyecto↔recursos | **`ep_proyecto_*` por tipo** — enlaces específicos con FK real (revisado §2, §11.1) | ⏳ propuesta |
| D2 | Workspace | **Entidad propia** `workspaces` + `workspace_miembros` | ⏳ propuesta |
| D3 | Profesión | **Tabla de catálogo** `perfiles_profesionales` + `usuarios_perfiles` | ⏳ propuesta |
| D4 | Actividad vs Agenda | **Separadas y transversales**: `actividades` (con contexto opcional) + `agenda_eventos` | ⏳ propuesta |
| D5 | Ubicación del EP | **Módulo nuevo** `modules/ecosistema_profesional/` — no M6; y "ubicación" = derivada, nunca duplicada (§3.5) | ⏳ propuesta |
| D6 | Entitlements | Gate por plan en service layer (no tabla nueva) | ⏳ propuesta |
| D7 | Ciclo de vida | Estados `borrador → activo → en_pausa → cerrado → archivado`; nunca DELETE físico | ⏳ propuesta |
| D8 | Nombres físicos | `ep_` **solo** en la familia `proyecto` (colisión con M6); resto en convención plana (§9) | ⏳ propuesta |
| D9 | Contexto en outbox | Campo `contexto` **extensible** en el payload (proyecto, workspace, actividad…) (§6) | ⏳ propuesta |

## 2. D1 — Vínculo Proyecto ↔ recursos (la decisión central)

### Opciones analizadas — revisión en profundidad

| Criterio | (a) `proyecto_id` por tabla | (b) Enlace central polimórfico | (c) Enlace por tipo | (h) Híbrido: exclusión múltiple |
|---|---|---|---|---|
| **n:n real** | ❌ un recurso, un proyecto | ✅ | ✅ | ✅ |
| **Toca tablas existentes** | ❌ ALTER a `fincas`, `lotes`, `levantamientos`, `evidencias_documentos`… | ✅ cero | ✅ cero | ✅ cero |
| **Integridad referencial** | ✅ | ❌ sin FK física al recurso | ✅ FK real por tipo | ✅ FK real (arc exclusivo) |
| **ON DELETE automático** | ✅ | ❌ service cleanup manual | ✅ CASCADE/SET NULL | ✅ CASCADE |
| **Vínculo con metadatos** | difícil | natural | natural | natural |
| **Listar recursos de un proyecto** | imposible (recurso sólo en 1 proyecto) | 1 SELECT + join por tipo | UNION de N tablas | 1 SELECT + join por tipo |
| **Añadir tipo nuevo** | 1 columna | 1 valor en CHECK | 1 tabla | 1 columna ALTER |
| **Convención del schema actual** | — | no usada en el schema | ✅ (`feria_participantes`, `feria_operaciones`, `trazabilidad_fases`) | no usada en el schema |
| **Offline/sync** | el recurso nacería acoplado | vínculo simple tipo+id | vínculo simple por tabla | igual que (b) |

### Análisis por criterio

**Integridad referencial.** El esquema actual usa 45 FKs con
`ON DELETE` declarativo (`mediciones_campo`→`levantamientos` CASCADE,
`lote_id` SET NULL, etc.). Toda la cadena de integridad vive en la BD,
no en el service. La opción (b) es la **única que rompe ese patrón**:
un `recurso_id` sin FK puede quedar apuntando a un recurso borrado y
PostgreSQL no lo impediría — la única defensa sería disciplina de
service en cada módulo que borre sus propios recursos. Eso es un vector
de vínculos huérfanos silenciosos: exactamente el tipo de inconsistencia
que `ep_proyecto_recursos` existe para evitar.

**Eliminación/desvinculación.** Con (c) `ep_proyecto_levantamientos` →
`levantamientos ON DELETE CASCADE`: borrar el levantamiento corta el
vínculo automáticamente, cumpliendo la regla de EP §7 ("eliminar el
recurso original corta las referencias") sin código extra. Con (b) hay
que implementar cleanup en cada repository/service de dominio — y
olvidarlo en un solo módulo deja enlaces rotos invisibles.

**Cardinalidad.** Todas menos (a) permiten que una finca/levantamiento
pertenezca a varios proyectos a lo largo del tiempo — requisito
explícito del diseño (certificación de carbono en 2 años sobre la misma
finca).

**Consultas.** En (b) y (h), listar el contenido de un proyecto exige
de todos modos un JOIN por cada tipo (un UUID polimórfico no se puede
joinear genéricamente a N tablas sin conocer el tipo). La ventaja de
"una sola tabla" de (b) es real para la lista de vínculos pero ilusoria
para los datos: la consulta siempre es N joins. En (c) es igualmente
N joins — sin ventaja de consulta para (b).

**Permisos.** En todas las variantes, la autorización es
`participante del proyecto` + `vínculo existe`. (b) exige además
validar `recurso_id` en service porque la BD no puede — una validación
más por operación de vínculo.

**Auditoría.** Equivalente en todas: `audit_eventos` registra
vincular/desvincular. (b) concentra; (c) dispersa pero audit_eventos lo
unifica igual.

**Evolución futura.** Única ventaja real de (b): añadir un tipo nuevo
cuesta solo ampliar un CHECK — cero DDL estructural. Pero el roadmap
24+ meses (GIS, drones, IoT) implica de todos modos crear la tabla del
recurso nuevo; añadir su enlace `ep_proyecto_<tipo>` en la misma
migración es marginal. La frecuencia de tipos nuevos será baja
(1–2 por fase), no alta.

**Híbrido (h) — arc exclusivo:** una tabla
`ep_proyecto_recursos(proyecto_id, finca_id, lote_id, levantamiento_id, …)`
con `CHECK (exactamente una FK no nula)`. Da FK reales + CASCADE en una
sola tabla, pero exige N columnas nullable + N índices únicos parciales
`UNIQUE(proyecto_id, finca_id) WHERE finca_id IS NOT NULL` — patrón no
usado en el schema, más difícil de leer, y cada tipo nuevo es un ALTER.
Se evalúa y **se descarta**: combina la complejidad de columnas de (a)
con la consulta por tipo de (c), sin ganar lo mejor de ninguna.

### Propuesta revisada: (c) enlaces por tipo

```text
ep_proyecto_fincas         (proyecto_id FK→ep_proyectos CASCADE,
                            finca_id FK→fincas CASCADE,
                            vinculado_por FK→usuarios, nota, created_at
                            UNIQUE(proyecto_id, finca_id))
ep_proyecto_lotes          (… lote_id FK→lotes CASCADE …)
ep_proyecto_levantamientos (… levantamiento_id FK→levantamientos CASCADE …)
ep_proyecto_evidencias     (… evidencia_id FK→evidencias_documentos CASCADE …)
ep_proyecto_registros      (… registro_id FK→registros_campo CASCADE …)
ep_proyecto_informes       (… documento_id FK→evidencias_documentos
                            (rol entregable) …)
```

- ~6 tablas de enlace hoy, idénticas en forma → el repository las trata
  como un patrón único parametrizado por tipo.
- **Consecuencia:** la integridad completa sigue viviendo en PostgreSQL,
  coherente con las 45 FKs existentes; cero riesgo de vínculos
  huérfanos; `listar_recursos(proyecto)` = UNION controlada de 6 SELECT.
- **Coste aceptado:** cada nuevo tipo de recurso = su tabla de dominio +
  su tabla de enlace en la misma migración (fases D–F geo, 24+ meses).
- La opción (b) queda documentada como fallback solo si el número de
  tipos se disparara — hoy no es el caso.

⏳ **Pendiente de aprobación.** Si prefieres un único mecanismo aun
sacrificando la FK física, (b) sigue documentada con sus mitigaciones
(cleanup en service + `audit_eventos` de todo desvínculo).

## 3. Participantes y permisos (D2, D3, D5 parcial)

```text
perfiles_profesionales            catálogo de profesiones (D3)
  id, codigo UNIQUE ('agronomo','veterinario',…), nombre, descripcion, activo

usuarios_perfiles                 usuario ↔ profesión (multi-perfil)
  id PK + usuario_id FK→usuarios, perfil_id FK, verificado BOOL,
  principal BOOL, UNIQUE (usuario_id, perfil_id)
  — convención junction con PK sustituta (feria_participantes)

workspaces                        la oficina (D2: entidad)
  id, nombre, propietario_id FK→usuarios,
  estado ('activo','archivado'), created_at, updated_at

workspace_miembros                equipo permanente del workspace
  id PK + workspace_id FK, usuario_id FK, rol_workspace VARCHAR
  ('propietario','socio','colaborador'), estado
  UNIQUE (workspace_id, usuario_id)

ep_proyectos                      la unidad de trabajo
  id, workspace_id FK→workspaces NULL   — NULL = proyecto personal
  nombre, descripcion,
  estado VARCHAR CHECK ('borrador','activo','en_pausa','cerrado','archivado'),  D7
  creado_por FK→usuarios, fecha_inicio, fecha_objetivo,
  created_at, updated_at

ep_proyecto_participantes         membresía + rol (permisos por proyecto)
  proyecto_id FK→ep_proyectos CASCADE, usuario_id FK→usuarios,
  rol VARCHAR CHECK ('propietario','cliente','profesional_responsable',
    'colaborador','tecnico','auditor'),
  estado ('invitado','activo','removido'), asignado_por FK→usuarios,
  created_at
  PK (proyecto_id, usuario_id)    — un usuario, un rol por proyecto
```

**Decisiones embebidas:**

- **Cliente es un rol de participante**, no una columna ni entidad — un
  proyecto puede tener varios clientes; un `cliente_principal` visible
  sería solo un flag opcional en `ep_proyecto_participantes` (decisión
  menor, puede quedar para EP-1 detallado).
- **Un rol por usuario por proyecto** (PK compuesta). Si alguien
  ejerce dos roles, el service otorga el conjunto de permisos del rol
  mayor — documentar en EP-3.
- `workspaces.propietario_id` = administrador de la oficina;
  los roles operativos por proyecto viven abajo, en participantes.
- El aislamiento de recursos sigue siendo `usuario_id` en cada módulo;
  `ep_proyecto_participantes` solo concede **visibilidad contextual**
  sobre los vínculos de `ep_proyecto_recursos`.

### 3.5 Qué significa "Ubicación" en el EP (aclaración de D5)

"Ubicación" aparece en el árbol conceptual del Proyecto y puede mal-
interpretarse como un dato propio. **El EP no posee datos geoespaciales.**

| Elemento | Dueño real | El EP |
|---|---|---|
| Ubicación de la finca (parroquia/cantón/provincia, `coordenadas_gps` TEXT legacy) | `fincas` (M3) + catálogos geográficos | referencia vía enlace a finca |
| Ubicación/extensión del lote | `lotes` (M3) | referencia |
| Puntos GPS de un levantamiento | `mediciones_campo` (M2) | referencia |
| Cálculos geográficos | `geodesia` — servicio, no persistencia | consume, no guarda |
| "Ubicación del proyecto" | **derivada**: la del recurso principal vinculado (finca/lote) | se consulta, no se guarda |
| Punto de un evento (ej. cita en un cruce de caminos aún no registrado como lote) | `agenda_eventos.lat/lon` — dato **original del evento**, no duplicación | OK persistir |

Regla: un proyecto que necesite mostrar ubicación la **deriva del
recurso vinculado**; no existe `ep_proyectos.ubicacion` ni tabla de
ubicaciones del EP. `fincas.coordenadas_gps` sigue intacta como legado
TEXT (pendiente B1 de Phase2 — no la toca el EP).

## 4. Actividades y Agenda (D4)

La Agenda es **transversal a toda MELANTIA** (Master FULL §37), no del
EP. Por eso ambas entidades quedan fuera del prefijo `ep_`:

```text
actividades                       trabajo planificable (transversal)
  id, titulo, tipo, descripcion,
  estado ('pendiente','en_curso','completada','cancelada'),
  responsable_id FK→usuarios,
  contexto_tipo VARCHAR NULL ('proyecto','finca','general'),   ← enlace suave
  contexto_id UUID NULL,
  fecha_objetivo, created_at, updated_at

agenda_eventos                    ocurrencias temporales (transversal)
  id, actividad_id FK→actividades NULL,   — un evento puede ser suelto
  usuario_id FK→usuarios,                 — dueño de la agenda
  fecha_inicio, duracion_min, ubicacion_texto, lat, lon,
  recordatorio_min, estado, created_at
```

- `Actividad` = *qué hay que hacer* (puede pertenecer a un proyecto por
  `contexto_tipo='proyecto'`); `agenda_eventos` = *cuándo/dónde*.
- El cálculo de desplazamiento/hora de salida es **derivado del evento**,
  no se persiste como dato original.
- Reutilizable por M3 (visitas a finca), M4 (entregas), M7 (cursos),
  EP — una sola tabla, no una agenda por módulo (Master §27).

## 5. Auditoría compartida (`shared/audit/`)

Prerequisito conjunto de EP y Administración (ADM-2):

```text
audit_eventos                     infraestructura transversal única
  id UUID PK
  actor_id   FK→usuarios NULL       — NULL = sistema automático
  actor_tipo VARCHAR ('usuario','sistema')
  accion     VARCHAR                — 'proyecto.creado','recurso.vinculado',
                                     'admin.cuota_ajustada','auth.login'…
  objeto_tipo VARCHAR, objeto_id UUID
  contexto_tipo VARCHAR NULL, contexto_id UUID NULL   — proyecto, workspace…
  detalle    JSONB                  — valor anterior/nuevo cuando aplique
  created_at TIMESTAMP
  (índices: actor, objeto, contexto, accion, fecha)
```

- **Un solo motor** para eventos de dominio, de proyecto y
  administrativos — `admin/auditoria/` solo lo consulta (ADM §4).
- Integridad por hash encadenado queda como decisión de EP-1 detallado
  (coherente con `hash_integridad` ya usado en trazabilidad).

## 6. Estrategia offline / outbox (D9)

Sin outbox implementado aún; la reserva conceptual es:

```text
operación de sincronización
  ├── tipo (crear levantamiento, evidencia, medición…)
  ├── payload (el recurso — con UUID generado en el cliente)
  └── contexto { proyecto?: uuid, workspace?: uuid,
                 actividad?: uuid, … }     ← objeto extensible
```

**Revisión D9 — `{proyecto}` solo no basta:**

- Una captura puede pertenecer a la vez a un proyecto **y** derivarse de
  una actividad programada de ese proyecto; un solo par `tipo+id` no
  puede expresar ambos.
- `contexto` como **objeto de claves reservadas** (todas opcionales) es
  igual de simple hoy y admite claves nuevas sin migrar la cola:
  `{"proyecto": "<uuid>"}` ahora; `{"proyecto":…,"workspace":…,"actividad":…}`
  cuando esas superficies existan.
- El servidor, al aplicar la operación, crea los enlaces
  correspondientes en `ep_proyecto_<tipo>` — **el cliente no envía el
  vínculo como operación separada**; solo declara contexto.
- Regla de conflicto (heredada): datos originales tienen prioridad de
  conservación; los vínculos de proyecto son resolubles por servidor.
- Coordina con la Fase H geoespacial — el diseño del outbox debe
  incluir `contexto` extensible desde el inicio para no migrar la cola
  después.

## 7. Qué pertenece al Proyecto y qué no

| Vive en el EP (tablas `ep_*`) | Sigue en su módulo (solo referenciado) |
|---|---|
| proyecto (nombre, estado, fechas) | fincas, lotes (M3) |
| participantes y roles | levantamientos, mediciones (M2) |
| vínculos a recursos (`ep_proyecto_<tipo>`) | evidencias, documentos (M11) |
| actividades del proyecto (via `actividades.contexto`) | trazabilidades (M3), transacciones (M4) |
| workspace, miembros, perfiles profesionales | informes/entregables físicos (custodia M11) |
| historial (via `audit_eventos.contexto`) | usuarios (auth) |

Un **informe generado** es doble naturaleza: el *archivo/derivado* lo
custodia M11 (hash, versiones); la *pertenencia* al proyecto es una fila
de `ep_proyecto_informes` apuntando a su `evidencias_documentos.id`.

## 8. Diagrama del modelo propuesto

```text
usuarios ──┬── usuarios_perfiles ──► perfiles_profesionales
           │
           ├── workspace_miembros ──► workspaces ──► ep_proyectos
           │                                                    │
           └── ep_proyecto_participantes ────────────────────────┘
                                                                │
audit_eventos ◄── contexto                    ep_proyecto_fincas ──► fincas
   ▲    (todas las acciones)                  ep_proyecto_lotes ──► lotes
   │                                          ep_proyecto_levantamientos ──► levantamientos
actividades ◄── contexto_tipo='proyecto'      ep_proyecto_evidencias ──► evidencias_documentos
   │                                          ep_proyecto_registros ──► registros_campo
   └── agenda_eventos                         ep_proyecto_informes ──► evidencias (entregable)
                                   (enlaces con FK real + CASCADE — §2)
```

## 9. Nombres físicos definitivos propuestos (D8) — revisado

**Convención real verificada** en `schema/`: plurales planos para el
dominio (`fincas`, `lotes`, `levantamientos`, `usuarios_suscripciones`)
y prefijo de familia solo donde el sustantivo solo sería ambiguo o hay
subsistema claro (`trazabilidad_*`, `feria_*`, `bolsa_*`).

Conclusión: **el prefijo `ep_` no es necesario en general** — solo donde
existe colisión real de concepto. `proyectos` sí colisionaría con M6
("proyectos estratégicos", futuras tablas del módulo), así que la
familia proyecto conserva `ep_`; todo lo demás va plano:

| Concepto | Tabla propuesta | Motivo |
|---|---|---|
| Proyecto | `ep_proyectos` | colisión conceptual con M6 — `proyectos` queda reservado |
| Participación | `ep_proyecto_participantes` | familia + convención `feria_participantes` |
| Vínculos | `ep_proyecto_fincas`, `ep_proyecto_lotes`, `ep_proyecto_levantamientos`, `ep_proyecto_registros` — viables; `ep_proyecto_evidencias`, `ep_proyecto_informes` — **⏸ diferidos a rediseño M11 (B2)** | D1 revisado — enlaces por tipo con FK real (ver `docs/EP_INTEGRACION.md` §3.1) |
| Workspace | `workspaces` + `workspace_miembros` | sin colisión; plano como `fincas` |
| Profesión | `perfiles_profesionales` + `usuarios_perfiles` | transversal; paralelo a `perfiles_comerciales` existente |
| Actividad | `actividades` | transversal (Master §37) |
| Agenda | `agenda_eventos` | transversal |
| Auditoría | `audit_eventos` | `shared/audit/`, transversal |

**Total: ~12 tablas nuevas propuestas** (proyecto + participantes + 6
enlaces + workspaces + miembros + 2 transversales profesión + 3
transversales actividad/agenda/audit). Cero columnas añadidas a tablas
existentes. Cero `proyecto_id` fuera de `ep_proyecto_*`. M6 conserva el
espacio de nombres `proyectos_*`/`proyectos_estrategicos` para sus
tablas futuras — queda reservado por esta decisión.

## 10. Pendientes menores para EP-1 detallado

- Flag `cliente_principal` en participantes (¿sí/no?).
- Política multi-rol: ¿un usuario puede tener dos roles en un proyecto?
- `hash_integridad` encadenado en `audit_eventos` (¿v1 o después?).
- ¿`proyecto` también referenciable a sí mismo/otros proyectos
  (subproyectos)? — recomiendo posponer.
- `estado` completo de `ep_proyectos` y transiciones permitidas.
- Catálogo inicial de `perfiles_profesionales` (seed §36.4 del Master).

## 11. Revisión crítica 2026-09-29 (bis) — cambios respecto a la primera propuesta

| # | Antes | Después | Motivo |
|---|---|---|---|
| D1 | `ep_proyecto_recursos` polimórfica | Enlaces por tipo `ep_proyecto_<tipo>` con FK real | El esquema vive de integridad declarativa (45 FK `ON DELETE`); la versión polimórfica era el único punto sin defensa contra vínculos huérfanos |
| D5 | sin sección | §3.5: ubicación = derivada del recurso, nunca persistida en el EP | evita duplicar `coordenadas_gps`/puntos |
| D8 | `ep_` en toda la familia | `ep_` solo en `ep_proyecto*` (colisión M6); resto plano | convención real del schema: prefijos solo donde hay ambigüedad |
| D9 | `contexto:{tipo,id}` | `contexto` objeto extensible multi-clave | una operación puede llevar proyecto+actividad+workspace a la vez |

---

**Estado EP-1:** modelo **aprobado conceptualmente** (2026-09-29, con
revisiones §11).
**Estado EP-2:** integración verificada — `docs/EP_INTEGRACION.md`.
**Estado EP-3:** DDL **ejecutado y validado** en `melantia_db`
(2026-09-29) — 13 tablas creadas, 45 tablas totales, pytest 91/91.
Registro completo en `docs/EP_DDL_REVISION.md` §4.
Pendientes: `ep_proyecto_evidencias`/`ep_proyecto_informes` (B2) y
entitlements (B5).
