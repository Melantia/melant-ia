module.exports = {
  formularios_entrevista: {
    INVASION_TIERRAS: [
      {
        id: 'FECHA_EVENTO',
        pregunta: '¿Cuándo se dio cuenta de la invasión?',
        tipo: 'fecha',
      },
      {
        id: 'TIPO_CULTIVO',
        pregunta: '¿Qué cultivo hay en el área afectada? (Ej: Cacao, Palma)',
        tipo: 'texto',
      },
      {
        id: 'DETALLES_INVASION',
        pregunta: '¿Cuántas personas aprox. ingresaron y tienen armas?',
        tipo: 'texto_largo',
      },
    ],
    ROBO_INSUMOS: [
      {
        id: 'OBJETOS_ROBADOS',
        pregunta: '¿Qué objetos o animales faltan? (Sea específico)',
        tipo: 'texto_largo',
      },
      {
        id: 'VALOR_APROX',
        pregunta: '¿Cuál es el valor estimado de lo perdido? ($)',
        tipo: 'numero',
      },
      {
        id: 'SOSPECHOSOS',
        pregunta: '¿Vio a alguien o encontró huellas/rastros?',
        tipo: 'texto',
      },
    ],
    COMPRAVENTA_BIENES: [
      {
        id: 'DESCRIPCION_DEL_BIEN',
        pregunta:
          '¿Qué está vendiendo? (Ej: Terreno de 2 hectáreas, Camioneta Luv D-Max)',
        tipo: 'texto',
      },
      {
        id: 'VALOR_VENTA',
        pregunta: '¿Cuál es el precio final acordado?',
        tipo: 'numero',
      },
      {
        id: 'FORMA_PAGO',
        pregunta:
          '¿Cómo le van a pagar? (Ej: Efectivo, Transferencia, 50% ahora y 50% en 3 meses)',
        tipo: 'texto',
      },
      {
        id: 'NOMBRE_COMPRADOR',
        pregunta: 'Escriba el nombre completo del comprador:',
        tipo: 'texto',
      },
    ],
  },
};
