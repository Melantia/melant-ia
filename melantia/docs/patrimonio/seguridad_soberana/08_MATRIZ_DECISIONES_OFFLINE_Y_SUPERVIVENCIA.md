# 08 — Matriz de Decisiones: Seguridad Offline y Modo Supervivencia

> Documento de **análisis de decisiones pendientes**. Deriva de `07_REVISION_CRUZADA_OFFLINE_Y_SUPERVIVENCIA.md` (hallazgos RC-01…RC-17 y abiertas DT-01…DT-06).
> **NINGUNA decisión fue tomada por este documento.** Cada ítem presenta conflicto, fuentes, alternativas, ventajas, riesgos, impacto y recomendación técnica **no vinculante**. Toda decisión requiere aprobación humana explícita.
> Fecha: 2026-10-05 · **Actualización 2026-10-08:** RC-01, RC-04 y RC-06 fueron **resueltos por decisión aprobada** (bloques «Resolución aprobada» en cada sección). Los docs 05, 06, 07 y F7a/F7a.1 (docs 17/21) fueron harmonizados en la misma fecha — solo Markdown. Código, BD, configuración y dependencias: **sin cambios**.

---

## 0. Índice de decisiones

| # | Tema | Severidad origen | Estado |
|---|---|---|---|
| **RC-01** | Operaciones financieras encolables vs online-only | CRÍTICO | **RESUELTO — decisión aprobada 2026-10-08** (financieras encolables: carril `ACEPTADA_OFFLINE` irrevocable; confirmación solo servidor/proveedor) |
| **RC-04** | TTL de cola: sin expiración vs entitlement 15d/45d | ALTO | **RESUELTO — decisión aprobada 2026-10-08** (financieras `ACEPTADA_OFFLINE` sin TTL; resto de la cola conserva TTL por plan) |
| **RC-05** | Vocabulario canónico de estados de operación | MEDIO | **PENDIENTE DE DECISIÓN** |
| **RC-06** | Excepción energética: ¿solo Wi-Fi o cualquier red? | MEDIO | **RESUELTO — decisión aprobada 2026-10-08** (datos móviles + energía = sincronización CONTROLADA, no equivalente a Wi-Fi+energía) |
| **RC-07** | Semántica de "purgar cola" en base normativa | MEDIO | **PENDIENTE DE DECISIÓN** |
| **RC-09** | SHA-256 plaintext-vs-ciphertext + unificación de DEK | MEDIO | **PENDIENTE DE DECISIÓN** |
| **RC-10** | Regla para dependientes de operación rechazada | MEDIO | **PENDIENTE DE DECISIÓN** |
| **RC-13** | Interpretación "día servido" del objetivo diario | BAJO | **PENDIENTE DE DECISIÓN** |
| **RC-15** | Mecanismo de presión de almacenamiento sin borrado | MEDIO | **PENDIENTE DE DECISIÓN** |
| **DT-02** | Endpoint único de sync vs por dominio | — | **DECISIÓN ABIERTA** |
| **DT-04** | `fecha_vencimiento`: campo de esquema vs payload | — | **DECISIÓN ABIERTA** |
| **DT-05** | Telemetría: alcance, canal, retención | — | **DECISIÓN ABIERTA** |
| **DT-06** | Versionado de la matriz EP-4E bajo `policy_version` | — | **DECISIÓN ABIERTA (nueva)** |

Orden de lectura sugerido: RC-01 primero (bloqueante), luego RC-04/RC-05/RC-07 (afectan el esquema de cola), después el resto.

---

## RC-01 — Operaciones financieras: ¿encolables u online-only?

### Conflicto

| Capa | Texto normativo | Estado |
|---|---|---|
| Doc 05 §14 | "MELANTIA puede: preparar, almacenar, **poner en cola**, enviar cuando exista conectividad" (financieras) | APROBADA (posterior) |
| Doc 06 §7/§13 | Financieras = P1, entran a la cola y se confirman con el proveedor | Diseño derivado de 05 |
| F7a (doc 17) §11–§12 | "Operaciones financieras (pagos, transferencias) → Offline: **no — ni siquiera encolables**" | Diseño aprobado (anterior) |
| F7a.1 (doc 21) §6/§11 | "Operaciones sensibles: **online-only — nunca entran al snapshot ni a la cola**" | **CERRADO para implementación** |

Dos capas aprobadas dicen cosas literalmente incompatibles sobre el mismo objeto.

### Distinción analítica requerida (tres conceptos diferentes)

