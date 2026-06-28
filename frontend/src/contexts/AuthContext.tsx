'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../services/auth.service';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<{ user: User | null; loading: boolean }>({
    user: null,
    loading: true,
  });

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await authService.getMe();
          setAuthState({ user: userData, loading: false });
          return;
        } catch (error) {
          localStorage.removeItem('token');
        }
      }
      setAuthState({ user: null, loading: false });
    };
    initAuth();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    setAuthState({ user: userData, loading: false });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAuthState({ user: null, loading: false });
    toast.success('Logged out successfully');
  };

  const updateUser = (userData: Partial<User>) => {
    if (authState.user) {
      setAuthState({ ...authState, user: { ...authState.user, ...userData } });
    }
  };

  return (
    <AuthContext.Provider value={{ user: authState.user, loading: authState.loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
