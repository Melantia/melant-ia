# MELANTIA — Diseño de Arquitectura de Seguridad Soberana

> Documento de **diseño**, no de implementación. Nada de lo aquí descrito está construido aún.
> Complementa `01_AUDITORIA_SEGURIDAD.md` (hallazgos) y alimenta `03_BACKLOG_IMPLEMENTACION.md` (trabajo futuro).
> Principio rector: **"ROBAR EL CÓDIGO NO DEBE EQUIVALER A ROBAR MELANTIA."**
> No se promete seguridad absoluta ni imposibilidad matemática de ataque. El diseño aplica defensa en profundidad, Zero Trust, separación de privilegios, criptografía estándar, gestión de claves, firma de software, auditoría y recuperación verificable.

---

## 0. Separación fundamental de dominios

El sistema se diseña para que **ningún elemento único** (credencial, cuenta, proveedor, fichero, proceso) conceda control total. Dominios explícitamente separados:

| Dominio | Dueño lógico | Comprometerlo NO debe dar |
|---|---|---|
| Código fuente | Repo Git protegido | Acceso a datos ni producción de releases |
| Infraestructura | Cuenta cloud raíz (separada) | Claves criptográficas |
| Identidad (AuthN) | Supabase Auth + puente local | Autorización de dominio (EP-4E) |
| Autorización (AuthZ) | Backend + PostgreSQL | Identidad de autenticación |
| Datos | PostgreSQL + Storage | Claves que los descifran |
| Claves | KMS/HSM externo | Datos directamente |
| Configuración | Entorno/secret manager | Código ni datos |
| Políticas | Servicio de políticas firmadas | Ejecución sin verificación |
| Firmas | Claves de firma fuera del CI | Reescritura de código fuente |
| Backups | Cuenta/soporte independiente | Legibilidad sin claves de backup |
| Auditoría | Almacén append-only separado | Alteración por el backend |
| Propiedad de infra | Cuenta raíz + custodios | Operación diaria |

---

## 1. Clasificación de información

| Nivel | Definición | Ejemplos MELANTIA | Reglas |
|---|---|---|---|
| **PUBLIC** | Divulgable sin daño | Nombre de la app, versión, docs públicas | Sin restricción |
| **INTERNAL** | Uso interno, daño bajo | Estructura de menús, catálogos, textos UI | Solo usuarios autenticados |
| **CONFIDENTIAL** | Daño moderado si se expone | Perfil básico, nombre de finca, estado de suscripción | Autenticado + propietario/rol |
| **SENSITIVE** | Daño alto: datos personales, productivos, jurídicos | cédula/RUC, contacto, coordenadas GPS de fincas/lotes, levantamientos, mediciones, evidencias, documentos, `perfil_economico_productor`, trazabilidad, cadena de custodia | Autenticado + autorización EP-4E + cifrado en reposo + mínimo offline |
| **CRITICAL** | Compromiso sistémico si se expone | `PEPPER_IDENTIDAD`, `MELANTIA_SESSION_VAULT_KEY`, `SUPABASE_SECRET_KEY`, `db_password`, refresh tokens, claves DEK/KEK, backups, `usuarios_auth_puente` (mapa identidad↔Auth), `audit_eventos` | Nunca en cliente; nunca en repo; nunca en logs; custodia KMS/HSM |

### Matriz de manejo por nivel

| Nivel | Cliente (almacenar) | Offline | Cifrado en reposo | Cifrado por campo/objeto | Notas |
|---|---|---|---|---|---|
| PUBLIC | Sí | Sí | No requerido | No | — |
| INTERNAL | Sí | Sí | Recomendado | No | — |
| CONFIDENTIAL | Sí (storage protegido) | Sí (con TTL ≤72 h) | Sí | Opcional | Borrado al cerrar sesión |
| SENSITIVE | Solo lo estrictamente necesario | Solo snapshot firmado, cifrado, TTL=ventana offline | Sí | Sí, campos PII/GPS/documentos | Nunca en `localStorage` en claro |
| CRITICAL | **Nunca** | **Nunca** | Sí (en KMS/HSM, no en BD) | Sí | Solo en memoria del proceso autorizado |

