import { Router } from 'express';
import { fetchWordDetails } from '../services/dictionary.js';
import {
  pickRandomWord,
  pickRandomWordAnyLevel,
  VALID_LEVELS,
} from '../services/wordsPool.js';

function normalizeForCompare(str) {
  return str
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^a-záàâãéèêíïóôõöúçñ\s-]/gi, '')
    .trim();
}

export const wordsRouter = Router();

wordsRouter.get('/levels', (_req, res) => {
  res.json({
    levels: [
      { id: 'easy', label: 'Fácil', description: 'Palavras curtas e comuns (4–6 letras)' },
      { id: 'medium', label: 'Médio', description: 'Palavras intermediárias (7–12 letras)' },
      { id: 'hard', label: 'Difícil', description: 'Palavras longas ou pouco usuais' },
    ],
  });
});

wordsRouter.get('/random', async (req, res) => {
  const levelParam = req.query.level || 'random';
  const includeDetails = req.query.details === 'true';

  let word;
  let level;

  if (levelParam === 'random') {
    ({ word, level } = pickRandomWordAnyLevel());
  } else if (VALID_LEVELS.includes(levelParam)) {
    level = levelParam;
    word = pickRandomWord(level);
  } else {
    return res.status(400).json({
      error: 'Nível inválido. Use: easy, medium, hard ou random.',
    });
  }

  const payload = { word, level, length: word.length };

  if (includeDetails) {
    try {
      const details = await fetchWordDetails(word);
      payload.details = details || {
        word,
        definitions: ['Definição não encontrada no dicionário para esta palavra.'],
        etymology: null,
        examples: [],
        exampleSentence: null,
      };
    } catch {
      payload.details = {
        word,
        definitions: ['Não foi possível carregar o dicionário no momento.'],
        etymology: null,
        examples: [],
        exampleSentence: null,
      };
    }
  }

  res.json(payload);
});

wordsRouter.get('/:word/details', async (req, res) => {
  const word = decodeURIComponent(req.params.word);

  try {
    const details = await fetchWordDetails(word);
    res.json(details);
  } catch {
    res.status(502).json({ error: 'Erro ao consultar o dicionário.' });
  }
});

wordsRouter.post('/validate', (req, res) => {
  const { attempt, answer } = req.body;

  if (!attempt || !answer) {
    return res.status(400).json({ error: 'Envie attempt e answer.' });
  }

  const correct =
    normalizeForCompare(attempt) === normalizeForCompare(answer);

  res.json({ correct, attempt, answer });
});
