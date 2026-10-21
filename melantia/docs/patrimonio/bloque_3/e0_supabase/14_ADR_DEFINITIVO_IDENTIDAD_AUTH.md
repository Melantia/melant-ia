# 14 — ADR DEFINITIVO: IDENTIDAD, REGISTRO Y AUTENTICACIÓN MELANTIA CON SUPABASE AUTH

> Estado: **DECISIONES RATIFICADAS POR EL USUARIO** — F3/F5/F6 aprobadas; F4/F8 aprobadas condicionalmente; TTL pendiente de diseño (§5). Revisión del usuario registrada en §13.
> Tipo: Architecture Decision Record. **Nada implementado. Ningún código, `.env`, BD, migración ni credencial tocada.**
> Consolida: ADR E0.3 (doc 12, D1–D6 aprobadas), evaluación de opciones (doc 07), auditoría de claves E0.5 (doc 13), auditoría forense de backups (`backup_audit/01–09`).

---

## 0. Qué es "definitivo" aquí

Este ADR **cierra el diseño** que E0.3 dejó abierto: el modelo de identidad ya está decidido (D2/D4 aprobadas); lo que faltaba era el flujo concreto de **registro, login y sesión** (sub-decisión D3a) y la especificación exacta de verificación de tokens. Tras la revisión del usuario, F3, F5 y F6 quedan **aprobadas**; F4 y F8 quedan **aprobadas con condiciones registradas** (§3.2 y §6); el TTL de sesión queda **explícitamente aplazado** (§5).

**Hechos nuevos desde E0.3 que simplifican el diseño:**

| Hecho verificado (fuente) | Consecuencia para este ADR |
|---|---|
| El backup del proyecto antiguo tiene **0 usuarios, 0 filas de negocio, 0 buckets, 0 políticas RLS** (`backup_audit/02`) | **No hay backfill de identidades ni datos**: la adopción empieza en blanco; el reset de passwords y el mapeo cédula→auth cuestan ~0 |
| El proyecto nuevo `lizqreiyysrqgkzyddff` corre PG 17.11, **GoTrue v2.197**, Storage v1.77 (`supabase/.temp/*`) | Soporta el sistema de claves nuevas (`sb_publishable_`/`sb_secret_`) y verificación vía JWKS/signing keys |
| `SupabaseAuth` del backend es placeholder muerto; el único camino real es `React→FastAPI→psycopg` (doc 13) | La transición no rompe nada en runtime; toda la adopción es aditiva |
| `usuarios_perfiles` tiene **dos semánticas distintas** (junction local vs. puente `auth.users` de `0001`) | Se resuelve renombrando conceptualmente el puente — §3.2 |

---

## 1. DECISIONES DEFINITIVAS (resumen)

| # | Decisión | Contenido | Estado |
|---|---|---|---|
| F1 | Modelo de identidad | `auth.users` (Supabase) **solo autentica**; `usuarios` **solo perfila**. Unión 1:1 por tabla puente | **Ratifica D4** — cerrado |
| F2 | Emisor de tokens | **Supabase Auth** es el único emisor objetivo. JWT local queda como emisor transitorio con fecha de caducidad natural (30 min) | **Ratifica D2** — cerrado |
| F3 | Registro | **Provision server-side** (Admin API con `sb_secret_*` desde FastAPI), no signUp directo del browser | ✅ **APROBADA** — `sb_secret_*` exclusivamente en backend |
| F4 | Identificador de login | **Cédula/RUC como identificador de negocio**; resolución a credencial Supabase en servidor. Email sintético = mecanismo técnico, nunca identidad. Email real **opcional** | ⚠️ **APROBADA CONDICIONALMENTE** — reglas §3.2.1 |
| F5 | Verificación de tokens | JWKS/`iss`/`aud` con caché — nunca shared-secret legacy, nunca `sb_secret` como Bearer de usuario | ✅ **APROBADA** |
| F6 | Contrato downstream | `get_current_user → str(usuarios.id)` inmutable; doble emisor transitorio por discriminación de `iss` | ✅ **APROBADA** — frontera auth/AuthZ definitiva |
| F7 | Sesión/refresh | Refresh gestionado por Supabase Auth en cliente; FastAPI stateless | ✅ parte operativa aprobada |
| F7a | **TTL de sesión** | **NO fijado** — sesión ≠ capacidad offline; requiere diseño propio | ⏸️ **PENDIENTE** — diseño dedicado (§5.1) |
| F8 | Recuperación | Estándar (email real) + **asistida auditada** (operador + verificación de identidad) | ⚠️ **APROBADA CONDICIONALMENTE** — regla §6.1 |
| F9 | RLS/policies | El puente y tablas sensibles llevan RLS como defensa-en-profundidad; enforcement real en FastAPI con `sb_secret_*` | Cerrado (D5+E0.5 §15) |

