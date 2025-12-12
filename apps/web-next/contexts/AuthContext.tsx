'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthTokens, JWTPayload } from '@metro/shared';

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
}

interface RegisterData {
  email: string;
  password: string;
  phone: string;
  firstName: string;
  lastName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load tokens from localStorage on mount
  useEffect(() => {
    const storedTokens = localStorage.getItem('auth_tokens');
    if (storedTokens) {
      try {
        const parsedTokens = JSON.parse(storedTokens);
        setTokens(parsedTokens);
        fetchCurrentUser(parsedTokens.accessToken);
      } catch (error) {
        console.error('Failed to parse stored tokens:', error);
        localStorage.removeItem('auth_tokens');
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  // Fetch current user
  const fetchCurrentUser = async (accessToken: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.data.user);
      } else {
        // Token might be expired, try refreshing
        const newAccessToken = await refreshAccessToken();
        if (newAccessToken) {
          fetchCurrentUser(newAccessToken);
        } else {
          // Refresh failed, clear auth
          clearAuth();
        }
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh access token
  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    if (!tokens?.refreshToken) return null;

    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        const newAccessToken = data.data.accessToken;
        const newTokens = { ...tokens, accessToken: newAccessToken };
        setTokens(newTokens);
        localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
        return newAccessToken;
      } else {
        clearAuth();
        return null;
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      clearAuth();
      return null;
    }
  }, [tokens]);

  // Clear authentication
  const clearAuth = () => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem('auth_tokens');
  };

  // Login
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      const { user: userData, tokens: userTokens } = data.data;
      setUser(userData);
      setTokens(userTokens);
      localStorage.setItem('auth_tokens', JSON.stringify(userTokens));
    } catch (error: any) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register
  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Registration failed');
      }

      const { user: userData, tokens: userTokens } = responseData.data;
      setUser(userData);
      setTokens(userTokens);
      localStorage.setItem('auth_tokens', JSON.stringify(userTokens));
    } catch (error: any) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      if (tokens?.accessToken && tokens?.refreshToken) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens.accessToken}`,
          },
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
    }
  };

  const value = {
    user,
    tokens,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
