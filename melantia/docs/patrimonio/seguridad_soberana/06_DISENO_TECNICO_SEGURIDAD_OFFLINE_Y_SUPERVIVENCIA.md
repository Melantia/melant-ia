# 06 — Diseño Técnico de Seguridad Offline y Modo Supervivencia

> Documento de **diseño técnico**, derivado de `05_ESPECIFICACION_SEGURIDAD_OFFLINE_Y_SUPERVIVENCIA.md` (decisión APROBADA).
> **SOLO DISEÑO — NADA IMPLEMENTADO NI AUTORIZADO A IMPLEMENTARSE.** Sin código, migraciones, dependencias ni configuración tocados.
> Fecha: 2026-10-05 · Base normativa: doc 05 · Relacionados: `02_DISENO_ARQUITECTURA_SEGURIDAD.md` (snapshot offline F7a, outbox, cifrado), `04_REVISION_CRUZADA_Y_DECISIONES_PENDIENTES.md` (F-05, CR-03), `e0_supabase/18_DISENO_D5_STORAGE.md` (Storage/evidencias).
> Actualización 2026-10-08: harmonización por decisiones aprobadas — RC-01 (carril financiero, §6.1a), RC-04 (vida de la operación, §5.2) y RC-06 (datos móviles + energía, §14). Referencia: `08_MATRIZ_DECISIONES_OFFLINE_Y_SUPERVIVENCIA.md`.

---

## 0. Mapa de componentes

La especificación 05 se descompone en **13 componentes** de diseño:

```text
                        ┌─────────────────────────────┐
                        │   MOTOR DE SUPERVIVENCIA     │  orquestador de bajo consumo
                        │  (schedulers del SO/PWA)     │
                        └──────┬──────────────┬───────┘
                               │ consulta     │ consulta
              ┌────────────────▼───┐   ┌──────▼──────────────┐
              │ GESTOR DE          │   │ GESTOR DE BATERÍA   │
              │ CONECTIVIDAD       │   │ (umbral 50 %)       │
              │ (calendario §5)    │   └─────────────────────┘
              └────────┬───────────┘
                       │ oportunidad de sincronización
                       ▼
              ┌─────────────────────────────┐     ┌──────────────────────────┐
              │   MOTOR DE SINCRONIZACIÓN   │────►│ CONFIRMACIÓN SERVIDOR /  │
              │   (ventanas, reintentos)    │     │ PROVEEDOR (autoridad)    │
              └──────┬──────────────┬───────┘     └──────────────────────────┘
                     │              │
        ┌────────────▼──┐   ┌───────▼────────┐   ┌────────────────────────┐
        │  COLA OFFLINE │   │ PRIORIZACIÓN   │   │ MÁQUINA DE ESTADOS     │
        │  (outbox)     │   │ P1 / P2 / P3   │   │ BORRADOR → CONFIRMADA  │
        └──────┬────────┘   └────────────────┘   └────────────────────────┘
               │ soportada por
   ┌───────────▼──────────┬───────────────────┬─────────────────────────┐
   │ IDEMPOTENCIA         │ GESTIÓN DE        │ SEGURIDAD OFFLINE       │
   │ (idempotency_key)    │ DEPENDENCIAS      │ (cifrado, integridad)   │
   └──────────────────────┴───────────────────┴─────────────────────────┘

   Flujo de archivos:
   ┌──────────────────┐   ┌────────────────────────┐
   │ STORAGE ARCHIVOS │◄──│ PROCESAMIENTO IMÁGENES │
   │ (originales +    │   │ (original / miniatura /│
   │  versiones)      │   │  optimizada / distrib.)│
   └──────────────────┘   └────────────────────────┘
```

---

## 1. Motor de Supervivencia

**Responsabilidad:** orquestar cuándo MELANTIA despierta, busca conectividad y sincroniza, minimizando consumo energético. Es el único componente autorizado a programar trabajo en segundo plano.

