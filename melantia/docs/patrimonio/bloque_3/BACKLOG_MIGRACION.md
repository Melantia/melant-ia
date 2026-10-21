# BACKLOG DE MIGRACIÓN DEL PATRIMONIO MELANTIA

IDs estables. Orden: P0 → P4. Nada de este backlog está en ejecución.

Formato por elemento: ID / Elemento / Fuente / Tipo / Módulo / Descripción / Estado actual / Destino / Prioridad / Dependencias / Bloqueadores / Conflictos / Riesgo / Criterio de aceptación / Pruebas futuras / Observaciones.

---

## P0 — Gates

### MIG-001
- **Elemento**: Credencial Supabase en histórico
- **Fuente**: `melantia_old_version/respaldo_melantia/melant_ia/src/database/supabase_config.js`
- **Tipo**: Configuración (secreto expuesto)
- **Módulo**: Transversal
- **Descripción**: `anonKey` publishable real + URL de proyecto + bucket `melantia-trazabilidad`
- **Estado actual**: IDENTIFICADO
- **Destino**: REVISAR (tarea de seguridad separada)
- **Prioridad**: P0
- **Dependencias**: ninguna
- **Bloqueadores**: —; **bloquea**: exposición/limpieza del histórico
- **Conflictos**: CONF-09 (el archivo gemelo en old_version contiene Python mal nombrado)
- **Riesgo**: acceso a bucket histórico; filtrado en difusión del repo
- **Criterio de aceptación**: credencial rotada o verificada inofensiva; histórico saneado antes de cualquier publicación
- **Pruebas futuras**: verificación de validez de la clave (por el usuario, fuera de este plan)
- **Observaciones**: NO rotar desde este bloque; clave nunca impresa en documentación

### MIG-002
- **Elemento**: Decisiones de reglas de negocio
- **Fuente**: `CONFLICTOS_Y_DECISIONES.md` CONF-01..07
- **Tipo**: Lógica de negocio
- **Módulo**: 01/04/10
- **Estado actual**: PENDIENTE_DECISIÓN
- **Destino**: REVISAR → decisión documentada
- **Prioridad**: P0
- **Bloqueadores**: requiere decisión humana
- **Riesgo**: migrar regla histórica incorrecta
- **Criterio de aceptación**: cada CONF-* con DECISIÓN ACTUAL registrada
- **Pruebas futuras**: pruebas de reglas tras migración

### MIG-003
- **Elemento**: `cultivos_consolidado.json`
- **Fuente**: `backend/modules/asistente_tecnico/knowledge/consolidado/` (Bloque 1)
- **Tipo**: Dato consolidado
- **Módulo**: 02
- **Estado actual**: PATRIMONIO CONSOLIDADO PENDIENTE DE VALIDACIÓN
- **Destino**: REVISAR → promoción posterior
- **Prioridad**: P0
- **Conflictos**: CONF-08 (2 campos plátano)
- **Criterio de aceptación**: aprobación humana + verificación pérdida=0 re-ejecutada
- **Pruebas futuras**: comparación automática fuentes↔consolidado; carga por servicio conocimiento tras promoción

---

## P1 — Alta prioridad

### MIG-010 — GPS/UTM y planos
- **Fuente**: `src/gps_utils.py`; `knowledge_seeds/.../agricultura_digital/gps/{gps_logic,plano_linderos,plano_svg}.py`
- **Tipo**: Algoritmo | **Módulo**: 03 | **Destino**: MIGRAR | **Prioridad**: P1
- **Descripción**: `GPSManager`: distancia haversine, lat/lon→UTM, área poligonal, `generar_plano_finca` SVG, MockGPS
- **Dependencias**: módulo levantamientos actual (existe schema) | **Bloqueadores**: ninguno
- **Riesgo**: portado UTM | **Estado**: LISTO_PARA_MIGRAR
- **Criterio**: casos históricos reproducidos (distancia, área, UTM, SVG)
- **Pruebas**: lat/lon→UTM, distancia, área polígono, casos límite (cruce de zona UTM)

