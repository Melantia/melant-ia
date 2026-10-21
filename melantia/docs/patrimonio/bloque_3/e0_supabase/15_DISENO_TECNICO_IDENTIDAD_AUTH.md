# 15 — D4: DISEÑO TÉCNICO DE INTEGRACIÓN DE IDENTIDAD Y AUTH

**Supabase Auth + FastAPI + `usuarios_auth_puente` + `usuarios`**
Proyecto destino: `lizqreiyysrqgkzyddff` ("Restauracion Melantia") · GoTrue v2.197 · PG 17.11
Fecha: 2026-10-03 · **SOLO DISEÑO — NADA IMPLEMENTADO.** Sin código, `.env`, Supabase, PostgreSQL, migraciones, usuarios, policies, buckets ni Git tocados.

Base normativa: `14_ADR_DEFINITIVO_IDENTIDAD_AUTH.md` (F3/F5/F6 aprobadas · F4/F8 condicionales · F7a-TTL pendiente) · `12_ADR_IDENTIDAD_USUARIOS.md` (D1–D6) · `13_AUDITORIA_TRANSICION_CLAVES.md` (E0.5).

**Sin contradicciones encontradas** entre este diseño y los ADR previos. Nota de alineación: el ADR 12 §6.1 proponía `ALTER TABLE usuarios_perfiles ADD usuario_id`; la decisión posterior de renombrar a `usuarios_auth_puente` hace que el puente se cree **desde cero con `usuario_id` incluido**, en vez de alterar una tabla previa — misma semántica, mejor forma.

---

## 1. Resumen ejecutivo

El diseño traduce el ADR cerrado a especificación técnica: **FastAPI es el único interlocutor del cliente** y el único consumidor de `sb_secret_*` (Admin API); el navegador solo habla con `VITE_API_URL`. Supabase Auth emite los tokens; `get_current_user` los verifica por JWKS e intercambia `auth.users.id → usuarios.id` vía el puente. Todo downstream (EP-4E, workspaces, evidencias, 236 tests) permanece intacto porque el contrato `get_current_user → str(usuarios.id)` no cambia. El email sintético es HMAC-derivado (§6): determinista para login, no reversible, no identidad. La transición JWT-local→Supabase es por discriminación de `iss` tras flag, con muerte natural del emisor local (exp 30 min). El TTL de sesión queda diseñado como **problema separado** (§11) sin fijar valores.

## 2. Arquitectura

```text
┌──────────┐   HTTPS/JSON (VITE_API_URL)   ┌─────────────────────────────────┐
│  React   │ ────────────────────────────► │ FastAPI  /api/auth/*            │
│          │   nunca habla con Supabase    │  /registro → Admin API (sb_secret│
└──────────┘                               │  /login    → GoTrue grant       │
                                           │  get_current_user → JWKS+puente │
                                           └───────┬───────────────┬─────────┘
                                                   │ Admin API     │ psycopg pool
                                                   │ /auth/v1/...  │ database_url
                                                   ▼               ▼
                                          ┌──────────────┐  ┌────────────────┐
                                          │ Supabase Auth │  │ PostgreSQL      │
                                          │ auth.users    │  │ usuarios_auth_ │
                                          │ JWKS          │  │   puente        │
                                          │ (proyecto     │  │ usuarios        │
                                          │ lizqreiyysr…) │  │ grafo negocio   │
                                          └──────────────┘  └────────────────┘
```

Dos planos separados: **autenticación** (Supabase Auth, externo) y **autorización** (MELANTIA en BD propia). La única soldadura es `usuarios_auth_puente` + `get_current_user`.

## 3. Estado actual (mapa verificado en código)

```text
React (apiClient, VITE_API_URL)
   ↓ POST /api/auth/login | /registro | /me
FastAPI modules/auth/controllers.py
   ↓ SELECT/INSERT usuarios (bcrypt password_hash)
core/security.py — JWT HS256 (jose)
   ↓ sub=usuarios.id, claims {sub,cedula,nombre,exp}
core/dependencies.py get_current_user → str(usuarios.id)
   ↓
ep/dependencies.py require_ep_access → autorizacion.resolver_permiso → EP-4E
```

| Elemento | Evidencia | Detalle |
|---|---|---|
| Login | `modules/auth/controllers.py:24-76` | `POST /api/auth/login`: cédula+password → `usuarios` → JWT |
| Registro | `controllers.py:79-131` | `POST /api/auth/registro`: alta + JWT en una operación |
| Perfil | `controllers.py:134-157` | `GET /api/auth/me` |
| Schemas | `modules/auth/schemas.py` | `LoginRequest{cedula_ruc,password}` · `RegistroRequest{nombre,cedula_ruc,password,sector_comunidad,contacto,geo_ids}` · `TokenResponse` · `UsuarioResponse` |
| JWT | `core/security.py:30-33,74-130` | HS256 · `MELANTIA_JWT_SECRET_KEY` + **fallback hardcodeado** · `exp`=30 min · claims `sub/cedula/nombre/exp` — **sin `iss`/`aud`/`iat`/`nbf`/`jti`** |
| Password | bcrypt passlib | `usuarios.password_hash` aditivo, NULL en históricos |
| `get_current_user` | `core/dependencies.py:101-136` | HTTPBearer → `verify_token` → `sub` → `str` |
| Checkers rol/suscripción/límite | `dependencies.py:~180-280` | **placeholders que permiten todo** (TODO) |
| EP-4E | `ep/dependencies.py` + `autorizacion.resolver_permiso` | consume `usuario_id` str; matriz contextual completa |
| Tests | `tests/test_*_api.py:140-141` (×6 suites) | `dependency_overrides[get_current_user] = lambda: usuario` — signer-agnóstico |
| `usuarios` | `database/schema/usuarios.sql` | `id UUID PK`, `cedula_ruc UNIQUE`, geo FKs, `password_hash` aditivo |
| Supabase hoy | `config.py:65-67`, `security.py:165-233` | vars cargadas, `SupabaseAuth` placeholder **sin consumidores** |
| DB | `database.py` | pools psycopg sobre `settings.database_url` (`MELANTIA_DB_*`) |

## 4. Estado objetivo

```text
React ──► POST /api/auth/registro ──► FastAPI ──► Admin API (auth.users)
                                     │            ▲ sb_secret_* (server-only)
                                     ├──► usuarios (perfil)
                                     └──► usuarios_auth_puente (vínculo)

React ──► POST /api/auth/login ──► FastAPI: cedula→email_sintético
                                     └──► GoTrue signIn → access+refresh al cliente

Todas las demás peticiones:
React ──► Bearer <jwt Supabase> ──► get_current_user:
        JWKS → firma+iss+aud+exp → sub=auth.users.id
        → puente.usuario_id → str(usuarios.id) → EP-4E intacto
```

## 5. Puente `auth.users ↔ usuarios` (`usuarios_auth_puente`)

