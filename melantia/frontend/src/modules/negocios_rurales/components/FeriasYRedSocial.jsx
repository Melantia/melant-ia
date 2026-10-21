// frontend/src/modules/negocios_rurales/FeriasYRedSocial.jsx
import React, { useEffect, useState } from "react";

// ============================================================
// CONFIGURACIÓN Y CONTINGENCIA OFFLINE
// ============================================================
const STORAGE_KEY = "melantia_red_social";

const PUBLICACIONES_INICIALES = [
  {
    id: "init-1",
    autor: "Don Cleto Mendoza",
    ubicacion: "Chone, Manabí",
    tipo: "feria",
    contenido:
      "📢 ¡Atención! Estaré exponiendo mañana en la Gran Feria Ganadera Virtual. Llevo 15 lotes de ganado vacuno de alta genética. ¡Acepto ofertas por la Bolsa de MelantIA!",
    meGusta: 12,
    comentarios: [
      "Excelente ganado, recomendado.",
      "¿Hacen envíos con los transportistas pesados de la app?",
    ],
  },
  {
    id: "init-2",
    autor: "María Auxiliadora",
    ubicacion: "El Carmen",
    tipo: "social",
    contenido:
      "Iniciando la cosecha de Plátano Barraganete de exportación. Excelente calidad gracias a las alertas de clima del Asistente Técnico. ¡Interesados, dejen su oferta en la sección de compra!",
    meGusta: 24,
    comentarios: ["¡Qué orgullo ver ese producto!"],
  },
];

