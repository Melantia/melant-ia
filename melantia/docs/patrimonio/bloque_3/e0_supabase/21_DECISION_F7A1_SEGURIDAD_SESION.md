# F7a.1 — DECISIÓN FORMAL DE SEGURIDAD DE SESIÓN
# MELANTIA — Bloque 3 / E0-Supabase

**Fecha:** 2026-10-04
**Tipo:** ADR ejecutable (decisión de implementación, no propuesta abierta)
**Estado:** ✅ CERRADO para implementación (matriz §11 + orden estricto §12)
**Base de evidencia:** I0 (19), I0.1 (19 §I0.1), I0.2 (19 §I0.2), F7a (17), D4.2 (15)

---

## 0. HECHO QUE ORIGINA ESTA DECISIÓN

I0.2-B demostró **CASO C**: el proyecto `lizqreiyysrqgkzyddff` rota refresh tokens pero **no invalida el token anterior fuera de ~10 s ni ejecuta family-kill** observable (reuse de RT1 a los 30 s → HTTP 200; RT2 siguió válido).

**Conclusión vinculante:** la rotación de Supabase es un mecanismo operativo, **no una garantía antireplay**. MELANTIA no puede delegar en GoTrue la detección de robo/reutilización de refresh tokens.

---

## 1. DECISIÓN — OPCIÓN B (defensa MELANTIA-side)

**DECIDIDO:** MELANTIA mantiene su propio registro y control de sesión como **verdad de seguridad**. Supabase es una capa de autenticación; la sesión autorizada es propiedad de MELANTIA.

```
            AUTENTICACIÓN                      AUTORIZACIÓN / CUSTODIA
     ┌───────────────────────┐        ┌────────────────────────────────┐
     │     Supabase Auth      │        │        MELANTIA backend         │
     │  · credenciales        │        │  · validación JWT ES256/JWKS    │
     │  · emisión AT + RT     │  ───►  │  · registro de sesiones         │
     │  · rotación mecánica   │        │  · familia / session_id         │
     │  · ban / pw-change     │        │  · detección de replay local    │
     │  · ES256 + JWKS        │        │  · revocación por alcance       │
     └───────────────────────┘        │  · snapshot offline acotado     │
                                      └────────────────────────────────┘
```

Rechazada la Opción A (depender de `reuse_interval` de GoTrue) porque convertiría un comportamiento de configuración remota — verificado como no protector — en la única línea de defensa contra el vector más grave (robo de RT = suplantación persistente).

`reuse_interval` de Supabase **no se toca aún**: queda como capa adicional opcional a evaluar tras implementar la defensa propia. ⏳ CONFIRMAR en fase de endurecimiento.

---

## 2. QUÉ CONTROLA CADA SISTEMA (límite explícito)

| Capacidad | Supabase | MELANTIA |
|---|---|---|
| Verificar credenciales (email sintético + pw) | ✅ único | — |
| Emitir/rotar AT y RT | ✅ único | consume, nunca emite |
| Firmar JWT (ES256) + JWKS | ✅ único | valida |
| Ban / password-change → mata sesiones Supabase | ✅ (verificado I0.1) | replica la revocación |
| **Existencia y estado de sesión autorizada** | — | ✅ **verdad** |
| Familia de sesión por dispositivo | — | ✅ único |
| **Detección de replay/anomalía** | ❌ (CASO C) | ✅ **único** |
| Revocación selectiva por dispositivo/sesión | parcial | ✅ verdad operativa |
| Ventana de confianza offline | — | ✅ único |
| Revalidación de autorización en sync | — | ✅ único |

Regla: un JWT válido de Supabase es **condición necesaria, nunca suficiente**. La autorización exige además sesión MELANTIA activa.

---

## 3. `session_id` Y FAMILIA DE SESIÓN

- **Identidad de sesión:** el claim `session_id` del JWT (verificado: presente, distinto por login, **estable a través de refresh**). Es el ancla sesión↔dispositivo.
- **Familia:** `familia := session_id`. La cadena completa de rotaciones RT1→RT2→…→RTn pertenece a un solo `session_id`. No se inventa un ID propio: se usa el de Supabase para no duplicar identidad.
- **Registro local — tabla `sesiones` (MELANTIA, nueva en implementación):**
  - `id` (uuid interno), `auth_session_id` (= claim `session_id`, UNIQUE),
  - `usuario_id` (→ `usuarios.id`, vía puente), `dispositivo` (nombre/UA declarado por el cliente + hash de fingerprint opcional),
  - `estado`: `activa | revocada | expirada | sospechosa`,
  - `rotaciones_observadas` (contador), `ultimo_refresh_at`, `creada_en`, `expira_en`, `revocada_en`, `motivo_revocacion`,
  - `ultimo_ip` (detección, no bloqueo — campo móvil cambia de red).
