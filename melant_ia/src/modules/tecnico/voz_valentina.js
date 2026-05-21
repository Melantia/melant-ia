// Voz Valentina (femenina, clara)
window.vozValentina = function (texto) {
  if (!('speechSynthesis' in window)) return;
  const utt = new SpeechSynthesisUtterance(texto);
  utt.lang = 'es-EC';
  utt.pitch = 1.15;
  utt.rate = 1.0;
  speechSynthesis.cancel();
  speechSynthesis.speak(utt);
};