| # | Concepto | Qué es | Efecto en el mundo |
|---|---|---|---|
| 1 | **Ejecutar una operación financiera offline** | Mover dinero, liberar fondos, marcar pago como realizado sin servidor | **Prohibido por todas las capas.** Ninguna fuente lo permite. No hay conflicto aquí |
| 2 | **Preparar una intención financiera offline** | Capturar los datos de la operación (monto, destino, concepto) como *borrador/intención*, sin que sea reenviable ni interpretable como orden de ejecución | Doc 05 §14 lo permite explícitamente ("preparar"). F7a no lo prohíbe nominalmente — habla de "operaciones", no de borradores |
| 3 | **Almacenar una operación financiera en la cola ejecutable de sincronización** | Que la operación viva en la cola como ítem transmisible: al llegar conectividad, el motor la envía y el servidor la procesa | **Punto exacto del conflicto**: doc 05 lo permite ("poner en cola, enviar cuando exista conectividad"); F7a.1 lo prohíbe ("nunca entran a la cola") |

El conflicto real es **solo el concepto 3**: ¿la intención financiera preparada puede convertirse en ítem de la cola que el motor de sync transmite automáticamente?

### Alternativas

**Alternativa A — Mantener F7a/F7a.1 literal (financieras online-only)**
- La intención financiera puede existir como `BORRADOR`/`PREPARADA_OFFLINE` pero **nunca** transita a `PENDIENTE_SINCRONIZACION`; al recuperar conectividad y sesión revalidada, el usuario la confirma interactivamente y se ejecuta online.
- Ventajas: cero cambio normativo en F7a.1 (cerrado); minimiza superficie regulatoria; la transmisión siempre ocurre con autorización fresca y sesión verificada; elimina el escenario "cola de dinero" en un dispositivo perdido.
- Riesgos/costes: fricción de UX (el usuario debe reconfirmar cada operación); el borrador financiero necesita un carril de persistencia distinto a la cola; doc 05 §14 requeriría enmienda formal ("poner en cola" → "preparar y retener hasta sesión online").
- Impacto: doc 06 §7 retira `financiera` del catálogo encolable; §13 requiere confirmación interactiva.

**Alternativa B — Enmendar F7a/F7a.1: distinguir preparación de ejecución**
- Financieras pueden ser ítems de cola (selladas con `policy_version`, cifradas, P1) pero la **transmisión exige sesión fresca verificada** — nunca drenadas por una ventana automática: requieren apertura de app + re-autorización en el momento del envío.
- Ventajas: respeta la letra de doc 05 (posterior y aprobada); mantiene el invariante "offline nunca ejecuta" (el servidor/proveedor confirma); el usuario rural puede preparar el pago en el campo y solo necesita la ventana de envío.
- Riesgos/costes: exige enmienda formal de una decisión CERRADA; introduce un subestado de cola ("requiere_sesion_fresca") y una regla de transporte especial; mayor superficie: una operación financiera dormida en el dispositivo es un objetivo aunque sea solo intención; el TTL/plan y el `expirado_sin_sincronizar` deben definirse también para este carril.
- Impacto: F7a.1 §6 se enmienda ("sensibles online-only" → "sensibles encolables pero transmisión solo con sesión fresca"); doc 06 §4 añade la regla de transporte.

**Alternativa C — Cola separada de alta seguridad para financieras**
- Dos colas: la general (P2/P3 + operaciones críticas no monetarias) y una cola financiera con requisitos extra (cifrado adicional, TTL más corto, re-autorización obligatoria, tope de monto por operación offline).
- Ventajas: permite lo que doc 05 pide sin abrir la cola general; límites explícitos (monto, TTL) acotan el residual.
- Riesgos/costes: duplica infraestructura de cola; más complejidad; sigue requiriendo enmienda de F7a.1; el "tope de monto" es una política de negocio nueva que no existe en ninguna fuente.
- Impacto: mayor de las tres — componente nuevo.

### Riesgos transversales

- **RR-01**: implementar cualquiera sin resolver esto produce dos comportamientos válidos según qué doc lea el desarrollador.
- **RR-02**: bajo B/C, una intención financiera encolada en un dispositivo robado es residual nuevo (mitigable: Keystore, biometría, TTL corto) pero no eliminable.

### Recomendación técnica (no vinculante)

**Alternativa A** es la más conservadora y respeta la decisión cerrada; **Alternativa B** respeta mejor la especificación posterior si se formaliza la enmienda con el carril "sesión fresca obligatoria". La elección es de producto/riesgo regulatorio — **decisión humana obligatoria**.

