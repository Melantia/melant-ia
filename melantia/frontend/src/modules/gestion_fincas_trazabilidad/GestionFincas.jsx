// frontend/src/modules/gestion_fincas_trazabilidad/GestionFincas.jsx
// Módulo 3 — Gestión de Fincas conectada a la API real
// (/api/v1/fincas + /api/v1/geografia). Sin datos ficticios: todo lo
// visible proviene de PostgreSQL vía FastAPI.
import React, { useCallback, useEffect, useState } from "react";
import {
  actualizarFinca,
  actualizarLote,
  crearFinca,
  crearLote,
  listarCantones,
  listarFincas,
  listarParroquias,
  listarProvincias,
  obtenerFinca,
} from "./fincas.service";

const FORM_VACIO = {
  nombre: "",
  tipo_pyme: "PYME Agropecuaria",
  provincia_id: "",
  canton_id: "",
  parroquia_id: "",
  coordenadas_gps: "",
};

const LOTE_VACIO = {
  nombre_lote: "",
  cultivo_principal: "",
  variedad: "",
  fecha_siembra: "",
  area_metros_cuadrados: "",
  estado_salud_lote: "",
};

const inputCls =
  "w-full bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:border-green-500 focus:outline-none";

function aNumeroOVacio(v) {
  return v === "" ? undefined : Number(v);
}