**Corrección de tensión detectada (auditoría F-05):** el caché offline actual tiene TTL 7 días en claro. En la arquitectura objetivo, todo dato CONFIDENTIAL+ cacheado offline vive **cifrado** y con TTL ≤ la ventana de autorización (72 h), no 7 días. La ventana de autorización F7a (72 h) no cambia; lo que se acota es la persistencia del dato.

---

## 2. Arquitectura de claves

### 2.1 Jerarquía

```
                ┌─────────────────────────┐
                │   ROOT OF TRUST (RoT)   │   ← custodia KMS/HSM externo
                │  (clave raíz MELANTIA)  │     NUNCA sale del HSM
                └───────────┬─────────────┘
                            │ protege (wrap)
              ┌─────────────┼─────────────┬──────────────┐
              ▼             ▼             ▼              ▼
        KEK-datos     KEK-sesiones   KEK-backup     KEK-identidad
        (objetos/     (refresh_token  (dumps PG/     (pepper futuro
         campos)       _enc, vault)    storage)       rotación)
              │             │             │              │
              ▼             ▼             ▼              ▼
        DEK por objeto/  DEK por      DEK por         derivación
        campo/dominio    sesión       backup          HMAC
```

- **RoT (Root Key):** reside en KMS/HSM, nunca exportable. Nadie la lee; solo se invoca `wrap/unwrap` (o `encrypt/decrypt` de KEK).
- **KEK (Key Encryption Keys):** cifradas por la RoT; una por dominio (datos, sesiones, backup, identidad). Almacenadas cifradas; solo se descifran en memoria del servicio autorizado vía llamada al KMS.
- **DEK (Data Encryption Keys):** generadas por objeto o por dominio+scope; cifradas por su KEK y almacenadas junto al dato (envelope estándar).
- **Claves de firma de software:** dominio independiente, fuera del árbol de datos (ver §6).
- **Claves de identidad:** `PEPPER_IDENTIDAD` migra a custodia KMS como "clave de derivación"; `MELANTIA_SESSION_VAULT_KEY` se convierte en KEK-sesiones gestionada por KMS.

### 2.2 Fronteras obligatorias (requisito del encargo)

| Escenario | Diseño que lo impide |
|---|---|
| **PostgreSQL comprometido ≠ claves disponibles** | La BD solo contiene ciphertext + DEK cifrada + `key_id`. Las KEK/RoT están en KMS externo; robar el dump da bytes indescifrables. |
| **Storage comprometido ≠ claves disponibles** | Objetos cifrados con DEK; el objeto lleva solo DEK envuelta. Sin acceso al KMS no hay descifrado. |
| **Backend comprometido ≠ Root Key disponible** | El backend nunca posee la RoT; posee credencial IAM para *invocar* unwrap de KEK. Comprometer el proceso da acceso temporal a KEK descifrada en memoria, no a la raíz, y la credencial IAM es revocable/rotatable sin reconstruir nada. |
| **Backup robado ≠ datos legibles** | Backups cifrados con DEK-backup envuelta por KEK-backup, cuya custodia está en cuenta/raíz **distinta** de la del backup físico. |
| **Proveedor cloud comprometido ≠ claves** | Custodia separada: opción HYOK (hold-your-own-key), HSM externo, o KMS de segundo proveedor. La RoT no vive en el mismo proveedor que aloja los datos. |

### 2.3 Comparación conceptual KMS/HSM