### Resolución aprobada — 2026-10-08

**Decisión canónica (resuelve el concepto 3):** la operación financiera **sí puede ser ítem de la cola** — puede prepararse offline, validarse según las reglas disponibles localmente, ser aceptada/sellada por el usuario y permanecer en la cola persistente hasta sincronizarse automáticamente cuando exista conectividad válida.

- Flujo canónico: `BORRADOR → PREPARADA_OFFLINE → ACEPTADA_OFFLINE → PENDIENTE_CONFIRMACION_RED → ENVIADA → VALIDANDO → CONFIRMADA`, con ramas `RECHAZADA`, `CONFLICTO` y `REQUIERE_REVISION`.
- La aceptación offline (`ACEPTADA_OFFLINE`) es **irrevocable por el usuario**; `ACEPTADA_OFFLINE` no significa pagada, transferida, cobrada, retirada ni liquidada, ni confirmada por un proveedor financiero.
- `CONFIRMADA` solo se alcanza tras la validación/autorización del servidor y, cuando aplique, del proveedor financiero autorizado.
- **SUPERADA POR ESTA DECISIÓN:** la regla de F7a/F7a.1 «operaciones financieras: ni siquiera encolables» (docs 17 §11–§12 / 21 §6) queda superada — el texto histórico se conserva marcado como superado en ambos documentos. Las demás operaciones REQUIERE_ONLINE (credenciales, autorización, titularidad) siguen sin encolarse.
- Riesgo residual RR-02 (intención financiera encolada en dispositivo robado): **aceptado**; las mitigaciones previstas (Keystore, biometría, protección de la cola) quedan para la fase de implementación.
- Harmonización aplicada: doc 05 §2/§11, doc 06 §6.1a, doc 17 §11–§12/§22–§23, doc 21 §6/§8/§11.

---

## RC-04 — TTL de la cola: sin expiración vs entitlement por plan

### Conflicto

Doc 06 §5.2: "una operación pendiente no expira; solo puede morir por confirmación o cancelación del usuario". F7a.1 (CERRADO) §6/§8/§11: TTL de ítem encolado = entitlement del plan — **15 días base / 45 días planes ≥$15 y Proyectos**; el expirado queda marcado `expirado_sin_sincronizar`, visible al operario, **nunca borrado en silencio**. Doc 05 §15 prohíbe eliminación por límite arbitrario de registros (conteo), no se pronuncia sobre TTL temporal.

### Alternativas

| | A — Sin expiración (doc 06 literal) | B — TTL por plan con marcado (F7a.1 literal) | C — TTL por plan con reactivación |
|---|---|---|---|
| Descripción | La operación vive hasta confirmarse o cancelarse | Expira → `expirado_sin_sincronizar`, marcado y visible | Como B + el usuario puede "re-activar" la operación expirada reingresándola al flujo |
| Ventajas | Máxima preservación; cero ambigüedad | Ya decidido; ancla cola al modelo CUENTA→PLAN→ENTITLEMENTS; acota exposición de datos cifrados dormidos | Conserva el dato útil y permite recuperación explícita |
| Riesgos | Cola crece sin cota; dato obsoleto puede sincronizarse semanas después con contexto inválido | Una operación válida puede "morir" si el usuario no encuentra red en 15 d — mitigado por el marcado, no eliminado | Complejidad: reactivar requiere re-sellar `policy_version` y re-validar snapshot |
| Impacto | Requiere enmendar F7a.1 | Requiere corregir doc 06 §5.2 | Requiere corregir doc 06 + definir flujo de reactivación |

### Impacto

Esquema de cola (campo `expira_en` derivado de entitlement), ciclo de vida con marcado, y UX de "expiradas visibles". Nota: el TTL por plan ya vive en el snapshot F7a.1 (`cola_max_dias`), así que B/C reutilizan una decisión tomada.

### Recomendación técnica (no vinculante)

**B o C** — adoptar lo ya cerrado en F7a.1 evita doble política; C añade recuperación amable coherente con "detectar→preservar→recuperar". La frase del doc 06 "no expira" es el punto a corregir, no el principio de preservación (que F7a.1 ya respeta con marcado).

### Resolución aprobada — 2026-10-08

**Decisión canónica — vigencia diferenciada por categoría:**

