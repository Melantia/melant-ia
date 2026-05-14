# ❓ FAQ - Candado de Fidelidad 12/12

## Preguntas Frecuentes para Desarrolladores

### 🔧 INSTALACIÓN E INTEGRACIÓN

**P: ¿Por dónde empiezo a integrar el Candado 12/12?**  
R: Comienza en [FIDELIDAD_API_REFERENCE.md](./FIDELIDAD_API_REFERENCE.md). Las funciones están listas en main_controller.js. Solo necesitas:

1. Llama a `registrarPago()` cuando pago exitoso
2. Implementa scheduled tasks para enero y diciembre

---

**P: ¿Cuál es la función principal para registrar pagos?**  
R: `registrarPago(descripcion)` línea ~1310 de main_controller.js

```javascript
const resultado = controller.registrarPago('Suscripción Diciembre 2024');
// Retorna: { exitoso, mesesPagados, porcentajeAvance, mesesFaltantes, mensaje }
```

---

**P: ¿Necesito modificar el estado en \_estadoComunidad()?**  
R: No, ya está hecho. Incluye:

- `mesesPagados: 0`
- `historialPagos: []`
- `alcanciaNavideña.requisito12_12Cumplido`
- `alcanciaNavideña.bloqueoPorFaltaPago`

---

### 💰 LÓGICA DE PAGOS

**P: ¿Qué pasa si el usuario paga dos veces en el mismo mes?**  
R: La función rechaza con:

```javascript
{
  exitoso: false,
  razon: 'YA_PAGADO_ESTE_MES',
  mensaje: "Ya registramos tu pago de este mes..."
}
```

---

**P: ¿Cuál es el contador de fidelidad exacto?**  
R: Rígido:

- **0-11 meses:** Incompleto, sin acceso a diciembre
- **12 meses:** Completo, acceso garantizado
- **13+ meses:** Imposible, se reinicia en enero

---

**P: ¿Si un usuario falta un pago en mes 6, qué pasa?**  
R: El contador se REINICIA a 0/12. Es brutal:

```
Mes 1: paga → 1/12
Mes 2: paga → 2/12
...
Mes 6: NO PAGA → 0/12 (REINICIA)
Mes 7: paga → 1/12 (empieza de nuevo)
```

---

**P: ¿Cómo se registra cada pago en auditoría?**  
R: Se agrega a `historialPagos`:

```javascript
{
  mes: 5,                                // enero=1, diciembre=12
  anio: 2024,
  descripcion: 'Suscripción mensual',
  fechaPago: '2024-05-15T12:30:45.123Z',
  montoSuscripcion: 'variable'          // Pendiente integración
}
```

---

### 🎄 DICIEMBRE Y LIBERACIÓN

**P: ¿Cuándo se libera exactamente la alcancía?**  
R: En diciembre (mes 12), pero SÍ Y SOLO SÍ:

1. Es diciembre (mes === 12)
2. Tiene 12 pagos completados
3. Hay saldo en alcancía
4. No hay bloqueo activo

---

**P: ¿Qué pasa si en diciembre tiene solo 11 pagos?**  
R: Se bloquea la liberación:

```javascript
liberarAlcanciaNavideña() retorna:
{
  permitido: false,
  razon: 'FIDELIDAD_INCOMPLETA',
  mesesPagados: 11,
  mesesFaltantes: 1,
  saldoAlcancia: 5000,
  mensaje: "❌ No cumple requisito de fidelidad. 11/12 meses pagados."
}
```

Don Eloy dice: _"Se queda viendo la alcancía desde afuera"_

---

**P: ¿Se pierden los Melantios si no completa 12 meses?**  
R: NO. Los Melantios se mantienen en `alcanciaNavideña.saldoAcumulado` indefinidamente:

```javascript
{
  alcanciaNavideña: {
    saldoAcumulado: 5000,    // ← Sigue aquí bloqueado
    bloqueoPorFaltaPago: true,
    estado: 'ACUMULANDO',
  }
}
```

Siguiente año puede intentar nuevamente.

---

**P: ¿Puede el usuario transferir o retirar antes de diciembre?**  
R: NO. Está 100% bloqueado:

- `liberarAlcanciaNavideña()` retorna `permitido: false`
- No hay otra forma de acceder

---

### 🗓️ ENERO Y RESET

**P: ¿Qué ocurre automáticamente el 1 de enero?**  
R: Debe llamarse `reiniciarFidelidadEnero()`:

```javascript
{
  mesesPagados: 0,         // ← Reinicia
  alcanciaNavideña.estado: 'ACUMULANDO',
  alcanciaNavideña.requisito12_12Cumplido: false,
  alcanciaNavideña.bloqueoPorFaltaPago: false,
  alcanciaNavideña.proximaLiberacion: 'Diciembre 2025'
}
```

---