Herencia íntegra: D1a/D1b (rotaciones autorizadas, pendientes del usuario), D1c, D5 (bucket privado gestionado por FastAPI), D6 (adopción condicionada de `0001_fase1_core.sql`).

---

## 2. MODELO DE IDENTIDAD DEFINITIVO (F1)

```text
                    Supabase Auth (proyecto lizqreiyysrqgkzyddff)
        ┌──────────────────────────────────────────────┐
        │ auth.users                                    │
        │  id UUID  ← identidad de autenticación        │
        │  email (real o sintético) / phone             │
        │  encrypted_password · app_metadata {rol plat} │
        └──────────────────┬───────────────────────────┘
                           │ 1:1
        ┌──────────────────▼───────────────────────────┐
        │ public.usuarios_auth_puente   ← NOMBRE FINAL │
        │  id UUID PK = auth.users.id (FK CASCADE)     │
        │  usuario_id UUID UNIQUE → usuarios.id        │
        │  cedula_ruc VARCHAR(20) UNIQUE               │  ← caché de registro/dedup
        │  rol_id → roles (plataforma)                 │
        │  estado · created_at · updated_at            │
        └──────────────────┬───────────────────────────┘
                           │ 1:1
        ┌──────────────────▼───────────────────────────┐
        │ public.usuarios (CANÓNICA — sin cambios)      │
        │  perfil de negocio: nombre, cedula_ruc, geo,  │
        │  sector_comunidad, tipo_suscripcion, ...      │
        └──────────────────┬───────────────────────────┘
                           │ todo el grafo FK existente
            fincas · ep_proyecto_participantes · workspaces · evidencias …
```

**Invariante (ratificado):** el grafo de negocio cuelga de `usuarios.id`. Supabase Auth queda fuera del grafo. El JWT `sub` que entrega la API a sus consumidores internos sigue siendo `usuarios.id` — contrato estable que blinda a EP-4E, workspaces, evidencias y los 236 tests.

### 2.1 ¿Por qué puente en vez de `usuarios.auth_user_id`? (decisión cerrada en diseño)

| Criterio | Puente `usuarios_auth_puente` | `usuarios.auth_user_id` |
|---|---|---|
| Acoplamiento del modelo canónico al proveedor | Nulo | Alto |
| Re-vinculación admin (F8) | `UPDATE usuario_id` aislado | toca la tabla núcleo |
| Usuarios sin cuenta Auth (históricos, registros en papel) | Soportados (puente ausente) | Soportados (NULL) — empate |
| Doble eje rol plataforma/contextual | Natural (puente lleva `rol_id`) | Exige tabla extra igual |
| Coste | 1 JOIN adicional por request (cacheable) | — |
| **Veredicto** | **Elegido** | Descartado (evaluado en E0.3 §6.1) |

### 2.2 Colisión de nombres `usuarios_perfiles` (resolución definitiva)

- `usuarios_perfiles` **canónico local** = junction `usuarios ↔ perfiles_profesionales` (`ecosistema_profesional.sql:49`) — conserva su nombre y función.
- `usuarios_perfiles` **de `0001_fase1_core.sql`** = puente `auth.users` — **se adopta renombrado a `usuarios_auth_puente`** en la migración de adopción. Razón: dos tablas con el mismo nombre y semántica distinta en el mismo `public` es un defecto de diseño irrecuperable después.
- Alternativa evaluada: `auth_profiles` / `identidades_auth`. Se prefiere `usuarios_auth_puente` por autodescripción.