### MIG-011 — Medición de terrenos UI
- **Fuente**: `src/modules/gps_medicion_terrenos.js`, `src/modules/polygon_manager/`
- **Tipo**: Funcionalidad | **Módulo**: 03 | **Destino**: MIGRAR | **Prioridad**: P1
- **Dependencias**: MIG-010 | **Estado**: IDENTIFICADO

### MIG-012 — Pipeline de evidencias (compresión + upload)
- **Fuente**: `src/modules/modulo11_logica.js`
- **Tipo**: Funcionalidad | **Módulo**: 11 | **Destino**: MIGRAR | **Prioridad**: P1
- **Descripción**: compresión imagen ≤500KB/1280px, upload a storage, registro en tabla
- **Bloqueadores**: BLOQ-01 (proveedor storage), BLOQ-02 (credencial)
- **Estado**: BLOQUEADO
- **Criterio**: evidencia comprimida, con hash/integridad, recuperable, auditable

### MIG-013 — Supervivencia offline
- **Fuente**: `src/utils/supervivencia.py`
- **Tipo**: Lógica | **Módulo**: Transversal/11 | **Destino**: MIGRAR | **Prioridad**: P1
- **Descripción**: `guardar_evidencia_offline` (máx 100), modo nocturno, verificación celular, proceso seguro
- **Dependencias**: MIG-020 | **Estado**: LISTO_PARA_MIGRAR

### MIG-014 — Ingesta de laboratorio
- **Fuente**: `src/modules/ingesta_laboratorio.py`
- **Tipo**: Algoritmo | **Módulo**: 02 | **Destino**: MIGRAR | **Prioridad**: P1
- **Descripción**: procesa análisis de suelo/foliar/entomología; clasifica columnas por rangos; `_diagnostico_fila`, `_alertas_fila`, `normalizar_nutrientes`
- **Dependencias**: esquema PG para resultados de laboratorio (por definir)
- **Estado**: IDENTIFICADO | **Riesgo**: sin destino de datos definido

### MIG-015 — Gestión sanitaria ganadera
- **Fuente**: `src/modules/sanitary_management/gestion_sanitaria.py`
- **Tipo**: Lógica | **Módulo**: 02/03 | **Destino**: MIGRAR | **Prioridad**: P1
- **Descripción**: `validar_arete_qr`, `validar_fecha_vacunacion`, `validar_registro_trazabilidad_ganadera`
- **Dependencias**: entidad animal/arete en schema actual (verificar)
- **Estado**: IDENTIFICADO

### MIG-016 — Agricultura digital
- **Fuente**: `knowledge_seeds/asistente_tecnico_rural/agricultura_digital/` (19 archivos: precisión, bioclimatología, telemetría drones, sensores, visión)
- **Tipo**: Algoritmo+conocimiento | **Módulo**: 02 | **Destino**: MIGRAR (por subelemento) | **Prioridad**: P1
- **Estado**: IDENTIFICADO | **Riesgo**: heterogeneidad — revisar elemento por elemento

### MIG-017 — Trazabilidad por fases
- **Fuente**: `src/data/trazabilidad_manager.py` + `trazabilidad_{cacao,cafe}.json` + `finca_ejemplo.json`
- **Tipo**: Lógica+dato | **Módulo**: 03 | **Destino**: CONSOLIDAR+MIGRAR | **Prioridad**: P1
- **Descripción**: fases numeradas de trazabilidad por cultivo con estado y detalles
- **Estado**: IDENTIFICADO | **Criterio**: fases íntegras en destino con origen rastreado

### MIG-018 — QR de productor
- **Fuente**: `src/modules/qr_generator/generador_qr_productor.py`
- **Tipo**: Funcionalidad | **Módulo**: 03/11 | **Destino**: MIGRAR | **Prioridad**: P1
- **Descripción**: desde SQLite arma PDF con productor, fincas, animales, salud, promedios de calidad, historial clínico
- **Bloqueadores**: BLOQ-08 (SQLite→PG) | **Estado**: IDENTIFICADO
- **Criterio**: PDF equivalente generado desde PostgreSQL

