# MELANTIA — Backlog Técnico de Implementación (Seguridad Soberana)

> Derivado de `01_AUDITORIA_SEGURIDAD.md` (hallazgos F-01…F-13) y `02_DISENO_ARQUITECTURA_SEGURIDAD.md` (diseño).
> **Nada aquí está autorizado aún.** Cada ítem requiere autorización explícita antes de ejecutarse.
> Orden sugerido por riesgo y dependencia, no por cronología comprometida.

---

## Fase S0 — Higiene inmediata (bajo riesgo, alto impacto)

| # | Tarea | Hallazgo | Esfuerzo | Dependencias |
|---|---|---|---|---|
| S0.1 | Eliminar default hardcodeado de `MELANTIA_JWT_SECRET_KEY` en `security.py` → fail-closed si no definida | F-01 | Trivial | Ninguna |
| S0.2 | Eliminar default de `db_password` en `config.py` → fail-closed | F-03 | Trivial | Ninguna |
| S0.3 | Deprecar/quitar clase `SupabaseAuth` (stub que carga `service_role` en memoria) y eliminar `SUPABASE_SERVICE_ROLE_KEY`/`VITE_SUPABASE_ANON_KEY` del `.env` | F-06 | Trivial | Confirmar que nada más las usa (auditado: solo stub) |
| S0.4 | Reemplazar `print("[DB ERROR]…")` por logging con redacción (sin query ni valores) | F-07 | Bajo | Decidir stack de logging |
| S0.5 | Implementar `require_role`/`require_subscription`/`verify_resource_ownership` reales (o bloquear su uso hasta implementarlos) | F-02 | Medio | Modelo de roles EP-4E |
| S0.6 | Cifrar o mover el backup `db_cluster-*.backup.gz` existente fuera del directorio de trabajo | F-09 | Trivial | Procedimiento manual |
| S0.7 | Rate limiting básico en `/auth/login`, `/registro`, `/refresh` (pendiente ya reconocido en D4.2 §12) | F-08 | Medio | Decidir: middleware propio vs gateway |
| S0.8 | Corregir línea malformada `PAYPHONE_SECRET_KEY` en `.env` (pre-existente, dotenv la salta) | — | Trivial | Confirmar formato correcto con proveedor |

## Fase S1 — Protección del cliente

| # | Tarea | Hallazgo | Esfuerzo | Dependencias |
|---|---|---|---|---|
| S1.1 | Sacar access token de `localStorage` (web): memoria + cookie HttpOnly para refresh, o IndexedDB cifrado | F-04 | Medio | Cambio de contrato cliente |
| S1.2 | Clasificar datos del caché offline; SENSITIVE+ nunca en `localStorage` en claro | F-05 | Medio | Clasificación §1 del diseño |
| S1.3 | Cifrar caché offline con clave de sesión; alinear TTL de datos con ventana de autorización (≤72 h) | F-05 | Medio | S1.2, decisión de librería WebCrypto |
| S1.4 | Device binding efectivo: registro/validación de `dispositivo_id` en refresh | Diseño §6 | Medio | Tabla `dispositivos` ya existe |
| S1.5 | Almacenamiento seguro móvil (Keychain/Keystore) para cuando exista app nativa | Diseño §6 | Medio | App nativa |

## Fase S2 — Claves y cifrado de datos

| # | Tarea | Diseño | Esfuerzo | Dependencias |
|---|---|---|---|---|
| S2.1 | **Decisión de custodia de RoT** (KMS cloud vs HSM externo vs híbrido) — requiere aprobación del propietario | §2.3 | Decisión | Datos de coste/jurisdicción |
| S2.2 | Activar cifrado de `refresh_token_enc` (AES-256-GCM, KEK-sesiones vía `MELANTIA_SESSION_VAULT_KEY` ya provisionada) | §3.2 | Medio | Especificación criptográfica aprobada |
| S2.3 | Migrar `PEPPER_IDENTIDAD` y `VAULT_KEY` a custodia KMS (credencial de invocación en `.env`, no la clave) | §2.4 | Medio | S2.1 |
| S2.4 | Cifrado por campo de PII en `usuarios` (cedula_ruc, contacto) | §3.2 | Alto | S2.1, estrategia de índice ciego |
| S2.5 | Cifrado por campo de GPS en `fincas`/`lotes`/`levantamientos`/`mediciones_campo` | §3.2 | Alto | S2.4 (patrón establecido) |
| S2.6 | Cifrado por objeto de `evidencias_documentos`/storage (DEK por documento) | §3.2 | Alto | S2.1, storage provider |
| S2.7 | Indexación/búsqueda sobre campos cifrados (índices ciegos HMAC) | §11 | Alto | S2.4 |

## Fase S3 — Backups

| # | Tarea | Diseño | Esfuerzo | Dependencias |
|---|---|---|---|---|
| S3.1 | Backups cifrados con DEK-backup dedicada antes de exportar | §4 | Medio | S2.1 (KEK-backup) |
| S3.2 | Almacén de backups con object-lock/WORM + credencial de borrado separada | §4 | Medio | Cuenta de backups |
| S3.3 | Copia en cuenta/soporte secundario (3-2-1) | §4 | Medio | S3.2 |
| S3.4 | Procedimiento de restore con doble aprobación + drill periódico documentado | §4, §9 | Medio | S3.1-S3.3 |

