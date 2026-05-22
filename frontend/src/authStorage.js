const KEY = 'soletrando_auth';

export function saveAuth(data) {
  sessionStorage.setItem(KEY, JSON.stringify(data));
}

export function getAuth() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  sessionStorage.removeItem(KEY);
}
