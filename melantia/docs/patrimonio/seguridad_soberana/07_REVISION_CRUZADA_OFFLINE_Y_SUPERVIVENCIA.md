# 07 — Revisión Cruzada del Diseño Técnico de Seguridad Offline y Supervivencia

> Documento de **validación arquitectónica**. Contrastado contra: doc 05 (especificación aprobada), doc 06 (diseño técnico), F7a (doc 17), F7a.1 (doc 21, CERRADO), D5 Storage (doc 18), EP-4E (`EP_MODELO_DATOS.md` §14), Seguridad Soberana (docs 01–04), decisiones Phase 2 (`PHASE2_ARCHITECTURE_DECISIONS.md`).
> **Nada aquí está implementado ni autoriza implementación.** Clasificaciones: `compatible` · `compatible con condición` · `requiere decisión` · `contradictorio` · `pendiente de validación técnica`.
> Fecha: 2026-10-05 · Único artefacto: este documento. Código, BD, configuración y dependencias: **sin cambios**.

---

## 1. Objetivo

Determinar si el diseño técnico del doc 06 es coherente con la especificación aprobada (doc 05) y con las decisiones arquitectónicas vigentes de MELANTIA, identificando contradicciones, huecos, decisiones pendientes y riesgos — **sin resolver unilateralmente nada**.

## 2. Documentos revisados

| Doc | Rol | Estado de la fuente |
|---|---|---|
| `seguridad_soberana/05_ESPECIFICACION_…` | Fuente de verdad del diseño | APROBADA |
| `seguridad_soberana/06_DISENO_TECNICO_…` | Objeto de revisión | Diseño |
| `e0_supabase/17_DISENO_F7A_SESION_REFRESH_OFFLINE` | Sesión, snapshot, outbox, REQUIERE_ONLINE | Diseño (F7a) |
| `e0_supabase/21_DECISION_F7A1_SEGURIDAD_SESION` | Custodia RT, TTLs, cola, sync background | **CERRADO para implementación** |
| `e0_supabase/18_DISENO_D5_STORAGE` | storage_objects, integridad, versionado, outbox de archivos | Diseño |
| `EP_MODELO_DATOS.md` §14 (EP-4E) | resolver_permiso, concesiones, techos | Diseño aprobado 2026-10-01 |
| `seguridad_soberana/01–04` | Auditoría, diseño soberano, backlog, revisión cruzada | Vigentes |
| `PHASE2_ARCHITECTURE_DECISIONS.md` | A2 comisión 3 % en M4.transacciones | Aprobadas |
| `VISION_ECOSISTEMA_MELANTIA.md` §17 | Servicios Financieros: MELANTIA no custodia fondos | Visión |

## 3. Arquitectura revisada

Los 13 componentes del doc 06 (motor de supervivencia, conectividad, batería, sincronización, cola, estados, prioridades, idempotencia, dependencias, storage, imágenes, seguridad offline, confirmación) fueron revisados sección por sección, con énfasis en §1–§17.

## 4. Compatibilidad con la especificación 05

Verificación regla por regla del checklist aprobado:

| Regla del doc 05 | Presencia en doc 06 | Veredicto |
|---|---|---|
| Umbral batería 50 %, no configurable | §3 (constante de especificación, fail-safe INDETERMINADO) | **Compatible** — mejora D-05 |
| Wi-Fi + ≥50 % / <50 % / +energía | §14 matriz | **Compatible** |
| Datos móviles + ≥50 % / <50 % | §14 | **Compatible** |
| Sin conexión → cola local | §14 | **Compatible** |
| Días lu/ju/vi/sa/do + horarios 10/13/16/19/00 | §1 referencia normativa a §5 doc 05 | **Compatible** (no se duplica la tabla — correcto, la fuente es 05) |
| 5 intentos × 10 min por ventana | §2 (agendados por motor, no bucle) | **Compatible** |
| Parada tras sync exitosa | §2, §4.1 paso 6 | **Compatible** |
| ≥1 sync exitosa/día | §14 "día servido" | **Compatible con condición** — RC-13: interpretación "ventanas restantes oportunistas" es extensión de diseño, no literal de 05 |
| Conectividad detectada ≠ sync exitosa | §2 dos niveles | **Compatible** — corrige D-03 |
| P1/P2/P3 | §7 tabla de decisión al encolar | **Compatible** |
| Estados BORRADOR→CONFIRMADA | §6 | **Compatible con condición** — RC-05 (estados extra sin marcar como propuesta) |
| Idempotencia | §8 | **Compatible** |
| Dependencias | §9 | **Compatible con condición** — RC-10 |
| No truncado/eliminación de pendientes | §5.2 | **Compatible con condición** — RC-04 (choque con TTL decidido) |
| Imágenes original/miniatura/optimizada/distribución | §10.2, §11 | **Compatible** |
| SHA-256 sobre el original | §10.2, §11 | **Compatible con condición** — RC-09 (plaintext vs ciphertext abierto en doc 04) |
| Regla financiera (preparar/encolar/enviar; nunca declarar ejecutada) | §13.1–13.2 | **CONTRADICTORIO con F7a** — RC-01 (ver §12) |
| Confirmación real previa | §13 | **Compatible** |
| Detectar→bloquear→preservar→investigar→recuperar | §12, §13.4 | **Compatible** |
| Notificaciones contextuales | §13.3 | **Compatible** — encaja con canal in-app F7a.1 §5.1 |

