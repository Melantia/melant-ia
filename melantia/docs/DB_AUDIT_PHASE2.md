# MELANTIA — Auditoría de Base de Datos (Fase 2)

Fecha: 2026-09-27 · Objetivo: `melantia_db` (PostgreSQL 17.11, vacía, UTF8)
Estado: **AUDITORÍA — nada ejecutado contra la BD**

---

## 1. Estado actual

`melantia_db` está vacía. El repositorio contiene SQL en **dos raíces distintas**:

- `backend/database/` → esquema operativo del backend FastAPI local (psycopg).
- `supabase/migrations/` → 10 archivos; 9 son experimentos legacy de Supabase
  y 1 (`0001_fase1_core.sql`) es el DDL Fase 1 generado para Supabase Auth —
  **no ejecutable en PostgreSQL local** (referencia `auth.users`, `auth.uid()`).

La estructura objetivo (`functions/`, `indexes/`, `seeds/`, `evidencias.sql`,
`suscripciones.sql`) **no existe aún** — solo existe `schema/` + `migraciones/`.

## 2. Inventario de archivos SQL

### backend/database/

| Archivo | Líneas | Contenido |
|---|---|---|
| `migraciones/migracion_inicial.sql` | 306 | Plano maestro antiguo: geo + usuarios + fincas + evidencias + registros_campo + trigger de cuota |
| `schema/extensions.sql` | 5 | `uuid-ossp` + `postgis` |
| `schema/geografia.sql` | 31 | provincias, cantones, parroquias, ciiu |
| `schema/usuarios.sql` | 43 | usuarios (+ `storage_usado_mb`, `password_hash` aditivos) |
| `schema/gestion_fincas.sql` | 198 | fincas, lotes, hatos_ganaderos, practicas_regenerativas (**versión más nueva**: `updated_at`, CHECKs, NOT NULL) |
| `schema/trazabilidad.sql` | 426 | trazabilidad_plantillas, _fases, trazabilidades, _fases, _eventos, cadena_custodia (con `sync_status` + `hash_integridad` — offline-ready) |
| `schema/modulos/animales.sql` | 69 | animales |
| `schema/modulos/labores_pecuarias.sql` | 27 | eventos_animales |
| `schema/modulos/negocios_rurales_v2.sql` | 843 | M4 completo: perfiles_comerciales, publicaciones, comentarios, bolsa_ofertas, oportunidades, ferias, feria_participantes, feria_operaciones, transacciones + función comisión 3% + triggers updated_at + índices |

### supabase/migrations/ (legacy — no parte del backend local)

`20260910183000_mapeo_modulos.sql`, `agro_melant_ia.sql`,
`esquema_agro_interoperable_melanta.sql`, `esquema_fitosanitario_melantia.sql`,
`sql_panel_multiusuario*.sql` (×2), `supabase_trazabilidad_fotos.sql`,
`tablas_control_palmas*.sql` (×2) — posibles duplicados por nombre
(`*_melantia` vs sin sufijo). **No auditar a fondo ni ejecutar sin revisión;
candidatos a archivo/depuración posterior.**

### backend/init_db.py (NO SQL, pero relevante)

Bootstrap **SQLite** legacy (`melantia.db`): `usuarios_suscripciones`,
`registros_asistente`, `evidencias_fotograficas`, `tiendas_rurales`,
`productos_tienda`. Ninguna existe en el esquema PostgreSQL.

## 3. Inventario de tablas y dependencias