### 1.1 Decisiones de diseño

| Decisión | Diseño |
|---|---|
| No hay daemon propio | El motor **no es un proceso residente**; delega el despertar al SO |
| Web/PWA | Periodic Background Sync API donde exista; fallback: chequeo al abrir la app + Service Worker `sync` events |
| App nativa/shell (futuro) | WorkManager (Android) / BGTaskScheduler (iOS) |
| Sin polling | Prohibido `setInterval`/`setTimeout` de comprobación de red; se usan eventos `online`/`offline` y ventanas programadas |

### 1.2 Interfaz conceptual

```text
MotorSupervivencia
├── registrar_ventanas()          → arma el calendario §5 del doc 05
├── evaluar_oportunidad()         → ¿hay que buscar ahora? (calendario / evento / excepción)
├── solicitar_ventana_sync()      → pide al Motor de Sincronización ejecutar
└── registrar_resultado(r)        → parada temprana, métricas, ultima_sincronizacion_exitosa
```

### 1.3 Reglas heredadas del doc 05

- Nunca despierta fuera de: ventanas del calendario, excepción Wi-Fi+energía, evento `online` del SO, o apertura de la app por el usuario.
- Cada evaluación es O(1): lee estado almacenado, no ejecuta trabajo pesado para decidir.

---

## 2. Gestor de Conectividad

**Responsabilidad:** responder dos preguntas distintas que el doc 05 separa explícitamente.

```text
GestorConectividad
├── estado_red()              → { sin_conexion | wifi | datos_moviles }
│                                fuente: Network Information API + eventos online/offline;
│                                nunca ping a terceros (corrige D-03 del doc 05 §18)
├── servidor_alcanzable()     → HEAD/GET ligero al endpoint /health del backend MELANTIA
│                                con timeout corto (≤5 s)
└── registrar_ventana_busqueda() → ejecuta los 5 intentos × 10 min de la ventana activa
```

**Diseño clave — dos niveles:**

| Nivel | Significado | Cuenta como sync |
|---|---|---|
| `conectividad_detectada` | El SO reporta red | NO |
| `sincronizacion_exitosa` | Backend confirmó recepción válida | SÍ |

- Los 5 intentos de una ventana los agenda el Motor de Supervivencia (alarmas), no un bucle.
- Parada temprana: el primer `sincronizacion_exitosa` cancela los intentos restantes de la ventana (doc 05 §5).
- El gestor nunca decide *qué* se sincroniza; solo reporta oportunidad.

---

## 3. Gestor de Batería

**Responsabilidad:** clasificar el estado energético y exponer una política binaria consultable por los demás componentes.

```text
GestorBateria
├── estado() → {
│     nivel_pct: int|null,          # Battery Status API; null si no disponible
│     enchufado: bool|null,
│     modo: "NORMAL" | "AHORRO" | "INDETERMINADO"
│   }
└── permite(categoria_trabajo) → bool
     NORMAL       → todo permitido
     AHORRO       → solo P1 + procesos ligeros; prohibido pesado/masivo
     INDETERMINADO → fail-safe: tratar como AHORRO (corrige D-05 del doc 05 §18)
```

| Umbral | Regla |
|---|---|
| ≥ 50 % | `NORMAL` |
| < 50 % | `AHORRO` (prioridades + ligero) |
| enchufado | amplía operaciones; con Wi-Fi habilita la excepción §7 del doc 05 |
| sin lectura de batería | `INDETERMINADO` → fail-safe conservador, **nunca** asumir plena |

El umbral **50 % es constante de especificación** — no configurable, no parametrizable por build.

---

## 4. Motor de Sincronización

**Responsabilidad:** ejecutar una sesión de sincronización cuando el Motor de Supervivencia lo autoriza, drenando la cola en orden de prioridad y dependencias.

### 4.1 Ciclo de una sesión de sync