- Alta de sesión: en el endpoint de login MELANTIA (que ejecuta password-grant server-side). Cada login = nueva fila.

---

## 4. ROTACIÓN Y DETECCIÓN LOCAL DE REPLAY

**DECIDIDO:** el refresh **siempre pasa por el backend MELANTIA** (el cliente nunca llama a `grant_type=refresh_token` de Supabase directamente). Esto convierte cada rotación en un evento observable:

1. Cliente envía `session_id` (del AT expirado) + su RT → backend.
2. Backend verifica que `auth_session_id` exista y esté `activa`; reenvía el RT a Supabase.
3. Al rotar con éxito: `rotaciones_observadas += 1`, `ultimo_refresh_at = now`.
4. **Detección — señales de replay/robo que la capa local SÍ puede ver:**
   - Refresh para `session_id` `revocada`/`sospechosa` → rechazado + alerta.
   - Dos refresh del mismo `session_id` en < `ROTATION_MIN_GAP` (**5 s, DECIDIDO**) → **sesión → `sospechosa`**: exige re-login (el cliente legítimo reintenta tras renovar AT; el atacante con RT robado y el legítimo no pueden refrescar simultáneamente sin colisión). El patrón legítimo es ~1 refresh/hora; dos actores sobre la misma sesión producen colisiones.
   - Actividad con JWT cuyo `session_id` no existe en `sesiones` (sesión creada fuera del flujo MELANTIA) → rechazado.
   - **Dispositivo nuevo** → re-autenticación completa inherente (un dispositivo nuevo no tiene `sesiones` activa) + **alerta** al usuario/cuenta al registrar el primer login desde ese dispositivo.
   - **Cambio de ubicación satelital respecto a la habitual** → señal de riesgo (**no prueba**: el GPS lo reporta el cliente y es falsificable) → exige re-autenticación + **alerta**. DECIDIDO por el usuario 2026-10-04. Matiz operativo: el trabajo de campo implica movimiento — la regla debe comparar contra un rango razonable de ubicaciones habituales/declaradas, no contra un punto fijo, para no bloquear al operario legítimo que cambia de sitio de trabajo. Si la ubicación no es verificable o el dispositivo no la reporta → no bloquear, solo registrar.
   - Salto geográfico/de fingerprint brusco → marca `sospechosa` en operaciones sensibles (no bloqueo general: móviles cambian de red).
5. **Limitación honesta que esta capa NO cubre:** un atacante que robe el RT y refresque *una sola vez* antes que el legítimo no colisiona de inmediato — el robo se detecta cuando el legítimo intenta usar su cadena (rotación ya consumida, aunque Supabase la acepta por CASO C el `ultimo_refresh_at`/`rotaciones_observadas` diverge del patrón esperado del cliente). La detección es **de convergencia**, no preventiva. ⏳ CONFIRMAR aceptación de este residual.

---

## 5. REVOCACIÓN — TRES ALCANCES

| Alcance | Acción MELANTIA | Acción Supabase | Resultado |
|---|---|---|---|
| **Sesión/dispositivo** | `estado=revocada` en `sesiones` | `admin logout scope=local` sobre la sesión (mata el RT; verificado I0.1-G) | AT vivo expira en ≤3600 s; `puente.estado`/check de sesión lo bloquea de inmediato en sensibles |
| **Todas las sesiones del usuario** | todas → `revocada` | `admin logout scope=global` | re-login requerido en todos los dispositivos |
| **Global de emergencia** | revocar todas + `puente.estado=suspendido` | `ban_duration` admin (verificado: bloquea login+refresh) | cuenta congelada; AT vivo ≤3600 s |

Password change (verificado I0.1-I): Supabase ya mata todos los RT → MELANTIA además marca todas las `sesiones` del usuario `revocada` para que ningún AT vivo siga autorizando.

**Invariante:** revocación MELANTIA es inmediata en la capa de autorización; revocación Supabase acota el AT residual a ≤1 h.

