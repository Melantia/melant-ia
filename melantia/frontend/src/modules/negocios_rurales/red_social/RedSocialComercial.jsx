import React, { useState } from "react";
import CrearPublicacion from "./CrearPublicacion";
import PublicacionCard from "./PublicacionCard";

export default function RedSocialComercial() {
  const [publicaciones, setPublicaciones] = useState([
    {
      id: 1,
      autor_nombre: "Erick Andrade",
      tipo_publicacion: "social",
      contenido:
        "Hoy terminamos la cosecha de cacao fino de aroma. ¡Excelente rendimiento este año!",
      provincia: "Manabí",
      canton: "Chone",
      likes: 4,
    },
    {
      id: 2,
      autor_nombre: "María Loor",
      tipo_publicacion: "oferta",
      contenido:
        "Tenemos 2 toneladas de cacao fino de aroma disponibles para entrega inmediata.",
      provincia: "Manabí",
      canton: "Chone",
      likes: 2,
    },
  ]);

  const handleNuevaPublicacion = (nuevaPublicacion) => {
    setPublicaciones((prev) => [nuevaPublicacion, ...prev]);
  };

  const handleLike = (id) => {
    setPublicaciones((prev) =>
      prev.map((publicacion) =>
        publicacion.id === id
          ? {
              ...publicacion,
              likes: publicacion.likes + 1,
            }
          : publicacion,
      ),
    );
  };

  return (
    <section className="red-social-comercial">
      <header>
        <h3>📱 Muro de la Comunidad Rural</h3>

        <p>
          Publica experiencias técnicas, haz preguntas o anuncia la intención de
          compra o venta de tus productos.
        </p>
      </header>

      <CrearPublicacion onPublicar={handleNuevaPublicacion} />

      <main>
        {publicaciones.length === 0 ? (
          <p>Todavía no hay publicaciones.</p>
        ) : (
          publicaciones.map((publicacion) => (
            <PublicacionCard
              key={publicacion.id}
              pub={publicacion}
              onLike={handleLike}
            />
          ))
        )}
      </main>
    </section>
  );
}
