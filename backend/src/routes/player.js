import { Router } from 'express';
import { pickRandomWordAnyLevel } from '../services/wordsPool.js';
import { createWordSession, getWordSession } from '../services/wordSessions.js';
import { fetchWordDetails } from '../services/dictionary.js';

function normalizeForCompare(str) {
  return str
    .normalize('NFC')
    .toLowerCase()
    .replace(/[^a-záàâãéèêíïóôõöúçñ\s-]/gi, '')
    .trim();
}

export const playerRouter = Router();

playerRouter.get('/random', (_req, res) => {
  const { word, level } = pickRandomWordAnyLevel();
  const token = createWordSession(word, level);

  res.json({
    token,
    length: word.length,
    level,
  });
});

playerRouter.get('/session/:token/hint/:type', async (req, res) => {
  const session = getWordSession(req.params.token);
  if (!session) {
    return res.status(404).json({
      error: 'Sessão da palavra inválida. Clique em "Receber palavra" novamente.',
    });
  }

  const { type } = req.params;
  const allowed = ['word', 'definition', 'example', 'etymology'];
  if (!allowed.includes(type)) {
    return res.status(400).json({ error: 'Tipo de dica inválido.' });
  }

  try {
    if (type === 'word') {
      return res.json({ text: session.word });
    }

    const details = await fetchWordDetails(session.word);

    if (type === 'definition') {
      const text = details?.definitions?.[0];
      if (!text) return res.status(404).json({ error: 'Definição não encontrada.' });
      return res.json({ text });
    }

    if (type === 'example') {
      const text = details?.exampleSentence;
      if (!text) return res.status(404).json({ error: 'Frase de exemplo não encontrada.' });
      return res.json({ text });
    }

    if (type === 'etymology') {
      const text = details?.etymology;
      if (!text) return res.status(404).json({ error: 'Origem não encontrada.' });
      return res.json({ text });
    }
  } catch {
    return res.status(502).json({ error: 'Erro ao buscar informação.' });
  }
});

playerRouter.post('/validate', (req, res) => {
  const { token, attempt } = req.body;

  if (!token || !attempt) {
    return res.status(400).json({ error: 'Dados incompletos para validação.' });
  }

  const session = getWordSession(token);
  if (!session) {
    return res.status(404).json({
      error: 'Sessão da palavra inválida. Clique em "Receber palavra" novamente.',
    });
  }

  const correct =
    normalizeForCompare(attempt) === normalizeForCompare(session.word);

  const payload = {
    correct,
    attempt: normalizeForCompare(attempt),
    length: session.word.length,
  };

  payload.word = session.word;

  res.json(payload);
});
