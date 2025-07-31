
'use client';

import type { User } from 'firebase/auth';
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { initializeFirebase, FirebaseServices } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  accessToken: string | null;
  firebaseServices: FirebaseServices | null;
  logout: () => Promise<void>;
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
    initializeFirebase()
      .then(services => {
        setFirebaseServices(services);
        const unsubscribe = onAuthStateChanged(services.auth, (currentUser) => {
          setUser(currentUser);
          if (!currentUser) {
            setAccessToken(null);
            sessionStorage.removeItem('google_access_token');
          }
          // The main loading state will be managed by the routing logic below
        });
        return unsubscribe;
      })
      .catch(err => {
        console.error("Firebase initialization failed:", err);
        setInitializationError(err.message);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    const handleAuthChange = async (user: User | null) => {
      console.log('Auth state changed. User:', user ? user.uid : null);
      if (user) {
        try {
          console.log('Getting ID token...');
          const idToken = await user.getIdToken();
          console.log('ID token received. Awaiting session API call...');
          
          // CRITICAL FIX: Await the session API call to complete before doing anything else.
          const response = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Session creation failed');
          }

          const responseData = await response.json();
          console.log('Session API response:', response.status, responseData);

          const storedToken = sessionStorage.getItem('google_access_token');
          if (storedToken) {
            setAccessToken(storedToken);
          }
        } catch (error) {
            console.error("Failed to set session cookie", error);
            // If session fails, sign the user out to prevent an inconsistent state
            if (firebaseServices) {
                await signOut(firebaseServices.auth);
            }
        }
      } else {
        console.log('User logged out. Deleting session cookie...');
        await fetch('/api/auth/session', { method: 'DELETE' });
        console.log('Delete session call complete.');
      }
      
      // Now that session management is complete, we can handle routing.
      setIsLoading(false);
    };
    handleAuthChange(user);
  }, [user, firebaseServices]);


  useEffect(() => {
    if (!isLoading && pathname) {
      const isPublicPath = publicPaths.includes(pathname);
      const isMarketingPath = marketingPaths.some(p => pathname.startsWith(p)) || pathname === '/';
      
      console.log(`Routing check: isLoading=${isLoading}, user=${!!user}, pathname=${pathname}, isPublic=${isPublicPath}, isMarketing=${isMarketingPath}`);

      if (!user && !isPublicPath && !isMarketingPath) {
        console.log('Redirecting to /login');
        router.push('/login');
      } 
      else if (user && isPublicPath) {
        console.log('Redirecting to /action-manager');
        router.push('/action-manager');
      }
    }
  }, [user, isLoading, pathname, router]);

  const logout = async () => {
    if (firebaseServices) {
      await signOut(firebaseServices.auth);
      // The onAuthStateChanged listener will handle the session deletion and redirect.
    }
  };
  
  if (initializationError) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-red-100 p-4 text-center text-red-800">
        <h1 className="mb-4 text-2xl font-bold">Firebase Initialization Error</h1>
        <p className="mb-2">{initializationError}</p>
        <p>Please check your Firebase configuration in your project's environment variables and ensure all required values are set correctly.</p>
      </div>
    );
  }

  // Use a single loading screen until Firebase is initialized and the first auth check is complete.
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const value = { user, isLoading, accessToken, firebaseServices, logout };

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
