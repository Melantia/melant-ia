# MELANTIA — Matriz de Credenciales, Roles, Permisos y Alcances v1

> Documento de **diseño conceptual** del **Módulo de Gestión de Credenciales y Autorizaciones Administrativas**.
> **Nada aquí está implementado ni autoriza implementación.** Sin código, SQL, migraciones, endpoints, frontend, FIDO2/WebAuthn ni cambios de autenticación/autorización.
> Fecha: 2026-10-05 · Versión: **v1 — LISTO PARA REVISIÓN DEL FUNDADOR**
> Fuentes contrastadas: `seguridad_soberana/02` §7 (roles plano de control, two-person, JIT, break-glass, FIDO2) · `ADMINISTRACION.md` (ADM-0: tres ejes de rol, superficie admin) · EP-4E (`EP_MODELO_DATOS.md` §14) · F7a (doc 17) / F7a.1 (doc 21) · docs 05–08 (offline/supervivencia) · `VISION_ECOSISTEMA_MELANTIA.md` §17.

---

## 1. Principio general

La arquitectura administrativa de MELANTIA separa nueve conceptos, cada uno evaluado en su propio plano:

```text
IDENTIDAD      → quién es la persona (registro administrativo)
CREDENCIAL     → cómo demuestra ser esa persona
ROL            → qué función organizativa desempeña
RESPONSABILIDAD → para qué responde ese rol
PERMISO        → qué acciones puede intentar
ALCANCE        → sobre qué territorio/organización/recurso
CONDICIÓN      → bajo qué circunstancias (online, doble autorización, etc.)
AUTORIZACIÓN   → veredicto del servidor/política en cada acción
AUDITORÍA      → registro inmutable de todo lo anterior
```

Reglas rectoras:

1. El **rol** determina responsabilidades, permisos y límites de acceso.
2. Una **credencial autentica a una persona**; no contiene ni decide permisos de MELANTIA.
3. Los **permisos y autorizaciones son responsabilidad del servidor** y de la política administrativa — nunca del cliente ni de la credencial.
4. La credencial del MVP es **MANUAL**; la arquitectura admite FIDO2/WebAuthn (~6 meses) **sin rediseñar roles, permisos, alcances ni autorización**.
5. El **nivel (L0–L5) NO es "poder absoluto"**: es solo clasificación administrativa. Los permisos reales dependen de rol + responsabilidad + alcance + condiciones.
6. Esto encaja en el modelo existente de **tres ejes de rol** (`ADMINISTRACION.md` §3): esta matriz define el **eje administrativo/organizativo**; no toca el eje perfil ni el eje rol-de-proyecto (EP-4E).

---

## 2. Identidad administrativa

Modelo conceptual de la identidad administrativa (no DDL):

```text
identidad_administrativa
  id_interno            UUID interno MELANTIA
  nombres_completos     texto
  sexo                  enum según catálogo
  cedula_ruc            identificador fiscal según tipo de sujeto
  tipo_sujeto           NATURAL | JURIDICA (coherente con D4.2)
  rol                   L0|L2|L3|L4|L5 + función asignada
  provincia             geo
  canton                geo
  parroquia             geo (cuando corresponda)
  organizacion          entidad/organización (cuando corresponda)
  estado                activo | suspendido | revocado
  credencial_asociada   ref → credencial (§3)
  fecha_asignacion      timestamp
  responsable_que_autorizo  ref → identidad autorizante
  auditoria             ref → registro (§16)
```

Separación obligatoria:

```text
PERSONA / IDENTIDAD  ≠  CREDENCIAL  ≠  ROL  ≠  PERMISOS
```

- Una persona puede cambiar de rol sin cambiar de identidad; puede rotar de credencial sin cambiar de persona.
- **Los datos personales no están disponibles automáticamente para todos los roles**: la identidad administrativa se consulta por necesidad y queda auditada (regla de simetría administrativa de `ADMINISTRACION.md` §4.1 — el admin nunca es invisible en el log).
- La identidad administrativa se vincula a `usuarios.id` (eje identidad existente); el rol administrativo vive en el eje propio — ningún perfil ni rol de proyecto lo deriva.

---

## 3. Credenciales

### 3.1 Tipos

| Tipo | Estado |
|---|---|
| **MANUAL** | MVP — credencial emitida/asignada manualmente bajo control administrativo |
| **FIDO2 / WebAuthn** | Futuro (~6 meses). **No implementar ahora.** La arquitectura lo admite como proveedor adicional sin tocar autorización |

La capa de credencial es un **proveedor intercambiable**: la autorización consume `identidad_verificada`, nunca el tipo de credencial. Múltiples proveedores/tipos pueden coexistir por persona.

### 3.2 Ciclo de vida conceptual

```text
registrar → asignar (a identidad) → activar → suspender → revocar → reemplazar
                └── todo evento: auditar + conservar historial
```

- Suspender ≠ revocar: suspensión es reversible y temporal; revocación es terminal (la credencial muere; la identidad puede recibir otra).
- Toda operación sobre credenciales de terceros requiere **doble autorización** (§11); sobre la propia credencial, re-autenticación.
- **No implementar todavía.**

### 3.3 Credenciales del Fundador