---

## 3. REGISTRO (F3+F4) — resolución de D3a

### 3.1 Opciones evaluadas en E0.3 §7 — veredicto

| Opción | Veredicto |
|---|---|
| Email real obligatorio | **Descartada como requisito** — el usuario objetivo es rural; exigir email cierra la puerta de entrada |
| Email sintético (`cedula@id.melantia.app`) | **Adoptado como mecanismo interno** — invisible al usuario, da a Supabase el identificador único que exige GoTrue |
| Teléfono/OTP | Fase posterior opcional — costo/latencia en zonas sin señal; no bloquea la base |
| Magic link | Descartado para login base (exige email real + conectividad al entrar) |
| **Admin API / provisión server-side** | **Adoptada como flujo de registro** — da control total del onboarding y permite cédula-solo |

### 3.2 Flujo definitivo de registro (diseño — no implementado)

```text
[Formulario de registro — frontend]
    nombre · cédula/RUC · password · geo (provincia/cantón/parroquia)
    · sector_comunidad · aceptación de políticas
            │  POST /registro   (JSON plano al API propio — nunca a Supabase directo)
            ▼
[FastAPI /registro]
  1. Validar: cédula formato · unicidad en usuarios_auth_puente.cedula_ruc
     · políticas aceptadas (CHECK ya existe en esquema viejo: check_politicas_obligatorias)
  2. Crear en Supabase Auth con sb_secret_* (Admin API):
       POST /auth/v1/admin/users
       { email: "<derivado_cedula>@<dominio-propio>",  ← sintético por §3.2.1:
         password, email_confirm: true,                   determinista, sin cédula en claro
         user_metadata: {cedula_ruc}, app_metadata: {origen:"registro-melantia"} }
     → obtiene auth.users.id
  3. INSERT usuarios (perfil de negocio)  → usuarios.id
  4. INSERT usuarios_auth_puente (id=auth.users.id, usuario_id, cedula_ruc, rol por defecto)
  5. Transacción lógica: si (3)|(4) fallan → compensar (delete admin user)
  6. Responder: sesión creada (signIn server-side o instruir login inmediato)
```

**Propiedades de este diseño:**

- **Cédula-solo UX**: el agricultor nunca ve ni necesita email — resuelve D3 conservando D3 (cédula como identificador de negocio) sin duplicar identidad.
- **`sb_secret_*` nunca sale del servidor** — el browser solo habla con FastAPI (patrón ya vigente: `VITE_API_URL` único).
- **Dedup natural**: `usuarios_auth_puente.cedula_ruc UNIQUE` = una identidad por persona; el email sintético derivado es determinista → un retry de registro detecta el duplicado de forma explícita.
- **Registro asistido** (técnico registra agricultor in situ): mismo endpoint con `actor` distinto — cubierto por diseño.

### 3.2.1 REGLA EXPLÍCITA SOBRE EL EMAIL SINTÉTICO (condición de aprobación F4)

> **La dirección de correo sintética no se utiliza como identificador de negocio, no se muestra al usuario y no sustituye a `usuarios.id` ni a `usuarios.cedula_ruc`. Es exclusivamente un mecanismo técnico interno de Supabase Auth.**

La identidad de negocio sigue siendo `usuarios.id`; el identificador de negocio sigue siendo `usuarios.cedula_ruc`. El email sintético solo existe porque GoTrue exige un `email`/`phone` único por cuenta.

**Requisitos de diseño del identificador sintético** (a especificar en la fase de implementación — D4):

1. **Determinista** — la misma cédula produce siempre el mismo correo (permite login y detección de duplicados sin estado adicional).
2. **Único** — inyectivo respecto a cédula/RUC: dos identidades de negocio nunca comparten correo.
3. **Estable** — no depende de datos mutables del perfil (nombre, sector, geografía).
4. **No expone la cédula directamente** — el correo no debe llevar la cédula legible (derivación por hash/normalización, no texto plano).
5. **Imposible de colisionar** — dominio propio reservado (`@id.melantia.app` o equivalente) + esquema que descarte choques entre variantes de cédula/RUC.
6. **Independiente de la política de login** — cambiar mañana de "cédula+password" a OTP/teléfono no puede invalidar ni regenerar correos ya emitidos.

