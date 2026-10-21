# 17 — F7a: DISEÑO DE SESIÓN, REFRESH Y AUTORIZACIÓN OFFLINE

**MELANTIA — sesión · tokens · multi-dispositivo · autorización offline**
Fecha: 2026-10-03 · **SOLO DISEÑO — NADA IMPLEMENTADO.**
Base normativa: `14_ADR_DEFINITIVO_IDENTIDAD_AUTH.md` (F5/F6/F7a-pendiente) · `15_DISENO_TECNICO_IDENTIDAD_AUTH.md` (D4 + **D4.2 §22**) · `16_REVISION_CRITICA_D4.md`.
**F7a es dependencia bloqueante de la implementación de Auth** (D4.2 §22.12).

---

## 1. Objetivo

Diseñar — sin implementar — el modelo de sesión completo: access token, refresh token, rotación, revocación, multi-dispositivo, persistencia segura, autorización offline, revalidación al reconectar y comportamiento ante expiración. Cierra la última decisión pendiente del ADR (F7a) dejando los valores concretos como decisiones marcadas, no inventadas.

## 2. Alcance

Cubrir sesión online y offline para web/PWA hoy y móvil/escritorio futuro. No cubre: implementación, migraciones, D5 Storage, catálogo de suscripciones, ni verificación I0 del proyecto Supabase (listada, no ejecutada).

## 3. Restricciones heredadas de D4.2

| Restricción | Origen |
|---|---|
| `get_current_user → str(usuarios.id)` inmutable; `dependency_overrides` compatible | F6 |
| Verificación por JWKS, `iss`/`aud` estrictos, fail-closed | F5, §22.7-9 |
| `auth.users.email` sintético inmutable; recuperación server-side vía `generate_link` | §22.4 |
| Puente `usuarios_auth_puente` con `estado`; bypass de caché en operaciones sensibles | §5, §22.8 |
| Doble emisor transitorio por `iss` + flag | §10 |
| Operador de recuperación nunca ve la contraseña; cédula no es secreto | §22.4, ADR §6.1 |
| **Sesión ≠ autorización offline; JWT largo prohibido como solución offline** | ADR §5.1 (decisión del usuario) |

## 4. Modelo conceptual — los cinco planos separados

| Plano | Pregunta | Vive en | Duración |
|---|---|---|---|
| **Identidad** | ¿quién es el sujeto? | `usuarios.id` + canónico fiscal (§22.3) | permanente |
| **Autenticación** | ¿demostró ser ese sujeto? | Supabase Auth (credencial → JWT) | instante del evento |
| **Sesión** | ¿sigue activo el vínculo sujeto↔dispositivo? | `melantia_session` (§7) + refresh token | medio plazo |
| **Autorización** | ¿qué puede hacer ahora? | EP-4E + puente.rol + suscripción — **servidor** | por-request |
| **Autorización offline** | ¿qué podía hacer según la última validación conocida? | snapshot local (§9) — **cliente, no autoridad** | ventana de confianza |

Regla: una sesión válida **habilita** trabajo offline dentro de su ventana de confianza; **no otorga** autorización — la autorización siempre la confirma el servidor al ejecutar/sincronizar.

## 5. Access token

| Propiedad | Diseño |
|---|---|
| Propósito | probar autenticación reciente en cada request API |
| Emisor | GoTrue del proyecto `lizqreiyysrqgkzyddff` |
| `iss`/`aud` | `https://<ref>.supabase.co/auth/v1` / `authenticated` (config, no literal) |
| Claims usados | `sub` (auth.users.id), `iss`, `aud`, `exp`, `iat`, `role`; `session_id` si GoTrue lo emite (⏸️ **I0 verificar**) |
| Validación | JWKS cacheado + iss/aud/exp (§9 D4) — criptográfica, offline-capable |
| `kid` desconocido | refresh forzado de JWKS, máx N/min; si no resuelve → 401 |
| TTL | ⏸️ **PENDIENTE DE DECISIÓN** — candidato: default GoTrue (~1 h). Más corto = mejor revocación, más refrescos; más largo = peor revocación. No necesita ser largo: el refresh existe para eso |
| Clock skew | tolerancia pequeña estándar (±30–60 s) — ⏸️ valor en implementación |
| Revocación | **no hay revocación instantánea de un JWT ya emitido** — la mitigación es el check `puente.estado` por request + bypass en sensibles + TTL corto |
| Transporte | header `Authorization: Bearer` (ya existente en `apiClient`) |
| Almacenamiento cliente | **en memoria** (no localStorage) — ver §13 |

