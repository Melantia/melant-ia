// location_engine.js
// GPS y lógica de Modo Campo para MELANTIA
let modoCampo = false;

export function init(State) {
  try {
    if (navigator.deviceMemory <= 2 || navigator.hardwareConcurrency <= 2) {
      modoCampo = true;
    }
  } catch (err) {
    console.error('Init LocationEngine error:', err);
  }
}

export async function getCurrentLocation() {
  try {
    return await new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject('No soportado');
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos.coords),
        (err) => reject(err),
        modoCampo ? { maximumAge: 60000, timeout: 5000 } : {}
      );
    });
  } catch (err) {
    console.error('GPS error:', err);
    return null;
  }
}

export function isModoCampo() {
  return modoCampo;
}
