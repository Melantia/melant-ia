"""
Ejemplo: Uso de scikit-learn para predicción offline en MELANT IA
Entrena un modelo simple y lo usa para predecir la dosis recomendada según variables de entrada.
"""
import pandas as pd
from sklearn.linear_model import LinearRegression
import joblib
import os

TABLA_DOSIS = "conocimiento/tablas/dosis_fitosanitarios.csv"
MODELO_PATH = "conocimiento/modelos/modelo_dosis.pkl"

def entrenar_modelo():
    df = pd.read_csv(TABLA_DOSIS)
    # Supón que tienes columnas: 'cultivo', 'producto', 'dosis_min', 'dosis_max', 'ph_suelo', 'materia_organica'
    # Convertir variables categóricas a numéricas
    df = pd.get_dummies(df, columns=['cultivo', 'producto'])
    X = df.drop(['dosis_min', 'dosis_max', 'unidad'], axis=1)
    y = df['dosis_min']  # O usa 'dosis_max' según el caso
    modelo = LinearRegression()
    modelo.fit(X, y)
    joblib.dump((modelo, X.columns), MODELO_PATH)
    print("Modelo entrenado y guardado.")

def predecir_dosis(entrada):
    if not os.path.exists(MODELO_PATH):
        print("Primero entrena el modelo.")
        return
    modelo, columnas = joblib.load(MODELO_PATH)
    df_entrada = pd.DataFrame([entrada])
    df_entrada = pd.get_dummies(df_entrada)
    # Asegura que las columnas coincidan
    for col in columnas:
        if col not in df_entrada:
            df_entrada[col] = 0
    df_entrada = df_entrada[columnas]
    pred = modelo.predict(df_entrada)[0]
    print(f"Dosis recomendada (estimada): {pred:.2f}")

if __name__ == "__main__":
    # Entrenar modelo (solo la primera vez o cuando actualices la tabla)
    # entrenar_modelo()

    # Ejemplo de predicción
    entrada = {
        'ph_suelo': 6.5,
        'materia_organica': 2.1,
        'cultivo_Maíz': 1,
        'producto_Urea': 1
    }
    predecir_dosis(entrada)
