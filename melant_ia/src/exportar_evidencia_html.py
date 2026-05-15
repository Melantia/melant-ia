# src/exportar_evidencia_html.py
import json

def exportar_evidencia_a_html(json_path, html_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    html = [
        "<html><head><meta charset='utf-8'><title>Evidencia de Trazabilidad</title>",
        "<style>body{font-family:sans-serif;} table{border-collapse:collapse;} th,td{border:1px solid #888;padding:6px;}</style>",
        "</head><body>",
        f"<h1>Evidencia de Trazabilidad - {data.get('cultivo','')}</h1>",
        f"<h2>Finca: {data.get('finca','')}</h2>",
        f"<p>Fecha de exportación: {data.get('fecha_exportacion','')}</p>",
        "<table><tr><th>Paso</th><th>Fase</th><th>Estado</th><th>Detalles</th></tr>"
    ]
    for fase in data.get('fases', []):
        html.append(
            f"<tr><td>{fase['paso']}</td><td>{fase['titulo']}</td><td>{fase.get('estado','')}</td><td>{'<br>'.join(fase['detalles'])}</td></tr>"
        )
    html.append("</table></body></html>")

    with open(html_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(html))
    print(f"Archivo HTML generado: {html_path}")

# Ejemplo de uso:
# exportar_evidencia_a_html('data/evidencia_cafe.json', 'data/evidencia_cafe.html')