```text
inicio_sesion_sync()
  1. verificar servidor_alcanzable()              (GestorConectividad)
  2. si no → abortar sesión, NO cuenta como intento fallido de operación
  3. cargar lote = cola.pendientes(prioridad, dependencias, política_batería)
  4. para cada operación del lote:
       a. estado → ENVIADA; POST con idempotency_key
       b. respuesta → Máquina de estados (§6) + Confirmación (§13)
       c. fallo de red → estado vuelve a PENDIENTE_SINCRONIZACION, intentos++
  5. si sesión completa o parcial con ≥1 confirmación del servidor:
       registrar ultima_sincronizacion_exitosa = now()
  6. fin → MotorSupervivencia.registrar_resultado()  (parada temprana)
```

### 4.2 Política de lotes

- **No sincronizar todo de golpe** (doc 05 §3): el lote se limita por prioridad permitida según `GestorBateria.modo` y tipo de red.
- Orden del lote: `P1 → P2 → P3`; dentro de cada prioridad, `fecha_creacion` ascendente (FIFO) salvo que dependencias impongan otro orden (§9).
- Reintentos de operación con backoff exponencial por operación (separado del calendario de ventanas): `min(2^intentos, 60 min)`.

### 4.3 Contrato con el backend

```text
POST /api/sync/operaciones
Headers: Idempotency-Key: <idempotency_key>
Body:    { operacion_id, tipo, payload, dependencias_resueltas }
Respuesta esperada:
  200/201 + { confirmacion_id, estado_servidor }   → VALIDANDO/CONFIRMADA
  409     + { conflicto }                          → rama de resolución (§13.4)
  5xx/timeout                                      → reintento, sin cambio semántico
```

---

## 5. Cola Offline (outbox)

**Responsabilidad:** persistencia local duradera de operaciones pendientes. **Fuente de verdad local**; nada pendiente se pierde por política de tamaño.

### 5.1 Esquema conceptual del registro

```text
OperacionEncolada {
  id:                  UUID          # local, estable
  tipo_operacion:      enum          # financiera | pedido | publicacion | evidencia | medicion | ...
  prioridad:           P1 | P2 | P3
  estado:              EstadoOperacion   # §6
  fecha_creacion:      timestamp
  fecha_actualizacion: timestamp
  intentos:            int
  ultima_tentativa:    timestamp | null
  idempotency_key:     string        # §8 — derivada de id + intento de negocio
  payload:             objeto cifrado# §12 — nunca en claro si SENSITIVE+
  dependencias:        [UUID]        # §9
  error:               { codigo, mensaje, fecha } | null
}
```

### 5.2 Reglas estructurales

| Regla | Justificación |
|---|---|
| **Sin truncado por tamaño** | Corrige D-02 del doc 05 §18: el límite de 100 registros con descarte de los antiguos está **prohibido** |
| Escrituras atómicas | append + fsync / transacción IndexedDB; nunca `read-modify-write` sobre JSON plano (corrige D-07) |
| Vida de la operación — vigencia diferenciada (RC-04, aprobada 2026-10-08) | **financiera `ACEPTADA_OFFLINE`:** sin expiración por TTL — solo resolución válida (`CONFIRMADA`, `RECHAZADA`, `CONFLICTO`, `CANCELADA_CONFIRMADA` u otra aprobada); **resto de la cola:** TTL por entitlement del plan (F7a.1: 15 d/45 d), expirado → `expirado_sin_sincronizar` marcado, nunca borrado; **datos de campo/evidencias:** nunca eliminados por antigüedad |
| Métricas de cola | profundidad por prioridad, antigüedad máxima — para telemetría futura, sin borrado |
| Almacenamiento | PWA: IndexedDB (transaccional); futuro nativo: almacén cifrado del SO. `localStorage` prohibido para la cola (F-04/F-05) |

