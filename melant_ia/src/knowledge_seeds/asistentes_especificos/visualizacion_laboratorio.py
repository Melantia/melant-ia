"""
Módulo de Visualización de Análisis de Laboratorio — MELANT IA

Genera gráficos interactivos (Plotly) y mapas de calor (Seaborn)
para que el productor interprete resultados sin leer tablas.
"""

from __future__ import annotations

import pandas as pd
import numpy as np
from pathlib import Path


def grafico_radar_suelo(df: pd.DataFrame, muestra_id: str, guardar: str | None = None):
    """
    Gráfico de araña comparando valores reales vs. rango óptimo.
    Requiere columnas numéricas de nutrientes y una columna muestra_id.
    """
    import plotly.graph_objects as go

    from ingesta_laboratorio import RANGOS_SUELO

    nutrientes_presentes = [col for col in RANGOS_SUELO if col in df.columns]
    if not nutrientes_presentes:
        print("No se encontraron columnas de nutrientes para graficar.")
        return None

    fila = df[df["muestra_id"].astype(str) == str(muestra_id)]
    if fila.empty:
        print(f"Muestra '{muestra_id}' no encontrada.")
        return None

    fila = fila.iloc[0]

    # Valores reales normalizados al máximo del rango óptimo (para escala comparable)
    etiquetas = []
    valores_reales = []
    valores_optimo = []
    for col in nutrientes_presentes:
        rango = RANGOS_SUELO[col]
        opt_max = rango["optimo"][1]
        real = pd.to_numeric(fila.get(col, 0), errors="coerce") or 0
        etiquetas.append(col.replace("_", " ").title())
        valores_reales.append(min(real / opt_max, 2.0))  # Cap a 2x para legibilidad
        valores_optimo.append(1.0)

    fig = go.Figure()
    fig.add_trace(go.Scatterpolar(
        r=valores_reales + [valores_reales[0]],
        theta=etiquetas + [etiquetas[0]],
        fill="toself",
        name=f"Muestra {muestra_id}",
        line_color="#2ca02c",
    ))
    fig.add_trace(go.Scatterpolar(
        r=valores_optimo + [valores_optimo[0]],
        theta=etiquetas + [etiquetas[0]],
        fill="toself",
        name="Rango Óptimo",
        opacity=0.3,
        line_color="#1f77b4",
    ))

    fig.update_layout(
        polar=dict(radialaxis=dict(visible=True, range=[0, 2])),
        title=f"Perfil Nutricional del Suelo — Muestra {muestra_id}",
        showlegend=True,
    )

    if guardar:
        fig.write_html(guardar)
        print(f"Gráfico guardado en: {guardar}")
    else:
        fig.show()

    return fig


def barras_estado_nutrientes(df: pd.DataFrame, guardar: str | None = None):
    """
    Gráfico de barras agrupado mostrando cuántas muestras caen en cada
    categoría (Bajo/Óptimo/Alto) por nutriente.
    """
    import plotly.express as px

    cols_estado = [c for c in df.columns if c.startswith("estado_")]
    if not cols_estado:
        print("No hay columnas de estado para graficar.")
        return None

    registros = []
    for col in cols_estado:
        nutriente = col.replace("estado_", "").replace("_", " ").title()
        conteos = df[col].value_counts()
        for categoria, n in conteos.items():
            registros.append({"Nutriente": nutriente, "Estado": categoria, "Muestras": n})

    df_plot = pd.DataFrame(registros)

    colores = {"Bajo": "#e74c3c", "Optimo": "#2ecc71", "Alto": "#f39c12",
               "Deficiente": "#e74c3c", "Exceso": "#f39c12", "Sin dato": "#95a5a6"}

    fig = px.bar(
        df_plot, x="Nutriente", y="Muestras", color="Estado",
        barmode="group", color_discrete_map=colores,
        title="Distribución de Estados Nutricionales por Muestra",
    )

    if guardar:
        fig.write_html(guardar)
        print(f"Gráfico guardado en: {guardar}")
    else:
        fig.show()

    return fig


def heatmap_muestras(df: pd.DataFrame, columnas: list[str] | None = None, guardar: str | None = None):
    """
    Mapa de calor (Seaborn) de concentraciones de nutrientes por muestra.
    Útil cuando el archivo contiene muestras de distintos puntos de un terreno.
    """
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import seaborn as sns

    from ingesta_laboratorio import RANGOS_SUELO

    if columnas is None:
        columnas = [c for c in RANGOS_SUELO if c in df.columns]

    if not columnas:
        print("No hay columnas numéricas para el mapa de calor.")
        return None

    # Usar muestra_id como índice si existe
    df_plot = df.copy()
    if "muestra_id" in df_plot.columns:
        df_plot = df_plot.set_index("muestra_id")

    datos = df_plot[columnas].apply(pd.to_numeric, errors="coerce")

    fig, ax = plt.subplots(figsize=(max(10, len(columnas) * 1.2), max(4, len(datos) * 0.5)))
    sns.heatmap(
        datos, annot=True, fmt=".1f", cmap="YlOrRd", linewidths=0.5,
        xticklabels=[c.replace("_", " ").title() for c in columnas],
        ax=ax,
    )
    ax.set_title("Mapa de Calor — Concentraciones por Muestra")
    ax.set_ylabel("Muestra")
    plt.tight_layout()

    if guardar:
        fig.savefig(guardar, dpi=150)
        print(f"Heatmap guardado en: {guardar}")
    else:
        plt.show()

    return fig


