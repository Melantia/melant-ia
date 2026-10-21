# 20 — PREPARACIÓN CONTROLADA DE CREDENCIALES SUPABASE (I0.1-pre)

**Estado: `COMPLETADO`**
Fecha: 2026-10-03 (bloqueado en primera pasada; desbloqueado tras aporte de credenciales por el usuario).
Único archivo funcional modificado: `.env` raíz. Backup previo fuera del repo. Ningún valor de clave impreso, copiado a otros archivos ni registrado.

---

## 1. Estado inicial

`.env` apuntaba íntegramente al **proyecto antiguo** `upfwgaacznljbzmbgcul` (`SUPABASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`=`sb_pub…` vieja, `SUPABASE_SERVICE_ROLE_KEY` legacy). `.env` ignorado por git — verificado.

## 2. Credenciales nuevas — recepción y validación de pertenencia (FASES 2–3)

Fuente: `nueva_supabase.env` (archivo aportado por el usuario) — contenía exactamente `SUPABASE_SECRET_KEY` y `VITE_SUPABASE_PUBLISHABLE_KEY`.

Validación por GETs de solo lectura contra `lizqreiyysrqgkzyddff` (sin imprimir valores):

| Prueba | Resultado |
|---|---|
| `GET /auth/v1/health` apikey=`sb_publishable_*` | **200** → pertenece al proyecto nuevo ✅ |
| `GET /auth/v1/health` apikey=`sb_secret_*` | **200** → pertenece al proyecto nuevo ✅ |
| `GET /auth/v1/admin/users` apikey+Bearer=`sb_secret_*` | **200** `{"users":[],"aud":"authenticated"}` → secret con privilegios admin ✅ y **`auth.users` vacío** |
| `GET /auth/v1/settings` apikey=`sb_publishable_*` | **200**: GoTrue **v2.197.0** (confirma `.temp`), provider `email:true`, `disable_signup:false`, `mailer_autoconfirm:false`, sociales off |

**Conclusión: ambas credenciales corresponden a `lizqreiyysrqgkzyddff`.** Ninguna es la vieja (la vieja fue rechazada en I0).

## 3. Backup

`E:\Desktop\melantia_env_backup_20261003_pre_i01` — copia del `.env` previo, **fuera del árbol git** (git root = `E:\Desktop\MELANTIA`). Nunca impreso ni referenciado con valores.

## 4. Cambios realizados en `.env` (FASE 4 — cambio mínimo)

| Variable | Acción |
|---|---|
| `SUPABASE_URL` | → `https://lizqreiyysrqgkzyddff.supabase.co` |
| `VITE_SUPABASE_URL` | → misma URL nueva |
| `SUPABASE_SECRET_KEY` | **NUEVA** — `sb_secret_*` nuevo (backend-only) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | **NUEVA** — `sb_publishable_*` nuevo (frontend-capable) |
| `SUPABASE_SERVICE_ROLE_KEY` | **VACIADA** + marca `# LEGACY-DEPRECATED` — service_role prohibido; `config.py` aún lee este nombre (migración de código pendiente, no en este bloque) |
| `VITE_SUPABASE_ANON_KEY` | **VACIADA** + marca `# LEGACY-DEPRECATED` — era la `sb_pub…` del proyecto viejo |
| `PAYPHONE_*`, `VITE_APP_*`, `PATH_VOSK_MODEL` | sin tocar |

**Nota de compatibilidad:** el código actual (`config.py`) lee los nombres legacy — que ahora están vacíos intencionalmente. El placeholder `SupabaseAuth` sigue sin funcionar (como antes, era código muerto) — **ningún comportamiento runtime cambió**. La lectura de los nombres nuevos requiere la migración de código ya diseñada (D4.2).

## 5. Variables que siguen legacy (documentadas)

| Variable | Estado |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | vacía, deprecated — código aún la referencia (pendiente migración a `SUPABASE_SECRET_KEY`) |
| `VITE_SUPABASE_ANON_KEY` | vacía, deprecated — ningún código la usa hoy (frontend no consume Supabase) |

