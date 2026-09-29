# MELANTIA — ADMINISTRACIÓN GENERAL DEL ECOSISTEMA · Diseño Arquitectónico

**Fecha:** 2026-09-29
**Estado:** DISEÑO CONCEPTUAL — nada implementado, nada modificado en
BD, código, API ni frontend. Documento de arquitectura previo a
cualquier modelo de datos.

> **Regla rectora:** las decisiones de este documento son conceptuales.
> Ninguna estructura, rol o ruta descrita implica todavía tabla,
> columna, endpoint ni módulo funcional.

---

## 1. Administración como capa transversal

MELANTIA opera sobre **tres superficies** que comparten el mismo
backend:

```text
APP MÓVIL — CAMPO           captura offline, GPS, evidencias
APP WEB — OFICINA           gestión, informes, workspaces profesionales
ADMINISTRACIÓN — OPERACIÓN  operación y supervisión del ecosistema
```

```text
  APP MÓVIL ─┐
  APP WEB ───┼──> FASTAPI ──> PostgreSQL / Storage / Sync / Audit
  ADMIN ─────┘
```

**La Administración NO tiene backend independiente.** Usa el mismo
FastAPI, la misma base de datos PostgreSQL, el mismo almacenamiento, el
mismo motor de sincronización y la misma infraestructura de auditoría.

Lo que sí es independiente es su **superficie de autorización**
(§7) y su **responsabilidad**: la administración opera el ecosistema;
no ejecuta el trabajo de dominio de los módulos.

### Responsabilidad de cada superficie

| Superficie | Responsabilidad | No hace |
|---|---|---|
| Móvil/Campo | capturar datos originales | procesamiento pesado |
| Web/Oficina | gestionar, procesar, entregar | operación de plataforma |
| Administración | operar, supervisar, configurar, auditar | producir datos de dominio |

## 2. Estructura administrativa propuesta (arquitectura objetivo)

```text
backend/admin/
├── dashboard/          métricas y estado operativo del ecosistema
├── usuarios/           gestión de cuentas, estados, incidencias
├── soporte/            tickets, atención, resolución
├── suscripciones/      supervisión de planes, entitlements, cuotas
├── transacciones/      supervisión operativa (comisiones, estados)
├── aportes/            contribuciones/recompensas (MELANTIOS)
├── monitoreo/          salud de servicios, sync, errores
├── configuracion/      feature flags y configuración remota
├── actualizaciones/    gestión de versiones y releases
└── auditoria/          superficie de consulta sobre shared/audit/
```

**No implementado.** Es la estructura destino; su orden de construcción
es decisión posterior (ver §10).

Cada subdirectorio es una **superficie administrativa** sobre un
dominio existente — no una reimplementación del dominio (§9).

## 3. Separación de roles — tres conceptos distintos

MELANTIA tiene ahora **tres ejes de rol** que no deben mezclarse:

```text
PERFIL / IDENTIDAD                    ROL DE PROYECTO              ROL ADMINISTRATIVO
(qué es el usuario)                   (qué hace en un proyecto)     (qué opera en la plataforma)
        │                                    │                           │
   productor                            propietario                administrador
   agrónomo                             profesional responsable    soporte
   veterinario                          colaborador                operador
   abogado                              técnico                    auditor de plataforma
   transportista                        cliente (en el proyecto)   seguridad
   emprendedor                          auditor (del proyecto)
   …                                    …
```

| Eje | Alcance | Origen | Ejemplo |
|---|---|---|---|
| **Perfil** | identidad del usuario, multi-perfil | autodeclarado/verificado | "es veterinario" |
| **Rol de proyecto** | un Proyecto concreto del Ecosistema Profesional | asignado por el proyecto | "colaborador en Finca El Carmen" |
| **Rol administrativo** | la plataforma MELANTIA | otorgado por la organización | "operador de soporte" |

**Reglas de no mezcla:**

1. Ser veterinario (perfil) no otorga ningún permiso administrativo.
2. Ser propietario de un proyecto no otorga ningún permiso administrativo.
3. Ser administrador **no** convierte al usuario en participante de
   ningún Proyecto del Ecosistema Profesional (§8).
4. Los tres ejes pueden coexistir en un mismo `usuario` — una persona
   puede ser agrónomo, responsable de un proyecto y operador de soporte
   a la vez, pero cada permiso vive en su propio eje y se evalúa por
   separado.
