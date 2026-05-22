import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'soletrando-dev-secret';
const WORD_SESSION_EXPIRES = '3h';

export function createWordSession(word, level) {
  return jwt.sign(
    {
      type: 'word_session',
      word: word.normalize('NFC'),
      level,
    },
    JWT_SECRET,
    { expiresIn: WORD_SESSION_EXPIRES }
  );
}

export function getWordSession(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.type !== 'word_session' || !payload.word) {
      return null;
    }
    return {
      word: payload.word,
      level: payload.level,
    };
  } catch {
    return null;
  }
}

export function deleteWordSession() {
  /* Sessão em JWT — não precisa apagar no servidor */
}
