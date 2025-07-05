
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

  // Effect for Firebase auth state (user object)
  useEffect(() => {
    const initAuthListener = async () => {
      try {
        // Await the full initialization before setting up the listener
        const { auth } = await initializeFirebase();
        
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
          setUser(currentUser);
          
          if (!currentUser) {
            // If user logs out, clear everything
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
    
    let unsubscribe: (() => void) | undefined;
    initAuthListener().then(unsub => {
      if (unsub) unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    }
  }, []);
  
   // Effect for capturing the access token from sessionStorage after redirect.
   // This runs when the component mounts or after navigation, ensuring the
   // token from the /auth/callback redirect is captured.
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
