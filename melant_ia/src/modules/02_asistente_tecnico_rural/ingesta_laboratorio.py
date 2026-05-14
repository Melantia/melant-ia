"""
Módulo de Ingesta de Datos de Laboratorio — MELANT IA

Procesa archivos Excel/CSV de análisis de suelo, tejido foliar y entomología.
Valida rangos agronómicos, clasifica nutrientes y normaliza unidades.
"""

from __future__ import annotations

import pandas as pd
import numpy as np
from pathlib import Path
from typing import Literal


# ─────────────────────────────────────────────
# RANGOS AGRONÓMICOS DE REFERENCIA
# ─────────────────────────────────────────────

RANGOS_SUELO = {
    "ph": {"bajo": (0, 5.5), "optimo": (5.5, 7.0), "alto": (7.0, 14.0)},
    "materia_organica_pct": {"bajo": (0, 2.0), "optimo": (2.0, 5.0), "alto": (5.0, 100)},
    "nitrogeno_n": {"bajo": (0, 20), "optimo": (20, 40), "alto": (40, 9999)},
    "fosforo_p": {"bajo": (0, 10), "optimo": (10, 20), "alto": (20, 9999)},
    "potasio_k": {"bajo": (0, 150), "optimo": (150, 250), "alto": (250, 9999)},
    "calcio_ca": {"bajo": (0, 1000), "optimo": (1000, 3000), "alto": (3000, 99999)},
    "magnesio_mg": {"bajo": (0, 120), "optimo": (120, 360), "alto": (360, 99999)},
    "azufre_s": {"bajo": (0, 10), "optimo": (10, 20), "alto": (20, 9999)},
    "hierro_fe": {"bajo": (0, 10), "optimo": (10, 50), "alto": (50, 9999)},
    "zinc_zn": {"bajo": (0, 1.0), "optimo": (1.0, 5.0), "alto": (5.0, 9999)},
    "manganeso_mn": {"bajo": (0, 5), "optimo": (5, 50), "alto": (50, 9999)},
    "cobre_cu": {"bajo": (0, 0.5), "optimo": (0.5, 3.0), "alto": (3.0, 9999)},
    "boro_b": {"bajo": (0, 0.5), "optimo": (0.5, 2.0), "alto": (2.0, 9999)},
    "cic": {"bajo": (0, 10), "optimo": (10, 25), "alto": (25, 9999)},
}

RANGOS_FOLIAR = {
    "nitrogeno_pct": {"deficiente": (0, 2.0), "optimo": (2.0, 3.5), "exceso": (3.5, 100)},
    "fosforo_pct": {"deficiente": (0, 0.15), "optimo": (0.15, 0.30), "exceso": (0.30, 100)},
    "potasio_pct": {"deficiente": (0, 1.5), "optimo": (1.5, 2.5), "exceso": (2.5, 100)},
    "calcio_pct": {"deficiente": (0, 1.0), "optimo": (1.0, 3.0), "exceso": (3.0, 100)},
    "magnesio_pct": {"deficiente": (0, 0.25), "optimo": (0.25, 0.50), "exceso": (0.50, 100)},
}

UMBRALES_ENTOMOLOGIA = {
    "trips": {"bajo": 5, "medio": 15, "alto": 30},
    "mosca_blanca": {"bajo": 3, "medio": 10, "alto": 25},
    "acaros": {"bajo": 5, "medio": 20, "alto": 50},
    "pulgones": {"bajo": 10, "medio": 30, "alto": 60},
    "gusanos": {"bajo": 2, "medio": 8, "alto": 15},
}


# ─────────────────────────────────────────────
# CARGA DE ARCHIVOS
# ─────────────────────────────────────────────

def cargar_archivo(archivo_path: str | Path, hoja: str | int = 0) -> pd.DataFrame:
    """Carga CSV o Excel. Normaliza nombres de columnas."""
    archivo_path = Path(archivo_path)
    if not archivo_path.exists():
        raise FileNotFoundError(f"Archivo no encontrado: {archivo_path}")

    ext = archivo_path.suffix.lower()
    if ext == ".csv":
        df = pd.read_csv(archivo_path)
    elif ext in (".xlsx", ".xls"):
        df = pd.read_excel(archivo_path, sheet_name=hoja, engine="openpyxl")
    else:
        raise ValueError(f"Formato no soportado: {ext}. Use .csv, .xlsx o .xls")

    # Normalizar columnas: minúsculas, sin espacios, acentos básicos
    df.columns = (
        df.columns.str.strip()
        .str.lower()
        .str.replace(r"\s+", "_", regex=True)
        .str.replace(r"[()/%]", "", regex=True)
    )
    return df


# ─────────────────────────────────────────────
# CLASIFICACIÓN POR RANGOS
# ─────────────────────────────────────────────

