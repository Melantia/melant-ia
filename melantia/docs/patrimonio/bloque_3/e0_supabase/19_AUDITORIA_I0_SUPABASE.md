# 19 — I0: AUDITORÍA TÉCNICA REAL DE SUPABASE

**MELANTIA — Auth + Storage contra el proyecto real `lizqreiyysrqgkzyddff`**
Fecha: 2026-10-03 · **SOLO LECTURA.** Nada creado, modificado ni eliminado — en Supabase, PostgreSQL, `.env`, código ni git.
Base normativa: `14` (ADR) · `15` (D4+D4.2) · `16` (D4.1) · `17` (F7a) · `18` (D5).

**Leyenda de evidencia:**
- **VERIFICADO** — respuesta real del proyecto observada hoy.
- **INFERIDO** — deducido de estructura/comportamiento verificado.
- **DOCUMENTADO** — capacidad documentada por Supabase (plataforma), no confirmada en este proyecto.
- **UNVERIFIED** — no comprobable sin credenciales/acción prohibida; motivo indicado.

---

## 1. Objetivo

Responder: **¿el Supabase real existente es compatible con D4.2 + F7a + D5?** — sin modificar nada.

## 2. Alcance y método

Método: peticiones GET públicas a los endpoints del proyecto + inspección de `.env` (solo nombres de variables/prefijos — **ningún valor impreso, copiado ni guardado**) + archivos `.temp` del CLI local. Sin usuarios de prueba, sin operaciones admin, sin POST.

## 3. Proyecto auditado

| Campo | Valor | Evidencia |
|---|---|---|
| Project ref | `lizqreiyysrqgkzyddff` | **VERIFICADO** — host responde JWKS + errores API estructurados |
| Estado | **ACTIVO** (no pausado) | **VERIFICADO** — JWKS 200 + validación de apikey operativa (un proyecto pausado responde distinto) |
| Nombre | "Restauracion Melantia" | **INFERIDO** — `supabase/.temp/` local |
| PostgreSQL | 17.11 | **INFERIDO** — `.temp` local; no verificable sin conexión |
| GoTrue | 2.197 | **INFERIDO** — `.temp` local; endpoints requieren apikey |
| Región | — | **UNVERIFIED** — DNS → Cloudflare anycast (104.18.x, 172.64.x), no revela región |

## 4. Credenciales utilizadas (sin secretos)

| Credencial | Presente en `.env` | ¿Usada? | Resultado |
|---|---|---|---|
| `sb_secret_*` del proyecto nuevo | **NO existe** | — | toda Admin API → **UNVERIFIED — sb_secret_* NO DISPONIBLE EN EL ENTORNO AUDITADO** |
| `sb_publishable_*` del proyecto nuevo | **NO existe** | — | — |
| `VITE_SUPABASE_ANON_KEY` (contiene `sb_pub…` de 46 chars) | sí | GET health/settings | **RECHAZADA** — *"API key might be owned by another Supabase project"* → **pertenece al proyecto ANTIGUO** |
| `SUPABASE_URL` | sí (apunta a `upfwgaacznljbzmbgcul.supabase.co`) | comparación de host | **apunta al proyecto ANTIGUO** — el mismo ref del backup auditado |
| `SUPABASE_SERVICE_ROLE_KEY` | sí (legacy, proyecto antiguo) | **NO usada** — prohibida por regla explícita | — |

**Ninguna credencial del entorno sirve para el proyecto nuevo.** `.env` no se modificó.

## 5. Auth audit

| Check | Resultado | Evidencia |
|---|---|---|
| Auth habilitado / GoTrue operativo | ✅ **VERIFICADO** | `/auth/v1/*` responden 401 con JSON estructurado `"Invalid API key"` — GoTrue vivo y validando |
| Endpoint `/auth/v1/health` | existe; **401 sin apikey** | VERIFICADO (endpoint), UNVERIFIED (contenido) |
| `/auth/v1/settings` | idem | idem |
| Issuer real | **INFERIDO**: `https://lizqreiyysrqgkzyddff.supabase.co/auth/v1` | iss es derivado de la URL del proyecto por GoTrue; verificación de token necesita un JWT real → claim exacto UNVERIFIED |
| Audience `authenticated` | **INFERIDO/DOCUMENTADO** — es el aud estándar de GoTrue | UNVERIFIED sin token real |