| ID | Titular | Tipo | Uso | Regla |
|---|---|---|---|---|
| **ML-001-D** | Fundador (L5) | MANUAL | Uso diario | operación normal |
| **ML-001-E** | Fundador (L5) | MANUAL | **Emergencia** | separada de la diaria; uso dispara alarma y revisión obligatoria — corresponde al concepto **break-glass** de doc 02 §7.2 |

La credencial de emergencia **permanece separada** de la de uso diario: custodia diferenciada, sin operación rutinaria, todo uso auditado con revisión posterior obligatoria.

---

## 4. Roles aprobados

| Nivel | Rol | Variantes/función |
|---|---|---|
| **L5** | FUNDADOR | — |
| **L4** | ADMINISTRADOR / COORDINADOR GENERAL | — |
| **L3** | ECONOMISTA / RESPONSABLE DE NEGOCIOS Y DESARROLLO ECONÓMICO | — |
| **L3** | AUDITOR / CONTABLE | — |
| **L3** | ESPECIALISTA TÉCNICO | Ing. Software · Especialista Frontend · otro autorizado (según función asignada) |
| **L2** | COORDINADOR TERRITORIAL | Coordinador Provincial · Coordinador Cantonal (según alcance) |
| **L0** | USUARIO | — |

**7 roles definidos** en 5 niveles. El número de nivel es clasificación administrativa, no potestad.

---

## 5. Definición por rol

### 5.1 L5 — FUNDADOR

Máxima autoridad de gobierno de MELANTIA. Interviene en: gobierno estratégico, decisiones críticas, administración, seguridad, cambios estructurales, autorizaciones especiales, decisiones financieras, crecimiento, relaciones institucionales, futuros servicios, Puerto MELANTIA, evolución de Wallet/Tarjeta, decisiones críticas de seguridad.

- **No existe la regla "puede todo solo"**: los cambios críticos requieren doble autorización o control reforzado según la matriz de §18.
- Dos credenciales: `ML-001-D` (diaria) + `ML-001-E` (emergencia).
- Correspondencia conceptual: equivale al rol **Propietario** del plano de control (doc 02 §7.1) — "titular de la raíz, aprueba con segundo, no operación diaria".

### 5.2 L4 — ADMINISTRADOR / COORDINADOR GENERAL

Persona de máxima confianza del Fundador; jefe operativo/administrativo de MELANTIA.

Responsabilidades: coordinación general, ejecución administrativa, coordinación de colaboradores, seguimiento de operaciones, resolución de conflictos administrativos, coordinación con Fundador/Economista/Especialistas/territorio, supervisión general, apoyo al crecimiento.

- **Sin autoridad unilateral para cambios críticos** — toda acción administrativa relevante exige doble autorización.
- Correspondencia conceptual: cubre el rol **Operador** del plano de control + coordinación organizativa (que el plano de control no tenía).

### 5.3 L3 — ECONOMISTA / RESPONSABLE DE NEGOCIOS Y DESARROLLO ECONÓMICO

Vela porque los negocios de MELANTIA se desarrollen de forma responsable y sostenible.

Puede: consultar y analizar negocios, resultados, indicadores; atender quejas de negocios; participar en resolución de conflictos; analizar casos exitosos y problemas recurrentes; proponer mejoras; analizar modelos de negocio, crecimiento, inversión, costes, ingresos, sostenibilidad; evaluar apertura de Puertos MELANTIA y sus servicios; participar en reuniones comunitarias y explicar el modelo; participar en planificación de billetera virtual y tarjeta de débito MELANTIA; participar en documentación legal con los responsables correspondientes; **aprobar determinadas operaciones del dominio económico interno según la matriz** (§18 — ver límite PC-06).

- **No gobierna unilateralmente.** Combinaciones según criticidad: `ECONOMISTA + COORDINADOR GENERAL`, `ECONOMISTA + FUNDADOR`, o `FUNDADOR + COORDINADOR GENERAL + ECONOMISTA`.
- **Sin permiso general de crear/modificar.**
- **Límite financiero (PC-06, resuelto 2026-10-08):** el Economista **NO** aprueba ni ejecuta operaciones financieras de usuarios; no mueve dinero, no modifica saldos, no autoriza pagos/transferencias/créditos de usuarios, no modifica credenciales ni reglas de seguridad, y no puede saltarse controles del sistema. «Aprobar determinadas operaciones» se refiere a operaciones del dominio económico **interno** de MELANTIA (análisis, decisiones de negocio, actas, evaluación de Puertos), nunca a transacciones financieras de usuarios. En incidente financiero la cadena es: `USUARIO → SISTEMA → ADMINISTRADOR/RESPONSABLE → ECONOMISTA (cuando corresponda) → PROVEEDOR FINANCIERO (cuando corresponda) → AUDITOR/FUNDADOR según gravedad` — sin convertir al Economista en ejecutor financiero.

### 5.4 L3 — AUDITOR / CONTABLE

Observa, analiza, audita, registra y ayuda a resolver conflictos.

Puede: consultar, analizar, revisar, auditar, detectar inconsistencias, registrar incidencias, revisar negocios, registrar éxitos y problemas, analizar causas, documentar resolución, archivar resultados, solicitar intervención, participar en resolución de conflictos.

