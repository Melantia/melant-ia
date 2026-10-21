# 12 — ADR: ARQUITECTURA DE IDENTIDAD Y MODELO DE USUARIOS (E0.3)

> Estado: **DECISIONES D1–D6 APROBADAS por el usuario** (con sub-decisión abierta en D3).
> Fecha: E0.3. Tipo: Architecture Decision Record — solo diseño y verificación.
> **Nada implementado. Ninguna migración ejecutada. Ninguna credencial tocada.**

---

## 1. DECISIONES REGISTRADAS (aprobación del usuario)

| # | Decisión | Estado aprobado |
|---|---|---|
| D1a | `sb_secret_*` | 🔴 **Autorizada su rotación** (pendiente de ejecutarse por el usuario en el panel Supabase) |
| D1b | `PAYPHONE_SECRET_KEY` | 🔴 **Autorizada su rotación** (panel del comercio) |
| D1c | `sb_publishable_*` | 🟢 **No rotar por defecto**; revisar RLS y migrar nomenclatura/configuración |
| D2 | Arquitectura auth | **Opción C como objetivo**: Supabase Auth → JWT → FastAPI → MELANTIA Authorization |
| D3 | Login por cédula | **Cédula se mantiene como identificador de negocio**; la autenticación la resuelve Supabase Auth **sin duplicar identidad**. El mecanismo concreto queda abierto → §7 (D3a) |
| D4 | `usuarios` | **Permanece como perfil de negocio rural**; `usuarios_perfiles` será el puente hacia `auth.users` |
| D5 | Storage | **Bucket privado** + acceso gestionado por FastAPI / signed URLs según caso |
| D6 | `0001_fase1_core.sql` | **Adoptado conceptualmente**, condicionado a revisión de compatibilidad con el schema canónico → §6 |

## 2. CADENA DE IDENTIDAD OBJETIVO

```
Supabase Auth                      PostgreSQL MELANTIA
┌──────────────┐
│ auth.users   │  (gestionada por Supabase: email/phone,
│  id UUID     │   password, verificación, recuperación)
└──────┬───────┘
       │ 1:1   usuarios_perfiles.id = auth.users.id
       ↓
┌─────────────────────┐
│ usuarios_perfiles   │  PUENTE: id→auth.users · usuario_id→usuarios
│  (de 0001_fase1)    │  cedula_ruc UNIQUE · rol plataforma (roles)
└──────┬──────────────┘
       │ 1:1   usuarios_perfiles.usuario_id → usuarios.id
       ↓
┌─────────────────────┐
│ usuarios            │  PERFIL DE NEGOCIO (canónica, sin cambios):
│  id UUID            │  cedula_ruc, provincia/cantón/parroquia,
└──────┬──────────────┘  sector_comunidad, fincas, tipo_suscripcion…
       │
       ├── ep_proyecto_participantes.usuario_id  (roles contextuales)
       ├── workspaces_miembros.usuario_id
       ├── fincas, levantamientos, evidencias… (todos FK → usuarios.id)
       └── JWT `sub` emitido = usuarios.id  ← CONTRATO ESTABLE
```

**Invariante central**: todo el grafo de negocio (`usuarios`, participantes EP, fincas, evidencias, workspaces, suscripciones) cuelga de `usuarios.id`. Supabase Auth queda **fuera** del grafo de negocio: solo aporta `auth.users.id`, que se resuelve a `usuarios.id` en el puente.

## 3. EL CONTRATO QUE LO HACE COMPATIBLE — `get_current_user`

Evidencia verificada en código:

| Punto | Evidencia | Consecuencia |
|---|---|---|
| `get_current_user` devuelve `str` = `usuarios.id` extraído del `sub` JWT | `core/dependencies.py:101-136` | El **único punto de traducción** auth→negocio es una sola función |
| Todos los consumidores reciben `usuario_id: str` | `ep/dependencies.py:64`, endpoints, `resolver_permiso` | Agnósticos al firmante del JWT |
| 236 tests: los de API usan `app.dependency_overrides[get_current_user] = lambda: usuario` (UUID directo) | `test_*_api.py` (6 suites) | **No ejercitan el parseo JWT → inmunes al cambio de issuer** |
| Tests `test_jwt_obligatorio` | solo verifican `401` sin token | Cumplen igual con cualquier validador |
| EP-4E `resolver_permiso` compara `usuario_id` contra `propietario`/`participantes` UUID | `ep/services/autorizacion.py` | Sigue recibiendo `usuarios.id` — intacto |
| Checkers de `core/dependencies` (rol/suscripción/límite/propiedad) | placeholders que permiten todo | Evolucionan leyendo `usuarios.id` — sin acoplo |