**P: ¿Se pierden los Melantios acumulados en diciembre cuando reinicia?**  
R: NO. El saldo en `alcanciaNavideña.saldoAcumulado` se mantiene:

```javascript
{
  año 2024: mesesPagados = 12, saldoAlcancia = 5000
  Diciembre: LIBERADO, transfiere a saldoActual
  Enero 1: mesesPagados = 0 (reinicia), pero saldoActual mantiene 5000
}
```

---

**P: ¿Se genera historial del año anterior?**  
R: Sí, `reiniciarFidelidadEnero()` devuelve:

```javascript
{
  exitoso: true,
  historialAnioAnterior: {
    anio: 2024,
    mesesPagados: 12,
    saldoAlcanciaDiciembre: 5000,
    requisitoUxito: true
  }
}
```

---

### 🔒 VALIDACIONES Y BLOQUEOS

**P: ¿Cuál es la función para validar si puede desbloquear?**  
R: `canUnlockAlcancia()` línea ~1355:

```javascript
{
  puedDesbloquear: true/false,
  validaciones: {
    es_diciembre: boolean,
    tiene_12_pagos: boolean,
    hay_saldo: boolean,
    no_tiene_bloqueo: boolean
  },
  razonesBloqueo: ['tiene_12_pagos', 'es_diciembre'],
  mesesPagados: 5,
  mesActual: 11
}
```

---

**P: ¿Puede haber bloqueos múltiples?**  
R: Sí. Si falla cualquiera de las 4 validaciones, aparece en `razonesBloqueo[]`:

```javascript
razonesBloqueo: [
  'es_diciembre', // No es mes 12
  'tiene_12_pagos', // Solo tiene 9/12
  'hay_saldo', // Saldo en alcancia = 0
  'no_tiene_bloqueo', // bloqueoPorFaltaPago = true
];
```

---

### 📱 INTERFAZ DE USUARIO

**P: ¿Dónde aparece el progreso 12/12 en la UI?**  
R: En `abrirAlforjaVirtualMelantios()` línea 6444:

- Nueva tarjeta: "🔐 Candado de Fidelidad 12/12"
- Muestra: "Progreso de fidelidad: 5/12"
- Barra visual con color (naranja <12, verde =12)
- Advertencia de reinicio si falta pago

---

**P: ¿Cómo se ve la barra de progreso?**  
R: Barra HTML con colores:

```
████░░░░░░░░ 41% (5/12 meses)
```