**Precisión honesta:** la revocación es instantánea **del lado servidor**; un dispositivo **offline no se entera hasta reconectar** — durante esa ventana lo defiende el gate biométrico + TTL del snapshot. No prometer "desconexión instantánea" del dispositivo.

**Verificación en dos pasos para cambios críticos (DECIDIDO):** el 2FA por email es **imposible** (email sintético sin buzón) y por SMS **frágil** (el chip va dentro del teléfono robado; cobertura rural; SIM-swap). En su lugar: cambios críticos (password, datos de cuenta) exigen **aprobación del administrador de la cuenta** desde su propia sesión autenticada, o validación por soporte. Aprovecha la jerarquía CUENTA→USUARIOS sin depender de canales externos.

## 5.1 CANAL DE ALERTAS DE SEGURIDAD (DECIDIDO)

La **notificación interna de MELANTIA** es el canal primario. Toda alerta de seguridad (dispositivo nuevo, ubicación inusual, sesión `sospechosa`, revocación) se registra y muestra en:

1. **Centro de notificaciones** de la app,
2. **Panel de sesiones/dispositivos** del usuario,
3. **Panel administrativo** de la cuenta cuando corresponda.

- Correo o teléfono **real verificado** asociado a la cuenta podrá añadirse como canal adicional **en el futuro**.
- El **email sintético de Supabase jamás es canal de notificación** — identidad técnica ≠ canal de comunicación del usuario.

---

## 6. COMPORTAMIENTO OFFLINE

- El dispositivo offline **no necesita RT ni AT**: opera con el **snapshot de autorización acotado** (F7a §5) emitido en el último contacto.
- **Gate biométrico local (DECIDIDO):** abrir la app y usar datos offline exige desbloqueo biométrico del dispositivo (reconocimiento facial / FaceID / BiometricPrompt según plataforma). La biometría es **100% local**: nunca sale del dispositivo, nunca se envía al backend ni a Supabase, no existe "verificación facial remota". Su rol es cerrar el escenario de robo físico — el ladrón no puede usar el snapshot aunque siga vigente.
- **Cadena de desbloqueo (DECIDIDO):** `Biometría → PIN local seguro → reautenticación online`. Si hay biometría disponible y correcta → continúa. Si no hay biometría o falla → PIN local. Si no hay PIN configurado o se agotan intentos → **re-auth online completa**. El PIN es local al dispositivo, guardado en el almacenamiento seguro del SO (Keystore/Keychain vía shell nativo), **nunca** reusable contra Supabase ni enviado al backend; intentos limitados con backoff/bloqueo local progresivo (antifuerza-bruta).
- **Bloqueo por inactividad (DECIDIDO): 5 minutos** sin toques → lock local que exige re-unlock (biometría o PIN — **no** contraseña completa). Es un lock de UI, **no** un logout: la sesión servidor sigue viva. 1-2 min se evaluó y se rechazó por fricción en trabajo de campo.
- **Almacenamiento local seguro (DECIDIDO):** referencia de sesión, snapshot y PIN viven en el almacenamiento seguro del SO (Keystore/Keychain). Requiere shell nativo (Capacitor o equivalente) — la PWA de navegador puro no alcanza Keychain.
- **Reinicio del dispositivo (DECIDIDO):** tras reboot se exige re-unlock (biometría/PIN); los materiales criptográficos locales quedan inaccesibles hasta el primer desbloqueo del SO.
- **Autodestrucción offline — regla corregida (DECIDIDO):** al expirar la ventana offline o ante revocación se destruye la **sesión y el snapshot** (capa de acceso), **nunca los datos**: la cola de registros permanece cifrada en el dispositivo hasta su sync o TTL por plan, marcada — no borrada en silencio — si expira. **Excepción (RC-04, aprobada 2026-10-08):** las operaciones financieras `ACEPTADA_OFFLINE` no expiran por TTL — permanecen hasta resolución válida. Perder trabajo de campo es peor daño que la exposición de sesión.
- **LoRaWAN:** solo se contempla como canal de señal mínima (heartbeat / posible mensaje de revocación comprimido) — no transporta auth, tokens ni fotos.
- Contenido del snapshot: `usuario_id`, `session_id`, `policy_version`, `permisos_efectivos`, `expira_en`, `operaciones_permitidas_offline`, **`cola_max_dias` (entitlement del plan)**, firma/hmac del backend.
- La revocación **no puede alcanzar** un dispositivo offline: se mitiga acotando `expira_en` del snapshot (ventana de exposición máxima = TTL), el gate biométrico (robo físico) y la revalidación antes de aceptar sync.
- **Cola offline:** el TTL del ítem encolado es un **entitlement del plan** (DECIDIDO): 15 días base; **45 días** para planes $15/$25+ y Proyectos — encaja en `IDENTIDAD→CUENTA→SUSCRIPCIÓN→PLAN→ENTITLEMENTS`. El ítem que expira **nunca se borra en silencio**: queda marcado `expirado_sin_sincronizar` y visible al operario para re-ingreso. **Exclusión (RC-04, aprobada 2026-10-08):** las operaciones financieras `ACEPTADA_OFFLINE` están excluidas del TTL por plan — no expiran; permanecen hasta resolución válida (`CONFIRMADA`, `RECHAZADA`, `CONFLICTO`, `CANCELADA_CONFIRMADA` u otra aprobada).
- **Sync en segundo plano (DECIDIDO):** la app drena la cola automáticamente cuando detecta conectividad **y** el dispositivo está conectado a energía (constraints tipo WorkManager `NETWORK+CHARGING`). Esto hace que el TTL largo sea seguro: la cola casi nunca llega al límite en operación normal. **Precisión (RC-06, aprobada 2026-10-08):** con **Wi-Fi + energía eléctrica** la sincronización es completa; con **datos móviles + energía eléctrica** es **sincronización controlada** — prioriza P1/P2 y evita transferencias pesadas no urgentes (no equivale a Wi-Fi + energía).
- Operaciones sensibles: **online-only** — nunca entran al snapshot ni a la cola. **Precisión (RC-01, aprobada 2026-10-08):** las operaciones **financieras** sí pueden encolarse como `ACEPTADA_OFFLINE` (irrevocables por el usuario; confirmación solo online vía servidor/proveedor); la regla online-only-sin-cola se mantiene para el resto de categorías REQUIERE_ONLINE (credenciales, autorización, titularidad).