**Veredicto doc 05 ↔ 06:** el diseño cubre la especificación completa; las condiciones son de integración con otras capas aprobadas, no de omisión del spec.

> _Nota de estado (2026-10-08): RC-01 y RC-04, citados en esta sección como abiertos, fueron **resueltos por decisión aprobada** — estado vigente en `08_MATRIZ_DECISIONES_OFFLINE_Y_SUPERVIVENCIA.md` y en el master §45. El análisis se conserva como registro histórico._

## 5. Compatibilidad con diseño 06 (auto-evaluación estructural)

- El doc 06 declara correctamente que no autoriza implementación (§0, §16, cierre).
- Mantiene DT-01…DT-05 como decisiones abiertas sin resolverlas — correcto.
- **Debilidad estructural:** el doc 06 se presenta como autosuficiente pero **omite la capa de sesión/snapshot** — ninguna sección referencia el flujo F7a.1 §7 como precondición del sync (RC-02). La tabla de correspondencia §15 mapea doc 05→diseño pero no mapea F7a.1→diseño.

## 6. Compatibilidad con F7a / sesiones (doc 17 + doc 21)

| Punto | Veredicto | Detalle |
|---|---|---|
| Sesión ≠ autorización offline; servidor revalida en sync | **Compatible** en principio | pero doc 06 no lo implementa textualmente (RC-02/RC-03) |
| Operación creada offline no se auto-autoriza | **Compatible** | §13 exige confirmación server-side; falta `policy_version` en cola (RC-03) |
| Secuencia de reconexión obligatoria (F7a.1 §7) | **Compatible con condición** | doc 06 §4.1 arranca en `servidor_alcanzable()` sin refresh→sesión→snapshot previo (RC-02) |
| Sesión expirada / refresh fallido | **Hueco en doc 06** | F7a §19: cola **pausa**, no se descarta; doc 06 no lo dice (RC-03 asociado) |
| Sesión revocada / dispositivo revocado | **Requiere decisión** | F7a.1 §7.2 dice "purgar cola y snapshot"; F7a §16 dice "la cola persiste"; doc 05 §16 prohíbe destruir — **contradicción interna de la base normativa** (RC-07) |
| `policy_version` antigua | **Compatible con condición** | F7a.1: op con policy_version obsoleta → rechazada+reporte; doc 06 no porta el campo (RC-03) |
| Usuario bloqueado/suspendido | **Compatible con condición** | F7a §20.4: suspendido → modo lectura + "purgar cola no enviable"; doc 06 no cubre suspensión (RC-07) |
| Gate biométrico, lock 5 min, Keystore/Keychain | **Compatible** | doc 06 §12 remite a F7a; no duplica lógica de sesión — correcto |
| Snapshot 72 h como gate para encolar | **Hueco en doc 06** | F7a §9: fuera de ventana **ni siquiera se encola**; doc 06 no gatea `encolar` por ventana (RC-03) |
| Sync en background decidido: NETWORK+CHARGING | **Compatible con condición** | F7a.1 §6 permite drenar con **cualquier** red+energía; doc 05/06 restringen la excepción a **Wi-Fi**+energía (RC-06) |
| No se crea segunda lógica de sesión | **Compatible** | doc 06 no define sesión propia — bien |

**Flujo requerido verificado:** `OFFLINE → sesión válida local (snapshot ≤72 h) → operación preparada (dentro de ventana, sellada con policy_version) → reconexión (F7a.1 §7) → sync (doc 06 §4) → servidor re-evalúa autorización`. Doc 06 cubre el tramo "sync → confirmación" pero **no conecta** con los tramos de sesión que F7a.1 ya cerró.

> _Nota de estado (2026-10-08): RC-06, citado en esta sección como abierto, fue **resuelto por decisión aprobada** (datos móviles + energía = sincronización controlada) — estado vigente en `08_MATRIZ_DECISIONES_OFFLINE_Y_SUPERVIVENCIA.md` y en el master §45. El análisis se conserva como registro histórico._

## 7. Compatibilidad con Auth / AuthZ

| Punto | Veredicto |
|---|---|
| Modelo identidad+sesión+rol+plan+permiso+recurso+policy_version | **Compatible con condición** — doc 06 no contradice, pero tampoco porta los campos que lo hacen ejecutable (RC-03) |
| Cliente nunca es autoridad final | **Compatible** — §6.2 prohibición de estados visuales + §13.1 jerarquía de autoridad |
| Servidor reevalúa al recibir | **Compatible con condición** — doc 06 asume la re-evaluación sin nombrar `resolver_permiso` (RC-14) |
| ACL offline paralela | **Compatible** — doc 06 no crea una; el snapshot F7a gatea UI/cola, no autoriza |

## 8. Compatibilidad con EP-4E