5. Conceptualmente, la autorización se evalúa en capas: identidad
   (auth) → contexto (proyecto/admin) → recurso.

## 4. Auditoría — infraestructura vs superficie

Dos piezas con nombres parecidos y responsabilidades distintas:

```text
shared/audit/              INFRAESTRUCTURA transversal
   │                        registrar eventos: quién, cuándo, qué,
   │                        sobre qué, resultado — inmutable
   ▼
backend/admin/auditoria/   SUPERFICIE administrativa
                            consultar, filtrar, exportar,
                            revisar — solo lectura sobre el log
```

- `shared/audit/` pertenece a la infraestructura compartida: lo usan
  todos los módulos, los Proyectos Profesionales y la propia
  administración.
- `admin/auditoria/` es solo la pantalla/API de consulta. No escribe el
  log; lo lee.

**La auditoría debe poder registrar acciones de:**

- usuarios (operaciones de dominio);
- profesionales (trabajo dentro de proyectos);
- administradores (toda acción administrativa — ver §4.1);
- sistemas automáticos (workers, sync, jobs);
- cambios administrativos (configuración, flags, releases, cuentas);
- operaciones relevantes (entregas, aplicaciones de levantamiento,
  cambios de estado, accesos sensibles).

### 4.1 Regla de simetría administrativa

La administración está **más auditada**, no menos: cualquier consulta o
cambio administrativo sobre datos de un usuario queda registrado con el
rol administrativo que lo ejecutó. Un administrador nunca es "invisible"
en el log.

## 5. Configuración remota

`backend/admin/configuracion/` es la superficie para gestionar
feature flags y configuración de plataforma.

**Separar dos cosas que no deben confundirse:**

```text
QUIÉN administra                    CÓMO se consume
la configuración                    la configuración
      │                                    │
 admin/configuracion/             lectura de config/flags por
 (superficie: crear flag,          el cliente y el backend —
   cambiar valor, rollout,          mecanismo transversal
   audiencia objetivo)             (no es código admin)
```

- La escritura de configuración es privilegio administrativo y
  auditable (valor anterior → valor nuevo → quién → cuándo).
- El consumo es una capacidad transversal del backend/clientes
  (mobile, web leen flags efectivos para su usuario/versión).
- La configuración remota permite activar capacidades por plan, por
  profesión, por región o por rollout progresivo — sin despliegue.

## 6. Actualizaciones

`backend/admin/actualizaciones/` gestiona **versiones y releases** del
ecosistema.

**Diferenciar:**

```text
ADMINISTRACIÓN DE RELEASES              MECANISMO DE ACTUALIZACIÓN
(superficie administrativa)             (cliente/backend)
      │                                       │
 registrar versión, notas,              verificación de versión,
 estado (draft/published/               compatibilidad mínima,
 deprecada), rollout por                descarga, migración local,
 audiencia/plataforma                   verificación de integridad
```

Principios heredados del ecosistema:

- **Versionado:** cada release identificable (versión, fecha, alcance).
- **Integridad:** artefactos con hash verificable (misma filosofía que
  evidencias M11 — SHA-256).
- **Verificación:** el cliente comprueba antes de aplicar.
- **Auditoría:** quién publicó, cuándo, a quién se ofreció.
- **Despliegue controlado:** rollout progresivo, posibilidad de retiro.
- **Protección de datos históricos:** una actualización nunca destruye
  datos locales no sincronizados — coherente con offline-first y con la
  regla de datos originales inmutables.

## 7. Seguridad — autorización administrativa independiente

Las rutas administrativas vivirán bajo un espacio separado:

```text
/api/v1/admin/*
```

**Autorización independiente y adicional:**

```text
request
  ├── autenticación (JWT existente — quién eres)
  ├── autorización administrativa (¿tienes rol admin válido?)
  └── autorización de recurso (¿puedes sobre ESTE objeto?)
```

- El rol administrativo **no deriva** del perfil profesional ni del
  rol de proyecto — es un eje propio (§3).
- La autorización administrativa se evalúa **después** de la
  autenticación normal y es verificable por acción (no una sola
  llave maestra).
- Ninguna ruta `/api/v1/admin/*` existe hoy — no implementar.

## 8. Relación con el Ecosistema Profesional

