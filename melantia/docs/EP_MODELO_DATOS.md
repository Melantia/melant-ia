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
- **Membresías removidas — DECISIÓN APROBADA (EP-4C, §17 de la tarea):**
  `UNIQUE(workspace_id, usuario_id)` hace que remover deje una fila
  `removido` y re-incorporar choque con ella. Se adopta la **opción A**:
  reutilizar la membresía existente — `removido → activo` directamente,
  sin nueva fila ni nueva incorporación. La reactivación la ejecuta el
  propietario/administrador; sin cambio de DDL. Aplica igual a
  `ep_proyecto_participantes` (misma regla). La opción B (UNIQUE
  parcial + historial múltiple) queda descartada para esta iteración.

## 11. Revisión crítica 2026-09-29 (bis) — cambios respecto a la primera propuesta

| # | Antes | Después | Motivo |
|---|---|---|---|
| D1 | `ep_proyecto_recursos` polimórfica | Enlaces por tipo `ep_proyecto_<tipo>` con FK real | El esquema vive de integridad declarativa (45 FK `ON DELETE`); la versión polimórfica era el único punto sin defensa contra vínculos huérfanos |
| D5 | sin sección | §3.5: ubicación = derivada del recurso, nunca persistida en el EP | evita duplicar `coordenadas_gps`/puntos |
| D8 | `ep_` en toda la familia | `ep_` solo en `ep_proyecto*` (colisión M6); resto plano | convención real del schema: prefijos solo donde hay ambigüedad |
| D9 | `contexto:{tipo,id}` | `contexto` objeto extensible multi-clave | una operación puede llevar proyecto+actividad+workspace a la vez |

## 12. EP-4C — rediseño conceptual del modelo de trabajo (2026-09-29)

> **Solo diseño — nada implementado, nada alterado en el DDL.**

### 12.1 Jerarquía del trabajo profesional

El modelo anterior `Workspace → Proyecto → Participantes → Recursos`
es insuficiente: **no todo trabajo profesional requiere un Proyecto**.
La jerarquía definitiva propuesta:

```text
TRABAJO PROFESIONAL
├── VISITA / SERVICIO PROFESIONAL PUNTUAL
│     └── Resultado
│           └── (si el cliente solicita continuidad) → PROYECTO
│
└── PROYECTO  (contenedor general de coordinación — §2.5 ECOSISTEMA)
      ├── Participantes (roles de proyecto)
      ├── Programa 1..N
      │     ├── Fases  (IA propone → profesional aprueba)
      │     ├── Actividades
      │     ├── Visitas
      │     ├── Cronograma
      │     ├── Presupuesto consolidado
      │     └── Resultados / entregables
      ├── Programa 2..N …
      ├── Presupuesto consolidado
      └── Vínculos → fincas/lotes/levantamientos/registros
            (referencia, nunca duplicación — §7)
```

El **Proyecto puede existir sin programas** (trabajo simple de varias
sesiones) y la **visita puntual existe sin Proyecto ni Workspace**.

### 12.2 Definiciones formales

| Término | Definición | Capa |
|---|---|---|
| **Visita / Servicio puntual** | Trabajo profesional autocontenido e independiente: desplazamiento + inspección + registro + resultado/entregable, sin proyecto, programa ni equipo | EP |
| **Proyecto** | Contenedor general de coordinación de un encargo profesional finito. No es actividad, ni operación de campo, ni unidad espacial | EP |
| **Programa** | Subdivisión temática durable de un proyecto ("manejo fitosanitario", "plan de riego") con objetivo, responsable, fases, cronograma y presupuesto propios | EP — entidad futura |
| **Fase** | Etapa ordenada dentro de un programa (diagnóstico, ejecución, evaluación). Sugerible por IA; el profesional aprueba | EP — entidad futura |
| **Actividad** | Ítem concreto de coordinación profesional con responsable/estado/fecha (tabla `actividades` ya existe) | EP |
| **Operación de campo** | Ejecución técnica real sobre una Unidad de Gestión (fertilización, muestreo, riego) — pertenece al módulo de dominio (M2/M3/M11), EP solo la referencia/coordina | campo |
| **Resultado** | Entregable verificable de una visita, actividad, programa o proyecto (diagnóstico, informe, recomendación) | EP + custodia M11 (B2) |
| **Cliente** | Dos sentidos: (A) contacto/cartera del profesional — entidad futura `clientes_profesionales`; (B) participante de un proyecto con `rol='cliente'` | EP |
| **Presupuesto** | Desglose económico por actividad (visita, transporte, insumos, laboratorio, informe) que se consolida en programa → proyecto | EP — entidad futura |
| **Propuesta técnica(/económica)** | Documento generable (borrador por IA, aprobación del profesional): propuesta técnica, propuesta+presupuesto, cronograma, plan de trabajo, informes | EP — generación futura |

### 12.3 Flujo visita → proyecto

```text
VISITA PUNTUAL
  (sin workspace/proyecto — trabajo profesional completo en sí mismo)
    ↓  RESULTADO (diagnóstico, evidencias, recomendación)
    ↓  CLIENTE SOLICITA CONTINUIDAD
CREAR PROYECTO
    ↓  hereda referencias — nunca copia: cliente, finca, lote/UG,
       cultivo, diagnóstico, evidencias, resultado de la visita
PROGRAMA(S) DE MANEJO
```

