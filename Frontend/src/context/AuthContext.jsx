import { createContext, useContext, useMemo, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'alamal_auth_session';

// Identifiants fictifs — seront remplacés par la vérification côté backend.
const FAKE_CREDENTIALS = {
  email: 'admin@ecole.tn',
  password: 'admin123',
};

const FAKE_USER = {
  name: 'Administrateur',
  role: 'Directeur de l\u2019école',
  email: 'admin@ecole.tn',
  initials: 'AD',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = (email, password) => {
    return new Promise((resolve, reject) => {
      // Simule une latence réseau, comme un futur appel API réel.
      setTimeout(() => {
        if (email.trim().toLowerCase() === FAKE_CREDENTIALS.email && password === FAKE_CREDENTIALS.password) {
          setUser(FAKE_USER);
          resolve(FAKE_USER);
        } else {
          reject(new Error('Email ou mot de passe incorrect.'));
        }
      }, 900);
    });
  };

  const logout = () => setUser(null);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth doit être utilisé à l\u2019intérieur d\u2019un <AuthProvider>');
  }
  return ctx;
}