## 6. Refresh token

| Propiedad | Diseño |
|---|---|
| Propósito | renovar access token sin re-pedir contraseña — es el verdadero "sostén" de la sesión |
| Emisor/formato | GoTrue — token opaco, no JWT |
| TTL | ⏸️ **PENDIENTE** — configurable en proyecto Supabase; decisión con riesgo (§22) |
| Rotación | GoTrue rota el refresh en cada uso (familia de tokens) — ⏸️ **I0 verificar** comportamiento exacto |
| Reuse detection | presentar un refresh ya rotado → GoTrue invalida la **familia entera** (robo detectable) — ⏸️ **I0 verificar**; el diseño asume esta propiedad |
| Vínculo sesión↔dispositivo | cada login crea sesión nueva en GoTrue → cada dispositivo tiene su propia familia de refresh |
| Logout | `POST /auth/v1/logout` scope `local` (esta sesión) / `global` (todas) — ⏸️ I0 verificar scopes |
| Cambio de contraseña | GoTrue invalida refresh existentes (⏸️ I0 verificar alcance) + MELANTIA añade `puente`-check |
| Recuperación | tras reset vía `generate_link`: revocar familias previas (§22.4 D4.2) |
| Transporte | body JSON hoy — ⏸️ cookie HttpOnly evaluable (§13) |
| **Almacenamiento** | ver §13 — *nunca* en lugares inseguros; nunca en código; nunca `sb_secret_*` en cliente |

## 7. Sesión — `melantia_session` (modelo lógico)

```text
melantia_session (lógico — físico pendiente de decisión §22)
  session_id        — id de sesión GoTrue si se expone, o propio
  usuario_id        — usuarios.id (identidad MELANTIA)
  device_id         — identificador de dispositivo (generado, §13)
  device_label      — "teléfono de Juan", user-agent legible (UX admin)
  created_at / last_seen_at
  expires_at        — derivado del TTL del refresh
  revoked_at / revocation_reason — logout|logout_all|password_change|
                      recovery|admin_revoke|reuse_detected|lost_device
  token_family      — linaje de rotación (diagnóstico de reuse)
```

Sesión = **instancia de autenticación en un dispositivo concreto**. Un usuario tiene N sesiones. ¿Persistir espejo local en BD propia? ⏸️ PENDIENTE — argumentos a favor: auditoría + pantalla "mis dispositivos" + revocación selectiva admin; en contra: duplica lo que GoTrue ya guarda (⏸️ I0 verificar si Admin API lista sesiones por usuario).

## 8. Multi-dispositivo

```text
teléfono ── sesión A (familia A)     navegador ── sesión B (familia B)
   └────────── mismo usuario_id ──────────┘        └─ pc ── sesión C
```

| Acción | Efecto diseñado |
|---|---|
| Logout este dispositivo | revoke sesión actual (scope local) + borrado local total (§13) |
| Logout todos | scope global → todas las familias mueren |
| Revocación selectiva | admin/usuario revoca `session_id` concreto — ⏸️ requiere listado de sesiones (I0) |
| Dispositivo perdido | usuario/operador revoca esa sesión; si no puede identificarla → logout global + reset de password recomendado |
| Dispositivo comprometido | = perdido + cambio de contraseña + auditoría |
| Cambio de contraseña | ver §15 — invalida refresh previos; el access vivo expira naturalmente |
| Sesión única vs. concurrente | **concurrente** — agricultor+técnico compartiendo cuenta es escenario real documentado; ⏸️ PENDIENTE límite máximo de sesiones por cuenta |

## 9. Autorización offline — el núcleo

