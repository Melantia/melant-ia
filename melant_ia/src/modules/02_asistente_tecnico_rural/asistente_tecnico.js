// Lógica para el Módulo 2: Asistente Técnico Rural
const AsistenteTecnico = {
  // Carga los datos específicos de cacao (o cualquier cultivo futuro)
  async cargarDatosTrazabilidad(cultivo) {
    try {
      const response = await fetch(
        `./src/modules/asistente_tecnico_rural/data/trazabilidad_${cultivo}.json`
      );
      return await response.json();
    } catch (error) {
      console.error('Error cargando la bitácora de cacao:', error);
    }
  },

  // Genera el objeto de datos para el QR (Paso 4 de su informe)
  generarDatosQR(loteId, productor) {
    return `MELANTIA-CACAO-${loteId}-${productor}`;
  },
};
