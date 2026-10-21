from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Literal
import datetime

class Usuario(BaseModel):
    id: Optional[int]
    nombre: str
    tipo_usuario: Literal['productor', 'comerciante', 'transportista', 'comprador']
    email: EmailStr
    telefono: str
    suscripcion: Literal['basica', 'standard', 'empresarial', 'gratis']
    password_hash: str  # Guardar con seguridad
    direccion: Optional[str]
    redes_sociales: Optional[Dict[str, str]]  # Ej: {'instagram':'url'}
    fecha_registro: Optional[datetime.datetime] = Field(default_factory=datetime.datetime.utcnow)


class Tienda(BaseModel):
    id: Optional[int]
    usuario_id: int
    nombre: str
    tipo: str  # Ej: 'comercial', 'ferreteria', 'restaurante'
    slogan: Optional[str]
    direccion_fisica: Optional[str]
    foto_almacen: Optional[str]  # URL
    estado_activa: bool = True
    porcentaje_comision: float = 3.0  # porcentaje de comisión en ventas


class Producto(BaseModel):
    id: Optional[int]
    tienda_id: int
    nombre: str
    descripcion: str
    precio: float
    stock: int
    fotos: Optional[List[str]] = []
    videos: Optional[List[str]] = []
    categorias: List[str]  # Ej: ['agricola', 'ferreteria']
    activo: bool = True


class PedidoProducto(BaseModel):
    producto_id: int
    cantidad: int
    precio_unitario: float


class Pedido(BaseModel):
    id: Optional[int]
    comprador_id: int
    tienda_id: int
    productos: List[PedidoProducto]
    total: float
    metodo_pago: Literal['payphone', 'efectivo', 'otro']
    estado: Literal['pendiente', 'confirmado', 'en_envio', 'entregado', 'cancelado'] = 'pendiente'
    recargo_envio: Optional[float] = 0.0
    fecha_creacion: Optional[datetime.datetime] = Field(default_factory=datetime.datetime.utcnow)
    fecha_actualizacion: Optional[datetime.datetime] = Field(default_factory=datetime.datetime.utcnow)


class Entrega(BaseModel):
    id: Optional[int]
    pedido_id: int
    transportista_id: int
    estado_entrega: Literal['pendiente', 'en_curso', 'entregado', 'fallido'] = 'pendiente'
    ubicacion_actual: Optional[str]
    fecha_entrega: Optional[datetime.datetime]
    costo_envio: Optional[float]
