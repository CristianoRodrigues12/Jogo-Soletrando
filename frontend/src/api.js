import { getAuth, clearAuth } from './authStorage';

const API = '/api';

const LEVEL_LABELS = {
  easy: 'Fácil',
  medium: 'Médio',
  hard: 'Difícil',
};

export function getLevelLabel(level) {
  return LEVEL_LABELS[level] || level;
}

function authHeaders() {
  const auth = getAuth();
  return auth?.token
    ? { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    clearAuth();
    window.location.reload();
    throw new Error('Login expirado. Entre novamente.');
  }
  if (!res.ok) throw new Error(data.error || 'Erro na requisição');
  return data;
}

export async function register(username, password, confirmPassword) {
  const res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, confirmPassword }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro ao criar conta');
  return data;
}

export async function login(username, password, role) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, role }),
  });
  return handleResponse(res);
}

export async function getRandomWord() {
  const res = await fetch(`${API}/words/random?level=random`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function fetchWordDetails(word) {
  const res = await fetch(`${API}/words/${encodeURIComponent(word)}/details`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function getPlayerWord() {
  const res = await fetch(`${API}/player/random`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function getPlayerHint(token, type) {
  const res = await fetch(`${API}/player/session/${token}/hint/${type}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function validatePlayerSpelling(token, attempt) {
  const res = await fetch(`${API}/player/validate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ token, attempt }),
  });
  return handleResponse(res);
}
