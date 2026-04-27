import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, LoginRequest, LoginResponse, RegisterRequest } from '../services/authService';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: LoginResponse | null;
  login: (credentials: LoginRequest) => Promise<void>;
  signup: (data: RegisterRequest) => Promise<void>;
  updateAuthUser: (newData: Partial<LoginResponse>) => void;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<LoginResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.error('Failed to load auth state', e);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(credentials);
      await AsyncStorage.setItem('user', JSON.stringify(response));
      await AsyncStorage.setItem('token', response.token);
      setUser(response);
      setIsAuthenticated(true);
    } catch (e: any) {
      setError(e.message || 'Login failed');
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: RegisterRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.registerCustomer(data);
      await AsyncStorage.setItem('user', JSON.stringify(response));
      await AsyncStorage.setItem('token', response.token);
      setUser(response);
      setIsAuthenticated(true);
    } catch (e: any) {
      setError(e.message || 'Signup failed');
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const updateAuthUser = (newData: Partial<LoginResponse>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...newData };
      AsyncStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    } catch (e) {
      console.error('Logout failed', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, signup, updateAuthUser, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
