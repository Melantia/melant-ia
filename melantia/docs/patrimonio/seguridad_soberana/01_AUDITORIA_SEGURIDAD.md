# MELANTIA — Auditoría de Seguridad de la Arquitectura Actual

> Documento de auditoría. Estado: real, verificado en código.
> Principio rector del diseño objetivo: **"ROBAR EL CÓDIGO NO DEBE EQUIVALER A ROBAR MELANTIA."**
> No se promete seguridad absoluta; el objetivo es defensa en profundidad verificable.

**Fecha de auditoría:** post-F7a Fase ③ (suite 352/352 verde)
**Alcance auditado:** backend, frontend, base de datos, infraestructura local/Git.

---

## 1. Controles existentes (lo que ya está bien)

| Control | Estado | Referencia |
|---|---|---|
| JWT Supabase ES256 verificado por JWKS (issuer/audience/exp firmados criptográficamente) | Implementado | `backend/core/supabase_jwt.py` |
| Separación Auth (Supabase) vs autorización (MELANTIA/EP-4E) | Implementado | `backend/modules/auth/` |
| Bridge `usuarios_auth_puente` — Auth UUID ≠ identidad de negocio | Implementado | `backend/shared/repositories/auth_puente.py` |
| Sesión MELANTIA de 30 días con `auth_session_id`, `familia_id`, estado, rotaciones | Implementado | `sesiones`, `sesion_service.py` |
| Detección local de colisión de refresh (<5 s → `sospechosa`) | Implementado | `sesion_service.py` |
| Refresh token nunca persistido en texto plano (`refresh_token_enc` NULL) | Implementado | F7a.③ |
| `PEPPER_IDENTIDAD` solo en memoria, nunca persistido ni logueado | Implementado | `identidad.py` |
| Email sintético nunca expuesto al frontend | Implementado | `auth_service.py` |
| Queries parametrizadas (psycopg 3) — sin concatenación SQL en repos auditados | Implementado | `shared/repositories/` |
| `audit_eventos` con huella HMAC (sin tokens/cédula/email en detalle) | Implementado | `shared/repositories/audit.py` |
| `.env` y `.env.*` ignorados por Git | Verificado | `.gitignore` raíz |
| `SUPABASE_SERVICE_ROLE_KEY` no usado en flujos F7a | Verificado | `supabase_client.py` usa `sb_secret_*` |

---

## 2. Hallazgos de seguridad

### F-01 · CRÍTICO — Secreto JWT con default hardcodeado en código

**Ubicación:** `backend/core/security.py:33`

```python
SECRET_KEY = os.getenv("MELANTIA_JWT_SECRET_KEY", "melantia_secret_key_change_in_production_2026")
```

Si `MELANTIA_JWT_SECRET_KEY` no está definida en el entorno, **cualquier persona con acceso al repositorio puede forjar tokens HS256 válidos** que el flujo legacy (`dependencies.py`, flag local) aceptaría. El código fuente publica la llave de firma.

**Violación:** "robar el código = robar identidad". Exactamente lo que el principio rector prohíbe.

### F-02 · ALTO — Placeholders de autorización no-op

**Ubicación:** `backend/core/dependencies.py`

`require_role`, `require_subscription`, `check_resource_limit`, `verify_resource_ownership` son stubs que devuelven el usuario sin verificación real. Cualquier consumidor de estas dependencias obtiene **autorización vacía** — la protección por rol/entitlement es ilusoria hasta que se implementen.

### F-03 · ALTO — Password de PostgreSQL con default en código

**Ubicación:** `backend/core/config.py:58`

`db_password` tiene default `"melantia_offline_2026"` embebido. Si el entorno no lo sobreescribe, el backend usa una credencial publicada en el repo.

### F-04 · ALTO — Token de acceso en `localStorage`

**Ubicación:** `frontend/src/shared/auth/auth.storage.js`

`saveSession` persiste `{token, usuario}` en `localStorage` bajo `melantia.auth`. Un XSS (inyección en dependencia, componente, o extensión maliciosa) roba el access token de forma silenciosa. `localStorage` sobrevive cierre de sesión del navegador y es legible por cualquier script del origen.

### F-05 · ALTO — Caché offline sin cifrar, sin clasificación, TTL 7 días

**Ubicación:** `frontend/src/shared/offline/cache.js`

Respuestas de API se serializan en `localStorage` (`melantia.cache.*`) con TTL de **7 días**, sin cifrado ni distinción de sensibilidad. Datos de fincas, levantamientos, mediciones y evidencias pueden quedar legibles en el dispositivo una semana.

**Tensión con F7a (no contradicción directa):** la ventana de *autorización* offline es 72 h; el TTL de *datos* es 7 días. Son conceptos distintos (el caché no extiende autorización), pero el diseño de seguridad debe armonizarlos: datos SENSITIVE/CRITICAL no deberían persistir 7 días en claro aunque la autorización sí dure 72 h.

### F-06 · MEDIO — Credenciales legacy presentes en entorno y proceso