La conversión crea el proyecto y **vincula** los recursos existentes
(la visita queda como antecedente referenciado); no duplica datos.

### 12.4 Flujo IA → estructura aprobada

```text
IA PROPONE (fases/programas/plan según nombre+objetivo+contexto)
  ↓
PROFESIONAL REVISA
  ↓
PROFESIONAL MODIFICA (acepta, edita, elimina, agrega, reordena)
  ↓
PROFESIONAL APRUEBA
  ↓
ESTRUCTURA DEFINITIVA
```

Regla: la IA nunca convierte sus sugerencias en obligaciones
técnicas — propone borradores; la estructura solo nace al aprobarse.

### 12.5 Modelo de presupuesto (conceptual)

```text
Actividad → presupuesto opcional (ítems: visita, transporte,
            insumos, laboratorio, informe, total)
Programa  → consolidación de presupuestos de sus actividades
Proyecto  → consolidación de programas (+ actividades sueltas)
```

Presupuesto = entidad futura por contenedor (actividad/programa/
proyecto), no columna. La consolidación es derivada — nunca se
persiste desconectada de sus partidas.

### 12.6 Clientes profesionales (conceptual)

```text
CLIENTE (entidad)          CLIENTE (participante)
cartera del profesional    rol='cliente' en ep_proyecto_participantes
├── historial              └── un proyecto concreto
├── clasificaciones
└── N proyectos/visitas
```

- El profesional mantiene una **cartera de clientes** — entidad futura
  `clientes_profesionales` (diseño pendiente, no implementar).
- Clasificación **flexible y privada del profesional** (etiquetas:
  "productor de cacao", "cliente institucional"…) — no taxonomía
  rígida ni etiquetas subjetivas ("buen/mal cliente").
- El comportamiento de pago se deriva de datos objetivos (facturas,
  vencimientos, días promedio de pago) — dominio M10 futuro, no EP.

### 12.7 Visibilidad y roles — tres dimensiones separadas

```text
Perfil profesional    agrónomo / veterinario / topógrafo…   (EP-4A)
Workspace             fundador / socio / administrador /    (EP-4B + evolución)
                      trabajador
Proyecto              propietario / profesional_responsable
                      / colaborador / tecnico / auditor /
                      cliente
```

Ejemplo: un usuario es `agrónomo` (perfil) + `socio` (workspace) +
`profesional_responsable` (proyecto) — tres ejes que no se mezclan.

**Decisión de visibilidad (aprobada):** el **propietario del
workspace ve la información completa de los proyectos anclados a su
workspace** — sustituye la restricción anterior de "gestor ve
existencia sin detalle". No se extiende a todos los miembros: la
matriz de permisos fina queda como diseño futuro.

### 12.8 Workspace — identidad y plan

- **Nombre mutable:** renombrar ("Oficina Agronómica Andrade" →
  "Oficina de Servicios de Fertilización Andrade") no crea otro
  workspace ni cambia el UUID; proyectos, miembros e historial
  permanecen. Ya soportado por `PATCH /ep/workspaces` (EP-4B).
- **Plan profesional (referencia, no regla EP):** capacidad base
  propuesta 1 fundador + 1 socio + 1 administrador + 2 trabajadores
  (5 puestos) + $5 por puesto adicional. **EP nunca hardcodea estas
  reglas** — consulta capacidades a entitlements/suscripciones (B5).

### 12.9 Adecuación del DDL actual (EP-3 ya ejecutado)

| Tabla EP-3 | ¿Suficiente para EP-4C? |
|---|---|
| `ep_proyectos` | ✅ suficiente para el contenedor (nombre, descripcion, workspace_id nullable, estados, fechas). `objetivo` puede mapearse a `descripcion` en v1; columna dedicada = evolución futura opcional |
| `ep_proyecto_participantes` | ✅ suficiente (roles CHECK cubren cliente/responsable/etc.) |
| `workspaces` / `workspace_miembros` | ⚠ roles CHECK `propietario/socio/colaborador` no cubren `administrador`/`trabajador` del plan propuesto — **requiere evolución futura** del CHECK cuando el plan profesional se materialice (depende de B5); `trabajador` ≈ `colaborador` hoy |
| `actividades` | ✅ suficiente como coordinación; presupuesto por actividad = entidad futura |
| `agenda_eventos` | ✅ suficiente (ocurrencias temporales; visitas pueden usarlo) |
| `audit_eventos` | ✅ estructura lista; writers pendientes ADM-2 |
| `perfiles_profesionales`/`usuarios_perfiles` | ✅ suficiente como identidad profesional — **sin gate `tiene_perfil`**: el acceso a funcionalidades EP lo regula el Plan Profesional vigente (suscripciones/B5), no el Perfil Profesional (D-C1 corregida 2026-09-30) |

**Conclusión:** `ep_proyectos` sigue siendo suficiente para EP-4C
como contenedor. Las entidades nuevas (programas, fases, visitas,
clientes_profesionales, presupuestos, propuestas) son **evolución
futura documentada**, no cambios al DDL actual.