> Nota histórica: la redacción anterior de la regla de vida («una operación pendiente no expira; solo puede morir por confirmación o por cancelación explícita del usuario») queda **SUPERADA POR RC-04** para las categorías indicadas; el principio de preservación se mantiene íntegro.

---

## 6. Máquina de Estados

**Responsabilidad:** único componente autorizado a transicionar `estado` de una operación. Las transiciones inválidas son imposibles por construcción.

### 6.1 Diagrama de transiciones

```text
BORRADOR ──(usuario confirma preparación)──► PREPARADA_OFFLINE
PREPARADA_OFFLINE ──(encolada)──► PENDIENTE_SINCRONIZACION
PENDIENTE_SINCRONIZACION ──(transmitida)──► ENVIADA
ENVIADA ──(aceptada por servidor)──► VALIDANDO
ENVIADA ──(rechazo definitivo)──► ERROR  → vuelve a PENDIENTE (reintentable) o BORRADOR (usuario decide)
VALIDANDO ──(confirmación válida)──► CONFIRMADA          ← estado terminal de éxito
VALIDANDO ──(rechazo del proveedor)──► ERROR
PENDIENTE_SINCRONIZACION ──(fallo de red en envío)──► PENDIENTE_SINCRONIZACION (intentos++)
```

### 6.1a Carril financiero (RC-01, aprobada 2026-10-08)

Las operaciones financieras recorren una extensión obligatoria del flujo general:

```text
PREPARADA_OFFLINE ──(usuario sella sin conectividad)──► ACEPTADA_OFFLINE
ACEPTADA_OFFLINE ──(encolada)──► PENDIENTE_CONFIRMACION_RED
PENDIENTE_CONFIRMACION_RED ──(transmitida)──► ENVIADA
ENVIADA ──► VALIDANDO ──► CONFIRMADA          ← solo con confirmación del servidor/proveedor
```

Ramas de resolución en cualquier punto posterior a la aceptación:

```text
→ RECHAZADA · → CONFLICTO · → REQUIERE_REVISION
→ CANCELADA_CONFIRMADA   (solo con la evidencia requerida)
```

Reglas específicas del carril:

- `ACEPTADA_OFFLINE` es **irrevocable por el usuario** — no existe cancelación local; solo resolución válida.
- `ACEPTADA_OFFLINE` no significa pagada, transferida, cobrada, retirada ni liquidada, ni confirmada por proveedor financiero.
- `ACEPTADA_OFFLINE` / `PENDIENTE_CONFIRMACION_RED`: **sin expiración por TTL** (RC-04) — permanecen hasta resolución válida.
- `CONFIRMADA` solo desde `VALIDANDO` con confirmación válida del servidor y, cuando aplique, del proveedor financiero autorizado (§13). La regla «ni siquiera encolables» de F7a/F7a.1 queda **SUPERADA POR RC-01** para esta categoría.
- La unificación del vocabulario de estados permanece abierta (RC-05, doc 08).

### 6.2 Reglas

- `CONFIRMADA` solo se alcanza desde `VALIDANDO` con confirmación válida del servidor/proveedor (§13).
- **Prohibido** mapear estados locales a etiquetas de resultado: la UI nunca muestra "Pagado/Transferido/Cobrado/Recibido/Retirado/Completado" fuera de `CONFIRMADA`.
- Toda transición queda en auditoría local (quién, cuándo, causa) — insumo del plano de auditoría del doc 05 §13.
- La máquina es pura/determinista: `(estado, evento) → estado'`, sin efectos secundarios; los efectos los ejecuta el Motor de Sincronización.

---

## 7. Priorización P1 / P2 / P3

**Responsabilidad:** clasificar cada operación en el momento de encolarla (la prioridad es atributo de la operación, no se infiere en sync).

