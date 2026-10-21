# MATRIZ DE MIGRACIÓN DEL PATRIMONIO MELANTIA

Fuente: Matriz Maestra (Bloques 1 + 2). IDs estables definidos en `BACKLOG_MIGRACION.md`.

Columnas: ID | Patrimonio | Tipo | Módulo | Destino | Prioridad | Dependencias | Riesgo | Criterio de aceptación (resumen — detalle en `CRITERIOS_ACEPTACION_MIGRACION.md`)

## P0 — Crítico (gates antes de cualquier limpieza/migración)

| ID | Patrimonio | Tipo | Módulo | Destino | Pri | Dependencias | Riesgo | Criterio de aceptación |
|---|---|---|---|---|---|---|---|---|
| MIG-001 | Credencial Supabase expuesta (`supabase_config.js` respaldo) | configuración | Transversal | REVISAR | P0 | Tarea de rotación separada | Fuga de acceso a bucket `melantia-trazabilidad` | Credencial rotada o verificada inofensiva; histórico saneado o acotado |
| MIG-002 | Conflictos de reglas de negocio (comisiones, Melantios, planes) | lógica | 01/04/10 | REVISAR | P0 | Decisión humana | Migrar regla equivocada | Cada conflicto con DECISIÓN registrada en `CONFLICTOS_Y_DECISIONES.md` |
| MIG-003 | `cultivos_consolidado.json` | dato consolidado | 02 | REVISAR | P0 | Revisión humana | Promover sin validar | Validación humana + pérdida=0 reconfirmada |

## P1 — Alta prioridad

| ID | Patrimonio | Tipo | Módulo | Destino | Pri | Dependencias | Riesgo | Criterio de aceptación |
|---|---|---|---|---|---|---|---|---|
| MIG-010 | `gps_utils.py` + `gps_logic.py` + `plano_linderos.py` + `plano_svg.py` | algoritmo | 03 | MIGRAR | P1 | PostgreSQL levantamientos (existe) | Adaptación UTM/SVG | Distancia/área/UTM reproducen casos históricos |
| MIG-011 | `gps_medicion_terrenos.js` + `polygon_manager/` | funcionalidad | 03 | MIGRAR | P1 | MIG-010 | UI legacy | Paridad funcional de medición |
| MIG-012 | `modulo11_logica.js` (compresión→upload evidencias) | funcionalidad | 11 | MIGRAR | P1 | Decisión de storage (BLOQ-01) | Depende de Supabase histórico | Evidencia comprimida, íntegra, trazable en storage actual |
| MIG-013 | `supervivencia.py` (evidencia offline) | lógica | 11/Transversal | MIGRAR | P1 | M2 offline (MIG-020) | — | Cola offline funcional y recuperable |
| MIG-014 | `ingesta_laboratorio.py` | algoritmo | 02 | MIGRAR | P1 | Esquema PG de análisis (no existe aún) | Sin destino definido | Diagnóstico/alertas por fila reproducidos |
| MIG-015 | `gestion_sanitaria.py` | lógica | 02/03 | MIGRAR | P1 | Entidad animal en schema actual | Modelo de datos | Validaciones arete/vacuna preservadas |
| MIG-016 | `agricultura_digital/` (bioclimatología, telemetría, sensores, vision prompts) | algoritmo+conocimiento | 02 | MIGRAR | P1 | Revisión por elemento | Heterogéneo | Cada subelemento con trazabilidad propia |
| MIG-017 | `trazabilidad_manager.py` + `trazabilidad_{cacao,cafe}.json` + `finca_ejemplo.json` | lógica+dato | 03 | CONSOLIDAR+MIGRAR | P1 | Modelo finca actual | Fases vs modelo actual | Fases conservadas íntegras en destino |
| MIG-018 | `generador_qr_productor.py` | funcionalidad | 03/11 | MIGRAR | P1 | PostgreSQL (era SQLite) | Reescritura de acceso datos | PDF QR con datos equivalentes desde PG |
| MIG-019 | `rastreo_trayecto_melantia.py` | lógica | 04 | MIGRAR | P1 | Cola sync (MIG-020) | — | Cola + sincronización verificadas |
| MIG-020 | `indexeddb_sync.js` + `utils_sync.js` + service workers (3 versiones) | funcionalidad | Transversal | MIGRAR | P1 | Estrategia offline actual | 3 versiones divergentes | Una estrategia offline unificada documentada |
| MIG-021 | Conocimiento veterinario (~200 `.md` + `asistente_veterinario*.json`) | conocimiento | 02 | CONSOLIDAR | P1 | Patrón consolidado Bloque 1 | Volumen | Pérdida=0, fuentes rastreadas |
| MIG-022 | Manuales `.txt` (~40: plagas, bioinsumos, caldo bordelés, muestreo) | conocimiento | 02 | CONSOLIDAR | P1 | Patrón Bloque 1 | No-JSON → schema | Todo texto preservado y clasificado |
| MIG-023 | `pasarela_garantia_melantia.py` (escrow) | lógica de negocio | 04/10 | MIGRAR | P1 | CONF-01 resuelto; proveedor pagos (inexistente) | Comisión histórica ≠ actual | Flujo escrow con parámetros actuales |
| MIG-024 | `validador_cedula.js` | algoritmo | Transversal/04 | MIGRAR | P1 | — | — | Casos EC válidos/inválidos cubiertos |
| MIG-025 | `buscador_escuela_campo.py` | algoritmo | 07 | MIGRAR | P1 | Corpus escuela consolidado (E1) | — | Búsqueda con relevancia equivalente |
| MIG-026 | Conocimiento regenerativo escuela (`manuales_escuela_regenerativa/` + cursos) | conocimiento | 07 | CONSOLIDAR | P1 | Patrón Bloque 1 | — | Pérdida=0 |
| MIG-027 | `generador_documentos_legales.py` (solo respaldo) | funcionalidad | 08/12 | MIGRAR | P1 | Plantillas EC (legal_data) | — | Documento generado desde plantilla |
| MIG-028 | `generar_contrato_carbono_pdf.py` + `reporte_carbono_qr.js` | funcionalidad | 06 | MIGRAR | P1 | pdf_generator/ | — | Contrato/reporte reproducibles |
| MIG-029 | Salud preventiva (`botiquin_casero`, `ficha_medica`, `guia_primeros_auxilios`, `asistente_salud*`, `diagnostico_salud_vision`) | conocimiento+funcionalidad | 09 | CONSOLIDAR+REVISAR | P1 | Consolidación E1 | Contenido sanitario | Pérdida=0 en conocimiento |
| MIG-030 | `DiagnosticoCacao.json` + `tecnico/diagnostico.js` + `algoritmo_triaje_ia.json` | lógica diagnóstico | 02 | MIGRAR (como lógica) | P1 | Motor de reglas destino | No es dato de cultivo | Reglas ejecutables equivalentes |

