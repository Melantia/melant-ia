# MELANTIA — Revisión Cruzada de Seguridad Soberana y Decisiones Pendientes

> Documento de **validación arquitectónica**. Contrastado contra: código real (backend/frontend), F7a.1 (doc 21), F7a (doc 17), D4.2 (docs 14–15), D5 (doc 18), EP-4E.
> **Nada aquí está implementado ni autoriza implementación.** Clasificaciones: `compatible` · `compatible con condición` · `requiere decisión` · `contradictorio` · `riesgo no resuelto` · `no verificable`.

---

## 1. Resumen ejecutivo

La propuesta de Seguridad Soberana (docs 01–03) es **arquitectónicamente sólida en dirección** pero contiene:

- **1 contradicción real con decisión vigente** — custodia del refresh token (§3.1, CR-01): F7a.1 §9 decidió que el RT **nunca sale del backend**; la implementación Fase ③ lo devuelve al cliente.
- **2 correcciones de severidad** — F-02 (stubs no usados por ningún endpoint: riesgo latente, no exposición activa) y F-01 (la rama HS256 verifica pero ya no emite).
- **3 decisiones estructurales no resueltas** — cifrado de `cedula_ruc` vs UNIQUE/blind index (§3.4), inmutabilidad efectiva de `PEPPER_IDENTIDAD` (§3.5), y elección de custodia RoT (§3.2).
- **1 afirmación de doc 02 que necesita matización** — "tres compromisos independientes" para backups es cierto solo *después* del cifrado; un atacante en el servidor de BD lee datos en claro *antes* (§3.7).

Veredicto global: el diseño es aprobable como **dirección**, pero la siguiente fase debe resolver las 16 decisiones de §10 antes de autorizar implementación.

---

## 2. Hallazgos F-01–F-13 revisados