| Punto EP-4E | Veredicto |
|---|---|
| Operaciones offline respetan permisos de proyecto | **Compatible con condición** — requiere `scope` (recurso_tipo/proyecto_id) en la cola y re-eval por `resolver_permiso` al sync; ambos ausentes en doc 06 (RC-03/RC-14) |
| Concesión revocada no se ejecuta por haber sido creada offline | **Compatible** en resultado (servidor re-evalúa con datos frescos) — pendiente declararlo en doc 06 |
| Concesión expirada (`vigente_hasta`) reevaluada al sync | **Compatible con condición** — ídem |
| Reactivación no revive concesiones (E1) | **Compatible** — comportamiento server-side, el snapshot refleja el estado nuevo al reconectar |
| `policy_version` suficiente | **Pendiente** — F7a.1 lo usa como sello; EP-4E no define versionado de matriz; si la matriz de roles cambia en código, `policy_version` no la captura necesariamente → **DT-06 nueva** (ver §22) |
| Sin ACL paralela | **Compatible** |

## 9. Compatibilidad con Storage (D5, doc 18)

| Punto | Veredicto |
|---|---|
| Separación metadatos PG / bytes Storage / dispositivo / cola | **Compatible** — doc 06 §10 respeta la regla madre D5 §3 |
| Original nunca sustituido por derivados | **Compatible** — doc 06 §10.2 explícito |
| SHA-256 del original | **Compatible con condición** — RC-09: si el objeto se almacena cifrado (S2.6 pendiente), hay que definir sha256 de plaintext (dedup, oráculo) vs ciphertext; doc 04 §5 ya lo dejó abierto — doc 06 no lo cierra |
| Versionado | **Requiere aclaración** — RC-08: doc 06 usa "versión" para *rendiciones* (thumb/opt/dist); D5 usa "versión" para *supersedes* documental. Son conceptos distintos con el mismo nombre |
| Outbox de archivos (D5 §17) | **Compatible** — doc 06 §10.1 coincide (IndexedDB/FS local + INTENT→UPLOAD→CONFIRM→VERIFY→ACTIVE al reconectar) |
| `provenance{device_id, capturado_offline, policy_version}` | **Compatible con condición** — doc 06 no lo porta en el esquema de cola (RC-03) |
| Retención/legal_hold de evidencias | **Compatible** — D5 §16: soft delete + legal_hold, nunca purge automático; converge con doc 05 §16 |

## 10. Compatibilidad con Evidencias

- Integridad (SHA-256 original), autoría y timestamps: **compatible** — `capturar_original` de doc 06 §11 preserva bytes+hash+metadatos; `provenance` de D5 aporta el resto.
- Relación evidencia↔operación: **compatible con condición** — doc 06 §9 soporta dependencias (evidencia ← registro), que es exactamente el mecanismo requerido.
- **Nunca borrado automático** por falta de conectividad / tamaño de cola / error de sync / conflicto: **compatible** — doc 06 §5.2 + §13.4 lo garantizan; el único punto de fricción es RC-04/RC-07 (TTL/"purgar") que debe resolverse preservando, no borrando.

## 11. Compatibilidad con Seguridad Soberana

| Punto | Veredicto |
|---|---|
| Detectar→bloquear→preservar→investigar→recuperar | **Compatible** |
| Prohibición de autodestrucción | **Compatible** — alineado con la corrección ya decidida en F7a.1 §6 (se destruye sesión/snapshot, **nunca datos**) |
| Cifrado de cola con DEK-dispositivo | **Compatible con condición** — DT-03 abierto correctamente; **riesgo de doble sistema de claves** existe si la cola usa una DEK distinta a la del snapshot F7a.1 §6: **debe ser la misma infraestructura** (RC-09 asociado) |
| Caché de lectura (CR-03/S1.3) | **Compatible** — doc 06 §12 lo absorbe como decisión pendiente, sin resolverla unilateralmente — correcto |

## 12. Compatibilidad con Servicios Financieros — sección CRÍTICA

### 12.1 RC-01 — CONTRADICCIÓN CRÍTICA

| Capa | Texto normativo |
|---|---|
| Doc 05 §14 (APROBADA) | "MELANTIA puede: preparar, almacenar, **poner en cola**, enviar cuando exista conectividad" — operaciones financieras |
| Doc 06 §7/§13 | financieras = P1 encolables con confirmación posterior del proveedor |
| **F7a doc 17 §11** (aprobado como diseño) | "Operaciones financieras (pagos, transferencias) → Offline: **no** — **ni siquiera encolables**; irreversibles y con riesgo regulatorio" |
| **F7a.1 doc 21 §6** (CERRADO) | "Operaciones sensibles: **online-only — nunca entran al snapshot ni a la cola**" |

**Conflicto real entre dos decisiones aprobadas.** El doc 05 (posterior) permite encolar operaciones financieras; F7a/F7a.1 lo prohíben literalmente.

**Análisis de fondo:** ambas posiciones comparten el mismo invariante — *offline nunca ejecuta dinero* (doc 05 §14: "no puede declarar pagada/transferida/…"; F7a §12: "muta dinero → REQUIERE_ONLINE"). La divergencia es solo sobre si la **intención/preparación** puede vivir en cola. Una resolución posible (a decidir, no a imponer): distinguir *operación financiera preparada* (metadatos de intención, encolable) de *instrucción de ejecución* (requiere sesión online + re-autorización al momento del envío).