## P2 — Media prioridad

| ID | Patrimonio | Tipo | Módulo | Destino | Pri | Dependencias | Riesgo | Criterio de aceptación |
|---|---|---|---|---|---|---|---|---|
| MIG-040 | `economia_melantia.js` + `economy/` + `economy_melantios.js` + `moneda_virtual_melantios.js` + `melantio_ui.js` | lógica de negocio | 04/10 | REVISAR→MIGRAR | P2 | CONF-02..CONF-06 | Reglas internas contradictorias | Reglas aprobadas implementadas |
| MIG-041 | `mercado_platano.{js,py,controller.js}` + raíz | funcionalidad | 04 | MIGRAR | P2 | Escrow (MIG-023), persistencia | — | Marketplace funcional |
| MIG-042 | `sistema_afiliados.js` + `afiliados_controller.js` + `negocio_afiliados.js` + `planes_beneficios.js` | lógica | 01 | MIGRAR | P2 | CONF-07 (planes) | Precios divergentes | Reglas acordadas |
| MIG-043 | `auth_suscripciones_unificado.py` | lógica | 01 | MIGRAR | P2 | CONF-07; auth actual ya existe | Sobrescritura indebida | Solo brecha vs auth actual |
| MIG-044 | Servicios financieros (`solicitar_microcredito`, `integracion_bancos_cooperativas`, `transferencias_movimientos`, `onboarding_kyc`, `apertura_cuenta_digital`) | funcionalidad | 10 | REVISAR | P2 | Proveedores reales inexistentes | Specs sin adapters | Requisitos documentados |
| MIG-045 | Finanzas personales (`termometro_financiero`, `grafica_ingresos_gastos`, `historial_estado_cuenta`, `registro_financiero_inteligente`, `simulacion_perfil_financiero`, `gestion_pagos_beneficios`) | funcionalidad | 12 | REVISAR | P2 | Schema PG finanzas | — | Funcionalidad mapeada |
| MIG-046 | Comunidad (`optimizacion_comunidad`, `ciudadano_rural`, `legal_data`, `protection_measures`, `socio_identity`, `walkie_talkie`, `multiuser_panel`) | funcionalidad | 08 | REVISAR | P2 | — | — | Valor evaluado por elemento |
| MIG-047 | `mercado` auxiliares: `generarFacturaEcuador`, `tienda_sello_reputacion`, `tienda_controller.py`, `seleccion_estilo_tienda.py`, `monte_tienda_virtual.js` | funcionalidad | 04 | REVISAR | P2 | MIG-041 | — | — |
| MIG-048 | `oportunidades_publicas.js`, `ingesta_ocds_contrataciones.py`, `procesar_ocds_a_sqlite.py`, `ingesta_api_gobec.py`, `ingesta_sipa_agrocalidad.py` | lógica ingesta | 04/02 | MIGRAR | P2 | PG (era SQLite) | Fuentes externas | Ingesta reproducible |
| MIG-049 | IA (`chatbot_melantia`, `ejecutar_asistente`, `bridge_ia`, `paulette_ia`, `gestor_voces`, `voice_control`, `valentina_voice`, `mando_voz_gps`, `resumen_voz`, `asistente_visual`) | funcionalidad | Transversal | REVISAR | P2 | Stack IA actual (OpenRouter ya integrado) | Difuso | Correspondencia con servicios actuales |
| MIG-050 | `clima_inteligente.js`, `consejos_alertas.js`, `alarma_aguila.js`, `websocket_alertas.js`, `notificaciones.*` | funcionalidad | Transversal/02 | REVISAR | P2 | Canal de alertas actual | — | — |
| MIG-051 | Cultura (`don_eloy_wisdom`, `noticias_don_eloy`, `diccionario_intercultural`, `proyectos_memoria_viva`, saberes/folklore en seeds) | conocimiento | 06/08 | CONSOLIDAR | P2 | Patrón Bloque 1 | Disperso | Pérdida=0 |
| MIG-052 | `bioremediation_engine.py` | algoritmo | 02 | MIGRAR | P2 | — | Nicho | Dosificación reproducida |
| MIG-053 | `tablas_control_palmas.sql` | dato/esquema | 02/03 | CONSOLIDAR→PG | P2 | Schema actual | SQLite→PG | Tablas portadas y verificadas |
| MIG-054 | `emprendedor*` (05), `emprendimientos.js`, `gestion_empresarial.js`, `bienes_raices*` | funcionalidad | 05 | REVISAR | P3 | — | Bajo detalle | Evaluación pendiente |