**"Autenticado offline" = posee sesión local dentro de su ventana de confianza + snapshot de autorización previo.** No significa token sin expiración.

```text
SNAPSHOT DE AUTORIZACIÓN (dato local, no secreto, no autoridad)
  usuario_id
  rol_plataforma conocido
  permisos_efectivos[]      — resumen por (proyecto, recurso_tipo) → nivel
                            (consulta|crear|editar|administrar), calculado
                            SERVER-SIDE y servido al cliente (§18)
  policy_version            — versión del snapshot
  last_validated_at         — última vez que el servidor confirmó
  trust_window_expires_at   — last_validated_at + ventana de confianza
  estado_cuenta             — activo/suspendido (último conocido)
```

| Regla | Justificación |
|---|---|
| El snapshot **gatea la UI/cola** — nunca se acepta como autorización en servidor | servidor = autoridad final en cada sync |
| Operación creada dentro de ventana → entra a cola con el `policy_version` vigente | al sincronizar, servidor re-evalúa con política ACTUAL |
| Operación creada fuera de ventana → **no se permite ni encolar** | ventana agotada = solo lectura de lo cacheado |
| Ventana de confianza | ⏸️ **PENDIENTE DE DECISIÓN** (producto+seguridad). Marco: acotada en tiempo (días, no semanas — referencia no vinculante: la caché actual usa 7 días) y/o en eventos (N operaciones sensibles acumuladas → fuerza revalidación) |
| Nada de secretos en el snapshot | es derivado y revocable al reconectar |

## 10. Ventana de confianza

La ventana **NO** es el TTL del token. Es el período durante el cual la última validación conocida se acepta como base de trabajo:

```text
ONLINE ──► login/refresh OK ──► last_validated_at = ahora
                │
OFFLINE ──► ¿ahora < trust_window_expires_at?
   sí → captura/consulta permitida (§11), cola crece
   no → modo degradado: lectura de caché, 0 escritura nueva,
        UI muestra "reconecta para seguir registrando"
```

Sin valor fijado — la ventana es decisión de producto con riesgo de seguridad (§22). Se fija en implementación tras I0, no aquí.

## 11. Matriz de operaciones offline

| Operación | Online | Offline | Revalida al sync | Razón |
|---|---|---|---|---|
| Consultar datos ya cacheados | sí | sí | no | lectura local; la caché actual (7 días TTL) ya lo hace |
| Cálculos puros locales (geodesia, cronograma) | sí | sí | no | sin efecto servidor — el cache.js existente ya cubre este patrón |
| Crear registro de campo/levantamiento | sí | **sí, a cola** | **sí** | captura es el corazón offline-first; servidor re-evalúa permiso `crear` al sincronizar |
| Editar registro propio local | sí | **sí, a cola** | **sí** | requiere `editar` conocido en snapshot; riesgo de conflicto si otro editó |
| Capturar evidencia (foto/audio) | sí | **sí, a cola** | **sí** | mismo razonamiento; evidencia queda local hasta sync (relaciona con D5 futuro) |
| Sincronizar cola | sí | **no** | n/a | por definición |
| Login | sí | no | n/a | sin red no hay GoTrue |
| Refresh de token | sí | no | n/a | sin red no hay GoTrue — por eso existe la ventana |
| Cambiar contraseña | sí | **no** | sí | REQUIERE_ONLINE — credencial |
| Recuperación / reclamo | sí | **no** | sí | REQUIERE_ONLINE — canal verificado + generate_link |
| Operaciones financieras (pagos, transferencias) | sí | **sí — solo vía `ACEPTADA_OFFLINE`** | sí | REQUIERE_ONLINE la **confirmación** — ~~ni siquiera encolables~~ **SUPERADO POR RC-01 (2026-10-08):** encolables como `ACEPTADA_OFFLINE` (irrevocable por el usuario, sin TTL); solo servidor/proveedor confirma |
| Cambios de permisos/roles/participantes | sí | **no** | sí | REQUIERE_ONLINE — muta autorización |
| Alta/baja representantes de jurídica | sí | **no** | sí | REQUIERE_ONLINE — §22.2 D4.2 |
| Administración de cuenta/suscripción | sí | **no** | sí | REQUIERE_ONLINE — bypass de caché (§22.8) |
| Cambio de titularidad | sí | **no** | sí | REQUIERE_ONLINE — irreversible |
| Registro de cuenta nueva | sí | **no** | sí | REQUIERE_ONLINE — saga D4.2 |