### 3.3 Login (F4)

```text
POST /login  { cedula_ruc, password }
     │
     ▼
FastAPI: SELECT id FROM usuarios_auth_puente WHERE cedula_ruc = $1
     │─── no existe → 401 genérico (no revelar existencia)
     │
     ▼
email_sintético(cedula) → Supabase signInWithPassword (grant: password)
     │
     ▼
Devuelve { access_token, refresh_token } al cliente
     │
     └── El cliente guarda el par de tokens (storage seguro de la app)
         y llama a FastAPI con:  Authorization: Bearer <access_token>
```

- La llamada `signIn` puede hacerse server-side (FastAPI como proxy, patrón uniforme con el registro) o client-side con `sb_publishable_*` una vez exista supabase-js en frontend. **Recomendación: server-side al inicio** — cero nuevas dependencias en el bundle y un solo punto de política (rate-limit, lockout, auditoría de intentos).
- `auth.users.email` sintético nunca se expone al cliente.

---

## 4. AUTENTICACIÓN DE PETICIONES (F5+F6)

### 4.1 Especificación del validador (reemplaza al placeholder `SupabaseAuth`)

```text
Authorization: Bearer <jwt>
        │
        ▼
get_current_user(credentials)
        │
        ├─ iss == "https://lizqreiyysrqgkzyddff.supabase.co/auth/v1"
        │        ∧ aud == "authenticated"  (o "anon"? — NO: solo authenticated)
        │   │
        │   SÍ → verificar firma:
        │        · GoTrue ≥2.177 / proyecto nuevo: JWKS
        │          GET {SUPABASE_URL}/auth/v1/.well-known/jwks.json
        │          (cachear JWKS ~10min; algoritmo del kid activo — ES256/EdDSA o HS256
        │           según signing keys del proyecto; NUNCA hardcodear el secreto)
        │        · exp/nbf/iat validados · iss/aud exactos
        │        sub = auth.users.id
        │        SELECT usuario_id FROM usuarios_auth_puente WHERE id = sub
        │          · existe → return str(usuario_id)
        │          · no existe → 401 "identidad sin perfil de negocio"
        │          · cachear mapeo (TTL corto) para no pagar JOIN por request
        │
        └─ NO → validador legacy HS256 (transitorio, solo si flag ACTIVADO)
                  verify_token() + get_user_id_from_token() actuales
                  sub ya es usuarios.id → return directo
                  [flag OFF al cierre de transición → elimina la rama]
```

**Reglas duras:**

1. Nunca `sb_secret_*` como Bearer de usuario — esa clave es para llamadas Admin API server-to-server, no para autenticar peticiones de usuario.
2. Nunca aceptar JWT sin `iss`/`aud` correctos — el validador local actual no los exige; el nuevo sí (cierra el gap documentado en doc 07).
3. `401` para token válido sin puente — no auto-provisionar fuera de `/registro` (invariante E0.3 §9.2).
4. El placeholder `SupabaseAuth` (`security.py:165-233`) se retira en la implementación — sus headers con `service_role` como Bearer serían un anti-patrón si alguien los usara.

### 4.2 Doble emisor transitorio

- Discriminación por `iss` (no por heurística). Los tokens locales tienen `exp`=30 min → **caducidad natural = ventana de transición** sin revocación masiva ni logout forzado.
- Flag de configuración (ej. `AUTH_LEGACY_ISSUER_ENABLED`) para apagar el emisor local al cierre — definido aquí como diseño, no implementado.

### 4.3 Contrato preservado (ratifica E0.3 §3)

`get_current_user → str` con `usuarios.id`. Downstream (EP-4E `resolver_permiso`, workspaces, evidencias, checkers de rol/suscripción/propiedad, 236 tests con `dependency_overrides`) **no se entera del cambio de firmante**. Es la prueba de regresión del contrato.

