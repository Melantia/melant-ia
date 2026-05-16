# Tienda Virtual MELANTIA (Negocios Rurales)

Toda la lógica y funciones de la tienda virtual (publicación de productos, ventas, catálogo, suscripción, link compartible, logo, optimización de fotos, etc.) deben implementarse y centralizarse en este módulo.

## Estructura recomendada:

- ventas_supabase.py: integración con Supabase para ventas y productos
- tienda_virtual.py: lógica de negocio de la tienda virtual
- tienda_virtual_ui.py: lógica de interfaz (Kivy, web, etc.)
- logo_generator.py: generación de logos provisionales
- optimizador_fotos.py: compresión y validación de imágenes
- README_tienda_virtual.md: documentación y reglas del módulo

## Reglas principales:

- Solo usuarios con suscripción activa pueden gestionar la tienda virtual
- Plan Semilla: 10 productos, 1 foto por producto, 30 días o hasta la primera venta
- Plan Empresarial: hasta 250 productos, fotos optimizadas (150KB), logo propio o generado, link compartible
- Toda venta y gestión de productos desde Gestión Empresarial debe direccionar a este módulo

## Integración:

- Si el usuario en Gestión Empresarial quiere vender o gestionar ventas, debe ser redirigido a Negocios Rurales > Monte su TIENDA VIRTUAL
- La interfaz debe dejar claro este flujo y mostrar el estado de la suscripción y límites del plan

---

Este README debe mantenerse actualizado con la lógica y archivos del módulo.
