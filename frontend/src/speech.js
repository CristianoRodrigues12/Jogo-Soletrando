function getSynth() {
  return typeof window !== 'undefined' ? window.speechSynthesis : null;
}

function loadVoices() {
  const synth = getSynth();
  return synth ? synth.getVoices() : [];
}

if (typeof window !== 'undefined' && getSynth()) {
  loadVoices();
  getSynth().addEventListener('voiceschanged', loadVoices);
}

export function isSpeechSupported() {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window
  );
}

export function pickPortugueseVoice() {
  const voices = loadVoices();
  return (
    voices.find((v) => v.lang === 'pt-BR') ||
    voices.find((v) => v.lang.startsWith('pt')) ||
    voices.find((v) => /portugu[eê]s|brazil|brasil/i.test(v.name)) ||
    null
  );
}

export function stopSpeaking() {
  getSynth()?.cancel();
}

export function speakText(text, { onStart, onEnd, onError } = {}) {
  return speakWord(text, { onStart, onEnd, onError });
}

export function speakWord(word, { onStart, onEnd, onError } = {}) {
  const synth = getSynth();

  if (!isSpeechSupported() || !synth) {
    onError?.('Seu navegador não suporta leitura em voz alta.');
    return;
  }

  synth.cancel();

  const text = word.normalize('NFC').trim();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pt-BR';
  utterance.rate = 0.92;
  utterance.pitch = 1;

  const voice = pickPortugueseVoice();
  if (voice) utterance.voice = voice;

  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = (event) => {
    if (event.error !== 'interrupted' && event.error !== 'canceled') {
      onError?.('Não foi possível reproduzir a pronúncia.');
    }
    onEnd?.();
  };

  const start = () => {
    const ptVoice = pickPortugueseVoice();
    if (ptVoice) utterance.voice = ptVoice;
    synth.speak(utterance);
  };

  if (loadVoices().length === 0) {
    const onVoices = () => {
      synth.removeEventListener('voiceschanged', onVoices);
      start();
    };
    synth.addEventListener('voiceschanged', onVoices);
    setTimeout(start, 300);
  } else {
    start();
  }
}
