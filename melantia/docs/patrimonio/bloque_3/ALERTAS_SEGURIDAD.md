# ALERTAS DE SEGURIDAD DEL PATRIMONIO MELANTIA

> Sin secretos impresos. Toda clave se representa como `[REDACTED]`.

## SEC-01 — Credencial Supabase expuesta en histórico

| Campo | Valor |
|---|---|
| **Archivo** | `melantia_old_version/respaldo_melantia/melant_ia/src/database/supabase_config.js` |
| **Tipo de secreto** | Supabase `anonKey` (publishable) + URL de proyecto + bucket `melantia-trazabilidad` + tabla `evidencia_fotos_nube` |
| **Valor** | `[REDACTED]` |
| **Riesgo** | La clave anon/publishable tiene privilegios limitados por diseño, pero expone: proyecto activo, bucket y tabla de evidencias fotográficas. Si RLS está mal configurado, permite lectura/escritura no autorizada. Además, copiar el histórico a un repo público difundiría la credencial. |
| **Dependencias** | `modulo11_logica.js` (subida de evidencias), posiblemente otros módulos que importan `supabase_config.js` (`import { supabase } ...`) |
| **Acción recomendada** | (1) Verificar si el proyecto Supabase sigue activo y si la clave es válida. (2) Si es válida: rotarla (tarea separada, autorizada por el usuario) y revisar RLS del bucket/tabla. (3) Antes de cualquier publicación del histórico, saneado de la clave. **NO ejecutar desde este bloque.** |
| **Estado** | IDENTIFICADO — pendiente de tarea de seguridad autorizada |

## SEC-02 — Segundo archivo `supabase_config.js` con contenido anómalo

| Campo | Valor |
|---|---|
| **Archivo** | `melantia_old_version/src/database/supabase_config.js` |
| **Hallazgo** | Extensión `.js` pero contiene código Python/SQLAlchemy de configuración. Revisar si incluye credenciales de conexión directa (DB password) antes de cualquier difusión. |
| **Acción** | Inspección puntual en tarea de seguridad conjunta con SEC-01. |

## SEC-03 — Datos personales potenciales en histórico

| Campo | Valor |
|---|---|
| **Alcance** | `data/perfil_usuario.json`, `modulos_usuario.json`, bases SQLite históricas, `evidencia_fotos_nube` (nombre de tabla sugiere fotos de personas/fincas), `generador_qr_productor.py` (lee cédulas y datos clínicos animales) |
| **Riesgo** | El histórico puede contener cédulas, nombres, coordenadas de fincas y datos personales reales. |
| **Acción** | Antes de publicar/compartir el histórico: escaneo de datos personales. Las plantillas (`finca_ejemplo.json`) parecen de ejemplo — confirmar. |

## SEC-04 — Dependencias sin mantenimiento

| Campo | Valor |
|---|---|
| **Alcance** | `package-lock.json`, `.venv/` con paquetes fijados hace meses, `browser-image-compression`, `qrcode`, `PIL` en código histórico |
| **Riesgo** | Versiones antiguas con vulnerabilidades conocidas si se reutilizan sin actualizar. |
| **Acción** | Toda dependencia recuperada se reinstala a versión actual veteada (regla ≥7 días de antigüedad), nunca copiando lockfiles históricos. |

## SEC-05 — Código con efectos secundarios si se ejecuta

| Campo | Valor |
|---|---|
| **Alcance** | `descarga_masiva_bibliografia.py` (descarga URLs externas), `actualizar_cerebro.py` (copia/sobrescribe archivos), `sincronizar_gestion_fincas.py` (copia recursos), `programar_sincronizacion_*` (schedulers), `main.py` (verificaciones/red), `ejecutar_asistente.py` (llamadas a IA externa) |
| **Riesgo** | Ejecución accidental durante análisis → escrituras, red, sobrescrituras. |
| **Acción** | Auditoría estática únicamente (ya aplicada); prohibir ejecución de histórico sin sandbox y autorización. |

## SEC-06 — Escaneo de secretos no exhaustivo

| Campo | Valor |
|---|---|
| **Hallazgo** | La auditoría identificó la credencial Supabase por lectura dirigida, pero no se ejecutó un escaneo de secretos completo sobre los ~100k archivos históricos. |
| **Acción** | Antes de limpieza/publicación del histórico: pasar un scanner de secretos (tarea futura autorizada). |

## Resumen de acciones pendientes (fuera de este bloque)

1. Verificar/rotar credencial Supabase (SEC-01, SEC-02).
2. Escaneo de datos personales antes de exponer histórico (SEC-03).
3. Regla de dependencias nuevas al migrar (SEC-04).
4. Prohibición de ejecución de histórico sin sandbox (SEC-05) — ya vigente.
5. Escaneo de secretos exhaustivo previo a publicación (SEC-06).
