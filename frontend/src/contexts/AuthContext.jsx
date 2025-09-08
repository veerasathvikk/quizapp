import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const s = localStorage.getItem('quizapp_user');
    return s ? JSON.parse(s) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('quizapp_token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem('quizapp_token', token);
    } else {
      localStorage.removeItem('quizapp_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('quizapp_user', JSON.stringify(user));
    else localStorage.removeItem('quizapp_user');
  }, [user]);

  const signOut = () => {
    setToken(null);
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
  };

  // refresh user from backend (optional)
  const fetchMe = async () => {
    try {
      setLoading(true);
      const resp = await api.get('/users/me'); // we'll implement /users/me later or skip
      setUser(resp.data);
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, token, setToken, signOut, fetchMe, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