- **Sin autorización general para modificar el sistema** — ni administrar, ni editar, salvo acciones explícitamente autorizadas por la matriz.
- Usa el **Módulo 11 — Registro de Evidencias y Documentos** como capa obligatoria de evidencia.
- Flujo conceptual:

```text
PROBLEMA → AUDITOR/CONTABLE → ANÁLISIS → EVIDENCIA → MÓDULO 11
        → ECONOMISTA (cuando corresponda) → RESOLUCIÓN → REGISTRO → ARCHIVO
```

- Auditoría financiera: siempre `AUDITOR/CONTABLE + ECONOMISTA`.
- Si se requieren modificaciones: interviene el autorizador correspondiente según §18.

### 5.5 L3 — ESPECIALISTA TÉCNICO

Ing. Software, Especialista Frontend u otro especialista técnico autorizado.

Puede: revisar, diagnosticar, analizar, resolver incidencias técnicas autorizadas, revisar código, mantenimiento autorizado, participar en cambios técnicos autorizados.

- **Sin autoridad sobre**: gobierno, finanzas, permisos, roles, usuarios, decisiones administrativas, políticas de negocio.
- Modificación técnica sensible → autorización funcional **y** técnica según la matriz.
- El especialista **implementa técnicamente una modificación previamente autorizada** — nunca autoriza por sí mismo.
- Correspondencia conceptual: rol **Desarrollador** del plano de control (push/PR sí; main/release/producción/datos no).

### 5.6 L2 — COORDINADOR TERRITORIAL (Provincial / Cantonal)

El Coordinador **no es administrador del sistema**: su función es **coordinar**.

Trabaja con: dirigentes, presidentes de asociaciones, autoridades cantonales y parroquiales, comunidades, organizaciones rurales, futuros administradores de Puerto MELANTIA.

Puede: coordinar reuniones, presentar MELANTIA, explicar el modelo, identificar oportunidades, recoger necesidades, coordinar gestiones, apoyar crecimiento territorial, identificar oportunidades de futuros Puertos, coordinar futuras responsabilidades del Puerto, dar seguimiento a acuerdos, reportar problemas, coordinar actividades comunitarias.

**NO puede** (lista cerrada):

- acceder a información financiera sensible;
- aprobar operaciones financieras;
- modificar información financiera;
- modificar usuarios;
- modificar permisos;
- modificar credenciales;
- modificar configuraciones;
- realizar cambios administrativos críticos.

Alcance: **territorial** — Provincia / Cantón / Parroquia / Comunidad según asignación. Fuera de su territorio no accede automáticamente a nada.

### 5.7 L0 — USUARIO

Cuenta de negocio estándar (`usuarios`). Opera sus datos según EP-4E/entitlements. Ninguna capacidad administrativa.

---

## 6. Doble autorización y four-eyes

### 6.1 Regla aprobada

> **Todo cambio administrativo relevante requiere DOBLE AUTORIZACIÓN. Nadie — ni el Fundador — realiza unilateralmente cambios críticos.**

Aplica como mínimo a: cambios de permisos, creación de administradores, revocación de credenciales, cambios de roles, cambios administrativos críticos, cambios financieros críticos, cambios de seguridad, cambios estructurales, modificaciones sensibles del sistema.

Para criticidad extrema puede requerirse **triple control** — la matriz lo determina por acción; **no** toda acción necesita tres personas.

### 6.2 Four-eyes

```text
PERSONA A PROPONE → PERSONA B REVISA → AUTORIZACIÓN → EJECUCIÓN → AUDITORÍA
```

Criticidad extrema: `FUNDADOR + ADMINISTRADOR + ROL ESPECIALIZADO CORRESPONDIENTE` según el caso.

Compatibilidad: extiende la **two-person rule** ya diseñada (doc 02 §7.3) del plano de control técnico (RoT, releases, exports) al plano de gobierno organizativo (roles, credenciales, territorio). Mismo patrón de *orden firmada con verificación de ambas firmas*.

---

## 7. Verbos de permiso

| Verbo | Significado |
|---|---|
| CONSULTAR | leer información dentro de su alcance |
| ANALIZAR | procesar/evaluar información sin modificarla |
| CREAR | generar nuevos registros/gestiones |
| EDITAR | modificar registros existentes |
| APROBAR | dar autorización a una acción pendiente |
| EJECUTAR | llevar a cabo una acción autorizada |
| ADMINISTRAR | gestionar configuración/ciclo de vida de un dominio |
| REVOCAR | invalidar credenciales, permisos o estados |

**Ningún rol posee todos los verbos.** La asignación se define en §17 y §18.

---

## 8. Alcance (separado del rol)

| Alcance | Descripción |
|---|---|
| Global | toda la plataforma |
| País | nivel nacional |
| Provincia | geo nivel 1 |
| Cantón | geo nivel 2 |
| Parroquia | geo nivel 3 |
| Comunidad | comunidad específica |
| **Puerto MELANTIA** | un Puerto MELANTIA concreto (concepto nuevo — ver pendiente PC-05) |
| Organización | entidad/organización específica |
| Proyecto | un proyecto EP concreto |
| Recurso específico | recurso individual |