**Esta revisión no resuelve la contradicción — la documenta.** Requiere decisión humana: (a) enmendar F7a/F7a.1 para admitir el matiz preparar-vs-ejecutar, o (b) restringir doc 05/06 a "financieras no encolables".

> _Nota de estado (2026-10-08): RC-01 fue **resuelto por decisión aprobada** — las financieras son encolables vía `ACEPTADA_OFFLINE` (irrevocable por el usuario; confirmación solo servidor/proveedor). Estado vigente en `08_MATRIZ_DECISIONES_OFFLINE_Y_SUPERVIVENCIA.md` y en el master §45. El análisis de esta sección se conserva como registro histórico._

### 12.2 Resto de la verificación financiera

| Regla | Veredicto |
|---|---|
| Offline prepara / deja pendiente | condicionado por RC-01 |
| Offline nunca declara dinero transferido/pagado/saldo/retiro/crédito | **Compatible** — doc 06 §6.2 + §13.1 |
| `CONFIRMADA` no ambiguo en financieras | **Compatible con condición** — §13.1 ya exige confirmación del proveedor; **recomendación**: para tipo `financiera`, `VALIDANDO→CONFIRMADA` debe exigir evidencia de confirmación del *proveedor*, no solo `confirmacion_id` del backend MELANTIA (el backend puede confirmar recepción sin que el dinero se haya movido) — matiz a documentar (RC-16) |
| Comisión 3 % separada del proveedor | **Compatible** — coherente con A2 (3 % vive en `M4.transacciones`, Phase 2) |
| Wallet/escrow/retiros/etc. | **Compatible** — correctamente fuera de alcance (doc 06 §16; VISIÓN §17: "no se debe asumir que MELANTIA custodiará fondos") |

## 13. Revisión de la cola Offline

| Aspecto | Veredicto |
|---|---|
| Sin truncado arbitrario / sin eliminación silenciosa / sin pérdida por límite artificial | **Compatible** — §5.2 lo prohíbe explícitamente (corrige D-02) |
| Escritura atómica | **Compatible** — transaccional IndexedDB vs read-modify-write JSON (corrige D-07) |
| Esquema | **Compatible con condición** — RC-03: faltan `usuario_id`, `session_id`, `policy_version`, `scope{recurso_tipo, proyecto_id}`, `provenance` — todos requeridos por F7a §19/D5 §4 |
| Expiración | **CONTRADICTORIO** — RC-04: doc 06 §5.2 "una operación pendiente no expira" vs F7a.1 **decidido**: TTL entitlement 15 d/45 d, expirado → `expirado_sin_sincronizar` marcado y visible (nunca borrado). Doc 06 debe adoptar el TTL con marcado |
| Límite físico de almacenamiento | **Hueco** — doc 06 prohíbe borrado pero no diseña el mecanismo de presión de espacio. Diseño conceptual requerido: `alerta → protección (congelar capturas nuevas de baja prioridad, nunca las existentes) → priorización (P1 sube primero al reconectar) → resolución controlada (usuario/archivo a Storage remoto)` — **nunca** "borrar los más antiguos" (RC-15) |
| Backoff por operación | **Compatible** — §4.1 `min(2^intentos, 60min)`; alinear con `next_retry_at`+jitter de F7a §19 |

> _Nota de estado (2026-10-08): RC-04, citado en esta sección como contradictorio, fue **resuelto por decisión aprobada** — vigencia diferenciada: financieras `ACEPTADA_OFFLINE` sin TTL; resto de la cola conserva TTL por plan con marcado. Estado vigente en `08_MATRIZ_DECISIONES_OFFLINE_Y_SUPERVIVENCIA.md` y en el master §45. El análisis se conserva como registro histórico._

## 14. Revisión de la máquina de estados

### 14.1 Casos solicitados

| Caso | Respuesta del doc 06 | Veredicto |
|---|---|---|
| Servidor responde 409 | §13.4 → "revisión", preserva íntegro | **Compatible con condición** — F7a §19 ya tiene estado `conflicto`; doc 06 usa "revisión" sin mapearlo (RC-05) |
| Operación duplicada | §8 — `idempotency_key` converge, mismo `confirmacion_id` | **Compatible** |
| Operación ya confirmada | reenvío devuelve misma confirmación | **Compatible** (idempotencia) |
| Dependencia rechazada | **no definido** | **Hueco — RC-10**: las dependientes deberían marcarse bloqueadas/pendiente-resolución, nunca propagar el rechazo en silencio ni enviarse huérfanas |
| Usuario ya sin permiso | no definido en doc 06; F7a.1 §7.5: rechazada + reporte | **Compatible con condición** — doc 06 debe importar el resultado `rechazada` (RC-03/RC-05) |
| Proveedor financiero rechaza | §6.1 `VALIDANDO→ERROR` | **Compatible con condición** — `ERROR` es estado nuevo no marcado como propuesta y sin semántica terminal/retriable (RC-05); rechazo definitivo ≠ error de red (F7a §21) debe quedar explícito |

### 14.2 Divergencia de vocabulario (RC-05)

