// Módulo: Gestión de Fincas y Trazabilidad
// Funciones y lógica de gestión de fincas, trazabilidad y empresarial

window.MelantiaGestionFincasTrazabilidad = {
  abrirPanel: function () {
    // Renderiza el panel principal con las opciones de submódulos
    const panel = document.getElementById('panel-novedades') || document.body;
    panel.innerHTML = `
      <div class="panel-fincas-trazabilidad" style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.10);padding:32px 24px;">
        <h2 style='color:#276749;margin-bottom:8px;'>Gestión de Fincas y Trazabilidad</h2>
        <ul style='padding-left:20px;'>
          <li><button onclick=\"MelantiaGestionFincasTrazabilidad.abrirFincas()\">Gestión de Fincas</button></li>
          <li><button onclick=\"MelantiaGestionFincasTrazabilidad.abrirCacao()\">Trazabilidad Digital del Cacao</button></li>
          <li><button onclick=\"MelantiaGestionFincasTrazabilidad.abrirCafe()\">Trazabilidad Digital del Café</button></li>
          <li><button onclick=\"MelantiaGestionFincasTrazabilidad.abrirGranjas()\">Trazabilidad de Granjas</button></li>
          <li><button onclick=\"MelantiaGestionFincasTrazabilidad.abrirApicultura()\">Manejo de Apicultura</button></li>
          <li><button onclick=\"MelantiaGestionFincasTrazabilidad.abrirEmpresarial()\">Gestión Empresarial</button></li>
        </ul>
          abrirApicultura: function () {
            import('./manejo_apicultura.js').then((mod) => {
              (mod.default || window.MelantiaManejoApicultura).mostrarPanel();
            });
          },
        <button onclick=\"window.volverAlMenuPrincipal()\" style=\"margin-top:24px;background:#276749;color:#fff;padding:10px 28px;border:none;border-radius:8px;font-size:1em;cursor:pointer;\">Volver al menú principal</button>
      </div>
    `;
  },
  abrirFincas: function () {
    import('./gestion_fincas.js').then((mod) => {
      (mod.default || window.GestionFincasMelantia).mostrarPanelFincas();
    });
  },
  abrirCacao: function () {
    import('./trazabilidad_cacao.js').then((mod) => {
      (mod.default || window.MelantiaTrazabilidadCacao).mostrarPanel();
    });
  },
  abrirCafe: function () {
    import('./trazabilidad_cafe.js').then((mod) => {
      (mod.default || window.MelantiaTrazabilidadCafe).mostrarPanel();
    });
  },
  abrirGranjas: function () {
    import('./trazabilidad_granjas.js').then((mod) => {
      (mod.default || window.MelantiaTrazabilidadGranjas).mostrarPanel();
    });
  },
  abrirEmpresarial: function () {
    import('./gestion_empresarial.js').then((mod) => {
      (mod.default || window.MelantiaGestionEmpresarial).mostrarPanel();
    });
  },
};

// Si se carga el módulo directamente, abrir el panel
if (typeof window !== 'undefined' && window.location.hash === '#fincas') {
  window.MelantiaGestionFincasTrazabilidad.abrirPanel();
}
