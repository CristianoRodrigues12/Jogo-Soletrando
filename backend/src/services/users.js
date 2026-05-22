import bcrypt from 'bcryptjs';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const USERS_FILE = join(__dirname, '../data/users.json');

export function loadUsers() {
  return JSON.parse(readFileSync(USERS_FILE, 'utf-8'));
}

export function saveUsers(users) {
  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

export function findUser(username) {
  const users = loadUsers();
  return users.find(
    (u) => u.username.toLowerCase() === String(username).toLowerCase()
  );
}

export async function createUser(username, password) {
  const trimmed = String(username).trim();

  if (trimmed.length < 3) {
    throw new Error('Usuário deve ter pelo menos 3 caracteres.');
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(trimmed)) {
    throw new Error('Usuário só pode conter letras, números, ponto, hífen e underscore.');
  }

  if (String(password).length < 6) {
    throw new Error('Senha deve ter pelo menos 6 caracteres.');
  }

  const users = loadUsers();

  if (users.some((u) => u.username.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error('Este usuário já existe. Escolha outro nome.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  users.push({ username: trimmed, passwordHash });
  saveUsers(users);

  return { username: trimmed };
}

export async function validateCredentials(username, password) {
  const user = findUser(username);
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  return valid ? user : null;
}