| Capa | Estados |
|---|---|
| Doc 05 §5 (mínimos) | BORRADOR, PREPARADA_OFFLINE, PENDIENTE_SINCRONIZACION, ENVIADA, VALIDANDO, CONFIRMADA |
| F7a §19 | pendiente, syncing, aceptada, rechazada, conflicto |
| F7a.1 §6 | + `expirado_sin_sincronizar` |
| Doc 06 §6 | los 6 del spec + `ERROR` + "revisión" (ambos **sin marcar como propuesta**) |

Doc 05 admite estados adicionales ("como mínimo"), pero doc 06 debió marcarlos. **Requiere tabla de mapeo/decisión**: la relación probable es `syncing≈ENVIADA`, `aceptada≈VALIDANDO`, `rechazada`/`conflicto`/`expirado_sin_sincronizar` = estados terminales nuevos que el spec no nombra — decisión humana para unificar el vocabulario canónico.

## 15. Revisión de idempotencia

| Aspecto | Veredicto |
|---|---|
| `idempotency_key` estable por operación | **Compatible** — §8 `hash(id‖fecha_creacion)`; coincide con `op_id` de F7a §19 y dedup `hash_transaccion` existente (D5 §18 distingue idempotencia de dedup — doc 06 también) |
| Reintento seguro N veces | **Compatible** |
| Header + dedup server-side | **Compatible con condición** — F7a §19 advierte que los endpoints existentes deben *añadir* soporte de idempotency key (trabajo de implementación, no dado por sentado) |

## 16. Revisión de dependencias

- DAG local, detección de ciclos al encolar, nunca descarte silencioso: **compatible**.
- Hueco RC-10 (dependencia rechazada) documentado en §14.1.
- Orden FIFO por recurso (F7a §19) vs "FIFO por `fecha_creacion` dentro de prioridad" (doc 06 §4.2): **compatible con condición** — son ordenamientos distintos; conviene declarar que el orden es `prioridad → dependencias → fecha_creacion`, con FIFO por recurso como sub-regla. Aclaración menor.

## 17. Revisión de background / plataformas

| Plataforma | Mecanismo propuesto | Estado real conocido | Veredicto |
|---|---|---|---|
| Web/PWA | Periodic Background Sync | **Solo Chromium/Android**; iOS Safari no lo soporta | **Pendiente de validación técnica** — no darlo por universal |
| Web/PWA fallback | `sync` events + chequeo al abrir | API Sync simple: soporte también limitado (Chromium) | **Pendiente de validación técnica** |
| Android nativo/shell | WorkManager | Real; constraint `NETWORK+CHARGING` ya DECIDIDA en F7a.1 §6 | **Compatible** |
| iOS nativo/shell | BGTaskScheduler | Real pero opportunistic (el SO decide cuándo) | **Pendiente de validación técnica** — las ventanas exactas 10/13/16/19/00 del doc 05 pueden no ser garantizables por el SO |

**Hallazgo estructural (RC-11):** doc 06 nombra las tres APIs correctamente pero debe formalizarlas como **adaptadores tras una interfaz única** (`programar_ventana`, `evento_red`, `constraint_energia`) para que el motor de negocio no se acople a un SO. Además: F7a.1 §6 ya decidió que el almacenamiento seguro (Keystore/Keychain) **requiere shell nativo** — la PWA pura no alcanza; esto condiciona también dónde puede vivir la DEK de la cola cifrada (doc 06 §12). Registrar como restricción de plataforma.

## 18. Revisión de telemetría (DT-05)

Clasificación propuesta para la decisión pendiente:

| Clase | Contenido admisible | Prohibido |
|---|---|---|
| **Operacional** | contadores de sync, intentos por ventana, latencias, tamaño de cola por prioridad, cambios de tipo de red | payloads, contenido de operaciones |
| **Seguridad** | colisiones de refresh, sesión `sospechosa`, rechazos de autorización, fallos de integridad | tokens, refresh, cookies, PIN, claves, biometría |
| **Auditoría** | transiciones de estado (quién/cuándo/causa — §6.2), confirmaciones, rechazos con motivo, eventos `storage_audit` (D5 §22) | datos financieros sensibles en claro, PII innecesaria |

**Pendiente:** canal, retención y si la telemetría viaja como operación P3 propia o fuera de cola. **DECISIÓN ABIERTA** — se mantiene DT-05.

## 19. Revisión de expiración (`fecha_vencimiento`, DT-04)

| Concepto | Tratamiento |
|---|---|
| Operación sin vencimiento | flujo normal |
| Con ventana temporal | `fecha_vencimiento` en payload; visible en UI de cola |
| Expirada | **marcada**, nunca borrada — converge con `expirado_sin_sincronizar` de F7a.1 (RC-04) |
| Requiere reconfirmación | vuelve a `PREPARADA_OFFLINE`/`BORRADOR` por decisión del usuario — propuesta, no aprobada |
| Financiera que requiere nueva autorización | el reenvío siempre pasa por re-eval server-side; nunca "se re-autoriza sola" por estar encolada |

**Confirmado:** expiración ≠ borrado en ninguna capa. `fecha_vencimiento` como campo de esquema vs atributo de payload: **DECISIÓN ABIERTA** (DT-04 se mantiene).