### 5.1 Definición de diseño (DDL conceptual — NO ejecutar)

```sql
CREATE TABLE public.usuarios_auth_puente (
    id              UUID PRIMARY KEY,              -- = auth.users.id (FK externa lógica)
    usuario_id      UUID NOT NULL UNIQUE,          -- → usuarios.id (FK local CASCADE)
    cedula_ruc      VARCHAR(20) NOT NULL UNIQUE,   -- dedup de registro (F4)
    rol_id          UUID REFERENCES roles(id),     -- rol PLATAFORMA (eje global)
    estado          VARCHAR(20) NOT NULL DEFAULT 'activo',   -- activo|suspendido|revocado
    vinculado_en    TIMESTAMPTZ NOT NULL DEFAULT now(),      -- cuándo se creó el vínculo
    vinculado_por   VARCHAR(40) NOT NULL DEFAULT 'registro', -- registro|asistido|admin|migracion
    ultimo_acceso_en TIMESTAMPTZ,                            -- actualizado por login (opcional)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

| Aspecto | Decisión | Razón |
|---|---|---|
| PK | `id = auth.users.id` | 1:1 estricto con la identidad externa |
| FK externa | lógica, no física | en Supabase el `auth` schema sí existe → FK física `REFERENCES auth.users(id) ON DELETE CASCADE` posible allí; en PG local se omite (ver §16) |
| `usuario_id` | `UNIQUE NOT NULL → usuarios.id ON DELETE CASCADE` | 1:1 estricto; borrar usuario arrastra el vínculo |
| `cedula_ruc` | `UNIQUE` | dedup en /registro; caché — la canónica es `usuarios.cedula_ruc` |
| Índices | PK + UNIQUE×2 cubren todo lookup (`id`, `usuario_id`, `cedula_ruc`) | las 3 consultas del diseño ya están indexadas |
| `estado` | enum-like | soporte a suspensión/revocación sin borrar vínculo |
| `vinculado_por` | registro de origen | auditoría de onboarding (F8, registro asistido) |
| Campos NO incluidos | email, nombre, password, teléfono | eso vive en `auth.users`/`usuarios` — el puente no duplica |

### 5.2 Traducción (el corazón del diseño)

```text
auth.users.id  ≠  usuarios.id     (dos UUIDs independientes — invariante)

JWT.sub (auth.users.id)
   → SELECT usuario_id FROM usuarios_auth_puente
      WHERE id = :sub AND estado = 'activo'
   → str(usuario_id)              ← lo que ve todo el código existente
```

Cache opcional: mapeo `auth.users.id → usuarios.id` en memoria TTL corto (30–60 s) para no pagar el JOIN por request; invalidar al suspender/revincular. **⚠ D4.2 §22.8:** operaciones sensibles hacen *bypass* del caché (lookup directo de `estado`) — el caché nunca puede retrasar una revocación crítica.

## 6. Email sintético (F4 — reglas §3.2.1 del ADR)

### 6.1 Comparativa de mecanismos

| Opción | Determinista | No revela cédula | Anti-enumeración | Comentario |
|---|---|---|---|---|
| **A. HMAC-SHA256(cédula_norm, pepper)** truncado | ✅ | ✅ (keyed) | ✅ — sin pepper no se enumera el espacio cédula (~10¹³) | **Recomendada** |
| B. `uuid_generate_v5(NS, cédula)` / SHA-256 sin clave | ✅ | ⚠️ parcial — hash sin clave de un dominio pequeño es **enumerable** (fuerza bruta offline sobre todas las cédulas posibles) | ❌ | Descartada |
| C. Correo aleatorio persistido (no derivado) | ❌ | ✅ | ✅ | Descartada: login requeriría lookup extra y cualquier regeneración rompe el determinismo → imposible `signIn` por cédula sin estado adicional |

**Recomendación: A** — `email_sintetico = hex(HMAC_SHA256(key=PEPPER_IDENTIDAD, msg=cedula_normalizada))[0:24] + "@" + DOMINIO_TECNICO`.

- **Entrada:** `cedula_ruc` del request.
- **Normalización:** trim, mayúsculas, quitar separadores/espacios, prefijo país implícito si aplica (definir formato único de cédula/RUC ecuatoriano en implementación).
- **Derivación:** HMAC-SHA256 con `PEPPER_IDENTIDAD` (secreto server-side **nuevo y separado** de cualquier clave Supabase; vive en `.env`/secrets, nunca en código ni en cliente).
- **Dominio técnico:** dominio propio reservado solo para identidades sintéticas (ej. `id.melantia.app`); nunca `supabase.co` ni dominio de usuarios reales → garantiza no-colisión con correos reales y permite reglas de filtrado.
- **Control de colisión:** 96 bits de prefijo hex hacen la colisión despreciable; además `usuarios_auth_puente` guarda el vínculo por `id`/`usuario_id`, no por email → una colisión teórica no corrompe la identidad, solo impediría crear la segunda cuenta (detectable, tratable como incidente).
- **Persistencia:** **no se almacena el email sintético** — se recalcula en cada login (determinista). El puente guarda `id (auth.users.id)`, no el email. El pepper no rota nunca o se mantiene historial de peppers (rotación = pérdida de acceso masivo → prohibida salvo plan de migración).
- **Recuperación:** irrelevante — al ser derivado no hay "pérdida" del email.
- **Propiedades cubiertas:** determinista ✅ único ✅ estable ✅ no revela cédula ✅ no colisiona ✅ independiente de política de login (cambiar a OTP no lo invalida) ✅ no visible ✅ no es identidad de negocio ✅.

> **⚠ ERRATA D4.2 — §22.3:** la entrada a la derivación NO es el string crudo `cedula_ruc` sino la **identidad canónica** tras el pipeline de normalización fiscal (cédula natural vs RUC jurídico, validación de dígito verificador, colapso RUC-natural→cédula). Ver §22.3 antes de implementar.

## 7. Registro — `POST /api/auth/registro` (diseño, no implementado)

### 7.1 Request

```json
{ "nombre", "cedula_ruc", "password",
  "sector_comunidad", "contacto?",
  "provincia_id?", "canton_id?", "parroquia_id?",
  "acepto_politicas": true }
```

(respeta el schema actual `RegistroRequest` + `acepto_politicas` obligatorio — ya existía como CHECK en el esquema antiguo)

### 7.2 Orquestación (saga — dos sistemas, no una transacción)

```text
1. Validar entrada (formato cédula/RUC, password policy, políticas=true)
2. Dedup previo: clasificar la identidad en 3 estados (⚠ ERRATA D4.2 §22.5 —
     NO basta "existe/no existe"):
     · completo   (usuarios + auth.users + puente) → 409
     · huérfano   (usuarios sin auth/puente)       → flujo RECLAMO, no 409
     · inexistente                                → continuar a paso 3
