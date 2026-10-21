// frontend/src/modules/registro_evidencias/RegistroEvidencias.jsx

import React, { useEffect, useState } from "react";

// ============================================================
// CONFIGURACIÓN DE API
// ============================================================

const API_BASE_URL = "http://127.0.0.1:8000";

// Ajusta estas rutas a las definidas realmente en tu FastAPI.
const ENDPOINTS = {
  contratos: `${API_BASE_URL}/contratos`,
  liberar: (id, rol) =>
    `${API_BASE_URL}/contratos/${encodeURIComponent(id)}/liberar/${encodeURIComponent(rol)}`,
};

// ============================================================
// COMPONENTE
// ============================================================

export default function RegistroEvidencias() {
  const [evidencias, setEvidencias] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [filtro, setFiltro] = useState("todos");

  // ==========================================================
  // FORMULARIO
  // ==========================================================

  const estadoInicialContrato = {
    usuario_id: "usr_productor_chone_99",
    categoria_bien: "Cosecha",
    nombre_documento: "",
    monto_total: "",
    url_foto_evidencia_firmas: "📸 Foto_Contrato_Firmado.jpg",
    url_foto_soporte_legal: "",
  };

  const [nuevoContrato, setNuevoContrato] = useState(estadoInicialContrato);

  // ==========================================================
  // DATOS MOCK OFFLINE
  // ==========================================================

  const datosMockOffline = [
    {
      id: "MEL-TX-MOCK01",
      categoria_bien: "Bienes Raíces",
      nombre_documento: "Venta Finca El Recuerdo (15 Has)",
      monto_total: 35000,
      comision_app: 1050,
      monto_liberado: 33950,
      estado_pago: "En Custodia",
      url_foto_evidencia_firmas: "📸 Foto_Firmas.jpg",
      url_foto_soporte_legal: "📄 Escritura_Notaria_Primera.jpg",
      hash_transaccion: "asset_finca_8821",
    },
  ];

  // ==========================================================
  // CARGAR EVIDENCIAS
  // ==========================================================

  const cargarEvidenciasYPerfiles = async () => {
    setCargando(true);

    try {
      /*
       * IMPORTANTE:
       * Esta llamada debe coincidir con la ruta real definida
       * en tu backend FastAPI.
       *
       * Mientras el backend no esté conectado, utilizamos
       * los datos mock offline.
       */

      // const respuesta = await fetch(ENDPOINTS.contratos);

      // if (!respuesta.ok) {
      //   throw new Error(`HTTP ${respuesta.status}`);
      // }

      // const datos = await respuesta.json();
      // setEvidencias(datos);

      // MODO MOCK ACTUAL
      setEvidencias(datosMockOffline);
    } catch (error) {
      console.error("⚠️ Error de conexión con el nodo local.", error);

      // Fallback offline
      setEvidencias(datosMockOffline);
    } finally {
      setCargando(false);
    }
  };

  // ==========================================================
  // CARGA INICIAL
  // ==========================================================

  useEffect(() => {
    cargarEvidenciasYPerfiles();
  }, []);

  // ==========================================================
  // ENVIAR A CUSTODIA
  // ==========================================================

  const manejarEnviarCustodia = async (e) => {
    e.preventDefault();

    // ------------------------------------------
    // Validación básica
    // ------------------------------------------

    if (!nuevoContrato.nombre_documento.trim()) {
      alert("⚠️ Debes ingresar la descripción del contrato.");
      return;
    }

    const monto = Number(nuevoContrato.monto_total);

    if (!Number.isFinite(monto) || monto <= 0) {
      alert("⚠️ El monto total debe ser un número mayor que cero.");
      return;
    }

    // ------------------------------------------
    // Validación de soporte legal
    // ------------------------------------------

    const requiereSoporteLegal =
      nuevoContrato.categoria_bien === "Bienes Raíces" ||
      nuevoContrato.categoria_bien === "Vehículos";

    if (requiereSoporteLegal && !nuevoContrato.url_foto_soporte_legal.trim()) {
      alert(
        `⚠️ ERROR DE TRANSPARENCIA:\n\n` +
          `Es obligatorio adjuntar el soporte legal ` +
          `(Escritura o Matrícula Vehicular) para la categoría ` +
          `[${nuevoContrato.categoria_bien}].`,
      );

      return;
    }

    // ------------------------------------------
    // Payload
    // ------------------------------------------

    const payload = {
      ...nuevoContrato,
      nombre_documento: nuevoContrato.nombre_documento.trim(),
      monto_total: monto,
      hash_transaccion:
        "tx_" + crypto.randomUUID().replace(/-/g, "").substring(0, 12),
    };

    setEnviando(true);

    try {
      const respuesta = await fetch(ENDPOINTS.contratos, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      // ------------------------------------------
      // Intentar obtener respuesta JSON
      // ------------------------------------------

      let datos = {};

      try {
        datos = await respuesta.json();
      } catch {
        datos = {};
      }

      // ------------------------------------------
      // Error HTTP
      // ------------------------------------------

      if (!respuesta.ok) {
        const mensaje =
          datos.detail || datos.message || `Error HTTP ${respuesta.status}`;

        alert(`❌ Error del servidor:\n${mensaje}`);

        return;
      }

      // ------------------------------------------
      // Confirmación
      // ------------------------------------------

      alert(
        `✅ CUSTODIA BLOQUEADA CON ÉXITO\n\n` +
          `Sello QR: ${datos.sello_verificacion_qr ?? "N/A"}\n` +
          `Retención App (3%): $${Number(
            datos.retencion_plataforma_3pct ?? 0,
          ).toLocaleString()}\n` +
          `Neto en Custodia: $${Number(
            datos.neto_por_liberar ?? 0,
          ).toLocaleString()}`,
      );

      // ------------------------------------------
      // Agregar registro a la interfaz
      // ------------------------------------------

      const nuevoItem = {
        id: datos.contrato_uuid ?? payload.hash_transaccion,
        categoria_bien: payload.categoria_bien,
        nombre_documento: payload.nombre_documento,
        monto_total: payload.monto_total,
        comision_app: Number(
          datos.retencion_plataforma_3pct ?? payload.monto_total * 0.03,
        ),
        monto_liberado: Number(
          datos.neto_por_liberar ?? payload.monto_total * 0.97,
        ),
        estado_pago: "En Custodia",
        url_foto_evidencia_firmas: payload.url_foto_evidencia_firmas,
        url_foto_soporte_legal: payload.url_foto_soporte_legal || "N/A",
        hash_transaccion: payload.hash_transaccion,
      };

      setEvidencias((prev) => [nuevoItem, ...prev]);

      // ------------------------------------------
      // Limpiar formulario
      // ------------------------------------------

      setNuevoContrato({
        ...estadoInicialContrato,
        url_foto_evidencia_firmas: "📸 Foto_Contrato_Firmado.jpg",
      });
    } catch (error) {
      console.error("Error enviando contrato:", error);

      alert(
        "❌ Error de comunicación.\n\n" +
          "Asegúrate de que tu backend FastAPI esté encendido " +
          "y que la URL configurada sea correcta.",
      );
    } finally {
      setEnviando(false);
    }
  };

  // ==========================================================
  // LIBERACIÓN DE FONDOS
  // ==========================================================

  const confirmarLiberacion = async (id, rol) => {
    try {
      const respuesta = await fetch(ENDPOINTS.liberar(id, rol), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      let datos = {};

      try {
        datos = await respuesta.json();
      } catch {
        datos = {};
      }

      if (respuesta.ok) {
        alert(
          `📢 RESPUESTA DE MEDIACIÓN:\n\n${
            datos.mensaje || datos.status || "Operación registrada."
          }`,
        );

        // ----------------------------------------
        // Actualizar estado sin usar estado obsoleto
        // ----------------------------------------

        if (datos.estado_pago === "Fondos Liberados al Vendedor") {
          setEvidencias((prev) =>
            prev.map((e) =>
              e.id === id
                ? {
                    ...e,
                    estado_pago: "Fondos Liberados al Vendedor",
                  }
                : e,
            ),
          );
        }
      } else {
        alert(
          `⚠️ No se pudo registrar la firma:\n${
            datos.detail || datos.message || `Error HTTP ${respuesta.status}`
          }`,
        );
      }
    } catch (error) {
      console.error("Error confirmando liberación:", error);

      alert("❌ Error al conectar con el servidor local para firmar.");
    }
  };

  // ==========================================================
  // FILTRADO
  // ==========================================================

  const evidenciasFiltradas = evidencias.filter(
    (e) => filtro === "todos" || e.categoria_bien === filtro,
  );

  // ==========================================================
  // FORMATEAR MONEDA
  // ==========================================================

  const formatoMoneda = (valor) =>
    Number(valor || 0).toLocaleString("es-EC", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="p-6 bg-gray-800 rounded-xl shadow-md border border-gray-700 max-w-5xl mx-auto my-4">
      {/* =====================================================
          FORMULARIO
      ====================================================== */}

      <div className="bg-gray-950 p-5 rounded-xl border border-gray-800 mb-6">
        <h3 className="text-sm font-bold text-green-400 uppercase tracking-wider mb-4">
          ⚖️ Registrar Nuevo Trato Comercial en Custodia Transparente
        </h3>

        <form
          onSubmit={manejarEnviarCustodia}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* CATEGORÍA */}

          <div>
            <label className="block text-[11px] font-semibold text-gray-400 mb-1">
              Categoría del Activo:
            </label>

            <select
              value={nuevoContrato.categoria_bien}
              onChange={(e) =>
                setNuevoContrato((prev) => ({
                  ...prev,
                  categoria_bien: e.target.value,
                }))
              }
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-xs text-white focus:border-green-500 focus:outline-none"
            >
              <option value="Cosecha">🌾 Cosecha Agropecuaria</option>

              <option value="Bienes Raíces">
                🏡 Bienes Raíces (Fincas/Haciendas)
              </option>

              <option value="Vehículos">🚜 Vehículos o Carga Pesada</option>

              <option value="Maquinaria">⚙️ Herramientas / Maquinaria</option>
            </select>
          </div>

          {/* DESCRIPCIÓN */}

          <div>
            <label className="block text-[11px] font-semibold text-gray-400 mb-1">
              Descripción del Contrato:
            </label>

            <input
              type="text"
              placeholder="Ej: Camioneta D-Max / Finca Chone"
              value={nuevoContrato.nombre_documento}
              onChange={(e) =>
                setNuevoContrato((prev) => ({
                  ...prev,
                  nombre_documento: e.target.value,
                }))
              }
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-xs text-white focus:border-green-500 focus:outline-none"
            />
          </div>

          {/* MONTO */}

          <div>
            <label className="block text-[11px] font-semibold text-gray-400 mb-1">
              Monto Total del Trato ($):
            </label>

            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Valor total acordado"
              value={nuevoContrato.monto_total}
              onChange={(e) =>
                setNuevoContrato((prev) => ({
                  ...prev,
                  monto_total: e.target.value,
                }))
              }
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-xs text-white focus:border-green-500 focus:outline-none"
            />
          </div>

          {/* SOPORTE LEGAL */}

          <div>
            <label className="block text-[11px] font-semibold text-gray-400 mb-1">
              {nuevoContrato.categoria_bien === "Bienes Raíces" ||
              nuevoContrato.categoria_bien === "Vehículos"
                ? "📄 Adjuntar Escritura/Matrícula (Obligatorio):"
                : "📄 Soporte Complementario (Opcional):"}
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ej: Escritura_Finca.jpg"
                value={nuevoContrato.url_foto_soporte_legal}
                onChange={(e) =>
                  setNuevoContrato((prev) => ({
                    ...prev,
                    url_foto_soporte_legal: e.target.value,
                  }))
                }
                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-xs text-white focus:border-green-500 focus:outline-none placeholder-gray-600"
              />

              <button
                type="submit"
                disabled={enviando}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold text-xs px-4 rounded transition"
              >
                {enviando ? "Enviando..." : "Bloquear"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* =====================================================
          FILTROS
      ====================================================== */}

      <div className="flex flex-wrap gap-1.5 bg-gray-950 p-1 rounded-lg border border-gray-800 text-xs font-bold mb-4">
        <button
          onClick={() => setFiltro("todos")}
          className={`flex-1 py-1.5 rounded transition ${
            filtro === "todos"
              ? "bg-green-600 text-white"
              : "text-gray-400 hover:bg-gray-900"
          }`}
        >
          Todos
        </button>

        <button
          onClick={() => setFiltro("Cosecha")}
          className={`flex-1 py-1.5 rounded transition ${
            filtro === "Cosecha"
              ? "bg-green-600 text-white"
              : "text-gray-400 hover:bg-gray-900"
          }`}
        >
          🌾 Cosechas
        </button>

        <button
          onClick={() => setFiltro("Bienes Raíces")}
          className={`flex-1 py-1.5 rounded transition ${
            filtro === "Bienes Raíces"
              ? "bg-green-600 text-white"
              : "text-gray-400 hover:bg-gray-900"
          }`}
        >
          🏡 Inmuebles
        </button>

        <button
          onClick={() => setFiltro("Vehículos")}
          className={`flex-1 py-1.5 rounded transition ${
            filtro === "Vehículos"
              ? "bg-green-600 text-white"
              : "text-gray-400 hover:bg-gray-900"
          }`}
        >
          🚜 Vehículos
        </button>

        <button
          onClick={() => setFiltro("Maquinaria")}
          className={`flex-1 py-1.5 rounded transition ${
            filtro === "Maquinaria"
              ? "bg-green-600 text-white"
              : "text-gray-400 hover:bg-gray-900"
          }`}
        >
          ⚙️ Maquinaria
        </button>
      </div>

      {/* =====================================================
          REPOSITORIO
      ====================================================== */}

      <div className="divide-y divide-gray-800/60">
        {cargando ? (
          <div className="p-8 text-center text-gray-400">
            ⏳ Cargando registros...
          </div>
        ) : evidenciasFiltradas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No existen registros para esta categoría.
          </div>
        ) : (
          evidenciasFiltradas.map((item) => (
            <div
              key={item.id}
              className="p-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 hover:bg-gray-900/20 transition"
            >
              {/* DETALLES */}

              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] font-mono font-bold text-green-500 bg-gray-900 px-2 py-0.5 rounded border border-gray-800">
                    {item.hash_transaccion}
                  </span>

                  <span className="text-[9px] bg-blue-950 text-blue-300 font-mono px-2 py-0.5 rounded border border-blue-900/40 uppercase font-bold">
                    {item.categoria_bien}
                  </span>

                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                      item.estado_pago.includes("Liberados")
                        ? "bg-green-950 text-green-400 border border-green-800"
                        : "bg-amber-950 text-amber-400 border border-amber-800 animate-pulse"
                    }`}
                  >
                    {item.estado_pago}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white mt-1">
                  {item.nombre_documento}
                </h4>

                <p className="text-[11px] text-gray-500 font-mono">
                  📸 Soporte Firmas: {item.url_foto_evidencia_firmas}
                  {" | "}
                  📄 Legal:{" "}
                  <span className="text-sky-400 font-semibold">
                    {item.url_foto_soporte_legal}
                  </span>
                </p>
              </div>

              {/* CAPITAL */}

              <div className="flex items-center justify-between lg:justify-end gap-6 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-none border-gray-800">
                <div className="text-right font-mono">
                  <p className="text-xs text-gray-500">
                    Monto Total: ${formatoMoneda(item.monto_total)}
                  </p>

                  <p className="text-xs text-amber-500">
                    Tasa App (3%): ${formatoMoneda(item.comision_app)}
                  </p>

                  <p className="text-sm font-black text-green-400">
                    Neto: ${formatoMoneda(item.monto_liberado)}
                  </p>
                </div>

                {/* FIRMAS */}

                {item.estado_pago === "En Custodia" ? (
                  <div className="flex flex-col sm:flex-row gap-1.5">
                    <button
                      onClick={() => confirmarLiberacion(item.id, "vendedor")}
                      className="bg-gray-900 hover:bg-green-950 border border-gray-700 hover:border-green-800 text-[10px] font-bold px-2.5 py-1.5 rounded text-gray-200 transition"
                    >
                      ✍️ Firma Vendedor
                    </button>

                    <button
                      onClick={() => confirmarLiberacion(item.id, "comprador")}
                      className="bg-gray-900 hover:bg-green-950 border border-gray-700 hover:border-green-800 text-[10px] font-bold px-2.5 py-1.5 rounded text-gray-200 transition"
                    >
                      ✍️ Firma Comprador
                    </button>
                  </div>
                ) : (
                  <div className="text-[11px] bg-green-950/40 border border-green-900/60 p-2 rounded text-green-400 font-mono font-bold text-center">
                    🔒 Fondos Transferidos
                    <br />
                    Negocio Justo ✔️
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
