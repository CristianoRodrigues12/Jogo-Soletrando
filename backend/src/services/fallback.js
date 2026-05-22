import { buildExampleSentence } from './sentence.js';

function inferEtymology(word) {
  const w = word.normalize('NFC').toLowerCase();

  if (w.startsWith('bio')) return 'Prefixo grego bio- (“vida”), com elementos da língua portuguesa.';
  if (w.endsWith('dade')) return 'Formação com o sufixo -dade, de origem latina.';
  if (w.endsWith('ção')) return 'Formação com o sufixo -ção, de origem latina.';
  if (w.endsWith('mente')) return 'Formação com o sufixo -mente (modo ou maneira).';
  if (w.endsWith('ismo')) return 'Formação com o sufixo -ismo (doutrina, sistema ou qualidade).';

  return 'Termo da língua portuguesa; etimologia detalhada não disponível nos dicionários consultados.';
}

function inferDefinition(word) {
  const w = word.normalize('NFC').toLowerCase();

  if (w.includes('biodiversidade')) {
    return 'Conjunto da variedade de espécies da flora e da fauna em um ecossistema.';
  }
  if (w.includes('sustentab')) {
    return 'Relativo à capacidade de se manter ou perdurar sem esgotar recursos.';
  }

  return `Palavra da língua portuguesa utilizada no contexto do soletrando. Consulte também o significado de “${word}” em materiais de referência.`;
}

export function buildFallbackDetails(word) {
  const w = word.normalize('NFC').trim();

  return {
    word: w,
    normalized: w.toLowerCase(),
    definitions: [inferDefinition(w)],
    etymology: inferEtymology(w),
    examples: [],
    exampleSentence: buildExampleSentence(w, '', [], []),
    source: 'generated',
  };
}
