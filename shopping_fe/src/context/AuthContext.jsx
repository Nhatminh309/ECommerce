import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

const readStoredUser = () => {
  const rawUser = localStorage.getItem('user');
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser);
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(readStoredUser);

  useEffect(() => {
    if (!token) return;

    let active = true;
    authService
      .getCurrentUser()
      .then((currentUser) => {
        if (!active) return;
        localStorage.setItem('user', JSON.stringify(currentUser));
        setUser(currentUser);
      })
      .catch(() => {
        if (!active) return;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const persistAuth = (authData) => {
    const nextUser = {
      username: authData.username,
      role: authData.role,
    };

    localStorage.setItem('token', authData.token);
    localStorage.setItem('user', JSON.stringify(nextUser));
    setToken(authData.token);
    setUser(nextUser);
    return authData;
  };

  const login = async (data) => {
    const authData = await authService.login(data);
    return persistAuth(authData);
  };

  const register = async (data) => {
    const authData = await authService.register(data);
    return persistAuth(authData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
    }),
    [user, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
