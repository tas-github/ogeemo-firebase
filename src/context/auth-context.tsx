'use client';

import type { User } from 'firebase/auth';
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  accessToken: string | null;
  setAuthInfo: (user: User | null, token: string | null) => void;
  photoURL: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  const setAuthInfo = (user: User | null, token: string | null) => {
    setUser(user);
    setAccessToken(token);
    if (user) {
      setPhotoURL(user.photoURL);
    } else {
      setPhotoURL(null);
    }
  };

  // Effect for Firebase auth state (user object)
  useEffect(() => {
    if (!auth) {
        setIsLoading(false);
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setPhotoURL(currentUser?.photoURL || null);
      // Clear access token on logout
      if (!currentUser) {
        setAccessToken(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Effect for capturing the access token from sessionStorage after redirect
  useEffect(() => {
    if (user && !accessToken) {
      const storedToken = sessionStorage.getItem('google_access_token');
      if (storedToken) {
        setAccessToken(storedToken);
        sessionStorage.removeItem('google_access_token');
      }
    }
  }, [user, accessToken, pathname]); // Re-run on navigation

  const value = { user, isLoading, accessToken, setAuthInfo, photoURL };

  return (
    <AuthContext.Provider value={value}>
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