3. Paso local (TX1): INSERT usuarios (...) RETURNING id
     · fallo UNIQUE → 409
4. Paso remoto: POST {SUPABASE_URL}/auth/v1/admin/users  (sb_secret_*)
     { email: email_sintetico(cedula), password, email_confirm:true,
       user_metadata:{cedula_ruc}, app_metadata:{origen:"registro-melantia"} }
     → auth_user_id
     · 422 "already registered" → existe auth user huérfano → tratar como
       recuperación de saga (reutilizar id o error 409 auditado — definir en impl.)
     · fallo red/4xx → compensar: DELETE usuarios(id) (o marcar pendiente) → 502
5. Paso local (TX2): INSERT usuarios_auth_puente
     (id=auth_user_id, usuario_id, cedula_ruc, rol default, vinculado_por)
     · fallo → compensar: admin DELETE auth.users(auth_user_id) → luego
       evaluar usuarios (ver §7.3)
6. Commit lógico → 201 { access+refresh (signIn inmediato) o instrucción de login }
7. Auditoría: registrar registro (quién, cédula hash, origen, ts)
```

### 7.3 Estados parciales y compensación

> **⚠ ERRATA D4.2 — §22.5:** esta tabla se amplía (respuesta ambigua del proveedor, timeout, retry idempotente, reclamo de huérfanos). La regla "reintento reutiliza usuarios" solo es válida porque el dedup clasifica antes en 3 estados.

| Fallo en | Estado resultante | Compensación |
|---|---|---|
| Paso 3 | nada creado | nada — retry seguro |
| Paso 4 | `usuarios` huérfano sin identidad | `DELETE usuarios` en la misma respuesta (si falla, job/marca `pendiente_borrado`) |
| Paso 5 | `usuarios` + `auth.users` sin puente → **cuenta inalcanzable** | borrar auth user vía Admin API; dejar `usuarios` (es dato de negocio idempotente — reintento de /registro lo reutiliza) o marcar inconsistencia para reconciliación |
| Todo ok pero signIn final falla | cuenta completa | responder "registro ok, haga login" — no es error fatal |

**Idempotencia:** `cedula_ruc UNIQUE` en ambas tablas + determinismo del email = el reintento del mismo request converge al mismo estado (detecta 409 temprano). Clave de idempotencia opcional en header para el cliente.

**Errores normalizados:** 400 validación · 409 duplicado · 502 Supabase no disponible · 500 interno. Nunca devolver `auth.users.id`, email sintético ni detalles internos.

## 8. Login — `POST /api/auth/login` (diseño)

```text
{ cedula_ruc, password }
      │
      ▼
FastAPI:
 1. email = HMAC_derivar(cedula_normalizada)            (sin consultar BD)
 2. rate-limit por IP+cedula; lockout progresivo por cédula
 3. signInWithPassword → POST {SUPABASE_URL}/auth/v1/token?grant_type=password
      { email, password }    (con sb_publishable_* server-side o admin —
                              ver nota §8.1)
      · 400 invalid_grant → 401 "Cédula o contraseña incorrecta"
        (mismo mensaje para usuario inexistente → no oráculo)
 4. SELECT puente WHERE id = auth_user_id AND estado='activo'
      · sin puente → 401 (cuenta Auth sin negocio — solo vía /registro)
      · estado != activo → 403 "cuenta suspendida"
 5. UPDATE puente.ultimo_acceso_en (opcional, fire-and-forget)
 6. Responder:
      { access_token, refresh_token, expires_in, token_type:"bearer",
        usuario_id, nombre }
    NO devolver: email sintético, auth.users.id, password_hash,
               session internals, existencia de la cédula
```

### 8.1 ¿Qué clave usa el signIn server-side?

GoTrue acepta el grant `password` con la **publishable/anon key** (los endpoints públicos de auth no requieren secret — es lo que hace supabase-js en el browser). Como el flujo es server-side por proxy (F3/F4), puede usarse la publishable **en backend** o el flujo Admin. La `sb_secret_*` se reserva exclusivamente para Admin API (registro, reset asistido, gestión). En una variante posterior el cliente firma directo con publishable — decisión diferible.

### 8.2 Compatibilidad `get_current_user`

El access_token devuelto es JWT Supabase (`sub=auth.users.id`); `get_current_user` lo traduce por el puente (§9) → contrato intacto. El `usuario_id` en la respuesta del login ya es `usuarios.id` (el cliente no necesita saber del puente).

## 9. JWT / JWKS (F5 — especificación exacta)

| Elemento | Valor de diseño |
|---|---|
| Issuer esperado | `https://lizqreiyysrqgkzyddff.supabase.co/auth/v1` (literal exacto) |
| Audience esperado | `authenticated` |
| Verificación de firma | **JWKS del proyecto** — `GET {SUPABASE_URL}/auth/v1/.well-known/jwks.json` |
| Algoritmo | el del `kid` presente en el header, resuelto desde JWKS (ES256/Ed25519 o HS256 según signing keys activas del proyecto — **nunca hardcodear el secreto ni el algoritmo**; rechazar `alg=none` y cualquier `kid` ausente en el JWKS) |
| Claims obligatorios | `iss`, `aud`, `exp`, `sub` (+`iat`/`nbf` si presentes) |
| Caché JWKS | en memoria ~10 min + refresh forzado si llega `kid` desconocido (rotación de claves); máx N refreshes/min (anti-DoS) |
| JWKS no disponible | `503` **solo si el caché está vacío/stale** (⚠ D4.2 §22.9: con clave cacheada la verificación es criptográfica/offline — GoTrue caído ≠ API caída) |
| `exp` vencido | `401` "token expirado" (el cliente renueva con refresh, no el API) |
| `iss`/`aud` incorrectos | `401` sin más detalle (no oráculo) |
| `sub` sin puente / puente `estado≠activo` | `401` / `403` según caso — jamás auto-provisionar (invariante ADR §12.2) |
| Puente inconsistente (`usuario_id` apunta a usuarios inexistente) | `500` + alerta — integridad rota, investigable |
| `sb_secret_*` | **PROHIBIDA** para verificar Bearer de usuario — solo Admin API |

Librería objetivo: `python-jose` (ya instalada) no soporta JWKS nativamente — la implementación necesitará `PyJWT`+`cryptography` o `httpx`+JWKS manual (`httpx` ya está). Decisión de librería en implementación.

## 10. Transición JWT local → Supabase

```text
get_current_user(token):
    iss = payload.iss (lectura sin verificar)
    if iss == ISSUER_SUPABASE:           → validador JWKS → puente → usuarios.id
    elif LEGACY_ISSUER_ENABLED:          → validador HS256 local → sub = usuarios.id
    else: 401
```

