const LETTER_ALIASES = {
  a: 'a', á: 'a', à: 'a', â: 'a', ã: 'a',
  b: 'b', be: 'b', bê: 'b',
  c: 'c', ce: 'c', cê: 'c',
  d: 'd', de: 'd', dê: 'd',
  e: 'e', é: 'e', è: 'e', ê: 'e',
  f: 'f', efe: 'f',
  g: 'g', gê: 'g', ge: 'g',
  h: 'h', agá: 'h', aga: 'h',
  i: 'i', j: 'j', jota: 'j',
  k: 'k', cá: 'k', ca: 'k',
  l: 'l', ele: 'l',
  m: 'm', eme: 'm',
  n: 'n', ene: 'n',
  o: 'o', ó: 'o', ô: 'o', õ: 'o',
  p: 'p', pê: 'p', pe: 'p',
  q: 'q', quê: 'q', que: 'q',
  r: 'r', erre: 'r', re: 'r',
  s: 's', esse: 's',
  t: 't', tê: 't', te: 't',
  u: 'u', ú: 'u',
  v: 'v', vê: 'v', ve: 'v',
  w: 'w', dáblio: 'w', dabliu: 'w', 'duplo v': 'w',
  x: 'x', xis: 'x',
  y: 'y', ípsilon: 'y', ipsilon: 'y',
  z: 'z', zê: 'z', ze: 'z',
  ç: 'ç', cedilha: 'ç',
  '-': '-', hífen: '-', hifen: '-', traço: '-',
};

function normalizeToken(token) {
  return token
    .normalize('NFC')
    .toLowerCase()
    .replace(/[.,!?;:'"«»]/g, '')
    .trim();
}

function tokenToLetter(token) {
  if (!token) return null;
  const t = normalizeToken(token);
  if (LETTER_ALIASES[t]) return LETTER_ALIASES[t];
  if (t.length === 1 && /[a-záàâãéèêíóôõúçñ\-]/i.test(t)) return t;
  return null;
}

export function parseSpokenLetters(transcript) {
  const raw = transcript.normalize('NFC').trim();
  if (!raw) return [];

  let text = raw.toLowerCase().replace(/^letra\s+/i, '');
  const letters = [];

  const deMatch = text.match(/^([a-záàâãéèêíóôõúçñ])\s+de\s+/i);
  if (deMatch) {
    letters.push(deMatch[1].toLowerCase());
    return letters;
  }

  const chunks = text
    .split(/[,;]|\s+e\s+|\s+depois\s+|\s+então\s+/i)
    .flatMap((chunk) => chunk.split(/\s+/))
    .map(normalizeToken)
    .filter(Boolean);

  for (const chunk of chunks) {
    const letter = tokenToLetter(chunk);
    if (letter) letters.push(letter);
  }

  if (letters.length === 0) {
    const single = tokenToLetter(normalizeToken(text));
    if (single) letters.push(single);
  }

  return letters;
}

export function parseSpokenLetter(transcript) {
  const letters = parseSpokenLetters(transcript);
  return letters[0] || null;
}

export function isRecognitionSupported() {
  return (
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  );
}

export async function requestMicrophoneAccess() {
  if (!navigator.mediaDevices?.getUserMedia) return true;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return true;
  } catch {
    return false;
  }
}

/** Captura uma letra por vez com timeout e liberação garantida. */
export function captureOneLetter({ onLetter, onError, onStatus, onEnd }) {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) return null;

  const recognition = new SpeechRecognition();
  recognition.lang = 'pt-BR';
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 10;

  let finished = false;
  let captured = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(timeoutId);
    onStatus?.('');
    onEnd?.();
  };

  const timeoutId = setTimeout(() => {
    try {
      recognition.stop();
    } catch {
      finish();
    }
    if (!captured) {
      onStatus?.('Tempo esgotado. Use os botões de letras abaixo.');
    }
    finish();
  }, 9000);

  recognition.onstart = () => {
    onStatus?.('Fale a letra agora… (ex.: eme, erre, a)');
  };

  recognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (!result.isFinal) continue;

      for (let alt = 0; alt < result.length; alt++) {
        const transcript = result[alt].transcript.trim();
        const letters = parseSpokenLetters(transcript);
        if (letters.length > 0) {
          captured = true;
          onLetter?.(letters[0], transcript);
          onStatus?.(`Captado: “${transcript}” → ${letters[0]}`);
          try {
            recognition.stop();
          } catch {
            finish();
          }
          return;
        }
      }
    }
  };

  recognition.onerror = (event) => {
    if (event.error === 'aborted') {
      finish();
      return;
    }
    if (event.error === 'no-speech') {
      onStatus?.('Não ouvi nada. Clique de novo ou use os botões de letras.');
      finish();
      return;
    }
    onError?.(event.error);
    finish();
  };

  recognition.onend = () => {
    finish();
  };

  return recognition;
}
