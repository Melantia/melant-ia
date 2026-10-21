# 07 — DECISIÓN DE ARQUITECTURA AUTH

Evaluación de las 3 opciones contra la evidencia del código. **Recomendación, no implementación.**

## Opción A — Auth propio + Supabase solo como PG/Storage

```text
FastAPI emite JWT propio (HS256, MELANTIA_JWT_SECRET_KEY)
Supabase = solo base de datos + bucket
```

| Criterio | Evaluación |
|---|---|
| Seguridad | Correcta si JWT secret es fuerte y sin fallback hardcodeado |
| Duplicación | Cero — un solo sistema de identidad |
| Mantenimiento | Bajo — ya funciona hoy |
| Compatibilidad actual | **Total** — cero migración |
| Offline-first | Excelente — login local conceptualmente posible |
| Ecosistema Profesional | Compatible — AuthZ en BD, no en token |
| Storage | **Problema**: sin Supabase Auth no hay `authenticated` role en JWT de Supabase → subir archivos requiere secret key en backend (patrón correcto: FastAPI sube con `sb_secret_`) o RLS permisivo (anti-patrón histórico) |
| Riesgo | La decisión de identidad queda resuelta a favor de lo propio para siempre |

## Opción B — Supabase Auth + auth propia paralela

| Criterio | Evaluación |
|---|---|
| Seguridad | Dos superficies de ataque |
| Duplicación | **Máxima** — dos usuarios, dos passwords, dos JWT |
| Mantenimiento | Alto — sincronización de estados |
| Compatibilidad actual | Conflicto directo con `usuarios` existente |
| Veredicto | **Descartada por evidencia** — sin beneficio que A o C no den |

## Opción C — Supabase Auth → JWT → FastAPI → AuthZ MELANTIA

```text
Login (Supabase Auth)
   → JWT Supabase (sub = auth.users.id)
   → FastAPI verifica firma+iss+aud
   → mapea auth.users.id → usuarios.id
   → AuthZ MELANTIA (EP, roles, concesiones — sin cambios)
```

| Criterio | Evaluación |
|---|---|
| Seguridad | Alta — JWT verify con `SUPABASE_JWT_ISSUER`; secret de firma gestionado por Supabase; MFA/OTP/magic-link gratis |
| Duplicación | Baja — `usuarios` conserva datos de negocio; `auth.users` solo identidad |
| Mantenimiento | Medio — sincronización identidad↔perfil |
| Compatibilidad actual | AuthZ EP **no se toca** (resuelve en BD); `get_current_user` cambia solo el verificador |
| Storage | **Resuelve el problema de A**: JWT Supabase permite RLS real por usuario; o mantener upload server-side |
| Offline-first | Token funciona offline tras emitirse; login/refresh requieren red (igual que hoy, 30min sin refresh es peor) |
| Costo de migración | Passwords bcrypt no migran → reset obligatorio o coexistencia; login por cédula requiere mapeo (email sintético `cedula@melantia.app` o admin API) |
| Evidencia a favor | **`melantia/supabase/migrations/0001_fase1_core.sql` (untracked) ya diseñó exactamente esto**: `usuarios_perfiles.id → auth.users` + RBAC + RLS. Trabajo previo del proyecto apuntando a C |

## Comparación de evidencia

| Factor decisivo | A | C |
|---|---|---|
| Trabajo previo en repo | — | `0001_fase1_core.sql` + `SupabaseAuth` placeholder + settings supabase_* ya en config |
| RLS efectivo en Storage | No posible (sin identidad Supabase) | Sí |
| Features de auth (MFA, reset, magic link, social) | Todo por construir | Incluido |
| Migración de usuarios | Ninguna | Reset de contraseñas + mapeo cédula |
| Complejidad operativa | Mínima | Media |
| Independencia de proveedor | Total | Parcial (identidad en Supabase) |

## Recomendación fundamentada

**Opción C como destino, con Opción A como etapa transitoria.**

Evidencia que la sustenta:

1. El propio repo ya contiene el diseño de C (`0001_fase1_core.sql` con FK a `auth.users`, settings `supabase_*` en `config.py`, clase `SupabaseAuth` preparada) — la intención arquitectónica previa era C.
2. La AuthZ real (EP `autorizacion.py`) es agnóstica al proveedor del `sub` — C no toca la lógica de negocio ni de permisos.
3. Storage con RLS real solo funciona si la identidad viene de Supabase Auth — y evidencias es funcionalidad núcleo (M11).
4. El JWT actual tiene defectos que C resuelve gratis (sin refresh, sin iss/aud, fallback de secreto).
5. El patrón correcto de Storage en cualquier caso es: **FastAPI sube con secret key** — lo que hace la decisión menos urgente para Storage, pero C la hace coherente end-to-end.

**Transición propuesta** (cuando se autorice): mantener JWT propio operativo en desarrollo; introducir validador dual (acepta HS256 propio O Supabase-JWT por `iss`) durante migración; mapear `auth.users.id → usuarios.id` vía columna puente; retirar emisor propio al final.

## Decisiones pendientes del usuario (requieren autorización)

- D1: ¿C destino confirmado? (recomendada; A viable si se valora independencia total de proveedor)
- D2: ¿Login por cédula se mantiene? → implica email sintético o flujo admin-API en Supabase Auth
- D3: ¿Reset de contraseñas aceptable para usuarios existentes? (hoy solo hay usuarios de desarrollo — costo real ≈ 0)
- D4: ¿`usuarios` canónica se mantiene como perfil de negocio con `auth_user_id` puente (patrón `usuarios_perfiles`)?
