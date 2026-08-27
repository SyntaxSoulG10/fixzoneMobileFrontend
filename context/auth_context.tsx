import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, LoginRequest, LoginResponse, RegisterRequest } from '../services/authService';
import { setUnauthorizedListener, clearCache } from '../services/api';
import { notificationService, registerForPushNotificationsAsync } from '../services/notificationService';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: LoginResponse | null;
  login: (credentials: LoginRequest) => Promise<void>;
  signup: (data: RegisterRequest) => Promise<void>;
  updateAuthUser: (newData: Partial<LoginResponse>) => void;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<LoginResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSessionExpired = async () => {
    await clearCache();
    await AsyncStorage.multiRemove(['token', 'user', 'userRole']);
    setUser(null);
    setIsAuthenticated(false);
    setError('Session expired. Please log in again.');

    Alert.alert(
      'Session Expired',
      'Your account session is no longer valid or user record was not found. Please log in again.',
      [
        {
          text: 'Log Out',
          onPress: async () => {
            await clearCache();
            await AsyncStorage.multiRemove(['token', 'user', 'userRole']);
            setUser(null);
            setIsAuthenticated(false);
          },
        },
      ],
      { cancelable: false }
    );
  };

  const refreshProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const remoteProfile = await authService.getProfile();
      if (remoteProfile) {
        const full = `${remoteProfile.firstName || ''} ${remoteProfile.secondName || ''}`.trim();
        updateAuthUser({
          fullName: full || remoteProfile.email,
          phone: remoteProfile.phoneNumber,
          profilePictureUrl: remoteProfile.profilePictureUrl,
        });
      }
    } catch (e) {
      console.log('Background profile sync skipped:', e);
    }
  };

  const syncPushToken = async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        await notificationService.savePushToken(token);
        console.log('Push notification token synced with backend:', token);
      }
    } catch (e) {
      console.log('Push token sync skipped:', e);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      syncPushToken();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    setUnauthorizedListener(() => {
      handleSessionExpired();
    });

    const checkAuth = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
          // Sync fresh profile from database in background
          refreshProfile();
        }
      } catch (e) {
        console.error('Failed to load auth state', e);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    return () => {
      setUnauthorizedListener(null);
    };
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
      await clearCache();
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    } catch (e) {
      console.error('Logout failed', e);
    } finally {
      setIsLoading(false);
    }
  };
  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, signup, updateAuthUser, refreshProfile, logout, error, clearError }}>
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
