import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setToken } from './api';

const API = __DEV__ ? 'http://192.168.1.8:8000/api' : 'https://your-production-url.com/api';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setTokenState] = useState(null);

  useEffect(() => {
    AsyncStorage.multiGet(['token', 'user']).then(([[, t], [, u]]) => {
      if (t && u) { setTokenState(t); setToken(t); setUser(JSON.parse(u)); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const saveAuth = async (data, tok) => {
    setTokenState(tok);
    setToken(tok);
    setUser(data);
    await AsyncStorage.setItem('token', tok);
    await AsyncStorage.setItem('user', JSON.stringify(data));
  };

  const loginWithEmail = async (email, password) => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    await saveAuth(data, data.token);
  };

  const register = async (name, email, password) => {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    await saveAuth(data, data.token);
  };

  const loginWithGoogle = async (credential) => {
    const res = await fetch(`${API}/auth`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${credential}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Google login failed');
    await saveAuth(data, credential);
  };

  const logout = async () => {
    setUser(null); setTokenState(null);
    await AsyncStorage.multiRemove(['token', 'user']);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, loginWithEmail, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