### 12.10 Entidades futuras identificadas (no crear todavía)

| Entidad futura | Motivo | Dependencia |
|---|---|---|
| `ep_programas` | subdivisión durable del proyecto | EP-4C aprobado |
| `ep_fases` | etapas ordenadas de programa | ep_programas |
| `ep_visitas` (o servicios puntuales) | trabajo sin proyecto; origen de proyectos | diseño propio |
| `ep_presupuestos` + ítems | economía por contenedor | actividades/programas |
| `ep_propuestas` | documentos generados (IA borrador → aprobación) | programas+presupuestos |
| `clientes_profesionales` | cartera del profesional | diseño propio |
| `ep_proyecto_evidencias`/`_informes` | vínculos de custodia | **B2 (M11)** |
| Evolución `workspace_miembros` CHECK | rol `administrador` (y naming trabajador) | **B5** + aprobación |

### 12.11 Decisiones registradas

| # | Decisión | Estado |
|---|---|---|
| D-C0 | Membresías removidas: `removido → activo` reutilizando la fila (aplica a workspace_miembros y ep_proyecto_participantes) | ✅ aprobada |
| D-C1 | **Acceso EP = Plan Profesional vigente, no Perfil Profesional** — crear/activar/ser propietario/gestionar un Proyecto exige la suscripción habilitante (Plan Profesional, vía entitlements B5); **no se exige Perfil Profesional** en ningún caso (`tiene_perfil` queda descartado como condición). Ejemplo válido: productor con Plan Profesional ($25) crea y gestiona su Proyecto de 1 ha de cacao con asistencia IA, sin Perfil Profesional | ✅ aprobada y corregida (redacción del usuario, 2026-09-30 — sustituye "proyecto sin workspace exige ≥1 perfil profesional activo") |
| D-C2 | Objetivo obligatorio **antes** de `borrador → activo` (no para crear el borrador) | ⏳ propuesta |
| D-C3 | Propietario del workspace ve detalle completo de proyectos anclados | ✅ aprobada |
| D-C4 | `archivado` terminal | ⏳ propuesta |
| D-C5 | Gestión de participantes en EP-4D | ⏳ propuesta |
| D-C6 | Roles workspace: `administrador` + `trabajador` (5 puestos base vía entitlements) | ⏳ depende B5 — evolución futura del CHECK |
| D-C7 | `clientes_profesionales` como entidad de cartera | ⏳ diseño futuro |
| D-C8 | Visita puntual como trabajo sin proyecto; conversión por referencia | ⏳ propuesta |

---

**Estado EP-1:** modelo **aprobado conceptualmente** (2026-09-29, con
revisiones §11).
**Estado EP-2:** integración verificada — `docs/EP_INTEGRACION.md`.
**Estado EP-3:** DDL **ejecutado y validado** en `melantia_db`
(2026-09-29) — 13 tablas creadas, 45 tablas totales, pytest 91/91.
Registro completo en `docs/EP_DDL_REVISION.md` §4.
Pendientes: `ep_proyecto_evidencias`/`ep_proyecto_informes` (B2) y
entitlements (B5).
**Estado EP-4A:** identidad profesional **implementada** (2026-09-29) —
seed de 6 perfiles, `GET/POST/DELETE /api/v1/ep/perfiles*`, regla UUID
(`perfil_id` = FK real, `codigo` semántico), pytest 114/114.
**Estado EP-4B:** workspaces **implementado** (2026-09-29) —
`/api/v1/ep/workspaces` con miembros/roles (propietario/socio/
colaborador), invitación→aceptar, protección del propietario fundador;
pytest 146/146.
**Estado EP-4D:** **diseño documental CERRADO** (2026-09-30) —
participantes/roles/permisos (§13). **D-D1…D-D7 todas aprobadas**;
D-C1 corregida (acceso EP = Plan Profesional vigente, nunca Perfil
Profesional — `tiene_perfil` descartado como gate). Incorporación =
decisión del propietario (venia opcional del `profesional_responsable`
según naturaleza técnica); ciclo conceptual `contrato → pendiente →
aceptado → activo`; alcance de `tecnico` formalizado; recomendación
de intervención profesional (§13.15), directorio futuro + plan $12
(§13.16) y contratación futura (§13.17) registrados como evolución.
**DDL sin cambios** (`invitado/activo/removido`); siguiente fase:
**EP-4E** (matriz rol × recurso × nivel de acceso).

## 13. EP-4D — Participantes, roles y permisos de Proyecto (diseño)

> **Solo diseño — nada implementado, nada alterado en el DDL.**

### 13.1 Tres dimensiones que no se mezclan

```text
PLAN PROFESIONAL     habilita el acceso      (suscripciones/entitlements — B5)
PERFIL PROFESIONAL   qué es el usuario       (usuarios_perfiles — EP-4A)
ROL DE WORKSPACE     función en la oficina   (workspace_miembros — EP-4B)
ROL DE PROYECTO      función en el encargo   (ep_proyecto_participantes)
```