| Prioridad | Tipos (doc 05 §8) | Efecto en la matriz §9 |
|---|---|---|
| **P1** Crítica | financieras, transacciones, pedidos, confirmaciones críticas, con vencimiento, seguridad | única permitida en datos móviles + batería < 50 % |
| **P2** Operacional | publicaciones, Marketplace, reservas, servicios, catálogos, solicitudes | permitida en Wi-Fi ≥ 50 % y datos ≥ 50 %; ligera en Wi-Fi < 50 % |
| **P3** Campo/Docs | cultivos, mediciones, GPS, levantamientos, trazabilidad, informes, fotos, documentos, evidencias | diferible: solo condiciones favorables o Wi-Fi+energía |

Diseño:

- `tipo_operacion → prioridad` es una tabla de decisión única (catálogo), no heurística dispersa en el código.
- Las operaciones **con vencimiento** llevan `fecha_vencimiento` en payload; si expiran sin sync pasan a un estado de revisión, nunca a borrado.
- En modo `AHORRO`, P3 no se procesa ni siquiera localmente pesado (sin compresión masiva).

---

## 8. Idempotencia

**Responsabilidad:** garantizar que reintentos no produzcan efectos duplicados en el servidor.

| Elemento | Diseño |
|---|---|
| `idempotency_key` | derivada en creación: `hash(id_operacion ‖ fecha_creacion)` — estable a través de reintentos de la misma operación lógica |
| Header | `Idempotency-Key` en cada POST de sync (§4.3) |
| Lado servidor | el backend deduplica por `(usuario, idempotency_key)`: segundo POST idéntico devuelve la **misma** confirmación, no una segunda operación |
| Reintento seguro | cualquier operación de la cola es reenviable N veces sin efecto adicional |
| Alcance | cubre el intervalo red→servidor; la deduplicación financiera real la completa el proveedor (§13) |

---

## 9. Gestión de Dependencias

**Responsabilidad:** ordenar operaciones que se referencian entre sí.

```text
OperacionEncolada.dependencias: [id_operacion_previa, ...]
```

Reglas:

- Una operación solo entra al lote de sync si **todas** sus dependencias están `CONFIRMADA`.
- Ejemplo canónico: `evidencia_foto` (P3, archivo en Storage) ← depende de → `registro_campo` (P2/P3) que la referencia.
- Ciclos: se detectan al encolar (el grafo local es un DAG); una dependencia con ciclo se marca `error` y se reporta — nunca se descarta en silencio.
- Dependencia `CONFIRMADA` eliminable del conjunto de bloqueo (la referencia ya existe en servidor); la operación dependiente conserva la referencia por trazabilidad.

---

## 10. Storage de Archivos

**Responsabilidad:** custodia de archivos físicos (originales y versiones), separada de los metadatos en PostgreSQL — doc 05 §14.

### 10.1 Separación de planos

| Plano | Contenido | Tecnología conceptual |
|---|---|---|
| Metadatos | propietario, creador, tipo, fecha, relaciones, versión, estado, `hash_sha256`, permisos, auditoría | PostgreSQL (fila por archivo + fila por versión derivada) |
| Bytes | original + miniatura + optimizada + distribución | Storage (hoy: área local de evidencias; futuro: D5 — doc `18_DISENO_D5_STORAGE.md`) |

### 10.2 Layout conceptual por archivo

```text
archivo/<archivo_id>/
├── original            ← inmutable, SHA-256 de referencia
├── v/thumb.jpg         ← miniatura
├── v/opt.webp          ← versión optimizada MELANTIA
└── v/dist.jpg          ← versión de distribución/compartir
```

Reglas:

- El **original nunca se sobrescribe ni se borra** para ahorrar espacio (doc 05 §12).
- Las derivaciones apuntan a `archivo_id` + `version_tag`; pueden regenerarse, el original no.
- El `hash_sha256` en metadatos corresponde **siempre al original** (§12).
- Sin conectividad, los archivos viven en el almacén local y su subida se encola como operación P3 con dependencias.

---

## 11. Procesamiento de Imágenes

