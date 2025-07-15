
'use client';

import type { User } from 'firebase/auth';
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { initializeFirebase, FirebaseServices } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  accessToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicPaths = ['/login', '/register', '/auth/callback'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseServices, setFirebaseServices] = useState<FirebaseServices | null>(null);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    initializeFirebase()
      .then(setFirebaseServices)
      .catch(err => {
        console.error("Firebase initialization failed:", err);
        setInitializationError(err.message);
      });
  }, []);

  useEffect(() => {
    if (!firebaseServices) return;

    const unsubscribe = onAuthStateChanged(firebaseServices.auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setAccessToken(null);
        sessionStorage.removeItem('google_access_token');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [firebaseServices]);
  
  // Effect for handling Google Access Token from session storage
  useEffect(() => {
    if (user && !accessToken) {
      const storedToken = sessionStorage.getItem('google_access_token');
      if (storedToken) {
        setAccessToken(storedToken);
      }
    }
  }, [user, accessToken]);

  // Effect for handling redirects based on auth state
  useEffect(() => {
    if (!isLoading) {
      const isPublicPath = publicPaths.includes(pathname);
      if (!user && !isPublicPath) {
        router.push('/login');
      } else if (user && isPublicPath) {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, pathname, router]);


  if (initializationError) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-red-100 text-red-800">
        <h1 className="mb-4 text-2xl font-bold">Firebase Initialization Error</h1>
        <p className="mb-2 text-center">{initializationError}</p>
        <p>Please check your Firebase configuration in <code className="rounded bg-red-200 px-2 py-1">.env.local</code> and ensure all required environment variables are set correctly.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const value = { user, isLoading, accessToken };

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