`*` en el diseño: cualquier operación "sí a cola" puede ser rechazada al sincronizar si la política cambió — §14-15, §19.

## 12. Operaciones obligatoriamente online (`REQUIERE_ONLINE`)

Categoría formal: operación que **muta identidad, credenciales, autorización, dinero o titularidad**. Criterio revisable: *si el efecto es irreversible, regula acceso o tiene consecuencia financiera/legal → REQUIERE_ONLINE.* Lista viva — evaluarse cada endpoint nuevo contra el criterio, no memorizar la tabla.

> **Precisión (RC-01, aprobada 2026-10-08):** para operaciones **financieras**, `REQUIERE_ONLINE` sigue aplicando a la **confirmación** — pero la operación puede encolarse como `ACEPTADA_OFFLINE` (irrevocable por el usuario, sin expiración por TTL per RC-04). La regla «ni siquiera encolables» queda **SUPERADA** únicamente para esta categoría; el resto de REQUIERE_ONLINE (credenciales, autorización, titularidad) continúa sin encolarse.

## 13. Almacenamiento local por plataforma

**Estado actual (verificado en código):** `auth.storage.js` persiste `{token, usuario}` en `localStorage` (`melantia.auth`); `cache.js` persiste respuestas en `localStorage` (`melantia.cache.*`, 7 días). localStorage = **sobrevive a cierre, pero es legible por cualquier XSS** — aceptable para el access token de 30 min de hoy; **insuficiente para refresh token**.

| Plataforma | Access token | Refresh token | Diseño |
|---|---|---|---|
| Browser/PWA | **memoria** (variable) — recargar página usa refresh | localStorage/IndexedDB (riesgo XSS mitigado por rotación+reuse-detection) **o** cookie `HttpOnly`+`SameSite` servida por nuestro backend (requiere endpoint propio de refresh + CSRF) — ⏸️ **PENDIENTE** recomendación: cookie propia si se implementa; interim documenta el riesgo | minimizar: access nunca persiste |
| Móvil nativo (futuro) | memoria | **keystore/secure storage del SO** (Keychain/Keystore) — dependencia de implementación | biometría opcional para desbloqueo local |
| Escritorio (futuro) | memoria | store seguro del SO (DPAPI/Keychain) | idem |

Reglas: nada de `sb_secret_*`/service_role/claves backend en cliente jamás; logout borra `melantia.auth` + caché + outbox pendiente del usuario (o la marca como órfana verificable); ⏸️ PIN/bloqueo local de app = decisión de producto pendiente.

## 14. Revocación mientras el dispositivo está offline

```text
admin revoca ──► servidor lo sabe ──► dispositivo NO (está desconectado)
                                     └─ sigue operando con última
                                        política conocida dentro de
                                        su ventana de confianza
```

**Respuesta explícita (no hay magia):**
1. La ventana de confianza acota el daño: pasada la ventana, el dispositivo solo lee.
2. La cola se **sella con `policy_version`** — al reconectar, el servidor rechaza lo ya no autorizado → estado `rechazada` + notificación al usuario (nunca aplicar "porque antes valía").
3. Operaciones críticas ni siquiera se encolan offline (§12) — elimina el vector de alto impacto.
4. Residual aceptado: lectura/captura de datos ya legítimos durante la ventana — es el precio documentado del offline-first.

## 15. Cambio de contraseña desde otro dispositivo

| Elemento | Comportamiento **GoTrue** (⏸️ I0 verificar) | Comportamiento **diseñado por MELANTIA** |
|---|---|---|
| Dispositivo A offline | n/a — no puede saberlo | sigue dentro de ventana; captura sigue entrando a cola |
| Refresh A almacenado | GoTrue lo invalida al cambiar password (⏸️ verificar si revoca todas las sesiones o la actual) | al reconectar: refresh rechazado → **re-login obligatorio**; la cola NO se pierde, queda pausada |
| Access A vivo | sigue válido hasta `exp` | el check `puente.estado` + bypass en sensibles limita el uso restante a su TTL |
| Post-cambio | nuevas sesiones = nueva credencial | `recuperacion_audit` si fue asistida; opción "cerrar todas las sesiones" post-cambio |

