# 16 — D4.1: REVISIÓN CRÍTICA DEL DISEÑO DE IDENTIDAD/ AUTH

**Objeto revisado:** `15_DISENO_TECNICO_IDENTIDAD_AUTH.md` (D4) contra ADR `14` (F3–F9) y código real del repo.
**Modo:** solo lectura. Nada modificado, nada implementado.
**Propósito:** cazar errores de diseño **antes** de invertir en implementación. Revisión adversaria — se asume que el diseño falla hasta demostrar lo contrario.

---

## 0. Veredicto general

El diseño es **estructuralmente correcto** (la cadena `auth.users → puente → usuarios`, el contrato `get_current_user`, la separación autenticación/autorización y el no-uso de `sb_secret_*` como Bearer están bien planteados). **Sin embargo contiene 3 errores de diseño reales que deben corregirse en D4 antes de implementar**, 6 gaps que requieren especificación adicional, y 6 aclaraciones menores. Ninguno invalida la arquitectura; todos son corregibles en papel.

---

## 1. ERRORES DE DISEÑO (corregir el documento antes de implementar)

### E1-1. Recuperación "Caso A" usa el endpoint equivocado — **rompe F8**

**D4 §13 dice:** "usuario con email real → flujo estándar Supabase `/auth/v1/recover`".

**El error:** `/auth/v1/recover` envía el correo a `auth.users.email` — que por diseño F4 **es el email sintético**, un buzón que no existe. Si el usuario asocia email real, o bien `auth.users.email` se actualiza al real — **lo que rompe el login** (el password-grant por cédula deriva el sintético; al cambiar `auth.users.email`, `signInWithPassword(email_sintetico)` devuelve `invalid_grant` para siempre) — o bien se mantiene el sintético y el recovery estándar no llega a nadie. En ambas ramas, algo se rompe.

**Corrección propuesta para D4:**
- `auth.users.email` = **sintético e INMUTABLE para siempre** (independencia garantizada — refuerza el requisito F4 §3.2.1-6).
- Email real del usuario vive en `usuarios.contacto` / `user_metadata.contacto_email` — **nunca en `auth.users.email`**.
- Recuperación con canal verificable: FastAPI llama `POST /auth/v1/admin/generate_link` (type=`recovery`, con `sb_secret_*`) → GoTrue devuelve `action_link` en la respuesta sin enviarlo → **FastAPI entrega el link por el canal registrado** (email real/WhatsApp/presencial). El usuario consume el link → reset estándar.
- Resultado: caso A y caso B comparten la misma mecánica server-side; difieren solo en el canal de entrega y en el número de factores.

### E1-2. Contradicción interna en la saga de registro — **retry imposible**

**D4 §7.2 paso 2:** "existe cedula_ruc en `usuarios` → 409".
**D4 §7.3:** "fallo en paso 5 → dejar `usuarios`, el reintento lo reutiliza".

**El error:** si `usuarios` existe pero el puente no (estado parcial tras fallo en paso 4/5), el paso 2 del siguiente intento devuelve 409 — el "reintento que reutiliza" nunca ocurre porque el dedup lo rechaza antes. Además `usuarios` con `cedula_ruc` puede existir por **histórico legítimo** (perfiles creados antes de la adopción), no por saga fallida — y ese caso pide *activación/reclamo*, no 409 seco.

**Corrección propuesta para D4:** el dedup debe discriminar **tres estados**, no dos:

```text
cedula en puente          → cuenta completa        → 409 (o login)
cedula en usuarios,
  no en puente            → RECLAMO/ACTIVACIÓN: crear auth.users + puente
                            sobre el usuarios existente (no crear perfil nuevo)
cedula en ninguno         → registro completo (flujo §7.2)
```

El reclamo de usuarios históricos (`password_hash NULL`) es el **mismo flujo** que la recuperación asistida (verificación multifactor, §13) — documentarlo explícitamente. Esto además resuelve cómo migran los perfiles preexistentes sin alta nueva.

### E1-3. Normalización cédula↔RUC no especificada — **doble identidad por persona**

