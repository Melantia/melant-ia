// Manejador de Seguridad para el Asesor Legal
const securityLayer = {
  // Pin de 4 dígitos para ver denuncias guardadas
  vaultPin: '1234',

  // Función de pánico: Si se activa, oculta la sección legal
  // y muestra una pantalla inofensiva de "Clima" o "Precios de Cacao"
  triggerPanicMode: function () {
    console.log('Activando Pantalla de Camuflaje...');
    // Lógica para cambiar la interfaz a una tabla de precios agrícola
    return 'interfaz_precios_cacao.html';
  },

  // Encriptación simple offline para los archivos .txt de las denuncias
  encryptData: function (texto) {
    // Esto evita que si alguien abre el archivo desde el explorador, lea el contenido
    return Buffer.from(texto).toString('base64');
  },
};
