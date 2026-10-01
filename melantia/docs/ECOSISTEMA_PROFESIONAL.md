# MELANTIA — ECOSISTEMA PROFESIONAL · Diseño Arquitectónico

**Fecha:** 2026-09-29
**Estado:** DISEÑO CONCEPTUAL — nada implementado, nada modificado en
BD, código, API ni frontend. Documento de arquitectura previo al modelo
de datos.

> **Nota de terminología (2026-09-29):** este documento era
> `docs/PROYECTO_PROFESIONAL.md`. La capa transversal se denomina ahora
> **Ecosistema Profesional (EP)**; la unidad concreta de trabajo dentro
> de ella se denomina simplemente **Proyecto**. Los *proyectos
> estratégicos del M6* son un concepto distinto, siempre calificado.

**Fuente:** este documento responde a los pendientes de diseño
arquitectónico declarados en `MELANTIA_PROJECT_MASTER_FULL.md` §40
(modelo conceptual, relaciones, participantes/permisos, actividades y
entregables, integraciones con Agenda/Evidencias/Levantamientos/Informes,
Workspace y experiencia adaptativa) y aplica los principios
de evolución del ecosistema (§39).

> **Regla rectora de este documento:** una decisión conceptual no se
> convierte aquí en una decisión de base de datos. Ninguna entidad,
> relación o flujo descrito implica todavía tabla, columna ni endpoint.

---

## 1. Objetivo

Definir arquitectónicamente el **Ecosistema Profesional**: la capa
transversal de trabajo profesional dentro de MELANTIA, capaz de agrupar
— sin duplicar — los recursos ya existentes (fincas, lotes,
levantamientos, mediciones, evidencias, documentos, trazabilidad,
usuarios) y de servir de puente entre la captura de campo (móvil,
offline-first) y el procesamiento de oficina (Web).

## 2. Terminología definitiva

Cuatro niveles que no deben confundirse:

```text
MELANTIA
   └── ECOSISTEMA PROFESIONAL (EP)        ← capa transversal profesional
         └── Workspace                   ← la oficina (permanente)
               └── Proyecto              ← unidad de trabajo (finita)
                     └── Participantes con rol de proyecto
```

| Concepto | Qué es | Ejemplo |
|---|---|---|
| **Ecosistema Profesional (EP)** | La capa transversal que reúne perfiles, workspaces, proyectos, agenda profesional e integraciones | toda la práctica profesional de MELANTIA |
| **Workspace** | La "oficina": contenedor permanente de proyectos, equipo y configuración de una práctica profesional | "Oficina Agronómica López" |
| **Proyecto** | La unidad concreta de trabajo dentro del EP: encargo con cliente, alcance, estado, actividades, entregables | "Levantamiento Finca El Carmen" |
| **Perfil profesional** | Atributo identitario de un `usuario` (multi-perfil) | "agrónomo", "abogado" |
| **Rol de proyecto** | Función del usuario *dentro de un proyecto* concreto | "profesional responsable" |

**Distinción obligatoria:**

```text
ECOSISTEMA PROFESIONAL → Workspace → Proyecto   (trabajo profesional)
                ≠
Proyectos estratégicos (M6)                     (impacto rural — dominio distinto)
                ≠
Administración MELANTIA                         (operación de plataforma — eje separado)
```

- Un **Proyecto** (EP) es un encargo profesional; un **proyecto
  estratégico (M6)** es una iniciativa de impacto de la plataforma
  (Master FULL §12, §36.3). Comparten palabra, no concepto.
- "Administración MELANTIA" no forma parte del EP — lo supervisa desde
  su propio eje (`docs/ADMINISTRACION.md`).

## 2.5 Semántica de trabajo: coordinación vs ejecución

Antes de EP-4C se fija el vocabulario de trabajo para no mezclar la
**capa organizacional** (EP) con el **dominio agronómico** (módulos de
campo). Son dos mundos que se tocan solo por referencia:

```text
ORGANIZACIONAL (EP)                    AGRONÓMICO / ESPACIAL (módulos)
─────────────────────────              ──────────────────────────────
Workspace (oficina)                    Finca (predio — propiedad legal)
  └── Proyecto (encargo finito)          └── Lote (parcela física)
        ├── Participantes                      └── Unidad de Gestión /
        ├── Vínculos → recursos                      Sector/Área (zona
        ├── Actividades ──────referencia──▶            homogénea de manejo)
        │    (coordinación)                            └── Operación de campo
        └── Entregables                                (ejecución real:
Agenda (ocurrencias en el tiempo)                       riego, poda, muestreo…)
```

