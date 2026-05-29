// src/bridge_ia.js

export async function activarIA() {
  console.log('Despertando a la IA...');
  try {
    // Esta dirección es donde debe estar escuchando tu script de Python
    const response = await fetch('http://127.0.0.1:8000/analizar-cultivo');
    const data = await response.json();
    // Aquí actualizas tu panel con la respuesta de la IA
    document.getElementById('panel-principal').innerHTML = `
            <h3>Resultado de la IA:</h3>
            <p>${data.deteccion}</p>
        `;
  } catch (error) {
    console.error('No se pudo conectar con el asistente:', error);
  }
}