## P3 — Baja / evaluación diferida

| ID | Patrimonio | Tipo | Módulo | Destino | Pri |
|---|---|---|---|---|---|
| MIG-060 | `data/` (ejemplos, `modulos_usuario.json`, `perfil_usuario.json`) | dato muestra | — | MANTENER HISTÓRICO | P3 |
| MIG-061 | Pantallas Kivy (`main.kv`, `registro.kv`, `robot_val.kv`, `ruta.kv`, `screenqr.kv`, `ferias.kv`, `emprendedor.kv`) | funcionalidad UI legacy | — | MANTENER HISTÓRICO | P3 |
| MIG-062 | Pipeline tools (`limpiar_markdown_knowledge_seeds`, `procesar_bibliografia_json`, `descarga_masiva_bibliografia`, `convertidor`, `actualizar_cerebro`, `cargar_modulos`, `optimizar_dataset`, `instalar_librerias`, `ejecutar_asistente`, `menu_principal_con_asesor`, `notificaciones.py`, `test_alertas.py`, `TEST_FIDELIDAD_12_12.js`) | lógica (herramientas) | Transversal | MANTENER HISTÓRICO | P3 |
| MIG-063 | `App.jsx`, `package-lock.json`, `__init__.py.py`, schemas/, reports/ | varios | — | REVISAR | P3 |

## P4 — Conservación / descartables pendientes

| ID | Patrimonio | Tipo | Destino | Pri | Justificación |
|---|---|---|---|---|---|
| MIG-070 | Árbol paralelo `knowledge_seeds/asistente_tecnico_rural/` (816 dup por contenido) | duplicado | MANTENER HISTÓRICO | P4 | Valor de procedencia de rutas |
| MIG-071 | `main_controller_BANK.js`, `.deleted`, `.pyc`, `.md"` ×70 (0B), `modelo_ligero.tflite` (0B), stub 2B `backup_practicas_*.json` | histórico/corrupto | DESCARTABLE_PENDIENTE | P4 | Solo tras verificación final de contenido único = 0 |
| MIG-072 | `.venv/`, `node_modules/`, `fotos_melantias/`, `biblioteca_grafica/` (~55k archivos) | dependencias/activos | MANTENER HISTÓRICO | P4 | Volumen; decisión de limpieza separada |

## Resumen de conteo

| Destino | Items |
|---|---|
| MIGRAR | 18 |
| CONSOLIDAR | 5 |
| REVISAR | 12 |
| DOCUMENTAR | (incluido en backlog como MIG-064: `system_prompt`, `sistema_diseno`, `app_structure`) |
| MANTENER HISTÓRICO | 3 grupos |
| DESCARTABLE_PENDIENTE | 1 grupo |
