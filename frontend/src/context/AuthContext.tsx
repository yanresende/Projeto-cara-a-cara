import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { getToken, getUser, saveToken, saveUser, clearAuth } from '../utils/localStorage';
import { socketService } from '../services/socketService';
import { API_URL } from '../utils/constants';
import type { UserProfile, AuthPayload } from '../types/index';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  login: (payload: AuthPayload) => Promise<void>;
  signup: (payload: AuthPayload) => Promise<void>;
  logout: () => void;
  setError: (error: string | null) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    const currentToken = getToken();
    if (!currentToken) return;
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (res.ok) {
        const profile: UserProfile = await res.json();
        setUser(profile);
        saveUser(profile);
      }
    } catch {
      // silently ignore refresh errors
    }
  }, []);

  // Initialize from localStorage then refresh from server
  useEffect(() => {
    const storedToken = getToken();
    const storedUser = getUser();
    if (storedToken) {
      setToken(storedToken);
      if (storedUser) {
        setUser(storedUser);
      }
      if (!socketService.isConnected()) {
        socketService.connect(storedToken).catch(console.error);
      }
      // Always fetch fresh stats from server on load
      refreshUser().finally(() => setIsInitializing(false));
    } else {
      setIsInitializing(false);
    }
  }, [refreshUser]);

  const login = async (payload: AuthPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(payload);
      setToken(response.token);
      setUser(response.user);
      saveToken(response.token);
      saveUser(response.user);
      socketService.connect(response.token).catch(console.error);
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
      socketService.connect(response.token).catch(console.error);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    socketService.disconnect();
    setUser(null);
    setToken(null);
    clearAuth();
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isInitializing, error, login, signup, logout, setError, refreshUser }}>
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
