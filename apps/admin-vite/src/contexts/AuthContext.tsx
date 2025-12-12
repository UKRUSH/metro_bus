import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios, { AxiosInstance } from 'axios';
import { User, AuthTokens } from '@metro/shared';

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  axiosInstance: AxiosInstance;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = 'http://localhost:3000/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Create axios instance with interceptors
  const axiosInstance = axios.create({
    baseURL: API_URL,
  });

  // Request interceptor to add token
  axiosInstance.interceptors.request.use(
    (config) => {
      if (tokens?.accessToken) {
        config.headers.Authorization = `Bearer ${tokens.accessToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for token refresh
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry && tokens?.refreshToken) {
        originalRequest._retry = true;

        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken: tokens.refreshToken,
          });

          const newAccessToken = response.data.data.accessToken;
          const newTokens = { ...tokens, accessToken: newAccessToken };
          
          setTokens(newTokens);
          localStorage.setItem('admin_auth_tokens', JSON.stringify(newTokens));
          
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          clearAuth();
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  // Load tokens on mount
  useEffect(() => {
    const storedTokens = localStorage.getItem('admin_auth_tokens');
    if (storedTokens) {
      try {
        const parsedTokens = JSON.parse(storedTokens);
        setTokens(parsedTokens);
        fetchCurrentUser(parsedTokens.accessToken);
      } catch (error) {
        console.error('Failed to parse stored tokens:', error);
        localStorage.removeItem('admin_auth_tokens');
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchCurrentUser = async (accessToken: string) => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setUser(response.data.data.user);
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuth = () => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem('admin_auth_tokens');
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      const { user: userData, tokens: userTokens } = response.data.data;

      // Check if user has admin or finance role
      if (userData.role !== 'admin' && userData.role !== 'finance') {
        throw new Error('Access denied. Admin or Finance role required.');
      }

      setUser(userData);
      setTokens(userTokens);
      localStorage.setItem('admin_auth_tokens', JSON.stringify(userTokens));
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (tokens?.accessToken && tokens?.refreshToken) {
        await axiosInstance.post('/auth/logout', {
          refreshToken: tokens.refreshToken,
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
    logout,
    axiosInstance,
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
