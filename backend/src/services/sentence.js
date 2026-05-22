function normalize(text) {
  return text.normalize('NFC').toLowerCase();
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function wordAppearsInText(word, text) {
  const w = normalize(word);
  const pattern = new RegExp(
    `(^|[^\\p{L}])${escapeRegex(w)}([^\\p{L}]|$)`,
    'iu'
  );
  return pattern.test(text.normalize('NFC'));
}

function capitalizeSentence(text) {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (!trimmed) return trimmed;
  const first = trimmed.charAt(0).toUpperCase();
  const rest = trimmed.slice(1);
  const withPeriod = /[.!?…]$/.test(rest) ? rest : `${rest}.`;
  return first + withPeriod;
}

function extractItalicFragments(xml) {
  const fragments = [];
  const regex = /_([^_]+)_/g;
  let m;
  while ((m = regex.exec(xml)) !== null) {
    const text = m[1].trim();
    if (text.length > 2) fragments.push(text);
  }
  return fragments;
}

function guessArticle(word) {
  const w = normalize(word);
  if (
    w.endsWith('ção') ||
    w.endsWith('dade') ||
    w.endsWith('gem') ||
    w.endsWith('ade') ||
    w.endsWith('ia') ||
    w.endsWith('ez') ||
    w.endsWith('tude') ||
    w.endsWith('ice')
  ) {
    return 'A';
  }
  if (w.endsWith('a')) return 'A';
  return 'O';
}

function buildGeneratedSentence(word) {
  const w = word.normalize('NFC');
  const lower = w.charAt(0).toLowerCase() + w.slice(1);

  if (lower.endsWith('mente')) {
    return `O desafio de hoje inclui soletrar corretamente a palavra ${lower}.`;
  }

  const article = guessArticle(lower);
  const artLower = article.toLowerCase();

  const templates = [
    `${article} ${lower} é um tema muito importante no debate de hoje.`,
    `Precisamos entender melhor ${artLower} ${lower} antes de continuar.`,
    `O texto apresenta ${artLower} ${lower} em um contexto muito claro.`,
    `A turma ouviu atentamente quando o apresentador disse: ${lower}.`,
  ];

  const idx = [...lower].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % templates.length;
  return templates[idx];
}

function isDictionaryExample(fragment) {
  const text = fragment.trim();
  if (text.length < 10 || text.length > 100) return false;
  if (/^[A-Za-zÀ-úáàâãéèêíóôõúç]+\s+[a-z]\.(\s|$)/.test(text)) return false;
  if (text.split(/\s+/).length < 3) return false;
  if ((text.match(/,/g) || []).length > 2) return false;
  return true;
}

function fragmentToSentence(fragment) {
  const trimmed = fragment.trim();
  if (!isDictionaryExample(trimmed)) return null;
  if (/[.!?…]/.test(trimmed)) {
    return capitalizeSentence(trimmed);
  }
  if (/^(o|a|os|as|um|uma|no|na|do|da|em)\s/i.test(trimmed)) {
    return capitalizeSentence(trimmed);
  }
  return capitalizeSentence(trimmed);
}

export function buildExampleSentence(word, xml, definitions = [], examples = []) {
  const candidates = [
    ...extractItalicFragments(xml),
    ...examples,
  ];

  for (const fragment of candidates) {
    if (!wordAppearsInText(word, fragment)) continue;
    const sentence = fragmentToSentence(fragment);
    if (sentence) return sentence;
  }

  for (const def of definitions) {
    const parts = def.split(/(?<=[.;])\s+/);
    for (const part of parts) {
      const cleaned = part.replace(/\(De [_].+?\)/gi, '').trim();
      if (!wordAppearsInText(word, cleaned)) continue;
      const sentence = fragmentToSentence(cleaned);
      if (sentence) return sentence;
    }
  }

  return buildGeneratedSentence(word);
}