| F | Veredicto | Evidencia suficiente | Severidad revisada | Notas de contraste |
|---|---|---|---|---|
| F-01 JWT HS256 default | **Compatible con condición** | Sí (`security.py:33`, `config.py:74`) | ALTO→**ALTO condicionado** | `auth_legacy_issuer_enabled` default `True` → la rama HS256 **verifica** tokens sin `iss`. Pero `create_access_token` tiene **cero callers** en `modules/`/`shared/`/`main.py` → ningún endpoint emite tokens locales ya (Fase ③ sustituyó login). El riesgo real: tokens forjados con el default son *aceptados* mientras el flag esté on. Condición para retirar HS256 definitivamente: confirmar que no existen tokens legacy válidos en circulación (TTL 30 min → ya expiraron todos) → el flag puede ir a `false` en `.env` como paso previo, y luego eliminarse la rama. Antes de producción: **obligatorio**. |
| F-02 stubs de autorización | **Compatible con condición** | Sí — pero **corrección**: grep muestra que `require_role`/`require_subscription`/`check_resource_limit`/`verify_resource_ownership` solo aparecen en sus docstrings y `__all__` | ALTO→**MEDIO-ALTO latente** | **Ningún endpoint los usa hoy** — no hay exposición activa. El peligro es el *futuro*: un desarrollador los enchufa creyendo que funcionan. Acción correcta: implementarlos **o** convertirlos en fail-closed (raise si se invocan) hasta que EP-4E los gobierne. Relación con EP-4E: `require_subscription`/`check_resource_limit` son entitlements (plan), `verify_resource_ownership`/`require_role` mapean al resolver contextual EP-4E — **no deben implementarse como sistema paralelo** (ver §6). |
| F-03 `db_password` default | **Compatible** | Sí (`config.py:58`) | ALTO ✓ | Es default de pydantic → si el env no lo define, el backend *corre* con la credencial publicada. Acción: fail-closed (`None` default + error al arrancar sin valor). Desarrollo local: el `.env` local ya lo define — no rompe nada. |
| F-04 token en localStorage | **Compatible con condición** | Sí (`auth.storage.js`) | ALTO ✓ | Contrastado con F7a.1 §9: la decisión vigente ya es "AT en memoria + cookie HttpOnly de sesión MELANTIA". Doc 02 lo refleja. **Pero** la implementación actual también devuelve `refresh_token` al cliente (ver CR-01). El fix F-04 debe implementarse *junto* con la custodia server-side del RT, no solo mover el AT. Web y móvil requieren estrategias distintas (F7a.1 §6: Keystore/Keychain vía shell nativo; PWA pura no alcanza Keychain). |
| F-05 caché offline 7 días | **Compatible con condición** | Sí (`cache.js`) | ALTO ✓ | Tensión confirmada pero no contradicción: F7a.1 separa *autorización* (snapshot 72 h) de *datos encolados* (TTL por plan 15/45 d). El caché de **respuestas de lectura** (7 d, en claro) no encaja en ninguna de las dos categorías — es un tercer almacén sin clasificar. Decisión pendiente: qué clases de dato pueden cachearse, con qué cifrado y TTL. La cola outbox (15/45 d cifrada) es distinta del caché de lectura. |
| F-06 credenciales legacy en env/proceso | **Compatible** | Sí | MEDIO ✓ | `SupabaseAuth` (security.py) es stub sin callers pero instancia `supabase_auth` global → la `service_role` key se carga en memoria del proceso al importar. Eliminar la clase + las vars es acción correcta y sin regresión (nada las llama). |
| F-07 log BD sin redacción | **Compatible** | Sí (`database.py`) | MEDIO ✓ | Correcto. Además `get_db` envuelve excepciones en `DatabaseConnectionError` con `str(e)` — la redacción debe aplicarse en ambas capas. |
| F-08 sin rate limiting | **Compatible** | Sí | MEDIO ✓ | Dependencia reconocida. Diseño en §5 de este documento. |
| F-09 backup sin cifrar | **Compatible** | Sí (fichero en workspace) | MEDIO→**ALTO en práctica** | Un `pg_dump` comprimido en claro contiene *todo* — para un sistema que quiere "backup robado ≠ datos legibles", tener uno en claro en el Desktop es la brecha más trivial de cerrar (moverlo/borrarlo/cifrarlo). No requiere la arquitectura completa para mitigar lo inmediato. |
| F-10 sin CI/CD ni protección de release | **Compatible** | Sí (no `.github/`; remote GitHub existe) | MEDIO ✓ | Imprescindible antes de producción real: branch protection + required reviews + firma fuera de CI. El resto (SLSA, reproducible) es avanzado y puede llegar después (ver §3.8). |
| F-11 `sanitize_input` ingenuo | **Compatible** | Sí | BAJO ✓ | Mitigado por queries parametrizadas. Nota: los stubs de ejemplo en `dependencies.py` interpolan `f"SELECT ... FROM {resource_type}"` — si se implementan así, sería SQL injection. El comentario de backlog debe advertirlo. |
| F-12 raíz Git compartida | **Compatible** | Sí (`git rev-parse` → padre) | BAJO ✓ | Correcto. Decisión de repo pendiente. |
| F-13 `.env` en claro en disco | **Compatible** | Sí | BAJO-MEDIO ✓ | sops/age como mitigación barata; secret manager como destino. |

**Correcciones de severidad:** F-01 se mantiene ALTO pero con la precisión de que el riesgo es de *verificación* (no emisión); F-02 baja de exposición-activa a riesgo-latente; F-09 sube a ALTO en práctica por la trivialidad del vector.

---

## 3. Compatibilidad con F7a / F7a.1

### 3.1 CR-01 — CONTRADICCIÓN: custodia del refresh token ⚠

| Fuente | Decisión/implementación |
|---|---|
| **F7a.1 §9 (DECIDIDO)** | "El RT no sale del backend. MELANTIA custodia el RT por `session_id` en `sesiones` (cifrado at-rest, campo separado, nunca serializado al cliente)". Cliente: AT en memoria + cookie HttpOnly. |
| **F7a Fase ③ (implementado)** | `login`/`registro`/`refresh` devuelven `"refresh_token": grant["refresh_token"]` al cliente (`auth_service.py:236,378,423`; `schemas.py:41,51,64`). `refresh_token_enc` está NULL. Frontend `auth.service.js` guarda el AT en localStorage; el RT se devuelve pero el frontend actual no lo almacena (no hay flujo de refresh en el cliente aún). |
| **Doc 02 §6 (diseño)** | Recomienda cookie HttpOnly + RT fuera de localStorage — **compatible con F7a.1, contradictorio con el código actual**. |

**Análisis Opción A vs B solicitado:**

