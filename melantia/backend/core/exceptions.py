# backend/core/exceptions.py
"""
Excepciones personalizadas de MELANTIA.

Define las excepciones específicas del sistema para un manejo de errores
consistente y descriptivo en toda la aplicación.
"""
from typing import Optional, Any, Dict


# ============================================================================
# EXCEPCIONES BASE
# ============================================================================

class MelantiaException(Exception):
    """
    Excepción base de MELANTIA.

    Todas las excepciones personalizadas del sistema deben heredar de esta clase.
    """

    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or self.__class__.__name__
        self.details = details or {}
        super().__init__(self.message)

    def to_dict(self) -> Dict[str, Any]:
        """
        Convierte la excepción a un diccionario para respuestas API.

        Returns:
            Diccionario con información estructurada del error
        """
        return {
            "error": self.error_code,
            "message": self.message,
            "status_code": self.status_code,
            "details": self.details
        }


# ============================================================================
# EXCEPCIONES DE AUTENTICACIÓN Y AUTORIZACIÓN
# ============================================================================

class AuthenticationError(MelantiaException):
    """
    Error de autenticación - Credenciales inválidas o ausentes.
    """

    def __init__(self, message: str = "Credenciales de autenticación inválidas", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=401,
            error_code="AUTHENTICATION_ERROR",
            details=details
        )


class AuthorizationError(MelantiaException):
    """
    Error de autorización - Permisos insuficientes.
    """

    def __init__(self, message: str = "Permisos insuficientes para realizar esta acción", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=403,
            error_code="AUTHORIZATION_ERROR",
            details=details
        )


class TokenExpiredError(MelantiaException):
    """
    Error de token expirado.
    """

    def __init__(self, message: str = "El token de autenticación ha expirado", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=401,
            error_code="TOKEN_EXPIRED",
            details=details
        )


class InvalidTokenError(MelantiaException):
    """
    Error de token inválido.
    """

    def __init__(self, message: str = "Token de autenticación inválido", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=401,
            error_code="INVALID_TOKEN",
            details=details
        )


# ============================================================================
# EXCEPCIONES DE RECURSOS
# ============================================================================

class ResourceNotFoundError(MelantiaException):
    """
    Error de recurso no encontrado.
    """

    def __init__(self, resource_type: str, resource_id: Any, details: Optional[Dict[str, Any]] = None):
        message = f"{resource_type} con ID '{resource_id}' no encontrado"
        error_details = details or {}
        error_details.update({
            "resource_type": resource_type,
            "resource_id": str(resource_id)
        })
        super().__init__(
            message=message,
            status_code=404,
            error_code="RESOURCE_NOT_FOUND",
            details=error_details
        )


class UserNotFoundError(ResourceNotFoundError):
    """
    Error de usuario no encontrado.
    """

    def __init__(self, user_id: str, details: Optional[Dict[str, Any]] = None):
        super().__init__("Usuario", user_id, details)


class FincaNotFoundError(ResourceNotFoundError):
    """
    Error de finca no encontrada.
    """

    def __init__(self, finca_id: str, details: Optional[Dict[str, Any]] = None):
        super().__init__("Finca", finca_id, details)


class LoteNotFoundError(ResourceNotFoundError):
    """
    Error de lote no encontrado.
    """

    def __init__(self, lote_id: str, details: Optional[Dict[str, Any]] = None):
        super().__init__("Lote", lote_id, details)


# ============================================================================
# EXCEPCIONES DE VALIDACIÓN
# ============================================================================

