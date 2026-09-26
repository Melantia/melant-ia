# Esquema base MELANT IA (PostgreSQL)

Orden de ejecución obligatorio:

1. `extensions.sql` — extensiones (`pgcrypto`, `pg_trgm`, `unaccent`, `postgis`) y la función `set_actualizado_en()`.
2. `geografia.sql` — provincias, cantones, parroquias (códigos INEC) y catálogo CIIU.
3. `usuarios.sql` — roles, usuarios, sesiones (refresh tokens) y auditoría.
4. `gestion_fincas.sql` — fincas, lotes, cultivos, actividades y evidencias.

Aplicar sobre una base vacía:

```bash
for f in extensions geografia usuarios gestion_fincas; do
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "backend/database/schema/$f.sql"
done
```

Todos los scripts son idempotentes (`IF NOT EXISTS` / `ON CONFLICT DO NOTHING`), por lo que pueden re-ejecutarse sin destruir datos.

## Scripts heredados

Los `.sql` que viven en `melant_ia/src/database/` y `melant_ia/src/modules/` son SQLite (modo offline de la app Kivy/PWA) y se mantienen ahí como referencia histórica. Sus tablas del MVP (`provincias`, `cantones`, `parroquias`, `ciiu`, `usuarios`, `usuarios_fincas`, `fincas`, `cultivos`, `actividades`, `documentos`) están consolidadas y normalizadas en este directorio. Las tablas específicas de módulos (palmas, fitosanitario, precisión, marketplace, finanzas) se migrarán en fases posteriores.
