// frontend/src/modules/registro_evidencias/DocumentosYImpresion.jsx
import React, { useState } from 'react';

export default function DocumentosYImpresion() {
  // Datos que incluyen bienes raíces, vehículos y herramientas de alto valor
  const [evidencias] = useState([
    { 
      id: "MEL-TX-2026-881", 
      fecha: "2026-09-16", 
      tipo: "Cierre de Trato: Plátano Barraganete", 
      categoria: "Cosecha",
      detalle: "500 Cajas - Vendedor: Don Cleto -> Comprador: AgroCorp", 
      montoTotal: 4500, 
      comisionApp: 135, // 3%
      montoLiberado: 4365,
      evidenciaFoto: "📸 Foto de Contrato Firmado + Foto de Carga Pesada en Camión",
      soporteLegal: "N/A (Producto Agrícola)",
      estadoPago: "Fondos Liberados al Vendedor"
    },
    { 
      id: "MEL-TX-2026-883", 
      fecha: "2026-09-16", 
      tipo: "Venta de Inmueble: Finca El Recuerdo (15 Has)", 
      categoria: "Bienes Raíces / Propiedad",
      detalle: "Vendedor: Ing. Mendoza -> Comprador: Familia Cedeño", 
      montoTotal: 35000, 
      comisionApp: 1050, // 3%
      montoLiberado: 33950,
      evidenciaFoto: "📸 Foto de Ambas Partes Firmando + Comprobante de Depósito Cooperativa",
      soporteLegal: "📄 FOTO DE ESCRITURA PÚBLICA (Notaría Primera) - Validada Offline",
      estadoPago: "Fondos Liberados (Ambas partes confirmaron acuerdo)"
    },
    { 
      id: "MEL-TX-2026-884", 
      fecha: "2026-09-14", 
      tipo: "Venta de Vehículo: Camioneta Chevrolet D-Max 4x4", 
      categoria: "Vehículos / Maquinaria",
      detalle: "Vendedor: Luis Loor -> Comprador: Don Goyo (Transportista)", 
      montoTotal: 18000, 
      comisionApp: 540, // 3%
      montoLiberado: 17460,
      evidenciaFoto: "📸 Foto de la Camioneta + Revisión Física de Herramientas",
      soporteLegal: "🚗 FOTO DE MATRÍCULA VEHICULAR (ANT) - Revisada libre de gravámenes",
      estadoPago: "En Custodia (Esperando confirmación final del comprador)"
    }
  ]);

  const [filtro, setFiltro] = useState('todos');

  const exportarExcelCsv = () => {
    let csv = "ID Transaccion;Fecha;Categoria;Operacion;Monto Total ($);Tasa MelantIA 3% ($);Liberado ($);Evidencias;Soporte Propiedad;Estado\n";
    evidencias.forEach(e => {
      csv += `${e.id};${e.fecha};${e.categoria};${e.tipo};${e.montoTotal};${e.comisionApp};${e.montoLiberado};${e.evidenciaFoto};${e.soporteLegal};${e.estadoPago}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MELANTIA_CONTRATOS_Y_PROPIEDADES_2026.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const visualizarFichaDigital = (item) => {
    const ventana = window.open('', '_blank');
    ventana.document.write(`
      <html>
        <head>
          <title>MELANTIA - Transparencia de Activos e Inmuebles</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; background: #0f172a; color: #e2e8f0; padding: 30px; }
            .contenedor { border: 2px solid #22c55e; background: #1e293b; padding: 25px; max-width: 650px; margin: 0 auto; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
            .logo-header { text-align: center; border-bottom: 2px dashed #334155; padding-bottom: 15px; margin-bottom: 20px; }
            .logo-title { color: #22c55e; font-size: 24px; font-weight: 900; letter-spacing: 2px; margin: 0; }
            .logo-sub { font-size: 10px; color: #94a3b8; font-weight: bold; margin-top: 4px; }
            .campo { font-size: 13px; margin: 10px 0; border-bottom: 1px solid #334155; padding-bottom: 6px; }
            .valor { font-weight: bold; color: #fff; }
            .resaltado-verde { color: #4ade80; font-weight: bold; }
            .resaltado-azul { color: #38bdf8; font-weight: bold; }
            .qr-zona { text-align: center; margin-top: 25px; padding-top: 15px; border-top: 2px dashed #334155; }
            .qr-img { border: 4px solid #fff; border-radius: 6px; }
            .btn-imprimir { background: #22c55e; color: #fff; border: none; padding: 8px 16px; font-weight: bold; border-radius: 4px; cursor: pointer; margin-top: 15px; }
            @media print { .btn-imprimir { display: none; } body { background: #fff; color: #000; } .contenedor { border: 1px solid #000; box-shadow: none; background: #fff; } .campo { border-bottom: 1px solid #000; } .valor, .resaltado-verde, .resaltado-azul { color: #000; } }
          </style>
        </head>
        <body>
          <div className="contenedor">
            <div className="logo-header">
              <h1 className="logo-title">MELANTIA AGRO</h1>
              <div className="logo-sub">PRODUCTIVIDAD AGROPECUARIA INTELIGENTE OFFLINE</div>
              <div style="background: #1e3a8a; color: #93c5fd; display: inline-block; font-size: 10px; padding: 2px 10px; border-radius: 4px; margin-top: 8px; font-weight: bold; border: 1px solid #2563eb;">REGISTRO SEGURO DE ACTIVOS</div>
            </div>

            <div className="campo">🔍 ID CONTRATO: <span className="valor">${item.id}</span></div>
            <div className="campo">📅 FECHA DE REGISTRO: <span className="valor">${item.fecha}</span></div>
            <div className="campo">🏷️ CATEGORÍA DE BIEN: <span className="valor">${item.categoria}</span></div>
            <div className="campo">🌾 OPERACIÓN: <span className="valor">${item.tipo}</span></div>
            <div className="campo">📝 DETALLE DE LAS PARTES: <span className="valor">${item.detalle}</span></div>
            
            <div className="campo">📸 EVIDENCIA GENERAL: <span className="resaltado-verde">${item.evidenciaFoto}</span></div>
            <div className="campo" style="background: #020617; padding: 8px; border-radius: 4px; margin: 8px 0;">
              🛡️ VALIDACIÓN TITULARIDAD: <span className="resaltado-azul">${item.soporteLegal}</span>
            </div>
            
            <div style="margin-top: 15px; background: #0f172a; padding: 12px; border-radius: 6px;">
              <div className="campo" style="border:none; padding:0;">💰 Precio Acordado del Activo: <span className="valor">$${item.montoTotal.toFixed(2)}</span></div>
              <div className="campo" style="border:none; padding:0; color: #f59e0b;">⚡ Tasa de Mediación MelantIA (3%): <span className="valor" style="color: #f59e0b;">$${item.comisionApp.toFixed(2)}</span></div>
              <div className="campo" style="border:none; padding:0; margin-top: 5px; font-size: 14px;">✅ FONDOS LIQUIDADOS: <span className="resaltado-verde">$${item.montoLiberado.toFixed(2)}</span></div>
            </div>

            <div className="campo" style="text-align: center; margin-top: 15px; font-weight: bold; color: #f59e0b; font-size: 14px;">STATUS: ${item.estadoPago}</div>

            <div className="qr-zona">
              <img className="qr-img" src="https://googleapis.com{item.id}" alt="QR Validación" />
              <p style="font-size: 11px; color: #94a3b8; margin-top: 8px;">Este QR consolida las fotos de las escrituras/matrículas y firmas del trato. Cualquier persona puede leerlo desde el celular en el territorio para comprobar la transparencia comercial.</p>
              <button className="btn-imprimir" onclick="window.print()">🖨️ Imprimir Respaldo Físico</button>
            </div>
          </div>
        </body>
      </html>
    `);
    ventana.document.close();
  };

  const evidenciasFiltradas = evidencias.filter(e => filtro === 'todos' || e.categoria.toLowerCase().includes(filtro));

  return (
    <div className="p-6 bg-gray-800 rounded-xl shadow-md border border-gray-700 max-w-5xl mx-auto my-4">
      
      {/* SECCIÓN SUPERIOR DE ACCIONES GENERALES */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-green-400">📂 Central de Transparencia, Evidencias y Carpeta Documental</h2>
          <p className="text-xs text-gray-400 mt-1">Custodia inmutable de tratos agrícolas, bienes raíces, maquinaria y herramientas con sello de verificación QR.</p>
        </div>
        <button 
          onClick={exportarExcelCsv}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition flex items-center gap-2 shadow-md w-full lg:w-auto justify-center"
        >
          📊 Descargar Todo a Excel (.CSV)
        </button>
      </div>

      {/* FILTROS DE AUDITORÍA */}
      <div className="flex flex-wrap gap-1.5 bg-gray-950 p-1 rounded-lg border border-gray-800 text-xs font-bold mb-4">
        <button onClick={() => setFiltro('todos')} className={`flex-1 py-1.5 rounded transition ${filtro === 'todos' ? 'bg-green-600 text-white' : 'text-gray-400 hover:bg-gray-900'}`}>Todos</button>
        <button onClick={() => setFiltro('cosecha')} className={`flex-1 py-1.5 rounded transition ${filtro === 'cosecha' ? 'bg-green-600 text-white' : 'text-gray-400 hover:bg-gray-900'}`}>🌾 Cosechas</button>
        <button onClick={() => setFiltro('propiedad')} className={`flex-1 py-1.5 rounded transition ${filtro === 'propiedad' ? 'bg-green-600 text-white' : 'text-gray-400 hover:bg-gray-900'}`}>🏡 Fincas / Casas</button>
        <button onClick={() => setFiltro('vehículos')} className={`flex-1 py-1.5 rounded transition ${filtro === 'vehículos' ? 'bg-green-600 text-white' : 'text-gray-400 hover:bg-gray-900'}`}>🚜 Vehículos / Equipos</button>
      </div>

      {/* REPOSITORIO CENTRAL DE INFORMES DE NEGOCIOS */}
      <div className="bg-gray-950 rounded-lg border border-gray-800 overflow-hidden">
        <div className="p-3.5 bg-gray-900/80 border-b border-gray-800 flex justify-between items-center">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">Registro Histórico de Mediación y Transparencia</h3>
        </div>
      </div>
    </div>
  );
}