## 16. Recuperación (compatibilidad D4.2 §22.4)

Tras recuperación (cualquier caso A/B/C): revocar familias de refresh previas (`admin logout` por usuario — ⏸️ I0 verificar endpoint), dispositivos existentes caen a re-login, evento auditado. La cola offline de un dispositivo cuya sesión fue revocada: **persiste localmente** pero solo sincroniza tras nuevo login exitoso del mismo `usuarios.id`.

## 17. Cambio de roles/permisos con dispositivo offline

```text
tecnico → auditor (admin lo cambia) mientras el teléfono está offline:
  dispositivo: sigue operando como "tecnico" (último snapshot)
               dentro de la ventana → capturas entran a cola
  al reconectar: snapshot nuevo llega como "auditor"
               → operaciones de la cola se re-evalúan como auditor
               → lo que auditor no puede crear = rechazada + notificar
```

**ROL ≠ AUTORIZACIÓN CONTEXTUAL** (separación EP-4E preservada): el snapshot trae el resultado efectivo por alcance, no la lógica del resolver.

## 18. EP-4E y el snapshot mínimo

**No replicar `resolver_permiso` en el cliente.** El servidor calcula, para el usuario, una tabla efectiva compacta:

```text
GET /api/auth/autorizacion_snapshot   (endpoint futuro — diseño)
  → { usuario_id, policy_version, servido_en,
      alcances: [ {proyecto_id, recurso_tipo, nivel} ... ] }
```

- El cliente solo usa el snapshot para **habilitar UI + admitir a cola**.
- En cada operación sincronizada, el backend ejecuta `resolver_permiso` real con datos frescos — servidor = autoridad final.
- Tamaño mínimo: solo alcances del usuario, solo niveles finales — no el grafo de concesiones.

## 19. Cola offline (outbox) — diseño

**Verificado:** hoy NO existe outbox de escritura (solo caché de lectura `cache.js`). Es elemento nuevo:

```text
OUTBOX entry:
  op_id (UUID cliente)      — idempotency key: servidor la respeta,
                              retry nunca duplica
  usuario_id / session_id
  endpoint + payload + recurso_tipo + proyecto_id
  policy_version usada al crear
  created_at_offline
  estado: pendiente|syncing|aceptada|rechazada|conflicto
  retry_count / next_retry_at (backoff exponencial, jitter)
  motivo_rechazo (si aplica)
```

| Regla | Diseño |
|---|---|
| Autenticación al sincronizar | cada op viaja con Bearer actual post-refresh — la op no lleva credenciales propias |
| Idempotencia | `op_id` = idempotency key; el endpoint de sync la respeta (diseño de endpoints existentes debe añadirla — ⏸️ trabajo de implementación) |
| Orden | FIFO por recurso; el servidor puede reordenar si hay dependencias — ⏸️ decisión de implementación |
| Rechazo por autorización | `rechazada` permanente + motivo + notificación — **nunca reintentar ni aplicar** |
| Rechazo por sesión expirada | la cola **pausa** (no se descarta); re-login reanuda |
| Conflicto de datos | `conflicto` → resolución explícita (usuario decide o regla de dominio — ⏸️ por-dominio, no global) |
| Datos sensibles en cola | mismo tratamiento que datos locales; acceso al dispositivo = acceso a la cola (§20 threat C) |

## 20. Reconexión — secuencia diseñada

```text
CONEXIÓN DETECTADA
 1. ¿sesión local existe?            no → login requerido
 2. ¿access token vivo?              sí → ir a 4
 3. refresh: éxito → tokens nuevos (rotación) · fallo/revocado →
    sesión muerta → re-login (cola pausada intacta)
 4. GET autorizacion_snapshot → política ACTUAL + estado cuenta
    · usuario suspendido → modo lectura + purgar cola no enviable
 5. FLUSH outbox (orden + idempotencia) — cada rechazo → estado+motivo
 6. aplicar políticas nuevas a la UI
 7. continuar online
```

