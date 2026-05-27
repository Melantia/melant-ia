// Módulo: Apicultura - Datos y almacenamiento
// Permite guardar y cargar labores apícolas en localStorage (simulando libro de campo)

const ApiculturaDataStore = {
  STORAGE_KEY: 'melantia_apicultura_labores',

  guardarLabor: function (labor) {
    const labores = this.cargarLabores();
    labores.push({ ...labor, fecha: new Date().toISOString() });
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(labores));
  },

  cargarLabores: function () {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  eliminarLabor: function (index) {
    const labores = this.cargarLabores();
    labores.splice(index, 1);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(labores));
  },
};

export default ApiculturaDataStore;
