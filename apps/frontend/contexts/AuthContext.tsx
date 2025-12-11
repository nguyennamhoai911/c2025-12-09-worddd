'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
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

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
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
      const response = await axios.get('http://localhost:5000/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Login
  const login = async (email: string, password: string) => {
    const response = await axios.post('http://localhost:5000/auth/login', {
      email,
      password,
    });

    const { token: newToken, user: newUser } = response.data;
    
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  // Register
  const register = async (email: string, password: string, name?: string) => {
    const response = await axios.post('http://localhost:5000/auth/register', {
      email,
      password,
      name,
    });

    const { token: newToken, user: newUser } = response.data;
    
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
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