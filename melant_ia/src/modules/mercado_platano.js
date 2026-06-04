import { mostrarPanelMercado } from './mercado_platano_controller.js';

export function mostrarPanel(contenedorId = 'vista-activa') {
  return mostrarPanelMercado(contenedorId);
}

export default { mostrarPanel };
