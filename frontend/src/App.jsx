import { useState } from 'react';
import { getAuth, clearAuth } from './authStorage';
import Login from './Login';
import PresenterView from './PresenterView';
import PlayerView from './PlayerView';

export default function App() {
  const [auth, setAuth] = useState(() => getAuth());
  const [loginKey, setLoginKey] = useState(0);

  const handleLogout = () => {
    clearAuth();
    setAuth(null);
    setLoginKey((k) => k + 1);
  };

  if (!auth) {
    return <Login key={loginKey} onLogin={setAuth} />;
  }

  if (auth.role === 'player') {
    return <PlayerView auth={auth} onLogout={handleLogout} />;
  }

  return <PresenterView onLogout={handleLogout} />;
}
