# 🪙 Guía Técnica de Implementación: Icono Melantio

**Versión:** 1.0  
**Creado:** 9 de mayo de 2026  
**Ubicación del Icono:** `/src/assets/ui/icons/melantio_gold.svg`

---

## 📋 Descripción General

El icono Melantio es la representación visual de la moneda virtual del ecosistema Melantia. Debe usarse consistentemente en toda la interfaz para mantener identidad de marca y facilitar el reconocimiento del usuario.

### Características Técnicas

- **Formato:** SVG escalable (sin pérdida de calidad)
- **Dimensiones base:** 40px × 30px
- **Color principal:** Gradiente de oro (#FDE68A → #F59E0B → #B45309)
- **Símbolo:** Letra "M" en relieve con sombra
- **Peso:** < 1KB (muy ligero, no ralentiza la app)

---

## 🎨 Especificaciones Visuales

| Atributo              | Valor                                |
| --------------------- | ------------------------------------ |
| Forma Base            | Rectángulo con border-radius: 4px    |
| Color Primario        | Gradiente Lineal (arriba-abajo)      |
| Borde                 | Stroke #B45309, width 1px            |
| Símbolo               | Letra "M" (Arial Bold, font-size 18) |
| Color Letra           | #78350F (marrón oscuro)              |
| Efecto de Profundidad | Drop Shadow + Highlight superior     |

---

## 💻 Ejemplos de Implementación

### 1. **Componente: MelantioBadge (Mostrar Saldo)**

```javascript
// Función para renderizar el badge de Melantios
function crearMelantioBadge(cantidad) {
  const svgIcon = `<img 
    src="/src/assets/ui/icons/melantio_gold.svg" 
    alt="Melantio" 
    style="width: 24px; height: 18px; display: inline; margin-right: 4px; vertical-align: middle;"
  />`;

  return `
    <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px; background: #FEF3C7; border-radius: 4px; border: 1px solid #FCD34D;">
      ${svgIcon}
      <span style="font-weight: bold; color: #78350F; font-size: 14px;">${cantidad}</span>
    </div>
  `;
}

// Uso en la interfaz
const saldoActual = 250;
document.getElementById('saldo-melantios').innerHTML =
  crearMelantioBadge(saldoActual);
```

### 2. **Botón de Canje: "Usar Melantios"**

```javascript
// Botón con icono Melantio para pagar en tienda
function crearBotonCanjemelantios(callbackFuncion) {
  return `
    <button 
      onclick="typeof ${callbackFuncion} === 'function' ? ${callbackFuncion}() : alert('Usar Melantios')"
      style="
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        background: linear-gradient(135deg, #F59E0B, #B45309);
        color: white;
        border: 1px solid #92400E;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        font-size: 14px;
        transition: all 0.3s ease;
      "
      onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 12px rgba(245, 158, 11, 0.4)';"
      onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';"
    >
      <img src="/src/assets/ui/icons/melantio_gold.svg" alt="Melantio" style="width: 20px; height: 15px;" />
      <span>Usar Melantios</span>
    </button>
  `;
}

// Uso en checkout de tienda
document.getElementById('checkout-actions').innerHTML +=
  crearBotonCanjemelantios('abrirPanelCanjemelantios');
```

### 3. **Animación de Ganancia: "Vuela" el Melantio**

```javascript
// Animación cuando el usuario gana Melantios
function animarMelantioBrillante(cantidad, elementoDestino) {
  const contenedor = document.body;

  // Crear icono volador
  const iconoVolador = document.createElement('div');
  iconoVolador.innerHTML = `<img src="/src/assets/ui/icons/melantio_gold.svg" alt="Melantio" style="width: 40px; height: 30px;" />`;
  iconoVolador.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    z-index: 9999;
    pointer-events: none;
    animation: volarMelantio 1.5s ease-out forwards;
  `;

  // Agregar animación CSS
  if (!document.getElementById('melantio-animation-styles')) {
    const styles = document.createElement('style');
    styles.id = 'melantio-animation-styles';
    styles.textContent = `
      @keyframes volarMelantio {
        0% {
          transform: translate(-50%, -50%) scale(1);
          opacity: 1;
        }
        100% {
          transform: translate(${elementoDestino.offsetLeft}px, ${elementoDestino.offsetTop}px) scale(0.5);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(styles);
  }

  contenedor.appendChild(iconoVolador);

  // Reproducir sonido de ganancia (opcional)
  reproducirSonidoMelantioCogido();

  // Actualizar saldo en el destino
  setTimeout(() => {
    const saldoActual = parseInt(elementoDestino.innerText) || 0;
    elementoDestino.innerText = saldoActual + cantidad;
    iconoVolador.remove();
  }, 1500);
}

// Uso cuando gana Melantios
function alTerminarMisionAbuelos() {
  const elementoSaldomelantios = document.querySelector(
    '[data-saldo-melantios]'
  );
  animarMelantioBrillante(25, elementoSaldomelantios); // Gana 25 Melantios
}
```

### 4. **Integración en Panel de Alforja Virtual**

```javascript
// Panel que muestra saldo, historial y opciones de uso
function renderAlforjaVirtualmelantios() {
  const estadomelantios = {
    saldo: 250,
    historialGanancia: [
      {
        tipo: 'folklore_story',
        cantidad: 25,
        fecha: '2026-05-08',
        estado: 'LIBERADO',
      },
      {
        tipo: 'new_word',
        cantidad: 5,
        fecha: '2026-05-07',
        estado: 'PENDIENTE_VALIDACION',
      },
    ],
    vencimiento: '2026-08-08',
    diasRestantes: 90,
  };

  let html = `
    <div style="padding: 16px; background: #FFFBEB; border-radius: 8px; border: 2px solid #FCD34D;">
      <h3 style="margin: 0 0 12px 0; color: #78350F;">🪙 Mi Alforja Virtual</h3>
      
      <!-- Saldo Actual -->
      <div style="margin-bottom: 16px; padding: 12px; background: white; border-radius: 6px;">
        <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Saldo Disponible</div>
        <div style="font-size: 24px; font-weight: bold; color: #F59E0B; display: flex; align-items: center; gap: 8px;">
          <img src="/src/assets/ui/icons/melantio_gold.svg" alt="Melantio" style="width: 32px; height: 24px;" />
          ${estadomelantios.saldo}
        </div>
        <div style="font-size: 11px; color: #999; margin-top: 4px;">Equivalente: $${(estadomelantios.saldo * 0.01).toFixed(2)} USD</div>
      </div>
      
      <!-- Vencimiento -->
      <div style="margin-bottom: 16px; padding: 8px; background: #FEE2E2; border-radius: 6px; border-left: 3px solid #F87171;">
        <div style="font-size: 12px; font-weight: bold; color: #991B1B;">⏰ Vencimiento en ${estadomelantios.diasRestantes} días</div>
      </div>
      
      <!-- Historial de Ganancias -->
      <div style="margin-bottom: 16px;">
        <div style="font-weight: bold; color: #78350F; margin-bottom: 8px; font-size: 13px;">📜 Historial</div>
        ${estadomelantios.historialGanancia
          .map(
            (h) => `
          <div style="padding: 8px; background: white; border-radius: 4px; margin-bottom: 6px; border-left: 3px solid ${h.estado === 'LIBERADO' ? '#86EFAC' : '#FCD34D'};">
            <div style="font-size: 12px; font-weight: bold; color: #333;">${h.tipo.replace(/_/g, ' ')}</div>
            <div style="font-size: 11px; color: #666;">+${h.cantidad}M | ${h.fecha} | ${h.estado}</div>
          </div>
        `
          )
          .join('')}
      </div>
      
      <!-- Acciones -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <button onclick="abrirCanjemelantios()" style="padding: 8px; background: #F59E0B; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Usar en Tienda</button>
        <button onclick="transferirmelantios()" style="padding: 8px; background: #3B82F6; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Transferir</button>
      </div>
    </div>
  `;

  return html;
}
```

### 5. **Validación de Canje (Límite 50%)**

```javascript
// Validar que el canje no supere el 50%
function validarCanjemel(melantiosUsados, precioProducto) {
  const usdEquivalente = melantiosUsados * 0.01;
  const permitido = usdEquivalente <= precioProducto * 0.5;

  if (!permitido) {
    return {
      permitido: false,
      mensaje: `❌ Solo puedes usar hasta el 50% del precio en Melantios. Máximo: ${Math.round(precioProducto * 0.5 * 100)} M.`,
    };
  }

  const efectivoRequerido = (precioProducto - usdEquivalente).toFixed(2);

  return {
    permitido: true,
    mensaje: `✅ Perfecto. Pagarás ${melantiosUsados}M (${usdEquivalente.toFixed(2)} USD) en Melantios + $${efectivoRequerido} en efectivo.`,
    desglose: {
      melantios: melantiosUsados,
      usdmelantios: usdEquivalente.toFixed(2),
      efectivo: efectivoRequerido,
      porcentajeMelantios: ((usdEquivalente / precioProducto) * 100).toFixed(1),
    },
  };
}

// Uso
const validacion = validarCanjemel(100, 20); // Quiero usar 100M ($1) en producto de $20
console.log(validacion); // ✅ Perfecto. Pagarás 100M ($1.00) + $19.00 en efectivo (5% en Melantios)
```

---

## 📍 Ubicaciones Recomendadas de Uso

| Ubicación             | Uso                                      |
| --------------------- | ---------------------------------------- |
| Encabezado de App     | Badge pequeño mostrando saldo            |
| Registro de Evidencia | Alforja Virtual completa                 |
| Tienda Afiliada       | Botón de canje en checkout               |
| Módulo de Afiliados   | Panel de ganancias en cascada            |
| Notificaciones        | Animación de ganancia                    |
| Panel Administrativo  | Gráfico de encaje (total en circulación) |

---

## 🎙️ La Voz de Don Eloy (Orgullo por la Moneda)

> "¡Vea qué elegancia! Ese rectangulito dorado con la 'M' va a ser el símbolo de nuestra fuerza en el campo. Cada vez que ese icono brille en su pantalla, socio, siéntase orgulloso, porque significa que su palabra y su trabajo están valiendo. ¡Es la moneda de Melantia, hecha por nosotros y para nosotros!"

---

## ✅ Checklist de Implementación

- [ ] Archivo SVG copiado en `/src/assets/ui/icons/melantio_gold.svg`
- [ ] MelantioBadge integrado en header/navbar
- [ ] Botón de canje visible en checkout de Tienda
- [ ] Animación de ganancia funcionando
- [ ] Panel de Alforja Virtual en Registro de Evidencia
- [ ] Validación de límite 50% activa
- [ ] Narrativa de Don Eloy integrada en primer acceso a Melantios
- [ ] Pruebas en móvil (responsive design)

---

## 🐛 Troubleshooting

**Problema:** El icono no se carga  
**Solución:** Verificar que la ruta `/src/assets/ui/icons/melantio_gold.svg` es correcta en el servidor

**Problema:** El icono se ve pixelado  
**Solución:** Mantener el formato SVG. Si necesita PNG, exportar desde SVG con factor 2x (80px × 60px)

**Problema:** La animación de ganancia es lenta  
**Solución:** Reducir el tiempo de animación de `1.5s` a `1s` en el CSS

---

**Última actualización:** 9 de mayo de 2026  
**Responsable:** Sistema de Melantios v1.0