### MIG-019 — Tracking de entregas offline
- **Fuente**: `src/modules/rastreo_trayecto_melantia.py`
- **Tipo**: Lógica | **Módulo**: 04 | **Destino**: MIGRAR | **Prioridad**: P1
- **Descripción**: `ColaSincronizacionRuta` + `RastreoTrayectoMelantia` (inicio, coordenadas, distancia restante, sync)
- **Dependencias**: MIG-013/020 | **Estado**: IDENTIFICADO

### MIG-020 — Infraestructura offline/sync
- **Fuente**: `src/modules/indexeddb_sync.js`, `utils_sync.js`, `service-worker.js`, `sw-melantia.js`, `sw.js`
- **Tipo**: Funcionalidad | **Módulo**: Transversal | **Destino**: MIGRAR | **Prioridad**: P1
- **Bloqueadores**: BLOQ-07 (3 estrategias divergentes) | **Estado**: PENDIENTE_DECISIÓN
- **Criterio**: estrategia única documentada; cola de sincronización verificable

### MIG-021 — Conocimiento veterinario
- **Fuente**: `knowledge_seeds/02_asistente_tecnico_rural/asistente_medicina_veterinaria/` + `asistente_tecnico_veterinario/` (~200 `.md` semillas + JSON)
- **Tipo**: Conocimiento | **Módulo**: 02 | **Destino**: CONSOLIDAR | **Prioridad**: P1
- **Estado**: LISTO_PARA_CONSOLIDAR | **Criterio**: pérdida=0, proveniencia por semilla

### MIG-022 — Manuales técnicos `.txt`
- **Fuente**: ~40 `.txt` en `knowledge_seeds` (plagas, bioinsumos, caldo bordelés, muestreo, pitahaya, suelos)
- **Tipo**: Conocimiento | **Módulo**: 02 | **Destino**: CONSOLIDAR | **Prioridad**: P1
- **Estado**: LISTO_PARA_CONSOLIDAR | **Criterio**: texto íntegro, clasificado por dominio

### MIG-023 — Escrow / pasarela de garantía
- **Fuente**: `src/modules/pasarela_garantia_melantia.py`
- **Tipo**: Lógica de negocio | **Módulo**: 04/10 | **Destino**: MIGRAR | **Prioridad**: P1
- **Descripción**: depósito→RETENIDO_GARANTIA→doble confirmación (OK+foto)→liquidación neta
- **Bloqueadores**: BLOQ-04 (comisión, proveedor pagos) | **Conflictos**: CONF-01
- **Estado**: BLOQUEADO
- **Pruebas**: creación, retención, doble confirmación, evidencia, liquidación, cancelación, disputa

### MIG-024 — Validador de cédula EC
- **Fuente**: `src/modules/negocios_rurales/validador_cedula.js`
- **Tipo**: Algoritmo | **Módulo**: Transversal | **Destino**: MIGRAR | **Prioridad**: P1
- **Estado**: LISTO_PARA_MIGRAR | **Pruebas**: dígitos verificadores válidos/inválidos, provincias

### MIG-025 — Buscador Escuela de Campo
- **Fuente**: `src/utils/buscador_escuela_campo.py`
- **Tipo**: Algoritmo | **Módulo**: 07 | **Destino**: MIGRAR | **Prioridad**: P1
- **Descripción**: indexa fragmentos de cursos, `_calcular_puntaje` por palabra clave, render acotado
- **Dependencias**: MIG-026 (corpus) | **Estado**: IDENTIFICADO

### MIG-026 — Conocimiento regenerativo / cursos escuela
- **Fuente**: `manuales_escuela_regenerativa/` + cursos en `knowledge_seeds`
- **Tipo**: Conocimiento | **Módulo**: 07 | **Destino**: CONSOLIDAR | **Prioridad**: P1
- **Estado**: LISTO_PARA_CONSOLIDAR

### MIG-027 — Generador de documentos legales
- **Fuente**: `respaldo/.../modules/08_comunidad_virtual/generador_documentos_legales.py` (solo respaldo)
- **Tipo**: Funcionalidad | **Módulo**: 08/12 | **Destino**: MIGRAR | **Prioridad**: P1
- **Descripción**: plantillas oficiales EC (denuncia de pérdida, etc.), entrada por voz, QR descargable
- **Dependencias**: `legal_data/` plantillas | **Estado**: IDENTIFICADO