| Término | Mundo | Qué es | Qué NO es |
|---|---|---|---|
| **Proyecto** | EP | Contenedor general de trabajo: objetivo, cliente, participantes, vínculos, entregables | una actividad, ni una operación, ni un lote |
| **Actividad** | EP | Ítem de trabajo coordinado dentro de un contexto (`actividades.contexto_tipo`): "levantar polígono", "entregar informe" — con responsable, estado y fecha objetivo | ejecución agronómica, ni ocurrencia en agenda |
| **Evento de agenda** | EP (transversal) | Ocupación temporal de alguien (`agenda_eventos`): cuándo/dónde ocurre algo | la actividad misma — un evento puede vincularse a una (`actividad_id`) |
| **Unidad de Gestión (UG)** | campo | Zona homogénea de manejo agronómico dentro de un lote (o el lote entero si no se subdivide): donde se ejecuta el manejo | contenedor de trabajo, ni propiedad |
| **Área / Sector** | campo | Subdivisión o etiqueta espacial descriptiva de lote/UG ("sector norte", "zona baja") | unidad organizacional |
| **Operación** | campo | Ejecución agronómica real sobre una UG: fertilización, riego, muestreo, cosecha — registrada con fecha, insumos, resultado | ítem de coordinación EP |

**Reglas para evitar colisiones futuras:**

1. **Proyecto coordina, no ejecuta.** El trabajo físico real se
   registra como Operación en el módulo de campo; el Proyecto solo lo
   organiza y referencia.
2. **Actividad coordina una operación, no la es.** Una Actividad EP
   ("supervisar riego sector norte") puede apuntar a una Operación
   registrada en campo, pero el registro de ejecución vive en su
   módulo — el EP nunca lo duplica (§21).
3. **"Operación" siempre calificada.** `feria_operaciones` ya existe
   en el dominio comercial (transacción de feria). En campo se dirá
   *operación agronómica / de campo* — nunca "operación" a secas.
4. **"Sector" siempre calificado.** `usuarios.sector_comunidad` es el
   sector geográfico-comunitario del usuario; el sector de un lote es
   *sector agronómico* — palabra distinta, dominio distinto.
5. **UG/Área/Sector viven en el dominio espacial** (junto a
   fincas/lotes si el modelo físico los llega a necesitar). El EP los
   alcanza exclusivamente por vínculos — nunca como tablas `ep_*`.
6. **Un Proyecto ≠ un conjunto de Actividades.** El proyecto tiene
   identidad propia (cliente, estado, entregables) aunque aún no tenga
   actividades; y una actividad puede existir sin proyecto
   (`contexto_tipo='general'`).

Ejemplo completo:

```text
Workspace "Oficina Agronómica Andrade"
  └── Proyecto "Plan de manejo Finca El Carmen 2026"
        ├── Participantes: cliente (dueño), profesional responsable
        ├── Vínculos → finca, lote 3, levantamiento norte
        ├── Actividad "Muestreo de suelo" (fecha_objetivo)
        │     └── referencia → Operación de campo "muestreo 12 puntos"
        │            ejecutada sobre UG "sector norte, lote 3"
        └── Entregable → informe de suelos
```

## 3. Problema que resuelve

Hoy las entidades de MELANTIA responden al **productor propietario de
los datos** (`usuario_id` como dueño). Un profesional (agrónomo,
topógrafo, veterinario, abogado…) que trabaja *para* un cliente necesita:

1. Agrupar recursos dispersos de uno o varios usuarios/fincas bajo un
   encargo concreto con inicio, estado y entregables.
2. Compartir acceso a recursos específicos **sin ceder la propiedad**
   del dato ni abrir todo el universo del cliente.
3. Coordinar participantes (cliente, profesional, colaboradores,
   auditores) con permisos diferenciados.
4. Mantener la cadena: captura de campo → procesamiento → informe →
   entregable, con trazabilidad entrada→resultado.
5. Hacerlo sin crear una segunda versión de Finca, Lote, Levantamiento
   ni Evidencia.

Sin el **Ecosistema Profesional**, cada profesión terminaría generando
sus propias tablas paralelas — exactamente el anti-patrón que el Master
§27 prohíbe.

## 4. Definición

> El **Proyecto** es la unidad del Ecosistema Profesional: una **capa de
> organización y contexto** que relaciona recursos existentes del
> ecosistema bajo un encargo profesional concreto: tiene cliente,
> participantes, alcance, estado, actividades y entregables — pero **no
> posee ni duplica los datos de dominio** que referencia.

```text
PROYECTO                                (unidad organizativa del EP)
        │
        ├── Finca existente ────────────┐
        │      └── Lote existente       │  referencias,
        ├── Levantamiento existente     │  no copias
        │      └── Mediciones existentes│
        ├── Evidencias existentes       │
        ├── Documentos existentes ──────┘
        │
        ├── Participantes (usuarios + rol en ESTE proyecto)
        ├── Actividades / eventos de agenda
        ├── Procesamientos (trabajo de oficina)
        ├── Entregables (informes, planos, documentos generados)
        └── Historial / auditoría del proyecto
```

