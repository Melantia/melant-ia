import React, { useState } from "react";
import appStructureMelantIA from "../config/appStructureMelantIA";
import AsistenteTecnicoModule from "../modules/asistente_tecnico"; // Módulo 2
import GestionFincas from "../modules/gestion_fincas_trazabilidad/GestionFincas"; // Módulo 3
import NegociosRurales from "../modules/negocios_rurales/NegociosRurales"; // Módulo 4
import FeriasYRedSocial from "../modules/negocios_rurales/components/FeriasYRedSocial"; // Módulo 4
import Emprendimientos from "../modules/emprendedor/Emprendimientos"; // Módulo 5 (Nuevo)
import { useAuth } from "../shared/auth/auth.context";

export default function AppShell() {
  const [moduloActivo, setModuloActivo] = useState(2); // Iniciamos por defecto en el Asistente Técnico para validarlo
  const [subPestañaNegocios, setSubPestañaNegocios] = useState("negocios");
  const { usuario, logout } = useAuth(); // el gate de sesión lo hace app/routes.jsx

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      {/* MENÚ LATERAL */}
      <aside className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col justify-between">
        <div className="p-5 overflow-y-auto custom-scrollbar">
          <div className="mb-6">
            <h1 className="text-xl font-black text-green-500 tracking-wider font-mono">
              {appStructureMelantIA.app_name}
            </h1>
            <p className="text-[10px] text-gray-400 font-semibold tracking-tight uppercase mt-0.5">
              {appStructureMelantIA.logo}
            </p>
            <div className="inline-block mt-2 bg-green-950 border border-green-800 text-green-400 text-[10px] px-2 py-0.5 rounded font-bold font-mono">
              ⚡ {appStructureMelantIA.funcionalidad_clave}
            </div>
          </div>

          <nav className="space-y-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2">
              Módulos Core
            </p>
            <div className="space-y-1">
              {appStructureMelantIA.menu_principal.modulos.map((modulo) => (
                <button
                  key={modulo.id}
                  onClick={() => setModuloActivo(modulo.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-between ${
                    moduloActivo === modulo.id
                      ? "bg-green-600 text-white font-semibold shadow-md"
                      : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                  }`}
                >
                  <span>{modulo.titulo}</span>
                  <span className="text-[10px] opacity-60 font-mono">
                    ID: {modulo.id}
                  </span>
                </button>
              ))}
            </div>
          </nav>
        </div>

        <div className="p-4 bg-gray-950 border-t border-gray-800 text-center space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] text-gray-400 font-mono truncate">
              👤 {usuario?.nombre}
            </p>
            <button
              onClick={logout}
              className="text-[10px] font-bold text-red-400 hover:text-red-300 font-mono"
            >
              Salir
            </button>
          </div>
          <p className="text-xs text-gray-500 font-mono flex items-center justify-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Modo Local-First (Podman DB)
          </p>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO */}
      <main className="flex-1 overflow-y-auto bg-gray-950 p-8">
        {/* RENDERIZADO MÓDULO 2 */}
        {moduloActivo === 2 && (
          <div>
            <div className="mb-6">
              <h2 className="text-3xl font-extrabold text-white">
                Asistente Técnico Rural
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Soporte agropecuario experto por voz y analítica predictiva en
                el territorio.
              </p>
            </div>
            <AsistenteTecnicoModule />
          </div>
        )}

        {/* RENDERIZADO MÓDULO 3 */}
        {moduloActivo === 3 && (
          <div>
            <div className="mb-6">
              <h2 className="text-3xl font-extrabold text-white">
                Gestión de Fincas y Trazabilidad
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Monitoreo operativo, hato por hato y lote por lote.
              </p>
            </div>
            <GestionFincas />
          </div>
        )}

        {/* RENDERIZADO MÓDULO 4 */}
        {moduloActivo === 4 && (
          <div>
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-white">
                  Negocios Rurales
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  Ecosistema comercial interactivo para el agro.
                </p>
              </div>
              <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-800 text-xs font-bold">
                <button
                  onClick={() => setSubPestañaNegocios("negocios")}
                  className={`px-4 py-2 rounded transition ${subPestañaNegocios === "negocios" ? "bg-green-600 text-white" : "text-gray-400"}`}
                >
                  🌾 Negocios Rurales
                </button>
                <button
                  onClick={() => setSubPestañaNegocios("red_social")}
                  className={`px-4 py-2 rounded transition ${subPestañaNegocios === "red_social" ? "bg-green-600 text-white" : "text-gray-400"}`}
                >
                  🎪 Ferias y Red Social
                </button>
              </div>
            </div>
            {subPestañaNegocios === "negocios" ? (
              <NegociosRurales />
            ) : (
              <FeriasYRedSocial />
            )}
          </div>
        )}

        {/* RENDERIZADO MÓDULO 5 (NUEVO) */}
        {moduloActivo === 5 && (
          <div>
            <div className="mb-6">
              <h2 className="text-3xl font-extrabold text-white">
                Emprendedor Agropecuario
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Herramientas de formalización, catálogos rápidos y optimización
                de valor comercial.
              </p>
            </div>
            <Emprendimientos />
          </div>
        )}

        {/* OTROS MÓDULOS EN CONSTRUCCIÓN */}
        {![2, 3, 4, 5].includes(moduloActivo) && (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="text-4xl mb-2">🚜</div>
            <h3 className="text-lg font-bold text-gray-300">
              Módulo Core en Desarrollo
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mt-1">
              La interfaz offline de este espacio está mapeada en
              appStructureMelantIA.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