**Responsabilidad:** generar las derivaciones del §10.2 sin destruir el original y respetando la política energética.

```text
ProcesadorImagenes
├── capturar_original(ruta)        → preservar bytes + calcular SHA-256 + metadatos
├── generar_miniatura(archivo_id)  → siempre local, ligero
├── generar_optimizada(archivo_id) → solo si GestorBateria.permite("pesado")
└── generar_distribucion(archivo_id) → resolución suficiente para uso externo (doc 05 §12)
```

| Regla | Diseño |
|---|---|
| Diferido | si la batería no permite el trabajo pesado, se encola `tarea_procesamiento` local (no la operación de sync) y el original queda preservado con `foto_pend` — mismo espíritu que `procesar_evidencia_inteligente()` del código viejo, corregido al umbral 50 % |
| Masivo | compresión/procesamiento por lotes solo con Wi-Fi+energía o batería ≥ 50 % |
| Calidad distribución | la versión `dist` conserva resolución apta para visualización externa (WhatsApp, correo) — no es una miniatura |

---

## 12. Seguridad Offline

**Responsabilidad:** proteger los datos mientras viven en el dispositivo. Converge con F-05/CR-03 (docs 01/04) — **esta sección es el punto de unificación**.

| Aspecto | Diseño |
|---|---|
| Cola cifrada | `payload` de operaciones SENSITIVE+ cifrado en reposo con clave de dispositivo (DEK) — alineado con la cola outbox de F7a.1 §6 |
| Caché de lectura | resuelve CR-03 del doc 04: clasificación por clase de dato con TTL y cifrado propios, distinto de la cola (decisión pendiente S1.3 que este diseño absorbe) |
| Integridad | SHA-256 por archivo original (§10) + huella de auditoría de transiciones (§6.2) |
| Preservación | ante incidente: **detectar → bloquear → preservar → investigar → recuperar** (doc 05 §16). Sin autodestrucción, sin wipe remoto como mecanismo |
| Mínimo local | solo lo necesario para trabajo de campo autorizado (mínimo offline del doc 02) |
| Claves | ninguna clave ni secret de servidor en el dispositivo; DEK derivada de credencial local/biometría según F7a |

---

## 13. Confirmación Servidor / Proveedor

**Responsabilidad:** definir qué cuenta como confirmación válida — la autoridad última de `CONFIRMADA`.

### 13.1 Jerarquía de autoridad

| Tipo de operación | Autoridad que confirma |
|---|---|
| Datos/contenido (P2, P3) | Backend MELANTIA: persistencia + `confirmacion_id` |
| Financiera (P1) | **Proveedor financiero autorizado**, vía backend MELANTIA — nunca el cliente |

> "MELANTIA administra la operación; el proveedor financiero autorizado administra el dinero." (doc 05 §11)

### 13.2 Flujo de confirmación

```text
cliente → ENVIADA → backend recibe (idempotencia §8)
        → VALIDANDO: servidor aceptó y procesa / consulta proveedor
        → CONFIRMADA: respuesta válida con { confirmacion_id, estado_servidor, timestamp }
```

- Una respuesta sin `confirmacion_id` o con firma/estructura inválida **no** confirma; la operación permanece `VALIDANDO`/`ENVIADA` y se reconsulta.
- Para operaciones financieras, `VALIDANDO` puede requerir polling diferido al backend (el backend consulta al proveedor; el cliente nunca habla con el proveedor directamente).
- Confirmación es por operación individual, no por lote.

### 13.3 Notificaciones (doc 05 §17)

El resultado de cada transición relevante alimenta mensajes contextuales — el set aprobado del doc 05 §17 es el catálogo; la capa de notificaciones los emite solo en contexto (nunca push repetitivo por pendientes, §10 del doc 05).

### 13.4 Conflictos

`409 conflicto` (edición concurrente, duplicado semántico): la operación sale del flujo automático a **revisión** — se preserva íntegra localmente (doc 05 §16) y se expone al usuario; nunca se sobrescribe ni se borra automáticamente.