## Fase S4 — Integridad de software

| # | Tarea | Diseño | Esfuerzo | Dependencias |
|---|---|---|---|---|
| S4.1 | Branch protection en `main` + required reviews (≥2 para release) + firma de commits | §5 | Bajo | Admin de GitHub |
| S4.2 | CI/CD: pipeline de build reproducible + SBOM (CycloneDX) | §5 | Alto | Definir CI provider |
| S4.3 | Firma de release con clave fuera del CI (sigstore/cosign + KMS) | §5 | Medio | S2.1, S4.2 |
| S4.4 | Provenance attestation (SLSA) + verificación en deploy | §5 | Alto | S4.3 |
| S4.5 | Verificación de firma del artefacto en cliente | §5, §6 | Medio | S4.3 |
| S4.6 | Separación de repo legacy `melant_ia` vs `melantia` (raíz Git compartida mezcla ambos) | F-12 | Medio | Decisión de migración de repo |

## Fase S5 — Identidad administrativa y acceso

| # | Tarea | Diseño | Esfuerzo | Dependencias |
|---|---|---|---|---|
| S5.1 | Definir roles admin (operador/custodio/desarrollador/propietario/auditor) como entidades separadas de `usuarios` | §7.1 | Medio | Modelo de auth admin |
| S5.2 | MFA obligatorio + FIDO2/passkeys para cuentas administrativas | §7.2 | Medio | S5.1, proveedor de identidad admin |
| S5.3 | JIT access + sesiones administrativas cortas + re-auth para operaciones sensibles | §7.2 | Alto | S5.1 |
| S5.4 | Break-glass accounts selladas con alarma y revisión obligatoria | §7.2 | Medio | S5.1 |
| S5.5 | Implementación criptográfica de two-person rule (órdenes firmadas con doble aprobación) | §7.3 | Alto | S5.1, S5.2 |

## Fase S6 — Lockdown y recuperación

| # | Tarea | Diseño | Esfuerzo | Dependencias |
|---|---|---|---|---|
| S6.1 | Servicio de estado de protección central (NORMAL/ALERTA/CONTENCION/LOCKDOWN/RECOVERY), fail-closed | §8 | Alto | S5.1, S5.5 |
| S6.2 | Propagación de estado: revocación masiva de sesiones/refresh, congelar deploys, denegar unwrap KEK | §8 | Alto | S6.1, S2.x, S4.x |
| S6.3 | Runbook de recuperación ante compromiso (procedimientos por escenario §9.2) | §9 | Medio | S3.x, S4.x |
| S6.4 | Auditoría append-only externa a la BD (firma/hash-chain de `audit_eventos` + export a almacén separado) | §0, §9 | Medio | S2.1 |
| S6.5 | Backup ceremonial de RoT (custodia m-de-n entre custodios/propietario) | §9.2 | Medio | S2.1 |

## Fase S7 — Secretos y entorno

| # | Tarea | Hallazgo | Esfuerzo | Dependencias |
|---|---|---|---|---|
| S7.1 | Migrar `.env` a secret manager (credenciales de invocación, no claves) | F-13 | Medio | S2.1 |
| S7.2 | `.env` cifrado en disco del host de desarrollo mientras no haya secret manager | F-13 | Bajo | Herramienta (sops/age) |
| S7.3 | Escaneo de secretos en historial Git (detectar si alguna vez se commiteó un secreto) | — | Bajo | git-secrets/gitleaks |
| S7.4 | Rotación programada de todas las credenciales actuales al migrar a nuevo modelo | §9 | Medio | S7.1 |

---

## Decisiones pendientes que bloquean backlog (requieren aprobación)

| Decisión | Bloquea | Opciones |
|---|---|---|
| Custodia de RoT | S2.x, S3.1, S5.5, S6.x | HSM externo / KMS cloud / híbrido — ver §2.3 |
| Proveedor de CI/CD | S4.2-S4.4 | GitHub Actions / GitLab CI / otro |
| Secret manager | S7.1 | AWS SM / GCP SM / Vault / sops |
| Stack de logging | S0.4 | structlog / logging estándar con redacción |
| Estrategia de búsqueda sobre campos cifrados | S2.7 | Índices ciegos HMAC / no indexar |
| Ventana de reclamo automático (10 min actual) | Registro saga | Revisar si 10 min es la política definitiva |
| Migración/separación de repo legacy | S4.6 | Repo separado vs monorepo protegido |

## Confirmación de no-implementación

En esta fase **solo se auditó y diseñó**. No se modificó: código, base de datos, Supabase, AWS/GCP/Azure, GitHub. No se crearon usuarios, claves, endpoints, Kill Switch, ni autodestrucción. No hubo commit ni push. Los archivos creados son **documentos** (`01`, `02`, `03` en `docs/patrimonio/seguridad_soberana/`).