### Regla de no duplicación

El Proyecto **referencia**; no contiene una segunda fuente de verdad:

| NO se crea | Porque ya existe |
|---|---|
| `ProyectoFinca` | `fincas` (M3) |
| `ProyectoLote` | `lotes` (M3) |
| `ProyectoLevantamiento` | `levantamientos` + `mediciones_campo` (M2) |
| `ProyectoEvidencia` | `evidencias_documentos` (M11) |
| `ProyectoDocumento` | M11 custodia |
| `ProyectoUsuario`/`Profesional` duplicado | `usuarios` (auth) |

Un recurso puede pertenecer a **varios proyectos** a lo largo del tiempo
(una finca es objeto de un levantamiento topográfico hoy y de una
certificación de carbono en 2 años): la asociación proyecto↔recurso es
una **relación**, no una propiedad del recurso.

## 5. Principios arquitectónicos

1. **Capa, no silo.** El Proyecto organiza; no almacena datos de dominio.
2. **Propiedad inmutable del dato.** El recurso sigue perteneciendo a su
   usuario dueño; el proyecto otorga *acceso contextual*, no propiedad.
3. **Sin `proyecto_id` impuesto.** La vinculación es una decisión del
   modelo de datos posterior (ver §19 D1) — conceptualmente es una
   relación n:n con metadatos (quién la creó, cuándo, con qué papel).
4. **Offline-first heredado.** Lo capturable en campo debe funcionar sin
   red y sincronizar; el EP no rompe el modelo sync existente.
5. **Datos originales intocables.** Coherente con Master §3.2/§18 y con
   lo ya implementado en levantamientos (vértices originales +
   `area_m2` derivado separado).
6. **Multi-profesión por diseño.** Una sola arquitectura; la diferencia
   entre profesiones es configuración (tipo de proyecto, workspace,
   permisos), no código nuevo por profesión (Master FULL §36.4: la
   interfaz se adapta al perfil, el backend es común; §36.6: la
   complejidad reside en el motor, no en la interfaz).
7. **Idempotencia y auditoría.** Toda acción relevante del proyecto es
   auditable (Master §19).
8. **Sin precisión prometida.** El proyecto no presenta capturas de GPS
   de teléfono como levantamientos catastrales/topográficos de alta
   precisión; cuando el entregable lo requiera, se declara la fuente e
   instrumentación (Master FULL §39.10). Esto afecta el etiquetado de
   entregables, no el almacenamiento.
9. **Separación captura/procesamiento.** El móvil captura; Web/backend
   procesa lo pesado (Master FULL §39.9).

## 6. Clasificación del árbol conceptual

Del árbol conceptual del Proyecto (unidad del EP), cada elemento se
clasifica:

| Elemento | Naturaleza | Destino conceptual |
|---|---|---|
| Cliente | **Rol de participante** sobre `usuarios` | no entidad nueva |
| Profesionales | Rol + perfil profesional de `usuarios` | catálogo de profesiones + asignación |
| Participantes | **Relación** usuario↔proyecto con rol | entidad de membresía (única nueva segura) |
| Ubicación | Dato derivado (de finca/lote/puntos) | no entidad propia |
| Finca / Lote | **Referencia** a M3 | relación n:n |
| Levantamientos / Mediciones | Referencia a M2 (`levantamientos`, `mediciones_campo`) | relación n:n |
| Fotografías / Evidencias / Documentos | Referencia a M11 | relación n:n |
| Archivos GIS / Drones / Procesamientos | **Capacidad futura** (Fases D–F geo, 24+ meses) | referencia cuando exista la entidad |
| Actividades | **Entidad futura** (`actividad`) — agenda aún no existe | diseño §9 |
| Agenda | **Servicio transversal futuro** — no existe hoy | diseño §9 |
| Informes / Entregables | **Dato derivado** custodiado por M11 + registro en proyecto | relación + custodia |
| Historial | **Registro de auditoría** del proyecto | evento/log, no dato de dominio |

### Entidades conceptuales nuevas (mínimas)

Solo tres conceptos parecen requerir existencia propia en la unidad
Proyecto (a nivel EP ya figuran Workspace y Perfil profesional, §2):

1. **`Proyecto`** — el contenedor organizativo.
2. **`Participación`** — la membresía usuario↔proyecto con rol (sin ella
   no hay permisos granulares).
3. **`Actividad`** — unidad de trabajo planificable (visita, muestreo,
   entrega) que alimenta la Agenda futura.

Todo lo demás del árbol es relación, servicio, referencia o derivado.
*Esto es conceptual: su conversión a tablas es fase posterior.*

## 7. Relaciones conceptuales