| | Opción A: RT al cliente (estado actual) | Opción B: custodia server-side (F7a.1 §9) |
|---|---|---|
| Robo de RT | XSS/localStorage/exfiltración de cliente lo entrega completo | Exige comprometer backend + BD + clave de vault |
| Detección de replay | §4 funciona igual | §4 funciona igual + el atacante ni siquiera posee el RT |
| Complejidad cliente | Simple (cliente maneja refresh directo… pero F7a.1 §4 ya exige que el refresh pase por backend) | Cookie de sesión + endpoint de refresh que usa `session_id` — no RT del cliente |
| `refresh_token_enc` | Permanece NULL → el campo y `VAULT_KEY` provisionada quedan sin uso | Requiere S2.2 (cifrado AES-256-GCM) — ya diseñado |
| Estado actual | Ya implementado | Requiere cambiar contrato cliente/servidor |

**Determinación:** F7a.1 ya decidió **Opción B**. La implementación actual es una desviación documentada de la decisión — probablemente pragmática (el frontend aún no consume refresh), pero deja al RT viviendo donde F7a.1 dijo que no debe vivir.

**Recomendación: REQUIERE DECISIÓN DEL USUARIO.** Dos caminos coherentes:
- (a) Mantener la decisión F7a.1 §9 → planificar migración a cookie HttpOnly + `refresh_token_enc` cifrado (S2.2 gana prioridad, y el contrato de `/refresh` cambia de "recibir RT" a "cookie de sesión").
- (b) Enmendar F7a.1 §9 formalmente → aceptar RT en cliente con los hardening del §6 doc 02 (storage seguro, nunca localStorage).

La opción (a) es la arquitectónicamente consistente con todo lo demás. **No implementar ninguna sin autorización.**

### 3.2 Resto de compatibilidad F7a.1

| Elemento doc 02 | F7a.1 | Veredicto |
|---|---|---|
| AT corta duración + sesión MELANTIA como verdad | §2 "JWT necesario nunca suficiente" | Compatible |
| Device binding (`dispositivo_id`) | §3 ancla sesión↔dispositivo | Compatible |
| Biometría/PIN | §6 cadena Biometría→PIN→re-auth | Compatible |
| Snapshot 72 h, `policy_version`, outbox, revalidación | §6/§7 | Compatible — doc 02 no los toca |
| Revocación 3 alcances | §5 | Compatible |
| Lock inactividad 5 min, autodestrucción = sesión/snapshot no datos | §6 | Doc 02 no contradice; debería citar la regla "datos de cola nunca" explícitamente en la sección de protección local |
| Cliente verifica firma del backend/artefacto | No contemplado en F7a.1 | **Adición nueva** — no contradictorio, pero es superficie extra: el cliente modificado puede saltarse el check; el control real sigue siendo server-side (compatible con condición: documentar la limitación, ya hecho en doc 02 §11) |
| Detección de anomalías | §4 (colisión, dispositivo nuevo, geo-salto) | Compatible — doc 02 añade "volumen de sync anómalo", coherente |

**Cliente nunca es autoridad** — doc 02 respeta esto (snapshot firmado, revalidación en sync, revocación server-side). Compatible.

---

## 4. Compatibilidad con D4.2 (identidad)

### 4.1 Cifrado de `usuarios.cedula_ruc` — REQUIERE DECISIÓN / RIESGO NO RESUELTO

`cedula_ruc` no es un campo pasivo. Es eje estructural:

| Uso actual (verificado) | Mecanismo |
|---|---|
| `usuarios.cedula_ruc UNIQUE` — dedup de registro (D4.2 §22.3, F4) | Constraint sobre el canónico |
| `usuarios_auth_puente.cedula_ruc UNIQUE` — dedup y lookup | Constraint + búsqueda por canónico |
| Login: `cédula input → pipeline → canónico → lookup` | `buscar_puente_por_cedula` |
| Concurrencia de registro | UNIQUE serializa dos requests de la misma cédula → 409/reclamo |
| Derivación email sintético | `HMAC(pepper, canónico)` — **no lee la columna, recalcula** |

**Consecuencia:** cifrar `cedula_ruc` con AEAD de nonce aleatorio rompe UNIQUE, lookup y dedup. Opciones:

| Opción | Descripción | Problemas |
|---|---|---|
| A. Cifrado determinista | Mismo plaintext → mismo ciphertext | Filtra igualdades; frecuencia de cédulas conocibles (espacio pequeño y enumerable — cédulas ecuatorianas son un dominio de ~10 dígitos con dígito verificador predecible → cifrado determinista ≈ oráculo trivial) |
| B. Blind index + cifrado AEAD | Columna `_enc` (nonce aleatorio) + columna `_idx` = HMAC-SHA256(clave-índice, canónico) | Funciona para UNIQUE/lookup/dedup (índice estable); ya hay precedente interno (huella_identidad HMAC). Requiere segunda clave de dominio (KEK-identidad) y decisión de qué va en cada columna |
| C. No cifrar cédula, solo contacto/PII adyacente | Dejar el canónico en claro como "pseudo-identificador" | La cédula es PII regulada; pero ya circula en `user_metadata` de Supabase (`user_metadata:{cedula_ruc}` — D4.2 §22.4) y en el puente — cifrar solo la tabla `usuarios` da cobertura parcial |

**Recomendación: Opción B** (blind index versionado `key_id` + `_enc` AEAD), pero **requiere decisión explícita** porque cambia el esquema, migra filas existentes y debe cubrir `usuarios`, `usuarios_auth_puente` y (decisión aparte) `user_metadata` en Supabase. El HMAC del índice debe ser de **dominio separado** del pepper (distinta clave) para que rotaciones sean independientes.

### 4.2 PEPPER_IDENTIDAD — efectivamente INMUTABLE (riesgo documentado)

Rotar el pepper cambia `HMAC(pepper, canónico)` → cambia el synthetic email → **todo login existente muere** (el email de Supabase ya no se deriva igual). Opciones:

| Estrategia | Viabilidad |
|---|---|
| Pepper inmutable + custodia máxima | Simple y honesto: tratarlo como Raíz de identidad. Pérdida/compromiso = procedimiento ceremonial |
| Pepper versionado (`pepper_id`) | Backend deriva con versión actual; los emails existentes llevan versión vieja → login prueba versiones en orden — filtra la versión en patrones de timing; añade complejidad real |
| Rotación con migración | Re-derivar emails de todos los usuarios vía Admin API — operación masiva, ventana de indisponibilidad |
| Re-canonicalización admin (D4.2 §22.6) | Ya existe como procedimiento excepcional para cambio de dato fiscal — extensible a pepper pero es manual por usuario |

**Decisión pendiente:** la opción práctica es pepper inmutable con custodia ceremonial (backup m-de-n como la RoT) + el procedimiento §22.6 documentado como única vía de cambio. **No rotar ni tocar el pepper actual.**

### 4.3 Personas jurídicas — Compatible

El diseño de seguridad no toca NAT/JUR. El blind index propuesto opera sobre el canónico completo (`NAT:`/`JUR:`), preservando la distinción. RUC-natural colapsa a cédula antes del índice — coherente con D4.2 §22.3. No se mezcla autenticación con representación: la representación JUR sigue siendo decisión pendiente de D4.2, no afectada por esta capa. **Sin conflicto.**

---

## 5. Compatibilidad con D5 Storage

| Elemento D5 | Propuesta de cifrado | Veredicto |
|---|---|---|
| `storage_objects` (metadatos en PG, binarios en provider) | DEK por objeto; `wrapped_dek`+`key_id` como columnas nuevas | Compatible con condición — requiere migración futura M-x |
| Bucket por sensibilidad (evidencias-priv / docs-sens / media-pub) | Clasificación doc 02 alinea 1:1 | Compatible |
| `sha256` para integridad + dedup por contenido | ⚠ Tensión: sha256 de *plaintext* (dedup funciona, pero es oráculo de contenido — confirma si el atacante ya tiene el fichero) vs sha256 de *ciphertext* (dedup imposible con DEK/nonce aleatorios) | **Requiere decisión** — recomendado: conservar sha256 plaintext para dedup/integridad + aceptar el oráculo (bajo: requiere que el atacante posea ya el fichero) |
| INTENT→UPLOAD→CONFIRM→VERIFY→ACTIVE | Cifrado cliente-side vs server-side | **Requiere decisión** — server-side (backend cifra antes de escribir al provider) es compatible con signed URL vía proxy; cliente-side da E2E pero complica el cliente y la dedup |
| Autorización por scope → EP-4E | Sin cambio | Compatible |
| Versionado `supersedes_id` | Cada versión = objeto cifrado independiente | Compatible |
| Outbox de uploads offline | Objeto cifrado en cola local | Compatible con condición — la cola cifrada ya era F7a.1 §6 |