**Plan Profesional ≠ Perfil Profesional (regla aprobada 2026-09-30):**
el acceso a las capacidades del Ecosistema Profesional depende de la
**suscripción/Plan Profesional vigente**. El Perfil Profesional es
identidad/capacidad profesional dentro del ecosistema — **no es
condición para crear, activar, ser propietario ni gestionar un
Proyecto**. Ejemplo válido: un productor/campesino contrata el Plan
Profesional ($25), crea un Proyecto para sembrar 1 ha de cacao y usa
la asistencia de MELANTIA/IA durante todo el proceso **sin tener
Perfil Profesional**. `tiene_perfil` queda descartado como puerta de
creación/activación de proyectos (D-C1 corregida).

Ejemplo válido de dimensiones: `agrónomo` (perfil) + `propietario`
(workspace) + `profesional_responsable` (proyecto A) + `auditor`
(proyecto B).

### 13.2 Modelo físico existente (verificado en el DDL ejecutado)

`ep_proyecto_participantes`: `proyecto_id` CASCADE,
`usuario_id` CASCADE, `rol` NOT NULL, `estado` DEFAULT 'invitado',
`asignado_por` SET NULL, `created_at`;
`UNIQUE(proyecto_id, usuario_id)`.

- **Roles reales (CHECK):** `propietario`, `cliente`,
  `profesional_responsable`, `colaborador`, `tecnico`, `auditor`.
- **Estados reales (CHECK):** `invitado`, `activo`, `removido`.

Todo lo que sigue parte de estos valores — ninguno se inventa ni se
modifica.

### 13.3 Quién puede ser participante

| Pregunta | Respuesta propuesta |
|---|---|
| ¿Debe ser usuario registrado? | Sí — FK a `usuarios` lo exige físicamente; es la única condición técnica |
| ¿Requiere Plan Profesional? | **Sí para operar el EP** — crear/activar/gestionar proyectos usa capacidades del Ecosistema que habilita la suscripción vigente (B5). Es un gate de **plan comercial**, no de cualificación: lo paga quien opera, no lo exige el rol de proyecto ni el participante incorporado |
| ¿Necesita perfil profesional? | **No — para ningún rol** (D-D1 refinada 2026-09-30): MELANTIA no impone requisitos profesionales para participar; la incorporación es decisión del `propietario` del proyecto. El perfil es información visible para decidir, nunca una barrera del sistema — tabla por rol en §13.3.1 |
| ¿Múltiples roles por usuario en un proyecto? | **No hoy** — `UNIQUE(proyecto_id, usuario_id)` fija un rol por pareja. Multi-rol queda como evolución pendiente (§10) |
| ¿Mismo usuario en varios proyectos? | Sí — la restricción es por pareja, no global |
| ¿Cómo se agrega? | La decisión corresponde al `propietario` del proyecto (D-D1); la venia del `profesional_responsable` solo cuando el propietario la requiera por la naturaleza técnica de la participación. El registro operativo lo ejecutan `propietario`/`profesional_responsable` (D-D5) — entra como `invitado` = *incorporación propuesta/contractual pendiente de aceptación* (§13.9) |
| ¿Cómo se retira? | `activo → removido` — ejecutado por `propietario`/`profesional_responsable` o auto-retiro; nunca DELETE físico; **el propietario no es removible — solo transfiere propiedad** (§13.4.1) |
| ¿Retirar revoca acceso? | **Sí, inmediato** — el acceso exige `estado='activo'` |
| ¿Retirar borra historial? | **No** — la fila permanece; `removido→activo` reactiva (decisión aprobada §10) |

#### 13.3.1 Autoridad para incorporar participantes (D-D1 refinada, 2026-09-30)

Principio: **MELANTIA no decide quién está cualificado para participar
en un Proyecto profesional.** La aplicación proporciona infraestructura,
identidad, trazabilidad, estados y controles de seguridad; la decisión
profesional y contractual pertenece a las personas responsables del
Proyecto.

```text
                    PROYECTO
                       │
             ┌─────────┴─────────┐
             │                   │
       PROPIETARIO        PROFESIONAL RESPONSABLE
             │                   │
             └───────┬───────────┘
                     │
          Deciden / autorizan
          la incorporación
                     │
                     ▼
              PARTICIPANTE
```

MELANTIA queda fuera de esa decisión. Su responsabilidad empieza en:

```text
MELANTIA
├── Identidad del usuario
├── Registro de la relación
├── Estado de la participación
├── Permisos técnicos del sistema
├── Trazabilidad
├── Auditoría
└── Seguridad
```

**¿MELANTIA exige perfil profesional para incorporarse con un rol?**

| Rol de proyecto | ¿MELANTIA exige perfil profesional? |
|---|---|
| `propietario` | No |
| `profesional_responsable` | No — no como condición impuesta por la App |
| `tecnico` | No |
| `auditor` | No |
| `colaborador` | No |
| `cliente` | No |

El Perfil Profesional de EP-4A sigue existiendo, pero representa
información/capacidades declaradas o verificadas dentro del ecosistema
— nunca una barrera de acceso automática a un Proyecto.

