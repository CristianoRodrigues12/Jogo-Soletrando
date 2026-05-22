const WIKI_API = 'https://pt.wiktionary.org/w/api.php';
const USER_AGENT = 'Soletrando/1.0 (educational spelling game)';

function parseExtract(extract) {
  const definitions = [];
  let etymology = null;

  const etymBlock = extract.match(/==\s*Etimologia\s*==\s*([\s\S]*?)(?=\n==\s|\n===|$)/i);
  if (etymBlock) {
    const lines = etymBlock[1]
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('='));
    if (lines.length) etymology = lines[0];
  }

  const numbered = extract.match(/^#\s*(.+)$/gm);
  if (numbered) {
    for (const line of numbered) {
      const text = line.replace(/^#\s*/, '').trim();
      if (text.length > 5) definitions.push(text);
    }
  }

  if (definitions.length === 0) {
    const scoped = [...extract.matchAll(/^\([^)]+\)\s*(.+)$/gm)];
    for (const m of scoped) {
      const text = m[1].trim();
      if (text.length > 8 && !text.startsWith('Datação')) {
        definitions.push(text);
      }
    }
  }

  return { definitions: definitions.slice(0, 5), etymology };
}

export async function fetchWiktionaryDetails(word) {
  const title = word.normalize('NFC').trim();
  const params = new URLSearchParams({
    action: 'query',
    titles: title,
    prop: 'extracts',
    explaintext: '1',
    format: 'json',
  });

  const res = await fetch(`${WIKI_API}?${params}`, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!res.ok) return null;

  const data = await res.json();
  const pages = data?.query?.pages;
  if (!pages) return null;

  const page = Object.values(pages)[0];
  if (!page || page.missing !== undefined || !page.extract) return null;

  const { definitions, etymology } = parseExtract(page.extract);
  if (definitions.length === 0 && !etymology) return null;

  return {
    word: title,
    definitions:
      definitions.length > 0
        ? definitions
        : [`Entrada encontrada no Wiktionário para “${title}”.`],
    etymology,
    examples: [],
    rawExtract: page.extract,
  };
}