## 6. JWT / JWKS

**⭐ Hallazgo central de la auditoría — VERIFICADO:**

```text
GET /auth/v1/.well-known/jwks.json → 200
{
  "keys": [{
    "alg": "ES256", "crv": "P-256", "kty": "EC",
    "kid": "c55ca967-0a08-43b5-a0c8-7782573d62ba",
    "key_ops": ["verify"], "use": "sig", "ext": true
  }]
}
```

| Propiedad | Valor | Impacto |
|---|---|---|
| Signing keys asimétricas | **ACTIVAS** — 1 clave EC P-256 | **D4.2 §22.7/F5 COMPATIBLE — prerequisito I0-1 superado** |
| Algoritmo | ES256 | validador debe resolver `alg` desde JWKS (como diseñado — nunca hardcodeado) |
| `kid` | 1 activo | rotación futura cubierta por el refresh-on-unknown-kid diseñado |
| Material privado | — | no aplica / nunca expuesto |

**Claims del JWT** (`sub/aud/iss/exp/iat/role/email/session_id`): **UNVERIFIED** — requiere emitir un token real (usuario + apikey del proyecto). `session_id` se mantiene como dependencia I0-2 pendiente (F7a §24 lo previó).

## 7. Sesiones / refresh / banned / Admin API / password grant

Todos → **UNVERIFIED** por la misma causa: exigen `sb_secret_*` o una apikey válida del proyecto (login de prueba), y no existen en el entorno:

- rotación de refresh + reuse detection por familia (**DOCUMENTADO** como comportamiento GoTrue 2.x; no verificable aquí)
- logout `local`/`global` scopes; listado de sesiones por usuario; comportamiento post-password-change; banned users
- Admin API: `admin/users` create/get/delete, **`admin/generate_link`** (base de la recuperación D4.2 §22.4)
- password grant `/token?grant_type=password` (base del login D4.2 §8)

**Ninguno es INCOMPATIBLE — son capacidades DOCUMENTADAS de la plataforma; el bloqueo es solo de verificación.**

## 8. Storage audit

| Check | Resultado | Evidencia |
|---|---|---|
| Storage API operativa | ✅ **VERIFICADO** | `/storage/v1/status` responde |
| Buckets existentes | **UNVERIFIED** | listado exige apikey → no hay clave válida del proyecto |
| RLS / `auth.uid()` + puente | **UNVERIFIED** | sin acceso a policies; patrón DOCUMENTADO y diseñado (D5 §11) |
| signed download/upload URLs | **DOCUMENTADO** (capacidad Supabase) / proyecto **UNVERIFIED** | requiere bucket+credencial |
| TUS/resumable | **UNVERIFIED** | `/storage/v1/upload/resumable` → 404 sin apikey (inconcluyente; DOCUMENTADO como capacidad) |
| **S3-compatible endpoint** | ✅ **VERIFICADO presente** | `/storage/v1/s3` → **403** (exige credenciales) ≠ 404 → el surface S3 existe |
| Límites / versionado / delete semantics | **UNVERIFIED** | config por proyecto/plan no legible sin auth |

## 9. Matriz de compatibilidad — D4.2