**La venia del profesional responsable.** La incorporación de
participantes corresponde al propietario del Proyecto. Cuando la
naturaleza de la participación implique responsabilidad o intervención
técnica, el propietario podrá requerir la aprobación o venia del
profesional responsable. La plataforma registra dicha decisión, pero no
la sustituye ni la impone como criterio de cualificación.

Separación fundamental: *MELANTIA proporciona infraestructura y control
del sistema; las personas responsables toman las decisiones
profesionales y contractuales.*

### 13.4 Las tres propiedades que no son la misma persona

```text
Workspace "Oficina Agronómica Andrade"
├── propietario (workspace): Usuario A   ← gobierna la oficina
└── Proyecto "Manejo integral San José"
      ├── propietario (proyecto): Usuario B   ← dueño del encargo
      ├── profesional_responsable: Usuario C  ← ejecuta lo técnico
      └── cliente: Usuario D                  ← quien contrata
```

| Rol | Implica |
|---|---|
| Propietario del **workspace** | lectura completa de proyectos anclados (decisión EP-4C); gobierno del equipo/oficina; **no** implica participación ni escritura en el proyecto |
| Propietario del **proyecto** | máxima autoridad *dentro* del encargo: gestión de participantes, estados, entregables, cierre |
| `profesional_responsable` | dirección técnica del trabajo: actividades, programas, resultados; gestión operativa de participantes — sin facultad de transferir propiedad |
| `cliente` | lectura de lo compartido + aprobaciones; nunca gestión interna |

#### 13.4.1 Transferencia de propiedad del Proyecto (regla aprobada)

```text
PROPIETARIO                          PROFESIONAL RESPONSABLE
├── Gestión completa del proyecto    ├── Gestión operativa
├── Transfiere la propiedad          ├── Administra participantes
└── Tras transferir, puede seguir    ├── Modifica estructura/contenido
    como participante con otro rol   ├── Gestiona presupuesto
                                     ├── Cierra/archiva
                                     └── NO transfiere propiedad
```

- Solo el `propietario` actual puede **iniciar y ejecutar** una
  transferencia — nadie más (ni `profesional_responsable`) puede
  transferir ni retirar la propiedad.
- El propietario elige libremente al nuevo propietario entre
  participantes o usuarios — MELANTIA no impone criterios de
  elegibilidad (D-D1).
- Al confirmarse: el nuevo pasa a `propietario`; el anterior **deja de
  serlo** y conserva participación **solo si permanece con otro rol**.
- La transferencia no altera automáticamente perfil profesional, rol
  profesional ni relación con el workspace; **no transfiere** la
  propiedad del workspace.
- El propietario **no puede ser removido** por otro participante — la
  única vía para dejar de ser propietario es la transferencia iniciada
  y confirmada por él mismo (D-D3 ajustada).
- Auditoría obligatoria (cuando exista `shared/audit`): propietario
  anterior, nuevo propietario, fecha/hora, ejecutor, proyecto.

### 13.5 Matriz de permisos propuesta (rol de proyecto)

| Operación | prop. ws* | prop. proy | prof_resp | cliente | colab | tecnico | auditor |
|---|---|---|---|---|---|---|---|
| Ver proyecto | R | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver participantes | R | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Agregar/retirar participante | — | ✅ | ✅ | — | — | — | — |
| Cambiar rol de participante | — | ✅ | ✅ | — | — | — | — |
| Editar datos del proyecto | — | ✅ | ✅ | — | — | — | — |
| Definir/modificar objetivo | — | ✅ | ✅ | — | — | — | — |
| Cambiar estado | — | ✅ | ✅ | — | — | — | — |
| Crear/editar actividad | — | ✅ | ✅ | — | ✅ propia | ✅ asignada | — |
| Crear/editar programa | — | ✅ | ✅ | — | — | — | — |
| Crear visita | — | ✅ | ✅ | — | ✅ | ✅ asignada | — |
| Registrar resultados/evidencias | — | ✅ | ✅ | — | ✅ propia | ✅ asignada | — |
| Consultar resultados | R | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gestionar presupuesto | — | ✅ | ✅ | consolidado ✅ | — | — | — |
| Crear propuesta técnica | — | ✅ | ✅ | — | — | — | — |
| Documentos/evidencias | R | ✅ | ✅ | compartidos | ✅ | ✅ | ✅ solo lectura |
| Cerrar proyecto | — | ✅ | ✅ | — | — | — | — |
| Archivar proyecto | — | ✅ | ✅ | — | — | — | — |

`prop. ws*` = propietario del workspace ancla — acceso de **lectura
completa** aprobado (EP-4C); no escritura ni gestión dentro del
proyecto salvo que además sea participante. **No** se extiende a
socio/administrador/trabajador — pendiente de matriz futura.

