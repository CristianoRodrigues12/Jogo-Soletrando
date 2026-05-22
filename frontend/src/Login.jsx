import { useState } from 'react';
import { login, register } from './api';
import { saveAuth } from './authStorage';
import './Login.css';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('presenter');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  /** Evita autofill do navegador ao abrir a tela; libera ao focar o campo */
  const [allowAutofill, setAllowAutofill] = useState(false);

  const enableAutofill = () => setAllowAutofill(true);

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setSuccess('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setAllowAutofill(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const data = await login(username, password, role);
      saveAuth(data);
      onLogin(data);
    } catch (err) {
      setError(err.message || 'Falha no login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const data = await register(username, password, confirmPassword);
      setSuccess(data.message || 'Conta criada! Faça login.');
      setPassword('');
      setConfirmPassword('');
      setMode('login');
    } catch (err) {
      setError(err.message || 'Falha ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Jogo Soletrando</h1>
        <p className="login-subtitle">
          {mode === 'login' ? 'Entre para começar' : 'Crie sua conta'}
        </p>

        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}
          >
            Entrar
          </button>
          <button
            type="button"
            className={`login-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => switchMode('register')}
          >
            Criar conta
          </button>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="login-form">
            <label className="field-label" htmlFor="username">
              Usuário
            </label>
            <input
              id="username"
              name="username"
              type="text"
              className="text-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={enableAutofill}
              readOnly={!allowAutofill}
              placeholder="seu_usuario"
              autoComplete="username"
              required
            />

            <label className="field-label" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="text-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={enableAutofill}
              readOnly={!allowAutofill}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />

            <fieldset className="role-fieldset">
              <legend className="field-label">Entrar como</legend>
              <label className="role-option">
                <input
                  type="radio"
                  name="role"
                  value="presenter"
                  checked={role === 'presenter'}
                  onChange={() => setRole('presenter')}
                />
                <span>
                  <strong>Apresentador</strong>
                  <small>Vê a palavra e controla o jogo</small>
                </span>
              </label>
              <label className="role-option">
                <input
                  type="radio"
                  name="role"
                  value="player"
                  checked={role === 'player'}
                  onChange={() => setRole('player')}
                />
                <span>
                  <strong>Jogador</strong>
                  <small>Soletre usando o teclado virtual</small>
                </span>
              </label>
            </fieldset>

            {error && <p className="login-error">{error}</p>}
            {success && <p className="login-success">{success}</p>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="login-form">
            <label className="field-label" htmlFor="reg-username">
              Novo usuário
            </label>
            <input
              id="reg-username"
              type="text"
              className="text-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="mínimo 3 caracteres"
              autoComplete="username"
              required
              minLength={3}
            />

            <label className="field-label" htmlFor="reg-password">
              Senha
            </label>
            <input
              id="reg-password"
              type="password"
              className="text-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="mínimo 6 caracteres"
              autoComplete="new-password"
              required
              minLength={6}
            />

            <label className="field-label" htmlFor="reg-confirm">
              Confirmar senha
            </label>
            <input
              id="reg-confirm"
              type="password"
              className="text-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="repita a senha"
              autoComplete="new-password"
              required
              minLength={6}
            />

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Criando…' : 'Criar conta'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