| Aspecto | Diseño |
|---|---|
| Discriminación | por `iss` (tokens locales no tienen `iss` → caen a rama legacy; regla estricta, no heurística) |
| Flag | `AUTH_LEGACY_ISSUER_ENABLED` (env) — apaga la rama local en una línea |
| Coexistencia | ambos válidos durante transición; `get_current_user` devuelve el mismo `str(usuarios.id)` en ambas ramas |
| Muerte natural | tokens locales `exp`=30 min → la ventana de coexistencia se cierra sola sin revocación |
| Criterio de retiro | cuando `/login`+/registro+recuperación nuevos estén estables → flag OFF → borrar `create_access_token`/`verify_token`/`get_user_id_from_token` + fallback secret |
| Tests | `dependency_overrides` bypassa el emisor → 236 tests inmunes; tests nuevos solo para los validadores |
| Rollback | flag ON legacy + flag OFF supabase → vuelta al estado actual sin migración de datos (el puente es aditivo) |

## 11. Sesión (F7a — **PENDIENTE POR DISEÑO**, conceptos separados)

| Concepto | Estado | Notas de diseño |
|---|---|---|
| Duración access token | pendiente | corto por defecto GoTrue (~1h); el cliente no lo "alarga", renueva |
| Duración refresh token | pendiente | TTL y rotación configurables en el proyecto; decisión con riesgo de seguridad → diseño dedicado |
| Sesión local | pendiente | almacenamiento de tokens en el dispositivo (secure storage), bloqueo/re-apertura local |
| Revocación | pendiente | Supabase soporta revoke de refresh por sesión/dispositivo (`/auth/v1/logout` scope) — mapear a "cerrar sesión", "perdí el teléfono", "cambio de cédula" |
| Multi-dispositivo | pendiente | sesiones concurrentes por dispositivo vs. sesión única — política a decidir (agricultor + técnico compartiendo cuenta es escenario real) |
| Autorización offline | pendiente | ver §12 — se diseña aparte de la duración |

**Regla registrada (usuario):** sesión larga ≠ capacidad offline; no fijar 30 días. El diseño completo de §11 es entregable separado antes de implementar login.

## 12. Offline-first (F7a — separación explícita)

| Pregunta | Diseño conceptual |
|---|---|
| ¿Qué puede offline? | Leer datos ya sincronizados/cacheados; capturar evidencias/registros en cola local (comportamiento ya existente de la app) |
| ¿Qué NO puede offline? | Login de cero, refresh de token, operaciones que requieran autorización servidor-side (pagos, concesiones, cambios de rol, recuperación), verificación de estado de cuenta |
| Sesión local | tokens en storage seguro del cliente; la app consulta `exp` del access token y "modo offline" UI |
| Detección de expiración | cliente evalúa `exp`/`iat` localmente; si refresh posible al recuperar red → renovar; si refresh vencido → login obligatorio |
| Días sin conexión | las operaciones en cola persisten; el token puede expirar — la app sigue usable para captura, pero al sincronizar exigirá re-autenticación |
| Al reconectar | refresh → si OK, re-sincronizar cola + revalidar privilegios (participaciones, roles, suspensiones — el servidor re-verifica `estado` del puente en cada request) |
| Operaciones que exigen online | todo lo que muta autorización o dinero: login, registro, recuperación, pagos, gestión de participantes/concesiones, revocaciones |
| Anti-patrón evitado | offline no se resuelve con JWT eterno: se resuelve con **sesión válida previa + cola de operaciones + revalidación al reconectar**. El servidor siempre puede negar la operación tardía (estado del puente, permisos EP-4E actuales) |

## 13. Recuperación (F8 — condiciones §6.1 del ADR)

**Caso A — email real asociado:** ⚠ **ERRATA D4.2 §22.4 — flujo anterior INCORRECTO.** `/auth/v1/recover` envía al buzón de `auth.users.email`, que es sintético e inexistente. Reemplazado por `admin/generate_link` server-side + entrega por canal registrado. El texto original de este caso queda **supersedido** — usar §22.4.

**Caso B — recuperación asistida (sin email):**

```text
Usuario solicita recuperación (pantalla pública: cédula + canal de contacto)
   → ticket de recuperación creado (tabla, estado=pendiente, TTL)
   → operador autorizado (rol plataforma) revisa:
        · verificaciones_identidad existente del usuario (si hay)
        · evidencia aportada (foto cédula física / presencial / datos de negocio)
        · multifactor obligatorio — NUNCA solo la cédula
   → operador aprueba → Admin API: generar nueva credencial temporal
        · password temporal aleatoria entregada al USUARIO (nunca al operador:
          se entrega por canal directo/presencial) + flag "cambio obligatorio"
        · o magic/recovery link si hay canal verificable
   → auditoría completa del acto
```

| Elemento | Diseño |
|---|---|
| Solicitud | endpoint público con rate-limit estricto + captcha-like/anti-bot (P2) |
| Identificación | cédula + ≥1 factor adicional verificable (datos de negocio no públicos, evidencia, presencial) |
| Factores | mínimo 2 de: `verificaciones_identidad` válida · datos de negocio · presencial técnico · canal registrado (contacto en `usuarios`) |
| Operador | rol plataforma `administrador`/`operador_identidad` (nuevo rol si hace falta); permiso granular, no superadmin genérico |
| Regla dura | operador jamás conoce la contraseña final — solo genera credencial temporal de un solo uso con cambio obligatorio |
| Auditoría | `recuperacion_audit`: ticket_id, solicitante, operador, factores usados, evidencia, resultado, IP, timestamps — inmutable |
| Rate limiting | por cédula, por IP, por operador (topes distintos) |
| Antifraude | alerta tras N solicitudes sobre misma identidad; lockout temporal de recuperación (no de login) |
| Expiración | tickets TTL (ej. 72 h — valor a fijar en implementación); credencial temporal TTL corta |
| Evidencia | referencia a documento en `verificaciones_identidad` o bucket privado (D5) |
| Revocación | aprobar recuperación revoca refresh tokens anteriores (`/auth/v1/logout` admin) |
| Notificaciones | al usuario por canal registrado (si existe) — nunca al email sintético |

## 14. Autorización (frontera inmutable)

```text
Supabase Auth  = AUTENTICACIÓN (¿quién eres?)        — externa
FastAPI/BD     = AUTORIZACIÓN   (¿qué puedes hacer?) — MELANTIA, sin cambios

get_current_user → str(usuarios.id)     ← única traducción
require_ep_access → resolver_permiso    ← EP-4E intacto, sin modificaciones
checkers rol/suscripción/límite         ← evolucionan leyendo usuarios.id (hoy placeholders)
```

Doble eje (ADR §7): `usuarios_auth_puente.rol_id` = plataforma · `ep_proyecto_participantes.rol` = contextual — nunca mezclados.

## 15. Seguridad