---

## 5. SESIÓN, REFRESH Y OFFLINE-FIRST (F7)

| Aspecto | Decisión de diseño |
|---|---|
| Access token | El de Supabase Auth (vida por defecto del proyecto; TTL pendiente, §5.1) |
| Refresh | Gestionado por el cliente (Supabase Auth SDK o `/auth/v1/token?grant_type=refresh_token`). FastAPI **nunca** ve refresh tokens |
| "Login sin red" | No existe en ningún esquema: ni el JWT local actual ni Supabase Auth autentican de cero sin conectividad. Offline-first necesita sesión válida **previa** + datos cacheados — no autenticación nueva |
| Lockout/intentos | Rate-limit en `/login` (FastAPI) + lockout por cédula — política a definir en implementación (P2) |
| MFA | Disponible en GoTrue v2.197; fase posterior, no bloquea |

### 5.1 TTL — DECISIÓN APLAZADA (registrada por el usuario)

> **Sesión de N días ≠ capacidad offline durante N días. Sesión ≠ autorización offline.**

El usuario **no aprueba fijar** un TTL largo (p. ej. 30 días) como mecanismo principal de offline-first. Razonamiento registrado: MELANTIA manejará fincas, evidencias, proyectos, información financiera, identidad y operaciones comerciales — "offline-first" **no debe convertirse en "token de larga duración sin controles"**.

El diseño de sesión queda como **tema dedicado pendiente**, cuyos componentes a diseñar por separado son:

```text
access token (TTL corto)
   + refresh token (TTL y rotación por decidir)
   + sesión local segura en el dispositivo (almacenamiento, bloqueo)
   + política de operación offline (qué puede hacerse sin red vs. qué exige revalidación)
   + revalidación al recuperar conectividad (qué se refresca, qué se reautentica, qué se sincroniza)
```

Criterios que deberá cumplir ese diseño: operación de campo sin señal por jornadas reales, revalidación de privilegios sensibles al reconectar, revocación efectiva ante pérdida de dispositivo, y diferenciación entre "leer datos cacheados offline" y "ejecutar operaciones autorizadas offline".

---

## 6. RECUPERACIÓN DE CUENTA (F8)

El email no es garantía (sintético por defecto) → recuperación **dual**:

| Escenario | Flujo |
|---|---|
| Usuario con email real asociado | Reset estándar Supabase (`/auth/v1/recover` → magic link/OTP) — gratis, sin código propio |
| Usuario sin email (mayoría al inicio) | **Recuperación asistida**: verificación humana (operador/admin verifica cédula físicamente o por verificación de identidad existente `verificaciones_identidad`) → admin actualiza password vía Admin API con `sb_secret_*` |
| Anti-secuestro | El email sintético no recibe nada → un atacante no puede usar `/recover` para tomar cuentas ajenas; la vía asistida exige rol operador |

### 6.1 REGLA EXPLÍCITA DE RECUPERACIÓN ASISTIDA (condición de aprobación F8)

> **Una recuperación asistida nunca debe depender exclusivamente de conocer la cédula — la cédula no es un secreto.**

Consecuencias de diseño (a detallar en D4):

1. **Verificación multifactor obligatoria**: la recuperación asistida exige pruebas adicionales definidas (p. ej. verificación presencial por técnico/operador, `verificaciones_identidad` con evidencia fotográfica, validación cruzada de datos de negocio que solo el titular conoce, o combinación) — nunca "dime tu cédula y te reseteo".
2. **Operador autorizado con alcance limitado**: solo rol de plataforma designado puede ejecutar el reset; el operador **no ve ni fija** la contraseña nueva — el flujo produce credencial temporal/cambio obligatorio al primer acceso.
3. **Auditoría obligatoria**: toda recuperación asistida se registra (quién operó, a quién, cuándo, qué evidencia se presentó, resultado) en tabla de auditoría de seguridad — diseño en D4.
4. **Detección de abuso**: intentos repetidos de recuperación sobre la misma identidad generan alerta/lockout (mismo canal que el lockout de login, §5).

---