Reglas:

- **ROL ≠ ALCANCE**: un Coordinador Cantonal opera solo dentro de su cantón; nada fuera de su territorio es accesible automáticamente.
- El alcance se asigna por persona + rol, es auditable y revocable.
- El alcance **proyecto** no equivale a EP-4E: un rol administrativo con alcance-proyecto opera *sobre* el proyecto administrativamente, sin ser participante (regla de no-mezcla de `ADMINISTRACION.md` §3/§8).

---

## 9. Condiciones de seguridad (offline/online)

El rol administrativo **no sustituye** las seguridades aprobadas (F7a/F7a.1, docs 05–08):

| Plano | Regla |
|---|---|
| **Offline** | acceso limitado · acciones limitadas · consulta de información autorizada (dentro de snapshot/ventana) · registro y **preparación** de gestiones permitidas · **sin cambios críticos** · **sin modificación de permisos** · **sin cambios de credenciales** · **sin operaciones financieras críticas** |
| **Online** | toda acción crítica pasa por **validación del servidor** |

La seguridad principal sigue siendo: identidad · sesión · autorización · permisos · políticas · cifrado · cola · idempotencia · sincronización · servidor · auditoría. La cadena offline de un rol administrativo obedece la misma máquina de estados y confirmación del doc 06 — la autorización la confirma el servidor al sincronizar, nunca el cliente.

---

## 10. Auditoría

Toda acción administrativa relevante registra como mínimo:

```text
quién · qué acción · cuándo · sobre qué recurso · alcance · resultado
autorización requerida · segundo autorizador · evidencia relacionada · motivo
```

- **Módulo 11** es la capa transversal de evidencias (documentos, actas, capturas, resoluciones).
- También se registra: número de negocios exitosos, problemas detectados, resolución, evidencia, reseña del caso, archivo/cierre.
- Regla de simetría: el rol administrativo que ejecuta queda siempre en el log (`ADMINISTRACION.md` §4.1).
- El log es append-only y fuera del alcance del propio administrador (doc 02 §7.2).

---

## 11. Matriz principal de roles y permisos

| Rol | Responsabilidad | Puede consultar | Puede analizar | Puede crear | Puede editar | Puede aprobar | Puede ejecutar | Puede administrar | Puede revocar | Alcance | Puede operar offline | Acciones offline | Requiere conexión | Requiere doble autorización | Requiere triple control | No puede hacer | Quién autoriza | Auditoría requerida |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **L5 FUNDADOR** | Gobierno y autoridad máxima | Todo, con traza justificable | Todo | Cambios estructurales, autorizaciones especiales (propuestos) | Configuración/políticas — solo tras autorización cruzada | Acciones críticas (como 1er o 2º firmante) | Ejecuta solo lo aprobado | Gobierno general | Credenciales/roles con doble firma | Global | Limitado | Consulta autorizada, preparar gestiones | Toda acción crítica | Cambios de roles/permisos/credenciales/finanzas/seguridad/estructura | Cambio de propiedad/raíz, rotación RoT, salida de lockdown | Nada unilateral en lo crítico; no se auto-aprueba | Otro rol requerido por la acción (ver §18) | Total — toda acción |
| **L4 ADMINISTRADOR / COORDINADOR GENERAL** | Jefatura operativa y coordinación general | Operación, usuarios, incidencias, métricas | Operaciones, conflictos administrativos | Gestiones administrativas autorizadas (usuarios, tickets, coordinación) | Registros operativos autorizados — nunca políticas ni lo crítico solo | Operaciones administrativas de rutina | Ejecuta lo aprobado | Operación diaria (no gobierno) | Sesiones/incidencias operativas con segundo | Global (operativo, no de gobierno) | Limitado | Consulta, registrar/preparar gestiones | Cambios administrativos relevantes | Permisos, cuentas admin, configuración, revocaciones | Cambios estructurales/financieros críticos | Gobierno unilateral, cambios críticos solo, acceso financiero de ejecución | Fundador (crítico); regla de pares según acción | Total — simetría admin |
| **L3 ECONOMISTA** | Desarrollo económico responsable | Negocios, resultados, indicadores — dentro del alcance asignado | Negocios, modelos, costes, ingresos, sostenibilidad, Puertos | Propuestas/mejoras, documentación de negocio | Datos de gestión propios — nunca sistema ni permisos | **Determinadas operaciones según §18** (nunca general) | Resoluciones de conflicto aprobadas | — | — | Según responsabilidad asignada (no necesariamente global) | Limitado | Consulta autorizada, preparar análisis/gestiones | Aprobaciones | Aprobaciones económicas relevantes | Decisiones financieras críticas (con FUNDADOR+ADMIN) | Gobernar, crear/modificar sistema, permisos generales, ejecutar dinero | Fundador/Administrador según criticidad | Total en actos de negocio |
| **L3 AUDITOR / CONTABLE** | Observar, auditar, registrar, apoyar resolución | Información de auditoría dentro de su alcance | Todo lo consultado: inconsistencias, causas, casos | Evidencias en M11, incidencias, registros de caso, informes de auditoría | Sus propios registros de caso — nunca datos de terceros ni sistema | — (solicita intervención, no aprueba) | — | — | — | Asignado por caso/área | Sí, restringido | Consulta autorizada, **registrar evidencias y casos** (encolables) | Cierre de casos, modificaciones, intervenciones | Auditoría financiera → `AUDITOR + ECONOMISTA` | — | Administrar, modificar salvo lo explícitamente autorizado, aprobar operaciones | Autorizador de la acción modificada | Total — su función ES auditar |
| **L3 ESPECIALISTA TÉCNICO** | Soporte, diagnóstico, mantenimiento autorizado | Sistemas/logs necesarios para la incidencia asignada | Incidencias técnicas, código | Fixes/PR en su dominio autorizado | Código en su dominio autorizado | — | Cambios técnicos **previamente autorizados** | — | — | Dominio técnico asignado | Muy limitado | Diagnóstico, preparación de cambios | Todo deploy/cambio productivo | Cambios sensibles: autorización funcional + técnica | Cambios de seguridad críticos | Gobierno, finanzas, permisos, roles, usuarios, decisiones de negocio | Administrador/ Fundador (funcional) + responsable técnico | Total — cambios técnicos firmados |
| **L2 COORDINADOR TERRITORIAL** | Coordinar territorio (no administrar) | Información de su territorio necesaria para coordinar (no financiera sensible) | Necesidades, oportunidades, seguimiento de acuerdos | Reportes, gestiones, convocatorias, registros de reunión | Sus propios reportes/gestiones | — | Actividades de coordinación asignadas | — | — | Provincia / Cantón / Parroquia / Comunidad asignada | Sí, para su función | Reuniones, reportes, registros de gestión (encolables) | — (su función es esencialmente de campo) | N/A — no ejecuta cambios administrativos | N/A | **Lista cerrada §5.6: finanzas sensibles, aprobar financiero, modificar usuarios/permisos/credenciales/config, cambios críticos** | Administrador para su alta y alcance | Reportes y gestiones |
| **L0 USUARIO** | Operar sus datos de negocio | Sus datos | Sus datos | Sus registros según EP-4E/plan | Sus registros según permiso | — | Sus operaciones autorizadas | — | — | Sus recursos | Sí | Todo lo permitido por docs 05–08 | Operaciones REQUIERE_ONLINE | N/A | N/A | Todo lo administrativo | Sistema (EP-4E/entitlements) | Dominio auditado |