---

## 7. RECONEXIÓN — SECUENCIA OBLIGATORIA

En el primer contacto tras estar offline, en este orden y fail-closed:

1. **Refresh** vía backend MELANTIA (regla §4).
2. **Validación** JWT (JWKS fail-closed) + `session_id` `activa` en `sesiones`. Si `revocada`/`sospechosa` → abortar, purgar cola y snapshot, exigir re-login.
3. **Pull de snapshot nuevo** (renueva ventana offline).
4. **Flush de cola** — cada operación lleva `idempotency_key` + `policy_version` del snapshot vigente al encolar.
5. **Re-evaluación server-side por operación** — el servidor NO confía en el snapshot: recalcula autorización al momento de aplicar. `policy_version` obsoleta → la operación se rechaza y se reporta al cliente.

---

## 8. TTL DEFINITIVOS — DECIDIDOS

| Parámetro | Valor | Origen |
|---|---|---|
| Access token | **3600 s** | Supabase (verificado, fijo por defecto) |
| Sesión MELANTIA | **30 días fijos — sin deslizante**: al vencer, la app exige re-autenticación completa (cédula+password). El tope corto hace innecesaria la renovación deslizante; toda sesión —legítima o comprometida— muere estructuralmente a los 30 d. | DECIDIDO 2026-10-04 |
| Snapshot offline | **72 h** | trabajo de campo; gate biométrico + Keystore cubren el robo físico. Alternativa de 12 h evaluada y rechazada: la protección ya la da la biometría, no el tiempo |
| `ROTATION_MIN_GAP` | **5 s** | tolera reintentos por timeout; colisiones legítimas son rarísimas (~1 refresh/h normal) |
| Lock por inactividad | **5 min** → re-unlock biométrico/PIN | DECIDIDO 2026-10-04 |
| Cola offline | **15 días base / 45 días planes ≥$15 y Proyectos** (entitlement del plan). **Excluye** financieras `ACEPTADA_OFFLINE` — sin TTL (RC-04, 2026-10-08) | DECIDIDO 2026-10-04 |
| Re-login obligatorio | al vencer los 30 d, sesión `sospechosa`, dispositivo nuevo, o cambio de ubicación inusual | DECIDIDO 2026-10-04 |

---

## 9. ALMACENAMIENTO DEL REFRESH TOKEN

**DECIDIDO (Opción B consecuente): el RT no sale del backend.**