| Opción | Modelo | Custodia de la RoT | Separación de proveedor | Coste/complejidad | Encaje MELANTIA |
|---|---|---|---|---|---|
| **AWS KMS** | Multi-tenant HSM FIPS 140-2 L3; `encrypt/decrypt` por API con IAM | AWS lo custodia; clave no exportable por defecto | Si los datos están en Supabase/AWS, usar KMS de AWS concentra proveedor — se compensa con **cuenta AWS separada** o BYOK | Bajo coste, API madura, IAM granular, CloudTrail | Buen candidato si se acepta separación por *cuenta* más que por proveedor |
| **AWS CloudHSM** | HSM dedicado single-tenant FIPS 140-2 L3 | Custodia exclusiva del cliente dentro del HSM | Mismo proveedor pero *tenancy* exclusiva | Alto coste, gestión manual de cluster | Solo si se requiere control exclusivo real del HSM |
| **GCP Cloud KMS / Cloud HSM** | Equivalente: KMS multi-tenant / HSM L3 dedicado | Google; no exportable | Útil como **segundo proveedor**: datos en Supabase/AWS + claves en GCP = separación real de proveedor | Similar a AWS | Candidato fuerte para separación cross-provider |
| **Azure Key Vault / Managed HSM** | Equivalente; Managed HSM = pool dedicado FIPS 140-2 L3 | Microsoft | Idem GCP como segundo proveedor | Similar | Alternativa equivalente; decisión por ecosystem |
| **HSM externo** (YubiHSM 2, Nitrokey HSM, HSM de red propio) | Hardware físico del cliente | **Custodia total del propietario** | Separación máxima: ningún proveedor cloud toca la raíz | Complejidad alta (disponibilidad, backup del HSM, acceso remoto), coste variable | Recomendado **para la RoT** si se requiere soberanía máxima; puede combinarse con KMS cloud para KEK operativas |

**Recomendación conceptual (no decisión final):**
- **RoT:** HSM externo (custodia del propietario) *o* KMS de proveedor distinto al de datos — la propiedad clave es la separación.
- **KEK operativas:** KMS cloud (AWS/GCP/Azure) por disponibilidad y API — la rotación y el unwrap frecuente necesitan servicio, no hardware de escritorio.
- **Modelo híbrido preferido:** RoT en HSM externo protege KEK-maestra; KEK-maestra protege KEK de dominio; estas viven en KMS cloud para uso operativo. Así, comprometer el KMS cloud no expone la raíz, y perder el HSM externo no bloquea la operación (solo la recuperación profunda).

> Decisión pendiente de aprobación del propietario: proveedor concreto. No se elige aquí porque requiere datos de coste, jurisdicción y operación que son decisión de negocio.

### 2.4 Qué NO puede contener la raíz / reglas de residencia

La RoT **nunca** vive en: repo Git, `.env` de aplicación, frontend, APK, PostgreSQL, servidor web, imagen Docker, ni pipeline CI. Solo en el custodio (KMS/HSM). Los `.env` de aplicación contendrán, como máximo, credenciales de *invocación* (IAM/ service account) — revocables, con scope mínimo, nunca la clave en sí.

---

## 3. Envelope encryption (diseño)

### 3.1 Flujo

```
Dato sensible
   │  cifrar con DEK (AES-256-GCM o XChaCha20-Poly1305)
   ▼
ciphertext + nonce
   │  DEK se cifra (wrap) con KEK de dominio
   ▼
registro/objeto: { ciphertext, nonce, wrapped_dek, key_id, alg, version }
   │  KEK cifrada por RoT en KMS/HSM
   ▼
RoT nunca sale del custodio
```

**Algoritmos (estándar, mantenidos — no inventados):**
- Simétrico autenticado: **AES-256-GCM** (vía `cryptography`) o **XChaCha20-Poly1305** (vía libsodium/`PyNaCl`). Ambos dan confidencialidad + integridad.
- Wrap de claves: el del KMS (AES-KW interno) o AES-GCM para wrap local.
- Firma: **Ed25519** (artefactos, snapshots offline) y **ES256** (ya en uso por Supabase JWT).
- Derivación: HMAC-SHA256 (ya usado para pepper), HKDF si se derivan sub-claves.
- Hash: SHA-256/SHA-512.
- Librerías: `cryptography` (ya en el stack), `PyNaCl`/libsodium, `sigstore` para firma de artefactos. **Prohibido** implementar primitivas propias.

