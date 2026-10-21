# MELANTIA — Especificación de Seguridad Offline y Modo Supervivencia

> Documento de **decisión arquitectónica aprobada**. Define la política que deberá cumplir la implementación futura.
> **Esta especificación NO autoriza modificar código.** Nada de lo aquí descrito está implementado salvo que se indique expresamente.
> Referencia de implementación existente (solo lectura): `melantia_old_version/src/utils/supervivencia.py`.
> Complementa `02_DISENO_ARQUITECTURA_SEGURIDAD.md` (snapshot offline, outbox, cifrado) y `04_REVISION_CRUZADA_Y_DECISIONES_PENDIENTES.md` (F-05, cola offline, caché de lectura).
> Actualización 2026-10-08: harmonización por decisiones aprobadas — RC-01 (carril financiero, §2/§11), RC-04 (vigencia diferenciada, §11/§15) y RC-06 (datos móviles + energía, §7/§9). Referencia de resoluciones: `08_MATRIZ_DECISIONES_OFFLINE_Y_SUPERVIVENCIA.md`.

| Campo | Valor |
|---|---|
| **Decisión** | Seguridad Offline y Modo Supervivencia |
| **Estado** | **APROBADA — Diseño arquitectónico** |
| **Fecha de registro** | 2026-10-05 |
| **Ámbito** | Plataforma Offline First para usuarios rurales |
| **Autorización de implementación** | **NO** — pendiente de aprobación explícita |

---

## 1. Principio fundamental

> **"Offline First no significa ejecutar todo Offline."**

MELANTIA permite al usuario:

- trabajar sin conectividad;
- registrar información;
- conservar información localmente;
- preparar operaciones;
- poner operaciones en cola;
- sincronizar posteriormente.

Pero una operación financiera o crítica que requiera autorización del servidor **NO puede presentarse como ejecutada** hasta recibir una confirmación válida.

**Regla:**

> **"Offline permite registrar, preparar y conservar; Online permite validar, sincronizar y confirmar las operaciones que requieren autoridad del servidor o de un proveedor externo."**

---

## 2. Estados de operaciones

Las operaciones transitan como mínimo por los siguientes estados:

| Estado | Significado |
|---|---|
| `BORRADOR` | Operación en edición local, aún no preparada para envío |
| `PREPARADA_OFFLINE` | Operación completa y validada localmente, lista para encolar |
| `PENDIENTE_SINCRONIZACION` | En cola Offline, esperando oportunidad de conectividad |
| `ENVIADA` | Transmitida al servidor, sin confirmación todavía |
| `VALIDANDO` | Recibida por el servidor/proveedor, en proceso de autorización |
| `CONFIRMADA` | Confirmada por la autoridad correspondiente — única forma de "ejecutada" |

**Regla estricta:** solo `CONFIRMADA` puede representar una operación ejecutada.

No se utilizarán estados visuales como *Pagado*, *Transferido*, *Cobrado*, *Recibido*, *Retirado* ni *Completado* cuando únicamente exista información local pendiente.

**Extensión del carril financiero (RC-01, aprobada 2026-10-08):** las operaciones financieras recorren el flujo ampliado definido en §11:

```text
BORRADOR → PREPARADA_OFFLINE → ACEPTADA_OFFLINE
→ PENDIENTE_CONFIRMACION_RED → ENVIADA → VALIDANDO → CONFIRMADA
```

con ramas de resolución `RECHAZADA`, `CONFLICTO` y `REQUIERE_REVISION`. La unificación del vocabulario general de estados permanece abierta (RC-05, doc 08).

---

## 3. Modo Supervivencia

El Modo Supervivencia existe para **minimizar el consumo energético** del dispositivo.

El Modo Supervivencia **NO debe**:

- mantener procesos permanentemente activos;
- realizar polling continuo;
- comprobar Internet cada pocos segundos;
- despertar innecesariamente la aplicación;
- sincronizar todo de golpe;
- ejecutar procesos pesados innecesarios.

El Modo Supervivencia **debe** utilizar los mecanismos disponibles del sistema operativo para procesos en segundo plano (schedulers del SO, trabajos diferidos, alarmas del sistema), en lugar de bucles propios de comprobación.

---

## 4. Política de batería

**Umbral aprobado: 50 %. Este umbral NO se cambia.**