- **Operaciones financieras `ACEPTADA_OFFLINE`:** **no expiran por TTL**. Permanecen almacenadas hasta una resolución válida: `CONFIRMADA`, `RECHAZADA`, `CONFLICTO`, `CANCELADA_CONFIRMADA` (con la evidencia requerida) u otra resolución formalmente aprobada.
- **Resto de operaciones de cola:** conservan las reglas de vigencia/TTL según su naturaleza, plan o política — el entitlement 15 d/45 d de F7a.1 sigue vigente para ellas, con marcado `expirado_sin_sincronizar` (nunca borrado en silencio).
- **Datos de campo/evidencias:** nunca se eliminan automáticamente por antigüedad.

Efecto documental: la regla del doc 06 §5.2 «una operación pendiente no expira» queda **SUPERADA** por la vigencia diferenciada (doc 06 ya harmonizado); F7a.1 §6/§8/§11 conserva el TTL por plan con la exclusión explícita de la categoría financiera aceptada offline. Harmonización aplicada: doc 05 §11/§15, doc 06 §5.2, doc 21 §6/§8/§11.

---

## RC-05 — Vocabulario canónico de estados

### Conflicto

Tres vocabularios coexisten:

| Capa | Estados |
|---|---|
| Doc 05 §5 (mínimos aprobados) | `BORRADOR, PREPARADA_OFFLINE, PENDIENTE_SINCRONIZACION, ENVIADA, VALIDANDO, CONFIRMADA` |
| F7a §19 / F7a.1 §6 | `pendiente, syncing, aceptada, rechazada, conflicto, expirado_sin_sincronizar` |
| Doc 06 §6 | los 6 del spec + `ERROR` + "revisión" — **sin marcar como propuesta** |

### Alternativas

| | A — Spec 05 canónico + estados terminales añadidos | B — Vocabulario F7a canónico | C — Dos capas: estado técnico (cola) + estado semántico (UI) |
|---|---|---|---|
| Descripción | Adoptar los 6 + `RECHAZADA`, `CONFLICTO`, `EXPIRADA_SIN_SINCRONIZAR`, `ERROR_RET` (retriable) como extensiones aprobadas | Migrar doc 05/06 a nombres F7a | El ítem de cola usa estados F7a (técnicos); la operación de negocio usa los 6 del spec |
| Ventajas | Una sola máquina; los 6 del spec se respetan literalmente; los faltantes cubren rechazo/conflicto/expiración | No duplica conceptos ya en uso | Separa limpia: transporte vs negocio; cada capa evoluciona sin romper la otra |
| Riesgos | Mezcla responsabilidades en una máquina | Reescribe vocabulario aprobado en 05 | Doble estado = riesgo de divergencia si no hay mapeo obligatorio |
| Impacto | Doc 06 §6 + tabla de mapeo | Enmienda de doc 05 | Diseño adicional de mapeo |

### Impacto

Contrato de API de sync, auditoría de transiciones, UI. Las divergencias sin resolver producen estados "fantasma" entre capas.

### Recomendación técnica (no vinculante)

**A o C.** La opción C es arquitectónicamente más limpia (la cola es infraestructura; el spec es negocio) pero más costosa. En ambas, los estados terminales `RECHAZADA`/`CONFLICTO`/`EXPIRADA` deben existir con semántica definida (terminal vs retriable vs usuario-decide).

---

## RC-06 — Excepción energética: ¿solo Wi-Fi o cualquier red?

### Conflicto

Doc 05 §10: la oportunidad especial es "Wi-Fi disponible + fuente de energía". F7a.1 §6 (decidido): la app drena la cola automáticamente "cuando detecta conectividad **y** el dispositivo está conectado a energía (constraints tipo WorkManager `NETWORK+CHARGING`)" — sin restricción de tipo de red. El caso **datos móviles + enchufado** queda indefinido en 05/06 y cubierto en F7a.1.

### Alternativas

| | A — Solo Wi-Fi+energía (05 literal) | B — Cualquier red+energía (F7a.1 literal) | C — Wi-Fi+energía completo; datos+energía solo P1 |
|---|---|---|---|
| Ventajas | Conserva megas del usuario rural — datos móviles cuestan dinero | Simple, ya decidido; maximiza drenaje | Compromiso: lo crítico siempre puede drenar enchufado; lo pesado espera Wi-Fi |
| Riesgos | Una P1 urgente enchufado+datos espera ventana del calendario | Posible consumo de datos móviles en sync masivo P3 (fotos) | Una regla más en la matriz; requiere reconfirmar F7a.1 |
| Impacto | Enmendar F7a.1 §6 | Enmendar doc 05 §10 | Enmienda menor en ambos |

