# 06 — PLAN DE RESTAURACIÓN PROPUESTO (NO EJECUTADO)

Procedimiento recomendado para llevar el contenido **útil** del backup al proyecto Supabase nuevo.
**Nada de lo descrito aquí fue ejecutado.** Los comandos son ilustrativos; ajustar nombres/host/credenciales reales en el momento de ejecución.

Principio rector: **extraer solo el schema `public` + extensiones necesarias.** Nunca reproducir el dump de clúster completo sobre Supabase.

---

## FASE A — Preparación

| | |
|---|---|
| Objetivo | Entorno listo y verificable antes de tocar el destino |
| Herramienta | `psql` ≥ 17.6, `gzip`, editor de texto / `awk`/`sed`, Supabase CLI (opcional) |
| Acciones | 1) Verificar versión PG del proyecto nuevo (`select version();`) — **debe ser ≥ 17**. 2) Descomprimir el dump a una copia de trabajo. 3) Extraer del SQL las sentencias del schema `public` (rango: `CREATE TYPE public.` … hasta antes de `CREATE TABLE realtime.` en la sección de datos/DDL correspondiente) más la sección COPY de `public.precios_sustentabilidad_ecuador` y los `ENABLE RLS`/`GRANT` de public que se decidan. 4) Guardar el extracto como archivo nuevo (p. ej. `restore_public.sql`) — **nunca editar el original**. |
| Comando potencial | `gzip -dc db_cluster-*.backup.gz > work.sql` y filtrado manual/asistido |
| Prerequisitos | Proyecto nuevo provisionado; credenciales de service disponibles en local |
| Riesgos | Extraer secciones internas por error → contaminar esquemas de plataforma |
| Validación | `grep -c "CREATE TABLE public" extracto.sql` = 17; ausencia de `CREATE SCHEMA|CREATE ROLE|auth\.` |
| Rollback | No aplica (aún no se toca el destino) |

## FASE B — PostgreSQL (schema public)

| | |
|---|---|
| Objetivo | Crear 4 enums, 17 tablas, secuencias, función, triggers, vista, índices implícitos |
| Herramienta | `psql` contra `db.<nuevo-ref>.supabase.co` (o pooler :6543, session mode) |
| Comando potencial | `psql "postgresql://postgres:<pwd>@db.<ref>.supabase.co:5432/postgres?sslmode=require" -v ON_ERROR_STOP=1 -f restore_public.sql` |
| Prerequisitos | `uuid-ossp` habilitado en schema `extensions` (por defecto en Supabase; verificar con `\dx`) |
| Riesgos | Colisión si `public` ya tiene tablas con esos nombres; columnas con tilde requieren quoting exacto |
| Validación | `\dt public.*` = 17; `\dT+` enums = 4; `select count(*) from precios_sustentabilidad_ecuador` = 3 |
| Rollback | `DROP SCHEMA public CASCADE` solo si el proyecto nuevo estaba vacío; en caso contrario, script de drop por objeto |

## FASE C — Auth / usuarios

| | |
|---|---|
| Objetivo | Recrear identidades |
| Situación real | **auth.users está vacío (0 usuarios)** → no hay nada que migrar |
| Acción | Ninguna restauración. Si más adelante se crean usuarios en el proyecto nuevo, decidir si `perfiles_usuario.id` debe enlazarse con `auth.users.id` (en el modelo antiguo NO lo está — decisión de diseño pendiente, ver `12_ADR_IDENTIDAD_USUARIOS.md`) |
| Riesgos | — |

## FASE D — Storage

| | |
|---|---|
| Objetivo | Recrear buckets y objetos |
| Situación real | **0 buckets, 0 objetos, ZIP vacío** → nada que subir |
| Acción | Crear buckets solo cuando la aplicación los necesite (p. ej. `evidencias`) con sus políticas `storage.objects` deliberadas — eso es configuración nueva, no restauración |
| Riesgos | Confundir "crear buckets nuevos" con "restaurar"; no existe respaldo físico de archivos |

## FASE E — RLS / policies

| | |
|---|---|
| Objetivo | Seguridad por fila operativa |
| Situación real | El backup activa RLS en 7 tablas pero **define 0 políticas** |
| Acción | Escribir políticas nuevas (`CREATE POLICY … USING (auth.uid() = …)`) según el modelo de identidad que se decida en Fase C. Mientras tanto, las tablas con RLS quedan inaccesibles para `anon`/`authenticated` — comportamiento seguro por defecto |
| Riesgos | Dejar RLS activado sin políticas = app devuelve vacío/403 sin error evidente |
| Validación | `select * from pg_policies where schemaname='public'` |

## FASE F — Funciones / triggers

| | |
|---|---|
| Objetivo | Lógica de negocio activa |
| Acción | Ya cubierto en Fase B (`procesar_logica_comercial` + 2 triggers + vista). Verificar que los triggers disparan: insert de prueba en `ofertas_platano` por debajo del mínimo debe marcar `alerta_bajo_precio_sustentabilidad=true`; insert en `ordenes_compra` debe calcular comisión 2 % |
| Riesgos | Función referencia `precios_sustentabilidad_ecuador` → si el seed no se cargó, `v_precio_minimo` = NULL y la comparación no alerta (silent) |
| Rollback | `DROP TRIGGER …; DROP FUNCTION …` |

## FASE G — Verificación

| | |
|---|---|
| Acciones | Conteo de objetos vs. inventario (17 tablas / 4 enums / 1 fn / 2 trg / 1 vista / 3 filas seed); `\d+` de cada tabla; probar un INSERT+DELETE de humo por tabla; verificar `pg_policies` tras Fase E |
| Rollback | N/A |

## FASE H — Actualización de `.env`

| | |
|---|---|
| Acción | Solo cuando la restauración esté verificada: apuntar `SUPABASE_URL`/`SUPABASE_ANON_KEY`/etc. al nuevo project-ref en el `.env` correspondiente del entorno |
| Riesgos | Referencias antiguas a `upfwgaacznljbzmbgcul.supabase.co` quedarían apuntando a un proyecto inexistente |
| Rollback | Guardar copia previa del `.env` |

## FASE I — Pruebas MELANTIA

| | |
|---|---|
| Acciones | Levantar backend con el nuevo `.env`; smoke test de endpoints; verificar escritura en tabla public; verificar que el frontend autentica (usuarios nuevos, no migrados) |
| Criterio | La app funciona igual que contra el proyecto antiguo **en vacío** — no hay datos históricos que comparar |

---

## Resumen del plan

```text
A preparar → B DDL public → C auth (nada) → D storage (nada, solo buckets nuevos)
→ E policies nuevas → F triggers (verificar) → G verificación → H .env → I pruebas
```

**El plan se reduce a Fases A–B + E–I.** Las fases de datos (C, D) son triviales porque el backup no contiene datos de usuarios, negocio ni archivos.
