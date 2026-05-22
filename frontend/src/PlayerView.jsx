import { useState, useEffect } from 'react';
import {
  getPlayerWord,
  getPlayerHint,
  validatePlayerSpelling,
  getLevelLabel,
} from './api';
import { speakText, stopSpeaking, isSpeechSupported } from './speech';
import { hyphenatedWord, hyphenatedAttempt } from './utils/word';
import './App.css';

const LETTER_KEYS = [
  'A', 'B', 'C', 'Ç', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  'Ã', 'Õ', 'Á', 'É', 'Í', 'Ó', 'Ú',
];

export default function PlayerView({ auth, onLogout }) {
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [wordToken, setWordToken] = useState(null);
  const [wordLength, setWordLength] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(null);
  const [letters, setLetters] = useState([]);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!feedback || result) return;
    const timer = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [feedback, result]);

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  const speakHint = async (type, label) => {
    if (!wordToken || isSpeaking) return;
    if (!isSpeechSupported()) {
      setFeedback({
        type: 'error',
        message: 'Seu navegador não suporta áudio. Use Chrome ou Edge.',
      });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const { text } = await getPlayerHint(wordToken, type);
      speakText(text, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: (msg) => {
          setIsSpeaking(false);
          setFeedback({ type: 'error', message: msg || `Erro ao ouvir ${label}.` });
        },
      });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const startRound = async () => {
    if (!playerName.trim()) {
      setFeedback({ type: 'error', message: 'Informe seu nome.' });
      return;
    }

    setLoading(true);
    setResult(null);
    setLetters([]);
    stopSpeaking();

    try {
      const data = await getPlayerWord();
      setWordToken(data.token);
      setWordLength(data.length);
      setCurrentLevel(data.level);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const addLetter = (letter) => {
    if (result) return;
    setLetters((prev) => {
      if (prev.length >= wordLength) return prev;
      return [...prev, letter];
    });
  };

  const handleValidate = async () => {
    if (!wordToken) return;

    const attempt = letters.join('');
    if (!attempt) {
      setFeedback({ type: 'error', message: 'Soletrar pelo menos uma letra antes de verificar.' });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      const data = await validatePlayerSpelling(wordToken, attempt);
      setResult(data);
      setWordToken(null);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const endRound = () => {
    stopSpeaking();
    setWordToken(null);
    setWordLength(0);
    setLetters([]);
    setResult(null);
  };

  const slots = Array.from({ length: wordLength }, (_, i) => letters[i] || '');
  const isLocked = !!result;
  const showSpelling = (wordToken || (result && !result.correct)) && !result?.correct;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-row">
          <div>
            <h1>Jogo Soletrando</h1>
            <p>Modo jogador — {auth.username}</p>
          </div>
          <button type="button" className="btn-logout" onClick={onLogout}>
            Sair
          </button>
        </div>
      </header>

      <section className="card player-section">
        <h2 className="card-title">Seu nome</h2>
        <input
          type="text"
          className="text-input"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Ex.: Maria"
          disabled={!!wordToken}
        />
      </section>

      {!wordToken && !result && (
        <button
          type="button"
          className="btn-primary"
          disabled={loading}
          onClick={startRound}
        >
          {loading ? 'Carregando…' : 'Receber palavra'}
        </button>
      )}

      {showSpelling && (
        <div className="screen game-screen">
          <div className="game-meta">
            <span className={`level-badge ${currentLevel}`}>
              {getLevelLabel(currentLevel)}
            </span>
            <button type="button" className="btn-end-game" onClick={endRound}>
              Cancelar
            </button>
          </div>

          <section className="card word-panel presenter-panel player-hidden">
            <p className="word-hint">
              Soletrando: <strong>{playerName.trim()}</strong>
            </p>
            <p className="word-hidden-label">A palavra está oculta</p>
            <p className="word-length-info">{wordLength} letras</p>

            <div className="player-audio-buttons">
              <button
                type="button"
                className="btn-hint"
                disabled={loading || isSpeaking}
                onClick={() => speakHint('word', 'palavra')}
              >
                🔊 Ouvir palavra
              </button>
              <button
                type="button"
                className="btn-hint"
                disabled={loading || isSpeaking}
                onClick={() => speakHint('definition', 'definição')}
              >
                🔊 Ouvir definição
              </button>
              <button
                type="button"
                className="btn-hint"
                disabled={loading || isSpeaking}
                onClick={() => speakHint('example', 'frase')}
              >
                🔊 Ouvir frase
              </button>
              <button
                type="button"
                className="btn-hint"
                disabled={loading || isSpeaking}
                onClick={() => speakHint('etymology', 'origem')}
              >
                🔊 Ouvir origem
              </button>
            </div>
          </section>

          <section className="card">
            <h2 className="card-title">Sua soletração</h2>
            <div className={`spell-slots ${isLocked && !result.correct ? 'slots-wrong' : ''}`}>
              {slots.map((letter, i) => (
                <span
                  key={i}
                  className={`spell-slot ${letter ? 'filled' : ''} ${
                    isLocked && !result.correct ? 'slot-wrong' : ''
                  }`}
                >
                  {letter}
                </span>
              ))}
            </div>

            {result && !result.correct && (
              <div className="spell-compare">
                <p className="spell-compare-label">Sua soletração:</p>
                <p className="spell-compare-wrong">
                  {hyphenatedAttempt(result.attempt || letters.join(''))}
                </p>
                <p className="spell-compare-label">Soletração correta:</p>
                <p className="spell-compare-correct">
                  {hyphenatedWord(result.word)}
                </p>
              </div>
            )}

            {!isLocked && (
              <>
                <div className="letter-keyboard">
                  <p className="field-label">Toque na letra</p>
                  <div className="letter-keys">
                    {LETTER_KEYS.map((key) => (
                      <button
                        key={key}
                        type="button"
                        className="letter-key"
                        disabled={loading || letters.length >= wordLength}
                        onClick={() => addLetter(key.toLowerCase())}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="btn-secondary btn-delete-letter"
                    onClick={() => setLetters((prev) => prev.slice(0, -1))}
                    disabled={letters.length === 0 || loading}
                  >
                    Apagar última letra
                  </button>
                </div>

                <button
                  type="button"
                  className="btn-primary"
                  style={{ marginTop: '1rem' }}
                  disabled={loading || letters.length === 0}
                  onClick={handleValidate}
                >
                  Verificar soletração
                </button>
              </>
            )}

            {isLocked && !result.correct && (
              <button
                type="button"
                className="btn-primary btn-next-word"
                style={{ marginTop: '1rem' }}
                onClick={startRound}
              >
                Receber outra palavra
              </button>
            )}
          </section>
        </div>
      )}

      {result?.correct && (
        <section className="result-banner success">
          <h2>Correto!</h2>
          <p className="result-word-spelled">
            Você soletrou corretamente a palavra:{' '}
            <strong>{hyphenatedWord(result.word)}</strong>
          </p>
          <button
            type="button"
            className="btn-primary"
            style={{ marginTop: '1rem' }}
            onClick={() => {
              setResult(null);
              startRound();
            }}
          >
            Próxima palavra
          </button>
        </section>
      )}

      {feedback && (
        <p className={`toast toast-${feedback.type}`} role="status">
          {feedback.message}
        </p>
      )}
    </div>
  );
}