### 3.2 Qué se cifra y a qué granularidad

| Dato | En reposo (toda la BD/disco) | Por objeto | Por campo | Justificación |
|---|---|---|---|---|
| `usuarios.cedula_ruc`, `contacto` | Sí | — | **Sí** | PII directa |
| `usuarios_auth_puente` (mapa Auth↔local) | Sí | — | **Sí** (cedula canónica) | Mapa de identidad = CRITICAL |
| Coordenadas GPS (`fincas`, `lotes`, `levantamientos`, `mediciones_campo`) | Sí | — | **Sí** | Ubicación de activos = SENSITIVE |
| `evidencias_documentos`, `cadena_custodia` (objetos storage) | Sí | **Sí** (DEK por documento) | — | Evidencia jurídica |
| `perfil_economico_productor`, datos financieros | Sí | — | **Sí** | Financiero SENSITIVE |
| `sesiones.refresh_token_enc` | Sí | — | **Sí** (ya BYTEA preparado) | CRITICAL — diseño F7a reservado |
| `audit_eventos` | Sí | — | Integridad: firma/hash-chain, no cifrado de campos (se deben poder consultar) | CRITICAL de integridad |
| `trazabilidad_*`, `registros_campo` | Sí | Opcional por lote | Campos PII/sensibles | SENSITIVE |
| `dispositivos`, `sesiones` (metadatos) | Sí | — | No (metadatos operativos) | CONFIDENTIAL |
| Catálogos, plantillas públicas | Sí | No | No | INTERNAL |
| **Backups** | **Sí, siempre** | DEK por backup | — | Requisito §8 |

**Regla:** cifrado en reposo a nivel volumen/BD es el *suelo* (defensa contra robo de disco), no el techo. El cifrado por campo/objeto es lo que cumple "PostgreSQL comprometido ≠ datos legibles".

### 3.3 Rotación y versionado

- Cada ciphertext lleva `key_id` + `alg` + `version` → rotación de KEK/DEK sin reescritura urgente: los datos viejos se re-cifran lazy o en batch.
- Rotación de RoT = procedimiento ceremonial con two-person rule (§7).
- Pérdida de RoT = datos irrecuperables → el RoT tiene backup ceremonial (shamir/custodios), ver §8.4.

---

## 4. Protección de backups

| Requisito | Diseño |
|---|---|
| Cifrado | Backup cifrado con **DEK-backup dedicada** antes de salir de la BD (no "cifrar el disco después") |
| Claves independientes | KEK-backup distinta de KEK-datos; custodia en cuenta/raíz separada |
| Retención | Política versionada (ej. diario ×30, semanal ×12, mensual ×12) definida en código de política |
| Versionado | Object lock / WORM en el destino — el backup no puede sobrescribirse ni borrarse antes de TTL |
| Protección contra borrado | Object-lock + MFA-delete + credencial de borrado **distinta** de la de escritura |
| Fuera de la cuenta principal | Copia a cuenta cloud secundaria o soporte offline (regla 3-2-1) |
| Restauración controlada | Procedimiento con doble aprobación + auditoría; el restore pide la DEK-backup al custodio (deja rastro) |
| Pruebas periódicas | Restore drill programado: restaurar a entorno aislado, verificar integridad, documentar |
| Ransomware | Inmutabilidad (object-lock) hace que un admin comprometido no pueda cifrar/borrar los backups existentes |
| Eliminación maliciosa | Borrado requiere credencial de la *cuenta de backups* + TTL de lock vencido; separada de la cuenta operativa |

**Propiedad clave:** el backend operativo puede *escribir* backups pero no *leerlos ni borrarlos*; la cuenta de backups puede *guardarlos* pero no *descifrarlos*; el custodio de claves puede *descifrar* pero no *acceder* al almacén. Se necesitan **tres compromisos independientes** para leer un backup.

---

## 5. Integridad del software — cadena de confianza