| Condición | Política |
|---|---|
| Batería ≥ 50 % | Sincronización normal según política; procesos de optimización permitidos; procesamiento normal de documentos/imágenes según prioridad |
| Batería < 50 % | Priorizar operaciones críticas; evitar procesos pesados; evitar compresión/procesamiento masivo; evitar cargas innecesarias |
| Conectado a fuente de energía | Se permite ampliar las operaciones de sincronización de acuerdo con las demás políticas |

---

## 5. Calendario de búsqueda de conectividad

Valores aprobados (registrar exactamente):

**Días:**

- Lunes
- Jueves
- Viernes
- Sábado
- Domingo

**Horarios:**

- 10:00
- 13:00
- 16:00
- 19:00
- 00:00

Cada horario constituye una **ventana de búsqueda**. Cada ventana realiza **5 intentos** de búsqueda de conectividad, con **10 minutos de separación** entre intentos.

Ejemplo (ventana de las 10:00):

```
10:00 → intento 1
10:10 → intento 2
10:20 → intento 3
10:30 → intento 4
10:40 → intento 5
```

**Regla de parada temprana:** si durante la ventana se consigue una sincronización exitosa:

- detener inmediatamente los intentos restantes;
- registrar la sincronización exitosa;
- no continuar buscando en esa misma ventana.

---

## 6. Sincronización diaria

MELANTIA debe procurar **al menos una sincronización exitosa por día** cuando exista una oportunidad real de conectividad.

Distinción obligatoria:

| Concepto | Definición |
|---|---|
| **Conectividad detectada** | Hay red disponible (Wi-Fi/datos). NO cuenta como sincronización |
| **Sincronización exitosa** | Existe confirmación válida del servidor |

Una conexión disponible NO cuenta automáticamente como sincronización exitosa. Debe existir confirmación válida del servidor.

Campos conceptuales a registrar:

- `ultima_sincronizacion_exitosa`
- `fecha_ultima_sincronizacion`

---

## 7. Excepción Wi-Fi + energía

Si se cumplen simultáneamente:

- **Wi-Fi disponible**, y
- **dispositivo conectado a fuente de energía**,

MELANTIA puede sincronizar **independientemente del día y la hora** establecidos en el calendario (§5). Esta condición constituye una **oportunidad especial de sincronización**.

**Precisión (RC-06, aprobada 2026-10-08):** la excepción completa —sincronización completa en cualquier día/hora— aplica únicamente a **Wi-Fi + fuente de energía**. La condición **datos móviles + fuente de energía** habilita únicamente *sincronización controlada* (§9): prioriza P1/P2 y evita transferencias pesadas no urgentes. **No** es equivalente a Wi-Fi + energía.

---

## 8. Prioridades de sincronización

Tres niveles de prioridad:

### PRIORIDAD 1 — Crítica/Urgente

- operaciones financieras;
- transacciones;
- pedidos;
- confirmaciones críticas;
- operaciones con vencimiento;
- eventos críticos de seguridad.

### PRIORIDAD 2 — Operacional/Comercial

- publicaciones;
- Marketplace;
- reservas;
- servicios;
- catálogos;
- solicitudes;
- operaciones comerciales.

### PRIORIDAD 3 — Campo/Documentación

- cultivos;
- mediciones;
- GPS;
- levantamientos;
- trazabilidad;
- informes;
- fotografías;
- documentos;
- evidencias.

---

## 9. Matriz conectividad × batería

| Condición | Política |
|---|---|
| Wi-Fi + batería ≥ 50 % | Sincronización normal |
| Wi-Fi + batería < 50 % | Prioridades + procesos ligeros |
| Wi-Fi + fuente de energía | Sincronización permitida independientemente del calendario |
| Datos móviles + batería ≥ 50 % | Operaciones autorizadas según política |
| Datos móviles + batería < 50 % | Solo operaciones prioritarias |
| Datos móviles + fuente de energía | **Sincronización CONTROLADA** — prioriza P1/P2; evita transferencias pesadas no urgentes; NO equivale a Wi-Fi + energía (RC-06) |
| Sin conexión | Almacenamiento local y cola Offline |

---

## 10. Operaciones comerciales sin cobertura

Si existen operaciones comerciales pendientes y no hay cobertura:

- **NO** enviar notificaciones repetitivas.
- Mostrar aviso contextual únicamente cuando tenga sentido — por ejemplo, al entrar en Negocios Rurales:

> "Operación pendiente.
> Esta operación requiere conexión de red para continuar."

El usuario debe poder seguir utilizando las funciones Offline que no requieren servidor.

---

## 11. Operaciones financieras

MELANTIA puede:

- preparar;
- almacenar;
- poner en cola;
- enviar cuando exista conectividad.

MELANTIA **no puede** declarar una operación como:

- pagada;
- transferida;
- cobrada;
- recibida;
- retirada;

hasta obtener **confirmación válida** del proveedor autorizado.

**Flujo canónico de la operación financiera (RC-01, aprobada 2026-10-08):**

```text
BORRADOR → PREPARADA_OFFLINE → ACEPTADA_OFFLINE
→ PENDIENTE_CONFIRMACION_RED → ENVIADA → VALIDANDO → CONFIRMADA
```

Ramas de resolución: `RECHAZADA` · `CONFLICTO` · `REQUIERE_REVISION`.

- `ACEPTADA_OFFLINE`: el usuario sella la operación sin conectividad. La aceptación offline es **irrevocable por el usuario** — no puede deshacerse localmente; solo se resuelve por una resolución válida.
- `ACEPTADA_OFFLINE` **no significa** pagada, transferida, cobrada, retirada ni liquidada, ni confirmada por un proveedor financiero.
- `PENDIENTE_CONFIRMACION_RED`: la operación permanece en la cola persistente y se sincroniza automáticamente cuando existe conectividad válida.
- `CONFIRMADA` solo se alcanza tras la validación/autorización del servidor y, cuando aplique, del proveedor financiero autorizado.
- **Vigencia (RC-04, aprobada 2026-10-08):** una operación financiera en `ACEPTADA_OFFLINE` **no expira por TTL**; permanece almacenada hasta una resolución válida (`CONFIRMADA`, `RECHAZADA`, `CONFLICTO`, `CANCELADA_CONFIRMADA` con la evidencia requerida, u otra formalmente aprobada). El TTL por plan de F7a.1 queda excluido de esta categoría (§15).

**Principio:**

> **"MELANTIA administra la operación; el proveedor financiero autorizado administra el dinero."**

**No implementar todavía** (arquitectura financiera futura):

- Wallet;
- custodia;
- escrow;
- retiros;
- transferencias;
- crédito;
- pagos protegidos.

La comisión MELANTIA del **3 %** permanece **separada** de las comisiones del proveedor financiero.

---

## 12. Fotografías e imágenes

MELANTIA **NO debe destruir ni reemplazar la fotografía original** para reducir tamaño.

Separación conceptual obligatoria:

```
FOTOGRAFÍA ORIGINAL
├── original preservado
├── miniatura
├── versión optimizada MELANTIA
└── versión de distribución/compartir
```

| Versión | Uso |
|---|---|
| **Original** | Evidencia, trazabilidad, auditoría, descarga, preservación |
| **Optimizada** | Interfaz, documentos, trazabilidad, Marketplace, catálogos, carga rápida |
| **Distribución** | WhatsApp, compartir, correo, otras aplicaciones externas |

La versión compartida debe conservar suficiente resolución para una correcta visualización fuera de MELANTIA.

---

## 13. Integridad de documentos y evidencias

Para documentos y evidencias importantes:

- **SHA-256**
- **versionado**
- **auditoría**
- **integridad**

El SHA-256 de referencia debe corresponder al **archivo original preservado**. Las versiones optimizadas son derivaciones y **no sustituyen al original**.

---

## 14. Separación PostgreSQL / Storage

| Capa | Contenido |
|---|---|
| **PostgreSQL** | metadatos, propietario, creador, tipo, fecha, relaciones, versión, estado, hash, permisos, auditoría |
| **Storage** | archivos físicos, originales, versiones, evidencias |

**No implementar todavía** el nuevo sistema de Storage.

---

## 15. Cola Offline

La futura cola deberá soportar conceptualmente los campos:

- `id`
- `tipo_operacion`
- `prioridad`
- `fecha_creacion`
- `estado`
- `intentos`
- `ultima_tentativa`
- `idempotency_key`
- `payload`
- `dependencias`
- `error`
- `fecha_actualizacion`

**Regla de preservación:** NO eliminar automáticamente operaciones pendientes simplemente por alcanzar un límite arbitrario de registros. Los datos pendientes deben preservarse.