### Impacto

Matriz doc 05 §12 / doc 06 §14; constraint del scheduler de plataforma.

### Recomendación técnica (no vinculante)

**C** — preserva la protección de datos móviles para contenido pesado (P3, imágenes) sin bloquear lo crítico cuando hay energía. Es la opción que menos contradice a ambas fuentes.

### Resolución aprobada — 2026-10-08

**Decisión canónica (variante de C):**

- Wi-Fi + energía → sincronización completa, en cualquier día/hora (excepción del calendario, doc 05 §7).
- **Datos móviles + energía → sincronización CONTROLADA:** prioriza P1/P2 y evita transferencias pesadas no urgentes; **no** equivale a Wi-Fi + energía.
- Sin conectividad → cola local persistente.

Principio canónico: la batería determina la capacidad para procesos intensivos; la conectividad determina si es posible transmitir; el tipo de red determina la política de consumo de datos. Harmonización aplicada: doc 05 §7/§9 y doc 06 §14; el drenaje `NETWORK+CHARGING` de F7a.1 §6 queda acotado a política controlada bajo datos móviles.

---

## RC-07 — Semántica de "purgar cola"

### Conflicto

La base normativa se contradice a sí misma:

- F7a.1 §7.2: sesión `revocada`/`sospechosa` → "abortar, **purgar cola** y snapshot".
- F7a §20.4: usuario suspendido → "modo lectura + **purgar cola no enviable**".
- F7a §16: "la cola offline de un dispositivo cuya sesión fue revocada **persiste localmente**".
- F7a.1 §11: "Autodestrucción: sesión/snapshot sí; **datos de cola nunca**".
- Doc 05 §15–16: preservación es principio de seguridad; nunca destruir.

### Alternativas

| | A — "Purgar" = borrado real | B — "Purgar" = marcar no-enviable + preservar | C — "Purgar" = marcar + aislar (cuarentena) |
|---|---|---|---|
| Descripción | Borrado literal de ítems | Ítems quedan cifrados, marcados `no_enviable`, sin posibilidad de sync hasta rehabilitación | Como B + movidos a partición lógica separada, fuera de la vista operativa, recuperables por soporte |
| Ventajas | Dispositivo comprometido no retiene nada | Coherente con F7a §16 y doc 05; reversible si fue falso positivo | Máxima higiene operativa sin pérdida |
| Riesgos | **Contradice doc 05 §16 y F7a.1 §11** — pérdida de trabajo de campo; es autodestrucción de facto | La cola "muerta" ocupa espacio indefinidamente | Complejidad; UX de recuperación a definir |
| Impacto | Enmienda grave de 05 y F7a.1 | Aclaración editorial en docs 17/21 | Componente adicional de cola |

### Impacto

Preservación de datos de campo; coherencia normativa.

### Recomendación técnica (no vinculante)

**B** — es la única lectura compatible con la totalidad de las fuentes ("nunca destruir datos" es regla más fuerte y posterior). Aclarar en 17/21 que "purgar" significa *invalidar para envío preservando bytes*. C es una evolución posible si la higiene operativa lo exige.

---

## RC-09 — SHA-256 plaintext vs ciphertext y unificación de DEK

### Conflicto

Doc 04 §5 dejó abierta la tensión: sha256 de *plaintext* permite dedup e integridad pero es oráculo de contenido (confirma si el atacante ya posee el fichero); sha256 de *ciphertext* rompe dedup con DEK/nonce aleatorios. Además doc 06 §12 propone DEK-dispositivo para la cola — existe riesgo de crear un **segundo sistema de claves** incompatible con el de snapshot F7a.1 §6.

### Alternativas

| | A — sha256 plaintext + DEK unificada | B — sha256 ciphertext + DEK unificada | C — Doble hash |
|---|---|---|---|
| Descripción | Hash del contenido original; cifrado con la misma DEK-infraestructura del snapshot | Hash del objeto cifrado; dedup por otro mecanismo (op_id) | `sha256_contenido` (dedup/integridad de dominio) + `sha256_objeto` (integridad física) |
| Ventajas | Dedup y verificación de integridad funcionan (D5 §14/§18); oráculo de riesgo bajo (requiere poseer el fichero) | Sin oráculo | Cubre ambos usos sin ambigüedad |
| Riesgos | Oráculo de contenido aceptado | Pierde dedup por contenido — dos fotos idénticas duplican storage | Complejidad; dos campos que mantener coherentes |
| Impacto | Metadatos + decisión cifrado (S2.6) | Cambia semántica de `sha256` en storage_objects | Esquema de metadatos |

