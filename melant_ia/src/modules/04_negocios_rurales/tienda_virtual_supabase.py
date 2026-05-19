# Integración con Supabase para ventas y productos
import supabase
from tienda_controller import PLANES_MELANTIA

# Configuración de Supabase
SUPABASE_URL = "https://tu-proyecto.supabase.co"
SUPABASE_KEY = "tu-clave"
supa = supabase.create_client(SUPABASE_URL, SUPABASE_KEY)

def registrar_producto(usuario, producto):
    plan = usuario.plan
    limite = PLANES_MELANTIA.get(plan, {}).get('limite', 0)
    # Contar productos actuales
    productos = supa.table("productos").select("*").eq("usuario", usuario.nombre).execute()
    if len(productos.data) >= limite:
        raise Exception(f"Límite de productos alcanzado para el plan {plan}.")
    # Insertar producto
    res = supa.table("productos").insert(producto).execute()
    return res

def registrar_venta(usuario, venta):
    # Insertar venta en Supabase
    res = supa.table("ventas").insert(venta).execute()
    return res

# Ejemplo de uso
class Usuario:
    def __init__(self, nombre, plan):
        self.nombre = nombre
        self.plan = plan

if __name__ == "__main__":
    usuario = Usuario("Juan", "SEMILLA")
    producto = {"nombre": "Cacao Premium", "precio": 10, "usuario": usuario.nombre}
    try:
        registrar_producto(usuario, producto)
    except Exception as e:
        print(e)
    venta = {"producto": "Cacao Premium", "cantidad": 2, "usuario": usuario.nombre}
    registrar_venta(usuario, venta)