> _Nota de estado (2026-10-08): la referencia a RC-04 en esta sección es histórica — fue **resuelto por decisión aprobada**; estado vigente en `08_MATRIZ_DECISIONES_OFFLINE_Y_SUPERVIVENCIA.md` y en el master §45._

## 20. Matriz de compatibilidad consolidada

| Punto de diseño 06 | vs 05 | vs F7a/F7a.1 | vs EP-4E | vs Storage D5 | vs Evidencias | vs Financiero | vs Seguridad Soberana |
|---|---|---|---|---|---|---|---|
| Motor supervivencia / calendario | Compatible | Condición (RC-06 NETWORK+CHARGING) | n/a | n/a | n/a | n/a | Compatible |
| Gestor conectividad (2 niveles) | Compatible | Compatible | n/a | n/a | n/a | n/a | Compatible |
| Gestor batería 50 % fail-safe | Compatible | Compatible | n/a | n/a | n/a | n/a | Compatible |
| Ciclo de sync §4.1 | Compatible | **Condición (RC-02: falta §7 F7a.1)** | Condición (RC-14) | n/a | n/a | Condición | Compatible |
| Cola §5 | Compatible | **Contradictorio (RC-04 TTL) + Condición (RC-03 campos)** | Condición (scope) | Compatible | Compatible | Condición | Condición (DEK RC-09) |
| Estados §6 | Compatible | **Condición (RC-05 vocabulario)** | Compatible | n/a | Compatible | Condición (RC-16) | Compatible |
| Prioridades §7 | Compatible | **Contradictorio (RC-01 financieras encolables)** | Compatible | n/a | Compatible | **Contradictorio (RC-01)** | Compatible |
| Idempotencia §8 | Compatible | Compatible | n/a | Compatible | Compatible | Compatible | Compatible |
| Dependencias §9 | Compatible | Compatible | Compatible | Compatible | Compatible | n/a | Compatible |
| Storage archivos §10 | Compatible | Compatible | Compatible | **Condición (RC-08, RC-09)** | Compatible | n/a | Condición |
| Imágenes §11 | Compatible | Compatible | n/a | Compatible | Compatible | n/a | Compatible |
| Seguridad offline §12 | Compatible | Compatible | n/a | Condición | Compatible | n/a | Compatible |
| Confirmación §13 | Compatible | Compatible | Condición | n/a | Compatible | **Condición (RC-01, RC-16)** | Compatible |
| Matriz §14 | Compatible | Condición (RC-06) | n/a | n/a | n/a | n/a | Compatible |
| Endpoint sync único | n/a | **Decisión abierta** | Decisión abierta | n/a | n/a | Decisión abierta | n/a |

> _Nota de estado (2026-10-08): las clasificaciones "Condición (RC-06)", "Contradictorio (RC-01)" y "Contradictorio (RC-04)" de esta matriz son el registro de la revisión original — RC-01, RC-04 y RC-06 fueron **resueltos por decisión aprobada**; estado vigente en `08_MATRIZ_DECISIONES_OFFLINE_Y_SUPERVIVENCIA.md` y en el master §45._

## 21. Hallazgos clasificados