```
SOURCE ──► BUILD ──► HASH ──► SIGNATURE ──► RELEASE ──► DEPLOY ──► VERIFICATION
```

| Eslabón | Control diseñado |
|---|---|
| **SOURCE** | Repo Git protegido: branch protection en `main`, required reviews (≥2 para release), firma de commits (GPG/SSH/sigstore), sin push directo |
| **BUILD** | Build en CI limpio y efímero; **build reproducible** (mismo source → mismo hash); sin secretos en el entorno de build; SBOM generado (CycloneDX/SPDX) |
| **HASH** | Digest SHA-256 de cada artefacto publicado junto al artefacto |
| **SIGNATURE** | Firma Ed25519 del manifiesto de release con **clave de firma fuera del CI** (sigstore/cosign con clave en KMS, o clave offline ceremonial). El CI construye; la firma requiere actor distinto |
| **RELEASE** | Aprobación multi-persona (two-person rule); release = artefacto + hash + firma + SBOM + provenance attestation (SLSA) |
| **DEPLOY** | El despliegue solo acepta artefactos con firma válida + attestation verificable; el servidor verifica antes de arrancar |
| **VERIFICATION** | En runtime y en cliente: verificación de firma del artefacto/snapshot; discrepancia → rechazo + alerta |

**Propiedad objetivo:** *"Código modificado sin autorización NO se convierte en versión oficial"* porque el CI no puede firmar solo (la clave de firma no está en el CI), y el deploy rechaza lo no firmado. Un push malicioso produce código, no release.

**Controles complementarios:**
- Provenance attestation tipo SLSA (el build declara qué source usó; verificable).
- Pinning de dependencias + revisión de SBOM en cada release (supply-chain S11).
- Protección del propio pipeline: workflow files con required review, OIDC en vez de secretos de larga vida, runners efímeros.
- Verificación de firma también en el **cliente**: la app comprueba que el backend le sirve la versión firmada esperada (defensa contra backend comprometido sirviendo cliente adulterado).

---

## 6. Protección del cliente (Android / iOS / Web)

**Premisa:** el cliente se asume comprometible. El diseño minimiza lo que un cliente comprometido entrega al atacante.

| Control | Diseño |
|---|---|
| Tokens de corta duración | Access token Supabase con TTL corto (≈1 h actual); el cliente no tiene credenciales de larga vida útiles sin el refresh |
| Refresh token | **Nunca en `localStorage`** (web) ni en storage plano (móvil). Web: cookie HttpOnly+Secure+SameSite o memoria + re-auth. Móvil: Keychain/Keystore con gate biométrico |
| Sesión MELANTIA | La autorización real vive en `sesiones` (30 días), no en el token: revocar la sesión mata al cliente aunque el AT siga válido ≤ su `exp` |
| Device binding | Cada sesión ligada a `dispositivo_id` + huella de dispositivo; refresh desde otro dispositivo → sospecha |
| Almacenamiento local protegido | Android: EncryptedSharedPreferences/Keystore. iOS: Keychain con `kSecAttrAccessibleWhenUnlockedThisDeviceOnly` + biometría. Web: **no** `localStorage` para SENSITIVE+ — IndexedDB cifrado con clave en memoria (de sesión) o no persistir |
| Biometría/PIN | Desbloqueo local del snapshot offline (F7a); la biometría protege la clave local, no autentica al servidor |
| Snapshot offline | Firmado (Ed25519) por el backend, cifrado con DEK de dispositivo, TTL = ventana 72 h, `policy_version` incluida |
| Mínimo offline | Solo lo estrictamente necesario para el trabajo de campo autorizado; nunca mapa de identidad, nunca claves, nunca datos de terceros |
| Revocación | Revocar dispositivo/sesión invalida snapshot y borra material local en el próximo contacto |
| Detección de anomalías | Señales: refresh concurrente (ya implementado), cambio de dispositivo, geolocalización imposible, volumen de sync anómalo → `audit_eventos` + marca `sospechosa` |
| Anti-clonación | No se promete imposibilidad de clonar; se diseña para que el clon **no sepa hacerse pasar por oficial**: el cliente verifica firma del backend/artefacto, el backend valida `dispositivo_id` registrado, y el snapshot firmado no es fabricable por un clon |