export default function GestionFincas() {
  const [fincas, setFincas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [aviso, setAviso] = useState(null);

  const [form, setForm] = useState(FORM_VACIO);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState(null); // finca en edición
  const [detalle, setDetalle] = useState(null); // finca abierta
  const [guardando, setGuardando] = useState(false);

  const [provincias, setProvincias] = useState([]);
  const [cantones, setCantones] = useState([]);
  const [parroquias, setParroquias] = useState([]);

  const [formLote, setFormLote] = useState(LOTE_VACIO);
  const [mostrarFormLote, setMostrarFormLote] = useState(false);

  const cargarFincas = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setFincas(await listarFincas());
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarFincas();
    listarProvincias()
      .then(setProvincias)
      .catch((e) => setError(e.message));
  }, [cargarFincas]);

  // Selects en cascada (catálogo DPA/INEC)
  useEffect(() => {
    setCantones([]);
    setParroquias([]);
    if (form.provincia_id) {
      listarCantones(Number(form.provincia_id))
        .then(setCantones)
        .catch(() => {});
    }
  }, [form.provincia_id]);

  useEffect(() => {
    setParroquias([]);
    if (form.canton_id) {
      listarParroquias(Number(form.canton_id))
        .then(setParroquias)
        .catch(() => {});
    }
  }, [form.canton_id]);

  const cambiar = (campo, valor) =>
    setForm((f) => ({ ...f, [campo]: valor }));

  const abrirDetalle = async (id) => {
    setError(null);
    try {
      setDetalle(await obtenerFinca(id));
      setEditando(null);
      setMostrarFormLote(false);
    } catch (e) {
      setError(e.message);
    }
  };

  const iniciarEdicion = (finca) => {
    setEditando(finca.id);
    // El formulario vive en la vista lista: cerramos el detalle para
    // mostrarlo (al guardar, guardarFinca reabre el detalle).
    setDetalle(null);
    setForm({
      nombre: finca.nombre || "",
      tipo_pyme: finca.tipo_pyme || "PYME Agropecuaria",
      provincia_id: finca.provincia_id || "",
      canton_id: finca.canton_id || "",
      parroquia_id: finca.parroquia_id || "",
      coordenadas_gps: finca.coordenadas_gps || "",
    });
    setMostrarForm(true);
  };

  const guardarFinca = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    const payload = {
      nombre: form.nombre,
      tipo_pyme: form.tipo_pyme || undefined,
      provincia_id: aNumeroOVacio(form.provincia_id),
      canton_id: aNumeroOVacio(form.canton_id),
      parroquia_id: aNumeroOVacio(form.parroquia_id),
      coordenadas_gps: form.coordenadas_gps || undefined,
    };
    try {
      if (editando) {
        await actualizarFinca(editando, payload);
        setAviso("Finca actualizada.");
        await abrirDetalle(editando);
      } else {
        const nueva = await crearFinca(payload);
        setAviso(`Finca "${nueva.nombre}" registrada.`);
      }
      setForm(FORM_VACIO);
      setMostrarForm(false);
      setEditando(null);
      await cargarFincas();
    } catch (e2) {
      setError(e2.message);
    } finally {
      setGuardando(false);
    }
  };

  const guardarLote = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await crearLote(detalle.id, {
        nombre_lote: formLote.nombre_lote,
        cultivo_principal: formLote.cultivo_principal || undefined,
        variedad: formLote.variedad || undefined,
        fecha_siembra: formLote.fecha_siembra || undefined,
        area_metros_cuadrados: aNumeroOVacio(formLote.area_metros_cuadrados),
        estado_salud_lote: formLote.estado_salud_lote || undefined,
      });
      setFormLote(LOTE_VACIO);
      setMostrarFormLote(false);
      setAviso("Lote registrado.");
      await abrirDetalle(detalle.id);
      await cargarFincas();
    } catch (e2) {
      setError(e2.message);
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstadoLote = async (lote, estado) => {
    setError(null);
    try {
      await actualizarLote(detalle.id, lote.id, {
        estado_salud_lote: estado,
      });
      await abrirDetalle(detalle.id);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="p-6 bg-gray-800 rounded-xl shadow-md border border-gray-700 max-w-5xl mx-auto my-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-green-400">
            🚜 Gestión de Fincas y Trazabilidad Estricta
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Control integral para Pequeñas y Medianas Empresas (PYMES) del
            agro. Datos sincronizados con el servidor MELANTIA.
          </p>
        </div>
        {!detalle && (
          <button
            onClick={() => {
              setMostrarForm(!mostrarForm);
              setEditando(null);
              setForm(FORM_VACIO);
            }}
            className="bg-green-600 text-xs font-bold px-3 py-1.5 rounded hover:bg-green-500 text-white transition"
          >
            {mostrarForm ? "✕ Cancelar" : "+ Nueva Finca"}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-950 border border-red-800 text-red-300 text-xs px-3 py-2 rounded">
          ⚠️ {error}
        </div>
      )}
      {aviso && (
        <div
          className="mb-4 bg-green-950 border border-green-800 text-green-300 text-xs px-3 py-2 rounded cursor-pointer"
          onClick={() => setAviso(null)}
        >
          ✅ {aviso}
        </div>
      )}

      {/* ============ VISTA DETALLE DE FINCA ============ */}
      {detalle ? (
        <div className="space-y-4">
          <button
            onClick={() => setDetalle(null)}
            className="text-xs text-gray-400 hover:text-green-400 font-mono"
          >
            ← Volver a mis fincas
          </button>

          <div className="bg-gray-950 p-4 rounded-lg border border-gray-800">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {detalle.nombre}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {[detalle.parroquia, detalle.canton, detalle.provincia]
                    .filter(Boolean)
                    .join(", ") || "Ubicación sin registrar"}
                </p>
                {detalle.coordenadas_gps && (
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                    📍 {detalle.coordenadas_gps}
                  </p>
                )}
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-[10px] bg-blue-950 text-blue-400 border border-blue-800 px-2 py-0.5 rounded font-mono font-bold">
                  {detalle.tipo_pyme}
                </span>
                <button
                  onClick={() => iniciarEdicion(detalle)}
                  className="text-[10px] bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-2 py-1 rounded"
                >
                  ✏️ Editar
                </button>
              </div>
            </div>
          </div>

          {/* LOTES */}
          <div className="bg-gray-950 p-4 rounded-lg border border-gray-800">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                🌾 Lotes ({detalle.lotes?.length ?? 0})
              </h3>
              <button
                onClick={() => setMostrarFormLote(!mostrarFormLote)}
                className="bg-green-600 text-[11px] font-bold px-2 py-1 rounded hover:bg-green-500 text-white transition"
              >
                {mostrarFormLote ? "✕" : "+ Nuevo Lote"}
              </button>
            </div>

            {mostrarFormLote && (
              <form
                onSubmit={guardarLote}
                className="mb-4 p-3 bg-gray-900 border border-gray-800 rounded space-y-2"
              >
                <input
                  required
                  placeholder="Nombre del lote *"
                  value={formLote.nombre_lote}
                  onChange={(e) =>
                    setFormLote({ ...formLote, nombre_lote: e.target.value })
                  }
                  className={inputCls}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    placeholder="Cultivo principal"
                    value={formLote.cultivo_principal}
                    onChange={(e) =>
                      setFormLote({
                        ...formLote,
                        cultivo_principal: e.target.value,
                      })
                    }
                    className={inputCls}
                  />
                  <input
                    placeholder="Variedad"
                    value={formLote.variedad}
                    onChange={(e) =>
                      setFormLote({ ...formLote, variedad: e.target.value })
                    }
                    className={inputCls}
                  />
                  <input
                    type="date"
                    title="Fecha de siembra"
                    value={formLote.fecha_siembra}
                    onChange={(e) =>
                      setFormLote({
                        ...formLote,
                        fecha_siembra: e.target.value,
                      })
                    }
                    className={inputCls}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Área (m²)"
                    value={formLote.area_metros_cuadrados}
                    onChange={(e) =>
                      setFormLote({
                        ...formLote,
                        area_metros_cuadrados: e.target.value,
                      })
                    }
                    className={inputCls}
                  />
                </div>
                <input
                  placeholder="Estado sanitario (ej. Sano, Monitoreo, Crítico)"
                  value={formLote.estado_salud_lote}
                  onChange={(e) =>
                    setFormLote({
                      ...formLote,
                      estado_salud_lote: e.target.value,
                    })
                  }
                  className={inputCls}
                />
                <button
                  disabled={guardando}
                  className="bg-green-600 text-xs font-bold px-3 py-1.5 rounded hover:bg-green-500 text-white disabled:opacity-50"
                >
                  {guardando ? "Guardando…" : "Guardar Lote"}
                </button>
              </form>
            )}

            {detalle.lotes?.length === 0 && (
              <p className="text-xs text-gray-500">
                Sin lotes registrados. Crea el primero para empezar la
                trazabilidad del cultivo.
              </p>
            )}
            <div className="space-y-2">
              {detalle.lotes?.map((lote) => (
                <div
                  key={lote.id}
                  className="p-3 bg-gray-900 border border-gray-800 rounded-lg"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-white">
                      {lote.nombre_lote}
                    </span>
                    <select
                      value={lote.estado_salud_lote || ""}
                      onChange={(e) => cambiarEstadoLote(lote, e.target.value)}
                      className="text-[10px] bg-gray-950 border border-gray-700 text-gray-300 rounded px-1.5 py-0.5"
                    >
                      <option value="">Estado…</option>
                      <option value="Sano">Sano</option>
                      <option value="Monitoreo">Monitoreo</option>
                      <option value="Crítico">Crítico</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 pt-2 mt-2 border-t border-gray-800/60">
                    <div>
                      🌱 {lote.cultivo_principal || "—"}
                      {lote.variedad ? ` (${lote.variedad})` : ""}
                    </div>
                    <div>
                      📐{" "}
                      {lote.area_metros_cuadrados != null
                        ? `${Number(lote.area_metros_cuadrados).toLocaleString()} m²`
                        : "—"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ============ VISTA LISTA DE FINCAS ============ */
        <>
          {mostrarForm && (
            <form
              onSubmit={guardarFinca}
              className="mb-6 bg-gray-950 p-4 rounded-lg border border-gray-800 space-y-3"
            >
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {editando ? "✏️ Editar Finca" : "🏢 Nueva Finca"}
              </h3>
              <input
                required
                placeholder="Nombre de la finca *"
                value={form.nombre}
                onChange={(e) => cambiar("nombre", e.target.value)}
                className={inputCls}
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={form.provincia_id}
                  onChange={(e) => {
                    cambiar("provincia_id", e.target.value);
                    cambiar("canton_id", "");
                    cambiar("parroquia_id", "");
                  }}
                  className={inputCls}
                >
                  <option value="">Provincia…</option>
                  {provincias.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
                <select
                  value={form.canton_id}
                  onChange={(e) => {
                    cambiar("canton_id", e.target.value);
                    cambiar("parroquia_id", "");
                  }}
                  disabled={!form.provincia_id}
                  className={inputCls}
                >
                  <option value="">Cantón…</option>
                  {cantones.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
                <select
                  value={form.parroquia_id}
                  onChange={(e) => cambiar("parroquia_id", e.target.value)}
                  disabled={!form.canton_id}
                  className={inputCls}
                >
                  <option value="">Parroquia…</option>
                  {parroquias.map((pa) => (
                    <option key={pa.id} value={pa.id}>
                      {pa.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  placeholder="Coordenadas GPS (ej. -2.9001,-79.0059)"
                  value={form.coordenadas_gps}
                  onChange={(e) => cambiar("coordenadas_gps", e.target.value)}
                  className={inputCls}
                />
                <input
                  placeholder="Tipo PYME"
                  value={form.tipo_pyme}
                  onChange={(e) => cambiar("tipo_pyme", e.target.value)}
                  className={inputCls}
                />
              </div>
              <button
                disabled={guardando}
                className="bg-green-600 text-xs font-bold px-3 py-1.5 rounded hover:bg-green-500 text-white disabled:opacity-50"
              >
                {guardando
                  ? "Guardando…"
                  : editando
                    ? "Guardar Cambios"
                    : "Registrar Finca"}
              </button>
            </form>
          )}

          {cargando ? (
            <p className="text-xs text-gray-500 font-mono animate-pulse">
              Sincronizando fincas…
            </p>
          ) : fincas.length === 0 ? (
            <div className="bg-gray-950 p-6 rounded-lg border border-gray-800 text-center">
              <p className="text-sm text-gray-400">
                Aún no tienes fincas registradas.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Registra tu primera finca para gestionar lotes, hatos y
                trazabilidad.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {fincas.map((f) => (
                <button
                  key={f.id}
                  onClick={() => abrirDetalle(f.id)}
                  className="text-left p-3 bg-gray-950 border border-gray-800 rounded-lg space-y-2 hover:border-green-700 transition"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-white">
                      {f.nombre}
                    </span>
                    <span className="text-[10px] bg-blue-950 text-blue-400 border border-blue-800 px-2 py-0.5 rounded font-mono font-bold">
                      {f.tipo_pyme}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    {[f.parroquia, f.canton, f.provincia]
                      .filter(Boolean)
                      .join(", ") || "Ubicación sin registrar"}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 pt-2 border-t border-gray-800/60">
                    <div>
                      🗺️{" "}
                      <span className="text-gray-200 font-semibold">
                        {f.num_lotes} Lotes
                      </span>{" "}
                      de Terreno
                    </div>
                    <div>
                      🐂{" "}
                      <span className="text-gray-200 font-semibold">
                        {f.num_hatos} Hatos
                      </span>{" "}
                      / Crianza
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
