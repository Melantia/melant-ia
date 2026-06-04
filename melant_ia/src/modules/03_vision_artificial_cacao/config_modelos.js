// ========================================================================
// CONFIGURACIÓN: Modelos Visión Artificial Cacao
// ========================================================================
// Este archivo define parámetros optimización, umbrales y modelos pre-entrenados

export const CONFIG_MODELOS_CACAO = {
  // Información general
  versión: '1.0',
  fecha_última_actualización: '2026-06-01',
  plataforma: 'TensorFlow.js + YOLOv8',

  // Configuración modelos
  modelos: {
    yolov8n: {
      nombre: 'YOLOv8 Nano',
      tamaño_mb: 6.2,
      velocidad_fps: 8,
      precision: 0.87,
      recomendado: true,
      descripción: 'Modelo ligero, rápido mobile/web',
      requisitos: {
        ram_mb: 50,
        gpu: 'opcional',
        tiempo_carga_ms: 800,
      },
    },
    yolov8s: {
      nombre: 'YOLOv8 Small',
      tamaño_mb: 22.5,
      velocidad_fps: 4,
      precision: 0.91,
      recomendado: false,
      descripción: 'Modelo mediano, más preciso',
      requisitos: {
        ram_mb: 120,
        gpu: 'recomendado',
        tiempo_carga_ms: 2500,
      },
    },
    coco_ssd: {
      nombre: 'COCO-SSD Pre-entrenado',
      tamaño_mb: 30,
      velocidad_fps: 6,
      precision: 0.65,
      recomendado: false,
      descripción: 'Pre-entrenado general (no específico cacao)',
      requisitos: {
        ram_mb: 80,
        gpu: 'opcional',
        tiempo_carga_ms: 1200,
      },
    },
  },

  // Clases detección
  clases: {
    0: {
      nombre: 'sano',
      etiqueta: '✅ Fruto Sano',
      color_rgb: [76, 175, 80],
      descripción: 'Fruto cacao sin síntomas visibles',
      color_predominante: ['verde', 'amarillo', 'naranja'],
      umbral_confianza_minimo: 0.7,
      acción: 'cosecha_permitida',
    },
    1: {
      nombre: 'monilia',
      etiqueta: '🦠 Monilia',
      color_rgb: [244, 67, 54],
      descripción: 'Podredumbre negra (Moniliophthora roreri)',
      síntomas: ['necrosis negra', 'putrefacción', 'micelio'],
      umbral_confianza_minimo: 0.75,
      acción: 'descartar_fruto',
    },
    2: {
      nombre: 'frosporium',
      etiqueta: '🍂 Frosporium',
      color_rgb: [255, 152, 0],
      descripción: 'Mancha foliar (Frosporium cacao)',
      síntomas: ['manchas irregulares', 'amarillamiento', 'necrosis'],
      umbral_confianza_minimo: 0.7,
      acción: 'fungicida_preventivo',
    },
    3: {
      nombre: 'trips',
      etiqueta: '🐛 Trips',
      color_rgb: [33, 150, 243],
      descripción: 'Daño de insectos (Frankliniella sp.)',
      síntomas: ['estrías', 'cicatrices', 'rugosidad'],
      umbral_confianza_minimo: 0.68,
      acción: 'insecticida_selectivo',
    },
  },

  // Parámetros procesamiento imagen
  procesamiento_imagen: {
    resolución_entrada: 320, // píxeles (320×320, 416×416, etc)
    augmentación_datos: {
      rotación_grados: [-15, 15],
      zoom: [0.8, 1.2],
      brillo: [-0.2, 0.2],
      contraste: [-0.1, 0.1],
      ruido_gauss_std: 0.05,
    },
    normalización: {
      media: [0.485, 0.456, 0.406], // RGB ImageNet
      desviación_std: [0.229, 0.224, 0.225],
    },
    umbrales: {
      confianza_global: 0.6, // mínimo detectar objeto
      iou_nms: 0.45, // Non-Maximum Suppression threshold
      iou_intersection: 0.5, // IoU entre detectados
    },
  },

  // Análisis color complementario
  analisis_color: {
    canal_rgb: true,
    canal_hsv: true,
    canal_lab: true,
    estadísticas: {
      media: true,
      varianza: true,
      percentiles: [25, 50, 75, 90],
      histograma_bins: 32,
    },
  },

  // Parámetros entrenamiento
  entrenamiento: {
    batch_size: 16,
    epochs: 100,
    learning_rate: 0.001,
    learning_rate_decay: 0.0005,
    early_stopping: {
      paciencia: 20,
      metrica: 'mAP', // mean Average Precision
      minimo_mejora: 0.001,
    },
    optimizador: 'SGD',
    momentum: 0.9,
    weight_decay: 0.0005,
    warmup_epochs: 3,
    warmup_lr_ratio: 0.1,
  },

  // Validación modelo
  validación: {
    metricas_principales: {
      precision_promedio: 0.87,
      recall_promedio: 0.82,
      f1_score: 0.845,
      mAP_50: 0.88,
      mAP_75: 0.82,
    },
    matriz_confusión_aceptable: {
      sano_predicho_monilia_max_pct: 5,
      monilia_predicho_sano_max_pct: 2,
      frosporium_predicho_sano_max_pct: 5,
      trips_predicho_sano_max_pct: 8,
    },
    dataset_validación_pct: 20,
    dataset_test_pct: 10,
  },

  // Recomendaciones acciones
  acciones_recomendadas: {
    sano: {
      acción_inmediata: 'Cosecha permitida',
      ciclo_revisión: 'Rutina regular (7 días)',
      monitoreo: 'Continuar observación',
      tratamiento: 'Ninguno',
    },
    monilia: {
      acción_inmediata: 'Descartar fruto INMEDIATAMENTE',
      ciclo_revisión: 'Revisión diaria área',
      monitoreo: 'Intensivo 5-7 días',
      tratamiento: 'Remover fruto + fungicida Metalaxil+Mancozeb',
    },
    frosporium: {
      acción_inmediata: 'No cosechar si afectado',
      ciclo_revisión: 'Revisión cada 3-5 días',
      monitoreo: 'Normal',
      tratamiento: 'Fungicida preventivo Azufre mojable',
    },
    trips: {
      acción_inmediata: 'Daño cosmético, cosecha permitida',
      ciclo_revisión: 'Revisión 7-10 días',
      monitoreo: 'Normal',
      tratamiento: 'Insecticida Spinosad si presión alta',
    },
  },

  // Análisis madurez
  madurez: {
    verde: {
      descripción: 'Fruto inmaduro',
      color_rgb_rango: {
        r: [100, 170],
        g: [130, 180],
        b: [60, 110],
      },
      dias_cosecha_estimado: 20,
      recomendación: 'NO COSECHAR. Esperar cambio color.',
    },
    maduro: {
      descripción: 'Fruto maduro óptimo',
      color_rgb_rango: {
        r: [170, 210],
        g: [120, 160],
        b: [50, 90],
      },
      dias_cosecha_estimado: 0,
      recomendación: '✅ COSECHA PERMITIDA. Calidad óptima.',
    },
    sobremadurado: {
      descripción: 'Fruto demasiado maduro',
      color_rgb_rango: {
        r: [200, 230],
        g: [80, 130],
        b: [30, 70],
      },
      dias_cosecha_estimado: -3,
      recomendación: '⚠️ Cosecha urgente para evitar caída/pudrición.',
    },
  },

  // Análisis calidad fermentación
  calidad_fermentacion: {
    excelente: {
      descripción: 'Fermentación completa uniforme',
      color_rgb_rango: {
        r: [90, 130],
        g: [60, 90],
        b: [40, 70],
      },
      uniformidad_minima: 0.9,
      recomendación: '✅ EXCELENTE. Listo venta premium.',
      precio_relativo: 1.0,
    },
    buena: {
      descripción: 'Fermentación adecuada',
      color_rgb_rango: {
        r: [110, 150],
        g: [70, 110],
        b: [50, 80],
      },
      uniformidad_minima: 0.75,
      recomendación: '✅ BUENA. Venta comercial.',
      precio_relativo: 0.92,
    },
    mediocre: {
      descripción: 'Fermentación incompleta',
      color_rgb_rango: {
        r: [130, 170],
        g: [100, 140],
        b: [60, 100],
      },
      uniformidad_minima: 0.6,
      recomendación: '⚠️ MEDIOCRE. Aumentar tiempo fermentación.',
      precio_relativo: 0.8,
    },
    pobre: {
      descripción: 'Fermentación deficiente',
      color_rgb_rango: {
        r: [150, 200],
        g: [130, 180],
        b: [80, 130],
      },
      uniformidad_minima: 0.0,
      recomendación: '❌ POBRE. Revisar proceso fermentación.',
      precio_relativo: 0.6,
    },
  },

  // Configuración cámara
  camara: {
    resolución_ideal: '1280x720',
    fps: 30,
    enfoque: 'auto',
    balance_blancos: 'auto',
    exposición: 'auto',
    orientación: 'portrait_landscape',
  },

  // Almacenaje offline
  almacenaje: {
    base_datos: 'IndexedDB',
    table_historial: 'cacao_vision_analisis',
    max_registros: 500,
    compresion_imagen: 'jpeg_quality_70',
    sincronizacion: {
      cuando_wifi: true,
      cuando_nube_disponible: true,
      intervalo_segundos: 300,
    },
  },

  // Umbrales alertas
  alertas: {
    fruto_descartable: {
      condiciones: ['monilia_detectable', 'pudrición_visible'],
      prioridad: 'CRÍTICA',
      color_alerta: '#f44336',
    },
    revisar_fermentacion: {
      condiciones: ['calidad_pobre', 'color_no_uniforme'],
      prioridad: 'ALTA',
      color_alerta: '#ff9800',
    },
    cosecha_urgente: {
      condiciones: ['sobremadurado', 'fruto_caída_próxima'],
      prioridad: 'MEDIA',
      color_alerta: '#ffc107',
    },
  },
};