```text
usuarios ──(participación + rol)──► proyecto ◄──(referencia n:n)──► fincas
                                    │                            lotes
                                    │                            levantamientos
                                    │                            evidencias_documentos
                                    │                            trazabilidades
                                    │                            (futuro: archivos GIS,
                                    │                             procesamientos, actividades)
                                    ▼
                     entregables ──► custodia M11 (hash/versiones)
```

- Un proyecto pertenece a un **Workspace** (§8) y tiene un cliente.
- Un recurso referenciado mantiene su `usuario_id` propietario; la
  referencia no transfiere propiedad ni rompe el aislamiento actual.
- Desreferenciar un recurso del proyecto no lo elimina (solo corta la
  relación); eliminar el recurso original corta las referencias.

## 8. Campo → Oficina

```text
CAMPO (móvil — offline-first)
  Captura GPS / fotos / mediciones / observaciones / levantamiento
        │
        ▼  datos originales — inmutables
  Cola de sincronización (Wi-Fi preferente, datos móviles con permiso)
        │
        ▼
API → PostgreSQL (recursos + vínculo al proyecto)
        │
        ▼
OFICINA (Web)
  Procesamiento: geodesia, GIS, planos, MDT/MDS, ortomosaico (futuro)
        │
        ▼  datos derivados — versionados, con linaje a la entrada
  Informe → Entregable (custodia M11) → Cliente
```

**Desde el principio (ya existe o diseño inmediato):** captura GPS,
levantamiento, evidencias, vínculo a proyecto, sync.

**Capacidades futuras:** procesamiento GIS pesado, planos, MDT/MDS,
ortomosaicos, informes automatizados — se montan como *servicios de
oficina* que leen recursos del proyecto y producen derivados.

## 9. Workspace

El Workspace es el contenedor permanente de la práctica profesional
dentro del EP — ver definiciones en §2.

```text
ECOSISTEMA PROFESIONAL
   └── Workspace (oficina profesional — puede ser unipersonal)
         ├── Miembros del workspace (equipo permanente)
         ├── Configuración por profesión (plantillas, vocabulario, tipos de proyecto)
         └── Proyectos
                └── Participantes por proyecto (pueden ser externos al workspace)
```

- **Perfil ≠ Rol:** el perfil declara *qué es* el usuario; el rol declara
  *qué hace* en este proyecto. Un usuario puede tener el perfil
  "productor" y el rol "cliente"; o el perfil "veterinario" y el rol
  "auditor del proyecto" en un proyecto concreto.
- **Experiencia adaptativa** (Master FULL §36.6): el mismo motor sirve
  tres niveles — productor (voz, pasos guiados, lenguaje sencillo),
  usuario general (formularios, mapas) y profesional (tablas, filtros,
  herramientas geoespaciales, proyectos, informes, exportaciones). El
  workspace/proyecto heredan esta regla: misma API, distinta
  presentación.
- **Workspace ≠ Proyecto:** el workspace es permanente (la firma); el
  proyecto es finito (el encargo).
- **Workspace ≠ Profesión:** una oficina puede albergar varias
  profesiones (estudio jurídico-ambiental); la profesión tipifica al
  usuario y condiciona la *experiencia* (UI, tipos de proyecto,
  plantillas de informe).
- **Un usuario puede tener varias profesiones y pertenecer a varios
  workspaces** — la interfaz se adapta por contexto activo, no por app
  distinta.
- El motor de datos y servicios es **común a todos los workspaces**;
  solo cambia la configuración/presentación.
