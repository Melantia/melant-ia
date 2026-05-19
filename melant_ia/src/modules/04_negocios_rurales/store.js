// Módulo Tienda (store)
const Store = {
  init() {
    this.render();
  },
  render() {
    const view = document.getElementById('view-store');
    if (view) {
      view.innerHTML = `
        <h1 style="font-size:22px;margin-bottom:10px;">Tienda Melant</h1>
        <p style="color:var(--fg-muted);font-size:14px;margin-bottom:24px;">Publica tus productos y consulta la comisión que cobra MELANT IA.</p>
        <div class="store-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:18px;">
          <div class="card">
            <h3 style="margin-bottom:8px;">Ejemplo de Producto</h3>
            <p style="color:var(--fg-muted);font-size:13px;">Descripción breve del producto.</p>
            <div style="margin:10px 0 6px 0;font-size:13px;">
              <span class="tag-melant"><i class="fa-solid fa-certificate"></i> Comisión: 3%</span>
            </div>
            <div style="font-size:15px;font-weight:700;margin-top:8px;">$0.00</div>
          </div>
        </div>
      `;
    }
  },
  // Aquí se puede agregar lógica para agregar productos, editar, eliminar, etc.
};

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('view-store')) Store.init();
});
