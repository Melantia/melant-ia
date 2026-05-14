"""
MELANT IA - Generador QR Productor (Carpeta del Productor)

Genera:
1) PDF profesional con ficha del hato, estatus sanitario, calidad de leche e historial clinico.
2) QR unico que apunta al PDF generado.

Dependencias (si no estan instaladas):
    pip install reportlab qrcode[pil]

Uso:
    python generador_qr_productor.py --productor-id 1
    python generador_qr_productor.py --db melant_ia.db --out carpeta_productor
"""

from __future__ import annotations

import argparse
import sqlite3
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Dict, List, Tuple

try:
    import qrcode
except Exception:  # pragma: no cover
    qrcode = None

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib.units import cm
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
except Exception:  # pragma: no cover
    A4 = None


DATE_FMT = "%Y-%m-%d"
VACCINE_INTERVALS = {
    "aftosa": 180,
    "brucelosis": 365,
    "triple": 180,
}


def _connect(db_path: Path) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def _fetch_productor(conn: sqlite3.Connection, productor_id: int) -> sqlite3.Row | None:
    return conn.execute("SELECT * FROM productores WHERE id = ?", (productor_id,)).fetchone()


def _fetch_fincas(conn: sqlite3.Connection, productor_id: int) -> List[sqlite3.Row]:
    return conn.execute("SELECT * FROM fincas WHERE productor_id = ?", (productor_id,)).fetchall()


def _fetch_animales(conn: sqlite3.Connection, finca_ids: List[int]) -> List[sqlite3.Row]:
    if not finca_ids:
        return []
    placeholders = ",".join("?" for _ in finca_ids)
    sql = f"SELECT * FROM animales WHERE finca_id IN ({placeholders})"
    return conn.execute(sql, tuple(finca_ids)).fetchall()


def _fetch_salud(conn: sqlite3.Connection, animal_ids: List[int]) -> List[sqlite3.Row]:
    if not animal_ids:
        return []
    placeholders = ",".join("?" for _ in animal_ids)
    sql = f"SELECT * FROM salud_registros WHERE animal_id IN ({placeholders}) ORDER BY fecha DESC"
    return conn.execute(sql, tuple(animal_ids)).fetchall()


def _fetch_produccion(conn: sqlite3.Connection, animal_ids: List[int]) -> List[sqlite3.Row]:
    if not animal_ids:
        return []
    placeholders = ",".join("?" for _ in animal_ids)
    sql = f"SELECT * FROM produccion_registros WHERE animal_id IN ({placeholders}) ORDER BY fecha DESC"
    return conn.execute(sql, tuple(animal_ids)).fetchall()


def _safe_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return datetime.strptime(value[:10], DATE_FMT).date()
    except Exception:
        return None


def _status_sanitario(salud_rows: List[sqlite3.Row]) -> Dict[str, Tuple[str, str]]:
    """Devuelve {vacuna: (ultima, proxima)} para aftosa y brucelosis."""
    by_vac = defaultdict(list)
    for row in salud_rows:
        evento = (row["tipo_evento"] or "").lower()
        for target in ("aftosa", "brucelosis", "triple"):
            if target in evento:
                by_vac[target].append(row)

    out: Dict[str, Tuple[str, str]] = {}
    for vac in ("aftosa", "brucelosis", "triple"):
        if not by_vac[vac]:
            out[vac] = ("Sin registro", "Pendiente")
            continue
        last_row = by_vac[vac][0]
        f_last = _safe_date(last_row["fecha"])
        if f_last is None:
            out[vac] = ("Fecha invalida", "Pendiente")
            continue
        f_next = f_last + timedelta(days=VACCINE_INTERVALS[vac])
        out[vac] = (str(f_last), str(f_next))
    return out


def _promedios_calidad(animales: List[sqlite3.Row], produccion: List[sqlite3.Row]) -> Dict[str, Dict[str, float]]:
    animal_by_id = {a["id"]: a for a in animales}
    acc = defaultdict(lambda: {"grasa": [], "proteina": [], "litros": []})

    for row in produccion:
        animal = animal_by_id.get(row["animal_id"])
        if not animal:
            continue
        raza = (animal["raza"] or "Sin raza").strip()
        tprod = (row["tipo_produccion"] or "").lower()
        val = float(row["valor"] or 0)

        if "grasa" in tprod:
            acc[raza]["grasa"].append(val)
        elif "prote" in tprod:
            acc[raza]["proteina"].append(val)
        elif "leche" in tprod or "litro" in tprod:
            acc[raza]["litros"].append(val)

    resumen = {}
    for raza in ("Brahman", "Girolando", "Brown Swiss"):
        data = acc.get(raza, {"grasa": [], "proteina": [], "litros": []})
        resumen[raza] = {
            "grasa": round(sum(data["grasa"]) / len(data["grasa"]), 2) if data["grasa"] else 0.0,
            "proteina": round(sum(data["proteina"]) / len(data["proteina"]), 2) if data["proteina"] else 0.0,
            "litros": round(sum(data["litros"]) / len(data["litros"]), 2) if data["litros"] else 0.0,
        }
    return resumen


def _historial_clinico(salud_rows: List[sqlite3.Row], max_items: int = 12) -> List[Tuple[str, str, str]]:
    out = []
    for row in salud_rows[:max_items]:
        fecha = (row["fecha"] or "")[:10]
        evento = row["tipo_evento"] or "N/A"
        trat = row["tratamiento"] or "Sin tratamiento registrado"
        out.append((fecha, evento, trat))
    return out