| Tabla | Definida en | Depende de | Usada por backend |
|---|---|---|---|
| provincias | geografia.sql, migracion_inicial | — | ✅ JOIN (fincas repo) |
| cantones | geografia.sql, migracion_inicial | provincias | ✅ |
| parroquias | geografia.sql, migracion_inicial | cantones | ✅ |
| ciiu | geografia.sql, migracion_inicial | — | ✅ FK desde fincas |
| usuarios | usuarios.sql, migracion_inicial | geo + ciiu | ✅ auth/login/registro/me |
| fincas | gestion_fincas.sql, migracion_inicial | usuarios, geo, ciiu | ✅ contexto M2, score |
| lotes | gestion_fincas.sql, migracion_inicial | fincas | ✅ contexto M2, score |
| hatos_ganaderos | gestion_fincas.sql, migracion_inicial | fincas | ✅ score worker |
| practicas_regenerativas | gestion_fincas.sql, migracion_inicial | fincas, usuarios | ⚠ definida, sin uso actual |
| animales | modulos/animales.sql | hatos_ganaderos | ⚠ sin uso aún |
| eventos_animales | modulos/labores_pecuarias.sql | animales, usuarios | ⚠ sin uso aún |
| trazabilidad_* (6) | trazabilidad.sql | usuarios, fincas, lotes, hatos | ⚠ sin uso aún |
| perfiles_comerciales | negocios_rurales_v2.sql **y** migracion_inicial | usuarios, geo | ⚠ sin uso |
| publicaciones, comentarios | negocios_rurales_v2.sql | usuarios, geo | ⚠ sin uso |
| bolsa_ofertas | negocios_rurales_v2.sql | usuarios, geo | ⚠ **usada pero con columnas incompatibles** |
| oportunidades, ferias, feria_participantes, feria_operaciones, transacciones | negocios_rurales_v2.sql | bolsa_ofertas, usuarios | ⚠ sin uso |
| evidencias_documentos | migracion_inicial §6 | usuarios | ✅ M11 controllers |
| registros_campo | migracion_inicial §9 | usuarios, lotes | ✅ main.py — **con columnas faltantes** |
| inventario_hardware_digital | migracion_inicial §4 | usuarios | ❌ definida, sin uso |
| mediciones_campo | migracion_inicial §4 | usuarios, lotes | ❌ definida, sin uso |
| diagnostico_rutas_modulos | migracion_inicial §7 | — | ❌ tabla de diagnóstico UI, sin uso |
| **usuarios_suscripciones** | ❌ **no existe en SQL** | (usuarios) | ✅ main.py (incentivo Melantios) |
| **perfil_economico_productor** | ❌ **no existe en SQL** | (usuarios) | ✅ main.py (score worker) |

## 4. Problemas encontrados

### P1 — Índice sobre tabla inexistente (migracion_inicial.sql:246)
`CREATE INDEX idx_bolsa_estado ON bolsa_ofertas(estado)` — `bolsa_ofertas`
solo existe en `negocios_rurales_v2.sql`. Ejecutar `migracion_inicial.sql`
solo **falla en la sección 8**.

### P2 — Tablas requeridas por código sin DDL
- `usuarios_suscripciones`: main.py la escribe (usuario_id, nombre,
  plan_actual, melantios_balance, ultima_sincronizacion) en el incentivo
  de Melantios. Solo existe en `init_db.py` (SQLite, INTEGER PK).
- `perfil_economico_productor`: upsert del worker de score
  (usuario_id UNIQUE, area_total_cultivos_m2, cabezas_ganado_total,
  score_productivo_melantia, fecha_ultimo_calculo). Sin DDL en ningún archivo.

### P3 — `registros_campo`: 5 columnas usadas por código pero no definidas
main.py (registro de evidencia + limpieza + dedup) usa:
`especie_afectada`, `diagnostico_usuario`, `clasificacion_ia`,
`es_activo_conocimiento` (BOOLEAN), `hash_transaccion` (dedup).
El DDL solo tiene tipo_registro/descripcion/foto_url → el endpoint
`/api/.../registro` devolverá 500 en runtime.

### P4 — `bolsa_ofertas`: controlador M4 escrito contra schema v1
`negocios_rurales/controllers.py` usa columnas que NO existen en v2:
`rubro_o_ruta` (v2: `producto_servicio`), `cantidad_volumen`
(v2: `cantidad`+`unidad`), `comision_app`/`valor_neto` (v2 los tiene
`transacciones`, no la bolsa), estados `'Abierta'`/`'Aceptada'` (v2 CHECK
exige minúsculas: abierta/en_negociacion/cerrada/cancelada/expirada).
**Decisión necesaria**: adaptar controlador a v2 (recomendado — v2 es la
versión diseñada) o crear v1. No ambas.

### P5 — Duplicaciones migracion_inicial vs schema/
`usuarios`, `fincas`, `lotes`, `hatos_ganaderos`, `practicas_regenerativas`,
`perfiles_comerciales`, geo, ciiu están definidos dos veces con diferencias:
- gestion_fincas.sql añade `updated_at`, NOT NULL en FKs, CHECKs,
  `ON DELETE SET NULL` en responsable → **versión canónica**.