| ID | Severidad | Ubicación | Problema | Fuente | Impacto | Recomendación | ¿Decisión humana? |
|---|---|---|---|---|---|---|---|
| **RC-01** | **CRÍTICO** | 06 §7/§13 vs 17 §11-12, 21 §6 | Operaciones financieras encolables (05/06) vs "ni siquiera encolables" (F7a/F7a.1) | Contradicción entre decisiones aprobadas | Riesgo regulatorio/diseño: dos capas normativas incompatibles | Decisión: enmendar F7a.1 con matiz preparar-vs-ejecutar, o restringir 05/06 | **SÍ — bloqueante** → **RESUELTO 2026-10-08** (doc 08: financieras encolables vía `ACEPTADA_OFFLINE` irrevocable) |
| **RC-02** | **ALTO** | 06 §4.1 | El ciclo de sync omite la secuencia obligatoria F7a.1 §7 (refresh→sesión→snapshot→flush) | F7a.1 §7 CERRADO | Sync podría drenar cola sin revalidar sesión/snapshot | Condicionar doc 06: §7 es precondición del motor de sync | No — integración |
| **RC-03** | **ALTO** | 06 §5.1 | Cola sin `usuario_id`, `session_id`, `policy_version`, `scope`, `provenance`; sin gate de ventana 72 h para encolar | F7a §9/§19, D5 §4 | Operación sin contexto de autorización ni sello de política | Añadir campos + regla "fuera de ventana no se encola" | No — integración |
| **RC-04** | **ALTO** | 06 §5.2 | "Operación pendiente no expira" contradice TTL entitlement 15d/45d decidido | F7a.1 §6/§8/§11 | Dos políticas de vida de cola | Adoptar TTL con marcado `expirado_sin_sincronizar` (nunca borrado) | **SÍ** (confirmar adopción) → **RESUELTO 2026-10-08** (doc 08: vigencia diferenciada — financieras `ACEPTADA_OFFLINE` sin TTL) |
| **RC-05** | **MEDIO** | 06 §6 | `ERROR`/`revisión` no marcados como propuesta; vocabulario diverge de F7a (`rechazada`,`conflicto`,`expirado_sin_sincronizar`) | 05 §5, 17 §19, 21 §6 | Estados incompatibles entre capas | Tabla de mapeo + vocabulario canónico único | **SÍ** |
| **RC-06** | **MEDIO** | 06 §14 | Excepción solo Wi-Fi+energía; F7a.1 decidió drain con cualquier red+energía | 21 §6 | Datos móviles+enchufado = caso indefinido | Decidir si NETWORK+CHARGING amplía la excepción | **SÍ** → **RESUELTO 2026-10-08** (doc 08: datos móviles+energía = sincronización controlada) |
| **RC-07** | **MEDIO** | F7a §20.4 / F7a.1 §7.2 vs 05 §15-16 | Base normativa usa "purgar cola" (suspendido/revocada) pero también "cola nunca se borra" | Contradicción interna docs 17/21 | Interpretación peligrosa posible (borrado real) | Clarificar: "purgar" = marcar no-enviable preservando datos; nunca borrado | **SÍ** (aclaración) |
| **RC-08** | **MEDIO** | 06 §10-11 vs 18 §15 | "Versión" = rendición de imagen en 06; = supersedes documental en D5 | Colisión terminológica | Confusión de diseño/implementación | Renombrar en 06 a "derivación/rendición" | No — editorial |
| **RC-09** | **MEDIO** | 06 §10/§12 | SHA-256 de original sin definir plaintext-vs-ciphertext; DEK de cola podría ser sistema de claves paralelo | Doc 04 §5 (abierto), F7a.1 §6 | Dedup roto u oráculo; dos KMS lógicos | Mantener PENDIENTE; exigir misma DEK-infra que snapshot | **SÍ** (hereda doc 04) |
| **RC-10** | **MEDIO** | 06 §9 | Dependencia rechazada: efecto sobre dependientes no definido | — | Huérfanas podrían enviarse o quedar limbo | Regla: dependiente de rechazada → bloqueada/revisión, notificada | **SÍ** (regla de dominio) |
| **RC-11** | **BAJO** | 06 §1.1 | APIs de plataforma sin interfaz adaptador formal; Periodic Background Sync no es universal | — | Acoplamiento a SO; expectativa falsa en iOS | Interfaz adaptador + capacidades por plataforma verificadas | No — diseño |
| **RC-12** | **BAJO** | 06 §13.2 | "Polling diferido" puede leerse como bucle | — | Aparente conflicto con §1.3 | Renombrar a "consulta diferida dentro de ventana/sesión" | No — editorial |
| **RC-13** | **BAJO** | 06 §14 | "Día servido" es interpretación del doc 05 §6, no literal | 05 §6 | Ventanas restantes pasan a oportunistas — extensión razonable pero no aprobada | Marcar como interpretación de diseño | **SÍ** (confirmación) |
| **RC-14** | **MEDIO** | 06 (global) | EP-4E/`resolver_permiso` nunca se nombran; re-evaluación por operación asumida pero no conectada | EP-4E §14 | Integración de autorización queda implícita | Declarar: cada op de sync pasa por `resolver_permiso` con datos frescos | No — integración |
| **RC-15** | **MEDIO** | 06 §5.2 | Sin mecanismo de presión de almacenamiento (borrado prohibido pero no hay alternativa diseñada) | 05 §15 | Cola sin escape bajo disco lleno | Diseñar alerta→protección→priorización→resolución controlada | **SÍ** (diseño) |
| **RC-16** | **BAJO** | 06 §13.1 | En financieras, `confirmacion_id` del backend no prueba que el dinero se movió — `CONFIRMADA` necesita evidencia del proveedor | 05 §14 | Ambigüedad posible en "confirmada" financiera | Exigir confirmación a nivel proveedor para tipo financiera | No — precisión de diseño |
| **RC-17** | **INFORMATIVO** | 06 §8 | Endpoints existentes no soportan idempotency key hoy | F7a §19 | Trabajo de implementación previo | Registrar como dependencia | No |

## 22. Decisiones requeridas

| # | Decisión | Origen | Bloquea |
|---|---|---|---|
| **RC-01** | Financieras: ¿encolables (05/06) u online-only (F7a/F7a.1)? | Contradicción aprobadas | **Todo P1 financiero — bloqueante** → **RESUELTO 2026-10-08** (encolables, doc 08) |
| **RC-04** | Adoptar TTL 15d/45d con marcado en cola doc 06 | F7a.1 cerrado | Esquema de cola → **RESUELTO 2026-10-08** (vigencia diferenciada, doc 08) |
| **RC-05** | Vocabulario canónico de estados (mapear spec/F7a/06) | Divergencia | Máquina de estados, API |
| **RC-06** | ¿NETWORK+CHARGING incluye datos móviles o solo Wi-Fi? | 05 §10 vs 21 §6 | Matriz §14 → **RESUELTO 2026-10-08** (controlada bajo datos móviles, doc 08) |
| **RC-07** | Aclarar "purgar" = marcar/preservar, nunca borrar | docs 17/21 | Preservación |
| **RC-09** | SHA-256 plaintext-vs-ciphertext + DEK única | doc 04 abierto | Cifrado storage/cola |
| **RC-10** | Regla para dependientes de operación rechazada | hueco | Gestor dependencias |
| **RC-13** | Confirmar interpretación "día servido" | 05 §6 | Motor supervivencia |
| **RC-15** | Mecanismo de presión de almacenamiento sin borrado | hueco | Cola |
| **DT-02** | Endpoint único `/api/sync/operaciones` vs por dominio | 06 §17 | API — **DECISIÓN ABIERTA** (análisis §23.1) |
| **DT-04** | `fecha_vencimiento` esquema vs payload | 06 §17 | Esquema cola |
| **DT-05** | Telemetría: alcance/canal/retención | 06 §17, §18 este doc | Observabilidad |
| **DT-06** *(nueva)* | `policy_version` cubre snapshot pero no versiona la **matriz** EP-4E en código — si la matriz cambia, ¿qué versión la identifica? | esta revisión §8 | Re-evaluación EP-4E |