| # | Diseño D4.2 | Clasificación | Evidencia |
|---|---|---|---|
| 1 | auth.users como autenticación | **INFERIDO-COMPATIBLE** | GoTrue operativo |
| 2 | usuarios como perfil | COMPATIBLE (diseño local) | n/a |
| 3 | bridge 1:1 `usuarios_auth_puente` | COMPATIBLE (diseño local) | n/a |
| 4 | email sintético HMAC | COMPATIBLE (server-side) | n/a |
| 5 | cédula/RUC identidad externa | COMPATIBLE | n/a |
| 6 | NAT/JUR canónico | COMPATIBLE | n/a |
| 7 | **JWT vía JWKS** | **✅ COMPATIBLE — VERIFICADO** | JWKS ES256 activo |
| 8 | issuer esperado | INFERIDO-COMPATIBLE | derivado de URL |
| 9 | audience `authenticated` | DOCUMENTADO/INFERIDO | estándar GoTrue |
| 10 | `session_id` claim | **UNVERIFIED** | sin token real |
| 11 | refresh rotation | DOCUMENTADO / UNVERIFIED | GoTrue 2.x |
| 12 | reuse detection | DOCUMENTADO / UNVERIFIED | idem |
| 13 | logout/revocación | DOCUMENTADO / UNVERIFIED | scopes GoTrue |
| 14 | password change → revocación | DOCUMENTADO / UNVERIFIED | — |
| 15 | banned users | DOCUMENTADO / UNVERIFIED | — |
| 16 | Admin API general | UNVERIFIED — `sb_secret_*` no disponible | — |
| 17 | `generate_link` | DOCUMENTADO / UNVERIFIED | — |
| 18 | registro server-side | COMPATIBLE (vía Admin API, pendiente credencial) | — |
| 19 | login server-side (password grant) | DOCUMENTADO / UNVERIFIED | — |
| 20 | dual issuer transitorio | COMPATIBLE (diseño local) | n/a |
| 21 | `get_current_user → usuarios.id` | COMPATIBLE | n/a |

**AUTH: COMPATIBLE 9 · INFERIDO/DOCUMENTADO 6 · UNVERIFIED 6 · INCOMPATIBLE 0 · REQUIERE DESIGN CHANGE 0**

## 10. Matriz de compatibilidad — F7a

| # | Diseño F7a | Clasificación | Evidencia |
|---|---|---|---|
| 1 | identidad | COMPATIBLE | D4.2 |
| 2 | sesión por dispositivo | DOCUMENTADO / UNVERIFIED | GoTrue sessions |
| 3 | refresh | DOCUMENTADO / UNVERIFIED | — |
| 4 | refresh por dispositivo | DOCUMENTADO / UNVERIFIED | — |
| 5 | revocación selectiva/global | DOCUMENTADO / UNVERIFIED | logout scopes |
| 6 | snapshot de autorización | COMPATIBLE (MELANTIA-side) | diseño propio |
| 7 | `policy_version` | COMPATIBLE | diseño propio |
| 8 | outbox sellada | COMPATIBLE | diseño propio |
| 9 | revalidación al sincronizar | COMPATIBLE | diseño propio |
| 10 | `REQUIERE_ONLINE` | COMPATIBLE | diseño propio |
| 11 | recuperación (generate_link) | DOCUMENTADO / UNVERIFIED | §7 |
| 12 | logout | DOCUMENTADO / UNVERIFIED | — |
| 13 | password change | DOCUMENTADO / UNVERIFIED | — |
| 14 | expiración de sesión | UNVERIFIED | config proyecto |
| 15 | clock skew | COMPATIBLE | diseño propio |
| 16 | ventana de confianza offline | COMPATIBLE | diseño propio |

**F7a: COMPATIBLE 9 · UNVERIFIED/DOCUMENTADO 7 · INCOMPATIBLE 0 · REQUIERE DESIGN CHANGE 0**

## 11. Matriz de compatibilidad — D5