- MELANTIA custodia el RT por `session_id` en `sesiones` (cifrado at-rest, campo separado, nunca serializado al cliente ni a logs).
- El cliente (PWA) recibe: AT en memoria + cookie de sesión MELANTIA `HttpOnly; Secure; SameSite=Strict` que referencia `session_id`. El `localStorage['melantia.auth']` actual migra a no contener RT — solo metadatos no sensibles.
- **Consecuencia positiva:** robar `localStorage`/XSS no entrega el RT; el replay exige comprometer además la cookie o el backend.
- **Consecuencia aceptada:** el cliente no puede refrescar sin pasar por el backend (offline no lo necesita, §6).
- Alternativa documentada y **rechazada**: RT en `localStorage` del cliente (patrón actual) — XSS = robo persistente; incompatible con la decisión de custodia.

`sb_secret_*` permanece backend-only; el cliente nunca ve claves Supabase — todo tráfico Auth pasa por el backend MELANTIA (salvo futuras excepciones explícitas).

---

## 10. RESUMEN EJECUTABLE PARA IMPLEMENTACIÓN

1. Supabase: auth pura. MELANTIA: custodia de sesión — `session_id` es la llave.
2. RT vive en `sesiones` cifrado; cliente solo cookie + AT en memoria.
3. Todo refresh pasa por backend → contador + timestamps → detección de colisión.
4. JWT válido + `sesiones.estado=activa` = autorizado; cualquier otra combinación = rechazo.
5. Revocación: local inmediata + Supabase para matar RT; AT residual ≤1 h.
6. Offline = snapshot ≤72 h; sensibles = online-only; sync = re-evaluación total.
7. Protección antireplay **no proviene de Supabase** (CASO C) — proviene de §4 + custodia del RT (§9).

## 11. MATRIZ FINAL DE DECISIÓN — F7a.1 CERRADO

| Decisión | Estado final |
|---|---|
| Sesión absoluta | **30 días fijos** → re-auth completa |
| Dispositivo nuevo | Re-auth + alerta |
| Ubicación inusual | Señal de riesgo → re-auth + alerta (nunca prueba; rango habitual, no punto fijo) |
| GPS ausente | Registrar, **no** bloquear |
| Refresh replay | Control MELANTIA-side (CASO C: Supabase no protege) |
| Canal de alerta | In-app + panel sesiones + panel admin; email sintético **jamás** |
| Email/teléfono real | Canal adicional futuro |
| Desbloqueo local | Biometría → PIN local seguro → re-auth online |
| Lock inactividad | 5 min → re-unlock biométrico/PIN |
| Almacenamiento local | Keystore/Keychain (shell nativo) |
| Autodestrucción | Sesión/snapshot sí; **datos de cola nunca** |
| Cambios críticos | Aprobación admin de cuenta (2FA email/SMS descartado) |
| Snapshot offline | 72 h |
| Cola | 15 d base / 45 d planes ≥$15 y Proyectos; expirado → marcado; **financieras `ACEPTADA_OFFLINE` excluidas del TTL (RC-04)** |
| Supabase | Autenticación + emisión/validación de tokens |
| MELANTIA | Control de sesión, riesgo, revocación y autorización |

**Residual aceptado:** detección de replay por convergencia (§4), mitigada por custodia server-side del RT (§9).

**Posteriores (hardening, NO para implementación inmediata ni decisión unilateral):**
- Endurecer `reuse_interval` de Supabase tras implementar defensa propia.
- Canal adicional de alerta por correo/teléfono real verificado.
- Heartbeat/señal de revocación por LoRaWAN (exploración).

## 12. ORDEN DE IMPLEMENTACIÓN (regla estricta)

1. **Migración mínima de infraestructura/BD** (`sesiones`, puente, campos necesarios) + pruebas.
2. **Integración Auth** (validador JWKS/ES256, login/logout/refresh proxy, registro de sesión).
3. **Frontend/offline** (gate biométrico, cookie+AT, cola, snapshot, sync en background).

Nada de implementar todo de una vez; cada fase se verifica antes de la siguiente.

**ESTADO: F7a.1 CERRADO para implementación** — con los únicos ítems posteriores listados arriba.

---

**CHECKPOINT:** Supabase: **sin cambios** · código: **sin cambios** · `.env`: **sin cambios** · usuarios: **0** · commit/push: **NO**. Único artefacto: este documento.