def _clasificar_columna(serie: pd.Series, rangos: dict) -> pd.Series:
    """Clasifica valores numéricos según rangos {etiqueta: (min, max)}."""
    condiciones = []
    etiquetas = []
    for etiqueta, (vmin, vmax) in rangos.items():
        condiciones.append(serie.between(vmin, vmax, inclusive="left"))
        etiquetas.append(etiqueta.capitalize())
    resultado = np.select(condiciones, etiquetas, default="Sin dato")
    return pd.Series(resultado, index=serie.index)


# ─────────────────────────────────────────────
# PROCESAMIENTO: SUELO
# ─────────────────────────────────────────────

def procesar_analisis_suelo(archivo_path: str | Path, hoja: str | int = 0) -> pd.DataFrame:
    """
    Carga un análisis de suelo, valida rangos y clasifica cada nutriente.

    Columnas esperadas (flexibles): muestra_id, ph, materia_organica_pct,
    nitrogeno_n, fosforo_p, potasio_k, calcio_ca, magnesio_mg, etc.

    Agrega columnas estado_<nutriente> con clasificación Bajo/Óptimo/Alto.
    """
    df = cargar_archivo(archivo_path, hoja)

    # Validación de rango físico: pH no puede ser negativo ni > 14
    if "ph" in df.columns:
        fuera_rango = (df["ph"] < 0) | (df["ph"] > 14)
        if fuera_rango.any():
            n = fuera_rango.sum()
            print(f"⚠️  {n} valores de pH fuera de rango físico (0-14). Se marcan como NaN.")
            df.loc[fuera_rango, "ph"] = np.nan

    # Clasificar cada nutriente presente
    for col, rangos in RANGOS_SUELO.items():
        if col in df.columns:
            df[f"estado_{col}"] = _clasificar_columna(
                pd.to_numeric(df[col], errors="coerce"), rangos
            )

    # Diagnóstico resumido por muestra
    cols_estado = [c for c in df.columns if c.startswith("estado_")]
    if cols_estado:
        def _diagnostico_fila(row):
            bajos = [c.replace("estado_", "") for c in cols_estado if row[c] == "Bajo"]
            altos = [c.replace("estado_", "") for c in cols_estado if row[c] == "Alto"]
            partes = []
            if bajos:
                partes.append(f"Deficiente: {', '.join(bajos)}")
            if altos:
                partes.append(f"Exceso: {', '.join(altos)}")
            return " | ".join(partes) if partes else "Rangos óptimos"

        df["diagnostico_suelo"] = df.apply(_diagnostico_fila, axis=1)

    # Alertas de riesgo fitosanitario basadas en condiciones del suelo
    alertas_fito = {
        "N alto → riesgo hongos": lambda r: r.get("nitrogeno_n", 0) > 40,
        "pH ácido → riesgo bacterias": lambda r: r.get("ph", 7) < 5.5,
        "pH extremo → riesgo Fusarium": lambda r: r.get("ph", 7) < 4.5,
        "K bajo → riesgo virus": lambda r: r.get("potasio_k", 999) < 150,
        "MO baja → sin bioprotección": lambda r: r.get("materia_organica_pct", 99) < 2.0,
    }

    def _alertas_fila(row):
        activas = []
        row_dict = row.to_dict()
        for alerta, condicion in alertas_fito.items():
            try:
                if condicion(row_dict):
                    activas.append(alerta)
            except (KeyError, TypeError):
                continue
        return " | ".join(activas) if activas else ""

    df["alertas_fitosanitarias"] = df.apply(_alertas_fila, axis=1)

    return df


# ─────────────────────────────────────────────
# PROCESAMIENTO: TEJIDO FOLIAR
# ─────────────────────────────────────────────

def procesar_analisis_foliar(archivo_path: str | Path, hoja: str | int = 0) -> pd.DataFrame:
    """
    Procesa análisis de tejido foliar y clasifica concentraciones.

    Columnas esperadas: muestra_id, cultivo, nitrogeno_pct, fosforo_pct, etc.
    """
    df = cargar_archivo(archivo_path, hoja)

    for col, rangos in RANGOS_FOLIAR.items():
        if col in df.columns:
            df[f"estado_{col}"] = _clasificar_columna(
                pd.to_numeric(df[col], errors="coerce"), rangos
            )

    return df


# ─────────────────────────────────────────────
# PROCESAMIENTO: ENTOMOLOGÍA
# ─────────────────────────────────────────────

