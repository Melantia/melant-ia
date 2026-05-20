// Integración de APIs bancarias/cooperativas y KYC
import config from './servicios_financieros_config.json';

export function seleccionarApiEntidad(ciudad, entidad) {
  // Busca la API correspondiente según ciudad y entidad
  const bancos = config.bancos.filter((b) => b.ciudades.includes(ciudad));
  const cooperativas = config.cooperativas.filter((c) =>
    c.ciudades.includes(ciudad)
  );
  const todas = [...bancos, ...cooperativas];
  return todas.find((e) => e.nombre === entidad) || null;
}

export async function enviarSolicitudApertura(usuario, apiInfo) {
  // Aquí se enviaría el payload a la API bancaria/cooperativa
  // Solo falta implementar el endpoint real que provea la entidad
  // Ejemplo:
  // const response = await fetch(apiInfo.api_url + '/apertura', { method: 'POST', body: JSON.stringify(usuario) });
  // return await response.json();
  return {
    ok: false,
    error: 'Falta integrar endpoint real del banco/cooperativa.',
  };
}

// KYC: Si la entidad provee API, usarla; si no, puedes integrar aquí un proveedor externo
export async function validarKYC(usuario) {
  if (config.proveedor_kyc && config.proveedor_kyc.api_url) {
    // Lógica para llamar a la API de KYC externa
    // ...
    return { ok: false, error: 'Falta integrar KYC externo.' };
  }
  return { ok: false, error: 'No hay proveedor KYC configurado.' };
}