**Integración con F7a (sin modificarlo):** ventana 72 h, `policy_version`, outbox, revalidación al sincronizar, biometría/PIN, revocación, sesión 30 días — todo se mantiene. Esta capa añade: cifrado del snapshot, clave por dispositivo, verificación de firma del snapshot y del cliente.

---

## 7. Identidad, administración y two-person rule

### 7.1 Separación de identidades

| Rol | Es | Puede | No puede |
|---|---|---|---|
| **Usuario** | Cuenta de negocio (`usuarios`) | Operar sus datos según EP-4E | Nada administrativo |
| **Dispositivo** | `dispositivos` ligado a usuario | Mantener sesión/snapshot | Actuar sin usuario |
| **Sesión** | `sesiones` | Vida 30 días, revocable | Traspasar dispositivo |
| **Operador** | Cuenta admin operativa | Operación diaria: ver auditoría, revocar sesión individual | Cambiar claves, políticas, exports masivos |
| **Desarrollador** | Cuenta de ingeniería | Push a ramas, abrir PR | Push a `main`, release, producción, datos |
| **Custodio de claves** | Rol ceremonial | Operar KMS/HSM en procedimientos | Leer datos, operar la app |
| **Propietario** | Titular de la raíz | Aprobar cambios de propiedad/raíz (con segundo) | Operación diaria |
| **Infraestructura** | Cuenta cloud raíz | Provisionar recursos | Leer claves ni datos |
| **Auditor** | Solo lectura de `audit_eventos` | Verificar integridad | Modificar nada |

**Regla:** ninguna cuenta tiene todos los poderes; cada poder crítico requiere cruzar dos dominios.

### 7.2 Controles de acceso administrativo

- **MFA obligatorio** en toda cuenta administrativa, con **hardware security keys (FIDO2)** o passkeys como segundo factor (no SMS).
- **Sesiones administrativas** separadas, de corta duración, con re-autenticación para operaciones sensibles.
- **Least privilege:** cada rol solo los permisos enumerados; por defecto denegado.
- **JIT (Just-In-Time) access:** el privilegio se concede temporal, por operación, y expira solo.
- **Break-glass:** cuentas de emergencia selladas — su uso dispara alarma y revisión obligatoria; existen para recuperación, no para operación.
- **Separación de funciones:** quien escribe código no despliega; quien despliega no firma; quien firma no custodia claves; quien custodia no lee datos.
- **Audit trail** de toda operación administrativa, append-only, fuera del alcance del propio admin.

> **Nota de aplicación (PC-02, aprobada 2026-10-08):** para el **MVP** la credencial administrativa es **manual segura** (`MATRIZ_CREDENCIALES_ROLES_PERMISOS_ALCANCES_V1.md`); el requisito de MFA con llaves FIDO2/WebAuthn de esta sección queda para la **evolución posterior** sujeta a la planificación aprobada (~6 meses), no como condición de entrada del MVP. Los demás controles de §7.2 se mantienen sin rebaja. FIDO2 modifica el mecanismo de **autenticación**, **no** el modelo de autorización: `IDENTIDAD + ROL + PERMISO + ALCANCE + CONDICIÓN DE SEGURIDAD = AUTORIZACIÓN EFECTIVA`.

### 7.3 Two-person rule — operaciones con doble autorización

Requieren **dos aprobaciones de personas distintas con roles distintos**:

| Operación | Aprobador 1 | Aprobador 2 |
|---|---|---|
| Recuperación de Root of Trust | Custodio de claves | Propietario |
| Cambio de infraestructura raíz | Propietario | Operador senior |
| Exportación masiva de datos | Operador | Propietario |
| Cambio de propietario | Propietario saliente | Custodio/segundo propietario |
| Rotación/cambio de claves KEK/RoT | Custodio | Propietario |
| Recuperación de backup crítico | Operador | Custodio de claves |
| Modificación de política crítica (lockdown, auth) | Operador | Propietario |
| Release de software | Revisor técnico | Propietario/release manager |

**Implementación conceptual (futura):** cada operación crítica genera una *orden firmada* que necesita dos firmas de aprobadores antes de ejecutarse; el sistema que ejecuta **verifica ambas firmas** criptográficamente, no confía en una UI.

---

## 8. Lockdown / Protección Central

> Diseño conceptual. **No implementado** (Kill Switch prohibido en esta fase).

### 8.1 Qué es

Un **servicio de estado de protección central** que define el nivel de operación permitido de la plataforma. Los componentes consultan el estado antes de operaciones sensibles; los estados restrictivos se propagan como revocación masiva.

### 8.2 Estados

| Estado | Efecto |
|---|---|
| `NORMAL` | Operación estándar |
| `ALERTA` | Logging reforzado, MFA step-up en operaciones sensibles, sesiones nuevas con TTL reducido |
| `CONTENCION` | Revocación de refresh tokens (nuevos AT no se emiten), sync offline bloqueado, exports bloqueados, deploys congelados |
| `LOCKDOWN` | Solo lectura de auditoría; toda sesión revocada; KEK-datos no se sirven (KMS deniega unwrap → los datos en reposo quedan selados); requiere two-person rule para salir |
| `RECOVERY` | Modo de reconstrucción controlada: solo cuentas break-glass, solo restore verificado, todo auditado |

### 8.3 Propiedades de diseño

- **Fail-closed:** si el servicio de lockdown no responde, los componentes asumen el estado más restrictivo compatible con seguridad (no operan a ciegas).
- **Activación protegida:** entrar a `CONTENCION`+ requiere autenticación administrativa fuerte; salir de `LOCKDOWN` requiere two-person rule.
- **No es autodestrucción:** no borra datos ni claves — congela acceso. La recuperación legítima sigue siendo posible (requisito del encargo).
- **Auditable:** toda transición de estado queda en `audit_eventos` con firmas de quienes la autorizaron.
- **Propagación:** estado consultable por backend, clientes (en sync) y el pipeline de deploy (un `LOCKDOWN` bloquea releases).

### 8.4 Qué NO hace

No destruye claves, no borra datos, no impide la recuperación. Un lockdown que destruyera la RoT haría los datos irrecuperables para el propietario legítimo — eso sería un fallo de diseño, no una defensa.

---

## 9. Recuperación ante compromiso

### 9.1 Fases

```
DETECT → CONTAIN → ERADICATE → RECOVER → VALIDATE → POST-MORTEM
```

| Fase | Acciones diseñadas |
|---|---|
| **Detect** | `audit_eventos` + señales (replay, geo imposible, sync anómalo) + attestation fallida + alerta de KMS (unwrap inusual) + integridad de artefactos |
| **Contain** | Activar `CONTENCION`/`LOCKDOWN`: revocar sesiones y refresh, congelar deploys, denegar unwrap de KEK, aislar componente afectado |
| **Eradicate** | Rebuild desde source firmado (no "limpiar" el sistema vivo); rotar credencial comprometida; eliminar persistencia del atacante |
| **Recover** | Restaurar desde backup cifrado verificado (firma + integridad) con doble aprobación; rotar claves afectadas (KEK comprometida → rewrap de DEKs; RoT solo en ceremonia); re-provisionar secretos |
| **Validate** | Verificación de integridad post-incidente: artefactos firmados, hashes de datos críticos, auditoría íntegra, sesiones legítimas reestablecidas |
| **Post-mortem** | Lección → backlog; evidencia preservada (audit append-only intacto) |

### 9.2 Escenarios concretos