| Tema | Diseño |
|---|---|
| `sb_secret_*` | solo backend, en `.env`/secrets; nunca bundle, logs ni respuestas |
| `sb_publishable_*` | permitida en frontend solo cuando exista cliente Supabase real; bajo RLS correctas — hoy no necesaria |
| JWT | verificación JWKS estricta (§9); `sb_secret` jamás como Bearer de usuario |
| Pepper identidad | secreto separado, solo backend, sin rotación salvo plan de migración |
| Rate limiting | /login, /registro, /recuperacion — límites por IP y por identificador |
| Brute force cédula | lockout progresivo + mensajes uniformes 401 (anti-oráculo) |
| Cédula | identificador público — nunca tratado como secreto (regla F8 §6.1); en logs solo hash/truncada |
| Logs/PII | no loggear tokens, passwords, emails sintéticos ni cédulas completas |
| Auditoría | tabla de eventos de seguridad: registro, login fallido repetido, cambio de vínculo, recuperación asistida, suspensión |
| Fallbacks en código | eliminar `MELANTIA_JWT_SECRET_KEY` default y default de `MELANTIA_DB_PASS` cuando el emisor local se retire (E0.5 §14) |

## 16. Migraciones futuras (diseño — NO ejecutar)

| # | Migración | Contenido | Depende de | Rollback |
|---|---|---|---|---|
| M1 | `usuarios_auth_puente` | tabla §5.1 + `usuarios_auth_puente_updated_at` trigger | `usuarios`, `roles` (si se adopta de 0001) | `DROP TABLE` — aditiva, sin tocar nada |
| M2 | `roles` + `configuraciones_globales` (opcional, de `0001` adaptado) | catálogo plataforma | — | drop |
| M3 | RLS + policies de M1 | `ENABLE RLS` + `SELECT USING (auth.uid()=id)` (auto-lectura) — **policy en la misma migración, nunca separada** (lección del backup: RLS sin policy = tabla muerta) | M1 | drop policy + disable RLS |
| M4 | `recuperacion_audit` (+ eventos seguridad) | §13 | M2 | drop |
| M5 | índices/constraint complementarios si emergen | — | M1 | drop |

Orden: M1 → M3 (mismo paquete) → M2/M4. Compatibilidad: todo aditivo; en Supabase el puente puede tener FK física a `auth.users(id)`; en PG local (sin schema `auth`) variante sin esa FK (E0.3 §6.3 — stub `auth` local o solo remoto).

## 17. Plan de tests (diseño — ninguno ejecutado)

| Área | Casos |
|---|---|
| Registro | cédula nueva 201 · cédula duplicada 409 · RUC válido · datos incompletos 400 · Supabase caído 502+compensación · reintento idempotente mismo estado · políticas no aceptadas 400 |
| Login | válido 200 (tokens+usuario_id) · password inválido 401 uniforme · cédula inexistente 401 **idéntico** (anti-oráculo) · puente suspendido 403 · cuenta sin puente 401 · rate-limit activado |
| JWT | firma inválida · `kid` desconocido · iss incorrecto · aud incorrecto · exp vencido · `alg=none` · sub sin puente 401 · sub con puente→usuario_id correcto · JWKS down 503 |
| Puente | vínculo correcto · UNIQUE usuario_id/cedula duplicado 409 · estado≠activo bloquea · cache invalidado al suspender |
| Recuperación | email estándar · asistida multifactor OK · intento solo-cédula rechazado · operador sin rol 403 · credencial temporal 1-uso · auditoría escrita · revocación de refresh |
| Offline/sesión | token válido tras N horas simuladas · expirado→refresh→OK · refresh vencido→login forzado · operación tardía revalidada al sincronizar |
| Compatibilidad | los 236 tests existentes sin modificación · `dependency_overrides` sigue pasando · `resolver_permiso` recibe `usuarios.id` correcto vía token Supabase |
| Doble emisor | token local aceptado con flag ON · rechazado con flag OFF · token Supabase aceptado en ambos estados |

## 18. Riesgos

| # | Riesgo | Mitigación |
|---|---|---|
| 1 | Saga distribuida deja estados parciales (§7.3) | compensación + reconciliación + endpoint idempotente |
| 2 | Pepper comprometido → emails sintéticos predecibles | secreto separado, solo servidor; rotación = plan de migración (no trivial) |
| 3 | JWKS caído → todo auth caído | fail-closed 503 + caché; GoTrue es SPOF aceptado de la arquitectura C |
| 4 | Email sintético en metadata/logs de Supabase visible en dashboard | aceptado — no es PII (es hash); nunca exponer al cliente |
| 5 | Operador de recuperación comprometido | multifactor + auditoría inmutable + sin acceso a password final |
| 6 | `jose` sin soporte JWKS | cambio de librería acotado al validador |
| 7 | Flag legacy olvidada ON en producción | criterio de retiro §10 + revisión de config |
| 8 | Usuarios históricos con `password_hash NULL` (ya existía) | flujo de activación = recuperación asistida §13 |
| 9 | Colisión teórica email sintético | UNIQUE en auth.users lo detecta como error de creación — incidente manejable |

## 19. Dependencias

- Proyecto nuevo `lizqreiyysrqgkzyddff` operativo (PG17/GoTrue 2.197 — confirmado por `supabase/.temp/`).
- `sb_secret_*` y `sb_publishable_*` emitidas por el usuario en el panel (D1a/D1c — pendientes de ejecución).
- `PEPPER_IDENTIDAD` nuevo (server-side).
- `AUTH_LEGACY_ISSUER_ENABLED` (nuevo flag env).
- Librería JWT con JWKS (`PyJWT`/`cryptography` o equivalente) — decisión en implementación; `httpx` ya disponible.
- Tablas: `usuarios` (existe), `usuarios_auth_puente`/`roles`/`recuperacion_audit` (migraciones futuras §16).
- `usuarios.cedula_ruc UNIQUE` (ya existe — dedup parcial cubierto).

## 20. Decisiones pendientes

| # | Pendiente | Nota |
|---|---|---|
| F7a | **Diseño completo de sesión/offline** (§11): TTLs, rotación refresh, revocación, multi-dispositivo, política offline | entregable separado pre-implementación |
| F4-impl | Formato exacto de normalización cédula/RUC + dominio técnico definitivo + longitud del prefijo HMAC | D4 detalla; valores en implementación |
| F8-impl | Factores concretos de verificación asistida y rol operador exacto | §13 lista candidatos |
| D5 | Diseño Storage (bucket privado, signed URLs) | fuera de alcance D4 |
| Rol plataforma | ¿adoptar `roles`/`configuraciones_globales` de `0001` (renombrado)? | M2 opcional |
| PEPPER rotation plan | contingencia | documentar en runbook de seguridad |

## 21. Plan de implementación futuro (referencia — NO ejecutar)