**Política de vigencia diferenciada (RC-04, aprobada 2026-10-08):**

- **Operaciones financieras `ACEPTADA_OFFLINE`:** sin expiración automática por TTL — permanecen almacenadas hasta una resolución válida (§11).
- **Resto de operaciones de cola:** pueden conservar reglas de vigencia/TTL según su naturaleza, plan o política (F7a.1: 15 días base / 45 días en planes ≥ $15 y Proyectos; el ítem expirado queda marcado `expirado_sin_sincronizar`, visible al operario, nunca borrado en silencio).
- **Datos de campo/evidencias:** nunca se eliminan automáticamente por antigüedad.

**No implementar todavía** esta cola.

---

## 16. Preservación y recuperación

Principio de seguridad ante incidentes:

> **"detectar → bloquear → preservar → investigar → recuperar"**

Nunca:

> ~~"detectar → destruir datos"~~

MELANTIA **NO utilizará autodestrucción** como mecanismo de seguridad.

---

## 17. Notificaciones

Las notificaciones deben ser **contextuales y no invasivas**.

Ejemplos aprobados:

| Contexto | Mensaje |
|---|---|
| Operación comercial | "Operación pendiente. Necesitas conexión de red para continuar." |
| Financiera | "Transacción en proceso. Estamos esperando conexión para completar la operación." |
| Confirmación | "Transacción realizada. Operación confirmada correctamente." |
| Sincronización | "MELANTIA sincronizó correctamente tus datos." |

---

## 18. Estado actual vs. especificación aprobada

Referencia analizada (solo lectura): `melantia_old_version/src/utils/supervivencia.py` (111 líneas). En el repositorio actual (`melantia/`) **no existe** un módulo equivalente.

### 18.1 Capacidades ya existentes (parcialmente alineadas)

| Capacidad | Implementación actual | Brecha con la especificación |
|---|---|---|
| Control de batería | `verificar_estado_celular()` con `psutil` | Umbral `LIMITE_BATERIA = 15`; la especificación exige **50 %** |
| Detección de enchufado | `bateria.power_plugged` | Existe, pero sin política de ampliación de sincronización |
| Cola local Offline | `guardar_evidencia_offline()` → `cola_offline.json` | Sin prioridades, sin `idempotency_key`, sin estados completos |
| Detección de conectividad | `verificar_modo_offline()` vía `ping` a google.com | Ping ≠ sincronización exitosa; falta confirmación del servidor |
| Estado `pendiente_sincronizacion` | único estado en cola | Faltan `BORRADOR`, `PREPARADA_OFFLINE`, `ENVIADA`, `VALIDANDO`, `CONFIRMADA` |
| Procesamiento diferido de evidencias | `procesar_evidencia_inteligente()` pospone foto si batería baja | Coherente en espíritu; umbral incorrecto |

### 18.2 Capacidades no implementadas (inexistentes en el código actual)

- Calendario de búsqueda de conectividad (días/horarios/ventanas de §5).
- Intentos por ventana (5 intentos × 10 min) ni parada temprana tras éxito.
- Registro de `ultima_sincronizacion_exitosa` / `fecha_ultima_sincronizacion`.
- Distinción conectividad detectada vs. sincronización exitosa.
- Tres prioridades de sincronización (§8).
- Matriz conectividad × batería completa (§9) — no distingue Wi-Fi de datos móviles.
- Excepción Wi-Fi + energía como oportunidad especial (§7) — solo hay chequeo genérico de enchufado.
- Versionado de fotografías (original / miniatura / optimizada / distribución) (§12).
- SHA-256, versionado y auditoría de evidencias (§13).
- Separación metadatos (PostgreSQL) / archivos (Storage) (§14).
- Campos de cola: `idempotency_key`, `intentos`, `ultima_tentativa`, `dependencias`, `error` (§15).
- Notificaciones contextuales (§17) — la implementación actual usa `print` de consola.
- Estados de operación completos y prohibición de estados visuales engañosos (§2).
- Uso de schedulers del SO en lugar de procesos propios (§3) — el código actual es síncrono por invocación, no define política de segundo plano.

### 18.3 Diferencias y riesgos detectados

