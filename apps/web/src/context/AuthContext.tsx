'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserDTO, UserRole } from '@eduguard/shared';
import { authApi } from '@/lib/apiClient';

interface AuthContextType {
  user: UserDTO | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    // Rehydrate auth from localStorage
    const savedToken = localStorage.getItem('eduguard_token');
    const savedUser = localStorage.getItem('eduguard_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        // Verify with /auth/me in background
        authApi.getMe().then((res) => {
          if (res.data) {
            setUser(res.data);
            localStorage.setItem('eduguard_user', JSON.stringify(res.data));
          }
        }).catch(() => {
          // Token expired or invalid
          localStorage.removeItem('eduguard_token');
          localStorage.removeItem('eduguard_user');
          setToken(null);
          setUser(null);
        });
      } catch (e) {
        localStorage.removeItem('eduguard_token');
        localStorage.removeItem('eduguard_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(email, password);
      if (res.data) {
        const { token: authToken, user: authUser } = res.data;
        setToken(authToken);
        setUser(authUser);
        localStorage.setItem('eduguard_token', authToken);
        localStorage.setItem('eduguard_user', JSON.stringify(authUser));
        router.push('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // Continue client cleanup
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('eduguard_token');
      localStorage.removeItem('eduguard_user');
      router.push('/login');
    }
  };

  const isAdmin = user?.role === 'ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  const isStudent = user?.role === 'STUDENT';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        isAdmin,
        isTeacher,
        isStudent,
      }}
    >
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
