# 02 — AUDITORÍA DE AUTENTICACIÓN Y AUTORIZACIÓN MELANTIA

## 2.1 Identidad actual

| Aspecto | Evidencia | Archivo |
|---|---|---|
| Identificador de login | `cedula_ruc` (único) + contraseña | `modules/auth/controllers.py` `/login` |
| ID interno | `usuarios.id` UUID | schema `usuarios.sql` + `sub` claim |
| Password | bcrypt vía `passlib.CryptContext`; columna `password_hash` (NULL en históricos → deben registrar contraseña) | `core/security.py` |
| Registro | `/registro` = alta + login en una operación | `controllers.py:84` |
| Perfil | `/me` verifica JWT y lee `usuarios` | `controllers.py:134` |

**Identidad actual = tabla `usuarios` propia, login por cédula/RUC.** Supabase Auth no participa en nada del flujo real.

## 2.2 JWT actual

| Propiedad | Valor |
|---|---|
| Algoritmo | HS256 |
| Secreto | env `MELANTIA_JWT_SECRET_KEY`, **default hardcodeado** `melantia_secret_key_change_in_production_2026` |
| Expiración | 30 min (`ACCESS_TOKEN_EXPIRE_MINUTES`) |
| Claims emitidos | `sub` (UUID usuario), `cedula`, `nombre`, `exp` |
| Claims ausentes | `role`, `plan`, `iat`, `iss`, `aud`, `jti`, `scope` |
| Verificación | `jwt.decode(token, SECRET_KEY, [HS256])` → `sub` |
| Refresh token | **No existe** — no hay endpoint de refresh |
| Revocación | No existe |

Observaciones:
- No hay `role` ni claims de autorización en el token — la autorización se resuelve en backend contra la BD (correcto para el diseño EP).
- Sin `iss`/`aud` — el verificador acepta cualquier HS256 firmado con el secreto. Compatible con añadir validación de issuer futura.

## 2.3 Autorización actual

| Capa | Estado | Evidencia |
|---|---|---|
| `get_current_user` | **Real** — Bearer → verifica JWT → `sub` | `core/dependencies.py:101` |
| `require_role` | **Placeholder** — TODO, permite todo | `dependencies.py:174` |
| `require_subscription` | **Placeholder** — TODO | `dependencies.py:221` |
| `check_resource_limit` | **Placeholder** — TODO | `dependencies.py:276` |
| `verify_resource_ownership` | **Placeholder** — TODO | `dependencies.py:326` |
| `require_ep_access` (EP) | **Real** — resolver `services/autorizacion.py`: proyecto → participante → nivel (ninguno/consulta/crear/editar/administrar); 404 oculta recursos ajenos, 403 nivel insuficiente | `modules/ecosistema_profesional/dependencies.py` |

**La AuthZ real de MELANTIA vive en el EP** y es contextual (proyecto → participante → concesión → nivel). El resto del sistema depende solo de autenticación, sin roles efectivos.

## 2.4 Modelo EP vs modelo futuro

Objetivo: `Usuario → Supabase Auth identity → MELANTIA user → Role → Project participant → Concession → Resource → Access level`

| Eslabón | ¿Existe? | Acoplamiento |
|---|---|---|
| Supabase Auth identity | No | — |
| MELANTIA user | Sí (`usuarios`) | `id` UUID propio, sin `auth_user_id` externo |
| Role | Parcial (placeholder core; catálogo `perfiles_profesionales` EP) | JWT no lleva rol |
| Project participant | Sí (EP `ep_participantes` via `autorizacion.py`) | Resuelto en BD, no en token |
| Concession / access level | Sí (matriz EP en `autorizacion.py`) | — |

El modelo AuthZ EP **no está acoplado al JWT** — toma `usuario_id` del `sub` y resuelve todo en PostgreSQL. Cambiar el proveedor del `sub` (JWT propio → JWT Supabase) no toca la lógica de autorización: solo cambia quién firma el token y cómo se mapea `sub`.

## 2.5 Compatibilidad Supabase Auth ↔ FastAPI

| Punto | Evaluación |
|---|---|
| Firma JWT Supabase | HS256 con `JWT secret` del proyecto → FastAPI puede verificar con `jwt.decode(token, supabase_jwt_secret, audience='authenticated', issuer=...)` — misma librería `python-jose` ya presente |
| Claim `sub` | UUID de `auth.users` — formato compatible con `get_current_user` |
| Mapeo usuario | Requiere puente `auth.users.id → usuarios.id` (o FK como en `0001_fase1_core.sql` `usuarios_perfiles.id → auth.users.id`) |
| Login por cédula | Supabase Auth nativo es email/phone. Cédula+RUC requeriría mapear a email sintético o endpoint de registro backend que cree el usuario vía Admin API (`service_role`) |
| Offline-first | Token Supabase (1h típico) funciona offline una vez emitido; login/refresh requieren conectividad — igual que el sistema actual |
| Passwords existentes | bcrypt propio no migra a Supabase Auth → migración implicaría reset de contraseñas o doble esquema temporal |

## 2.6 Riesgos detectados en la implementación actual

| Riesgo | Detalle | Severidad |
|---|---|---|
| Secreto JWT por defecto | `melantia_secret_key_change_in_production_2026` hardcodeado como fallback | MEDIO (dev default; inaceptable si llega a producción) |
| Sin refresh/expiración corta | 30 min sin refresh → UX pobre o tokens de larga vida si se "ajusta" | MEDIO |
| AuthZ placeholders | `require_role`/suscripción/límites permiten todo — falsa sensación de protección si se usan | ALTO si se montan en rutas |
| `get_user_by_token` Supabase | stub que retorna `None` silenciosamente | BAJO (inerte) |
