## Atención y ventas con voces rotativas y jefe (Don Eloy)

Para atención y ventas en la tienda virtual y Negocios Rurales, puedes invocar la función global:

```js
hablarAtencionVentas('Bienvenido a la tienda virtual, ¿en qué puedo ayudarte?'); // Voz aleatoria: Melantia, Paulette, Valentina o Angel
hablarAtencionVentas(
  '¡Atención! Solo el jefe puede aprobar esta operación.',
  'jefe'
); // Voz de Don Eloy
```

Esto permite que la atención sea variada y personalizada, cumpliendo la lógica de voces femeninas y Angel para atención/ventas, y Don Eloy como jefe.

# MELANT IA

## PRODUCTIVIDAD AGRÍCOLA INTELIGENTE OFFLINE

### **FUNCIONA SIN INTERNET**

---

**Enfoque:** Aplicación técnica regenerativa de alta disponibilidad.
**Soberanía:** Todos los modelos de IA y bases de datos residen localmente en el dispositivo.

---

## IMPORTANTE: Requisito de Cobertura para Compras

> **Para poder realizar compras y completar transacciones en la Tienda MELANTIA y Negocios Rurales, el usuario debe contar con cobertura de red (internet o señal disponible).**
>
> Si no hay cobertura, la transacción no podrá completarse y el sistema lo notificará claramente. Se recomienda verificar la conectividad antes de intentar cualquier compra o pago.

---

## Descripción

Aplicación integral para la gestión agropecuaria con enfoque regenerativo. Incluye módulos de asistencia veterinaria, agricultura digital, gestión de carbono y formación técnica.

## Estructura del Proyecto

- src/ia/: Motores de inferencia y modelos TFLite.
- src/modules/: Lógica de negocio (Veterinaria, Rural, Formación).
- src/knowledge_seeds/: Base de conocimiento técnico organizada por dominios.
- data/: Bases de datos SQL y archivos de configuración.

## Configuración del Entorno

1. Crear entorno virtual: python -m venv .venv
2. Activar: .\.venv\Scripts\activate
3. Instalar dependencias: pip install -r requirements.txt

## Memoria Viva Intercultural

Dentro de Sostenibilidad y Proyectos se integra el componente El Tesoro de los Abuelos (Memoria Viva), orientado a preservar conocimiento oral comunitario en formato offline.

### Bloque Maestro: El Tesoro de los Abuelos (Memoria Viva)

- nombre: El Tesoro de los Abuelos
- tipo: Repositorio_Vocal_Intercultural
- motor_aprendizaje: Linguistic_Learning_Engine
- archivo_fuente: 05_intercultural_lenguaje
- permisos: Solo_Lectura_para_Socios_Escritura_para_Padrinos
- secciones: El Herbario de Saberes, Memoria Cultural Integrada

### Seccion Interna: Memoria Cultural Integrada

- nombre: Memoria Cultural Integrada
- pertenece_al_item: El Tesoro de los Abuelos
- temas_unificados:
  - Voces de la Tierra
  - Lenguas y Dialectos
  - El Relicario de Historias
  - Folklore Olvidado
  - Galeria de Guardianes

Este bloque funciona como base para historias del dia de Don Eloy y para diccionarios dinamicos por etnia con transcripcion asistida por IA.
