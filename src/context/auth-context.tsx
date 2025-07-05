
'use client';

import type { User } from 'firebase/auth';
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initializeFirebase } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  accessToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

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
          setIsLoading(false); // Stop loading even if there's an error
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
    }
  }, []);
  
  useEffect(() => {
    if (user && !accessToken) {
      const storedToken = sessionStorage.getItem('google_access_token');
      if (storedToken) {
        setAccessToken(storedToken);
      }
    }
  }, [user, accessToken, pathname]);

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