Sobre la DEK: la decisión es casi independiente — **una sola infraestructura de clave de dispositivo** para snapshot y cola (DT-03 debería resolverse a "misma DEK"); dos sistemas duplican superficie de custodia y riesgo de divergencia.

### Impacto

Esquema `storage_objects`/cola, dedup, decisión de cifrado cliente-vs-servidor (S2.6, aún pendiente en doc 04).

### Recomendación técnica (no vinculante)

**A o C + DEK única**. El oráculo de sha256-plaintext es un residual bajo ya analizado en doc 04; perder dedup exacto (B) tiene coste real de cuota. Esta decisión depende de S2.6 (cifrado de objetos) — registrarla como dependiente.

---

## RC-10 — Dependientes de operación rechazada

### Conflicto

Doc 06 §9 define que una operación solo entra al lote si sus dependencias están `CONFIRMADA`, pero no define qué ocurre cuando una dependencia resulta `RECHAZADA` (autorización perdida, conflicto terminal, etc.).

### Alternativas

| | A — Dependiente queda bloqueada permanente | B — Dependiente pasa a revisión | C — Rechazo en cascada |
|---|---|---|---|
| Descripción | Se marca `bloqueada_por_dependencia`, visible, sin envío; el usuario decide re-enlazar o cancelar | Igual que A pero con estado `CONFLICTO`/revisión y notificación contextual | Toda la cadena se marca rechazada |
| Ventajas | Nunca se envía huérfana; preserva el dato | Da una vía de resolución explícita | Simple, consistente |
| Riesgos | Puede quedar bloqueada para siempre sin UX de salida | Requiere UX de revisión | Cascada puede ser injusta (la dependiente podría tener sentido propio) |
| Impacto | Máquina de estados + UI | Ídem + notificación | Máquina de estados |

### Impacto

Máquina de estados, UI de cola, notificaciones.

### Recomendación técnica (no vinculante)

**B** — coherente con el tratamiento de conflictos (doc 06 §13.4): revisión explícita, preservación, notificación contextual. Nunca cascada silenciosa.

---

## RC-13 — "Día servido": interpretación del objetivo diario

### Conflicto

Doc 05 §9: "procurar al menos una sincronización exitosa por día cuando exista una oportunidad real de conectividad". Doc 06 §14 lo interpreta como: tras la primera sync exitosa del día, las ventanas restantes pasan a modo oportunista (no obligatorio).

### Alternativas

| | A — Ventanas siempre activas | B — "Día servido" (interpretación 06) | C — Ventanas activas pero degradadas |
|---|---|---|---|
| Descripción | Cada ventana intenta sync aunque ya haya una exitosa | Tras éxito diario, ventanas solo aprovechan oportunidades (evento `online`, Wi-Fi+energía) | Ventanas restantes solo transmiten P1 si aparece |
| Ventajas | Máxima frescura de datos | Menos consumo; respeta el literal "al menos una" | Críticas nunca esperan al día siguiente |
| Riesgos | Consumo innecesario cuando no hay nada nuevo | P1 creada a las 11:00 espera si el día ya está "servido" — salvo que eventos la activen | Regla intermedia a documentar |
| Impacto | Motor de supervivencia | Aclaración de diseño | Matriz §14 |

Nota de matiz: en B, la aparición de una P1 nueva tras el "día servido" probablemente debería reactivar la búsqueda — el objetivo diario es un mínimo de *salud de sync*, no un tapón de operaciones críticas.

### Recomendación técnica (no vinculante)

**B con enmienda**: "día servido" desactiva las ventanas *programadas* restantes, pero una P1 nueva (o evento `online`) puede gatillar una sesión fuera de calendario. Requiere confirmación humana porque extiende el texto aprobado.

---

## RC-15 — Presión de almacenamiento sin borrado

### Conflicto

Doc 05 §15 prohíbe borrar pendientes; doc 06 §5.2 lo implementa pero no diseña qué ocurre cuando el dispositivo se queda sin espacio físico — el hueco real.

### Alternativas