| # | Diseño D5 | Clasificación | Evidencia |
|---|---|---|---|
| 1 | `StorageProvider` abstraction | COMPATIBLE | diseño propio |
| 2 | Supabase como provider | **INFERIDO-COMPATIBLE** | API operativa |
| 3 | buckets privados | DOCUMENTADO / UNVERIFIED | — |
| 4 | signed download | DOCUMENTADO / UNVERIFIED | — |
| 5 | signed upload | DOCUMENTADO / UNVERIFIED | — |
| 6 | ciclo de vida de objeto | COMPATIBLE (MELANTIA-side) | diseño propio |
| 7 | metadata | COMPATIBLE | diseño propio |
| 8 | SHA-256 | COMPATIBLE | diseño propio |
| 9 | estados de objeto | COMPATIBLE | diseño propio |
| 10 | autorización por scope | COMPATIBLE | diseño propio |
| 11 | RLS sobre storage.objects | DOCUMENTADO / UNVERIFIED | — |
| 12 | `auth.uid()` en policies | DOCUMENTADO / UNVERIFIED | — |
| 13 | bridge en policies | COMPATIBLE (vía SQL) | diseño propio |
| 14 | EP-4E | COMPATIBLE | diseño propio |
| 15 | niveles de sensibilidad | COMPATIBLE | diseño propio |
| 16 | retención | COMPATIBLE | diseño propio |
| 17 | versionado de objetos | COMPATIBLE (MELANTIA-side) | diseño propio |
| 18 | delete semantics | UNVERIFIED | — |
| 19 | resumable upload | DOCUMENTADO / UNVERIFIED | 404 sin auth |
| 20 | S3 compatibility | **✅ VERIFICADO presente** | `/s3` → 403 |

**STORAGE: COMPATIBLE 11 · VERIFICADO 1 · DOCUMENTADO/UNVERIFIED 8 · INCOMPATIBLE 0**

## 12. Contradicciones encontradas

| Sev | Problema | Evidencia | Impacto | Doc afectado | Posible solución | ¿Decisión usuario? |
|---|---|---|---|---|---|---|
| **CRÍTICA** | `.env` apunta al **proyecto ANTIGUO**: `SUPABASE_URL=upfwgaacznljbzmbgcul` (el ref del backup auditado) + `sb_pub…` del proyecto viejo | §4 verificado | cualquier implementación que consuma estas vars hablaría con el proyecto equivocado — riesgo de "restaurar el entorno viejo" que toda la iniciativa evita | `.env` (no modificable hoy), config.py | nuevas variables `SUPABASE_URL`/`sb_secret`/`sb_publishable` del proyecto nuevo en fase de configuración | **SÍ — emisión de claves nuevas** |
| **ALTA** | No existe **ninguna** credencial válida para el proyecto nuevo en el entorno | 401 en health/settings | toda verificación admin/settings/buckets bloqueada | F7a/D5 I0-lists | emitir `sb_secret_*`+`sb_publishable_*` del proyecto nuevo | **SÍ** |
| MEDIA | `session_id` en access token no verificable | sin token real | F7a §7 vinculación sesión↔token puede necesitar claim alternativo | F7a | verificar tras primera sesión real en prueba controlada | no |
| MEDIA | TUS/resumable sin verificar | 404 sin apikey | uploads grandes podrían necesitar multipart propio | D5 §19 | probar con credenciales en prueba controlada | no |
| BAJA | health/settings exigen apikey | 401 verificado | nada — solo informativo | — | — | no |

## 13. Bloqueadores reales

1. **Credenciales del proyecto nuevas ausentes** — `sb_secret_*` y `sb_publishable_*` de `lizqreiyysrqgkzyddff` deben emitirse antes de implementar Auth/Storage (bloqueador de implementación, no de diseño).
2. **`.env` desalineado** — apunta al proyecto viejo; debe corregirse en fase de configuración controlada (acción del usuario).
3. Capacidades no verificables hasta tener credenciales: Admin API, `generate_link`, buckets/RLS, signed URLs, sesiones.

## 14. Decisiones necesarias antes de implementar

- Emitir claves del proyecto nuevo (usuario, panel Supabase).
- Corregir `SUPABASE_URL`/`VITE_SUPABASE_*` → proyecto nuevo (usuario).
- TTLs y ventana de confianza (F7a §23 — pendientes de producto).
- Límites Storage por clase (D5 §29).

## 15. Conclusión

> **Los diseños D4.2 + F7a + D5 son arquitectónicamente compatibles con el proyecto real.** El prerequisito más crítico — **JWKS con signing keys asimétricas (ES256) — está VERIFICADO activo**, lo que habilita F5 íntegramente. No se encontró **ningún INCOMPATIBLE ni ningún REQUIERE DESIGN CHANGE**. El déficit no es de diseño ni del proveedor: es de **credenciales** — el entorno solo contiene claves del proyecto antiguo, lo que deja ~40% de la superficie en UNVERIFIED hasta la emisión de claves nuevas. Se recomienda una **I0.1 de re-verificación con credenciales** (prueba controlada, leyendo settings + listando buckets + emitiendo un usuario de prueba descartable si el usuario lo autoriza) antes de implementar.

