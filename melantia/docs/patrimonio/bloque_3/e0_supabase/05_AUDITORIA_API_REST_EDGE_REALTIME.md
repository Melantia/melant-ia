# 05 — AUDITORÍA DE REST/DATA API, EDGE FUNCTIONS Y REALTIME

## 5.1 Uso directo de Supabase REST / Data API (PostgREST)

**Hallazgo principal**: el frontend histórico usaba Supabase como su **única capa de datos** — `fetch` a `/rest/v1` y `supabase.from(table)` directamente desde el navegador, sin API intermedia.

| Archivo | Llamada | Naturaleza | Clasificación |
|---|---|---|---|
| `gestor_evidencia_fotos.js` | `POST /rest/v1/evidencia_fotos_nube` con apikey+Bearer | metadata evidencias | histórico funcional |
| `gestor_evidencia_fotos.js` | `PUT /storage/v1/object/{bucket}/{ruta}` | upload binario | histórico funcional |
| `gestor_rural_melantia.js` | `GET/POST /rest/v1/{tabla}` (centro de mando) | sync remota | histórico funcional |
| `servicios_financieros.js` | `.from('solicitudes_credito').insert`, `.from('inventario_pecuario_ugm').upsert` | escrituras directas | histórico funcional |
| `persistencia_fincas.js` / `gestion_fincas.js` | `.from('fincas').select/insert` | CRUD directo | histórico funcional |
| `monte_tienda_virtual.js` | `.from('tiendas').select/insert` | CRUD directo | histórico funcional |
| `modulo11_logica.js` | `.from('evidencias').insert` | insert directo | histórico funcional |
| `calculadora_agricola.js` | `window.supabase?.from(...)` condicional | insert condicional | histórico funcional |
| `tienda_virtual_supabase.py` | `supabase.create_client().table().select/insert` | cliente Python (creds placeholder) | histórico plantilla |
| `database/supabase_config.js` (old_version) | `SUPABASE_API_URL = ".../rest/v1/"` | config REST | histórico anómalo |

**Implicación API-first**: todo acceso REST directo debe reubicarse detrás de FastAPI. La lógica (qué tabla, qué payload, qué ruta de archivo) es conocimiento recuperable; el mecanismo (cliente→PostgREST con anonKey) es el patrón a **sustituir**, no a migrar.

Con anonKey + RLS permisivo, estas escrituras históricas eran esencialmente **públicas**: cualquiera con la URL y la publishable key podía insertar/leer/actualizar `evidencia_fotos_nube`, `fincas`, `tiendas`, `solicitudes_credito` — incluyendo **datos financieros/KYC**. Riesgo documentado en `09_BLOQUEADORES_E0.md`.

## 5.2 Edge Functions

| Búsqueda | Resultado |
|---|---|
| `supabase/functions/` | **No existe** en ningún árbol |
| `functions.invoke` | 0 coincidencias |
| `Deno`, `serve(` (patrón edge) | 0 coincidencias relevantes |
| `package.json` | solo `@supabase/supabase-js` — sin CLI de supabase |

**Conclusión**: no hay Edge Functions. La decisión preliminar "no incorporar Edge Functions por defecto" no encuentra deuda técnica — nada que retirar ni migrar.

## 5.3 Realtime

| Búsqueda | Resultado |
|---|---|
| `.channel(`, `subscribe(`, `postgres_changes`, `broadcast`, `presence` | 0 coincidencias en código |
| `realtime` | solo en `package-lock.json` (dependencia transitiva de supabase-js) |
| `websocket_alertas.js` | **existe como módulo propio** — WebSocket nativo de MELANTIA, NO Supabase Realtime |

**Evaluación de necesidad**: los casos de uso en tiempo real (alertas climáticas, chat comunidad, tracking de entregas) existen como funcionalidades históricas propias (`websocket_alertas.js`, cola de rastreo). Ninguna usa Supabase Realtime. Clasificación: **innecesario hoy / útil-si-caso-concreto** — consistente con la decisión preliminar de no activarlo por defecto.

## 5.4 Conclusión de la sección

```text
ESTADO HISTÓRICO:   React/JS ──(anonKey)──> PostgREST /rest/v1 + Storage REST
                         ↑ arquitectura "BaaS directo", sin backend propio

OBJETIVO:           React ──> FastAPI ──> Services ──> Repositories ──> PostgreSQL
                         └─> FastAPI ──(secret key, server-side)──> Supabase Storage
```

La lógica de "qué se guardaba dónde" es patrimonio recuperable (tablas, payloads, rutas). El patrón de acceso directo con publishable key es lo que debe diseñarse fuera del sistema.