| Escenario | Respuesta |
|---|---|
| Robo del repo Git | Cambiar credenciales embebidas (F-01/F-03 las elimina), el código en sí no da acceso a datos ni claves — daño limitado a propiedad intelectual |
| Compromiso de `.env` | Rotar todas las credenciales; en la arquitectura objetivo el `.env` solo tiene credenciales de invocación revocables, no claves |
| Backend comprometido | Lockdown; revocar credencial IAM del backend (mata su acceso a KEK); rebuild desde artefacto firmado; rotar `sb_secret`, `db_password` |
| PostgreSQL comprometido | Datos SENSITIVE+ indescifrables (cifrado por campo); rotar `db_password`, revisar qué se leyó vía audit |
| Backup robado | Indescifrable sin DEK-backup (cuenta separada); rotar KEK-backup por precaución |
| Cuenta admin comprometida | Least-privilege limita el daño; JIT expira; two-person rule bloquea operaciones críticas; break-glass alerta |
| Proveedor cloud comprometido | RoT en custodia separada → las claves no caen con el proveedor; migrar/recuperar desde backups fuera de ese proveedor |
| RoT comprometida | Ceremonia de recuperación: two-person + custodios; rewrap de toda la jerarquía; es el escenario más grave — por eso la RoT es lo mejor custodiado |
| Pérdida de RoT (desastre) | Backup ceremonial de la RoT en custodia de múltiples partes (ej. Shamir m-de-n entre custodios/propietario) — sin él, los datos se pierden por diseño |

### 9.3 Propiedad clave

La recuperación **legítima** siempre es posible mediante procedimiento controlado (break-glass + custodios + backups verificados). Ningún mecanismo de defensa convierte al propietario en rehén de su propio sistema.

---

## 10. Resumen de fronteras (checklist del encargo)

| Requisito | Mecanismo |
|---|---|
| Copiar código ≠ apropiarse de MELANTIA | Sin secretos en código (F-01/F-03 corregidos en backlog); releases firmados; claves en KMS |
| Copiar app móvil ≠ acceder a datos | Sin datos de valor en cliente; snapshot cifrado+firmado por dispositivo; autorización vive en servidor |
| Dispositivo comprometido ≠ plataforma | Sesión/dispositivo revocable; datos mínimos offline; device binding |
| Cuenta admin ≠ control total | Separación de roles + two-person rule + JIT + least privilege |
| Copia de PostgreSQL ≠ leer datos | Cifrado por campo/objeto; claves fuera de la BD |
| Backend comprometido ≠ claves maestras | Solo credencial IAM revocable; RoT nunca en el proceso |
| Proveedor cloud ≠ claves | RoT en HSM externo o segundo proveedor |
| Código modificado ≠ versión oficial | Firma fuera del CI; deploy verifica firma |
| Clonar app ≠ hacerse pasar por oficial | Cliente verifica firma; backend valida dispositivo registrado |
| Backup robado ≠ legible | Cifrado con DEK-backup en custodia separada |
| Intrusión detectable/contenible/recuperable | Auditoría append-only + lockdown + procedimiento de recovery |
| Recuperación legítima posible | Break-glass, two-person, backups verificados, RoT ceremonial |

---

## 11. Riesgos residuales y honestidad

- Un atacante con **acceso simultáneo** a backend + credencial IAM + datos puede descifrar mientras la credencial viva — se mitiga con lockdown rápido y TTL de credenciales, no se elimina.
- Un insider con **dos** de los roles correctos puede ejecutar operaciones críticas — la regla exige *roles distintos*, no solo dos personas.
- La verificación de firma del cliente se puede eludir en un cliente **modificado** (el atacante parchea el check). Se mitiga con validación server-side (dispositivo registrado, snapshot firmado no fabricable), pero no se promete anti-clonación perfecta.
- El cifrado por campo complica queries (búsquedas sobre campos cifrados requieren índices ciegos/HMAC — diseño pendiente detallado).
- **Nada de esto es seguridad absoluta.** Es defensa en profundidad que convierte cada compromiso único en daño acotado y recuperable.