- `SUPABASE_SERVICE_ROLE_KEY` y `VITE_SUPABASE_ANON_KEY` siguen en `.env` aunque están prohibidas para uso nuevo.
- `backend/core/security.py:173-197` — clase `SupabaseAuth` carga `service_role_key` en memoria (métodos son stubs, pero la credencial real vive en el proceso y en el fichero).
- Riesgo: un solo `print`/`str(settings)` accidental, o código futuro que reutilice la clase, expone una clave con privilegio total sobre Supabase.

### F-07 · MEDIO — Log de errores de BD sin redacción

**Ubicación:** `backend/database.py`

`print(f"[DB ERROR] Fallo en transacción de MELANTIA: {error}")` vuelca la excepción psycopg completa a stdout. Excepciones de PG pueden contener fragmentos de query, constraint names, y valores de columna → fuga de datos a logs sin control de acceso ni retención.

### F-08 · MEDIO — Sin rate limiting en endpoints de autenticación

`POST /auth/login`, `/registro`, `/refresh` no tienen protección contra fuerza bruta/credential stuffing. D4.2 la dejó como dependencia pendiente (no implementada por diseño, no por olvido) — pero sigue siendo superficie expuesta.

### F-09 · MEDIO — Backup de BD sin cifrar en filesystem local

`db_cluster-29-09-2026@17-17-59.backup.gz` existe en el directorio de trabajo (visible en `git status` previo). Un `pg_dump` comprimido **sin cifrar** contiene toda la base en legible: usuarios, fincas, evidencias, coordenadas, trazabilidad. Quien copie ese fichero obtiene todo MELANTIA.

### F-10 · MEDIO — Ausencia de pipeline CI/CD y protección de release

- No existe `.github/` ni definición de CI en el repo.
- `git remote origin → github.com/Melantia/melant-ia` existe, pero no hay evidencia local de branch protection, required reviews, firma de commits, ni control de releases.
- Hoy, "modificar el código + push" podría convertirse en versión "oficial" sin fricción.

### F-11 · BAJO — `sanitize_input` ingenuo

`security.py:240-263` elimina caracteres "peligrosos" por blacklist. Mitigado en la práctica porque los repos usan queries parametrizadas, pero la función da una falsa sensación de sanitización robusta.

### F-12 · BAJO — Convivencia de raíz Git con código legacy

`git rev-parse --show-toplevel` → `E:/Desktop/MELANTIA` (padre), no `melantia/`. El repo mezcla `melant_ia` (legacy) y `melantia` (actual). Un push sube ambos árboles; una fuga de secretos en el árbol legacy entraría al historial compartido.

### F-13 · INFO — Secretos en `.env` sin cifrado a nivel filesystem

`.env` contiene `SUPABASE_SECRET_KEY`, `PEPPER_IDENTIDAD`, `MELANTIA_SESSION_VAULT_KEY`, `PAYPHONE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Está fuera de Git (bien), pero es texto plano en el disco del host de desarrollo. Robo del equipo = robo de todos los secretos de una vez.

---

## 3. Superficies de ataque identificadas

| # | Superficie | Vector | Impacto actual |
|---|---|---|---|
| S1 | Código fuente (repo Git) | Lectura → claves hardcodeadas (F-01, F-03), lógica completa | Forja de tokens HS256; conocimiento total del sistema |
| S2 | `.env` en disco | Robo del equipo/backup del host | Todas las claves de una vez |
| S3 | Backend en ejecución | Compromiso del proceso → variables de entorno en memoria | `sb_secret_*`, `PEPPER`, `VAULT_KEY`, `db_password`, `service_role` |
| S4 | PostgreSQL | Robo de volumen/backup sin cifrar | Todas las tablas legibles |
| S5 | Storage local (`backend/storage`) | Lectura del filesystem | Documentos/evidencias legibles |
| S6 | Navegador/PWA | XSS → `localStorage` | Access token + caché offline |
| S7 | Dispositivo móvil (futuro) | Extracción de almacenamiento local | Token + datos offline |
| S8 | Cadena de build | Modificación de código → release | Versión "oficial" maliciosa |
| S9 | Cuenta administrativa única | Phishing/credencial robada | Control total (sin separación) |
| S10 | Proveedor cloud (Supabase) | Compromiso de la cuenta/proyecto | Auth + (si se usara) storage |
| S11 | Dependencias (npm/pip) | Supply chain (paquete malicioso) | Ejecución en cliente y backend |
| S12 | Refresh token en tránsito | MITM/日志 | Rotación ya mitiga en parte (ES256 + detección local) |

---

## 4. Resumen de severidad

| Severidad | Hallazgos |
|---|---|
| CRÍTICO | F-01 |
| ALTO | F-02, F-03, F-04, F-05 |
| MEDIO | F-06, F-07, F-08, F-09, F-10 |
| BAJO | F-11, F-12, F-13 |

**Conclusión de auditoría:** la separación Auth/Autorización y la sesión MELANTIA son sólidas (F7a bien implementada). El déficit actual está concentrado en: **(a)** secretos embebidos en código (violación directa del principio rector), **(b)** autorización por rol/entitlement aún placeholder, **(c)** datos y tokens en cliente sin protección, **(d)** ausencia total de pipeline de integridad de software, **(e)** backups en claro. El diseño adjunto (`02_DISENO_ARQUITECTURA_SEGURIDAD.md`) ataca cada punto.
