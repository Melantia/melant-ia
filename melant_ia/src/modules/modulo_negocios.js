// modulo_negocios.js
// Lógica de negocios, finanzas, tienda, suscripciones y Melantios (Don Eloy, Ángel)
// Todas las funciones expuestas globalmente en window

(function () {
  // --- Gestión de Inventarios y Tienda MELANTIA ---
  window.MelantiaTienda = {
    // Estado de inventario y ventas (ejemplo, adaptar según backend real)
    inventario: [],
    ventas: [],
    agregarProducto(producto) {
      this.inventario.push(producto);
      return producto;
    },
    registrarVenta(venta) {
      this.ventas.push(venta);
      if (window.DonEloy) window.DonEloy.hablar('¡Venta registrada!');
      return venta;
    },
    obtenerInventario() {
      return this.inventario;
    },
    obtenerVentas() {
      return this.ventas;
    },
  };

  // --- Control de Presupuestos, Finanzas Personales y Emprendimientos (Ángel) ---
  window.AngelFinanzas = {
    presupuestos: [],
    registrarPresupuesto(p) {
      this.presupuestos.push(p);
      return p;
    },
    obtenerPresupuestos() {
      return this.presupuestos;
    },
    registrarMovimiento(mov) {
      if (!this.movimientos) this.movimientos = [];
      this.movimientos.push(mov);
      return mov;
    },
    obtenerMovimientos() {
      return this.movimientos || [];
    },
  };

  // --- Sistema de Suscripciones Offline y Melantios ---
  window.Melantios = {
    config: {
      EXCHANGE_RATE: 0.01, // 1M = $0.01
      CONVERSION: 100, // 100M = $1
      MAX_PAYMENT_PCT: 0.5,
      EXPIRATION_DAYS: 90,
    },
    saldo: 0,
    historialGanancia: [],
    historialGasto: [],
    ganar(tipo, cantidad) {
      this.historialGanancia.push({
        tipo,
        cantidad,
        fecha: new Date().toISOString(),
      });
      this.saldo += cantidad;
      return this.saldo;
    },
    gastar(tipo, cantidad) {
      this.historialGasto.push({
        tipo,
        cantidad,
        fecha: new Date().toISOString(),
      });
      this.saldo -= cantidad;
      return this.saldo;
    },
    convertirADolares(melantios) {
      return (melantios * this.config.EXCHANGE_RATE).toFixed(2);
    },
    convertirAMelantios(usd) {
      return Math.floor(usd / this.config.EXCHANGE_RATE);
    },
  };

  // --- Don Eloy (voz y lógica de negocios) ---
  window.DonEloy = {
    hablar(mensaje) {
      if (window.cargarVoz) cargarVoz('Don Eloy');
      if (window._voz) _voz(mensaje);
      if (window.console) console.log('[Don Eloy]:', mensaje);
    },
  };

  // --- Ángel (voz y lógica de finanzas) ---
  window.Angel = {
    hablar(mensaje) {
      if (window.cargarVoz) cargarVoz('Angel');
      if (window._voz) _voz(mensaje);
      if (window.console) console.log('[Angel]:', mensaje);
    },
  };
})();