def _build_pdf(
    out_pdf: Path,
    productor: sqlite3.Row,
    animales: List[sqlite3.Row],
    status_sanitario: Dict[str, Tuple[str, str]],
    calidad: Dict[str, Dict[str, float]],
    historial: List[Tuple[str, str, str]],
) -> None:
    if A4 is None:
        raise RuntimeError("Falta reportlab. Instala: pip install reportlab")

    doc = SimpleDocTemplate(str(out_pdf), pagesize=A4, rightMargin=1.5 * cm, leftMargin=1.5 * cm, topMargin=1.2 * cm)
    styles = getSampleStyleSheet()
    story = []

    title = f"Carpeta del Productor - MELANT IA"
    subtitle = f"Productor: {productor['nombre']} | Fecha: {date.today()}"

    story.append(Paragraph(f"<b>{title}</b>", styles["Title"]))
    story.append(Paragraph(subtitle, styles["Normal"]))
    story.append(Spacer(1, 12))

    # 1) Ficha del hato por raza
    counter = Counter((a["raza"] or "Sin raza") for a in animales)
    hato_data = [["Raza", "Cantidad"]] + [[r, str(c)] for r, c in counter.items()]
    hato_table = Table(hato_data, colWidths=[9 * cm, 4 * cm])
    hato_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#D4A017")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    story.append(Paragraph("<b>1. Ficha del Hato</b>", styles["Heading3"]))
    story.append(hato_table)
    story.append(Spacer(1, 10))

    # 2) Estatus sanitario
    san_data = [["Vacuna", "Ultima", "Proxima"]]
    for vac in ("aftosa", "brucelosis", "triple"):
        ul, nx = status_sanitario.get(vac, ("Sin registro", "Pendiente"))
        san_data.append([vac.title(), ul, nx])
    san_table = Table(san_data, colWidths=[4 * cm, 4 * cm, 4 * cm])
    san_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2E7D32")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    story.append(Paragraph("<b>2. Estatus Sanitario</b>", styles["Heading3"]))
    story.append(san_table)
    story.append(Spacer(1, 10))

    # 3) Certificado de calidad (Brown Swiss/Girolando/Brahman)
    cal_data = [["Raza", "Litros prom.", "Grasa prom.", "Proteina prom."]]
    for raza in ("Brahman", "Girolando", "Brown Swiss"):
        info = calidad.get(raza, {"litros": 0, "grasa": 0, "proteina": 0})
        cal_data.append([raza, f"{info['litros']}", f"{info['grasa']}", f"{info['proteina']}"])
    cal_table = Table(cal_data, colWidths=[5 * cm, 3 * cm, 3 * cm, 3 * cm])
    cal_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1565C0")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    story.append(Paragraph("<b>3. Certificado de Calidad de Leche</b>", styles["Heading3"]))
    story.append(cal_table)
    story.append(Spacer(1, 10))

    # 4) Historial clinico
    his_data = [["Fecha", "Evento", "Tratamiento"]] + [[f, e, t] for f, e, t in historial]
    his_table = Table(his_data, colWidths=[2.5 * cm, 4.5 * cm, 7.5 * cm])
    his_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#6A1B9A")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    story.append(Paragraph("<b>4. Historial Clinico</b>", styles["Heading3"]))
    story.append(his_table)

    doc.build(story)


def _build_qr(target_path: Path, out_png: Path) -> None:
    if qrcode is None:
        raise RuntimeError("Falta qrcode. Instala: pip install qrcode[pil]")

    qr_url = target_path.resolve().as_uri()
    img = qrcode.make(qr_url)
    img.save(out_png)


def main() -> None:
    parser = argparse.ArgumentParser(description="Genera Carpeta del Productor PDF + QR")
    parser.add_argument("--db", default="melant_ia.db", help="Ruta SQLite")
    parser.add_argument("--productor-id", type=int, default=1, help="ID del productor")
    parser.add_argument("--out", default="carpeta_productor", help="Carpeta de salida")
    args = parser.parse_args()

    db_path = Path(args.db)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    if not db_path.exists():
        raise FileNotFoundError(f"No existe la base: {db_path}")

    conn = _connect(db_path)
    try:
        productor = _fetch_productor(conn, args.productor_id)
        if not productor:
            raise ValueError(f"No existe productor con id={args.productor_id}")

        fincas = _fetch_fincas(conn, args.productor_id)
        finca_ids = [f["id"] for f in fincas]
        animales = _fetch_animales(conn, finca_ids)
        animal_ids = [a["id"] for a in animales]
        salud = _fetch_salud(conn, animal_ids)
        produccion = _fetch_produccion(conn, animal_ids)

        status = _status_sanitario(salud)
        calidad = _promedios_calidad(animales, produccion)
        historial = _historial_clinico(salud)

        safe_name = (productor["nombre"] or "productor").replace(" ", "_")
        pdf_path = out_dir / f"Carpeta_del_Productor_{safe_name}.pdf"
        qr_path = out_dir / f"QR_Productor_{safe_name}.png"

        _build_pdf(pdf_path, productor, animales, status, calidad, historial)
        _build_qr(pdf_path, qr_path)

        print(f"PDF generado: {pdf_path}")
        print(f"QR generado: {qr_path}")

    finally:
        conn.close()


if __name__ == "__main__":
    main()
