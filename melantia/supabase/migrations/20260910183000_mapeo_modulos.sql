CREATE TABLE IF NOT EXISTS diagnostico_rutas_modulos (
    id SERIAL PRIMARY KEY,
    modulo TEXT,
    ruta_actual TEXT,
    sugerida TEXT,
    existe_sugerida TEXT
);


INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('GestiÃ³n de Suscripciones', 'modules/01_suscripciones/gestion_suscripciones', 'modules/gestion_suscripciones', 'True');
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('VisiÃ³n Artificial', 'modules/02_asistente_tecnico_rural/vision_artificial', 'modules/vision_artificial', 'True');
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('VisiÃ³n Satelital', 'modules/02_asistente_tecnico_rural/vision_satelital', 'modules/vision_satelital', 'True');
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('Salud y Medicina Veterinaria', 'modules/02_asistente_tecnico_rural/salud_medicina_veterinaria', 'modules/salud_medicina_veterinaria', 'True');
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('Clima Inteligente', 'modules/02_asistente_tecnico_rural/clima_inteligente', 'SIN_ARCHIVO', 'False');
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('GestiÃ³n de Fincas', 'modules/03_gestion_fincas_trazabilidad/gestion_fincas_trazabilidad', 'modules/gestion_fincas_trazabilidad', 'True');
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('Trazabilidad Cultivos Especiales', 'modules/03_gestion_fincas_trazabilidad/trazabilidad_cultivos_especiales', 'modules/trazabilidad_cultivos_especiales', 'True');
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('Trazabilidad de Granjas', 'modules/03_gestion_fincas_trazabilidad/trazabilidad_granjas', 'modules/trazabilidad_granjas', 'True');
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('Trazabilidad de CafÃ©', 'modules/03_gestion_fincas_trazabilidad/trazabilidad_cafe', 'modules/trazabilidad_cafe', 'True');
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('Trazabilidad de Cacao', 'modules/03_gestion_fincas_trazabilidad/trazabilidad_cacao', 'modules/trazabilidad_cacao', 'True');
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('Trazabilidad de PlÃ¡tano', 'modules/03_gestion_fincas_trazabilidad/trazabilidad_platano', 'modules/trazabilidad_platano', 'True');
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('Trazabilidad de Aguacate', 'modules/03_gestion_fincas_trazabilidad/trazabilidad_aguacate', 'modules/trazabilidad_aguacate', 'True');
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('Trazabilidad de Guanabana', 'modules/03_gestion_fincas_trazabilidad/trazabilidad_guanabana', 'modules/trazabilidad_guanabana', 'True');
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('Negocios Rurales', 'modules/04_negocios_rurales/negocios_rurales', 'modules/negocios_rurales', 'True');
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('Mercado PlÃ¡tano', 'modules/04_negocios_rurales/mercado_platano', 'modules/mercado_platano', 'True');
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('Ventas de GestiÃ³n Productiva', 'modules/04_negocios_rurales/ventas_gestion_productiva', 'modules/ventas_gestion_productiva', 'True');
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('Finanzas Personales', 'modules/05_emprendedor_finanzas_personales/finanzas_personales', 'modules/finanzas_personales', 'True');
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('Registro Financiero Inteligente', 'modules/05_emprendedor_finanzas_personales/registro_financiero_inteligente', 'modules/registro_financiero_inteligente', 'True');
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('Consejos y Alertas Financieras', 'modules/05_emprendedor_finanzas_personales/consejos_alertas', 'modules/consejos_alertas', 'True');
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('TermÃ³metro Financiero', 'modules/05_emprendedor_finanzas_personales/termometro_financiero', 'modules/termometro_financiero', 'True');
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('GrÃ¡fica Ingresos y Gastos', 'modules/05_emprendedor_finanzas_personales/grafica_ingresos_gastos', 'modules/grafica_ingresos_gastos', 'True');
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('Ciudadano Rural', 'modules/08_comunidad_virtual/ciudadano_rural', 'modules/ciudadano_rural', 'True');
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('AsesorÃ­a Legal', 'modules/08_comunidad_virtual/asesoria_legal', 'modules/asesoria_legal', 'True');
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('GuÃ­a de Primeros Auxilios', 'modules/09_asistente_preventivo_salud_rural/guia_primeros_auxilios', 'modules/guia_primeros_auxilios', 'True');
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('BotiquÃ­n Casero Inteligente', 'modules/09_asistente_preventivo_salud_rural/botiquin_casero', 'modules/botiquin_casero', 'True');
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('Ficha MÃ©dica', 'modules/09_asistente_preventivo_salud_rural/ficha_medica', 'modules/ficha_medica', 'True');
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('Apertura de Cuenta Digital', 'modules/10_servicios_financieros/apertura_cuenta_digital', 'modules/apertura_cuenta_digital', 'True');
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('Onboarding KYC', 'modules/10_servicios_financieros/onboarding_kyc', 'modules/onboarding_kyc', 'True');
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('GestiÃ³n de Pagos y Beneficios', 'modules/10_servicios_financieros/gestion_pagos_beneficios', 'modules/gestion_pagos_beneficios', 'True');
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('SimulaciÃ³n de Perfil Financiero', 'modules/10_servicios_financieros/simulacion_perfil_financiero', 'modules/simulacion_perfil_financiero', 'True');
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('Solicitar MicrocrÃ©dito', 'modules/10_servicios_financieros/solicitar_microcredito', 'modules/solicitar_microcredito', 'True');
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('Transferencias y Movimientos', 'modules/10_servicios_financieros/transferencias_movimientos', 'modules/transferencias_movimientos', 'True');
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('IntegraciÃ³n Bancos y Cooperativas', 'modules/10_servicios_financieros/integracion_bancos_cooperativas', 'modules/integracion_bancos_cooperativas', 'True');
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('Historial y Estado de Cuenta', 'modules/10_servicios_financieros/historial_estado_cuenta', 'modules/historial_estado_cuenta', 'True');
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('Registro de Evidencias FotogrÃ¡ficas', 'modules/11_evidencias_documentos/registro_evidencia_fotografica', 'modules/registro_evidencia_fotografica', 'True');
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('Carpeta de Documentos', 'modules/11_evidencias_documentos/carpeta_documentos', 'modules/carpeta_documentos', 'True');
INSERT INTO diagnostico_rutas_modulos (modulo, ruta_actual, sugerida, existe_sugerida) VALUES ('Descargar, Compartir e Imprimir', 'modules/11_evidencias_documentos/descargar_compartir_imprimir', 'modules/descargar_compartir_imprimir', 'True');