```text
I0  Prerequisitos: claves nuevas emitidas (D1), diseño de sesión cerrado (F7a)
I1  Migraciones M1+M3 (puente + RLS con policy en el mismo paquete)
I2  Backend: servicio auth (derivador email sintético + cliente Admin API)
I3  Backend: /registro + /login nuevos tras flag FEATURE_SUPABASE_AUTH
I4  Backend: get_current_user dual (JWKS + legacy flag) + caché de puente
I5  Tests nuevos §17 + regresión 236
I6  Frontend: formularios contra /api/auth (sin supabase-js)
I7  Recuperación: endpoints + auditoría (M4)
I8  Coexistencia en producción → flag legacy OFF → retiro código local
I9  Hardening: sin fallback secrets en código, revisión RLS, pen-test ligero
```

---

# 22. D4.2 — ERRATA POST-D4.1

**Revisión:** D4.2 · Fecha: 2026-10-03 · Base: `16_REVISION_CRITICA_D4.md` (revisión adversaria) + decisiones de producto nuevas (personas jurídicas, planes $15–$25).
**Naturaleza:** esta sección **corrige y extiende** §3–§21 sin borrarlas. Cuando una sección anterior contradice a esta, **esta sección manda** (los puntos supersedidos están marcados inline con ⚠).

## 22.1 Fuentes y decisiones de producto incorporadas

| Decisión de producto nueva | Estado |
|---|---|
| Personas jurídicas pueden tener cuenta MELANTIA (RUC sociedad) | ✅ APROBADO |
| RUC persona natural (cédula+`001`) NO genera segunda identidad — colapsa a la cédula | ✅ APROBADO |
| Cuenta jurídica ≠ usuarios humanos que actúan en su nombre (representantes/colaboradores = cuentas propias vinculadas por autorización) | ✅ APROBADO |
| Cuentas jurídicas sin acceso gratuito; rango mínimo de plan **$15–$25** | ✅ APROBADO (rango, no catálogo) |
| Catálogo de planes, nombres, entitlements | ⏸️ PENDIENTE — fase suscripciones, **nunca** en auth |

## 22.2 Modelo de sujeto — identidad ≠ cuenta ≠ representación ≠ suscripción

```text
SUJETO DE AUTENTICACIÓN          (quién demuestra ser)
 ├─ Persona natural  → identidad fiscal canónica: CÉDULA
 │                      (RUC natural cédula+"001" colapsa aquí)
 └─ Persona jurídica → identidad fiscal canónica: RUC SOCIEDAD
          │
          ▼
CUENTA MELANTIA (usuarios.id + auth.users.id + puente)
          │        ↑ cada sujeto = una cuenta; el representante legal
          │          de una jurídica es OTRO sujeto con SU propia cuenta
          ▼
RELACIÓN/REPRESENTACIÓN          (en nombre de quién actúa — autorización,
          │                       no autenticación: tabla futura de
          │                       representante/colaborador → entidad)
          ▼
SUSCRIPCIÓN → PLAN → ENTITLEMENTS (qué capacidades tiene la cuenta —
                                   sistema de suscripciones; auth no conoce
                                   precios ni límites)
```

Reglas:
- La **autenticación** identifica al sujeto autenticado (humano o jurídico) — es independiente del precio.
- La **autorización** (EP-4E + futura tabla representación) determina qué puede hacer y en nombre de quién.
- Una persona jurídica puede "operar" a través de usuarios humanos autorizados — esas sesiones siguen siendo `usuarios.id` del humano; la vinculación a la entidad es un dato de dominio (misma filosofía que `ep_proyecto_participantes`).
- `usuarios` requiere distinguir el tipo de sujeto: campo `tipo_sujeto ∈ {natural, juridica}` (migración futura M1.x — propuesta, marca PENDIENTE hasta modelo de suscripciones).
- **Nada en auth/puente/JWT almacena precio, plan ni entitlements** — eso permite cambiar catálogo sin tocar identidad.

## 22.3 E1-3 CORREGIDO — Normalización fiscal e identidad canónica

**Problema original (D4.1):** derivar el sintético del string crudo permitía (a) RUC-natural ≠ cédula → doble identidad por persona; (b) typo de digitación → identidad válida pero inalcanzable.

**Pipeline obligatorio antes de derivar el sintético:**

```text
entrada (cedula_ruc del request)
 1. NORMALIZAR: trim, sin espacios/guiones, sin prefijos locales
 2. TIPO: ¿10 dígitos? ¿13 dígitos? → natural vs RUC
 3. ESTRUCTURA: provincia (2 primeros, 01–24) + tercer dígito
    · 10 dígitos, 3er dígito 0–5        → CÉDULA natural
    · 13 dígitos, 3er dígito 0–5 + "001"→ RUC persona natural → COLAPSA a cédula
    · 13 dígitos, 3er dígito 9          → RUC privada/extranjera → JURÍDICA
    · 13 dígitos, 3er dígito 6          → RUC pública          → JURÍDICA
 4. DÍGITO VERIFICADOR: módulo-10 (cédula/RUC-natural) / módulo-11
    (jurídico privado/público) → rechaza typos ANTES de derivar
 5. IDENTIDAD CANÓNICA: "NAT:<cedula10>" | "JUR:<ruc13>"
 6. DERIVAR: email_sintetico = HMAC_SHA256(PEPPER, identidad_canónica)
```

| Propiedad | Garantía |
|---|---|
| Formato canónico | `NAT:dddddddddd` / `JUR:ddddddddddddd` — `usuarios.cedula_ruc` y `user_metadata` almacenan el canónico, no la entrada cruda |
| Cédula↔RUC natural | `NAT` colapsa ambos → **una identidad por humano** |
| RUC jurídico | identidad `JUR` independiente — no colapsa a ninguna cédula; la relación con humanos va por representación (§22.2), no por identidad |
| Duplicados | `UNIQUE(cedula_ruc)` en puente+usuarios sobre el **canónico** — dos formas de escribir el mismo sujeto chocan |
| Colisiones sintéticas | dominios de entrada disjuntos (`NAT:`/`JUR:`) + 96 bits HMAC |
| Corrección de datos fiscales | si el dato fiscal del sujeto cambia/corrige → cambia el canónico → cambia el sintético → requiere **procedimiento admin de re-canonicalización** (desvincular + re-derivar + re-vincular, §22.6) — operación excepcional, auditada, no flujo de usuario |
| ⏸️ PENDIENTE | algoritmo exacto de dígito verificador (especificaciones oficiales del dígito 10 y 13, casos especiales/públicos) — especificar en implementación con referencia normativa, no se inventa aquí |

## 22.4 E1-1 CORREGIDO — Recuperación (supersede §13 Caso A)

**Problema original:** `/auth/v1/recover` envía al buzón de `auth.users.email` = sintético inexistente; cambiar `auth.users.email` al real rompería el login derivado.

**Reglas corregidas:**
- `auth.users.email` = **sintético, INMUTABLE, sin buzón** — nunca se actualiza a email real (así el login por derivación nunca se rompe).
- Contacto real = `usuarios.contacto` (existente) y/o `user_metadata.contacto_email` — separado del identificador técnico.
- **Se elimina `/auth/v1/recover` del diseño.** Toda recuperación es server-side.