---

## 12. Matriz de Acciones Críticas y Autorizaciones

| Acción crítica | Rol que puede proponer | Rol que puede revisar | Primer autorizador | Segundo autorizador | Tercer control si aplica | ¿Offline? | ¿Requiere servidor? | Evidencia requerida | Auditoría | Observaciones |
|---|---|---|---|---|---|---|---|---|---|---|
| Crear identidad administrativa (alta de rol L3+) | Administrador | Auditor/Contable | Fundador | Administrador | — | No (registrable, no activable) | Sí | Expediente + M11 | Completa | Alta efectiva solo con doble firma |
| Asignar credencial | Administrador | — | Administrador | Fundador | — | No | Sí | Registro de entrega | Completa | Ciclo §3.2 |
| Revocar credencial (tercero) | Administrador / Auditor (detecta) | Economista si afecta cuenta | Fundador | Administrador | — | No | Sí | Motivo + evidencia | Completa | Revocación terminal |
| Usar credencial de emergencia (ML-001-E) | Fundador | — | (auto, dispara alarma) | Revisión posterior: Administrador | Auditor/Contable en revisión | Solo emergencia | Post-acción obligatoria | Acta de emergencia + M11 | **Obligatoria + revisión** | Break-glass: uso legítimo posible, siempre revisado |
| Cambiar rol de una persona | Administrador | Auditor/Contable | Fundador | Administrador | — | No | Sí | Expediente | Completa | Nunca auto-cambio |
| Cambiar permisos de un rol | Fundador o Administrador | Auditor/Contable | Fundador | Administrador | — | No | Sí | Matriz antes/después | Completa | Cambio de matriz = versión nueva de este documento |
| Modificar usuarios (datos de terceros) | Administrador | Auditor/Contable | Administrador | Fundador | — | No | Sí | Ticket + motivo | Completa | Coordinador: prohibido |
| Cambio administrativo crítico (config, estructura) | Administrador o Fundador | Especialista si técnico | Fundador | Administrador | Rol especializado si aplica | No | Sí | Orden firmada + M11 | Completa | Four-eyes §6.2 |
| Decisión financiera crítica | Economista o Fundador | Auditor/Contable | Fundador | Economista | Administrador | No | Sí | Análisis + acta M11 | Completa | Proveedor financiero ejecuta dinero — MELANTIA nunca custodia (A2/VISIÓN §17). Decisión de gobierno interno, no operación financiera de usuario (PC-06) |
| Aprobación de operación económica ordinaria | Economista | Auditor/Contable | Economista | Administrador | — | No | Sí | Registro de operación | Completa | "Determinadas operaciones" del Economista = esta fila y su dominio — **dominio económico interno; nunca operaciones financieras de usuarios** (PC-06, resuelto 2026-10-08) |
| Auditoría financiera | Auditor/Contable | — | Auditor/Contable | Economista | — | No (evidencia sí) | Sí | Expediente M11 | Completa | Par obligatorio §5.4 |
| Abrir / evaluar Puerto MELANTIA | Coordinador Territorial (identifica) / Economista (evalúa) | Administrador | Fundador | Economista | Administrador | No | Sí | Estudio económico + acta | Completa | Alcance tipo "Puerto MELANTIA" (PC-05) |
| Planificar Wallet / Tarjeta MELANTIA | Economista | Auditor/Contable | Fundador | Economista | Administrador | No | Sí | Documento de planificación | Completa | Futuro; nunca implica custodia de fondos |
| Cambio de seguridad / política auth | Fundador o Especialista (propone técnico) | Especialista Técnico | Fundador | Administrador | Especialista si aplica | No | Sí | Análisis técnico + orden | Completa | Converge con doc 02 §7.3 (modificación de política crítica) |
| Cambio estructural de plataforma | Fundador o Administrador | Especialista Técnico | Fundador | Administrador | Especialista | No | Sí | Diseño aprobado + orden | Completa | — |
| Rotación RoT / claves raíz | Custodio (plano control) | — | Custodio | Fundador(Propietario) | Segundo custodio | No | Sí | Acta ceremonial | Completa | Heredado de doc 02 §7.3 — plano de control |
| Release de software | Especialista Técnico (revisor) | — | Revisor técnico | Fundador/Administrador (release manager) | — | No | Sí | Artefacto + hash + SBOM | Completa | Heredado de doc 02 §7.3 |
| Revocar acceso de Coordinador Territorial | Administrador | Auditor/Contable | Administrador | Fundador | — | No | Sí | Motivo | Completa | Corta alcance territorial |
| Salida de estado LOCKDOWN | Operador (plano control) | — | Operador | Fundador(Propietario) | — | No | Sí | Incidente + orden | Completa | Heredado de doc 02 §8.2 |
| Exportación masiva de datos | Administrador | Auditor/Contable | Administrador | Fundador | — | No | Sí | Solicitud justificada | Completa | Heredado de doc 02 §7.3 |

