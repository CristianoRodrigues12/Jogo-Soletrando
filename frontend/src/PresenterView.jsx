import { useState, useEffect, useRef } from 'react';
import { getRandomWord, getLevelLabel, fetchWordDetails } from './api';
import { speakWord, stopSpeaking, isSpeechSupported } from './speech';
import {
  loadPlayers,
  savePlayers,
  loadSavedNames,
  saveName,
  createSession,
  updateSession,
  removeSession,
  sortRanking,
} from './storage';
import './App.css';

function hyphenatedWord(word) {
  return Array.from(word.normalize('NFC'))
    .map((ch) => ch.toUpperCase())
    .join(' - ');
}

export default function PresenterView({ onLogout }) {
  const [loading, setLoading] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [savedNames, setSavedNames] = useState([]);
  const [players, setPlayers] = useState([]);

  const [currentWord, setCurrentWord] = useState(null);
  const [currentLevel, setCurrentLevel] = useState(null);
  const [details, setDetails] = useState(null);
  const [revealed, setRevealed] = useState({
    definition: false,
    example: false,
    etymology: false,
  });
  const [loadingHint, setLoadingHint] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const nameInputRef = useRef(null);

  useEffect(() => {
    setPlayers(loadPlayers());
    setSavedNames(loadSavedNames());
  }, []);

  useEffect(() => {
    if (!currentWord) {
      nameInputRef.current?.focus();
    }
  }, [currentWord]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const persistPlayers = (next) => {
    setPlayers(next);
    savePlayers(next);
  };

  const resetHints = () => {
    stopSpeaking();
    setIsSpeaking(false);
    setDetails(null);
    setRevealed({ definition: false, example: false, etymology: false });
    setLoadingHint(null);
  };

  const resetToPlayerSelect = (message) => {
    stopSpeaking();
    setIsSpeaking(false);
    setLoading(false);
    setCurrentSessionId(null);
    setCurrentWord(null);
    setCurrentLevel(null);
    resetHints();
    setPlayerName('');
    setFeedback(
      message ? { type: 'fail', message } : null
    );
  };

  const endGame = () => {
    if (
      !window.confirm(
        'Deseja encerrar o jogo? O ranking dos jogadores será mantido.'
      )
    ) {
      return;
    }

    stopSpeaking();
    setIsSpeaking(false);
    setLoading(false);

    let nextPlayers = players;
    if (currentSessionId) {
      const session = players.find((p) => p.id === currentSessionId);
      if (session && session.correct === 0 && session.wrong === 0) {
        nextPlayers = removeSession(players, currentSessionId);
        persistPlayers(nextPlayers);
      }
    }

    setCurrentSessionId(null);
    setCurrentWord(null);
    setCurrentLevel(null);
    resetHints();
    setPlayerName('');
    setFeedback({
      type: 'success',
      message: 'Jogo encerrado. Inicie uma nova rodada quando quiser.',
    });
  };

  const loadWord = async () => {
    setLoading(true);
    setFeedback(null);
    resetHints();
    try {
      const data = await getRandomWord();
      setCurrentWord(data.word);
      setCurrentLevel(data.level);
    } catch {
      setFeedback({
        type: 'error',
        message: 'Erro ao carregar palavra. Verifique se o backend está rodando.',
      });
    } finally {
      setLoading(false);
    }
  };

  const startGame = () => {
    if (!playerName.trim()) {
      setFeedback({ type: 'error', message: 'Informe o nome de quem vai soletrar.' });
      return;
    }
    saveName(playerName);
    setSavedNames(loadSavedNames());

    const { players: nextPlayers, sessionId } = createSession(players, playerName);
    persistPlayers(nextPlayers);
    setCurrentSessionId(sessionId);

    loadWord();
  };

  const ensureDetails = async () => {
    if (details) return details;
    try {
      const data = await fetchWordDetails(currentWord);
      setDetails(data);
      return data;
    } catch (err) {
      throw new Error(err?.message || 'fetch failed');
    }
  };

  const revealHint = async (type) => {
    if (!currentWord) return;
    setLoadingHint(type);
    setFeedback(null);
    try {
      const data = await ensureDetails();

      if (type === 'definition') {
        if (!data.definitions?.length) {
          setFeedback({ type: 'error', message: 'Definição não encontrada para esta palavra.' });
          return;
        }
      }
      if (type === 'etymology' && !data.etymology) {
        setFeedback({
          type: 'error',
          message: 'Origem não encontrada para esta palavra nos dicionários consultados.',
        });
        return;
      }
      if (type === 'example') {
        if (!data.exampleSentence) {
          setFeedback({ type: 'error', message: 'Não foi possível formar uma frase com esta palavra.' });
          return;
        }
      }

      setRevealed((r) => ({ ...r, [type]: true }));
    } catch {
      setFeedback({
        type: 'error',
        message: 'Não foi possível consultar o dicionário. Tente novamente.',
      });
    } finally {
      setLoadingHint(null);
    }
  };

  const markResult = async (wasCorrect) => {
    if (!playerName.trim()) {
      setFeedback({ type: 'error', message: 'Informe o nome do soletrador antes de marcar.' });
      return;
    }
    if (!currentWord) return;

    saveName(playerName);
    const nextPlayers = updateSession(players, currentSessionId, wasCorrect);
    persistPlayers(nextPlayers);
    setSavedNames(loadSavedNames());

    if (wasCorrect) {
      setFeedback({
        type: 'success',
        message: `${playerName.trim()} soletrou corretamente!`,
      });
      await loadWord();
      return;
    }

    const name = playerName.trim();
    setCurrentSessionId(null);
    resetToPlayerSelect(
      `${name} errou esta palavra. Informe o nome do próximo soletrador.`
    );
  };

  const handleListenWord = () => {
    if (!currentWord || isSpeaking) return;

    if (!isSpeechSupported()) {
      setFeedback({
        type: 'error',
        message:
          'Seu navegador não suporta leitura em voz alta. Tente Chrome, Edge ou Firefox atualizados.',
      });
      return;
    }

    setFeedback(null);
    speakWord(currentWord, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: (message) => {
        setIsSpeaking(false);
        setFeedback({ type: 'error', message });
      },
    });
  };

  const ranking = sortRanking(players);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-row">
          <div>
            <h1>Jogo Soletrando</h1>
            <p>Modo apresentador — acompanhe a soletração em tempo real</p>
          </div>
          <button type="button" className="btn-logout" onClick={onLogout}>
            Sair
          </button>
        </div>
      </header>

      <section className="card player-section">
        <h2 className="card-title">Soletrador</h2>
        <label className="field-label" htmlFor="player-name">
          Nome de quem vai soletrar
        </label>
        <input
          ref={nameInputRef}
          id="player-name"
          type="text"
          className="text-input"
          list="saved-names"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Ex.: Maria, João…"
          autoComplete="name"
        />
        <datalist id="saved-names">
          {savedNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        {savedNames.length > 0 && (
          <div className="saved-names">
            <span className="saved-names-label">Já participaram:</span>
            <div className="name-chips">
              {savedNames.map((name) => (
                <button
                  key={name}
                  type="button"
                  className={`name-chip ${playerName === name ? 'active' : ''}`}
                  onClick={() => setPlayerName(name)}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {!currentWord && (
        <button
          type="button"
          className="btn-primary"
          disabled={loading}
          onClick={startGame}
        >
          {loading ? 'Carregando…' : 'Começar a soletrar'}
        </button>
      )}

      {currentWord && (
        <div className="screen game-screen">
          <div className="game-meta">
            <span className={`level-badge ${currentLevel}`}>
              {getLevelLabel(currentLevel)}
            </span>
            <button
              type="button"
              className="btn-end-game"
              onClick={endGame}
              disabled={loading}
            >
              Encerrar jogo
            </button>
          </div>

          <section className="card word-panel presenter-panel">
            <p className="word-hint">
              Soletrando: <strong>{playerName.trim()}</strong>
            </p>
            <p
              className="word-spelled"
              aria-label={`Letras: ${hyphenatedWord(currentWord)}`}
            >
              {hyphenatedWord(currentWord)}
            </p>
            <p className="word-full">{currentWord}</p>

            <button
              type="button"
              className={`btn-listen ${isSpeaking ? 'speaking' : ''}`}
              onClick={handleListenWord}
              disabled={isSpeaking}
              aria-label={`Ouvir pronúncia de ${currentWord}`}
            >
              <span className="btn-listen-icon" aria-hidden="true">
                {isSpeaking ? '◉' : '🔊'}
              </span>
              {isSpeaking ? 'Reproduzindo…' : 'Ouvir palavra'}
            </button>

            <div className="hint-buttons">
              <button
                type="button"
                className={`btn-hint ${revealed.definition ? 'active' : ''}`}
                disabled={loadingHint === 'definition'}
                onClick={() => revealHint('definition')}
              >
                {loadingHint === 'definition' ? 'Carregando…' : 'Definição'}
              </button>
              <button
                type="button"
                className={`btn-hint ${revealed.example ? 'active' : ''}`}
                disabled={loadingHint === 'example'}
                onClick={() => revealHint('example')}
              >
                {loadingHint === 'example' ? 'Carregando…' : 'Aplicação em frase'}
              </button>
              <button
                type="button"
                className={`btn-hint ${revealed.etymology ? 'active' : ''}`}
                disabled={loadingHint === 'etymology'}
                onClick={() => revealHint('etymology')}
              >
                {loadingHint === 'etymology' ? 'Carregando…' : 'Origem'}
              </button>
            </div>

            <div className="hint-results">
              {revealed.definition && details?.definitions?.[0] && (
                <div className="hint-result">
                  <h4>Definição</h4>
                  <p>{details.definitions[0]}</p>
                </div>
              )}
              {revealed.example && details?.exampleSentence && (
                <div className="hint-result">
                  <h4>Aplicação em frase</h4>
                  <p className="hint-sentence">{details.exampleSentence}</p>
                </div>
              )}
              {revealed.etymology && details?.etymology && (
                <div className="hint-result">
                  <h4>Origem</h4>
                  <p>{details.etymology}</p>
                </div>
              )}
            </div>
          </section>

          <div className="verdict-buttons">
            <button
              type="button"
              className="btn-verdict btn-correct"
              disabled={loading}
              onClick={() => markResult(true)}
            >
              ✓ Certo
            </button>
            <button
              type="button"
              className="btn-verdict btn-wrong"
              disabled={loading}
              onClick={() => markResult(false)}
            >
              ✗ Errado
            </button>
          </div>

          <button
            type="button"
            className="btn-secondary btn-next-word"
            disabled={loading}
            onClick={loadWord}
          >
            {loading ? 'Carregando…' : 'Pular palavra (sem marcar)'}
          </button>
        </div>
      )}

      {feedback && (
        <p className={`toast toast-${feedback.type}`} role="status">
          {feedback.message}
        </p>
      )}

      <section className="card ranking-section">
        <h2 className="card-title">Ranking</h2>
        {ranking.length === 0 ? (
          <p className="ranking-empty">
            Nenhuma palavra marcada ainda. Use os botões Certo ou Errado durante o jogo.
          </p>
        ) : (
          <ol className="ranking-list">
            {ranking.map((player, index) => (
              <li key={player.id} className="ranking-item">
                <span className="ranking-position">{index + 1}º</span>
                <span className="ranking-name">{player.name}</span>
                <span className="ranking-stats">
                  <strong>{player.correct}</strong> acertos
                  {player.wrong > 0 && (
                    <span className="ranking-wrong"> · {player.wrong} erros</span>
                  )}
                </span>
              </li>
            ))}
          </ol>
        )}
        {ranking.length > 0 && (
          <button
            type="button"
            className="btn-secondary btn-reset-ranking"
            onClick={() => {
              if (window.confirm('Zerar o ranking de todos os jogadores?')) {
                persistPlayers([]);
              }
            }}
          >
            Zerar ranking
          </button>
        )}
      </section>
    </div>
  );
}
