import { buildExampleSentence } from './sentence.js';
import { fetchWiktionaryDetails } from './wiktionary.js';
import { buildFallbackDetails } from './fallback.js';

const API_BASE = 'http://api.dicionario-aberto.net';
const USER_AGENT = 'Soletrando/1.0';

function stripTags(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractEtymology(xml) {
  const match = xml.match(/\((?:[^()]*(?:Lat\.|Gr\.|Fr\.|Ing\.|Port\.)[^()]*)\)/i);
  if (!match) return null;
  return stripTags(match[0].replace(/^\(|\)$/g, ''));
}

function extractExamples(xml) {
  const examples = [];
  const regex = /_([^_]+)_/g;
  let m;
  while ((m = regex.exec(xml)) !== null) {
    const text = m[1].trim();
    if (text.length > 3 && !examples.includes(text)) {
      examples.push(text);
    }
  }
  return examples.slice(0, 3);
}

function extractDefinitions(xml) {
  const defs = [];
  const withoutEtym = xml.replace(/\([^)]*(?:Lat\.|Gr\.|Fr\.)[^)]*\)\s*$/i, '');
  const parts = withoutEtym.split(/<\/p>\s*<p>/i);
  for (const part of parts) {
    const text = stripTags(part);
    if (text.length > 8 && !text.match(/^[a-z]\.\s*$/i)) {
      defs.push(text);
    }
  }
  if (defs.length === 0) {
    const main = stripTags(withoutEtym);
    if (main.length > 10) defs.push(main.slice(0, 500));
  }
  return defs.slice(0, 5);
}

async function fetchFromDicionarioAberto(word) {
  const normalized = word.normalize('NFC').toLowerCase().trim();
  const url = `${API_BASE}/word/${encodeURIComponent(normalized)}`;

  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) return null;

  const entries = await res.json();
  if (!Array.isArray(entries) || entries.length === 0) return null;

  const entry = entries[0];
  const xml = entry.xml || '';
  const definitions = extractDefinitions(xml);
  const examples = extractExamples(xml);

  return {
    word: entry.word || word,
    normalized: entry.normalized || normalized,
    definitions,
    etymology: extractEtymology(xml),
    examples,
    exampleSentence: buildExampleSentence(
      entry.word || word,
      xml,
      definitions,
      examples
    ),
    sense: entry.sense,
    source: 'dicionario-aberto',
  };
}

export async function fetchWordDetails(word) {
  const trimmed = word.normalize('NFC').trim();

  try {
    const fromOpen = await fetchFromDicionarioAberto(trimmed);
    if (fromOpen) return fromOpen;
  } catch {
    /* tenta próxima fonte */
  }

  try {
    const fromWiki = await fetchWiktionaryDetails(trimmed);
    if (fromWiki) {
      return {
        ...fromWiki,
        exampleSentence: buildExampleSentence(
          fromWiki.word,
          '',
          fromWiki.definitions,
          fromWiki.examples
        ),
        source: 'wiktionary',
      };
    }
  } catch {
    /* tenta fallback local */
  }

  return buildFallbackDetails(trimmed);
}

export async function fetchRandomDictionaryWord() {
  const res = await fetch(`${API_BASE}/random`);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data?.word) return null;
  return fetchWordDetails(data.word);
}