**Proveedor no elegido** — correcto, pendiente con la decisión de RoT.

---

## 6. Compatibilidad con EP-4E

El diseño introduce roles de **plano de control** (operador/custodio/propietario/desarrollador/infraestructura) que son **distintos** de los roles de **plano de datos** EP-4E (P/PR/CL/CO/TE/AU/PW × none/consulta/crear/editar/administrar).

| Riesgo | Evaluación |
|---|---|
| ¿Sistema paralelo de autorización? | **Compatible con condición** — los roles §7.1 son *administrativos de plataforma*, no de recursos de negocio. Debe quedar explícito que un "operador" de plataforma NO hereda permisos EP-4E sobre proyectos/fincas; y viceversa, un rol AU en EP-4E NO es custodio de claves. Doc 02 §7.1 lo separa en tablas distintas — suficiente, pero la implementación debe impedir que la cuenta admin se use como identidad de negocio. |
| Concesiones/revocación/expiración/`policy_version`/contextual | No tocados | Compatible |
| `require_subscription`/`check_resource_limit` (F-02) | Son entitlements del plan (IDENTIDAD→CUENTA→SUSCRIPCIÓN→PLAN) — deben implementarse consultando `usuarios_suscripciones`, **no** como sistema nuevo | Compatible con condición — encaja en el modelo canónico |

**Sin conflicto**, siempre que plano-de-control y plano-de-datos no compartan identidades.

---

## 7. Revisión del backlog S0–S7

