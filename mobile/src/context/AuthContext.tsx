import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { UserProfile, UserRole } from '../types';
import { api, setAuthToken } from '../services/api';
import { initSQLiteDatabase } from '../database/sqlite';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isOnline: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; role: string; dietary_pref: string }) => Promise<void>;
  logout: () => Promise<void>;
  quickLogin: (role: UserRole) => Promise<void>;
  refreshUser: () => Promise<void>;
  syncWithCloud: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    // 1. Initialize local SQLite Database on app boot
    initSQLiteDatabase();
    // 2. Restore saved session
    bootstrapAuth();
  }, []);

  const bootstrapAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('messmate_token');
      const storedUser = await SecureStore.getItemAsync('messmate_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        // Verify with backend if online
        try {
          const freshUser = await api.getMe();
          setUser(freshUser);
          await SecureStore.setItemAsync('messmate_user', JSON.stringify(freshUser));
          setIsOnline(true);
          // Sync with cloud on fresh app start
          await api.syncBootstrap();
        } catch (e) {
          console.log('Running in offline cached mode with stored session');
          setIsOnline(false);
        }
      }
    } catch (e) {
      console.warn('Failed to restore auth session:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, password);
      setUser(res.user);
      setToken(res.access_token);
      await SecureStore.setItemAsync('messmate_user', JSON.stringify(res.user));
      setIsOnline(true);
      // Run bootstrap sync
      await api.syncBootstrap();
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { name: string; email: string; password: string; role: string; dietary_pref: string }) => {
    setIsLoading(true);
    try {
      const res = await api.register(data);
      setUser(res.user);
      setToken(res.access_token);
      await SecureStore.setItemAsync('messmate_user', JSON.stringify(res.user));
      setIsOnline(true);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await setAuthToken(null);
      await SecureStore.deleteItemAsync('messmate_user');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick switch for smooth demonstration of 3 roles:
  const quickLogin = async (role: UserRole) => {
    if (role === 'student') {
      await login('aman@knit.ac.in', 'student123');
    } else if (role === 'mess_manager') {
      await login('manager@messmate.knit.ac.in', 'manager123');
    } else if (role === 'college_admin') {
      await login('admin@messmate.knit.ac.in', 'admin123');
    }
  };

  const refreshUser = async () => {
    try {
      const freshUser = await api.getMe();
      setUser(freshUser);
      await SecureStore.setItemAsync('messmate_user', JSON.stringify(freshUser));
      setIsOnline(true);
    } catch (e) {
      setIsOnline(false);
    }
  };

  const syncWithCloud = async () => {
    return api.syncBootstrap();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isOnline,
        login,
        register,
        logout,
        quickLogin,
        refreshUser,
        syncWithCloud,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