> Regla de lectura: *proponer ≠ autorizar*; *primer autorizador ≠ segundo* — siempre personas y preferiblemente roles distintos.

---

## 13. Matriz de Alcances Territoriales y Organizacionales

| Rol | Global | Provincia | Cantón | Parroquia | Comunidad | Puerto MELANTIA | Organización | Proyecto | Recurso específico | Restricciones |
|---|---|---|---|---|---|---|---|---|---|---|
| L5 FUNDADOR | ✓ (autoridad de gobierno) | ✓ | ✓ | ✓ | ✓ | ✓ (decisor) | ✓ | ✓ | ✓ | Todo acceso con traza justificable; lo crítico siempre con segundo |
| L4 ADMINISTRADOR | ✓ operativo (no de gobierno) | ✓ | ✓ | ✓ | ✓ | ✓ (supervisión) | ✓ | ✓ | ✓ | Sin alcance de gobierno unilateral; supervisión ≠ participación EP |
| L3 ECONOMISTA | Solo lo que su responsabilidad asigne | Asignado | Asignado | Asignado | Asignado | Evaluación (no operación) | Asignado | Asignado | Asignado | Alcance económico, no administrativo del sistema |
| L3 AUDITOR / CONTABLE | Solo por caso asignado | Por caso | Por caso | Por caso | Por caso | Por caso | Por caso | Por caso | Por caso | Acceso por expediente; fuera de caso = sin acceso |
| L3 ESPECIALISTA TÉCNICO | Solo dominio técnico asignado | — | — | — | — | — | — | — | Repos/incidencias asignadas | Alcance técnico, nunca territorial ni de negocio |
| L2 COORDINADOR TERRITORIAL | — | Si es Provincial: su provincia | Si es Cantonal: su cantón | Según asignación | Según asignación | Identifica/evalúa oportunidades (no administra) | Las que coordina | — | — | **Fuera de su territorio: sin acceso automático a nada** |
| L0 USUARIO | — | — | — | — | — | — | — | Sus proyectos (EP-4E) | Sus recursos | Eje de negocio, no administrativo |

---

## 14. Matriz de Credenciales Administrativas

| Credencial ID | Persona/Rol | Tipo actual | Tipo futuro | Estado | Uso | Alcance | Fecha de alta | Revocable | Reemplazable | Requiere segunda autorización | Auditoría |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **ML-001-D** | Fundador (L5) | MANUAL | FIDO2/WebAuthn | Activa | Uso diario | Global (autenticación, no permisos) | A registrar | Sí | Sí | Para revocar/reemplazar (otro rol firma) | Total |
| **ML-001-E** | Fundador (L5) | MANUAL | FIDO2/WebAuthn | Sellada/activa | **Emergencia (break-glass)** | Global | A registrar | Sí | Sí | Uso → alarma + revisión posterior obligatoria | Total + revisión |
| ML-002-D | Administrador (L4) | MANUAL | FIDO2/WebAuthn | Proyectada | Uso diario | Operativo | Pendiente | Sí | Sí | Alta/revocación con doble firma | Total |
| ML-003-D | Economista (L3) | MANUAL | FIDO2/WebAuthn | Proyectada | Uso diario | Económico asignado | Pendiente | Sí | Sí | Ídem | Total |
| ML-004-D | Auditor/Contable (L3) | MANUAL | FIDO2/WebAuthn | Proyectada | Uso diario | Por caso | Pendiente | Sí | Sí | Ídem | Total |
| ML-005-D | Especialista Técnico (L3) | MANUAL | FIDO2/WebAuthn | Proyectada | Uso diario | Técnico | Pendiente | Sí | Sí | Ídem | Total |
| ML-006-D | Coord. Territorial (L2) | MANUAL | FIDO2/WebAuthn | Proyectada | Uso diario | Territorial asignado | Pendiente | Sí | Sí | Ídem | Total |