---

## 14. Matriz de decisión consolidada (implementa doc 05 §9)

| Red | Energía | Alcance del lote | Vía |
|---|---|---|---|
| Wi-Fi | ≥ 50 % | P1+P2+P3 completo | ventana o evento |
| Wi-Fi | < 50 % | P1 + P2 ligero | ventana |
| Wi-Fi | enchufado | completo | **excepción: cualquier día/hora** |
| Datos móviles | ≥ 50 % | P1 + P2 según política | ventana o evento |
| Datos móviles | < 50 % | solo P1 | ventana |
| Datos móviles | enchufado | **controlada**: P1/P2 prioritarias; evita transferencias pesadas no urgentes (RC-06) | ventana o evento |
| Sin conexión | cualquiera | — | solo cola local |

Objetivo diario (doc 05 §6): el Motor de Supervivencia considera el día "servido" cuando `ultima_sincronizacion_exitosa` cae en la fecha actual; las ventanas restantes del día pasan a modo oportunista (no obligatorio).

---

## 15. Correspondencia especificación → diseño

| Doc 05 | Componente(s) de diseño |
|---|---|
| §1 principio Offline First | §6 máquina de estados + §13 confirmación |
| §2 estados | §6 |
| §3 supervivencia | §1 motor + schedulers SO |
| §4 batería 50 % | §3 gestor de batería |
| §5 calendario | §1 + §2 gestor conectividad |
| §6 sync diaria | §2 dos niveles + §4 sesión + registro `ultima_sincronizacion_exitosa` |
| §7 excepción Wi-Fi+energía | §3 + §14 |
| §8 prioridades | §7 |
| §9 matriz | §14 |
| §10–§11 comercial/financiero | §6 + §13 + notificaciones §13.3 |
| §12 imágenes | §10 + §11 |
| §13 integridad | §10 (hash) + §6.2 (auditoría) + §12 |
| §14 storage | §10 |
| §15 cola | §5 + §8 + §9 |
| §16 preservación | §12 + §13.4 |
| §17 notificaciones | §13.3 |
| §18 divergencias D-01…D-08 | §3 (D-01, D-05), §5 (D-02, D-07), §2 (D-03), §12 (D-04), §1 (D-06 implícito), §2 (D-08) |

---

## 16. Fuera de alcance (no diseñado aún, no implementar)

- Arquitectura financiera: Wallet, custodia, escrow, retiros, transferencias, crédito, pagos protegidos (doc 05 §11).
- Motor de sincronización ejecutable — este documento solo lo especifica.
- Nuevo sistema de Storage físico (doc 05 §14; remite al diseño D5 de `e0_supabase/18`).
- UI concreta de notificaciones (solo catálogo semántico).
- Elección definitiva de tecnología de cola por plataforma (IndexedDB vs. almacén nativo) — requiere decisión de shell/PWA.

## 17. Pendientes de decisión abierta

| # | Decisión | Depende de |
|---|---|---|
| DT-01 | Almacén de cola en PWA: IndexedDB con cifrado a nivel objeto vs. OPFS | decisión shell/PWA, F-05/S1.3 |
| DT-02 | Endpoint de sync: un solo `/api/sync/operaciones` vs. endpoints por tipo | diseño de API backend |
| DT-03 | Criptografía de payload de cola: reutilizar DEK-dispositivo de F7a.1 §6 | confirmación de alcance compartido |
| DT-04 | `fecha_vencimiento` como campo de esquema vs. atributo de payload | catálogo de tipos de operación |
| DT-05 | Telemetría de ventanas/intentos (métricas mínimas sin PII) | política de observabilidad |

---

> **Regla de cierre:** este documento traduce la especificación 05 a diseño técnico. **No autoriza implementación.** Toda construcción requiere aprobación explícita posterior.