**Conclusión de compatibilidad**: adoptar Supabase Auth cambia **solo el interior de `get_current_user`**: verificar firma del JWT Supabase y resolver `sub` (`auth.users.id`) → `usuarios_perfiles.usuario_id` → devolver `str(usuarios.id)`. Downstream — EP-4E, roles contextuales, los 236 tests — **no se entera de quién firmó el token**.

## 4. RESOLUCIÓN DEL TOKEN (diseño objetivo)

```
Authorization: Bearer <jwt>
        │
        ▼
get_current_user
        │
        ├─ ¿iss = <proyecto>.supabase.co/auth/v1 (o aud='authenticated')?
        │        │
        │        SÍ → verificar firma (JWKS del proyecto / secret legacy)
        │             sub = auth.users.id
        │             SELECT usuario_id FROM usuarios_perfiles WHERE id = sub
        │             → devolver str(usuario_id)   [404→401 si no existe puente]
        │
        └─ NO (fase transitoria) → verificar HS256 local
                     sub = usuarios.id  → devolver directo
```

- **Doble emisor transitorio**: durante la migración coexisten tokens locales y Supabase; se discriminan por `iss`/`aud`, no por adivinación. Los tokens locales heredados tienen `exp` de 30 min → caducan solos sin revocación masiva.
- **Refresh tokens**: los gestiona Supabase Auth en el cliente; FastAPI solo ve access tokens. Elimina la deuda "sin refresh" del auth local.
- **`iss`/`aud` pasan a ser verificables** — cierra el gap actual de claims.

## 5. MATRIZ DE IMPACTO

| Componente | ¿Cambia? | Detalle |
|---|---|---|
| `usuarios` + todo el grafo FK | **NO** | Sigue siendo la identidad de negocio |
| `get_current_user` | Sí (interior) | Dos validadores + indirección por puente; mismo retorno |
| `verify_token`/`get_user_id_from_token` (local) | Coexisten | Permanecen para la transición; se retiran al cierre |
| `POST /login` `POST /registro` (local) | Fase transitoria | Siguen emitiendo JWT local hasta definir D3a; luego pasan a ser proxy/fachada de Supabase Auth o se retiran |
| `GET /me` | NO | Lee `usuarios` por `sub` ya resuelto |
| EP-4E `require_ep_access` + `autorizacion.py` | **NO** | Contrato `usuario_id` preservado |
| 236 tests | **NO** (esperado) | Overrides de dependencia son signer-agnósticos |
| `SupabaseAuth` (security.py) | Reemplazar | El placeholder y su header con secret se sustituyen por verificación JWKS/iss/aud |
| Frontend histórico (directo a Supabase) | ADAPTAR | Pasará a hablar con FastAPI; nunca portar REST-directo |
| RLS de `0001_fase1_core` | Coexiste | FastAPI conectará con `sb_secret_*` (bypassa RLS) → RLS es defensa-en-profundidad, no enforcement; igual conviene por si algún día se expone PostgREST |

## 6. REVISIÓN DE COMPATIBILIDAD — `0001_fase1_core.sql` (D6)

### 6.1 Brecha única encontrada

`usuarios_perfiles` tal como está **no enlaza con `usuarios`**: tiene `id → auth.users` pero falta la columna del lado negocio. Para la cadena de §2 hace falta (diseño, no ejecutado):

```sql
ALTER TABLE usuarios_perfiles
ADD COLUMN usuario_id UUID UNIQUE REFERENCES usuarios(id);
-- UNIQUE → 1:1 estricto. Nullable durante backfill de usuarios existentes.
```

Alternativa descartable (evaluar en adopción): `usuarios.auth_user_id UUID UNIQUE` — un solo JOIN menos, pero acopla la tabla canónica al proveedor y complica backfill si cambia el puente.

### 6.2 Choques de concepto a reconciliar

| Elemento 0001 | Elemento canónico | Conflicto | Resolución propuesta |
|---|---|---|---|
| `roles` (catálogo: admin/tecnico/usuario) + `usuarios_perfiles.rol_id` | `ep_proyecto_participantes.rol` (propietario/socio/colaborador) | **No es conflicto**: son niveles distintos | `roles` = rol de **plataforma** (global); EP `rol` = rol **contextual** por proyecto. Documentar el doble eje |
| `usuarios_perfiles.cedula_ruc UNIQUE` | `usuarios.cedula_ruc UNIQUE` | Duplicado de unicidad | La cédula canónica vive en `usuarios`; la del puente puede quedar como caché de registro o eliminarse — decidir en adopción |
| `usuarios_perfiles.nombre_completo` | `usuarios.nombre` | Duplicado | `usuarios` es fuente de verdad |
| `configuraciones_globales` | sin equivalente | Aditivo | Adoptable sin conflicto |
| RLS `auth.uid() = id` | FastAPI usa service key | Latente | Correcto como defensa-en-profundidad; sin efecto sobre el runtime API-first |