def semaforo_entomologia(df: pd.DataFrame, guardar: str | None = None):
    """
    Gráfico de semáforo (barras horizontales con color) para niveles de plaga.
    """
    import plotly.express as px

    cols_nivel = [c for c in df.columns if c.startswith("nivel_")]
    if not cols_nivel:
        print("No hay columnas de nivel de plaga.")
        return None

    registros = []
    for _, row in df.iterrows():
        trampa = row.get("trampa_id", row.name)
        for col in cols_nivel:
            plaga = col.replace("nivel_", "").replace("_", " ").title()
            registros.append({"Trampa": str(trampa), "Plaga": plaga, "Nivel": row[col]})

    df_plot = pd.DataFrame(registros)

    colores = {
        "Sin riesgo": "#2ecc71", "Monitorear": "#f1c40f",
        "Alerta": "#e67e22", "Intervención urgente": "#e74c3c",
        "Sin dato": "#bdc3c7",
    }

    fig = px.bar(
        df_plot, y="Trampa", x="Plaga", color="Nivel",
        orientation="h", color_discrete_map=colores,
        title="Semáforo de Plagas por Trampa",
    )

    if guardar:
        fig.write_html(guardar)
        print(f"Gráfico guardado en: {guardar}")
    else:
        fig.show()

    return fig


def grafico_radar_riesgo(resultado_diagnostico: dict, guardar: str | None = None):
    """
    Gráfico Radar (polar) de riesgo sanitario basado en el diagnóstico integral.
    Muestra el Triángulo de la Enfermedad + probabilidades hongo/bacteria/virus.

    resultado_diagnostico: dict retornado por motor_inferencia.correlacionar()
    """
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    # Extraer datos
    probs = resultado_diagnostico.get("probabilidades", {})
    triangulo = resultado_diagnostico.get("triangulo_enfermedad", {})
    vertices = triangulo.get("vertices", {}) if triangulo else {}

    # Construir ejes del radar
    categorias = []
    valores = []

    # Probabilidades de patógeno
    for tipo in ["hongo", "bacteria", "virus"]:
        categorias.append(tipo.capitalize())
        valores.append(probs.get(tipo, 0))

    # Vértices del triángulo de enfermedad
    if vertices:
        for nombre, label in [("huesped", "Huésped"), ("patogeno", "Patógeno"), ("ambiente", "Ambiente")]:
            categorias.append(label)
            valores.append(vertices.get(nombre, 0))

    if not valores:
        print("Sin datos para radar de riesgo.")
        return None

    # Cerrar el polígono
    num_vars = len(categorias)
    angulos = np.linspace(0, 2 * np.pi, num_vars, endpoint=False).tolist()
    valores_cerrados = valores + [valores[0]]
    angulos_cerrados = angulos + [angulos[0]]

    fig, ax = plt.subplots(figsize=(7, 7), subplot_kw=dict(polar=True))
    ax.fill(angulos_cerrados, valores_cerrados, color="#2ca02c", alpha=0.25)
    ax.plot(angulos_cerrados, valores_cerrados, color="#2ca02c", linewidth=2)

    # Marcar puntos
    for ang, val, cat in zip(angulos, valores, categorias):
        color_punto = "#e74c3c" if val > 50 else "#f39c12" if val > 25 else "#2ecc71"
        ax.scatter(ang, val, color=color_punto, s=80, zorder=5)

    ax.set_xticks(angulos)
    ax.set_xticklabels(categorias, fontsize=10)
    ax.set_ylim(0, 100)
    ax.set_title("Perfil de Salud — MELANT IA\n(Radar de Riesgo Sanitario)", fontsize=12, pad=20)

    # Nivel de riesgo global
    nivel = resultado_diagnostico.get("nivel_confianza", "")
    triangulo_cerrado = triangulo.get("triangulo_cerrado", False) if triangulo else False
    subtitulo = f"Nivel: {nivel}"
    if triangulo_cerrado:
        subtitulo += " | Triángulo de Enfermedad CERRADO"
    ax.text(0, -15, subtitulo, ha="center", fontsize=9, style="italic",
            transform=ax.transData)

    plt.tight_layout()

    if guardar:
        fig.savefig(guardar, dpi=150, bbox_inches="tight")
        print(f"Radar de riesgo guardado en: {guardar}")
    else:
        plt.show()

    return fig