**`tecnico` resuelto (alcance formalizado 2026-09-30):** ejecuta
actividades asignadas, gestiona visitas asignadas, registra resultados
y evidencias correspondientes, y trabaja sobre los recursos/contenidos
que tenga autorizados. **No puede:** administrar participantes,
cambiar roles, transferir ni modificar la propiedad del Proyecto,
cerrarlo ni archivarlo. La autorización detallada sobre recursos
vinculados es diseño de EP-4E (D-D7 ✅).
`cliente` ya resuelto: ve el consolidado/oferta del presupuesto, no el
desglose interno (D-D6 ✅) — sin costos internos, márgenes, reparto ni
estructura interna de costos.
Nota terminológica (D-D5): en EP-4D no se usa el término "gestor" —
la gestión del proyecto pertenece explícitamente a `propietario` y
`profesional_responsable`.
Nota de autoridad (D-D1 refinada): la matriz muestra la **capacidad
operativa de registro**; la decisión de incorporar corresponde al
`propietario`, que podrá requerir la venia del `profesional_responsable`
cuando la participación implique responsabilidad técnica — MELANTIA
registra esa decisión, nunca la impone (§13.3.1).

### 13.6 Herencia Workspace → Proyecto

```text
Visibilidad:   propietario ws → ve proyectos anclados (completo)
Lectura:       propietario ws → sí; resto del ws → solo por participación
Edición:       nunca heredada — exige rol de proyecto
Administración del proyecto: solo `propietario` y
`profesional_responsable` del proyecto (D-D5 ✅)
Participación: nunca heredada — se otorga proyecto a proyecto
```

### 13.7 Estados del proyecto y participación

`archivado` (D-C4, terminal) implica: solo lectura histórica; sin
nuevos participantes, retiros, actividades, presupuesto ni documentos
nuevos. `cerrado` congela la ejecución pero conserva consulta y
custodia de entregables. `en_pausa` suspende modificaciones operativas;
la gestión sigue disponible para `propietario` y
`profesional_responsable`.

### 13.8 Seguridad y aislamiento

- Participante ajeno → 404 (el proyecto es indistinguible de
  inexistente — como en EP-4A/4B).
- El `rol` se verifica **server-side en cada operación sensible**;
  nunca se confía en el frontend ni en `usuario_id` del request.
- Identidad: solo `get_current_user` (JWT). El participante referenciado
  (`usuario_id` al incorporar) es dato, nunca autoridad.
- Acceso al proyecto ≠ acceso irrestricto a los recursos vinculados:
  `ep_proyecto_*` enlaza, pero la política fina sobre cada recurso
  (¿quién del proyecto puede abrir la finca?) es diseño futuro de EP-4E.

### 13.9 Ciclo de vida de la participación — contrato y aceptación

```text
Nomenclatura conceptual (D-D2 refinada 2026-09-30):

  CONTRATO / ACUERDO ──→ PENDIENTE ──→ ACEPTADO ──→ ACTIVO
  (propuesta del                                          │
   propietario)                                           ▼
                                                      REMOVIDO
                                        (reactivación → ACTIVO)

DDL físico (sin cambios):   invitado → activo → removido → (reactivación) activo
```

En un entorno profesional, "invitación" resulta demasiado informal: la
relación se modela como **incorporación propuesta/contractual pendiente
de aceptación**. Desde ya, el estado físico `invitado` se interpreta
con ese significado; el renombrado físico del CHECK
(`contrato_pendiente`, `pendiente_aceptacion` u otro) es una decisión
técnica posterior que podría requerir DDL — se decide en la primera
migración EP (evaluar también si `workspace_miembros` adopta la misma
nomenclatura).

**Qué registra la plataforma** de cada incorporación:

- quién propone/incorpora (`asignado_por` — ya existe en el DDL);
- a quién se dirige (`usuario_id`) y en qué proyecto (`proyecto_id`);
- rol acordado (`rol`);
- condiciones registradas y evidencias/documentos asociados (entidad
  futura — hoy solo existe la fila de participación);
- fecha de propuesta (`created_at`), aceptación y fecha de aceptación
  (hoy implícita en la transición `invitado→activo`; timestamp dedicado
  = evolución opcional ya catalogada en §13.13);
- estado e historial de la participación.

**MELANTIA no actúa como autoridad contractual**: no asume que todo
acuerdo registrado sea jurídicamente válido. La validez jurídica
depende de las partes y de la legislación aplicable — la plataforma
registra la relación y su trazabilidad, nada más.

- `removido` preserva historial y bloquea acceso inmediatamente.
- Reactivación = UPDATE de la misma fila (D-C0 aprobado) — ejecutada
  por `propietario` o `profesional_responsable`; propuesta
  `removido→activo` directo sin re-aceptación (D-D4 ⏳).
- Estado `rechazado` (incorporación declinada) no existe en el CHECK —
  evolución futura si se necesita; hoy el declinado puede registrarse
  como `removido` o permanecer `invitado` (pendiente de aceptación)
  sin efecto.

### 13.10 Auditoría futura (shared/audit — no implementado)

Eventos a auditar cuando exista `shared/audit` (ADM-2):
`participante.agregado`, `participante.removido`, `participante.
reactivado`, `rol.cambiado`, `propietario.transferido` (anterior,
nuevo, ejecutor, fecha — §13.4.1), `estado.cambiado`,
`proyecto.creado/cerrado/archivado`. Modelo conceptual únicamente.

### 13.11 Entitlements

Capacidad de equipos/plazas nunca se escribe en EP — regla EP-4C
mantenida. Los límites se resuelven contra B5 en el service, sin
`if miembros >= N` en el módulo.

### 13.12 Cliente — dos sentidos