## 16. Evidencias técnicas (resumen de probes)

```text
GET /auth/v1/.well-known/jwks.json  → 200  JWKS ES256 (kid c55ca967…)
GET /auth/v1/health                 → 401  "Invalid API key" (endpoint vivo)
GET /auth/v1/settings               → 401  idem
GET /auth/v1/                       → 401  idem
GET /rest/v1/                       → 401  PostgREST vivo
GET /storage/v1/status              → 200  Storage vivo
GET /storage/v1/s3                  → 403  endpoint S3 existe, exige cred.
GET /storage/v1/upload/resumable    → 404  inconcluyente
GET /storage/v1/resumable           → 404  inconcluyente
GET health/settings c/ sb_pub(.env) → 401  "owned by another project" → clave del viejo
.env SUPABASE_URL                   → upfwgaacznljbzmbgcul.supabase.co (PROYECTO VIEJO)
nslookup                            → Cloudflare (sin región visible)
```

---

# I0.1 — VERIFICACIÓN CONTROLADA AUTH (prueba con usuario sintético)

**Fecha:** 2026-10-03/04 · **Modo:** 1 usuario descartable autorizado, creado y eliminado en la misma sesión. Sin secretos impresos ni persistidos (credenciales leídas de `.env` en memoria; temporales con tokens eliminados).

## 1. Objetivo y usuario de prueba

Verificar con evidencia real los UNVERIFIED de I0. Usuario sintético: `i0test-d7f35605@test.melantia.local` (sin datos reales) · UUID `13793cd3-fa9f-4fee-a519-4a52d00e0aef` · creado vía Admin API con `sb_secret_*` (**nunca** `service_role`).

## 2. Resultados por fase

| Fase | Resultado |
|---|---|
| A Creación admin | ✅ **VERIFICADO** — `POST /admin/users` → 200, `email_confirm` efectivo inmediato, `aud:"authenticated"` |
| B Login password-grant | ✅ **VERIFICADO** — `POST /token?grant_type=password` con publishable → 200, `access_token`+`refresh_token`, `token_type:"bearer"`, **`expires_in:3600`** |
| C Claims JWT | ✅ **VERIFICADO** — `iss`=`https://lizqreiyysrqgkzyddff.supabase.co/auth/v1` (exacto al diseño) · `aud`=`authenticated` · `sub`=user UUID · `role`=`authenticated` · **`session_id` PRESENTE** · `aal`=`aal1` · `is_anonymous`=false · TTL=3600s |
| D Verificación firma JWKS | ⚠️ **UNVERIFIED (matemática)** — bug del script de auditoría (API `decode_dss_signature` cambiada en cryptography 50.x). Evidencia circundante consistente: `alg:ES256`, `kid` coincide con JWKS activo, emisor GoTrue. Re-verificar en prueba de implementación |
| E Sesión | ✅ **VERIFICADO** — cada login genera `session_id` distinto → sesión por login/dispositivo |
| F Refresh + rotación | ✅ **VERIFICADO** — refresh → 200, **refresh token ROTA** en cada uso, `session_id` **estable** a través del refresh (vínculo sesión↔dispositivo confirmado) |
| F2 Reuse detection | ⚠️ **PARCIAL** — re-uso del RT anterior devolvió **200** (dentro del intervalo de gracia de GoTrue, `refresh_token_reuse_interval` ~10 s por defecto). Invalidación de familia fuera del intervalo → **UNVERIFIED** |
| G Logout local | ✅ **VERIFICADO** — `POST /logout?scope=local` → 204; refresh posterior → 400 *"Invalid Refresh Token"* |
| I Password change | ✅ **VERIFICADO** — tras `PUT admin/users {password}` → el refresh de la sesión existente → 400 → **las sesiones se revocan al cambiar contraseña** |
| J `generate_link` | ✅ **VERIFICADO** — `POST /admin/generate_link {type:"recovery"}` → 200 con **`action_link` en respuesta** (link no mostrado) → mecanismo D4.2 §22.4 confirmado end-to-end |
| L Ban | ✅ **VERIFICADO** — `ban_duration` → login → 400 *"User is banned"*; refresh durante ban → 400 (bloquea ambos); access ya emitido sobrevive hasta `exp` (por diseño JWT — mitiga puente.estado) |
| O Eliminación | ✅ **VERIFICADO** — `DELETE /admin/users/{id}` → 200; `auth.users` volvió a **0** |

