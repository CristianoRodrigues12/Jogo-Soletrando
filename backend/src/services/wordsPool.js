import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const wordsData = JSON.parse(
  readFileSync(join(__dirname, '../data/words.json'), 'utf-8')
);

const VALID_LEVELS = ['easy', 'medium', 'hard'];
const usedWords = new Map();

export function pickRandomWord(level) {
  const pool = wordsData[level];
  const used = usedWords.get(level) || new Set();
  let available = pool.filter((w) => !used.has(w));

  if (available.length === 0) {
    used.clear();
    available = [...pool];
  }

  const word = available[Math.floor(Math.random() * available.length)];
  used.add(word);
  usedWords.set(level, used);
  return word;
}

export function pickRandomWordAnyLevel() {
  const level = VALID_LEVELS[Math.floor(Math.random() * VALID_LEVELS.length)];
  return { word: pickRandomWord(level), level };
}

export { VALID_LEVELS };