**Mecanismo unificado:**

```text
POST /api/auth/recuperacion  (público, rate-limited §22.11)
   → identifica cuenta (canónico cédula/RUC) SIN confirmar existencia
   → FastAPI: POST /auth/v1/admin/generate_link (sb_secret_*)
              { type:"recovery", email: sintético }  → devuelve action_link
   → entrega del action_link por canal registrado y verificado:
       A) usuarios.contacto = email real → envío email propio
       B) sin email real → canal alternativo registrado
          (contacto telefónico/WhatsApp/entrega presencial por operador)
       C) reclamo de cuenta histórica huérfana → mismo flujo + verificación
          multifactor reforzada (§22.5 ESTADO 2)
   → usuario consume el link → reset estándar de contraseña en Supabase
   → POST-RESET: revocar refresh tokens previos (admin logout por usuario)
                 + registro en recuperacion_audit
```

| Escenario | Entrega | Verificación requerida |
|---|---|---|
| A. Email real registrado | action_link a `usuarios.contacto` tras verificar que el canal sigue vigente | propiedad del canal (el link ES el factor) + rate-limit |
| B. Sin email real | action_link vía operador/canal alternativo | **multifactor §13 original** — nunca solo cédula |
| C. Reclamo histórico | igual que B sobre cuenta `usuarios` huérfana | multifactor + `vinculado_por='asistido'` |
| Operador | genera y entrega el link — **jamás conoce la contraseña** (el reset lo hace el usuario contra Supabase directamente) | rol operador + auditoría |
| Post-recuperación | — | revocación de sesiones previas (admin `/logout` por user) + `recuperacion_audit` |

## 22.5 E1-2 CORREGIDO — Saga con tres estados e idempotencia

**Clasificación previa (reemplaza "dedup binario"):**

```text
ESTADO 1 COMPLETO:  usuarios + auth.users + puente coherentes
   → 409 "cuenta existente" (o sugerir login)
ESTADO 2 HUÉRFANO:  usuarios existe; falta auth.users y/o puente
   → NO crear segundo usuarios → FLUJO DE RECLAMO (= recuperación
     asistida §22.4-C: verificar identidad → crear auth.users → crear
     puente con vinculado_por='asistido'/'reclamo' → entregar acceso)
ESTADO 3 INEXISTENTE: → registro normal §7.2
```

**Estados parciales de la saga y resolución (amplía §7.3):**

| Estado tras fallo | Detección | Resolución |
|---|---|---|
| `usuarios` creado, Admin API falló/timeout | retry encuentra ESTADO 2 | reclamo automático silencioso si la saga lo reconoce como intento propio reciente (mismo request idempotente), o reclamo asistido |
| `auth.users` creado, respuesta ambigua (5xx/red — ¿se creó o no?) | reconciliación: Admin API `GET /admin/users` por email sintético | existe → reutilizar `auth_user_id` y continuar a puente; no existe → reintentar create |
| `auth.users` + `usuarios`, puente ausente | ESTADO 2 en dedup | crear solo el puente (reclamo) |
| puente creado, signIn final falla | — | responder "registro ok, haga login" |
| dos requests concurrentes misma cédula | `UNIQUE` en TX1 serializa → segundo recibe 409/reclamo | sin duplicados posibles |
| puente inconsistente (`usuario_id`→usuarios inexistente) | check de integridad en login/get_current_user | 500+alerta; reconciliación admin |

**Idempotencia:** clave natural = identidad canónica (UNIQUE en ambas tablas) + email sintético determinista + header `Idempotency-Key` opcional del cliente. Un retry del mismo request **converge** al estado correcto, nunca crea duplicados.

## 22.6 G1 CORREGIDO — Ciclo de vida del vínculo (desvinculación)

**CASCADE no resuelve todo** — es solo la mitad local. Procedimiento administrativo explícito:

| Evento | Tratamiento diseñado |
|---|---|
| Desactivar usuario | `puente.estado='suspendido'` + opcional `usuarios.activo=false` — **soft**, reversible, auditado. Bloquea login (check §9) e impersonación inmediata en la próxima request (bypass §22.8) |
| Borrar `usuarios` (excepcional) | CASCADE borra puente → `auth.users` queda **huérfano remoto**: puede autenticarse en GoTrue pero siempre 401 → el endpoint de borrado debe invocar también `admin DELETE /admin/users/{id}` (o job de reconciliación que barre huérfanos: puente sin auth / auth sin puente / usuarios sin ninguno) |
| `auth.users` borrado/baneado desde dashboard | tokens emitidos verifican por JWKS hasta `exp`; check `puente.estado` sigue dando acceso → revocación efectiva = `estado≠activo` + expiración natural (~1h); documentado como ventana de revocación, mitigable con `admin logout` |
| Desvinculación/revinculación admin | procedimiento dedicado: `puente.estado='desvinculado'` → re-vínculo a otro `usuarios.id` (fusión de duplicados, re-canonicalización §22.3, fallecimiento→herencia de datos) — **requiere rol operador + auditoría + multifactor cuando aplique** |
| Prevención de borrado accidental | borrado duro de `usuarios` restringido a procedimiento admin con confirmación; el camino normal siempre es `estado`/`activo` |

## 22.7 G2 CORREGIDO — I0: Prerequisitos de infraestructura para Auth

**BLOQUEANTE antes de I1.** Verificación (solo lectura) del proyecto `lizqreiyysrqgkzyddff`:

| Check | Condición | Si falla |
|---|---|---|
| Signing keys asimétricas | `GET /auth/v1/.well-known/jwks.json` devuelve JWKS con `kid`s | Activar signing keys en dashboard (acción del usuario) o F5 es incumplible sin shared-secret — **implementación BLOQUEADA** |
| Issuer | tokens emitidos con `iss` = URL del proyecto `/auth/v1` | revisar config/proxy — BLOQUEADO |
| Audience | `aud="authenticated"` presente | BLOQUEADO |
| Admin API accesible | `sb_secret_*` alcanza `/admin/users` desde el backend | BLOQUEADO |
| Password grant habilitado | `grant_type=password` aceptado | BLOQUEADO |

Sin estos checks verdes no se implementa nada de §7–§9.

## 22.8 G3 CORREGIDO — Caché del puente con bypass de revocación

```text
Request normal        → caché auth_users_id→usuario_id (TTL PENDIENTE — valor
                        técnico a fijar en implementación, rango 30–60 s)
Operación SENSIBLE    → BYPASS: SELECT estado FROM puente WHERE id=sub
                        (lookup directo; también válida una invalidación
                        por evento si existe canal)
Operaciones sensibles → login, recuperación, cambio de credenciales,
                        re-canonicalización, pagos/financiero, gestión EP-4E
                        administrar, cambios de cuenta/suscripción
```