| | A — Congelar captura baja prioridad | B — Cuarentena/exportación manual | C — Degradación de contenido nuevo |
|---|---|---|---|
| Descripción | Al alcanzar umbral de disco: alerta → se suspende captura nueva P3 (fotos grandes) → P1/P2 siguen → al reconectar, P1 sube primero | Como A + opción usuario de exportar evidencias a medio externo (SD/OTG) | Nuevas fotos se guardan solo como optimizada (sin original) — **viola doc 05 §15** |
| Ventajas | Preserva todo lo existente; prioriza lo importante | Libera presión sin perder datos | — |
| Riesgos | El usuario puede necesitar seguir capturando | Flujo de exportación nuevo | **Incompatible con la especificación** — descartable |
| Impacto | Gestor de almacenamiento + notificaciones | + flujo exportación | — |

Mecanismo conceptual recomendado (independiente de la alternativa): `alerta (80%) → protección (congelar capturas nuevas de baja prioridad, jamás las existentes) → priorización (P1 primero al reconectar) → resolución controlada (usuario decide: exportar, esperar, liberar)` — **nunca "borrar los más antiguos"**.

### Recomendación técnica (no vinculante)

**A** como base obligatoria; **B** como mejora futura de UX rural. C debe descartarse explícitamente.

---

## DT-02 — Endpoint único de sync vs endpoints por dominio

### Conflicto

Doc 06 §4.3 propone `POST /api/sync/operaciones` único y lo dejó abierto (DT-02). El análisis completo A-vs-B-vs-híbrido está en doc 07 §23.1.

### Alternativas

| | A — Endpoint único | B — Por dominio | C — Híbrido: transporte único + dispatch a dominio |
|---|---|---|---|
| Ventajas | idempotencia centralizada; orden FIFO natural; un punto de auditoría | autorización EP-4E natural por recurso; contratos tipados; financiero separado | transporte/cola uniformes + autorización y validación de dominio preservadas |
| Riesgos | dispatcher interno debe re-implementar conocimiento de dominio; esquema de payload débilmente tipado | idempotencia replicada N veces; coordinación de orden cross-endpoint | dos niveles de contrato que versionar |
| Impacto | API + dispatcher | N endpoints + lógica de cola por dominio | Endpoint + router interno + contratos por dominio |

### Recomendación técnica (no vinculante)

**C** — el transporte (cola, idempotencia, orden, auditoría) es transversal; la autorización/validación es de dominio y EP-4E ya vive server-side. La forma exacta del contrato queda para la fase de diseño de API. **DECISIÓN ABIERTA — se mantiene.**

---

## DT-04 — `fecha_vencimiento`: campo de esquema vs atributo de payload

### Conflicto

Las operaciones "con vencimiento" (P1, doc 05 §11) necesitan representar la fecha límite. Doc 06 §7 la ubica en payload y la dejó abierta.

### Alternativas

| | A — Campo de esquema `vence_en` | B — Atributo dentro de `payload` |
|---|---|---|
| Ventajas | Consultable/indexable: "¿qué vence pronto?" sin deserializar; la cola puede re-priorizar por urgencia; UI genérica de cuenta regresiva | Esquema mínimo; cada dominio define su semántica; no todas las ops vencen |
| Riesgos | Un campo que la mayoría de ops lleva NULL | La cola no puede priorizar por urgencia sin abrir payload; vencimientos invisibles a la infraestructura |
| Impacto | Esquema de cola | Contratos por dominio |

### Recomendación técnica (no vinculante)

**A** — la urgencia temporal es una propiedad de *transporte* (afecta orden y alertas), no solo de negocio. Campo NULL por defecto mantiene el esquema limpio. **DECISIÓN ABIERTA — se mantiene.**

---

## DT-05 — Telemetría: alcance, canal, retención

### Conflicto

Doc 06 DT-05 quedó abierto; doc 07 §18 propuso la clasificación operacional/seguridad/auditoría y las exclusiones.

### Alternativas

| | A — Telemetría como operaciones P3 en la propia cola | B — Canal separado de telemetría | C — Solo auditoría local, sin envío |
|---|---|---|---|
| Ventajas | Reutiliza toda la infraestructura (prioridad, idempotencia, reintento); no requiere endpoint nuevo | No contamina la cola de negocio; loteable y comprimible | Máxima privacidad; cero exfiltración |
| Riesgos | Eventos de seguridad se atrasan detrás del backlog | Infraestructura adicional | Sin diagnóstico remoto — los fallos rurales son invisibles |
| Impacto | Cola + tipos de operación | Servicio de telemetría | Solo storage_audit local |

Exclusiones obligatorias en cualquier alternativa: tokens, refresh, cookies, PIN, claves, datos financieros sensibles en claro, contenido privado de operaciones, biometría.