- **Naranja (#ff9800):** Si < 12 meses
- **Verde (#4caf50):** Si = 12 meses
- Animación suave (transition: width 0.3s)

---

**P: ¿Qué mensaje ve si completa 12/12?**  
R: Panel muestra:

```
✅ ¡Requisito cumplido! Tu alcancía se abrirá en diciembre
```

Con fondo verde (#e8f5e9) y texto verde (#2e7d32)

---

### 🎤 NARRATIVA DE DON ELOY

**P: ¿Qué dice Don Eloy en cada situación?**

**Si intenta liberar sin 12 pagos:**  
_"¡Atención, socio! Usted ha pagado 5 meses, pero le faltan 7 para cumplir el requisito de fidelidad de 12/12. El que se hace el vivo y no paga, se queda viendo la alcancía desde afuera. ¡Aquí premiamos la honradez y la constancia!"_

**Cuando completa 12/12:**  
_"¡Vea, socio! ¡Lo hizo! Completó sus 12 meses de fidelidad. En diciembre su alcancía se abrirá con todo lo que ha ganado. ¡Usted es un ahorrador verdadero!"_

**En enero (reset):**  
_"¡Bienvenido, socio! Comenzamos un nuevo año. Su contador de fidelidad está en cero, pero los Melantios que acumuló siguen en su bolsa. ¡Ahora a construir otros 12 meses de constancia!"_

**En Alforja (cada visita):**  
_"Socio, bienvenido a su alforja virtual. Usted tiene 0M listos para gastar, y 250M en alcancia. Lleva 5 meses de 12. Siga pagando con constancia para desbloquear su premio en diciembre."_

---

### 🐛 DEBUGGING

**P: ¿Cómo verifico que todo funciona?**  
R: Corre [TEST_FIDELIDAD_12_12.js](./TEST_FIDELIDAD_12_12.js) en consola:

```javascript
// Copiar contenido de TEST_FIDELIDAD_12_12.js
// Ejecutar en consola del navegador (F12)
// Verá: ✅ TEST 1, ✅ TEST 2, etc.
```

---

**P: ¿Cómo verifico el estado en consola?**  
R: Ejecuta en consola:

```javascript
const estado = window.MelantiaAsistente._estadoComunidad();
console.log('Meses pagados:', estado.melantios.mesesPagados);
console.log('Historial pagos:', estado.melantios.historialPagos);
console.log('Alcancia:', estado.melantios.alcanciaNavideña);
```

---

**P: ¿Qué significa "bloqueoPorFaltaPago"?**  
R: Flag que indica:

- `true` = Usuario tiene deuda, alcancía NO puede abrirse
- `false` = Usuario está al día, alcancía PUEDE abrirse (si cumple otros requisitos)

```javascript
// Siempre validar:
if (estado.melantios.alcanciaNavideña.bloqueoPorFaltaPago) {
  console.log('Usuario no puede acceder');
}
```

---

**P: ¿Por qué la validación de fidelidad es ANTES de validar diciembre?**  
R: Porque la validación de fidelidad es más importante. Prioridad:

1. **Fidelidad 12/12** (requisito más crítico)
2. **Es diciembre** (requisito temporal)
3. **Hay saldo** (requisito lógico)
4. **No tiene bloqueo** (requisito de cumplimiento)

---

### 🔧 TROUBLESHOOTING

**P: El contador no incrementa después de registrarPago()**  
R: Verifica:

1. ¿Se llama `registrarPago()` DESPUÉS de pago exitoso?
2. ¿Es el primer pago del mes/año? (valida por mes+año)
3. ¿Se ejecuta sin errores? (checa consola)

---

**P: Alforja no muestra barra de progreso**  
R: Revisa:

1. ¿`estado.melantios.mesesPagados` existe? (`console.log(estado.melantios.mesesPagados)`)
2. ¿El HTML se renderiza? (F12 → Elements → busca "Candado de Fidelidad")
3. ¿Hay errores en consola? (F12 → Console)

---

**P: liberarAlcanciaNavideña() siempre retorna bloqueado**  
R: Verifica:

1. ¿Es diciembre? (`new Date().getMonth() + 1 === 12`)
2. ¿Tiene 12 pagos? (`estado.melantios.mesesPagados === 12`)
3. ¿Hay saldo? (`estado.melantios.alcanciaNavideña.saldoAcumulado > 0`)
4. Ejecuta `canUnlockAlcancia()` para ver todas las razones

---

**P: Don Eloy no habla**  
R: La función `hablarDonEloy()` requiere:

1. Navegador con speaker
2. Síntesis de voz habilitada
3. Lenguaje español configurado
4. No hay errores en consola

---

**P: Estado no persiste después de refresh**  
R: Verifica localStorage:

```javascript
// En consola
console.log(localStorage.getItem('estadoComunidad'));
// Debe mostrar JSON con melantios
```

Si está vacío, revisa `_guardarEstadoComunidad()` está siendo llamada.

---

### 📊 PREGUNTAS SOBRE DATOS

**P: ¿Cuántos campos nuevos se agregaron?**  
R: 5 campos totales:

1. `melantios.mesesPagados` (número)
2. `melantios.historialPagos` (array)
3. `alcanciaNavideña.requisito12_12Cumplido` (boolean)
4. `alcanciaNavideña.bloqueoPorFaltaPago` (boolean)

---

**P: ¿Cuál es el tamaño de localStorage con fidelidad?**  
R: ~500 bytes por año (12 pagos registrados):

```javascript
{
  mes: 1,
  anio: 2024,
  descripcion: "Suscripción...",
  fechaPago: "2024-01-15T...",
  montoSuscripcion: "variable"
}
// Repetido 12 veces = ~480 bytes
```

---

### 🎓 EDUCACIÓN Y CAPACITACIÓN

**P: ¿Cómo explico esto a los Socios?**  
R: Usa esta narrativa:

> "En MELANTIA tienes una 'alcancía mágica'. Durante todo el año (enero a noviembre) juntas tus Melantios en ella, pero no puedes tocarla. Es como si la alcancía estuviera bajo llave. En diciembre se abre y usas tus Melantios en tiendas. Pero cuidado: tienes que pagar tu suscripción cada mes sin faltar. Si faltas un mes, la llave se reinicia de nuevo."

---

**P: ¿Cómo entreno a los Padrinos?**  
R: Documento [FIDELIDAD_API_REFERENCE.md](./FIDELIDAD_API_REFERENCE.md) + demo en vivo

---

**P: ¿Hay material de marketing?**  
R: No incluido. Sugiero:

- Infografía: "12 meses = Alcancía Abierta"
- Video: Don Eloy explica la regla 12/12
- Meme: "Se queda viendo desde afuera" (humor positivo)

---

## Contacto

Para problemas específicos, consulta:

- [CANDADO_FIDELIDAD_12_12.md](./CANDADO_FIDELIDAD_12_12.md) - Especificación
- [FIDELIDAD_API_REFERENCE.md](./FIDELIDAD_API_REFERENCE.md) - API
- [TEST_FIDELIDAD_12_12.js](./TEST_FIDELIDAD_12_12.js) - Tests
- Console del navegador (F12) para debugging en vivo

---

**Versión FAQ:** 1.0  
**Última actualización:** 2024
