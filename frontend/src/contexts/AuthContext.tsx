import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import type { Agente } from '../types';

interface AuthState {
  agente: Agente | null;
  token: string | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    agente: null,
    token: localStorage.getItem('token'),
    loading: true,
  });

  useEffect(() => {
    if (state.token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
      api.get('/auth/me')
        .then(r => setState(prev => ({ ...prev, agente: r.data, loading: false })))
        .catch(() => {
          localStorage.removeItem('token');
          setState({ agente: null, token: null, loading: false });
        });
    } else {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setState({ agente: data.agente, token: data.token, loading: false });
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setState({ agente: null, token: null, loading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