| ID | Tarea | Dependencia | Riesgo | Estado | Acción recomendada |
|---|---|---|---|---|---|
| S0.1 | Quitar default JWT HS256 | Ninguna | Bajo | Listo con condición | **APROBAR PARA IMPLEMENTACIÓN** — fail-closed; complementar con `AUTH_LEGACY_ISSUER_ENABLED=false` en `.env` tras confirmar que no hay tokens legacy en circulación (TTL 30 min ⇒ ya no hay) |
| S0.2 | Quitar default `db_password` | Ninguna | Bajo | Listo | **APROBAR** — fail-closed |
| S0.3 | Eliminar `SupabaseAuth` stub + vars legacy del `.env` | Confirmar sin callers (auditado: solo stub) | Bajo | Listo | **APROBAR** — sin regresión |
| S0.4 | Logging con redacción en `database.py`/`dependencies.py` | Decidir stack | Bajo | Requiere mini-diseño | **REQUIERE DECISIÓN** (stack de logging) — trivial después |
| S0.5 | Autorización real de stubs | EP-4E/entitlements | Medio | No listo | **REQUIERE DISEÑO ADICIONAL** — implementar consultando modelo canónico; fail-closed interino |
| S0.6 | Mover/cifrar backup `.gz` existente | Manual | Bajo | Listo | **APROBAR** — mitigación inmediata; no requiere arquitectura |
| S0.7 | Rate limiting auth | Decisión §5 este doc | Medio | Diseño adjunto | **REQUIERE DECISIÓN** (ver §5) |
| S0.8 | `PAYPHONE_SECRET_KEY` malformada | — | — | **Separado** | **POSPONER — pendiente separado, requiere autorización explícita. NO TOCAR** |
| S1.1 | Sacar AT de localStorage | CR-01 (custodia RT) | Medio | Bloqueado | **REQUIERE DECISIÓN** — hacer junto con cookie HttpOnly + RT server-side |
| S1.2 | Clasificar caché offline | Clasificación doc 02 | Medio | Listo | **APROBAR** (diseño/clasificación, no implementación) |
| S1.3 | Cifrar caché + TTL ≤72 h | S1.2 | Medio | Diseño parcial | **REQUIERE DISEÑO ADICIONAL** (qué clases, librería WebCrypto) |
| S1.4 | Device binding efectivo | Tabla existe | Medio | Listo diseño | **APROBAR PARA DISEÑO** |
| S1.5 | Keystore/Keychain móvil | App nativa/shell | — | Futuro | **POSPONER** — F7a.1 §6 ya lo prevé con shell nativo |
| S2.1 | Decisión custodia RoT | Aprobación usuario | — | **Bloqueante** | **REQUIERE DECISIÓN** — bloquea S2.x/S3.x/S6.x |
| S2.2 | Cifrar `refresh_token_enc` | CR-01 + spec crypto | Medio | Bloqueado | **REQUIERE DECISIÓN** — solo si se confirma Opción B; si se mantiene RT en cliente, el campo sigue NULL y esta tarea se cancela |
| S2.3 | Migrar pepper/vault a KMS | S2.1 | Medio | Bloqueado | **REQUIERE DECISIÓN** (proveedor) |
| S2.4 | Cifrar `cedula_ruc`/`contacto` | Blind index §4.1 + S2.1 | Alto | Bloqueado | **REQUIERE DECISIÓN** — blind index separado del pepper |
| S2.5 | Cifrar GPS fincas/lotes/etc. | S2.4 | Alto | Bloqueado | Tras S2.4 |
| S2.6 | Cifrar objetos storage | D5 + S2.1 + decisión cliente/server-side | Alto | Bloqueado | **REQUIERE DECISIÓN** (§5) |
| S2.7 | Índices ciegos de búsqueda | S2.4 | Alto | Diseño adicional | **REQUIERE DISEÑO ADICIONAL** |
| S3.1–S3.4 | Backups cifrados + WORM + 3-2-1 + restore | S2.1 + cuenta separada | Medio-Alto | Bloqueado | **REQUIERE DECISIÓN** (proveedor/cuenta) — S3.4 (drill) puede diseñarse ya |
| S4.1 | Branch protection + reviews + firma commits | Admin GitHub | Bajo | Listo | **APROBAR** — primer paso real de supply chain |
| S4.2–S4.6 | CI reproducible + SBOM + firma + SLSA + verificación cliente | CI provider + S2.1 | Alto | Diseño | **REQUIERE DECISIÓN** (CI) — S4.3 (firma fuera de CI) es el control obligatorio; SLSA/reproducible son avanzados |
| S5.1–S5.5 | Roles admin + MFA + JIT + break-glass + two-person | Modelo admin + proveedor identidad | Alto | Diseño | **REQUIERE DISEÑO ADICIONAL** — two-person rule con requisitos criptográficos de §3.11 |
| S6.1–S6.5 | Lockdown + propagación + runbook + auditoría externa + RoT ceremonial | S2.1, S5.x | Alto | Diseño | **REQUIERE DISEÑO ADICIONAL** — §3.12/§3.13 de este doc |
| S7.1–S7.4 | Secret manager + `.env` cifrado + scan historial + rotación | S2.1 (S7.1); herramienta (S7.2) | Bajo-Medio | Mixto | S7.2 **APROBAR** (sops/age, barato); S7.3 **APROBAR** (gitleaks — hallazgo, no cambio); S7.1 **REQUIERE DECISIÓN**; S7.4 tras S7.1 |

---

## 8. Contradicciones encontradas

| ID | Contradicción | Gravedad | Resolución requerida |
|---|---|---|---|
| **CR-01** | F7a.1 §9 (RT nunca sale del backend) vs implementación Fase ③ (RT al cliente) + doc 02 §6 (cookie HttpOnly) | **Alta** — decisión vigente incumplida en código | Decisión del usuario: (a) migrar a custodia server-side, o (b) enmendar F7a.1 |
| **CR-02** | Doc 02 §4: "tres compromisos independientes" para leer un backup — solo cierto *post-cifrado*; un admin del servidor PG lee datos en claro *antes* del backup | Media — matización honesta | Aclarar: el aislamiento de la cadena de backup (proceso dedicado que cifra con credencial distinta a la del backend operativo) es lo que hace verdadera la propiedad; el servidor PG siempre puede leer su propia BD — el cifrado por campo (S2.x) es lo que limita también ese vector |
| **CR-03** | Caché offline de lectura 7 días (`cache.js`) no encaja en ninguna categoría F7a.1 (autorización 72 h / cola 15-45 d) | Media | Decisión: definir TTL y cifrado del caché de lectura por clase de dato (S1.3) |
| **CR-04** | `user_metadata:{cedula_ruc}` en Supabase (D4.2 §22.4) vs cifrar `cedula_ruc` localmente — cifrado parcial | Baja-Media | Si S2.4 se aprueba, decidir si el metadata remoto también se minimiza |