El paso 4 precede al flush deliberadamente: revalidar **antes** de enviar evita transportar operaciones ya inválidas.

## 21. Sincronización y conflictos

- Rechazo definitivo ≠ error de red: 4xx de dominio → terminal; 5xx/red → retry con backoff.
- `last_validated_at` se actualiza en **todo request exitoso**, no solo en sync dedicado — la ventana se auto-renueva con uso online normal.
- Resolución de conflictos de contenido es de **dominio** (EP, evidencias, finanzas — reglas propias), no de F7a.

## 22. Threat model F7a

| # | Amenaza | Impacto | Mitigación diseñada | Residual |
|---|---|---|---|---|
| A | Robo de access token | uso válido hasta exp | TTL corto + memoria + bypass en sensibles | ventana = TTL access |
| B | Robo de refresh token | sesión clonable | rotación + **reuse detection** invalida familia (⏸️I0) + revocación por dispositivo | hasta detectar reuse |
| C | Copia del almacenamiento local | datos + cola + refresh expuestos | minimizar secretos · keystore en nativo · cookie HttpOnly si web · bloqueo local (pend.) | extracción física root/jailbreak |
| D | Offline prolongado | expira ventana | ventana acota; expirada = solo lectura | datos obsoletos legibles (caché 7d) |
| E | Suspensión con dispositivo offline | sigue capturando | ventana + cola sellada + rechazo al sync | captura local durante ventana |
| F | Revocación de permisos offline | opera con política vieja | igual que E + re-evaluación por op al sync | igual |
| G | Password cambiado en otro dispositivo | sesión A residual | refresh A muere (⏸️I0) → re-login; access muere a exp; bypass sensibles | ≤ TTL access |
| H | Reuse de refresh | secuestro de sesión | detección mata familia completa | entre robo y primer reuse |
| I | Dispositivo perdido | acceso a sesión activa | revocación selectiva/global + bloqueo local + keystore | hasta revocar (requiere canal) |
| J | Navegador compartido | sesión persistente ajena | logout borra todo · cookie/patrones multiusuario · opción "sesión no persistente" ⏸️ | usuario que no cierra sesión |
| K | Cola con operaciones sensibles | mutación diferida de alto valor | REQUIERE_ONLINE no encola (credenciales/autorización/titularidad); financieras encolables como `ACEPTADA_OFFLINE` desde RC-01 — mitigables con Keystore/biometría, nunca ejecutables offline | residual para financieras encoladas (aceptado en RC-01); nulo para el resto |
| L | Op offline desautorizada al sync | operación fantasma aceptada | **re-evaluación por op obligatoria** — nunca confiar en `policy_version` | nulo si el servidor re-evalúa |

## 23. Decisiones pendientes