- migracion_inicial `usuarios` carece de `password_hash` (auth JWT lo
  requiere → usuarios.sql es canónico).
- Ejecutar ambos "funciona" por `IF NOT EXISTS` pero el resultado depende
  del orden → fuente de deriva de esquema.

### P6 — `evidencias_documentos` mezcla evidencia + transacción comercial
Campos de custodia (fotos, hash, confirmaciones bilaterales) junto a
campos comerciales (monto_total, comision_app 3%, monto_liberado,
estado_pago). La comisión del 3% también existe en `transacciones` (M4).
Riesgo de doble fuente de verdad comercial. **Separación recomendada**:
evidencia documental vs transacción — no bloqueante para crear, sí para
diseño M11.

### P7 — `extensions.sql` exige PostGIS
`CREATE EXTENSION postgis` — PostGIS no forma parte de PostgreSQL vanilla:
si no está instalado en el servidor, el script falla y ninguna columna lo
usa aún (`coordenadas_gps` es TEXT). Recomendado: mover postgis a una
migración posterior o volverlo opcional.

### P8 — `diagnostico_rutas_modulos` + INSERT masivo de diagnóstico UI
Tabla de "diagnóstico de rutas de módulos" (mapeo frontend) dentro del
plano maestro de BD — metadato de frontend persistido en BD. Útil como
documento; cuestionable como tabla de producción. No bloquea.

### P9 — Cuota de almacenamiento
`verificar_limite_almacenamiento_melantia()` + trigger sobre
`registros_campo` depende de `usuarios.tipo_suscripcion` +
`storage_usado_mb` (ambos existen). Funciona — pero planes usados
('Basico'/'Standard'/'Empresarial'/default 50) difieren del default de
usuarios ('Standard' ✓) y de lo que suscripciones definirá. Alinear nombres
de plan al diseñar M1.

## 5. Riesgos

- **Deriva de esquema**: dos fuentes de verdad (migracion_inicial vs schema/)
  producirán BDs distintas según orden de ejecución.
- **Runtime 500s latentes**: P2, P3, P4 — endpoints existentes fallan en la
  primera llamada aunque la app arranque.
- **uuid-ossp**: válido en PG17 (pgcrypto/gen_random_uuid es nativo desde
  PG13 — uuid-ossp sigue disponible, sin problema técnico).
- **sync**: `sync_status`/`hash_integridad` ya presentes en trazabilidad —
  las tablas nuevas que faltan deberían seguir ese patrón (UUID PK +
  updated_at + sync_status) para offline-first.

## 6. Relación backend ↔ tablas (resumen)

| Componente backend | Tablas necesarias | Estado |
|---|---|---|
| auth (login/registro/me) | usuarios (+password_hash) | ✅ listo |
| M2 contexto | fincas, lotes, geo | ✅ listo |
| main.py score worker | lotes, hatos, fincas, **perfil_economico_productor**, usuarios_suscripciones, registros_campo | ❌ 2 tablas + 5 columnas faltan |
| M11 evidencias | evidencias_documentos | ✅ listo (ver P6) |
| M4 negocios controllers | bolsa_ofertas (v1 columnas) | ❌ incompatible con v2 |
| M3 gestión | fincas/lotes/hatos/animales/eventos_animales/trazabilidad_* | ✅ definido, sin endpoints aún |

## 7. Compatibilidad PostgreSQL 17

Todo el DDL usa sintaxis estándar compatible con PG17. Única dependencia
externa: extensión `postgis` (P7). `uuid-ossp` ✓, `plpgsql` ✓, `jsonb` ✓.

## 8. Conclusión

El núcleo necesario para el circuito auth (usuarios + geo) y M2-contexto
(fincas/lotes/hatos) es **consistente y ejecutable** desde `schema/`. Lo que
falla hoy en runtime es el legacy de `main.py` (score/melantios/registro)
por 2 tablas y 5 columnas faltantes, y M4 por divergencia v1↔v2.
Ver `DB_MIGRATION_PLAN.md` para el orden y los cambios mínimos.
