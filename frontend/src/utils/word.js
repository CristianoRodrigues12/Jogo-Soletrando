export function hyphenatedWord(word) {
  return Array.from(word.normalize('NFC'))
    .map((ch) => ch.toUpperCase())
    .join(' - ');
}

export function hyphenatedAttempt(attempt) {
  if (!attempt) return '—';
  return hyphenatedWord(attempt);
}