## 7. AUTORIZACIÓN — DOBLE EJE (ratifica E0.3 §6.2)

```text
Rol de PLATAFORMA (global):  usuarios_auth_puente.rol_id → roles{admin, tecnico, usuario}
   ↳ decide: admin endpoints, recuperación asistida, gestión global

Rol CONTEXTUAL (por proyecto):  ep_proyecto_participantes.rol{propietario, socio, colaborador}
   ↳ decide: permisos EP-4E — ya implementado en autorizacion.py, intacto
```

Nunca se mezclan en una misma verificación (invariante E0.3 §9.6). `app_metadata.rol` en el JWT puede llevar el rol de plataforma como caché, pero la fuente de verdad es BD.

---

## 8. CLAVES Y SUPERFICIE (consolida E0.5)

| Clave | Quién la usa | Para qué | Regla |
|---|---|---|---|
| `sb_publishable_*` (`VITE_SUPABASE_PUBLISHABLE_KEY` futura) | browser, **solo si** se introduce supabase-js | signIn directo, Storage upload con RLS | Nunca bypassa RLS; segura por diseño en bundle |
| `sb_secret_*` (`SUPABASE_SECRET_KEY` futura) | **solo FastAPI server-side** | Admin API (`admin/users`), Storage admin, bypass RLS deliberado | Nunca en browser ni en archivo servido |
| `SUPABASE_URL` | backend (hoy) / frontend (futuro) | base de todos los endpoints `/auth/v1`, `/rest/v1`, `/storage/v1` | Conservar (no secreta) |
| JWT de usuario (`access_token`) | cliente → FastAPI | autenticación por petición | HS256-hoy → firma Supabase mañana; `exp` corto |

Las claves legacy `anon`/`service_role` del proyecto nuevo pueden convivir hasta que nada las use; las del proyecto **viejo** (`upfwgaacznljbzmbgcul`) deben considerarse muertas y rotarse/descartarse (R-15 backup audit).

## 9. RLS Y POLICIES (F9)

- El backup del viejo proyecto demuestra el anti-patrón: **RLS activado en 7 tablas y 0 policies** = negación total silenciosa. En el proyecto nuevo cada tabla con `ENABLE RLS` **debe llevar su policy en la misma migración** o queda muerta.
- `usuarios_auth_puente`: policy `SELECT USING (auth.uid() = id)` (auto-lectura) — resto denegado; escritura solo vía service (backend bypassa RLS).
- Runtime real: FastAPI con `sb_secret_*` (bypass) → RLS es defensa-en-profundidad por si PostgREST/frontend directo se expone algún día, no enforcement primario (E0.3 §5).

## 10. MATRIZ DE IMPACTO FINAL (consolidada)

| Componente | Cambio |
|---|---|
| `usuarios` + grafo FK | **0** — invariante |
| `get_current_user` | interior: validador JWKS + puente + rama legacy flag |
| `verify_token`/JWT local | coexistencia transitoria → retiro |
| `/login` `/registro` | re-implementados como proxy server-side Supabase |
| `usuarios_perfiles` (junction local) | **0** — conserva nombre y función |
| `usuarios_perfiles` (de `0001`) | se adopta **renombrada** `usuarios_auth_puente` + columna `usuario_id` |
| `SupabaseAuth` placeholder | reemplazado por validador §4.1 |
| EP-4E, workspaces, evidencias, 236 tests | **0** (contrato preservado) |
| Frontend | nuevo: llamadas `/registro`+`/login` al API; supabase-js **opcional** y posterior |
| `password_hash` en `usuarios` | legacy al cierre (no borrar durante transición) |
| RLS policies nuevas | diseño nuevo obligatorio (F9) |

## 11. SECUENCIA DE ADOPCIÓN DEFINITIVA (referencia — nada ejecutado)

