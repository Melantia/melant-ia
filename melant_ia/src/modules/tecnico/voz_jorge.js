// Voz Dr. Jorge (masculina, profesional)
window.vozJorge = function (texto) {
  if (!('speechSynthesis' in window)) return;
  const utt = new SpeechSynthesisUtterance(texto);
  utt.lang = 'es-EC';
  utt.pitch = 0.95;
  utt.rate = 0.98;
  speechSynthesis.cancel();
  speechSynthesis.speak(utt);
};