No hay contradicciones con EP-4E ni con D4.2 NAT/JUR (salvo la complejidad del cifrado de cédula, que es decisión, no contradicción).

---

## 9. Riesgos adicionales identificados en la revisión

| # | Riesgo | Origen |
|---|---|---|
| R-01 | `verify_password`/`get_password_hash`/`create_access_token`/`decode_access_token`/`SupabaseAuth` siguen exportados y vivos aunque sin callers — superficie de código muerto que un futuro desarrollador puede "reactivar" sin notar que es legacy | security.py |
| R-02 | `usuarios.password_hash` (columna legacy) + `negocios_rurales/models.py:12` `password_hash: str` — hashes bcrypt de la era pre-Supabase; si el modelo de negocio los usa, doble fuente de credencial | auditoría F7a |
| R-03 | `get_current_user_optional` (dependencies.py:231-255) usa solo `verify_token` local HS256 — tokens Supabase (con `iss`) caen a la rama legacy de verify y devuelven `None` → comportamiento asimétrico no documentado | dependencies.py |
| R-04 | Lockdown: si el servicio de estado depende del KMS y el KMS está caído, fail-closed = plataforma sellada entera — la disponibilidad del plano de control se convierte en dependencia de disponibilidad del plano de datos. Diseño debe separar "estado de protección" (ligero, consultable sin KMS) de "descifrado" (requiere KMS) | §3.12 |
| R-05 | Blind index de cédula: el dominio de cédulas es enumerable (~10⁷ con dígito verificador) → HMAC sin salt es oráculo de "¿existe esta cédula?" para quien robe la clave del índice. Mitigación: la clave del índice vive en KMS igual que KEK — mismo nivel de custodia, aceptable pero documentado | §4.1 |
| R-06 | Rate limiting por `identidad HMAC` permite enumeration-resistance, pero por IP en campo rural (CGNAT) puede bloquear a muchos usuarios legítimos detrás de la misma IP — diseño debe combinar señales, no una sola | §5 |

---

## 10. Matriz final de decisiones

| # | Decisión | Estado actual | Impacto | Dependencias | Riesgo | Recomendación | ¿Requiere autorización? |
|---|---|---|---|---|---|---|---|
| 1 | RoT/HSM/KMS | No elegido | Bloquea S2/S3/S5/S6 | Coste, jurisdicción, operación | Alto | Híbrido: RoT en HSM externo (custodia propietario), KEK en KMS cloud | **SÍ — propietario** |
| 2 | Proveedor CI/CD | Ausente | Bloquea S4 | GitHub ya es remote | Medio | GitHub Actions (ya es el remote) salvo decisión contraria | **SÍ** |
| 3 | Secret manager | `.env` plano | Bloquea S7.1 | S2.1 | Medio | sops/age interino → Vault/SM definitivo | **SÍ** |
| 4 | Blind indexes | No existe | Desbloquea S2.4 | Clave de índice separada | Alto | Blind index HMAC versionado por dominio, clave ≠ pepper | **SÍ** |
| 5 | Cifrar cédula/RUC | Decisión abierta | Cambia esquema + migración | Blind index (4), KMS (1) | Alto | Sí, con blind index; decisión de alcance (puente + user_metadata) | **SÍ** |
| 6 | Rotación PEPPER | Inmutable de facto | Rompe todos los logins si rota | Custodia ceremonial | Crítico | Tratar como inmutable con backup m-de-n; §22.6 como única vía | **SÍ** |
| 7 | Persistencia RT | **CR-01: RT al cliente, `refresh_token_enc` NULL** | Custodia vs exposición | Cambio de contrato | Alto | Confirmar F7a.1 §9 (Opción B) → cookie HttpOnly + `refresh_token_enc` cifrado; **si no, enmendar F7a.1** | **SÍ — decisión pendiente urgente** |
| 8 | Estrategia backups | Backup en claro en Desktop | Recuperación real | KMS + cuenta separada | Alto | Cifrado con DEK-backup + WORM + 3-2-1 + drills | **SÍ** |
| 9 | Rate limiting | Ausente | Protege auth | Diseño §5 | Medio | Multicapar por IP+identidad+dispositivo, anti-enumeración | **SÍ (diseño adjunto)** |
| 10 | Autorización real | Stubs no-op, sin callers | Bloquea exposición futura | EP-4E/entitlements | Alto latente | Fail-closed interino + implementar sobre modelo canónico | **SÍ** |
| 11 | Almacenamiento tokens cliente | AT en localStorage, RT devuelto | XSS | CR-01 | Alto | Cookie HttpOnly (web) + Keystore/Keychain (nativo); AT en memoria | **SÍ** |
| 12 | Política offline 72 h | Vigente, no implementada | Cliente | F7a.1 cerrado | — | Mantener; añadir cifrado de snapshot con DEK-dispositivo | Parcial — implementación futura |
| 13 | Admin/MFA | No existe plano de control | Compromiso admin | Proveedor identidad admin | Alto | Roles separados + FIDO2 + JIT + break-glass | **SÍ** |
| 14 | Two-person rule | Solo diseño | Operaciones críticas | S5.x, §3.11 | Medio | Órdenes firmadas con doble aprobación criptográfica | **SÍ** |
| 15 | Lockdown | Solo diseño | Contención | S5, S6 | Medio | Servicio de estado fail-closed, separado de KMS (R-04) | **SÍ** |
| 16 | Auditoría externa | `audit_eventos` en misma BD | Integridad de evidencia | Canal externo/WORM | Medio | Hash-chain + export a almacén separado + firma | **SÍ** |