def procesar_analisis_entomologia(archivo_path: str | Path, hoja: str | int = 0) -> pd.DataFrame:
    """
    Procesa conteos de insectos por trampa y clasifica nivel de presión.

    Columnas esperadas: trampa_id, fecha, trips, mosca_blanca, acaros, etc.
    """
    df = cargar_archivo(archivo_path, hoja)

    for plaga, umbrales in UMBRALES_ENTOMOLOGIA.items():
        if plaga in df.columns:
            serie = pd.to_numeric(df[plaga], errors="coerce")
            condiciones = [
                serie <= umbrales["bajo"],
                serie.between(umbrales["bajo"] + 1, umbrales["medio"]),
                serie.between(umbrales["medio"] + 1, umbrales["alto"]),
                serie > umbrales["alto"],
            ]
            valores = ["Sin riesgo", "Monitorear", "Alerta", "Intervención urgente"]
            df[f"nivel_{plaga}"] = np.select(condiciones, valores, default="Sin dato")

    # Columna de alerta general
    cols_nivel = [c for c in df.columns if c.startswith("nivel_")]
    if cols_nivel:
        df["alerta_general"] = df[cols_nivel].apply(
            lambda row: "Intervención urgente"
            if (row == "Intervención urgente").any()
            else "Alerta"
            if (row == "Alerta").any()
            else "Monitorear"
            if (row == "Monitorear").any()
            else "Sin riesgo",
            axis=1,
        )

    # Enriquecer con conocimiento fitosanitario (tratamientos biológicos)
    try:
        from conocimiento_fitosanitario import obtener_tratamiento
        for plaga in UMBRALES_ENTOMOLOGIA:
            col_nivel = f"nivel_{plaga}"
            if col_nivel in df.columns:
                tratamientos = obtener_tratamiento(plaga)
                if tratamientos:
                    nombres = ", ".join(t["producto"] for t in tratamientos)
                    df[f"bio_{plaga}"] = df[col_nivel].apply(
                        lambda n: nombres if n in ("Alerta", "Intervención urgente") else ""
                    )
    except ImportError:
        pass

    return df


# ─────────────────────────────────────────────
# VALIDACIÓN CON PANDERA
# ─────────────────────────────────────────────

def validar_suelo(df: pd.DataFrame) -> pd.DataFrame:
    """Valida un DataFrame de suelo con esquema Pandera. Retorna el DF validado."""
    try:
        import pandera as pa
    except ImportError:
        print("⚠️  pandera no instalado. Saltando validación estricta.")
        return df

    esquema = pa.DataFrameSchema(
        {
            "ph": pa.Column(float, pa.Check.in_range(0, 14), nullable=True, required=False),
            "materia_organica_pct": pa.Column(float, pa.Check.in_range(0, 100), nullable=True, required=False),
            "nitrogeno_n": pa.Column(float, pa.Check.ge(0), nullable=True, required=False),
            "fosforo_p": pa.Column(float, pa.Check.ge(0), nullable=True, required=False),
            "potasio_k": pa.Column(float, pa.Check.ge(0), nullable=True, required=False),
            "calcio_ca": pa.Column(float, pa.Check.ge(0), nullable=True, required=False),
            "magnesio_mg": pa.Column(float, pa.Check.ge(0), nullable=True, required=False),
        },
        coerce=True,
    )
    return esquema.validate(df, lazy=True)


# ─────────────────────────────────────────────
# NORMALIZACIÓN DE UNIDADES (sklearn)
# ─────────────────────────────────────────────

def normalizar_nutrientes(df: pd.DataFrame, columnas: list[str] | None = None) -> pd.DataFrame:
    """
    Escala columnas numéricas a rango 0-1 con MinMaxScaler.
    Útil cuando laboratorios reportan en unidades distintas (ppm, mg/kg, %).

    Retorna copia del DataFrame con columnas _norm agregadas.
    """
    from sklearn.preprocessing import MinMaxScaler

    if columnas is None:
        columnas = df.select_dtypes(include=[np.number]).columns.tolist()

    columnas_presentes = [c for c in columnas if c in df.columns]
    if not columnas_presentes:
        return df

    scaler = MinMaxScaler()
    df_out = df.copy()
    valores = scaler.fit_transform(df_out[columnas_presentes].fillna(0))
    for i, col in enumerate(columnas_presentes):
        df_out[f"{col}_norm"] = valores[:, i]

    return df_out


# ─────────────────────────────────────────────
# PUNTO DE ENTRADA CLI
# ─────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 3:
        print("Uso: python ingesta_laboratorio.py <tipo> <archivo>")
        print("  tipo: suelo | foliar | entomologia")
        sys.exit(1)

    tipo = sys.argv[1].lower()
    archivo = sys.argv[2]

    procesadores = {
        "suelo": procesar_analisis_suelo,
        "foliar": procesar_analisis_foliar,
        "entomologia": procesar_analisis_entomologia,
    }

    if tipo not in procesadores:
        print(f"Tipo desconocido: {tipo}. Use: suelo, foliar, entomologia")
        sys.exit(1)

    resultado = procesadores[tipo](archivo)
    print(f"\n{'='*60}")
    print(f" Resultados de análisis ({tipo}) — {Path(archivo).name}")
    print(f"{'='*60}")
    print(resultado.to_string(index=False))
    print(f"\nTotal de muestras: {len(resultado)}")