**El error:** en Ecuador, el RUC de persona natural = `cédula(10 dígitos) + "001"` (13 dígitos). El mismo humano puede registrarse con cédula y luego intentar login con RUC → derivación produce **dos emails sintéticos distintos** → o login falla, o peor: se crea una segunda cuenta para la misma persona, con `usuarios.cedula_ruc` distinto que evade el UNIQUE.

**Corrección propuesta para D4 — especificar la forma canónica antes de derivar:**
1. Definir regla: RUC persona-natural (`^\d{10}001$`) se **colapsa** a la cédula de 10 dígitos → una sola identidad por persona.
2. RUC de sociedad/otros formatos: política explícita (¿personas jurídicas pueden tener cuenta? — sub-decisión de negocio pendiente).
3. **Validación módulo-10** del dígito verificador de cédula/RUC ecuatoriano **antes** de derivar el sintético: una cédula con typo genera un sintético válido e inalcanzable para el verdadero titular (nadie podrá jamás reproducir el typo → identidad huérfana). La validación del dígito elimina esa clase de cuentas fantasma.
4. Documentar en `user_metadata` la `cedula_ruc` **canónica**, no la ingresada.

## 2. GAPS DE DISEÑO (especificar antes de implementar)

### G1. Ciclo de vida del vínculo en ambas direcciones

- **`usuarios` borrado → puente cascada → `auth.users` queda huérfano** (FK física solo existe en Supabase y solo hacia afuera: la cadena de borrado local no toca GoTrue). Resultado: cuenta Auth que puede autenticarse en GoTrue pero siempre 401 en API → **job/endpoint de desvinculación** (Admin API `DELETE /admin/users/{id}`) o aceptar el huérfano como estado "credencial sin negocio".
- **`auth.users` borrado/baneado desde el dashboard → puente apunta a fantasma**: tokens ya emitidos siguen verificando por JWKS hasta `exp` (~1 h) — el check `puente.estado` sigue activo. Aceptable pero hay que documentarlo: la revocación efectiva = `estado` del puente + expiración natural, o `admin/logout` explícito.
- Diseñar el procedimiento admin de **desvinculación/revinculación** (cambio de cédula, cuenta duplicada, fallecimiento): hoy el diseño no contempla `DELETE/UPDATE` del puente.

### G2. Verificación previa: ¿el proyecto nuevo tiene JWKS publicado?

El JWKS endpoint `/auth/v1/.well-known/jwks.json` **solo existe si el proyecto tiene signing keys asimétricas activas**. Proyectos nuevos (lizqreiyysrqgkzyddff, creado 2026) deberían traerlas, pero **es un prerequisito verificable** en la Fase B del plan (I0): si el proyecto solo tiene la clave legacy HS256, hay que activar signing keys en el dashboard (acción del usuario) o F5 queda incumplible sin compartir el secreto — **verificar antes de implementar, no durante**.

### G3. Latencia de revocación del caché del puente

El caché `auth.users.id → usuarios.id` (TTL 30–60 s propuesto) significa que suspender una cuenta tarda hasta el TTL en propagarse. Para operaciones sensibles (pagos, concesiones EP-4E `administrar`), el validador debe **bypass del caché** (lookup directo de `estado`) o el caché debe llevar marca de estado. Especificar.

### G4. Matizar "JWKS down → 503"

La verificación de firma con JWKS cacheado es **offline**: GoTrue caído no impide validar tokens mientras la clave esté en caché. El `503` solo aplica con caché vacío/stale y `kid` no resoluble. Esto es una *fortaleza* de F5 (el API no depende de GoTrue por request) — documentarla como tal, no como fallo.

### G5. Respuesta de login vs. schema actual

`TokenResponse` actual (`schemas.py:13-17`) no tiene `refresh_token`/`expires_in`. El nuevo login los necesita → el schema se extiende (aditivo: campos nuevos no rompen clientes). También decidir transporte del refresh: body JSON + storage local vs. cookie `HttpOnly` (web) — depende de F7a; anotar como entrelazado con el diseño de sesión.

### G6. Rate limiting no existe hoy

`/login`, `/registro`, recuperación asistida requieren limitación — **el backend no tiene middleware de rate-limit instalado ni en requirements**. Añadir a dependencias de implementación (slowapi/middleware propio/edge), no es código libre.