(A) **Cliente como entidad de cartera** — `clientes_profesionales`
futuro: identidad del cliente reutilizable en N proyectos/visitas;
clasificación flexible privada del profesional.
(B) **Cliente como rol** — `rol='cliente'` en
`ep_proyecto_participantes`: la participación dentro de un encargo.
La tabla física de cartera NO se diseña en EP-4D.

### 13.13 Limitaciones del DDL detectadas (evolución documentada)

| Limitación | Impacto | Resolución |
|---|---|---|
| Sin estado `rechazado` | una incorporación declinada queda como `invitado` (pendiente de aceptación) o `removido` prematuro | evolución futura del CHECK si se requiere |
| `UNIQUE` impide multi-rol | un usuario con dos funciones (ej. cliente+colaborador) no es representable | decisión pendiente §10 |
| Sin `updated_at` en participantes | cambios de rol/estado no dejan timestamp de modificación | `audit_eventos` cubrirá trazabilidad; columna = evolución opcional |
| `workspace_miembros` sin `administrador` | ya registrado §12.9 | depende de B5 |

### 13.14 Decisiones de EP-4D — estado al 2026-09-30 (cierre documental)

Todas aprobadas. D-D1/D-D2 con redacción del usuario refinada; D-D3…
D-D7 cerradas en el cierre documental del 2026-09-30.

| # | Decisión | Propuesta |
|---|---|---|
| D-D1 | **Autoridad para incorporar participantes** — la incorporación es decisión del `propietario` del Proyecto; cuando la naturaleza del trabajo implique responsabilidad o intervención técnica, el propietario podrá requerir la venia del `profesional_responsable`. **MELANTIA no establece requisitos profesionales para autorizar o impedir la participación en ningún rol** — única exigencia física: usuario registrado; la plataforma registra identidad, relación, rol, estado y trazabilidad, sin sustituir ni imponer criterios de cualificación (§13.3.1) | **✅ aprobada y refinada** (redacción del usuario, 2026-09-30 — sustituye la versión "sin condicionantes de elegibilidad" del 2026-09-29; renombrada de "requisitos para ser participante") |
| D-D2 | Incorporación modelada como **contrato/acuerdo → pendiente → aceptado → activo**: propuesta del propietario + aceptación del usuario. La plataforma registra proponente, destinatario, proyecto, rol, condiciones, fechas, estado, historial y evidencias/documentos asociados — **sin actuar como autoridad contractual** (la validez jurídica pertenece a las partes y a la legislación aplicable). El DDL conserva `invitado → activo`, reinterpretado como *incorporación pendiente de aceptación*; el renombrado físico del CHECK es decisión posterior que podría requerir DDL | **✅ aprobada y refinada** (redacción del usuario, 2026-09-30 — amplía la opción A del 2026-09-29) |
| D-D3 | Retiro = `removido` con revocación inmediata + historial conservado; **el `propietario` no es removible — su única vía de salida es la transferencia de propiedad iniciada y confirmada por él mismo** (§13.4.1, operación distinta de retirar/reactivar participantes) | **✅ aprobada** (cierre documental 2026-09-30) |
| D-D4 | Reactivación `removido→activo` por `propietario`/`profesional_responsable`, sin re-aceptación | **✅ aprobada** (cierre documental 2026-09-30) |
| D-D5 | **`propietario` y `profesional_responsable` son los dos roles con capacidad de gestión del proyecto** — ambos administran participantes, estructura, contenido operativo, actividades/programas/visitas/resultados/presupuesto y las transiciones de cierre/archivado; `profesional_responsable` no adquiere propiedad ni autoridad sobre el workspace; **la transferencia de propiedad es facultad exclusiva del `propietario`** — regla completa en §13.4.1. Terminología: "gestión del proyecto" = explícitamente estos dos roles | **✅ aprobada** (redacción del usuario, 2026-09-29) |
| D-D6 | `cliente` ve el **consolidado/oferta** del presupuesto; el desglose interno (costos, márgenes) es solo de `propietario`/`profesional_responsable` | **✅ aprobada** (2026-09-29) |
| D-D7 | **Aislamiento de recursos vinculados** — la participación en un Proyecto NO concede automáticamente acceso completo al recurso origen: el vínculo `ep_proyecto_*` permite referencia contextual, pero no transfiere propiedad ni concede acceso general al módulo de origen. La matriz `rol de proyecto × tipo de recurso × nivel de acceso` es diseño de EP-4E | **✅ aprobada** (cierre documental 2026-09-30) |

### 13.15 Recomendación de intervención profesional (principio aprobado 2026-09-30)

MELANTIA **no impone** al propietario la contratación o incorporación
de un profesional. Sin embargo, MELANTIA/IA puede detectar necesidades
de conocimiento especializado dentro del Proyecto y **recomendar** la
intervención de un profesional — siempre de forma contextual al
Proyecto, actividad, fase, incidencia o riesgo.

Ejemplos de necesidades recomendables: poda especializada (cacao),
plagas o enfermedades, recuperación de suelos, mejoramiento de
cultivos, diseño de viveros, diseño de invernaderos, sistemas de
riego, levantamientos topográficos, construcciones, procesos
judiciales, actividades veterinarias y otras necesidades técnicas
específicas.

