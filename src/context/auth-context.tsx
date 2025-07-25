
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
  firebaseServices: FirebaseServices | null; // Expose services to consumers
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const publicPaths = ['/login', '/register', '/auth/callback'];
const marketingPaths = ['/home', '/for-small-businesses', '/for-accountants', '/news', '/about', '/contact', '/privacy', '/terms'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseServices, setFirebaseServices] = useState<FirebaseServices | null>(null);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // This effect handles the entire initialization and auth subscription flow.
    initializeFirebase()
      .then(services => {
        setFirebaseServices(services);
        const unsubscribe = onAuthStateChanged(services.auth, (currentUser) => {
          setUser(currentUser);
          if (!currentUser) {
            setAccessToken(null);
            sessionStorage.removeItem('google_access_token');
          }
          setIsLoading(false);
        });
        return unsubscribe; // Return the unsubscribe function for cleanup.
      })
      .catch(err => {
        console.error("Firebase initialization failed:", err);
        setInitializationError(err.message);
        setIsLoading(false); // Stop loading on error to show the error message.
      });
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
      const isMarketingPath = marketingPaths.some(p => pathname.startsWith(p)) || pathname === '/';
      
      // If user is not logged in and not on a public/marketing page, redirect to login.
      if (!user && !isPublicPath && !isMarketingPath) {
        router.push('/login');
      } 
      // If user is logged in and on a public login/register page, redirect to dashboard.
      else if (user && isPublicPath) {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, pathname, router]);


  if (initializationError) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-red-100 p-4 text-center text-red-800">
        <h1 className="mb-4 text-2xl font-bold">Firebase Initialization Error</h1>
        <p className="mb-2">{initializationError}</p>
        <p>Please check your Firebase configuration in your project's environment variables and ensure all required values are set correctly.</p>
      </div>
    );
  }

  // Show a loading indicator during the initial auth check.
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const value = { user, isLoading, accessToken, firebaseServices };

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
