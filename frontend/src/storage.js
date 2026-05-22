const PLAYERS_KEY = 'soletrando_players';
const NAMES_KEY = 'soletrando_names';

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadPlayers() {
  return readJson(PLAYERS_KEY, []);
}

export function savePlayers(players) {
  writeJson(PLAYERS_KEY, players);
}

export function loadSavedNames() {
  return readJson(NAMES_KEY, []);
}

export function saveName(name) {
  const trimmed = name.trim();
  if (!trimmed) return loadSavedNames();
  const names = loadSavedNames();
  if (!names.includes(trimmed)) {
    names.push(trimmed);
    writeJson(NAMES_KEY, names);
  }
  return names;
}

/** Inicia uma nova partida (nova linha no ranking). */
export function createSession(players, name) {
  const trimmed = name.trim();
  const session = {
    id: crypto.randomUUID(),
    name: trimmed,
    correct: 0,
    wrong: 0,
    startedAt: Date.now(),
  };
  return {
    players: [...players, session],
    sessionId: session.id,
  };
}

/** Atualiza apenas a partida em andamento. */
export function updateSession(players, sessionId, wasCorrect) {
  if (!sessionId) return players;

  return players.map((entry) =>
    entry.id === sessionId
      ? {
          ...entry,
          correct: entry.correct + (wasCorrect ? 1 : 0),
          wrong: entry.wrong + (wasCorrect ? 0 : 1),
        }
      : entry
  );
}

/** Remove partida sem nenhuma marcação (encerrada antes de jogar). */
export function removeSession(players, sessionId) {
  if (!sessionId) return players;
  return players.filter((entry) => entry.id !== sessionId);
}

export function sortRanking(players) {
  return [...players].sort((a, b) => {
    if (b.correct !== a.correct) return b.correct - a.correct;
    return a.wrong - b.wrong;
  });
}
