import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import api from '../services/api';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'receptionist' | 'employee';
  employeeRef?: string;
  isActive: boolean;
  lastLoginAt?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('vpms-token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('vpms-token');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api
        .get<{ data: AuthUser }>('/auth/me')
        .then((res) => setUser(res.data.data))
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token, logout]);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const res = await api.post<{ data: { token: string; user: AuthUser } }>('/auth/login', {
      email,
      password,
    });
    const { token: newToken, user: userData } = res.data.data;
    localStorage.setItem('vpms-token', newToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