function cargarPublicacionesLocales() {
  try {
    const datosLocales = localStorage.getItem(STORAGE_KEY);
    if (!datosLocales) return PUBLICACIONES_INICIALES;

    const publicaciones = JSON.parse(datosLocales);
    if (!Array.isArray(publicaciones)) {
      console.warn(
        "⚠️ Los datos locales de MELANTIA no tienen un formato válido.",
      );
      return PUBLICACIONES_INICIALES;
    }
    return publicaciones;
  } catch (error) {
    console.error("❌ No se pudieron cargar las publicaciones locales:", error);
    return PUBLICACIONES_INICIALES;
  }
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function FeriasYRedSocial() {
  const [publicaciones, setPublicaciones] = useState(
    cargarPublicacionesLocales,
  );
  const [nuevoPost, setNuevoPost] = useState("");
  const [tipoPost, setTipoPost] = useState("social");
  const [filtro, setFiltro] = useState("todos");

  // Guardado automático en el localStorage del navegador
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(publicaciones));
    } catch (error) {
      console.error("❌ No se pudieron guardar las publicaciones:", error);
    }
  }, [publicaciones]);

  const manejarPublicar = (e) => {
    e.preventDefault();
    const contenido = nuevoPost.trim();
    if (!contenido) return;

    // Generador de ID tolerante a fallos de compatibilidad en entornos rurales (Local-First)
    const idUnico =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : "post_" +
          Date.now() +
          "_" +
          Math.random().toString(36).substring(2, 9);

    const post = {
      id: idUnico,
      autor: "Productor Local (Offline)",
      ubicacion: "Zona MelantIA",
      tipo: tipoPost,
      contenido,
      meGusta: 0,
      comentarios: [],
    };

    setPublicaciones((prev) => [post, ...prev]);
    setNuevoPost("");
  };

  const darMeGusta = (id) => {
    setPublicaciones((prev) =>
      prev.map((publicacion) =>
        publicacion.id === id
          ? { ...publicacion, meGusta: publicacion.meGusta + 1 }
          : publicacion,
      ),
    );
  };

  const publicacionesFiltradas = publicaciones.filter(
    (publicacion) => filtro === "todos" || publicacion.tipo === filtro,
  );

  return (
    <div className="p-6 bg-gray-800 rounded-xl shadow-md border border-gray-700 max-w-4xl mx-auto my-6">
      {/* ENCABEZADO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-gray-700 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-green-400">
            🤝 Conexión Rural y Ferias Virtuales
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Publica tus productos, interactúa con la comunidad y participa en
            ferias agropecuarias.
          </p>
        </div>

        {/* FILTROS DE CONTENIDO */}
        <div className="flex gap-2 bg-gray-950 p-1 rounded-lg border border-gray-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFiltro("todos")}
            className={`px-3 py-1.5 rounded transition ${filtro === "todos" ? "bg-green-600 text-white" : "text-gray-400 hover:text-gray-200"}`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setFiltro("social")}
            className={`px-3 py-1.5 rounded transition ${filtro === "social" ? "bg-green-600 text-white" : "text-gray-400 hover:text-gray-200"}`}
          >
            📢 Red Social
          </button>
          <button
            type="button"
            onClick={() => setFiltro("feria")}
            className={`px-3 py-1.5 rounded transition ${filtro === "feria" ? "bg-green-600 text-white" : "text-gray-400 hover:text-gray-200"}`}
          >
            🎪 Ferias
          </button>
        </div>
      </div>

      {/* FORMULARIO PARA CREAR PUBLICACIÓN */}
      <form
        onSubmit={manejarPublicar}
        className="bg-gray-950 p-4 rounded-lg mb-6 border border-gray-800"
      >
        <textarea
          rows={3}
          value={nuevoPost}
          onChange={(e) => setNuevoPost(e.target.value)}
          placeholder="¿Qué estás cosechando hoy? ¿Quieres anunciar tu participación en una feria o promocionar un lote?"
          className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-sm text-white focus:outline-none focus:border-green-500 placeholder-gray-500 resize-none"
          maxLength={1000}
        />

        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">
              Categoría de Post:
            </span>
            <select
              value={tipoPost}
              onChange={(e) => setTipoPost(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-green-500 font-semibold"
            >
              <option value="social">Comunidad (Red Social)</option>
              <option value="feria">Promoción de Feria Virtual</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={!nuevoPost.trim()}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold text-xs px-5 py-2 rounded transition shadow-md"
          >
            Compartir en el Muro
          </button>
        </div>
      </form>

      {/* MURO DE PUBLICACIONES */}
      <div className="space-y-4">
        {publicacionesFiltradas.length === 0 ? (
          <p className="text-center text-sm text-gray-500 font-medium py-6">
            No hay publicaciones en esta categoría todavía.
          </p>
        ) : (
          publicacionesFiltradas.map((post) => (
            <div
              key={post.id}
              className="p-4 bg-gray-900 rounded-lg border border-gray-800 hover:border-gray-700 transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">
                      {post.autor}
                    </h4>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${post.tipo === "feria" ? "bg-amber-950 text-amber-400 border border-amber-800" : "bg-blue-950 text-blue-400 border border-blue-800"}`}
                    >
                      {post.tipo === "feria" ? "🎪 Feria" : "🌱 Social"}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                    📍 {post.ubicacion}
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-300 mt-3 leading-relaxed whitespace-pre-wrap">
                {post.contenido}
              </p>

              <div className="flex items-center gap-4 mt-4 border-t border-gray-800/60 pt-3 text-xs">
                <button
                  type="button"
                  onClick={() => darMeGusta(post.id)}
                  className="flex items-center gap-1.5 text-gray-400 hover:text-green-400 transition font-semibold"
                >
                  👍 <span>{post.meGusta}</span> Me Gusta
                </button>
                <div className="text-gray-500">•</div>
                <span className="text-gray-400 font-medium">
                  💬 {post.comentarios.length} Comentarios
                </span>
              </div>

              {post.comentarios.length > 0 && (
                <div className="mt-3 bg-gray-950/60 p-2.5 rounded border border-gray-800/40 space-y-1.5">
                  {post.comentarios.map((c, idx) => (
                    <p key={idx} className="text-xs text-gray-400 leading-snug">
                      <span className="font-bold text-gray-300">
                        Vecino Agropecuario:
                      </span>{" "}
                      {c}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