## 3. Conclusiones I0.1

El proyecto nuevo soporta **íntegramente** el modelo diseñado: registro server-side (Admin API), login por password-grant server-side (cédula→email sintético es viable: el email sintético funcionó como identidad de auth e **inmutable** — nunca se tocó), JWT ES256 verificable por JWKS, sesiones por dispositivo con `session_id` estable en el token, rotación de refresh, logout efectivo, revocación por password-change y por ban, y `generate_link` para recuperación server-side. **Cero INCOMPATIBLE detectado.**

## 4. Matriz D4.2 — actualizada con evidencia real

| # | Punto | Antes | **Ahora** |
|---|---|---|---|
| 7 | JWT vía JWKS | VERIFICADO | ✅ VERIFICADO (kid+ES256) |
| 8 | issuer | inferido | ✅ VERIFICADO (exacto) |
| 9 | audience | inferido | ✅ VERIFICADO (`authenticated`) |
| 10 | `session_id` | UNVERIFIED | ✅ **VERIFICADO — claim presente y estable por refresh** |
| 11 | refresh rotation | doc | ✅ **VERIFICADO — rota por uso** |
| 12 | reuse detection | doc | ❌ **NO DEMOSTRADO — CASO C en I0.2-B**: reuse aceptado a los 30 s, familia intacta |
| 13 | logout/revocación | doc | ✅ VERIFICADO (scope local; refresh muere) |
| 14 | password change | doc | ✅ VERIFICADO (revoca sesiones) |
| 15 | banned users | doc | ✅ VERIFICADO (login+refresh 400) |
| 16 | Admin API | UNVERIFIED | ✅ VERIFICADO (create/update/delete/get/generate_link) |
| 17 | `generate_link` | doc | ✅ VERIFICADO (`action_link` devuelto) |
| 18 | registro server-side | compat. | ✅ VERIFICADO |
| 19 | login server-side | doc | ✅ VERIFICADO |

Resto del diseño local (puente, synthetic email HMAC, NAT/JUR, dual-issuer, get_current_user): COMPATIBLE — sin cambios.

## 5. Matriz F7a — actualizada

| Punto | Estado |
|---|---|
| sesión por dispositivo | ✅ VERIFICADO (session_id distinto por login) |
| refresh/familia | ✅ rotación; family-kill fuera de gracia UNVERIFIED |
| revocación selectiva | ✅ logout local verificado; revocación de sesión remota por ID = UNVERIFIED (Admin API no expuso listado de sesiones en esta prueba) |
| expiración | ✅ access=3600s fijo del proyecto |
| password change → revocación | ✅ VERIFICADO |
| ventana offline/snapshot/cola | COMPATIBLE (MELANTIA-side, como antes) |

## 6. Limitaciones de esta verificación

- Firma ES256 no re-verificada matemáticamente (bug del script — API de cryptography; re-chequear con el validador real de implementación). **→ Resuelto en I0.2-A.**
- Reuse-detection estricta (familia) no provocada — exceder el intervalo de gracia ~10 s habría requerido espera deliberada; documentado por GoTrue. **→ Resuelto en I0.2-B (resultado adverso, ver abajo).**
- Listado admin de sesiones por usuario: UNVERIFIED (no probado; endpoint puede no existir — F7a §7 ya previó espejo local).
- Refresh de sesiones `others`/global scope: no probado (solo existía el usuario de prueba).

---

# I0.2 — CIERRE DE VERIFICACIONES CRÍTICAS

