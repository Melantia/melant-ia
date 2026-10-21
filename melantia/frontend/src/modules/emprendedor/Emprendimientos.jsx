// frontend/src/modules/emprendedor/Emprendimientos.jsx
import React, { useState } from 'react';

export default function Emprendimientos() {
  const [seccion, setSeccion] = useState('portafolio'); // portafolio, ferias, simulador, tramites
  const [consejoVoz, setConsejoVoz] = useState('Don Eloy dice: "¡Vea patrón, con esta herramienta el emprendedor ya no va a ciegas a la ciudad!"');
  
  // Simulador de Costos Puerta de Finca (Conexión Finanzas Personales)
  const [costos, setCostos] = useState({ jornales: 40, insumos: 25, transporte: 15, otros: 10 });
  const sugerenciaFeria = 0.15; // 15% sugerido

  const costoTotal = parseFloat(costos.jornales) + parseFloat(costos.insumos) + parseFloat(costos.transporte) + parseFloat(costos.otros);
  const precioSugeridoFeria = costoTotal * (1 + sugerenciaFeria);

  return (
    <div className="p-6 bg-gray-800 rounded-xl shadow-md border border-gray-700 max-w-5xl mx-auto my-4">
      
      {/* CABECERA CON CONSEJO INTERACTIVO (DON ELOY / FABRIZZIO / ÁNGEL) */}
      <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">👨‍💼</div>
          <div>
            <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-800 px-2 py-0.5 rounded-full font-mono font-bold">ASISTENTE DE NEGOCIACIÓN</span>
            <p className="text-xs text-gray-300 italic mt-1 font-sans">{consejoVoz}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setConsejoVoz('Don Eloy dice: "¡Vea patrón, con esta herramienta el emprendedor ya no va a ciegas a la ciudad! Defienda su precio, que la tierra cuesta sudor."')} className="bg-gray-900 hover:bg-gray-800 border border-gray-700 text-[11px] font-bold px-2.5 py-1.5 rounded transition text-white">🎙️ Don Eloy</button>
          <button onClick={() => setConsejoVoz('Fabrizzio dice: "¡Tienes un producto premium! Empácalo limpio, destaca que es orgánico y agrégale el código QR que genera la app."')} className="bg-gray-900 hover:bg-gray-800 border border-gray-700 text-[11px] font-bold px-2.5 py-1.5 rounded transition text-white">🎙️ Fabrizzio</button>
        </div>
      </div>

      {/* MENÚ DE PESTAÑAS DEL MÓDULO */}
      <div className="flex flex-wrap gap-1.5 bg-gray-950 p-1 rounded-lg border border-gray-800 text-xs font-bold mb-6">
        <button onClick={() => setSeccion('portafolio')} className={`flex-1 min-w-[120px] py-2 rounded transition ${seccion === 'portafolio' ? 'bg-green-600 text-white' : 'text-gray-400 hover:bg-gray-900'}`}>📁 Portafolio Digital</button>
        <button onClick={() => setSeccion('ferias')} className={`flex-1 min-w-[120px] py-2 rounded transition ${seccion === 'ferias' ? 'bg-green-600 text-white' : 'text-gray-400 hover:bg-gray-900'}`}>🎪 Agenda Ferias (EC)</button>
        <button onClick={() => setSeccion('simulador')} className={`flex-1 min-w-[120px] py-2 rounded transition ${seccion === 'simulador' ? 'bg-green-600 text-white' : 'text-gray-400 hover:bg-gray-900'}`}>📊 Ángel Finanzas (Precios)</button>
        <button onClick={() => setSeccion('tramites')} className={`flex-1 min-w-[120px] py-2 rounded transition ${seccion === 'tramites' ? 'bg-green-600 text-white' : 'text-gray-400 hover:bg-gray-900'}`}>📜 Trámites Ecuador (Standard)</button>
      </div>

      {/* SECCIÓN 1: PORTAFOLIO DIGITAL */}
      {seccion === 'portafolio' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-gray-900/60 p-3 rounded border border-gray-800">
            <p className="text-xs text-gray-400">Límite MVP: Max 4 productos | Fotos optimizadas automáticamente a 150 KB para funcionamiento ligero.</p>
            <span className="text-[10px] bg-green-950 text-green-400 font-mono font-bold px-2 py-0.5 rounded border border-green-800">FORMATO: PDF + QR</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-950 border border-gray-800 rounded-lg space-y-2">
              <h4 className="text-sm font-bold text-white">🍫 Chocolate Artesanal Finca Chone</h4>
              <p className="text-xs text-gray-400"><strong className="text-gray-300">Virtudes:</strong> 100% orgánico, hecho con cacao de aroma fino.</p>
              <p className="text-xs text-gray-400"><strong className="text-gray-300">Características:</strong> Barra de 100g, empaque biodegradable.</p>
              <div className="flex justify-between items-center pt-2 border-t border-gray-800 text-xs">
                <span className="font-mono text-green-400 font-bold">$3.50</span>
                <div className="flex gap-2 text-[10px]">
                  <button className="bg-gray-900 px-2 py-1 rounded text-gray-300 border border-gray-700 hover:bg-gray-800">🖨️ Imprimir</button>
                  <button className="bg-green-700 text-white px-2 py-1 rounded font-bold hover:bg-green-600">📱 WhatsApp</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN 2: AGENDA DE FERIAS Y EVENTOS */}
      {seccion === 'ferias' && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">🎯 Ferias Destacadas (Sincronización Offline+Online)</h3>
          <div className="p-4 bg-gray-950 border border-gray-800 rounded-lg flex justify-between items-center">
            <div>
              <span className="text-[10px] bg-blue-950 text-blue-400 px-2 py-0.5 rounded font-bold font-mono">QUITO</span>
              <h4 className="text-sm font-bold text-white mt-1">Gran Feria del Emprendimiento Agrícola</h4>
              <p className="text-xs text-gray-400">Lugar: Parque La Carolina | Fecha: Sábado Próximo</p>
            </div>
            <button className="bg-gray-900 border border-gray-700 text-xs font-bold px-3 py-1.5 rounded text-green-400 hover:bg-gray-800">⭐ Marcar Interés</button>
          </div>
        </div>
      )}

      {/* SECCIÓN 3: SIMULADOR PRECIO PUERTA DE FINCA */}
      {seccion === 'simulador' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-950 p-4 rounded-lg border border-gray-800 space-y-3">
            <h3 className="text-sm font-bold text-white">📊 Costos de Producción</h3>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Jornales empleados ($):</label>
              <input type="number" value={costos.jornales} onChange={e => setCostos({...costos, jornales: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded p-1.5 text-xs text-white" />
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Insumos y Semillas ($):</label>
              <input type="number" value={costos.insumos} onChange={e => setCostos({...costos, insumos: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded p-1.5 text-xs text-white" />
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Fletes y Transporte ($):</label>
              <input type="number" value={costos.transporte} onChange={e => setCostos({...costos, transporte: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded p-1.5 text-xs text-white" />
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">Otros gastos indirectos ($):</label>
              <input type="number" value={costos.otros} onChange={e => setCostos({...costos, otros: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded p-1.5 text-xs text-white" />
            </div>
          </div>
          
          <div className="bg-gray-950 p-5 rounded-lg border border-green-900/40 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-green-400">📈 Dictamen de Ángel Finanzas</h3>
              <p className="text-xs text-gray-400 mt-1">Análisis offline basado en optimización de gastos puerta de finca.</p>
              
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-xs border-b border-gray-900 pb-2">
                  <span className="text-gray-400">Costo Real Total:</span>
                  <span className="font-mono text-white font-bold">${costoTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs border-b border-gray-900 pb-2">
                  <span className="text-gray-400">Margen Sugerido Feria (+15%):</span>
                  <span className="font-mono text-white font-bold">${(costoTotal * sugerenciaFeria).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 text-green-400 font-bold">
                  <span>Precio de Venta Recomendado:</span>
                  <span className="font-mono text-base">${precioSugeridoFeria.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 italic mt-4 border-t border-gray-900 pt-2">
              💡 Consejo: Al vender directamente en feria virtual o física, evita intermediarios para capturar este 15% de margen neto completo.
            </p>
          </div>
        </div>
      )}

      {/* SECCIÓN 4: GUÍA DE TRÁMITES LEGALES (ECUADOR) */}
      {seccion === 'tramites' && (
        <div className="space-y-4">
          {/* ARCSA */}
          <div className="p-4 bg-gray-950 border border-gray-800 rounded-lg">
            <div className="flex justify-between items-start">
              <h4 className="text-sm font-bold text-white">📋 Registro Sanitario (ARCSA - M001)</h4>
              <span className="text-[9px] bg-green-950 text-green-400 border border-green-800 px-2 py-0.5 rounded font-mono font-bold">COMPATIBLE OFFLINE</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