class ValidationError(MelantiaException):
    """
    Error de validación de datos.
    """

    def __init__(self, message: str = "Error de validación de datos", field: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        error_details = details or {}
        if field:
            error_details["field"] = field
        super().__init__(
            message=message,
            status_code=422,
            error_code="VALIDATION_ERROR",
            details=error_details
        )


class DuplicateResourceError(MelantiaException):
    """
    Error de recurso duplicado.
    """

    def __init__(self, resource_type: str, identifier: str, details: Optional[Dict[str, Any]] = None):
        message = f"{resource_type} con identificador '{identifier}' ya existe"
        error_details = details or {}
        error_details.update({
            "resource_type": resource_type,
            "identifier": identifier
        })
        super().__init__(
            message=message,
            status_code=409,
            error_code="DUPLICATE_RESOURCE",
            details=error_details
        )


class InvalidEmailError(ValidationError):
    """
    Error de email inválido.
    """

    def __init__(self, email: str, details: Optional[Dict[str, Any]] = None):
        message = f"Formato de email inválido: {email}"
        error_details = details or {}
        error_details["email"] = email
        super().__init__(message, field="email", details=error_details)


class InvalidPasswordError(ValidationError):
    """
    Error de contraseña inválida.
    """

    def __init__(self, message: str = "La contraseña no cumple con los requisitos mínimos", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, field="password", details=details)


# ============================================================================
# EXCEPCIONES DE BASE DE DATOS
# ============================================================================

class DatabaseError(MelantiaException):
    """
    Error de base de datos genérico.
    """

    def __init__(self, message: str = "Error de base de datos", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=500,
            error_code="DATABASE_ERROR",
            details=details
        )


class DatabaseConnectionError(DatabaseError):
    """
    Error de conexión a base de datos.
    """

    def __init__(self, message: str = "No se pudo conectar a la base de datos", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, details)


class DatabaseQueryError(DatabaseError):
    """
    Error en consulta de base de datos.
    """

    def __init__(self, query: str, message: str = "Error en consulta de base de datos", details: Optional[Dict[str, Any]] = None):
        error_details = details or {}
        error_details["query"] = query
        super().__init__(message, error_details)


# ============================================================================
# EXCEPCIONES DE NEGOCIO
# ============================================================================

class BusinessLogicError(MelantiaException):
    """
    Error de lógica de negocio.
    """

    def __init__(self, message: str = "Error en lógica de negocio", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=400,
            error_code="BUSINESS_LOGIC_ERROR",
            details=details
        )


class InsufficientFundsError(BusinessLogicError):
    """
    Error de fondos insuficientes.
    """

    def __init__(self, required: float, available: float, details: Optional[Dict[str, Any]] = None):
        message = f"Fondos insuficientes: requeridos ${required:.2f}, disponibles ${available:.2f}"
        error_details = details or {}
        error_details.update({
            "required": required,
            "available": available
        })
        super().__init__(message, error_details)


class SubscriptionLimitError(BusinessLogicError):
    """
    Error de límite de suscripción excedido.
    """

    def __init__(self, limit_type: str, current: int, maximum: int, details: Optional[Dict[str, Any]] = None):
        message = f"Límite de suscripción excedido para {limit_type}: {current}/{maximum}"
        error_details = details or {}
        error_details.update({
            "limit_type": limit_type,
            "current": current,
            "maximum": maximum
        })
        super().__init__(message, error_details)


class OperationNotAllowedError(BusinessLogicError):
    """
    Error de operación no permitida.
    """

    def __init__(self, operation: str, reason: str, details: Optional[Dict[str, Any]] = None):
        message = f"Operación '{operation}' no permitida: {reason}"
        error_details = details or {}
        error_details.update({
            "operation": operation,
            "reason": reason
        })
        super().__init__(message, error_details)


# ============================================================================
# EXCEPCIONES DE SINCRONIZACIÓN
# ============================================================================

class SyncError(MelantiaException):
    """
    Error de sincronización.
    """

    def __init__(self, message: str = "Error durante la sincronización", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=503,
            error_code="SYNC_ERROR",
            details=details
        )


class SyncConflictError(SyncError):
    """
    Error de conflicto de sincronización.
    """

    def __init__(self, resource_type: str, resource_id: str, details: Optional[Dict[str, Any]] = None):
        message = f"Conflicto de sincronización en {resource_type} '{resource_id}'"
        error_details = details or {}
        error_details.update({
            "resource_type": resource_type,
            "resource_id": resource_id
        })
        super().__init__(message, error_details)


class OfflineOperationError(MelantiaException):
    """
    Error de operación offline no disponible.
    """

    def __init__(self, message: str = "Operación no disponible offline", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=503,
            error_code="OFFLINE_OPERATION_ERROR",
            details=details
        )


# ============================================================================
# EXCEPCIONES DE ARCHIVOS Y ALMACENAMIENTO
# ============================================================================

class FileUploadError(MelantiaException):
    """
    Error de carga de archivos.
    """

    def __init__(self, message: str = "Error al cargar archivo", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=400,
            error_code="FILE_UPLOAD_ERROR",
            details=details
        )


class FileTooLargeError(FileUploadError):
    """
    Error de archivo demasiado grande.
    """

    def __init__(self, file_size: int, max_size: int, details: Optional[Dict[str, Any]] = None):
        message = f"Archivo demasiado grande: {file_size} bytes (máximo: {max_size} bytes)"
        error_details = details or {}
        error_details.update({
            "file_size": file_size,
            "max_size": max_size
        })
        super().__init__(message, error_details)


class InvalidFileTypeError(FileUploadError):
    """
    Error de tipo de archivo inválido.
    """

    def __init__(self, file_type: str, allowed_types: list, details: Optional[Dict[str, Any]] = None):
        message = f"Tipo de archivo inválido: {file_type}. Tipos permitidos: {', '.join(allowed_types)}"
        error_details = details or {}
        error_details.update({
            "file_type": file_type,
            "allowed_types": allowed_types
        })
        super().__init__(message, error_details)


# ============================================================================
# EXCEPCIONES EXTERNAS
# ============================================================================

class ExternalServiceError(MelantiaException):
    """
    Error de servicio externo.
    """

    def __init__(self, service: str, message: str = "Error en servicio externo", details: Optional[Dict[str, Any]] = None):
        error_details = details or {}
        error_details["service"] = service
        super().__init__(
            message=f"{service}: {message}",
            status_code=502,
            error_code="EXTERNAL_SERVICE_ERROR",
            details=error_details
        )


class PaymentGatewayError(ExternalServiceError):
    """
    Error de pasarela de pagos.
    """

    def __init__(self, message: str = "Error en pasarela de pagos", details: Optional[Dict[str, Any]] = None):
        super().__init__("Payment Gateway", message, details)


# ============================================================================
# EXCEPCIONES DE CONOCIMIENTO
# ============================================================================

class KnowledgeUnavailableError(MelantiaException):
    """
    Semilla de conocimiento local no disponible o corrupta.

    Indica un problema de despliegue (archivo JSON ausente o con
    formato inválido), no un error del cliente.
    """

    def __init__(self, nombre: str, details: Optional[Dict[str, Any]] = None):
        error_details = details or {}
        error_details["archivo"] = nombre
        super().__init__(
            message=f"Base de conocimiento no disponible: {nombre}",
            status_code=500,
            error_code="KNOWLEDGE_UNAVAILABLE",
            details=error_details
        )


# ============================================================================
# EXPORTACIONES
# ============================================================================

__all__ = [
    # Excepciones base
    'MelantiaException',
    # Autenticación y autorización
    'AuthenticationError',
    'AuthorizationError',
    'TokenExpiredError',
    'InvalidTokenError',
    # Recursos
    'ResourceNotFoundError',
    'UserNotFoundError',
    'FincaNotFoundError',
    'LoteNotFoundError',
    # Validación
    'ValidationError',
    'DuplicateResourceError',
    'InvalidEmailError',
    'InvalidPasswordError',
    # Base de datos
    'DatabaseError',
    'DatabaseConnectionError',
    'DatabaseQueryError',
    # Negocio
    'BusinessLogicError',
    'InsufficientFundsError',
    'SubscriptionLimitError',
    'OperationNotAllowedError',
    # Sincronización
    'SyncError',
    'SyncConflictError',
    'OfflineOperationError',
    # Archivos
    'FileUploadError',
    'FileTooLargeError',
    'InvalidFileTypeError',
    # Externos
    'ExternalServiceError',
    'PaymentGatewayError',
    # Conocimiento
    'KnowledgeUnavailableError',
]
