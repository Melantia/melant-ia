# backend/modules/auth/controllers.py
"""
Autenticación local de MELANTIA.

Emite tokens JWT reales contra la tabla `usuarios`. La contraseña se
almacena en `usuarios.password_hash` (columna aditiva, NULL en los
usuarios históricos, que deberán registrar contraseña antes de entrar).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from psycopg.errors import UniqueViolation

from core.dependencies import get_current_user, get_db
from core.security import create_access_token, get_password_hash, verify_password
from modules.auth.schemas import (
    LoginRequest,
    RegistroRequest,
    TokenResponse,
    UsuarioResponse,
)

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db=Depends(get_db)):
    """
    Autentica por cédula/RUC + contraseña y emite un JWT.

    El claim `sub` del token contiene el UUID del usuario, compatible
    con la dependencia `get_current_user`.
    """
    conn, cursor = db

    await cursor.execute(
        """
        SELECT id, nombre, password_hash
        FROM usuarios
        WHERE cedula_ruc = %s
        """,
        (data.cedula_ruc,),
    )
    usuario = await cursor.fetchone()

    credenciales_invalidas = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Cédula o contraseña incorrecta.",
    )

    if not usuario:
        raise credenciales_invalidas

    if not usuario["password_hash"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=(
                "La cuenta no tiene contraseña registrada. "
                "Debe registrarse o solicitar activación."
            ),
        )

    if not verify_password(data.password, usuario["password_hash"]):
        raise credenciales_invalidas

    token = create_access_token(
        {
            "sub": str(usuario["id"]),
            "cedula": data.cedula_ruc,
            "nombre": usuario["nombre"],
        }
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario_id": str(usuario["id"]),
        "nombre": usuario["nombre"],
    }


@router.post(
    "/registro",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
async def registro(data: RegistroRequest, db=Depends(get_db)):
    """
    Registra un productor con contraseña local y devuelve un JWT
    listo para usar (alta + login en una sola operación).
    """
    conn, cursor = db

    try:
        await cursor.execute(
            """
            INSERT INTO usuarios (
                nombre, cedula_ruc, sector_comunidad, contacto,
                provincia_id, canton_id, parroquia_id, password_hash
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                data.nombre,
                data.cedula_ruc,
                data.sector_comunidad,
                data.contacto,
                data.provincia_id,
                data.canton_id,
                data.parroquia_id,
                get_password_hash(data.password),
            ),
        )
    except UniqueViolation:
        await conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un usuario con esa cédula/RUC.",
        )

    fila = await cursor.fetchone()
    await conn.commit()

    usuario_id = str(fila["id"])
    token = create_access_token(
        {"sub": usuario_id, "cedula": data.cedula_ruc, "nombre": data.nombre}
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario_id": usuario_id,
        "nombre": data.nombre,
    }


@router.get("/me", response_model=UsuarioResponse)
async def perfil_actual(
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """Devuelve el perfil del usuario autenticado (verifica el JWT)."""
    conn, cursor = db

    await cursor.execute(
        """
        SELECT id, nombre, cedula_ruc, sector_comunidad
        FROM usuarios
        WHERE id = %s
        """,
        (usuario_id,),
    )
    usuario = await cursor.fetchone()

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado.",
        )
    return {**usuario, "id": str(usuario["id"])}