## 6. Validación posterior (FASE 6)

- `SUPABASE_URL` → `lizqreiyysrqgkzyddff.supabase.co` ✅
- `SUPABASE_SECRET_KEY` + `VITE_SUPABASE_PUBLISHABLE_KEY` presentes ✅
- Ningún valor impreso en consola/documento ✅
- `.env` sigue ignorado por git ✅ · no rastreado ✅
- Ningún archivo modificado fuera de `.env` + este documento ✅
- Supabase: solo GETs de lectura — nada creado/modificado ✅

## 7. Riesgos pendientes

| Riesgo | Nota |
|---|---|
| **`nueva_supabase.env` sigue dentro del repo sin ignorar** (`??` en git status) — contiene los secretos | **acción del usuario:** borrarlo o moverlo fuera del repo una vez verificado — yo no lo toco sin autorización |
| Backup `.env` en `E:\Desktop\` | fuera de git; proteger/rotar cuando se retire el proyecto viejo |
| `sb_secret_*` en `.env` | correcto — backend-only; jamás en `VITE_*`/frontend/docs/logs |
| Claves viejas del proyecto antiguo | vaciadas de `.env`; existen también en `melantia_old_version/…/.env` (respaldo) — retiro a decisión del usuario |

## 8. Estado final

```text
.env → proyecto nuevo lizqreiyysrqgkzyddff ✔
sb_secret_*      → SUPABASE_SECRET_KEY          (backend)
sb_publishable_* → VITE_SUPABASE_PUBLISHABLE_KEY (frontend)
legacy service_role/anon → vaciadas
Supabase → intacto (solo lecturas)
```

## 9. Recomendación para I0.1 (siguiente bloque)

Con credenciales verificadas, I0.1 puede cerrar los UNVERIFIED de I0: settings completos · buckets existentes · claims de un token real (`session_id`) · password grant · refresh rotation/reuse · `generate_link` · logout scopes · comportamiento banned — requiere un **usuario de prueba descartable** (autorización expresa del usuario para crearlo y borrarlo).

---

## LIMPIEZA DE CREDENCIALES — I0.1

| Acción | Resultado |
|---|---|
| `nueva_supabase.env` eliminado | ✅ del árbol de trabajo (`melantia/nueva_supabase.env`) |
| Regla `.gitignore` agregada | ✅ `nueva_supabase.env` en `.gitignore` raíz (línea 39) — `git check-ignore -v` confirmado |
| `.env` preservado | ✅ contiene `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `VITE_SUPABASE_PUBLISHABLE_KEY` — sin modificaciones en esta limpieza |
| Backup preservado | ✅ `E:\Desktop\melantia_env_backup_20261003_pre_i01` intacto (fuera del repo) |
| Secretos impresos | **0** — ningún valor mostrado en ningún paso |
| Git verificado | ✅ `nueva_supabase.env` ya no aparece en `git status`; `.env` sigue ignorado |
| Copias de claves en repo | ✅ verificado: única ubicación con valores reales es `.env` (ignorado) |

---

**CHECKPOINT I0.1-pre:**
1. `.env` modificado: **SÍ** (autorizado — cambio mínimo documentado arriba)
2. Supabase modificado: **NO** (solo GETs)
3. Código modificado: **NO**
4. `service_role` utilizada: **NO** (vaciada, no usada)
5. Credenciales del proyecto antiguo utilizadas: **NO**
6. Credenciales nuevas = `lizqreiyysrqgkzyddff`: **SÍ** (verificado con 200s)
7. `sb_secret_*` exclusivamente backend: **SÍ** (`SUPABASE_SECRET_KEY`, sin `VITE_`)
8. `sb_secret_*` fuera del frontend: **SÍ**
9. `.env` fuera de git: **SÍ**
10. I0.1 listo: **SÍ** — pendiente solo autorización para usuario de prueba