## 3. ACLARACIONES MENORES

| # | Punto | Ajuste |
|---|---|---|
| A1 | `iss` hardcodeado al project-ref en §9 | Derivarlo de `SUPABASE_URL`/`SUPABASE_ISSUER` por configuración — nunca literal en código |
| A2 | `aud` check | Supabase emite `aud:"authenticated"` y claim `role:"authenticated"` — validar ambos es redundante pero gratis |
| A3 | Password policy | GoTrue default min 6; `RegistroRequest` ya exige `min_length=6` — alinear con la política real del proyecto y subirla si se configura más fuerte |
| A4 | "236 tests" | Cifra heredada de ADR 12; no re-contada en esta revisión — verificar con `pytest --collect-only` antes de usarse como criterio de regresión |
| A5 | Ban en dashboard | `signIn` rechaza usuarios baneados; tokens vivos mueren a `exp` — documentar como "revocación con latencia ≤ exp" |
| A6 | Email sintético visible en `user_metadata`/dashboard | Es hash → no es PII sensible; confirmar que `user_metadata.cedula_ruc` sí es PII manejable (consentimiento cubierto por `acepto_politicas`) |

## 4. Fortalezas verificadas (lo que NO falla)

| Decisión | Por qué aguanta la revisión |
|---|---|
| `get_current_user → str(usuarios.id)` | Los tests usan `dependency_overrides` (verificado `test_ep_proyectos_api.py:140-141`); el contrato es realmente signer-agnóstico |
| Puente aditivo | `cedula_ruc UNIQUE` existe en `usuarios` (schema:11) — dedup parcial ya anclado; migración M1 no toca nada existente |
| `sb_secret_*` solo backend | Ningún flujo lo saca del servidor: registro, signIn-proxy y generate_link son todos server→server |
| Doble emisor por `iss` | Tokens locales no tienen `iss` → discriminación determinista, no heurística |
| Anti-oráculo en login | Mismo 401 para cédula inexistente, password erróneo y cuenta sin puente — no filtra existencia |
| Email HMAC vs UUID5 | Correcto: el espacio cédula (~10¹³) es fuerza-bruteable; hash sin clave (UUID5) sería enumerable — el pepper es necesario |
| Rechazo de JWT largo para offline | Ratificado por el usuario: el modelo "cola + revalidación al reconectar" es el correcto |

## 5. Impacto de las correcciones sobre el resto del diseño

| Correción | Secciones de D4 que requieren reescritura |
|---|---|
| E1-1 (recovery server-side) | §13 Caso A (reescribir), §8.1 (aclarar que publishable server-side no aplica a recovery), §16 (M4 añade `action_link` flow) |
| E1-2 (tres estados de dedup) | §7.2 paso 2, §7.3 tabla de estados parciales, §3.2 (nuevo: flujo de reclamo) |
| E1-3 (normalización cédula/RUC) | §6 entrada+normalización, §7.2 paso 1 (validación módulo-10), §5.1 nota de caché canónica |
| G1–G6 | §5.1 (tabla del puente sin cambios de columnas — solo procedimientos admin), §9 (notas JWKS), §15 (añadir rate-limit + cookie/body refresh) |

**Ninguna corrección toca:** el contrato `get_current_user`, EP-4E, el modelo de doble eje de roles, ni la tabla `usuarios`.

## 6. Recomendación de cierre D4.1

1. **Corregir D4** aplicando E1-1/E1-2/E1-3 + G1–G6 (una nueva iteración del documento 15 o una errata `15a` — decisión del usuario).
2. **Añadir al plan de implementación (I0)** la verificación previa de signing keys/JWKS del proyecto `lizqreiyysrqgkzyddff`.
3. **Añadir sub-decisión de negocio pendiente**: ¿personas jurídicas/RUC sociedad pueden tener cuenta MELANTIA? (impacta la normalización E1-3).
4. Solo entonces pasar a implementación controlada (I1).

## 7. Integridad D4.1

```text
Archivos modificados: 0 (revisión documentada; correcciones propuestas, no aplicadas)
Código/.env/Supabase/PostgreSQL/migraciones/tests: intactos
git add/commit/push: NO
Único artefacto nuevo: este documento
```