### Recomendación técnica (no vinculante)

**A para auditoría + B para operacional**, o A unificado si se acepta que eventos de seguridad viajen con prioridad propia. Decisión de producto/observabilidad. **DECISIÓN ABIERTA — se mantiene.**

---

## DT-06 — Versionado de la matriz EP-4E bajo `policy_version` *(nueva)*

### Conflicto

`policy_version` (F7a) versiona el **snapshot** servido al cliente. Pero la matriz EP-4E (rol × recurso × nivel) vive en **código versionado y testeado** (EP_MODELO_DATOS §14.1), no en datos: si la matriz cambia entre el encolado offline y la re-evaluación en sync, el servidor rechaza correctamente — pero el cliente no puede saber *por qué* cambió la respuesta, ni distinguir "concesión revocada" de "matriz actualizada".

### Alternativas

| | A — `policy_version` incluye versión de matriz | B — Dos versiones separadas | C — Solo motivo de rechazo estructurado |
|---|---|---|---|
| Descripción | El snapshot declara `matriz_version` junto a `policy_version` | `policy_version` (datos) + `authz_rules_version` (código desplegado) | Sin versionado nuevo: el rechazo devuelve `motivo` legible ("permiso revocado" vs "política actualizada") |
| Ventajas | Traza completa: la operación sabe contra qué reglas se evaluó | Separa dato volátil (concesiones) de regla estática (matriz) | Cero infraestructura de versionado |
| Riesgos | Requiere versionar la matriz en código (semver interno) | Dos números que mantener coherentes | El cliente no puede reconciliar diferencias sistemáticas |
| Impacto | Snapshot + esquema cola + versionado de matriz | Ídem | Contrato de error |

### Recomendación técnica (no vinculante)

**B o C** — si la matriz cambia poco, C basta (el motivo estructurado ya mejora la UX); si cambiará con frecuencia, B da trazabilidad real. Decisión ligada al ritmo de evolución de EP-4E. **DECISIÓN ABIERTA — se mantiene.**

---

## Resumen de impacto por decisión

| # | Si se resuelve a favor de… | Desbloquea | Riesgo residual |
|---|---|---|---|
| RC-01 | **RESUELTO 2026-10-08:** financieras encolables vía `ACEPTADA_OFFLINE` (irrevocable; confirmación solo servidor/proveedor) | Carril financiero offline | Superficie regulada en dispositivo (RR-02 aceptado) |
| RC-04 | **RESUELTO 2026-10-08:** vigencia diferenciada — financieras `ACEPTADA_OFFLINE` sin TTL; resto con TTL por plan | Esquema de cola definitivo | Ops válidas marcadas expiradas |
| RC-05 | Vocabulario canónico único | API + máquina de estados | Migración conceptual de docs |
| RC-06 | **RESUELTO 2026-10-08:** datos móviles + energía = sincronización controlada (P1/P2, sin pesadas no urgentes) | Matriz consolidada | — |
| RC-07 | "Purgar" = marcar preservando | Coherencia normativa | Cola muerta ocupa espacio |
| RC-09 | DEK única + hash definido | Cifrado cola/storage | Depende de S2.6 (RoT pendiente) |
| RC-10 | Dependiente → revisión | Gestor de dependencias completo | UX de revisión a diseñar |
| RC-13 | "Día servido" con reactivación por P1 | Motor de supervivencia | Regla adicional a documentar |
| RC-15 | Alerta→protección→priorización→resolución | Cola bajo presión de disco | Captura nueva pausada |
| DT-02 | Híbrido transporte+dispatch | Diseño de API | Doble contrato que versionar |
| DT-04 | Campo `vence_en` | Re-priorización por urgencia | NULLs mayoritarios |
| DT-05 | Clasificación telemetría | Observabilidad | Canal/retención por definir |
| DT-06 | Versionado de matriz o motivo estructurado | Re-evaluación EP-4E explicable | Mantener versionado o pérdida de trazabilidad |

## Regla de cierre

Este documento **analiza y no decide**. Toda decisión requiere aprobación humana explícita. Ningún código, esquema, configuración ni documento normativo previo fue modificado.

---

**CHECKPOINT:** código: **sin cambios** · BD: **sin cambios** · config: **sin cambios** · dependencias: **sin cambios** · docs harmonizados 2026-10-08 (solo Markdown): 05, 06, 07, 17 (F7a), 21 (F7a.1), matriz de credenciales y master · commit: **NO**.