### MIG-028 — Contratos/reportes de carbono
- **Fuente**: `src/modules/evidencias_documentos/generar_contrato_carbono_pdf.py`, `src/modules/reporte_carbono_qr.js`, ejemplo `.html`
- **Tipo**: Funcionalidad | **Módulo**: 06 | **Destino**: MIGRAR | **Prioridad**: P1
- **Estado**: IDENTIFICADO

### MIG-029 — Salud preventiva
- **Fuente**: `botiquin_casero.js`, `ficha_medica.js`, `guia_primeros_auxilios.js`, `asistente_salud*.js`, `diagnostico_salud_vision.js`, `modulo_salud.js`
- **Tipo**: Conocimiento+funcionalidad | **Módulo**: 09 | **Destino**: CONSOLIDAR+REVISAR | **Prioridad**: P1
- **Estado**: IDENTIFICADO

### MIG-030 — Diagnóstico y triaje
- **Fuente**: `DiagnosticoCacao.json` (fuzzy_rules), `src/modules/tecnico/diagnostico.js`, `algoritmo_triaje_ia.json`
- **Tipo**: Lógica | **Módulo**: 02 | **Destino**: MIGRAR como lógica (no como dato) | **Prioridad**: P1
- **Estado**: IDENTIFICADO | **Observación**: separar reglas de configuración de sync

---

## P2 — Media prioridad

### MIG-040 — Motor Melantios
- **Fuente**: `economia_melantia.js`, `economy/`, `economy_melantios.js`, `moneda_virtual_melantios.js`, `melantio_ui.js`
- **Tipo**: Lógica de negocio | **Módulo**: 04/10 | **Destino**: REVISAR→MIGRAR | **Prioridad**: P2
- **Bloqueadores**: BLOQ-03 | **Conflictos**: CONF-02..06 | **Estado**: BLOQUEADO
- **Pruebas**: acumulación, cascada, canje, retiro, crédito, estados, límites, vencimientos

### MIG-041 — Mercado plátano → bolsa agropecuaria
- **Fuente**: `src/modules/mercado_platano.{js,py,controller.js}`, `src/mercado_platano_controller.js`
- **Tipo**: Funcionalidad | **Módulo**: 04 | **Destino**: MIGRAR (adaptar a bolsa agropecuaria) | **Prioridad**: P2
- **Dependencias**: MIG-023 escrow | **Estado**: IDENTIFICADO

### MIG-042 — Sistema de afiliados
- **Fuente**: `sistema_afiliados.js`, `afiliados_controller.js`, `negocio_afiliados.js`, `planes_beneficios.js`, `helpers_estado.js`, `contenido_panel_html.js`
- **Tipo**: Lógica+funcionalidad | **Módulo**: 01 | **Destino**: MIGRAR | **Prioridad**: P2
- **Bloqueadores**: CONF-07 | **Estado**: BLOQUEADO

### MIG-043 — Suscripciones históricas
- **Fuente**: `auth_suscripciones_unificado.py` (2 versiones), `gestion_suscripciones.js`, `planes_pagos.js`, `pagos.js`, `config_pagos_melantia.js`, `verificador_pago.js`
- **Tipo**: Lógica de negocio | **Módulo**: 01 | **Destino**: MIGRAR (solo brecha vs auth actual) | **Prioridad**: P2
- **Bloqueadores**: BLOQ-05, BLOQ-10 | **Conflictos**: CONF-01, CONF-07 | **Estado**: BLOQUEADO

### MIG-044 — Servicios financieros
- **Fuente**: `solicitar_microcredito.js`, `integracion_bancos_cooperativas.js`, `transferencias_movimientos.js`, `onboarding_kyc.js`, `apertura_cuenta_digital.js`, `servicios_financieros*.js`
- **Tipo**: Funcionalidad | **Módulo**: 10 | **Destino**: REVISAR | **Prioridad**: P2
- **Observación**: especificaciones sin adapters reales; KYC y flujos a documentar primero