// Función para obtener recomendación acción
export function obtenerRecomendacion(clase_detectada, confianza) {
  const clase =
    CONFIG_MODELOS_CACAO.clases[
      Object.keys(CONFIG_MODELOS_CACAO.clases).find(
        (k) => CONFIG_MODELOS_CACAO.clases[k].nombre === clase_detectada
      )
    ];

  if (!clase) return null;

  return {
    clase: clase.etiqueta,
    confianza: (confianza * 100).toFixed(1) + '%',
    acción:
      CONFIG_MODELOS_CACAO.acciones_recomendadas[clase.nombre].acción_inmediata,
    tratamiento:
      CONFIG_MODELOS_CACAO.acciones_recomendadas[clase.nombre].tratamiento,
    ciclo_revision:
      CONFIG_MODELOS_CACAO.acciones_recomendadas[clase.nombre].ciclo_revisión,
    urgencia:
      confianza > 0.85 ? 'CRÍTICA' : confianza > 0.7 ? 'ALTA' : 'NORMAL',
  };
}

// Función validar umbral confianza
export function validarConfianza(clase, confianza) {
  const umbral = CONFIG_MODELOS_CACAO.clases[clase].umbral_confianza_minimo;
  return confianza >= umbral;
}

// Exportar configuración
export default CONFIG_MODELOS_CACAO;