Notas:

- `ML-00x-E` (emergencia adicional) solo se crea por decisión explícita; la regla break-glass aplica igual.
- Una credencial **autentica**; nunca porta permisos. El alcance mostrado es el del rol asociado, no de la credencial.
- Transición FIDO2: la tabla queda lista — `tipo_futuro` es columna de destino, no de implementación. **FIDO2 no se implementa en esta fase.**

---

## 15. Integración con la arquitectura existente

| Capa existente | Relación con esta matriz |
|---|---|
| Tres ejes de rol (`ADMINISTRACION.md` §3) | Esta matriz define el **eje administrativo/organizativo**; perfil y rol-de-proyecto intactos |
| Plano de control (doc 02 §7.1: Operador, Custodio, Propietario, Desarrollador, Infraestructura, Auditor) | Los roles L cubren gobierno+operación; los roles de doc 02 cubren el plano técnico-criptográfico. Las correspondencias indicadas (Fundador≈Propietario, Especialista≈Desarrollador, Administrador≈Operador) son **conceptuales/ilustrativas — no conceden permisos** entre taxonomías (PC-01, resuelto 2026-10-08) |
| EP-4E | Sin cambio: los L-roles no son roles de proyecto; un admin con alcance-proyecto no es participante |
| F7a/F7a.1 (sesión) | La credencial administra *autenticación administrativa*; la sesión/dispositivo sigue siendo de F7a.1 (30 d, RT en backend, snapshot 72 h) — sin segunda lógica de sesión |
| Docs 05–08 (offline) | Condiciones offline de §9 heredan la máquina de estados, cola, prioridades y confirmación de servidor ya especificadas |
| Módulo 11 (evidencias/D5) | Capa transversal obligatoria de evidencia para auditoría, resolución y órdenes firmadas |
| `shared/audit/` (ADM-2) | Infraestructura de log transversal que esta matriz consume; `admin/auditoria/` es solo superficie de consulta |

## 16. Contradicciones y decisiones pendientes

Resueltas por decisión aprobada 2026-10-08: **PC-01, PC-02, PC-06** (texto de resolución en cada fila). El resto permanece registrado, **no resuelto**:

| # | Tema | Tensión detectada | Estado |
|---|---|---|---|
| **PC-01** | Taxonomía de roles | Tres vocabularios administrativos coexisten: L0–L5 (este doc), plano de control doc 02 §7.1 (Operador/Custodio/Propietario/Desarrollador/Infraestructura/Auditor) y roles admin de `ADMINISTRACION.md` §3 (administrador/soporte/operador/auditor de plataforma/seguridad). Falta el mapeo canónico entre ejes | **RESUELTO 2026-10-08** — las tres taxonomías son **independientes por diseño**: (1) rol administrativo = gobierno/responsabilidades/permisos admin; (2) rol del control plane = seguridad/infraestructura/gobierno técnico; (3) rol EP-4E = capacidades dentro de un proyecto concreto (asignado por el propietario/responsable del proyecto). **No existe equivalencia automática** — Coordinador territorial ≠ técnico EP-4E; técnico EP-4E ≠ administrador MELANTIA; auditor de proyecto ≠ Auditor MELANTIA. Las correspondencias conceptuales de §15 son ilustrativas, no conceden permisos; un mapeo formal no se requiere salvo decisión futura |
| **PC-02** | Credencial MANUAL vs FIDO2 | Doc 02 §7.2 ya prescribe "MFA obligatorio con hardware security keys (FIDO2)" para toda cuenta administrativa; este diseño usa credencial MANUAL en el MVP con FIDO2 a ~6 meses. ¿Se difiere el requisito MFA/FIDO2 para admin durante el MVP o se mantiene como condición de entrada? | **RESUELTO 2026-10-08** — MVP: credencial **manual segura**. FIDO2/WebAuthn queda para la etapa prevista (~6 meses), sin convertirse en requisito de entrada del MVP; la arquitectura ya lo admite. La prescripción FIDO2 de doc 02 §7.2 queda **SUPERADA para el MVP** (se conserva como objetivo posterior). FIDO2 modifica el mecanismo de **autenticación**, **no** el modelo de autorización: `IDENTIDAD + ROL + PERMISO + ALCANCE + CONDICIÓN DE SEGURIDAD = AUTORIZACIÓN EFECTIVA` |
| **PC-03** | Colisión de nombre "Auditor" | AUDITOR/CONTABLE (L3, negocio/finanzas) ≠ Auditor del plano de control (solo lectura de `audit_eventos`) ≠ rol `auditor` de proyecto en EP-4E. Tres "auditores" distintos | **PENDIENTE DE DECISIÓN** (renombrar o namespacing) |
| **PC-04** | ML-001-E ↔ break-glass | La credencial de emergencia corresponde al concepto break-glass de doc 02 §7.2 (uso dispara alarma + revisión). Falta formalizar si ML-001-E **es** la cuenta break-glass del Fundador o un mecanismo paralelo | **PENDIENTE DE DECISIÓN** |
| **PC-05** | Alcance "Puerto MELANTIA" | Tipo de alcance nuevo, sin definición previa en ningún documento (qué es un Puerto, su modelo de propiedad/operación, su relación con Organización/Proyecto) | **PENDIENTE DE DECISIÓN** |
| **PC-06** | Aprobaciones económicas offline | La regla "sin operaciones financieras críticas offline" de §9 es compatible con ambas resoluciones de **RC-01** (doc 08), pero la autoridad del Economista para "aprobar determinadas operaciones" solo puede ejecutarse online — hereda la decisión RC-01 sin cerrarla | **RESUELTO 2026-10-08** — el Economista **no** aprueba ni ejecuta operaciones financieras de usuarios (ni mueve dinero, ni autoriza pagos/transferencias/créditos, ni modifica saldos/credenciales/reglas de seguridad). «Aprobar determinadas operaciones» se limita al dominio económico **interno** (§5.3, §18) y solo online. RC-01 quedó resuelto a favor de encolado financiero del *usuario* (ACEPTADA_OFFLINE); las aprobaciones administrativas de §9 siguen siendo online-only. Cadena de incidente financiero: `USUARIO → SISTEMA → ADMINISTRADOR → ECONOMISTA (cuando corresponda) → PROVEEDOR FINANCIERO → AUDITOR/FUNDADOR según gravedad` |
| **PC-07** | Identidad L0 vs eje usuario | L0 USUARIO es el eje `usuarios` de negocio; incluirlo como "rol administrativo L0" podría mezclar ejes. Alternativa: L0 se considera el sujeto base sobre el que pueden añadirse roles admin | **PENDIENTE DE DECISIÓN** (editorial/conceptual) |
| **PC-08** | Coordinador Territorial en módulo admin | El Coordinador no es administrador del sistema (no puede modificar nada); su inclusión en el módulo administrativo es como *rol gobernado* (alta/alcance/revocación auditados), no como *rol administrador*. Confirmar esta lectura | **PENDIENTE DE DECISIÓN** (confirmación) |
| **PC-09** | Triple control | El umbral exacto "criticidad extrema" que dispara el tercer firmante no está parametrizado — la matriz §18 lo marca caso por caso pero falta la regla de clasificación | **PENDIENTE DE DECISIÓN** |

## 17. Módulo

Nombre oficial (exacto):

> **Módulo de Gestión de Credenciales y Autorizaciones Administrativas**

(No utilizar "Módulo de Producción de Llaves": MELANTIA no fabrica llaves físicas.)

Administrará conceptualmente: identidades administrativas · credenciales · roles · permisos · alcances · autorizaciones · revocaciones · historial · auditoría.

## 18. Lista de verificación

| Verificación | Estado |
|---|---|
| Todos los roles definidos incluidos (L5, L4, L3×3, L2, L0) | ✅ 7 roles |
| Fundador con dos credenciales (ML-001-D + ML-001-E, separadas) | ✅ §3.3, §14 |
| Coordinador sin acceso financiero | ✅ §5.6, §11, §13 |
| Coordinador no puede aprobar operaciones financieras | ✅ §5.6 lista cerrada, §11 "Puede aprobar: —" |
| Auditor: observar/analizar/registrar/resolver según alcance, sin administrar | ✅ §5.4, §11 |
| Economista: consultar/analizar/resolver/aprobar determinadas operaciones **del dominio económico interno** según matriz (nunca operaciones financieras de usuarios — PC-06) | ✅ §5.3, §11, §12 |
| Cambios críticos con doble autorización | ✅ §6, §12 |
| Alcance territorial separado del rol | ✅ §8, §13 |
| Restricciones offline | ✅ §9, §11 |
| Módulo 11 como capa de evidencias | ✅ §5.4, §10, §12 |
| FIDO2 como futuro, no implementado | ✅ §3.1, §14 |
| Nombre oficial del módulo respetado | ✅ §17 |

## 19. Fuera de alcance (no implementar)

Código · SQL · migraciones · endpoints · frontend · FIDO2/WebAuthn · cambios de autenticación · cambios de autorización · cambios de seguridad · resolución de las decisiones pendientes §16 restantes (PC-03, PC-04, PC-05, PC-07, PC-08, PC-09).

---

**ESTADO: LISTO PARA REVISIÓN DEL FUNDADOR**

**CHECKPOINT:** código: **sin cambios** · BD: **sin cambios** · migraciones: **ninguna** · config: **sin cambios** · FIDO2/WebAuthn: **no implementado** · docs harmonizados 2026-10-08 (solo Markdown): 05–08, 17, 21 y master · commit: **NO**.