### MIG-045 — Finanzas personales
- **Fuente**: `termometro_financiero.js`, `grafica_ingresos_gastos.js`, `historial_estado_cuenta.js`, `registro_financiero_inteligente.js`, `simulacion_perfil_financiero.js`, `gestion_pagos_beneficios.js`, `finanzas_personales*.js`
- **Tipo**: Funcionalidad | **Módulo**: 12 | **Destino**: REVISAR | **Prioridad**: P2

### MIG-046 — Comunidad virtual
- **Fuente**: `optimizacion_comunidad_melantia.py`, `ciudadano_rural.js`, `legal_data/`, `protection_measures/`, `socio_identity.js`, `walkie_talkie.js`, `multiuser_panel/`, `comunidad_virtual*/`
- **Tipo**: Funcionalidad | **Módulo**: 08 | **Destino**: REVISAR | **Prioridad**: P2
- **Nota**: `optimizacion_comunidad` implementa retención de chats 30 días — política de datos a confirmar

### MIG-047 — Tienda y facturación
- **Fuente**: `generarFacturaEcuador.js`, `tienda_sello_reputacion.js`, `tienda_controller.py`, `seleccion_estilo_tienda.py`, `monte_tienda_virtual.js`, `modulo_negocios.js`
- **Tipo**: Funcionalidad | **Módulo**: 04 | **Destino**: REVISAR | **Prioridad**: P2

### MIG-048 — Ingestas de datos públicos
- **Fuente**: `ingesta_ocds_contrataciones.py`, `procesar_ocds_a_sqlite.py`, `ingesta_api_gobec.py`, `ingesta_sipa_agrocalidad.py`, `oportunidades_publicas.js`
- **Tipo**: Lógica | **Módulo**: 04/02 | **Destino**: MIGRAR | **Prioridad**: P2
- **Bloqueadores**: BLOQ-08 (SQLite→PG) | **Estado**: IDENTIFICADO

### MIG-049 — Asistente IA / voz
- **Fuente**: `chatbot_melantia.py`, `ejecutar_asistente.py`, `bridge_ia.js`, `paulette_ia.js`, `gestor_voces_melantia.py`, `voice_control.py`, `valentina_voice.py`, `mando_voz_gps.py`, `resumen_voz.py`, `asistente_visual.py`, `staff_controller.js`
- **Tipo**: Funcionalidad | **Módulo**: Transversal | **Destino**: REVISAR | **Prioridad**: P2
- **Observación**: mapear contra `services/llm.py` actual; fallback de contingencia (`_generar_respuesta_contingencia`) tiene valor offline

### MIG-050 — Alertas y clima
- **Fuente**: `clima_inteligente.js`, `consejos_alertas.js`, `alarma_aguila.js`, `websocket_alertas.js`, `notificaciones.{py,js}`, `test_alertas.py`
- **Tipo**: Funcionalidad | **Módulo**: Transversal/02 | **Destino**: REVISAR | **Prioridad**: P2

### MIG-051 — Patrimonio cultural
- **Fuente**: `don_eloy_wisdom.js`, `noticias_don_eloy/`, `diccionario_intercultural.py`, `proyectos_memoria_viva.js`, saberes/folklore en seeds
- **Tipo**: Conocimiento | **Módulo**: 06/08 | **Destino**: CONSOLIDAR+DOCUMENTAR | **Prioridad**: P2

### MIG-052 — Bioremediación
- **Fuente**: `knowledge_seeds/.../bioclimatologia_fenologia/bioremediation_engine.py`
- **Tipo**: Algoritmo | **Módulo**: 02 | **Destino**: MIGRAR | **Prioridad**: P2

### MIG-053 — Tablas control de palmas
- **Fuente**: `knowledge_seeds/palm_control/tablas_control_palmas.sql` y `modules/palm_control/` (solo old_version)
- **Tipo**: Dato/esquema | **Módulo**: 02/03 | **Destino**: CONSOLIDAR→PostgreSQL | **Prioridad**: P2
- **Bloqueadores**: BLOQ-08 | **Estado**: IDENTIFICADO

