// apps/frontend/contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api'; // Import api

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  googleApiKey?: string;
  googleCx?: string;
  azureSpeechKey?: string;
  azureSpeechRegion?: string;
  azureTranslatorKey?: string;
  azureTranslatorRegion?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token from localStorage or cookie on mount
  useEffect(() => {
    let savedToken = localStorage.getItem('token');

    // Nếu không có trong localStorage, thử lấy từ cookie
    if (!savedToken) {
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(c => c.trim().startsWith('token='));
      if (tokenCookie) {
        savedToken = tokenCookie.split('=')[1];
        // Lưu lại vào localStorage để sync
        localStorage.setItem('token', savedToken);
      }
    }

    if (savedToken) {
      setToken(savedToken);
      fetchUser(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Fetch user info
  const fetchUser = async (authToken: string) => {
    try {
      const response = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('token');
      // Xóa cookie cũ
      document.cookie = 'token=; path=/; max-age=0; SameSite=None; Secure';
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Login
  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    const { token: newToken, user: newUser } = response.data;

    localStorage.setItem('token', newToken);

    // 👇 QUAN TRỌNG: Thêm SameSite=None; Secure để Extension dùng được Cookie này
    document.cookie = `token=${newToken}; path=/; max-age=604800; SameSite=None; Secure`;

    setToken(newToken);
    setUser(newUser);
  };

  // Register
  const register = async (email: string, password: string, name?: string) => {
    const response = await api.post('/auth/register', {
      email,
      password,
      name,
    });
    const { token: newToken, user: newUser } = response.data;

    localStorage.setItem('token', newToken);

    // 👇 QUAN TRỌNG: Thêm SameSite=None; Secure
    document.cookie = `token=${newToken}; path=/; max-age=604800; SameSite=None; Secure`;

    setToken(newToken);
    setUser(newUser);
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    // Xóa cookie
    document.cookie = 'token=; path=/; max-age=0; SameSite=None; Secure';
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
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