---

## 11. Orden recomendado de implementación (tras decisiones)

```
GATE: resolver decisiones §10 (especialmente 1, 5, 7) antes de código
   ↓
S0 (higiene): S0.1 S0.2 S0.3 S0.6 S0.7* S7.2 S7.3     — trivial/barato, alto impacto
   ↓
CR-01: custodia RT + cookie HttpOnly (S1.1 + S2.2)    — desbloquea seguridad de cliente
   ↓
S4.1 (branch protection) + S0.5 fail-closed           — integridad y autorización básicas
   ↓
S2.x cifrado de datos (tras decisión RoT)             — S2.4 → S2.5 → S2.6
   ↓
S3.x backups + S5.x admin + S6.x lockdown/auditoría   — capas operativas
```

*S0.7 tras decidir diseño §5.

---

## 12. Elementos que NO deben implementarse todavía

- **S0.8 `PAYPHONE_SECRET_KEY`** — pendiente separado, autorización explícita requerida. **NO TOCAR.**
- **S2.2 `refresh_token_enc`** — bloqueado por CR-01 hasta que el usuario confirme Opción B o enmiende F7a.1.
- **S2.4/S2.5/S2.6 cifrado por campo/objeto** — bloqueados por decisión de RoT y blind index.
- **S5.x/S6.x (admin, two-person, lockdown)** — requieren el plano de control definido; implementarlos sin los roles crea sistema paralelo.
- **Migración JUR/representación** — fuera de alcance (D4.2 pendiente).
- **Cualquier rotación de PEPPER** — tratado como inmutable hasta decisión.
- **Verificación de firma en cliente** — útil solo tras existir firma de release (S4.3).

---

## 13. Gate de autorización para la siguiente fase

Para autorizar la siguiente fase de implementación, el usuario debe resolver:

1. **CR-01** — ¿Confirmar F7a.1 §9 (RT server-side + cookie) o enmendar a RT-en-cliente?
2. **RoT** — ¿HSM externo / KMS cloud / híbrido? (decisión de negocio: coste, jurisdicción).
3. **Cifrado de cédula/RUC** — ¿Aprobar blind index + migración? ¿Alcance (puente, user_metadata)?
4. **PEPPER** — ¿Declarar formalmente inmutable + procedimiento §22.6 como única vía?
5. **CI/CD** — ¿GitHub Actions u otro?
6. **S0 completo** — ¿Autorizar los ítems listos (S0.1, S0.2, S0.3, S0.6, S7.2, S7.3)?

Todo lo demás puede diseñarse en paralelo, pero **nada se implementa** hasta que estas decisiones estén cerradas.

---

**Checkpoint:** código: sin cambios · BD: sin cambios · Supabase: sin cambios · `.env`: sin cambios · usuarios: 0 · claves: 0 · commit/push: NO. Único artefacto nuevo: este documento.
