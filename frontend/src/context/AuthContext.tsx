import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { getToken, saveToken, saveUser, clearAuth } from '../utils/localStorage';
import type { UserProfile, AuthPayload } from '../types/index';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (payload: AuthPayload) => Promise<void>;
  signup: (payload: AuthPayload) => Promise<void>;
  logout: () => void;
  setError: (error: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    const storedToken = getToken();
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const login = async (payload: AuthPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(payload);
      setToken(response.token);
      setUser(response.user);
      saveToken(response.token);
      saveUser(response.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (payload: AuthPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.signup(payload);
      setToken(response.token);
      setUser(response.user);
      saveToken(response.token);
      saveUser(response.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    clearAuth();
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, error, login, signup, logout, setError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