| # | Hallazgo | Riesgo | Disposición |
|---|---|---|---|
| D-01 | `LIMITE_BATERIA = 15` vs. umbral aprobado **50 %** | Procesos pesados permitidos con batería muy baja | Corregir en implementación futura |
| D-02 | `guardar_evidencia_offline(max_registros=100)` **trunca la cola** descartando los registros más antiguos (`cola = cola[-max_registros:]`) | **Pérdida silenciosa de datos pendientes** — contradice directamente §15 ("NO eliminar automáticamente") | **Riesgo alto.** Prohibido en la implementación futura |
| D-03 | `ping google.com` como prueba de conectividad | Ping exitoso no implica servidor MELANTIA alcanzable ni confirmación válida | Sustituir por verificación contra el servidor |
| D-04 | Cola en JSON plano sin cifrado ni clasificación | Coherente con hallazgo F-05 de `01_AUDITORIA_SEGURIDAD.md` (caché offline sin cifrar) | Resolver con la política de cifrado de datos en cola |
| D-05 | `except:` desnudo en `verificar_estado_celular()` devuelve `True` | Ante fallo de medición se asume batería plena → procesos pesados posibles con batería real baja | Definir comportamiento fail-safe en implementación futura |
| D-06 | `ejecutar_proceso_seguro()` es una barra de progreso simulada | No realiza procesamiento real; riesgo de confundir simulación con implementación | Documentado; reemplazar por procesamiento real |
| D-07 | Sin protección contra ejecuciones concurrentes de la cola | Escrituras simultáneas a `cola_offline.json` pueden corromper el archivo | Diseñar cola con atomicidad/idempotencia |
| D-08 | Sin distinción de tipo de red (Wi-Fi vs. datos móviles) | Imposible aplicar la matriz de §9 | Añadir detección de tipo de red |

### 18.4 Capacidades existentes fuera del alcance de la especificación

- `barra_progreso_ligera()`, `ejecutar_proceso_seguro()`, `activar_modo_nocturno()`, `desactivar_modo_nocturno()` — utilidades de terminal de bajo consumo; no cubiertas por esta especificación ni en conflicto con ella.

**Nota:** esta sección es estrictamente comparativa. `supervivencia.py` **no fue modificado, corregido ni refactorizado** durante esta documentación.

---

## 19. Pendientes de implementación

Detectados durante la documentación — todos en estado **PENDIENTE DE IMPLEMENTACIÓN**, sin autorización de código:

| # | Pendiente | Sección |
|---|---|---|
| P-01 | Motor de sincronización con calendario, ventanas, intentos y parada temprana | §5, §6 |
| P-02 | Máquina de estados de operaciones (`BORRADOR` → `CONFIRMADA`) | §2 |
| P-03 | Cola Offline con esquema completo, idempotencia y preservación garantizada | §15 |
| P-04 | Política de batería con umbral 50 % y excepción de fuente de energía | §4, §7 |
| P-05 | Detección de tipo de red (Wi-Fi/datos) y matriz de políticas | §9 |
| P-06 | Versionado de imágenes (original/miniatura/optimizada/distribución) | §12 |
| P-07 | Integridad SHA-256 + versionado + auditoría de evidencias | §13 |
| P-08 | Separación metadatos PostgreSQL / archivos Storage | §14 |
| P-09 | Sistema de notificaciones contextuales no invasivas | §10, §17 |
| P-10 | Corrección del truncado de cola (`max_registros`) y del umbral de batería | §18 (D-01, D-02) |
| P-11 | Verificación de sincronización exitosa contra servidor (no ping) | §6, §18 (D-03) |
| P-12 | Integración con schedulers del SO para procesos en segundo plano | §3 |
| P-13 | Arquitectura financiera futura (Wallet, custodia, escrow, etc.) — explícitamente fuera de alcance por ahora | §11 |

---

## 20. Regla de no implementación

Este documento es una **especificación aprobada**, no una autorización de ejecución. Toda capacidad descrita requiere aprobación explícita antes de implementarse. Las mejoras detectadas se registran en §19 como **PENDIENTE DE IMPLEMENTACIÓN**.

---

## 21. Resumen de separación

| Plano | Estado |
|---|---|
| **Decisión arquitectónica** | APROBADA — este documento es la fuente de verdad del diseño |
| **Implementación actual** | `melantia_old_version/src/utils/supervivencia.py` — parcial, con divergencias documentadas en §18 |
| **Implementación futura** | Debe cumplir íntegramente esta especificación |
| **Pendientes** | Lista P-01…P-13 en §19 — ninguno autorizado aún |
