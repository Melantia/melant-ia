// Controlador principal de Servicios Financieros Melantia
// Gestiona navegación, UI y flujo general del módulo
import { validarFormularioFinanciero } from './servicios_financieros_validacion.js';
import {
  seleccionarApiEntidad,
  enviarSolicitudApertura,
} from './servicios_financieros_api.js';

export async function iniciarAperturaCuenta(usuario, ciudad, entidad) {
  // Validar datos locales
  const validacion = validarFormularioFinanciero(usuario);
  if (!validacion.ok) {
    return { ok: false, error: validacion.error };
  }
  // Seleccionar API según ciudad y entidad
  const apiInfo = seleccionarApiEntidad(ciudad, entidad);
  if (!apiInfo) {
    return {
      ok: false,
      error: 'No hay API disponible para esta entidad en tu ciudad.',
    };
  }
  // Enviar solicitud a la API bancaria/cooperativa
  return await enviarSolicitudApertura(usuario, apiInfo);
}
