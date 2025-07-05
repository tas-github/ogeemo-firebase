
'use client';

import type { User, IdTokenResult } from 'firebase/auth';
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, GoogleAuthProvider } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  accessToken: string | null;
  photoURL: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  // Effect for Firebase auth state (user object)
  useEffect(() => {
    if (!auth) {
        setIsLoading(false);
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setPhotoURL(currentUser?.photoURL || null);
      
      // After a redirect login, the session might still hold the credential.
      // We try to get it here to ensure the access token is available.
      if (currentUser) {
        try {
          // This token is short-lived, for real apps, you'd manage refresh tokens
          const tokenResult = await currentUser.getIdTokenResult(true);
          const providerData = currentUser.providerData.find(pd => pd.providerId === GoogleAuthProvider.PROVIDER_ID);
          
          if(providerData) {
              const storedToken = sessionStorage.getItem(`firebase:session::${currentUser.uid}:${providerData.providerId}`);
              if (storedToken) {
                // This is a bit of a workaround to get the access token post-redirect
                // as Firebase doesn't expose it directly in a simple way after the initial redirect result.
                // In a production app, you might handle this via server-side auth or more robust token management.
              }
          }

        } catch (error) {
          console.error("Error getting id token on auth state change:", error);
          setAccessToken(null);
        }
      } else {
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
        // Clean up the token from session storage once we have it in context
        sessionStorage.removeItem('google_access_token');
      }
    }
  }, [user, accessToken, pathname]); // Re-run on navigation to catch it

  const value = { user, isLoading, accessToken, photoURL };

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