- **Nombre mutable (EP-4C):** renombrar el workspace ("Oficina
  Agronómica Andrade" → "Oficina de Servicios de Fertilización
  Andrade") no crea otro workspace ni cambia el UUID — proyectos,
  miembros e historial permanecen. Soportado por `PATCH
  /ep/workspaces` (EP-4B).
- **Capacidad por plan (EP-4C):** el tamaño del equipo (propuesta base:
  1 fundador + 1 socio + 1 administrador + 2 trabajadores + puestos
  adicionales tarifados) es regla de **entitlements/suscripciones**,
  nunca hardcodeada en EP — ver B5 y EP_MODELO_DATOS §12.8.
- **Evolución futura del CHECK de roles:** el plan conceptual usa
  fundador/socio/administrador/trabajador; el DDL ejecutado solo admite
  `propietario/socio/colaborador` — añadir `administrador` es evolución
  documentada en EP_MODELO_DATOS §12.9, pendiente de B5.

## 10. Agenda y operaciones

No existe hoy ninguna entidad de agenda — diseño conceptual. La **Agenda
es un servicio transversal de plataforma** (Master FULL §37) al que el
EP aporta actividades:

```text
Proyecto
   └── Actividad (unidad de trabajo: visita, muestreo, audiencia,
        entrega, inspección, consulta veterinaria, retiro de carga…)
          └── Evento de Agenda (cuándo/dónde: fecha, ubicación,
               duración estimada, participantes requeridos)
                 └── Servicio de planificación (derivado):
                      ubicación → tiempo estimado de desplazamiento
                      → margen → hora recomendada de salida
                      → recordatorio
```

- **Actividad** es dato de dominio del proyecto (qué hay que hacer).
- **Agenda** es el servicio transversal que materializa ocurrencias
  temporales de actividades (o de eventos sueltos) — no pertenece al EP
  ni se duplica en él.
- El cálculo de ruta/salida es **dato derivado** del evento — se
  recalcula, no es original.
- Integración futura por voz ("MELANTIA, mañana voy a la finca del
  cliente…") → crea Actividad/Evento pendiente de confirmación. **No
  implementar ahora.**

## 11. Datos originales vs datos derivados

| Originales (campo — se conservan) | Derivados (oficina — se regeneran) |
|---|---|
| Coordenadas capturadas | Área, perímetro |
| Fotografías | Mapas, planos, miniaturas |
| Mediciones de sensores | Índices, modelos, curvas de nivel |
| Observaciones | Análisis, recomendaciones IA |
| Documentos/escaneos | Informes, entregables |
| Registros de campo | Resultados de procesamiento |

**Regla (ya vigente en el Master):**
`DATO ORIGINAL → PROCESAMIENTO → DATO DERIVADO`

- Nunca se sobrescribe el original; una corrección genera nueva versión.
- Todo derivado conserva **linaje**: qué entrada lo produjo, con qué
  proceso y cuándo (precedente real: `levantamientos` conserva vértices
  y guarda `area_m2` derivado — §17 de DB_MIGRATION_EXECUTION_PHASE1).
- En un proyecto, el entregable derivado (informe) referencia sus
  entradas originales → el cliente puede auditar el resultado.

## 12. Evidencias

M11 (`evidencias_documentos`) ya custodia hash SHA-256, integridad y
metadatos. En el proyecto:

- Las evidencias capturadas dentro de un encargo se **vinculan** al
  proyecto — siguen custodiadas por M11.
- La cadena de custodia del proyecto es la composición de: historial de
  participantes + registro de vínculos + versiones M11 + eventos de
  procesamiento.
- Un entregable descargable del proyecto debería poder llevar el sello
  de verificación de sus evidencias fuente.

## 13. Historial y auditoría

Modelo conceptual (no tablas aún):

```text
evento_proyecto
  ├── quién (usuario/participante)
  ├── cuándo (timestamp)
  ├── qué (tipo: creación, vínculo, cambio estado, entrega, permiso…)
  ├── sobre qué (proyecto / recurso referenciado / actividad)
  └── resultado / detalle
```

- Versiones: los recursos mantienen su versionado propio (M11); el
  proyecto versiona sus *estados* y sus entregables.
- Responsables: toda acción registra el participante que la ejecutó,
  aunque actúe sobre datos de otro usuario (cliente).
- Esta auditoría es la base de la futura facturación profesional y de
  la defensa técnica/legal del trabajo — y usará la infraestructura
  transversal `shared/audit/` (`docs/ADMINISTRACION.md` §4).

## 14. Roles y permisos

Permisos **por proyecto**, no por usuario global:

| Rol | Lectura | Escritura | Puede hacer |
|---|---|---|---|
| Propietario (del proyecto) | todo el proyecto | total | crear, cerrar, gestionar participantes, entregar |
| Cliente | recursos compartidos + entregables | observaciones, aprobaciones | ver avance, aprobar entregable |
| Profesional responsable | recursos del proyecto | captura + procesamiento | ejecutar el trabajo técnico |
| Colaborador | recursos asignados | captura en sus actividades | apoyar campo |
| Técnico | subset operativo | capturas concretas | levantamientos, mediciones |
| Auditor (del proyecto) | lectura + historial | nada | verificación, custodia — no confundir con auditor de plataforma (docs/ADMINISTRACION.md) |
| Administrador | plataforma | gestión | soporte, no contenido |

```text
Proyecto → Participantes → Rol → Permisos → Recursos
```

- **Regla clave:** ser miembro de un workspace no da acceso automático
  a los proyectos del workspace ni a los datos del cliente — la
  membresía es **por proyecto**.
- **Excepción aprobada (EP-4C):** el **propietario del workspace** ve la
  información completa de los proyectos anclados a su workspace. La
  excepción no se extiende a socios ni demás miembros — la matriz fina
  de permisos workspace/proyecto es diseño futuro (EP_MODELO_DATOS
  §12.7).
- El cliente ve solo lo que el proyecto le comparte — no toda la
  operación del profesional.
- Los permisos actuales (`usuarios` + `get_current_user` + aislamiento
  por `usuario_id`) siguen siendo la base; el proyecto añade un segundo
  nivel de autorización *contextual* — diseño posterior, no implementado.
- **Tercer eje separado:** el rol de proyecto es independiente del rol
  administrativo de plataforma — ver §17 y `docs/ADMINISTRACION.md` §3.

## 15. Offline-first

| Debe funcionar offline (móvil/campo) | Puede requerir conexión (web/oficina) |
|---|---|
| Ver proyecto y sus recursos previamente sincronizados | Crear/cerrar proyecto |
| Captura GPS, fotos, mediciones, observaciones | Gestión de participantes/permisos |
| Levantamientos completos (vértices) | Procesamiento pesado (GIS, MDT, informes) |
| Evidencias nuevas (a cola) | Verificación de hashes contra servidor |
| Consulta de agenda descargada | Planificación con cálculo de rutas |
| Marcar actividad ejecutada | Exportación/entrega final |

- La **cola de sync** transporta recursos con su vínculo de proyecto —
  el proyecto es *contexto de la cola*, no un obstáculo: una captura
  offline con `proyecto` asignado se encola igual que hoy.
- **Decisiones de conflicto:** las capturas originales tienen prioridad
  de conservación (Master §17); los vínculos/estados de proyecto son
  resolubles por reglas de servidor.
- **Implicación para el outbox futuro:** el payload de sincronización
  deberá declarar el contexto (proyecto) al que pertenece cada operación
  — el diseño del outbox debe reservar ese campo conceptual ya.

## 16. Integración con los módulos

| Módulo | Participación en un Proyecto del EP |
|---|---|
| M2 Asistente Técnico | **Fuente de recursos:** levantamientos, mediciones, geodesia, conocimiento |
| M3 Gestión de Fincas | **Objeto de trabajo:** fincas, lotes, hatos, trazabilidades referenciadas |
| M4 Negocios Rurales | Opcional: transacciones originadas en el encargo (prestación de servicio) |
| M6 Proyectos | **Concepto distinto:** los proyectos estratégicos de impacto del M6 conviven con el EP pero no se confunden con él (ver §2) |
| M7 Escuela de Campo | Referencia débil: capacitación del cliente como actividad |
| M8 Comunidad | Referencia débil: guías/trámites legales consumidos como servicio |
| M9 Salud | **No asociado por defecto** — datos personales de salud no entran al proyecto (privacidad) |
| M10 Servicios Financieros | Futuro: cobro/facturación del encargo profesional |
| M11 Evidencias | **Custodia:** evidencias vinculadas, documentos, entregables, hashes |
| M12 Finanzas Personales | **No asociado** — es personal del usuario, no del encargo |
| M1 Suscripciones | Gate: el plan profesional del usuario condiciona capacidades del workspace (entitlements, Master §10) |
| M5 Emprendimientos | Futuro — no evaluado |

## 16.5 Integración futura (24+ meses)

Todo lo futuro se conecta por el mismo mecanismo: **nueva entidad +
referencia al proyecto**.

```text
Drones (archivos) ──┐
Sensores/IoT ───────┤   entidad de dominio nueva
RTK/GNSS ───────────┤        │
Fotogrametría/MDT ──┼──► se custodia (M11 si es archivo)
Ortomosaicos ───────┤        │
Satelital/IA ───────┤        ▼
Gemelos digitales ──┘   se REFERENCIA al proyecto (n:n)
                              │
                              ▼
                    procesamiento → derivado con linaje
```

Nada de esto requiere cambiar el concepto: el proyecto es el punto de
unión entre captura heterogénea y entregable. Condición: respetar el
mismo ciclo original→procesamiento→derivado.

## 17. Relación con Administración MELANTIA

```text
Ecosistema Profesional   ≠   Administración MELANTIA
        │                          │
   capa de trabajo               operación del ecosistema
   profesional (workspaces,      (cuentas, soporte, flags,
   proyectos, entregables)        releases, supervisión)
```

Los dos ejes de rol no se mezclan:

```text
Perfil → Workspace → Proyecto → Rol de proyecto
        (Ecosistema Profesional — §2, §9, §14)

Administración → Rol administrativo
        (operación de plataforma — docs/ADMINISTRACION.md §3, §7)
```

- Un administrador puede **supervisar** proyectos con permisos
  administrativos; eso no lo convierte en participante del proyecto —
  no aparece en su lista de participantes ni obtiene derechos de
  trabajo sobre él.
- La lectura administrativa sobre contenido de un proyecto es acción
  auditada (docs/ADMINISTRACION.md §4.1), no acceso libre.
- El historial del proyecto (§13) y la auditoría administrativa
  comparten la misma infraestructura futura `shared/audit/` — misma
  tubería, distintas superficies de consulta.

## 18. Límites de esta fase

**No realizado, no autorizado, no implementado:**

- Ninguna tabla, columna, constraint ni índice nuevo.
- Ningún `proyecto_id` en tablas existentes.
- Ningún endpoint, router, service, repository, schema ni frontend.
- Ninguna modificación a auth, sync ni módulos existentes.
- Ninguna dependencia nueva.

## 19. Fases futuras de implementación (propuesta)

```text
EP-0  Diseño conceptual                      ✅ (este documento)
EP-1  Modelo de datos                        ✅ aprobado — docs/EP_MODELO_DATOS.md
EP-2  Integración con schema real            ✅ docs/EP_INTEGRACION.md
EP-3  DDL Ecosistema Profesional             ✅ ejecutado 2026-09-29 —
                                              13 tablas, 45 totales
                                              (docs/EP_DDL_REVISION.md §4)
```

Fases de implementación posteriores (renumeradas tras EP-3):

```text
EP-4A Identidad profesional                  ✅ 2026-09-29 — seed 6
                                              perfiles, /api/v1/ep/perfiles,
                                              114/114 pytest
EP-4B Workspaces                             ✅ 2026-09-29 — miembros,
                                              roles, invitación/aceptar,
                                              protección propietario;
                                              146/146 pytest
EP-4C Proyectos                              ⏳ rediseño conceptual —
                                              modelo de trabajo ampliado
                                              (visita puntual, programas,
                                              fases, presupuesto, clientes)
                                              en EP_MODELO_DATOS §12
EP-4D Participantes / roles de proyecto      ⏳ diseño documental —
                                              matriz permisos, ciclo
                                              conceptual contrato→
                                              pendiente→aceptado→activo
                                              (DDL invitado→activo→
                                              removido sin cambios),
                                              herencia ws→proyecto solo
                                              lectura-propietario;
                                              §13 modelo de datos —
                                              **cierre documental
                                              2026-09-30: D-D1…D-D7 ✅**
EP-4E Vínculos a recursos                    (fincas/lotes/levantamientos;
                                              evidencias/informes → B2)
EP-4F Actividades
EP-4G Agenda                                 (servicio transversal §10)
EP-5  Frontend workspace + proyecto          (web primero — oficina)
EP-6  Offline/outbox con contexto proyecto   (requiere outbox previo)
EP-7  Entregables + auditoría completa
```

## 20. Decisiones pendientes (explícitas)

> **2026-09-29:** todas fueron resueltas en `docs/EP_MODELO_DATOS.md`
> §1–§11 (aprobado EP-1, ejecutado EP-3). La tabla queda como registro
> histórico de las opciones evaluadas.

| # | Decisión | Opciones | Nota |
|---|---|---|---|
| D1 | **Mecanismo de vínculo** proyecto↔recursos | (a) `proyecto_id` por tabla — acopla y no permite n:n limpio; (b) **tabla de enlace central** `proyecto_recurso(tipo, id)` — polimórfica, flexible; (c) tabla de enlace por tipo — más FKs reales, más tablas | Recomendación conceptual: (b) o (c); decidir en EP-1 con trade-offs de integridad referencial |
| D2 | `Workspace` como entidad o como configuración | entidad propia vs flag en `usuarios` | probablemente entidad (tiene miembros y proyectos) |
| D3 | Profesión: catálogo cerrado vs tabla abierta | enum vs tabla `profesiones` | |
| D4 | `Actividad`/`Agenda` — entidades separadas o una | actividad + evento_agenda vs única | recomendado separar (trabajo vs ocurrencia); Agenda es servicio transversal §10 |
| D5 | Dónde vive el EP | módulo nuevo (p. ej. `ecosistema_profesional`) vs ampliar M6 `proyectos` | M6 es de impacto rural; probablemente módulo/contexto separado — ver §2 |
| D6 | Entitlements: qué plan habilita workspace/proyectos | reglas de M1 | |
| D7 | Eliminación: cerrar vs archivar proyecto | estados | |
| D8 | Nombre físico de la tabla unidad | `proyectos` puede colisionar conceptualmente con futuras tablas M6; opciones: prefijo de dominio (`ep_proyectos`) o schema dedicado | el nombre conceptual es `Proyecto`; el nombre físico se decide en EP-1 |
| D9 | Outbox: campo de contexto de proyecto en sync | payload con `proyecto` opcional | coordinar con Fase H geoespacial |

## 21. Reglas de no duplicación (resumen ejecutivo)

1. El Proyecto es **organización**, no datos.
2. No segunda versión de fincas/lotes/levantamientos/mediciones/
   evidencias/documentos/trazabilidad/usuarios/profesionales/agenda.
3. La pertenencia es una **relación** con metadatos, no una columna
   obligatoria en cada tabla.
4. La propiedad del dato (`usuario_id`) no se transfiere al proyecto.
5. Un recurso puede estar en varios proyectos; un proyecto usa muchos
   recursos.
6. Si mañana aparece una entidad nueva (dron, MDT), se integra por el
   mismo mecanismo de referencia — sin rediseñar el Proyecto.

---

**Fin del diseño conceptual.** Siguiente paso: aprobación del modelo de
datos propuesto en `docs/EP_MODELO_DATOS.md` → entonces DDL controlado.

---

> **Nota EP-4C (2026-09-29):** el modelo de trabajo se extendió — ver
> `docs/EP_MODELO_DATOS.md` §12. Resumen: el Proyecto sigue siendo el
> contenedor general de coordinación (§2.5), pero el trabajo profesional
> ya no exige Proyecto: la **Visita/Servicio puntual** existe sola y puede
> originar un Proyecto por referencia; el Proyecto puede contener
> **Programas** (entidad futura) con fases sugeridas por IA y aprobadas
> por el profesional; Presupuesto consolida actividad→programa→proyecto;
> el Cliente existe como cartera profesional (entidad futura) y como
> rol de proyecto — dos sentidos separados. Nada de esto está
> implementado ni altera el DDL ejecutado.
>
> **Nota EP-4D (2026-09-30, refinamiento — sustituye la nota del
> 2026-09-29):** participantes/roles/permisos del Proyecto diseñados en
> `EP_MODELO_DATOS.md` §13. Puntos clave: las tres dimensiones (perfil
> profesional / rol workspace / rol proyecto) no se mezclan; el
> propietario del workspace lee completo los proyectos anclados pero la
> escritura exige rol de proyecto; retirar revoca acceso de inmediato y
> conserva historial; acceso al proyecto no implica acceso irrestricto
> a los recursos vinculados (política fina = EP-4E).
>
> **D-D1 aprobada — "Autoridad para incorporar participantes"**
> (refinada 2026-09-30): la incorporación es **decisión del propietario
> del Proyecto**; cuando la naturaleza de la participación implique
> responsabilidad o intervención técnica, el propietario podrá requerir
> la aprobación o venia del `profesional_responsable`. **MELANTIA no
> establece requisitos profesionales** para autorizar o impedir la
> participación en ningún rol: el perfil profesional (EP-4A) informa,
> no bloquea. MELANTIA registra identidad, relación, rol, estado y
> trazabilidad — nunca impone criterios de cualificación.
>
> **D-D2 aprobada — "Contrato y aceptación"** (refinada 2026-09-30):
> "invitación" es demasiado informal en un entorno profesional; la
> incorporación se modela como `contrato/acuerdo → pendiente →
> aceptado → activo`. La plataforma registra proponente, destinatario,
> proyecto, rol, condiciones, fechas, estado, historial y evidencias/
> documentos — **sin actuar como autoridad contractual** (la validez
> jurídica pertenece a las partes y a la legislación aplicable). El
> **DDL no cambia**: `invitado` se reinterpreta como *incorporación
> pendiente de aceptación*; el renombrado físico del CHECK
> (`contrato_pendiente`, `pendiente_aceptacion` u otro) es decisión
> técnica posterior que podría requerir migración.
>
> D-D5 aprobada: `propietario` y `profesional_responsable` son los dos
> roles de gestión del proyecto (sin "gestor" genérico; transferencia
> de propiedad exclusiva del `propietario`). D-D6 aprobada: el
> `cliente` ve el consolidado del presupuesto, nunca costos/márgenes/
> reparto interno.
>
> **Cierre documental EP-4D (2026-09-30) — D-D1…D-D7 todas aprobadas:**
>
> - **Plan Profesional ≠ Perfil Profesional:** el acceso a las
>   capacidades EP lo habilita la suscripción vigente; el Perfil
>   Profesional es identidad/capacidad declarada, nunca condición para
>   crear/activar/propietariar/gestionar un Proyecto (D-C1 corregida).
> - **D-D3/D-D4 ✅:** retiro = `removido` con revocación inmediata +
>   historial; reactivación `removido→activo` sin re-aceptación.
> - **D-D7 ✅:** la participación no concede acceso completo al recurso
>   origen — la matriz rol × recurso × nivel es diseño de EP-4E.
> - **`tecnico` formalizado:** actividades/visitas asignadas, resultados
>   y evidencias; sin gestión de participantes, roles, propiedad ni
>   cierre.
> - **Recomendación de intervención profesional:** MELANTIA/IA puede
>   recomendar contextualmente; **nunca impone** — *MELANTIA recomienda,
>   el propietario decide*.
> - **Registrado como evolución futura (no EP-4D):** directorio de
>   profesionales, plan para profesionales ($12, nombre no definitivo)
>   y servicios de contacto/contratación/pago entre partes.
>
> Detalle completo, matriz de permisos por rol e informe de cierre en
> `docs/EP_MODELO_DATOS.md` §13 (§13.3.1 autoridad, §13.15–13.17
> principios/evolución, §13.18 informe de redacción).
> Nada implementado.
