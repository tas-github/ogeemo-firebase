
'use client';

import type { User } from 'firebase/auth';
import React, { createContext, useState, useContext, ReactNode } from 'react';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  setAuthInfo: (user: User | null, token: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const setAuthInfo = (newUser: User | null, newToken: string | null) => {
    setUser(newUser);
    setAccessToken(newToken);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, setAuthInfo }}>
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