### MIG-054 — Emprendedor y verticales
- **Fuente**: `emprendedor*.js/.kv`, `emprendimientos.js`, `gestion_empresarial.js`, `bienes_raices_rurales*.js`, `apicultura*.js`, `manejo_apicultura.js`, `rural_businesses/`
- **Tipo**: Funcionalidad | **Módulo**: 05/04 | **Destino**: REVISAR | **Prioridad**: P3

### MIG-064 — Documentación de arquitectura histórica
- **Fuente**: `system_prompt_melantia.md`, `sistema_diseno_melantia.md`, `app_structure_melant_ia.js/.json`, `main_controller.js`, `staff_controller.js`
- **Tipo**: Documentación/configuración | **Módulo**: Transversal | **Destino**: DOCUMENTAR | **Prioridad**: P2
- **Criterio**: decisiones arquitectónicas extractadas a docs; originales intactos

---

## P3 — Baja

### MIG-060 — Datos de muestra
- **Fuente**: `src/data/` (`finca_ejemplo.json`, `modulos_usuario.json`, `perfil_usuario.json`, `trazabilidad_*.json`, managers)
- **Destino**: MANTENER HISTÓRICO | **Prioridad**: P3 (excepto trazabilidad → MIG-017)

### MIG-061 — Pantallas Kivy
- **Fuente**: `*.kv` (main, registro, robot_val, ruta, screenqr, ferias, emprendedor)
- **Destino**: MANTENER HISTÓRICO | **Prioridad**: P3 — UI legacy, referencia UX

### MIG-062 — Herramientas de pipeline
- **Fuente**: `limpiar_markdown_knowledge_seeds.py`, `procesar_bibliografia_json.py`, `descarga_masiva_bibliografia.py`, `convertidor.py`, `actualizar_cerebro.py`, `cargar_modulos.py`, `optimizar_dataset.py`, `instalar_librerias.py`, `ejecutar_asistente.py`, `menu_principal_con_asesor.py`, `entrenar-ia.py`, `test_alertas.py`, `TEST_FIDELIDAD_12_12.js`
- **Destino**: MANTENER HISTÓRICO | **Prioridad**: P3 — reutilizables como referencia de pipeline

### MIG-063 — Misceláneos por clasificar
- **Fuente**: `App.jsx` (solo old_version), `package-lock.json`, `__init__.py.py`, `schemas/`, `reports/`, `registro_venta_ejemplo.py`
- **Destino**: REVISAR | **Prioridad**: P3

---

## P4 — Conservación / descartables

### MIG-070 — Árbol paralelo duplicado
- **Fuente**: `knowledge_seeds/asistente_tecnico_rural/` (816/822 duplicados por contenido)
- **Destino**: MANTENER HISTÓRICO | **Prioridad**: P4
- **Únicos reales**: `App.jsx`, `tablas_control_palmas.sql` ×2, 3 `.md` veterinarios → ya cubiertos por MIG-021/053/063

### MIG-071 — Corruptos/vacíos
- **Fuente**: 70 `.md"` (0 bytes), `modelo_ligero.tflite` (0B), stub 2B `backup_practicas_*`, `.pyc`, `main_controller_BANK.js`, `.deleted`
- **Destino**: DESCARTABLE_PENDIENTE | **Prioridad**: P4
- **Condición**: verificación final de contenido único=0 antes de cualquier eliminación futura (Bloque posterior, autorización explícita)

### MIG-072 — Dependencias y activos voluminosos
- **Fuente**: `.venv/`, `node_modules/`, `fotos_melantias/`, `biblioteca_grafica/` (~55k archivos)
- **Destino**: MANTENER HISTÓRICO | **Prioridad**: P4 — decisión de limpieza separada

---

## Conteo

| Destino | Cantidad |
|---|---|
| MIGRAR | 17 |
| CONSOLIDAR | 6 |
| REVISAR | 10 |
| DOCUMENTAR | 1 |
| MANTENER HISTÓRICO | 4 |
| DESCARTABLE_PENDIENTE | 1 |

| Prioridad | Cantidad |
|---|---|
| P0 | 3 |
| P1 | 20 |
| P2 | 15 |
| P3 | 4 |
| P4 | 3 |
