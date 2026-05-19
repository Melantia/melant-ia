// poligono_manager.js
// Módulo para gestionar el estado y lógica del polígono/lote

const PoligonoManager = {
  lote: JSON.parse(localStorage.getItem('lote_actual')) || { poligono: [], resultados_calculados: {} },

  getUltimaPosicionGPS() {
    return GPSUtils.posicion;
  },

  agregarVertice() {
    const gps = this.getUltimaPosicionGPS();
    if (!gps.lat || !gps.lng || !gps.utm || !gps.precision) {
      alert('Primero obtén la ubicación GPS.');
      return false;
    }
    if (gps.precision > 10) {
      alert('Señal débil. Espere unos segundos o muévase a un lugar más despejado.');
      return false;
    }
    const nuevoPunto = {
      punto_id: this.lote.poligono.length + 1,
      lat: gps.lat,
      lng: gps.lng,
      utm_x: gps.utm.x,
      utm_y: gps.utm.y,
      precision: gps.precision
    };
    this.lote.poligono.push(nuevoPunto);
    this.guardar();
    return true;
  },

  cerrarPoligono() {
    if (!this.lote.poligono || this.lote.poligono.length < 3) {
      alert('Debes capturar al menos 3 vértices.');
      return null;
    }
    let area = 0, perimetro = 0;
    for (let i = 0; i < this.lote.poligono.length; i++) {
      const p1 = this.lote.poligono[i];
      const p2 = this.lote.poligono[(i + 1) % this.lote.poligono.length];
      area += (p1.utm_x * p2.utm_y - p2.utm_x * p1.utm_y);
      const dx = p2.utm_x - p1.utm_x;
      const dy = p2.utm_y - p1.utm_y;
      perimetro += Math.sqrt(dx * dx + dy * dy);
    }
    area = Math.abs(area) / 2;
    const areaHa = area / 10000;
    this.lote.resultados_calculados = {
      area_total_m2: area,
      area_hectareas: areaHa,
      perimetro_total_m: perimetro
    };
    this.guardar();
    return this.lote.resultados_calculados;
  },

  guardar() {
    localStorage.setItem('lote_actual', JSON.stringify(this.lote));
  },

  cargar() {
    this.lote = JSON.parse(localStorage.getItem('lote_actual')) || { poligono: [], resultados_calculados: {} };
  },

  limpiar() {
    this.lote = { poligono: [], resultados_calculados: {} };
    this.guardar();
  }
};