Regla: **el caché nunca retarda una revocación crítica** — su TTL solo amortiza lecturas no sensibles.

## 22.9 G4 PRESERVADO — Fortaleza JWKS offline (aclaración, no error)

| Plano | Dependencia |
|---|---|
| **Validación criptográfica** (firma con clave pública JWKS cacheada + iss/aud/exp) | NO requiere GoTrue — GoTrue caído ≠ API caída mientras el token no expire |
| **Estado dinámico** (revocación, `estado` del puente, permisos EP-4E, suspensiones) | requiere BD local MELANTIA — independiente de GoTrue |
| **Emisión/refresh** (login, renovación, recovery) | SÍ requiere GoTrue — único plano que depende de Supabase en caliente |

El `503` por JWDS inalcanzable solo aplica con caché vacío/stale o `kid` desconocido no resoluble.

## 22.10 G5 CORREGIDO — Contrato de autenticación

`TokenResponse` se extiende (aditivo — campos nuevos no rompen el cliente actual):

```json
{ "access_token", "refresh_token", "expires_in", "token_type":"bearer",
  "usuario_id", "nombre" }
```

TTLs: **pendientes de F7a** — sin valores aquí. Transporte/almacenamiento del refresh (body JSON + secure-storage vs cookie `HttpOnly`): **pendiente de F7a** — entrelazado con la política de sesión y CSRF.

## 22.11 G6 CORREGIDO — Rate limiting como dependencia nueva

**Hallazgo verificado:** el backend actual **no tiene** middleware de rate-limiting (ninguna dependencia en `requirements*.txt`). Es **dependencia nueva de implementación** (slowapi/middleware propio/edge), no código gratis.

| Endpoint | Límite conceptual | Contra |
|---|---|---|
| `/registro` | por IP + por canónico | cuentas masivas, automatización |
| `/login` | por IP + por canónico + lockout progresivo | brute force, enumeración |
| `/recuperacion` | estricto por IP+canónico+canal | abuso de recovery, spam de links |
| reclamo de cuenta | igual que recuperación | toma de cuentas |
| operaciones admin (desvinculación, re-canonicalización) | por operador + por sujeto | insider abuse |
| JWKS refresh por `kid` desconocido | máx N/min (§9) | DoS vía tokens forjados |

## 22.12 Compatibilidad y F7a

- **`get_current_user` sin cambios:** `auth.users.id → puente → usuarios.id → str(...)`; `dependency_overrides` de los ~236 tests sigue funcionando porque bypassa el emisor. *(Nota: cifra "236" heredada de ADR-12; verificar con `pytest --collect-only` antes de usarla como criterio de regresión — A4.)*
- **Auth dual preservada:** discriminación por `iss` + flag `AUTH_LEGACY_ISSUER_ENABLED` + muerte natural del emisor local — sin cambios (§10).
- **F7a sigue PENDIENTE y es DEPENDENCIA de implementación completa:** access token, refresh token, rotación, expiración, revocación, multi-dispositivo, almacenamiento local, sesión offline, revalidación al reconectar, operaciones permitidas/prohibidas offline y comportamiento de sesión offline caducada — todo ello requiere diseño propio (siguiente fase), antes de implementar login real.
- **Sesión ≠ autorización offline** — ratificado, sin valores de TTL en este documento.

## 22.13 Matriz de cambios D4.2

| ID | Hallazgo | D4 original | Corrección | Estado |
|---|---|---|---|---|
| E1-1 | Recuperación | `/auth/v1/recover` al buzón sintético | `admin/generate_link` server-side + entrega por canal registrado; sintético inmutable | **Corregido §22.4** |
| E1-2 | Saga | dedup binario contradecía retry | 3 estados + reclamo + reconciliación por email sintético + idempotencia | **Corregido §22.5** |
| E1-3 | Cédula/RUC | derivación del string crudo | pipeline de normalización fiscal + identidad canónica + dígito verificador | **Corregido §22.3** |
| G1 | Desvinculación | solo CASCADE implícito | ciclo de vida completo: soft-state, huérfanos ambos sentidos, reconciliación, procedimiento admin | **Corregido §22.6** |
| G2 | JWKS | asumido disponible | I0 prerequisitos bloqueantes | **Corregido §22.7** |
| G3 | Caché | TTL 30–60 s sin excepciones | bypass para operaciones sensibles | **Corregido §22.8** |
| G4 | JWKS offline | "503 si JWKS down" sin matiz | separación validación criptográfica vs estado dinámico | **Preservado §22.9** |
| G5 | TokenResponse | sin refresh/expires_in | contrato extendido; transporte pendiente F7a | **Corregido §22.10** |
| G6 | Rate limiting | mencionado sin dependencia | requisito + **dependencia nueva** documentada | **Corregido §22.11** |

| Decisión | Estado |
|---|---|
| Personas jurídicas pueden tener cuenta | ✅ APROBADO |
| RUC sociedad = identidad jurídica independiente | ✅ APROBADO |
| RUC natural colapsa a cédula | ✅ APROBADO |
| Representantes humanos = cuentas propias + relación de representación | ✅ APROBADO |
| Planes jurídicos mínimos $15–$25 | ✅ APROBADO (solo rango) |
| Precios NO hardcodeados en auth | ✅ REGLA |
| Catálogo de planes/entitlements | ⏸️ PENDIENTE (fase suscripciones) |
| Algoritmo exacto dígito verificador | ⏸️ PENDIENTE (especificar en impl. con referencia normativa) |
| `usuarios.tipo_sujeto` | ⏸️ PENDIENTE (migración con modelo de suscripciones) |
| Modelo de representación/colaboración | ⏸️ PENDIENTE (fase de dominio) |
| TTL del caché del puente | ⏸️ PENDIENTE (valor en impl., bypass ya definido) |
| F7a sesión/refresh/offline | ⏸️ PENDIENTE — **dependencia bloqueante** |
| I0 verificación JWKS | ⏸️ PENDIENTE DE VERIFICACIÓN — **bloqueante** |
| D5 Storage | ⏸️ PENDIENTE |

## 22.14 Integridad D4.2

```text
Documento modificado: este archivo (15_DISENO...) — solo marcadores ⚠ y §22
Contenido histórico §1–§21: conservado íntegro (secciones supersedidas
                            marcadas, no borradas)
Código/.env/Supabase/PostgreSQL/migraciones/tests/dependencias: 0 cambios
git add/commit/push: NO · archivos movidos/renombrados/eliminados: 0
Nuevo archivo creado en esta tarea: ninguno (errata dentro del doc 15)
```

---

## INTEGRIDAD D4

```text
Documentos previos modificados: 0 (este ADR es aditivo al 14)
Código/.env/migraciones/Supabase/PostgreSQL: intactos — 0 modificaciones
Tablas/policies/buckets/usuarios creados: 0
Secretos expuestos: 0
git add/commit/push: NO · staged: 0
Único artefacto nuevo: este documento
```