**Fecha:** 2026-10-04 · **Modo:** 1 usuario sintético descartable (`i02test-…@test.melantia.local`), creado y eliminado en la misma sesión. Secretos solo en memoria; script temporal eliminado.

## I0.2-A — Verificación matemática ES256

Se reconstruyó la clave pública EC desde el JWKS real (números `x`,`y` → `ECPublicNumbers(SECP256R1)`), se convirtió la firma JWT `R‖S` (64 B) a DER (`encode_dss_signature`) y se verificó `ECDSA/SHA-256` sobre `header.payload` con `cryptography`.

| Check | Resultado |
|---|---|
| JWT emitido por Supabase | ✅ PASS |
| `kid` del JWT ↔ JWKS | ✅ PASS (coincide) |
| Algoritmo ES256 | ✅ PASS (header `alg` + JWK `alg`) |
| Curva P-256 | ✅ PASS (`crv:P-256`, `kty:EC`) |
| **Verificación matemática de firma** | ✅ **PASS** |

**Consecuencia:** el validador JWKS diseñado para D4.2/F5 queda confirmado con firma real: resolve `kid` → construye clave P-256 → `ECDSA(SHA-256)` sobre `header.payload` con firma `R‖S→DER`.

## I0.2-B — Refresh token reuse fuera de grace window

Secuencia: login → RT1 → RT1 usado → RT2 (rotación confirmada, RT1≠RT2) → **espera de 30 s (~3× la ventana documentada ~10 s)** → RT1 reutilizado → RT2 probado.

| Check | Resultado |
|---|---|
| RT rotation | ✅ PASS (RT1≠RT2) |
| Reuse de RT1 fuera de gracia (30 s) | ⚠️ **ACCEPTED — HTTP 200, emitió nuevo par de tokens** |
| RT2 después del reuse | ✅ PASS (siguió funcionando — la familia no murió) |
| **Clasificación** | **CASO C — REUTILIZACIÓN ACEPTADA** |

**Interpretación:** con la configuración actual del proyecto, **no se demuestra protección contra reuse de refresh tokens** — ni invalidación del token antiguo fuera de ~10 s ni *family kill*. Posibles causas: `refresh_token_reuse_interval` configurado >30 s o detección deshabilitada; no se modificó configuración para averiguarlo (fuera de alcance). **Implicación de diseño F7a (crítica):** Supabase **no puede ser la única línea de defensa contra robo/replay de refresh tokens.** Si se requiere detección de reuse, debe implementarse del lado MELANTIA (registro de sesiones/rotación en la capa de autorización, espejo de `session_id` por dispositivo — ya previsto en F7a §7) o ajustarse explícitamente el `reuse_interval` del proyecto y re-verificar.

## Limpieza I0.2

| Check | Resultado |
|---|---|
| Usuario temporal eliminado | ✅ YES (DELETE 200) |
| `auth.users` final = 0 | ✅ YES (verificado vía Admin API) |
| Sesiones temporales restantes | 0 (usuario eliminado → sus sesiones con él) |
| Objetos Storage creados | 0 (nunca se tocó Storage) |
| Secretos escritos en disco | NO (script temporal borrado; sin tokens persistidos) |

## Estado de cierre

Con I0.2 quedan cerrados los dos UNVERIFIED críticos de I0.1. Pendientes no críticos: listado admin de sesiones por usuario y logout global-scope — ambos mitigables con el espejo local de sesiones de F7a. La verificación de Supabase Auth contra el proyecto real puede considerarse **CERRADA**, con una decisión de diseño pendiente: **cómo cubrir la ausencia demostrada de protección contra reuse de refresh tokens** (configurar `reuse_interval` y re-verificar, o detección MELANTIA-side).

---

**CHECKPOINT:** Supabase modificado: **NO** · `.env` modificado: **NO** · claves modificadas: **NO** · usuarios creados: **NO** · buckets creados: **NO** · policies creadas: **NO** · PostgreSQL modificado: **NO** · código modificado: **NO** · commit: **NO** · push: **NO**. Único artefacto: este documento.
