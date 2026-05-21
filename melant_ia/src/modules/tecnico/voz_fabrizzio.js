// Voz Fabrizzio (grave y calmada)
window.vozFabrizzio = function (texto) {
  if (!('speechSynthesis' in window)) return;
  const utt = new SpeechSynthesisUtterance(texto);
  utt.lang = 'es-EC';
  utt.pitch = 0.85;
  utt.rate = 0.92;
  speechSynthesis.cancel();
  speechSynthesis.speak(utt);
};