```text
Ecosistema Profesional   ≠   Administración MELANTIA
        │                          │
   capa de trabajo               operación del ecosistema
   profesional (workspaces,      (cuentas, soporte, flags,
   proyectos, entregables)        releases, supervisión)
```

- Un administrador puede **supervisar** proyectos (métricas, estado,
  incidencias) mediante permisos administrativos — eso **no** lo
  convierte en participante del proyecto.
- Ver contenido de un proyecto como administrador deja **traza de
  auditoría** (§4.1) y debe ser justificable — supervisión operativa,
  no acceso libre al trabajo del cliente.
- A la inversa: un participante de proyecto no gana ninguna capacidad
  administrativa.
- Si un profesional necesita ayuda de soporte dentro de un proyecto,
  soporte opera sobre el incidente (ticket) — la membresía del proyecto
  no cambia.

## 9. Relación con los 12 módulos

La Administración **supervisa y opera** los módulos; **no absorbe su
lógica de negocio**:

```text
admin/suscripciones/   supervisa planes, cuotas, incidencias
        │ opera sobre
        ▼
modules/suscripciones/ conserva el dominio: planes, entitlements,
                       cobros, reglas

admin/transacciones/   supervisa operaciones, disputas, comisiones
        │ opera sobre
        ▼
modules/negocios_rurales/  conserva el dominio comercial (M4)
(futuro modules/servicios_financieros — M10)
```

| Admin hace | El módulo conserva |
|---|---|
| consultar estado, resolver incidencias, ajustar cuotas, revisar disputas, observar métricas | reglas de negocio, flujos funcionales, API de dominio, ownership del dato |

La línea divisoria: la administración puede **observar, operar casos
excepcionales y configurar** — no puede producir el resultado funcional
del módulo (no crea una transacción comercial, no genera un informe
técnico, no captura datos de campo).

## 10. Límites de esta fase y fases futuras

**No realizado, no autorizado, no implementado:** ninguna tabla, rol en
BD, ruta `/api/v1/admin/*`, panel, flag de configuración, `shared/audit/`
ni `backend/admin/`. Todo lo descrito es arquitectura objetivo.

```text
ADM-0  ESTA FASE — diseño conceptual          ✅ (este documento)
ADM-1  Modelo de roles administrativos        (decisiones §11)
ADM-2  shared/audit/ — infraestructura        (prerequisito de casi todo)
ADM-3  Autorización administrativa            (middleware/dependencia)
ADM-4  backend/admin/ mínimo viable           (dashboard + usuarios)
ADM-5  auditoria/ — superficie de consulta
ADM-6  configuracion/ — flags
ADM-7  actualizaciones/ — releases
ADM-8  supervisión por módulo                 (suscripciones, transacciones…)
```

`shared/audit/` (ADM-2) es además **prerequisito** del historial de
Proyecto del Ecosistema Profesional (ver `docs/ECOSISTEMA_PROFESIONAL.md`
§13): el mismo motor registra eventos de dominio, de proyecto y
administrativos.

## 11. Decisiones pendientes

| # | Decisión | Opciones | Nota |
|---|---|---|---|
| DA1 | Representación del rol administrativo | campo en `usuarios` vs tabla `roles_administrativos` vs membresía por ámbito | favorece granularidad por área (soporte ≠ finanzas) — decidir en ADM-1 |
| DA2 | `shared/audit/` antes o con EP-1 | audit primero beneficia a ambos | recomendado: ADM-2 precede EP-1 |
| DA3 | Superficie admin: ¿misma app web o consola separada? | sección `/admin` en web vs app aparte | mismo backend en ambos casos; UI es decisión posterior |
| DA4 | Alcance de lectura admin sobre datos de usuario | total auditado vs enmascarado por defecto | privacidad: prefijar enmascaramiento salvo caso justificado |
| DA5 | Versionado de clientes (mínimo soportado) | política de compatibilidad | coordinar con actualizaciones §6 |
| DA6 | ¿Admin ve contenido de evidencias M11? | metadatos sí / binario condicionado | decisión de privacidad |

---

**Fin del diseño conceptual de Administración.** Siguiente paso: validar
junto con `docs/ECOSISTEMA_PROFESIONAL.md` antes de cualquier modelo de
datos (ADM-1 / EP-1).
