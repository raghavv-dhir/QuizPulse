import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse } from '../types/quiz';
import { api, getAuthToken, setAuthToken, getCurrentUserStored, setCurrentUserStored } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (credentials: { usernameOrEmail: string; password: string }) => Promise<void>;
  register: (details: { username: string; email: string; password: string; fullName: string; role?: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getCurrentUserStored());
  const [token, setTokenState] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function verifyUser() {
      if (token) {
        try {
          const freshUser = await api.auth.me();
          setUser(freshUser);
          setCurrentUserStored(freshUser);
        } catch (e) {
          console.error('Failed to verify token', e);
          setAuthToken(null);
          setCurrentUserStored(null);
          setUser(null);
          setTokenState(null);
        }
      }
      setIsLoading(false);
    }
    verifyUser();
  }, [token]);

  const login = async (credentials: { usernameOrEmail: string; password: string }) => {
    const res: AuthResponse = await api.auth.login(credentials);
    setAuthToken(res.token);
    setTokenState(res.token);
    const u: User = {
      id: res.id,
      username: res.username,
      email: res.email,
      fullName: res.fullName,
      role: res.role,
    };
    setUser(u);
    setCurrentUserStored(u);
  };

  const register = async (details: { username: string; email: string; password: string; fullName: string; role?: string }) => {
    const res: AuthResponse = await api.auth.register(details);
    setAuthToken(res.token);
    setTokenState(res.token);
    const u: User = {
      id: res.id,
      username: res.username,
      email: res.email,
      fullName: res.fullName,
      role: res.role,
    };
    setUser(u);
    setCurrentUserStored(u);
  };

  const logout = () => {
    setAuthToken(null);
    setCurrentUserStored(null);
    setUser(null);
    setTokenState(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAdmin: user?.role === 'ROLE_ADMIN',
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