```text
A. Rotaciones pendientes del usuario (D1a sb_secret_*, D1b PAYPHONE)   [panel Supabase/comercio]
B. Provisionar proyecto nuevo: habilitar Auth providers necesarios,
   ajustar TTLs de sesión (F7), revisar signing keys JWKS (F5)
C. Migración SQL: usuarios_auth_puente (con usuario_id) + roles/configuraciones
   + policies RLS de la propia migración (F9)
D. Backend: endpoints /registro+/login server-side, validador dual tras flag,
   eliminación del placeholder SupabaseAuth
E. Frontend: formulario registro/login contra API propia (sin supabase-js)
F. Coexistencia: emisor local + Supabase (flag); tokens locales mueren a los 30 min
G. Cierre: flag OFF, retiro de security.py legacy, password_hash queda archivo
H. Posterior (opcional): supabase-js + publishable para Storage directo/Realtime,
   teléfono/OTP, MFA
```

## 12. INVARIANTES DE VERIFICACIÓN (definitivas)

1. `get_current_user` devuelve `str` existente en `usuarios.id` — siempre.
2. Token con firma válida pero sin puente → `401`, jamás auto-provisión.
3. Ningún endpoint lee `auth.users` directamente — solo puente.
4. `sb_secret_*` jamás en código/salida del browser, logs ni bundle.
5. 236 tests pasan sin modificación (regresión del contrato).
6. Una cédula = una identidad (`usuarios_auth_puente.cedula_ruc UNIQUE`).
7. Rol plataforma ≠ rol contextual en ninguna verificación.
8. RLS sin policy no se mergea nunca (lección del backup: 0 policies = 0 acceso).
9. El email sintético no se expone al cliente ni se usa como canal de comunicación.
10. Emisor local apagable por flag en una sola línea de configuración.

## 13. REGISTRO DE RATIFICACIÓN DEL USUARIO

Revisión del usuario sobre F3–F8 (sub-decisión D3a de E0.3) — **estado final registrado**:

| # | Decisión | Estado del usuario | Condiciones registradas |
|---|---|---|---|
| F3 | Registro server-side (FastAPI → Admin API) | ✅ **APROBADA** | `sb_secret_*` exclusivamente en backend |
| F4 | Cédula + email sintético | ⚠️ **APROBADA CONDICIONALMENTE** | Email sintético = mecanismo técnico; regla §3.2.1 (no identidad de negocio, no visible, determinista/único/estable/sin colisión/no expone cédula/independiente de política de login) |
| F5 | JWKS + `iss`/`aud` | ✅ **APROBADA** | — |
| F6 | `get_current_user → usuarios.id` | ✅ **APROBADA** | Frontera auth→AuthZ: el resto de MELANTIA nunca conoce el firmante del token |
| F7a | TTL sesión | ⏸️ **PENDIENTE** | No fijar ≥30 días; diseño dedicado de sesión/refresh/offline (§5.1) |
| F8 | Recuperación dual | ⚠️ **APROBADA CONDICIONALMENTE** | Asistida nunca basada solo en cédula; multifactor + operador autorizado + auditoría (§6.1) |
| Extra | Renombre `usuarios_perfiles`(0001) → `usuarios_auth_puente` | ✅ **APROBADA** | Elimina la ambigüedad con la junction funcional local |

**Lo que el usuario NO autoriza aún:** implementación de código, colocar `sb_secret_*`/`sb_publishable_*` en producción del código, fijar TTL de sesión.

### Siguiente paso (ruta acordada)

```text
D3a — Identidad/Auth
        ↓
     CERRAR ADR            ← ESTE DOCUMENTO (queda cerrado con las condiciones registradas)
        ↓
D4 — Diseño técnico de integración    ← SIGUIENTE: esquema concreto del puente,
        ↓                              derivación del email sintético, endpoints
Implementación                         /registro+/login, validador JWKS, tabla de
        ↓                              auditoría de recuperación, diseño de sesión (§5.1)
Tests (incl. regresión contrato F6)
        ↓
Supabase nuevo
```

## 14. INTEGRIDAD

```text
Archivos modificados: 0  ·  eliminados/movidos/renombrados: 0
Código/BD/schema/.env:   intocados
Migraciones ejecutadas:  0  ·  Credenciales tocadas: 0
git add/commit/push:     NO  ·  staged: 0
Único artefacto nuevo:   este documento
```