### 6.3 Requisito previo a ejecutarla

Solo existe en la base **destino Supabase** (usa `auth.users`, tabla que PostgreSQL local no tiene). Para desarrollo local hay dos rutas: (a) schema `auth` simulado con `auth.users(id UUID)` + `auth.uid()` stub — patrón que Supabase recomienda para entornos locales; (b) mantener la fase-1 exclusivamente en remoto y una variante local del puente. Decidir junto a D6 en adopción.

## 7. SUB-DECISIÓN ABIERTA — D3a: flujo de registro/login

**Aplazada deliberadamente** hasta diseñar la UX de registro/login. Opciones sobre la mesa (ninguna elegida):

| Opción | Cómo funciona | Pros | Contras |
|---|---|---|---|
| **Email real + cédula** | Registro pide email real (obligatorio en Supabase Auth salvo phone); cédula queda como dato de negocio en `usuarios` | Flujo estándar, recuperación de password gratis, sin hacks | Exige email a usuarios rurales que quizá no lo tienen |
| **Email sintético** | `cedula@<dominio>.melantia` generado internamente; el usuario nunca ve el email | Conserva UX "solo cédula + password" | Recuperación de cuenta requiere flujo admin propio; emails falsos rebotan en confirmaciones |
| **Teléfono/OTP** | Supabase Auth por SMS/WhatsApp | Encaja con usuarios sin email | Costo por SMS; latencia OTP en zonas sin señal (tensión con offline-first) |
| **Magic link** | Login sin password por email | Sin contraseñas que gestionar | Requiere email real y conectividad al entrar |
| **Admin API / provisión** | FastAPI crea el user en Supabase con `sb_secret` durante `/registro` | Control total del onboarding; permite cédula→user sin email cliente | Endpoint sensible; exige `sb_secret` server-side (ya previsto) |

**Criterios a evaluar cuando se diseñe el flujo** (documentar en su propio ADR):
1. ¿El usuario objetivo tiene email/teléfono usable? (perfil rural, zonas sin cobertura)
2. Recuperación de cuenta sin email — ¿quién la opera?
3. Verificación de identidad: ¿la cédula se valida contra algo (SRI/Registro Civil) o solo unicidad?
4. Offline-first: el login ya autenticado debe sobrevivir sin red (refresh largo) — ¿qué política de sesión?
5. Registro asistido: ¿un técnico registra agricultores in situ? (favorece Admin API)
6. Unicidad cédula↔identidad: un `auth.users` por persona — la dedup se hace por `cedula_ruc` en el puente.

## 8. SECUENCIA DE ADOPCIÓN (referencia — nada ejecutado)

```
hoy ──► rotación D1 (usuario, paneles)  [autorizada, pendiente]
     ──► adopción D6: usuarios_perfiles.usuario_id + reconciliación §6.2
     ──► D3a: ADR del flujo registro/login
     ──► wiring: get_current_user con doble emisor tras flag
     ──► coexistencia: local + Supabase Auth (transición)
     ──► retiro del auth local cuando el flujo nuevo cubra registro+recuperación
```

## 9. INVARIANTES DE VERIFICACIÓN (para la implementación futura)

1. `get_current_user` sigue devolviendo `str` que existe como `usuarios.id`.
2. Todo token Supabase sin puente `usuarios_perfiles` → `401` (no `404`, no crear usuario implícito salvo flujo de registro).
3. Los 236 tests deben pasar sin modificación — es la prueba de regresión del contrato.
4. Ningún endpoint consulta `auth.users` directamente; siempre vía puente.
5. `password_hash` en `usuarios` queda legacy una vez Supabase Auth cubra todos los logins (no se borra hasta cierre de transición).
6. Rol plataforma (`roles`/`usuarios_perfiles`) y rol contextual (EP) se aplican en capas distintas — nunca se mezclan en una misma verificación.

## 10. ESTADO DE BLOQUEADORES TRAS E0.3

| Bloqueador | Estado |
|---|---|
| BLOQ-KEY | Resuelto en diseño — rotación autorizada, pendiente de ejecución por el usuario |
| BLOQ-AUTH | **Desbloqueado** — Opción C aprobada con cadena puente definida |
| BLOQ-POSTGRES | Pendiente E0.4 (conectividad read-only real) |
| BLOQ-STORAGE / BLOQ-EVIDENCE | Dirección aprobada (D5); diseño pendiente en E0.5 |
| BLOQ-OFFLINE | Dependiente de D3a (política de sesión offline) |

## 11. INTEGRIDAD

```text
Archivos modificados: 0  ·  eliminados/movidos/renombrados: 0
Código/BD/schema/.env:   intocados
Migraciones ejecutadas:  0  ·  Credenciales: intocadas
git add/commit/push:     NO  ·  staged: 0
Único artefacto nuevo:   este documento (untracked)
```
