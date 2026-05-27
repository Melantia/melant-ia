// Monte su Tienda — Tienda Virtual del Usuario
// Lógica para que el usuario cree, gestione y promocione su propia tienda virtual

export const TiendaUsuario = {
  // Crear tienda virtual (simulado)
  crearTienda(usuario) {
    // Aquí se integraría con backend o Supabase
    if (!usuario || !usuario.nombre)
      return { ok: false, error: 'Usuario no válido' };
    // Simulación: asignar link único
    const link = `https://melantia.app/tienda/${encodeURIComponent(usuario.nombre)}`;
    return { ok: true, link };
  },

  // Obtener link compartible de la tienda
  obtenerLinkTienda(usuario) {
    if (!usuario || !usuario.nombre) return null;
    return `https://melantia.app/tienda/${encodeURIComponent(usuario.nombre)}`;
  },

  // Publicar producto en la tienda del usuario
  publicarProducto(usuario, producto) {
    // Aquí se integraría con Supabase o backend
    if (!usuario || !usuario.nombre || !producto) return { ok: false };
    // Simulación: guardar en localStorage
    const key = `tienda_${usuario.nombre}_productos`;
    const productos = JSON.parse(localStorage.getItem(key) || '[]');
    productos.push(producto);
    localStorage.setItem(key, JSON.stringify(productos));
    return { ok: true };
  },

  // Listar productos publicados
  listarProductos(usuario) {
    if (!usuario || !usuario.nombre) return [];
    const key = `tienda_${usuario.nombre}_productos`;
    return JSON.parse(localStorage.getItem(key) || '[]');
  },

  // Compartir link de la tienda por WhatsApp
  compartirPorWhatsApp(usuario) {
    const link = this.obtenerLinkTienda(usuario);
    if (!link) return;
    const mensaje = `¡Visita mi tienda virtual en MELANTIA y conoce mis productos! ${link}`;
    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank', 'noopener');
  },
};
