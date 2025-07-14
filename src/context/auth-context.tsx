
'use client';

import type { User } from 'firebase/auth';
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { initializeFirebase } from '@/lib/firebase';
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
  const pathname = usePathname();
  const router = useRouter();

  // Effect for handling Firebase Authentication state
  useEffect(() => {
    const initAuthListener = async () => {
      try {
        const { auth } = await initializeFirebase();
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
          
          if (!currentUser) {
            setAccessToken(null);
            sessionStorage.removeItem('google_access_token');
          }
          setIsLoading(false);
        });
        return unsubscribe;
      } catch (error) {
        console.error("Auth context initialization error:", error);
        setIsLoading(false);
        return () => {};
      }
    };
    
    const unsubscribePromise = initAuthListener();

    return () => {
      unsubscribePromise.then(unsubscribe => {
        if (unsubscribe) {
          unsubscribe();
        }
      });
    };
  }, []);

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


  // Render a loading screen while auth state is being determined
  // to prevent flicker or premature rendering of protected content.
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        {/* You can replace this with a more sophisticated loading spinner component */}
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
