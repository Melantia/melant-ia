"""
Ejemplo: Uso de pandas para consultar una tabla de dosis de fitosanitarios en MELANT IA
"""
import pandas as pd

# Supón que tienes un archivo CSV con la siguiente estructura:
# producto,cultivo,dosis_min,dosis_max,unidad
# Urea,Maíz,80,120,kg/ha
# Glifosato,Soja,2,4,L/ha
# ...

TABLA_DOSIS = "conocimiento/tablas/dosis_fitosanitarios.csv"

def consultar_dosis(producto, cultivo):
    df = pd.read_csv(TABLA_DOSIS)
    resultado = df[(df['producto'].str.lower() == producto.lower()) & (df['cultivo'].str.lower() == cultivo.lower())]
    if resultado.empty:
        print(f"No se encontró dosis para {producto} en {cultivo}.")
    else:
        for _, row in resultado.iterrows():
            print(f"Producto: {row['producto']} | Cultivo: {row['cultivo']} | Dosis: {row['dosis_min']}-{row['dosis_max']} {row['unidad']}")

if __name__ == "__main__":
    consultar_dosis("Urea", "Maíz")
