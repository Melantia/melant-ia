import datetime
from typing import Any, Dict, List, Optional

PLANES_VALIDOS = {"basico", "standard", "empresarial"}


class AuthSuscripcionesUnificado:

    PRECIO_PLAN_BASICO = 4.99
    PRECIO_PLAN_STANDARD= 11.99
    PRECIO_PLAN_EMPRESARIAL= 19.99

    @classmethod
    def procesar_registro_inteligente(
        cls, base_datos_simulada: List[Dict[str, Any]], datos_entrantes: Dict[str, Any]
    ) -> Dict[str, Any]:
        identificador = datos_entrantes.get("identificador_unico")
        nombre = datos_entrantes.get("nombre")
        acepta_privacidad = datos_entrantes.get("acepta_politica_privacidad", False)

        if not identificador:
            return {"estado": "error", "mensaje": "Se requiere un identificador único para validar al usuario."}

        usuario_existente = next(
            (u for u in base_datos_simulada if u["identificador"] == identificador), None
        )

        if usuario_existente is not None:
            return cls._actualizar_usuario_existente(usuario_existente, nombre, acepta_privacidad)

        return cls._crear_usuario_nuevo(base_datos_simulada, datos_entrantes, identificador, nombre, acepta_privacidad)

    @staticmethod
    def _actualizar_usuario_existente(
        usuario_existente: Dict[str, Any], nombre: Optional[str], acepta_privacidad: bool
    ) -> Dict[str, Any]:
        ahora_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        usuario_existente["nombre"] = nombre if nombre else usuario_existente["nombre"]
        usuario_existente["ultima_conexion"] = ahora_iso

        if acepta_privacidad:
            usuario_existente["fecha_aceptacion_privacidad"] = ahora_iso

        return {
            "status": "usuario_actualizado",
            "mensaje": f"¡Bienvenido de vuelta, {usuario_existente['nombre']}! Datos de perfil actualizados con éxito.",
            "perfil_final": usuario_existente,
        }

    @staticmethod
    def _crear_usuario_nuevo(
        base_datos_simulada: List[Dict[str, Any]],
        datos_entrantes: Dict[str, Any],
        identificador: str,
        nombre: Optional[str],
        acepta_privacidad: bool,
    ) -> Dict[str, Any]:
        if not acepta_privacidad:
            return {
                "estado": "error",
                "mensaje": "REGISTRO RECHAZADO: Debes aceptar los términos de privacidad para auditar tus datos ante el banco.",
            }

        if not nombre or len(nombre.strip()) < 3:
            return {"estado": "error", "mensaje": "Nombre no válido para el registro inicial."}

        ahora = datetime.datetime.now(datetime.timezone.utc)
        nuevo_perfil = {
            "identificador": identificador,
            "nombre": nombre,
            "provincia": datos_entrantes.get("provincia", "Manabí"),
            "fecha_registro": ahora.isoformat(),
            "fecha_aceptacion_privacidad": ahora.isoformat(),
            "suscripcion_actual": "gratis_prueba",
            "suscripcion_expiracion": (ahora + datetime.timedelta(days=30)).isoformat(),
            "balance_melantios": 0.0,
            "estado_cuenta": "activa",
        }
        base_datos_simulada.append(nuevo_perfil)

        return {
            "status": "usuario_creado",
            "mensaje": f"Registro exitoso. Se ha creado el perfil de {nombre} con 30 días de prueba.",
            "perfil_final": nuevo_perfil,
        }

    @classmethod
    def renovar_membresia_deuna(cls, perfil_actual: Dict[str, Any], tipo_plan: str) -> Dict[str, Any]:
        if perfil_actual.get("estado_cuenta") != "activa":
            return {"estado": "error", "mensaje": "La cuenta se encuentra suspendida o bloqueada legalmente."}

        if tipo_plan not in PLANES_VALIDOS:
            return {
                "estado": "error",
                "mensaje": f"Plan '{tipo_plan}' no válido. Opciones: {sorted(PLANES_VALIDOS)}.",
            }

        precio_plan = cls.PRECIO_PLAN_BASICO if tipo_plan == "activo_familiar" else cls.PRECIO_PLAN_STANDARD
        fecha_expiracion = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=30)

        perfil_actual["suscripcion_actual"] = tipo_plan
        perfil_actual["suscripcion_expiracion"] = fecha_expiracion.isoformat()

        return {
            "status": "suscripcion_renovada",
            "mensaje": f"Membresía '{tipo_plan}' activada. Próximo cobro: {fecha_expiracion.strftime('%d/%m/%Y')}",
            "monto_pagado_usd": precio_plan,
            "perfil_final": perfil_actual,
        }