- La recomendación **no equivale a obligación** impuesta por MELANTIA.
- Cuando existan obligaciones legales o regulatorias externas,
  MELANTIA puede **advertir** que el usuario verifique los requisitos
  aplicables — sin inventar ni declarar como obligatorio algo que no
  esté sustentado.

> **Principio: MELANTIA puede recomendar. El propietario decide.**

### 13.16 Directorio futuro de profesionales y plan para profesionales (capacidad futura — NO EP-4D)

Capacidad registrada, **sin implementación en EP-4D**:

- MELANTIA podrá construir progresivamente una **base/directorio de
  profesionales** que decidan participar en la plataforma.
  Información potencial: identidad, especialidades, Perfil
  Profesional, ubicación, zona de cobertura, disponibilidad, medios
  de contacto, estado del plan, historial de participación permitido
  y otras capacidades que se definan posteriormente.
- La recomendación de profesionales considerará, entre otros:
  especialidad requerida, ubicación del Proyecto/productor, zona de
  cobertura, disponibilidad y **estado activo del plan profesional
  del especialista**.
- **Concepto comercial futuro — plan para profesionales ($12, nombre
  comercial no definitivo):** los profesionales que quieran recibir
  notificaciones/oportunidades dentro de MELANTIA deberán disponer de
  ese plan activo, sujeto al diseño comercial definitivo. Objetivo:
  aparecer como profesional disponible, recibir notificaciones y
  oportunidades compatibles con sus especialidades, gestionar
  disponibilidad/cobertura y recibir solicitudes de contacto.
- **No implementar ahora** pagos, suscripciones ni notificaciones
  nuevas.

### 13.17 Contacto, contratación y pago — evolución futura (fuera de EP-4D)

El acuerdo profesional, el precio y la prestación del servicio
pertenecen inicialmente a **las partes**; MELANTIA no interviene como
parte contractual por defecto. Dependiendo del número de profesionales
participantes y de la evolución del Ecosistema, podrá diseñarse
posteriormente un servicio específico de: solicitud de servicios,
contratación, cotización, pagos, seguimiento, reputación, comprobación
de prestación y otros servicios profesionales. **Todo fuera de EP-4D.**

### 13.18 Informe de redacción — refinamiento y cierre 2026-09-30

Qué cambió respecto a la versión del 2026-09-29 y por qué:

| Cambio | Antes | Después | Motivo |
|---|---|---|---|
| D-D1 | "La App no impone condicionantes de elegibilidad" | **"Autoridad para incorporar participantes"** (§13.3.1) | MELANTIA no decide quién está cualificado: la decisión es del propietario del proyecto, con venia opcional del `profesional_responsable` registrada — nunca impuesta — cuando la participación implique responsabilidad técnica |
| Requisito de perfil | implícito por rol | **Ningún rol exige perfil profesional** (tabla §13.3.1) | El perfil (EP-4A) es información declarada/verificada del ecosistema, no barrera de acceso |
| D-D2 | "contrato → aceptado" como lenguaje | **`contrato/acuerdo → pendiente → aceptado → activo`** + lista explícita de datos registrados (§13.9) | "Invitación" es informal para relaciones profesionales; MELANTIA registra la relación **sin actuar como autoridad contractual** |
| `invitado` (DDL) | valor pendiente de renombrar | **reinterpretado** como *incorporación pendiente de aceptación*; renombrado físico = decisión técnica posterior con migración | permite adoptar el concepto ya, sin tocar el CHECK |
| D-C1 | "proyecto sin workspace exige ≥1 perfil profesional (`tiene_perfil`)" | **Plan Profesional vigente habilita el acceso EP; Perfil Profesional nunca es condición** (§12.11, §13.1) | resuelve la tensión con D-D1: gate comercial (suscripción), nunca gate de cualificación |
| D-D3/D-D4 | ⏳ | **✅ aprobadas** (retiro = revocación inmediata + historial; reactivación `removido→activo` sin re-aceptación) | cierre documental |
| D-D7 | remitida a EP-4E | **✅ aprobada** — participación ≠ acceso al recurso origen; matriz rol×recurso×nivel en EP-4E | cierre documental |
| `tecnico` | alcance ⏳ | **formalizado** (§13.5): ejecuta actividades/visitas asignadas, registra resultados/evidencias; sin gestión de participantes, roles, propiedad ni cierre | cierre documental |
| Nuevo | — | §13.15 recomendación de intervención profesional (*MELANTIA recomienda, el propietario decide*); §13.16 directorio futuro + plan profesionales $12; §13.17 contacto/contratación/pago = evolución fuera de EP-4D | cierre documental |

**Estado final de decisiones (2026-09-30):** D-D1 ✅ refinada,
D-D2 ✅ refinada, D-D3 ✅, D-D4 ✅, D-D5 ✅, D-D6 ✅, D-D7 ✅.
D-C1 ✅ corregida. Sin cambios de código, SQL ni DDL.
**Siguiente fase: EP-4E** — autorización detallada de recursos
vinculados (matriz rol × recurso × nivel de acceso).

---
