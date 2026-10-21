# 08 — MATRIZ DE MIGRACIÓN SUPABASE

| Componente | Histórico | Actual | Destino | Acción | Prioridad | Dependencias |
|---|---|---|---|---|---|---|
| `supabase_config.js` (publishable, 5+ copias) | Config cliente con clave embebida | Committed en HEAD melant_ia (eliminado en WT) | Config por entorno (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`) sin claves en código | ADAPTAR | P1 | Rotación publishable (S3) |
| Auth | `auth_suscripciones_unificado.py` (2 versiones de planes) + JWT propio histórico | JWT propio HS256 real (`/login` `/registro` `/me`), bcrypt, cédula | Opción C destino (recomendada) / A transitoria | REVISAR→ADAPTAR | P0 (decisión) | D1–D4, `usuarios_perfiles` puente |
| JWT | — | HS256 30min, claims `sub/cedula/nombre/exp`, sin refresh/iss/aud | Validador dual propio+Supabase durante transición | ADAPTAR | P1 | Decisión auth |
| `SupabaseAuth` (clase) | — | Placeholder inerte en `security.py` | Implementar verify por iss/aud si Opción C | ADAPTAR | P2 | D1 |
| PostgreSQL | Schemas SQLite + `melantia_supabase_schema.sql` (postgis) | `backend/database/schema/` canónico PG, psycopg3 pools | Mismo schema en Supabase PG (producción) | MIGRAR | P1 | sslmode, pooler |
| `melantia/supabase/migrations/` | Copia de SQL histórico + `0001_fase1_core.sql` (RBAC auth.users) | UNTRACKED, no integrado | Reconciliar con schema canónico (dos modelos de usuario conviviendo) | REVISAR | P1 | Decisión auth |
| Storage | Pipelines completos cliente-directo (evidencia_fotos, modulo11, servicios_financieros) | `storage_dir` local en config; **sin integración** | FastAPI sube con secret key / signed URLs; bucket privado | MIGRAR lógica, ADAPTAR mecanismo | P1 | BLOQ-STORAGE, decisión auth |
| `evidencias_documentos` (actual) | — | Custodia/escrow (3%, doble confirmación) | Mantener + absorber metadata de archivo o tabla hermana | REVISAR | P1 | Diseño schema evidencias |
| `evidencia_fotos_nube` (histórico) | Tabla + RLS permisivo | No existe en schema actual | Campos absorbidos o tabla dedicada | CONSOLIDAR | P1 | BLOQ-EVIDENCE |
| Offline upload | Cola localStorage → sync → purge (funcional) | No existe | Cola en cliente + endpoint API de registro | MIGRAR | P1 | Estrategia offline (BLOQ-07 B3) |
| REST/Data API | Uso masivo cliente-directo (fincas, tiendas, créditos, UGM) | Ninguno | Prohibido como patrón; todo por FastAPI | DOCUMENTAR (regla) | P0 | — |
| Edge Functions | Ninguno | Ninguno | Ninguno por defecto | MANTENER | P4 | — |
| Realtime | Ninguno (websocket propio histórico) | Ninguno | Solo si caso concreto | MANTENER HISTÓRICO | P3 | — |
| Secretos | `sb_secret_*` + PayPhone en 2 `.env` locales; publishable en git | `.env` gitignored | Rotación (tarea separada) + gestor de secretos | REVISAR | **P0** | Autorización usuario |
| PayPhone | `payphone_payment.py` real (link de pago con secret) | Copia untracked en `melantia/core_python/` | Servicio backend propio con secret server-side | ADAPTAR | P2 | Proveedor pagos (BLOQ-10 B3) |
| `business/` staging | — | Copias untracked de lógica histórica (pasarela, mercado, ingesta, QR…) | Revisión elemento a elemento (ya cubierto backlog B3) | REVISAR | P2 | Backlog B3 |
| `init_db.js` (supabase/) | SQLite legacy | Untracked | Ninguno (histórico) | MANTENER HISTÓRICO | P4 | — |
