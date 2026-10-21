# 10 — PLAN DE EJECUCIÓN E0 (propuesta — nada autorizado aún)

Orden propuesto para cerrar E0. Cada paso requiere autorización explícita antes de ejecutarse.

## Paso E0.2 — Seguridad de credenciales (desbloquea BLOQ-KEY)

> Corrección aplicada (revisión `11_REVISION_E0_2.md`): la clasificación se separa —
> 🔴 `sb_secret_*` = secreto · 🔴 `PAYPHONE_SECRET_KEY` = secreto ·
> 🟢 `sb_publishable_*` = NO secreto (clave de cliente; revisar uso/RLS y nomenclatura).

1. Usuario verifica en dashboard Supabase si el proyecto `upfwgaacznljbzmbgcul` está activo.
2. Si está activo: rotar **`sb_secret_*`** (roll secret) — es el único bypass de RLS.
3. Rotar **`PAYPHONE_SECRET_KEY`** en panel del comercio.
4. Publishable: revisar RLS del bucket `melantia-trazabilidad` y tabla `evidencia_fotos_nube`; regenerarla solo si el acceso anónimo actual permite operaciones no deseadas. Migrar nomenclatura de config a `SUPABASE_PUBLISHABLE_KEY`.
5. `melant_ia.zip`: **verificado limpio** — sin `.env` dentro (ver `11_REVISION_E0_2.md` §C).
6. Resultado esperado: `sb_secret_*` vieja invalidada; publishable tratada como clave de cliente con RLS endurecido.

*Devin no ejecuta esto — son operaciones en paneles de terceros.*

## Paso E0.3 — Decisión de arquitectura auth (desbloquea BLOQ-AUTH) ✅ RESUELTO

D1–D6 decididas por el usuario y documentadas como ADR en `12_ADR_IDENTIDAD_USUARIOS.md`:

- Opción C aprobada; cadena `auth.users → usuarios_perfiles → usuarios` definida.
- Compatibilidad verificada: `get_current_user → str(usuarios.id)` es el único punto de traducción; EP-4E y los 236 tests son signer-agnósticos.
- Brecha de `0001_fase1_core.sql` identificada: falta `usuarios_perfiles.usuario_id` (ver §6 del ADR).
- **Sub-decisión abierta D3a**: mecanismo concreto de registro/login (email real vs sintético vs OTP vs Admin API) — se decide con el diseño del flujo, no artificialmente.

## Paso E0.4 — Validación de conectividad Supabase PG (desbloquea BLOQ-POSTGRES)

1. Con credencial segura aportada por el usuario: prueba de conexión de **solo lectura** (pooler y directa, con `sslmode=require`).
2. Verificar extensiones disponibles (uuid-ossp, postgis).
3. Confirmar que el schema canónico aplica sin errores en una base de prueba.
4. **Sin ejecutar migraciones de datos ni DDL en el proyecto real.**

## Paso E0.5 — Diseño del modelo de evidencias (desbloquea BLOQ-STORAGE + BLOQ-EVIDENCE)

1. Decidir: ampliar `evidencias_documentos` vs tabla `archivos_evidencia` separada (metadata archivo + hash + storage_path) vs herencia de `evidencia_fotos_nube`.
2. Decidir mecanismo de subida: server-side (FastAPI + secret key) — recomendado por API-first — vs signed URLs.
3. Diseñar cola offline de uploads siguiendo el patrón histórico `gestor_evidencia_fotos`.
4. Documentar RLS objetivo del bucket (privado, por usuario/finca) si Opción C.

## Paso E0.6 — Contrato de configuración final

1. Formalizar variables (ver `04 §4.5`): `sslmode`, `SUPABASE_JWT_ISSUER`, `SUPABASE_STORAGE_BUCKET`, renombrar a publishable/secret.
2. Actualizar `config.py` — **solo cuando el diseño anterior esté aprobado**.
3. Eliminar el fallback de `MELANTIA_JWT_SECRET_KEY` (fail-fast sin secreto).

## Paso E0.7 — Disposición de `melantia/supabase/` (untracked)

1. Revisar con el autor: ¿borrador adoptable o descarte?
2. Si adoptable: reconciliar `0001_fase1_core` con el canónico y versionarlo formalmente; mover SQL legacy a `docs/historico/` o descartar por duplicado.
3. Mientras tanto: **no commitear tal cual** (mezcla RBAC nuevo + legacy SQLite).

## Paso E0.8 — Cierre de E0

1. Informe de cierre: estado de bloqueadores, decisiones registradas, matriz actualizada.
2. Entrada a E1 (consolidaciones de conocimiento restantes) — independiente de Supabase.

## Checklist de salida de E0

- [ ] `sb_secret_*` rotada (autorizada D1a — ejecución por el usuario) o proyecto confirmado inactivo
- [x] Decisión auth documentada (D1–D6) → `12_ADR_IDENTIDAD_USUARIOS.md`
- [ ] D3a: ADR del flujo de registro/login (pendiente de diseño UX)
- [ ] Conectividad PG verificada (solo lectura)
- [ ] Modelo de evidencias diseñado
- [ ] Mecanismo de upload decidido
- [ ] Contrato env formalizado
- [ ] `melantia/supabase/` disposicionado
- [ ] RLS objetivo documentado