## 23. Riesgos

### 23.1 Endpoint de sincronización — análisis (DT-02, se mantiene ABIERTA)

| Criterio | A) Endpoint único `/api/sync/operaciones` | B) Endpoints por dominio |
|---|---|---|
| Idempotencia | centralizada, una sola tabla de dedup | replicada por endpoint — más superficie de error |
| Autorización EP-4E | dispatcher interno debe conocer `recurso_tipo` por op | natural: cada endpoint ya conoce su recurso |
| Orden/dependencias | trivial (una cola → un receptor) | requiere coordinación cross-endpoint |
| Operaciones financieras | mezcla dominio monetario con genérico — exige bifurcación interna fuerte | separación natural de contrato regulado |
| Versionado del contrato | un contrato para N tipos → esquema genérico de payload débilmente tipado | contrato específico por dominio |
| Auditoría | un punto de entrada uniforme | trazas dispersas pero por dominio |
| Errores/conflictos | semántica común (409 genérico puede ocultar reglas de dominio) | semántica de error propia por dominio |
| Mantenibilidad | añadir tipo = añadir handler interno | añadir dominio = añadir endpoint |
| Seguridad | una superficie grande a endurecer | superficies pequeñas, pero N veces |

**Síntesis:** una opción híbrida (endpoint único de *transporte* que despacha a resolvers de dominio server-side) captura lo mejor de ambas, pero **no se decide aquí** — queda como **DECISIÓN ABIERTA** para la fase de diseño de API.

### 23.2 Riesgos agregados por esta revisión

- **RR-01:** implementar 06 sin RC-02 crea un motor de sync que drena cola sin revalidar sesión — el hueco más probable de regresión real.
- **RR-02:** la contradicción RC-01, si se implementa sin resolver, produce dos comportamientos financieros válidos según qué documento lea cada desarrollador.
- **RR-03:** "purgar cola" (RC-07) mal leído puede traducirse en borrado real de datos de campo — el daño que todo el patrimonio intenta evitar.
- **RR-04:** confiar en Periodic Background Sync como mecanismo universal dejaría a iOS sin ventanas programadas — expectativa de producto falsa.

> _Nota de estado (2026-10-08): RR-02 describe el riesgo de RC-01 **sin resolver** — RC-01 fue resuelto por decisión aprobada; el riesgo descrito ya no aplica como escenario vigente. Registro histórico conservado._

## 24. Recomendación final

**El diseño 06 NO está listo para implementación directa.** Es **sólido y fiel a la especificación 05** en lo que cubre (energía, calendario, prioridades, integridad, preservación), pero presenta **1 contradicción crítica** (RC-01), **2 altas de integración** (RC-02 secuencia de reconexión; RC-03 campos de autorización en cola) y **1 alta de política** (RC-04 TTL) que deben resolverse o integrarse antes.

Ruta recomendada:

1. **Decidir RC-01** (financieras encolables vs online-only) — bloqueante.
2. **Enmendar el doc 06** (o emitir doc 06.1) incorporando: precondición F7a.1 §7, campos de cola faltantes, TTL con marcado, tabla de mapeo de estados, caso datos+energía, clarificación de "purgar" y terminología de derivaciones.
3. **Cerrar decisiones abiertas** DT-02/DT-04/DT-05/DT-06 y RC-09/RC-10/RC-13/RC-15.
4. Solo entonces, liberar el diseño a fase de implementación por fases (orden F7a.1 §12 se mantiene: infraestructura → auth → frontend/offline).

**Nada de lo anterior se implementó ni se modificó.** Este documento solo registra la revisión.

> **Actualización 2026-10-08:** RC-01, RC-04 y RC-06 fueron **resueltos por decisión aprobada** (resoluciones en `08_MATRIZ_DECISIONES_OFFLINE_Y_SUPERVIVENCIA.md`; harmonización aplicada en docs 05, 06, 17 y 21). Permanecen pendientes: RC-02, RC-03, RC-05, RC-07…RC-17 y DT-01…DT-06, más los pendientes históricos registrados en §24.

---

**CHECKPOINT:** código: **sin cambios** · BD: **sin cambios** · config: **sin cambios** · dependencias: **sin cambios** · commit: **NO**. Único artefacto: este documento.