| Decisión | Opciones | Recomendación | Estado |
|---|---|---|---|
| TTL access token | default GoTrue ~1h / más corto | default 1h — el refresh existe | ⏸️ PENDIENTE |
| TTL refresh token | días configurable | días (no semanas/meses); re-login natural para campo | ⏸️ PENDIENTE |
| Ventana de confianza offline | N días / N ops sensibles / híbrida | híbrida: tiempo corto + contador de ops | ⏸️ PENDIENTE (producto+seguridad) |
| Rotación refresh | la nativa de GoTrue | sí, nativa | ⏸️ I0 verificar |
| Almacenamiento refresh web | localStorage / IDB / cookie propia HttpOnly | cookie propia (más trabajo) vs localStorage documentando riesgo | ⏸️ PENDIENTE |
| Session binding a dispositivo | device_id generado por cliente + registro | sí, device_id + label | ⏸️ PENDIENTE |
| Device identification | UUID local persistido | UUID + fingerprint suave (UA, plataforma) para UX | ⏸️ PENDIENTE |
| `melantia_session` espejo local | tabla propia / solo GoTrue | tabla espejo si Admin API no lista sesiones (I0) | ⏸️ PENDIENTE tras I0 |
| Logout all tras cambio password | sí/no | sí por defecto | ⏸️ PENDIENTE |
| Revocation model | exp natural / logout activo / lista | exp natural + revocación de familia + puente.estado | ✅ DISEÑADO |
| Authorization snapshot | endpoint dedicado | `GET /autorizacion_snapshot` con policy_version | ✅ DISEÑADO (impl. pendiente) |
| Ops financieras offline | encolables / REQUIERE_ONLINE | ~~REQUIERE_ONLINE (ni encolar)~~ → **SUPERADO POR RC-01 (2026-10-08): encolables como `ACEPTADA_OFFLINE`; confirmación solo online** | ✅ RESUELTO |
| Bloqueo local de app | ninguno / PIN / biometría | PIN+biometría en nativo; opcional web | ⏸️ PENDIENTE (producto) |
| Frecuencia de revalidación | por request / por evento | por request normal + al detectar red | ✅ DISEÑADO |
| Clock skew | ±30–60 s | ±30 s | ⏸️ PENDIENTE (impl.) |
| Expiración offline | leer / leer+bloquear captura | ventana agotada → solo lectura | ✅ DISEÑADO |
| Límite de sesiones por cuenta | N concurrentes | ⏸️ decisión de producto | ⏸️ PENDIENTE |
| Conflicto de datos en cola | regla global / por dominio | por dominio | ✅ DISEÑADO |

## 24. Dependencias I0 (verificación posterior — NO ejecutar)

| # | Qué verificar en `lizqreiyysrqgkzyddff` | Bloquea |
|---|---|---|
| I0-1 | JWKS publicado, `iss`, `aud`, signing keys | todo |
| I0-2 | claim `session_id` en access token | sesión↔token binding |
| I0-3 | comportamiento real de rotación + reuse detection de refresh | §6, threat B/H |
| I0-4 | `POST /auth/v1/logout` scopes (local/global/others) y efecto sobre familias | §8, §15 |
| I0-5 | si cambio de password revoca refresh de otras sesiones | §15 |
| I0-6 | Admin API: listar/revocar sesiones por usuario | §7-8 (espejo local) |
| I0-7 | `generate_link` devuelve `action_link` usable | §16 / D4.2 §22.4 |
| I0-8 | TTLs configurables de JWT/refresh en el proyecto | §5-6 |
| I0-9 | comportamiento de usuario baneado/deleted con tokens vivos | §14-15 |

## 25. Criterios de aceptación (auto-check)

```text
[✓] Identidad/autenticación/sesión/autorización separadas (§4)
[✓] Access y refresh separados (§5-6)
[✓] Sin JWT largo como solución offline (§9 — ventana ≠ TTL)
[✓] Política offline explícita: snapshot + ventana + cola sellada (§9-10,19)
[✓] Offline auth vs validación online distinguidas (§9,18)
[✓] Matriz de operaciones (§11) + REQUIERE_ONLINE (§12)
[✓] Revocación durante offline (§14) · password cross-device (§15)
    · cambio de permisos (§17) · dispositivo perdido (§8)
    · refresh reuse (§6, threat H) · almacenamiento por plataforma (§13)
    · cola (§19) · reconexión/revalidación (§20) · rechazo de ops (§19)
[✓] get_current_user → usuarios.id sin tocar · EP-4E: snapshot, no réplica
[✓] Sin contradicciones con D4.2 · lo no verificable = PENDIENTE/I0
[✓] 0 código · 0 DB · 0 Supabase · 0 .env · 0 tests · 0 git · 0 archivos movidos
```

## 26. Próximo paso

```text
F7a diseñado ──► aprobación del usuario (pendientes §23 a decidir)
             ──► D5 Storage (diseño)
             ──► I0 verificación del proyecto Supabase (solo lectura)
             ──► I1+ implementación controlada
```

---

**INTEGRIDAD F7a:** documentos previos 0 modificados · único artefacto nuevo: este archivo · código/DB/Supabase/.env/tests intactos · git: sin add/commit/push.
